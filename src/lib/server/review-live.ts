import { CATEGORIES, emptyObservationRowsForCategory } from '$lib/constants';
import { createFullTestingItems, withMandatoryOwners } from '$lib/features/testing/checklist';
import type { CategorySession, TestingDecision, TestingItem } from '$lib/types';
import { and, eq } from 'drizzle-orm';
import { generateIdFromEntropySize } from 'lucia';
import { broadcastToProject, broadcastToRole, broadcastToUser } from '../../../socket-setup.mjs';
import { getDb } from './db';
import {
	codeReviewObservationProgress,
	codeReviewThreadMessage,
	project,
	testingItemProgress,
	testingThreadMessage
} from './db/schema';
import { parseCodeReviewSavePayload } from './code-review-payload';
import {
	categoryAssigneeMapFromPair,
	getPairForProject,
	getProjectById,
	listCodeReviewObservationProgressForProject,
	listCodeReviewThreadMessagesForProject,
	listTestingItemProgressForProject,
	listTestingThreadMessagesForProject,
	reviewPersonaForUser
} from './review-workspace';

export const SUBMISSION_PROGRESS_VALUES = [
	'awaiting_repo',
	'repo_submitted',
	'testing',
	'testing_passed',
	'code_review_passed',
	'completed'
] as const;
export type SubmissionProgress = (typeof SUBMISSION_PROGRESS_VALUES)[number];

export function notifyProjectReviewUpdate(projectId: string) {
	console.info('[realtime-server] notifyProjectReviewUpdate', projectId.slice(0, 8) + '…');
	broadcastToProject(projectId, 'review:invalidate', { projectId });
	void dispatchWorkspaceInvalidateForProject(projectId);
}

/** Submitter + assigned reviewers (user rooms) so people who are not in a project socket room still refetch. */
async function dispatchWorkspaceInvalidateForProject(projectId: string) {
	const p = await getProjectById(projectId);
	if (!p) {
		console.warn('[realtime-server] dispatchWorkspaceInvalidateForProject: no project', projectId);
		return;
	}
	const pair = await getPairForProject(projectId);
	const ids = new Set([p.submitterId]);
	if (pair) {
		ids.add(pair.reviewerAId);
		ids.add(pair.reviewerBId);
	}
	console.info(
		'[realtime-server] workspace:invalidate → user rooms',
		ids.size,
		Array.from(ids).map((id) => id.slice(0, 8) + '…')
	);
	for (const id of ids) {
		broadcastToUser(id, 'workspace:invalidate', { projectId });
	}
}

/** Call when any project list or global admin state may have changed. */
export function notifyAdminDashboard() {
	console.info('[realtime-server] notifyAdminDashboard');
	broadcastToRole('admin', 'workspace:invalidate', {});
}

async function testingMandatoryAllAccepted(projectId: string): Promise<boolean> {
	const template = withMandatoryOwners(createFullTestingItems());
	const mandatory = template.filter((t) => t.section === 'mandatory');
	const rows = await listTestingItemProgressForProject(projectId);
	const byId = new Map(rows.map((r) => [r.itemId, r]));
	for (const t of mandatory) {
		const owner = t.mandatoryOwner;
		if (!owner) return false;
		const r = byId.get(t.id);
		if (!r) return false;
		const v = owner === 'jane' ? r.janeVerdict : r.joeVerdict;
		if (v !== 'accept') return false;
	}
	return true;
}

async function codeReviewAllAccepted(projectId: string): Promise<boolean> {
	const pair = await getPairForProject(projectId);
	const rows = await listCodeReviewObservationProgressForProject(projectId);
	const byKey = new Map(rows.map((r) => [`${r.categoryId}:${r.observationId}`, r]));
	const catMap = pair ? categoryAssigneeMapFromPair(pair) : {};
	for (const cat of CATEGORIES) {
		const assignee = catMap[cat.id] ?? cat.assignee;
		for (const o of cat.observations) {
			const r = byKey.get(`${cat.id}:${o.id}`);
			const v = assignee === 'jane' ? r?.janeVerdict : r?.joeVerdict;
			if (v !== 'accept') return false;
		}
	}
	return true;
}

export async function deriveSubmissionProgress(projectId: string): Promise<SubmissionProgress> {
	const p = await getProjectById(projectId);
	if (!p) return 'awaiting_repo';
	if (p.status === 'completed') return 'completed';
	const pair = await getPairForProject(projectId);
	if (p.status === 'awaiting_link') return 'awaiting_repo';
	if (!pair && p.status === 'repo_submitted') return 'repo_submitted';
	if (pair && (await codeReviewAllAccepted(projectId))) return 'code_review_passed';
	if (pair && (await testingMandatoryAllAccepted(projectId))) return 'testing_passed';
	if (pair || p.status === 'review_active') return 'testing';
	return 'repo_submitted';
}

export async function recomputeAndPersistSubmissionProgress(projectId: string) {
	const next = await deriveSubmissionProgress(projectId);
	await getDb()
		.update(project)
		.set({ submissionProgress: next, updatedAt: Date.now() })
		.where(eq(project.id, projectId));
}

function parseTestingPrev(json: string | null): { testingRound: number; byId: Map<string, TestingItem> } {
	const byId = new Map<string, TestingItem>();
	let round = 1;
	if (!json) return { testingRound: round, byId };
	try {
		const doc = JSON.parse(json) as { testingRound?: number; testingItems?: TestingItem[] };
		if (typeof doc.testingRound === 'number' && doc.testingRound >= 1) round = doc.testingRound;
		for (const t of doc.testingItems ?? []) {
			if (t && typeof (t as TestingItem).id === 'string') byId.set((t as TestingItem).id, t as TestingItem);
		}
	} catch {
		/* ignore */
	}
	return { testingRound: round, byId };
}

export async function buildTestingSnapshotJson(projectId: string, previousJson: string | null): Promise<string> {
	const { testingRound: prevRound, byId: prevById } = parseTestingPrev(previousJson);
	const template = withMandatoryOwners(createFullTestingItems());
	const progress = await listTestingItemProgressForProject(projectId);
	const progById = new Map(progress.map((r) => [r.itemId, r]));
	const msgs = await listTestingThreadMessagesForProject(projectId);
	const msgsByItem = new Map<string, (typeof msgs)[number][]>();
	for (const m of msgs) {
		const list = msgsByItem.get(m.itemId) ?? [];
		list.push(m);
		msgsByItem.set(m.itemId, list);
	}
	let testingRound = prevRound;
	const testingItems = template.map((def) => {
		const p = progById.get(def.id);
		const prev = prevById.get(def.id);
		const comments = (msgsByItem.get(def.id) ?? [])
			.slice()
			.sort((a, b) => a.postedAt - b.postedAt || a.id.localeCompare(b.id))
			.map((m) => ({
				id: m.id,
				round: m.round,
				author: m.authorPersona as 'jane' | 'joe' | 'sandra',
				text: m.body,
				at: new Date(m.postedAt).toISOString()
			}));
		const jane = (p?.janeVerdict ?? def.jane) as TestingDecision;
		const joe = (p?.joeVerdict ?? def.joe) as TestingDecision;
		const owner = (p?.mandatoryOwner ?? def.mandatoryOwner) as 'jane' | 'joe' | undefined;
		if (p) testingRound = Math.max(testingRound, p.testingRound);
		return {
			...def,
			mandatoryOwner: def.section === 'mandatory' ? owner : undefined,
			jane,
			joe,
			verdictHistory:
				prev?.verdictHistory && Array.isArray(prev.verdictHistory) ? [...prev.verdictHistory] : [],
			comments,
			drafts: prev?.drafts && typeof prev.drafts === 'object' ? { ...prev.drafts } : {}
		} satisfies TestingItem;
	});
	return JSON.stringify({ testingRound, testingItems });
}

function emptyCategorySessions(): Record<string, CategorySession> {
	const m: Record<string, CategorySession> = {};
	for (const c of CATEGORIES) {
		m[c.id] = { categoryId: c.id, observationRows: emptyObservationRowsForCategory(c.id) };
	}
	return m;
}

export async function buildCodeReviewSnapshotJson(
	projectId: string,
	previousJson: string | null
): Promise<string> {
	const parsed = previousJson ? parseCodeReviewSavePayload(previousJson) : null;
	let codeReviewRound = parsed?.codeReviewRound ?? 1;
	const prevSessions = parsed?.sessions;
	const sessions = emptyCategorySessions();
	for (const cat of CATEGORIES) {
		const prevCat = prevSessions?.[cat.id];
		for (const o of cat.observations) {
			const base = sessions[cat.id].observationRows[o.id];
			const prevRow = prevCat?.observationRows?.[o.id];
			sessions[cat.id].observationRows[o.id] = {
				jane: prevRow?.jane ?? base.jane,
				joe: prevRow?.joe ?? base.joe,
				comments: [],
				drafts: prevRow?.drafts && typeof prevRow.drafts === 'object' ? { ...prevRow.drafts } : {},
				verdictHistory:
					prevRow?.verdictHistory && Array.isArray(prevRow.verdictHistory)
						? [...prevRow.verdictHistory]
						: []
			};
		}
	}
	const prog = await listCodeReviewObservationProgressForProject(projectId);
	const msgs = await listCodeReviewThreadMessagesForProject(projectId);
	for (const r of prog) {
		codeReviewRound = Math.max(codeReviewRound, r.codeReviewRound);
		const row = sessions[r.categoryId]?.observationRows[r.observationId];
		if (row) {
			row.jane = r.janeVerdict as TestingDecision;
			row.joe = r.joeVerdict as TestingDecision;
		}
	}
	const msgsByKey = new Map<string, (typeof msgs)[number][]>();
	for (const m of msgs) {
		const k = `${m.categoryId}:${m.observationId}`;
		const list = msgsByKey.get(k) ?? [];
		list.push(m);
		msgsByKey.set(k, list);
	}
	for (const cat of CATEGORIES) {
		for (const o of cat.observations) {
			const row = sessions[cat.id].observationRows[o.id];
			const list = msgsByKey.get(`${cat.id}:${o.id}`) ?? [];
			row.comments = list
				.slice()
				.sort((a, b) => a.postedAt - b.postedAt || a.id.localeCompare(b.id))
				.map((m) => ({
					id: m.id,
					round: m.round,
					author: m.authorPersona as 'jane' | 'joe' | 'sandra',
					text: m.body,
					at: new Date(m.postedAt).toISOString()
				}));
		}
	}
	let standup: unknown;
	try {
		const raw = previousJson ? (JSON.parse(previousJson) as Record<string, unknown>) : null;
		if (raw?.standup && typeof raw.standup === 'object') standup = raw.standup;
	} catch {
		/* ignore */
	}
	const payload: Record<string, unknown> = {
		version: 1 as const,
		codeReviewRound,
		categorySessions: sessions
	};
	if (standup !== undefined) payload.standup = standup;
	return JSON.stringify(payload);
}

export async function refreshProjectReviewSnapshotsFromRelational(projectId: string) {
	const p = await getProjectById(projectId);
	if (!p) return;
	const testingJson = await buildTestingSnapshotJson(projectId, p.testingJson);
	const codeReviewJson = await buildCodeReviewSnapshotJson(projectId, p.codeReviewJson);
	await getDb()
		.update(project)
		.set({ testingJson, codeReviewJson, updatedAt: Date.now() })
		.where(eq(project.id, projectId));
}

function assertLivePersona(
	pair: Awaited<ReturnType<typeof getPairForProject>>,
	p: NonNullable<Awaited<ReturnType<typeof getProjectById>>>,
	userId: string,
	role: string,
	declared: string
): 'sandra' | 'jane' | 'joe' | null {
	const persona = reviewPersonaForUser(pair, userId, p.submitterId);
	if (!persona) return null;
	if (persona !== declared) return null;
	if (role === 'submitter' && persona !== 'sandra') return null;
	if (role === 'reviewer' && persona === 'sandra') return null;
	if (role === 'reviewer' && !pair) return null;
	return persona;
}

export async function appendTestingMessageLive(params: {
	projectId: string;
	userId: string;
	role: string;
	itemId: string;
	authorPersona: string;
	body: string;
	round: number;
}) {
	const { projectId, userId, role, itemId, authorPersona, body, round } = params;
	const [p, pair] = await Promise.all([getProjectById(projectId), getPairForProject(projectId)]);
	if (!p) return { ok: false as const, error: 'Forbidden' };
	const persona = assertLivePersona(pair, p, userId, role, authorPersona);
	if (!persona) return { ok: false as const, error: 'Forbidden' };
	const template = withMandatoryOwners(createFullTestingItems());
	if (!template.some((t) => t.id === itemId)) return { ok: false as const, error: 'Unknown item' };
	const trimmed = body.trim();
	if (!trimmed) return { ok: false as const, error: 'Empty body' };
	const db = getDb();
	const now = Date.now();
	await db.insert(testingThreadMessage).values({
		id: generateIdFromEntropySize(16),
		projectId,
		itemId,
		round: Number.isFinite(round) && round >= 0 ? round : 0,
		authorPersona: persona,
		body: trimmed,
		postedAt: now,
		authorUserId: userId
	});
	await refreshProjectReviewSnapshotsFromRelational(projectId);
	await recomputeAndPersistSubmissionProgress(projectId);
	return { ok: true as const };
}

export async function setTestingVerdictLive(params: {
	projectId: string;
	userId: string;
	role: string;
	persona: 'jane' | 'joe';
	itemId: string;
	verdict: 'accept' | 'decline';
	testingRound: number;
}) {
	const { projectId, userId, role, persona, itemId, verdict, testingRound } = params;
	const [p, pair] = await Promise.all([getProjectById(projectId), getPairForProject(projectId)]);
	if (!p) return { ok: false as const, error: 'Forbidden' };
	const eff = assertLivePersona(pair, p, userId, role, persona);
	if (eff !== persona) return { ok: false as const, error: 'Forbidden' };
	const template = withMandatoryOwners(createFullTestingItems());
	const item = template.find((t) => t.id === itemId);
	if (!item) return { ok: false as const, error: 'Unknown item' };
	if (item.section === 'mandatory' && item.mandatoryOwner && item.mandatoryOwner !== persona) {
		return { ok: false as const, error: 'Not assigned reviewer for this row' };
	}
	const db = getDb();
	const now = Date.now();
	const existingRows = await db
		.select()
		.from(testingItemProgress)
		.where(and(eq(testingItemProgress.projectId, projectId), eq(testingItemProgress.itemId, itemId)))
		.limit(1);
	const existing = existingRows[0];
	const jane = (existing?.janeVerdict ?? 'pending') as string;
	const joe = (existing?.joeVerdict ?? 'pending') as string;
	const nextJane = persona === 'jane' ? verdict : jane;
	const nextJoe = persona === 'joe' ? verdict : joe;
	const tr =
		existing?.testingRound != null
			? Math.max(existing.testingRound, testingRound >= 1 ? testingRound : 1)
			: testingRound >= 1
				? testingRound
				: 1;
	if (existing) {
		await db
			.update(testingItemProgress)
			.set({
				janeVerdict: nextJane,
				joeVerdict: nextJoe,
				testingRound: tr,
				updatedAt: now
			})
			.where(and(eq(testingItemProgress.projectId, projectId), eq(testingItemProgress.itemId, itemId)));
	} else {
		await db.insert(testingItemProgress).values({
			projectId,
			itemId,
			section: item.section,
			itemSummary: item.text.slice(0, 500),
			mandatoryOwner: item.mandatoryOwner ?? null,
			janeVerdict: nextJane,
			joeVerdict: nextJoe,
			testingRound: tr,
			updatedAt: now
		});
	}
	await refreshProjectReviewSnapshotsFromRelational(projectId);
	await recomputeAndPersistSubmissionProgress(projectId);
	return { ok: true as const };
}

export async function appendCodeReviewMessageLive(params: {
	projectId: string;
	userId: string;
	role: string;
	categoryId: string;
	observationId: string;
	authorPersona: string;
	body: string;
	round: number;
}) {
	const { projectId, userId, role, categoryId, observationId, authorPersona, body, round } = params;
	const [p, pair] = await Promise.all([getProjectById(projectId), getPairForProject(projectId)]);
	if (!p) return { ok: false as const, error: 'Forbidden' };
	const persona = assertLivePersona(pair, p, userId, role, authorPersona);
	if (!persona) return { ok: false as const, error: 'Forbidden' };
	const cat = CATEGORIES.find((c) => c.id === categoryId);
	if (!cat || !cat.observations.some((o) => o.id === observationId)) {
		return { ok: false as const, error: 'Unknown observation' };
	}
	const trimmed = body.trim();
	if (!trimmed) return { ok: false as const, error: 'Empty body' };
	const db = getDb();
	const now = Date.now();
	await db.insert(codeReviewThreadMessage).values({
		id: generateIdFromEntropySize(16),
		projectId,
		categoryId,
		observationId,
		round: Number.isFinite(round) && round >= 0 ? round : 0,
		authorPersona: persona,
		body: trimmed,
		postedAt: now,
		authorUserId: userId
	});
	await refreshProjectReviewSnapshotsFromRelational(projectId);
	await recomputeAndPersistSubmissionProgress(projectId);
	return { ok: true as const };
}

export async function setCodeReviewVerdictLive(params: {
	projectId: string;
	userId: string;
	role: string;
	persona: 'jane' | 'joe';
	categoryId: string;
	observationId: string;
	verdict: 'accept' | 'decline';
	codeReviewRound: number;
}) {
	const { projectId, userId, role, persona, categoryId, observationId, verdict, codeReviewRound } = params;
	const [p, pair] = await Promise.all([getProjectById(projectId), getPairForProject(projectId)]);
	if (!p) return { ok: false as const, error: 'Forbidden' };
	const eff = assertLivePersona(pair, p, userId, role, persona);
	if (eff !== persona) return { ok: false as const, error: 'Forbidden' };
	const catMap = pair ? categoryAssigneeMapFromPair(pair) : {};
	const assignee = catMap[categoryId] ?? CATEGORIES.find((c) => c.id === categoryId)?.assignee;
	if (assignee !== persona) return { ok: false as const, error: 'Not assignee for category' };
	const cat = CATEGORIES.find((c) => c.id === categoryId);
	if (!cat || !cat.observations.some((o) => o.id === observationId)) {
		return { ok: false as const, error: 'Unknown observation' };
	}
	const db = getDb();
	const now = Date.now();
	const existingRows = await db
		.select()
		.from(codeReviewObservationProgress)
		.where(
			and(
				eq(codeReviewObservationProgress.projectId, projectId),
				eq(codeReviewObservationProgress.categoryId, categoryId),
				eq(codeReviewObservationProgress.observationId, observationId)
			)
		)
		.limit(1);
	const existing = existingRows[0];
	const jane = (existing?.janeVerdict ?? 'pending') as string;
	const joe = (existing?.joeVerdict ?? 'pending') as string;
	const nextJane = persona === 'jane' ? verdict : jane;
	const nextJoe = persona === 'joe' ? verdict : joe;
	const cr =
		existing?.codeReviewRound != null
			? Math.max(existing.codeReviewRound, codeReviewRound >= 1 ? codeReviewRound : 1)
			: codeReviewRound >= 1
				? codeReviewRound
				: 1;
	if (existing) {
		await db
			.update(codeReviewObservationProgress)
			.set({
				janeVerdict: nextJane,
				joeVerdict: nextJoe,
				codeReviewRound: cr,
				updatedAt: now
			})
			.where(
				and(
					eq(codeReviewObservationProgress.projectId, projectId),
					eq(codeReviewObservationProgress.categoryId, categoryId),
					eq(codeReviewObservationProgress.observationId, observationId)
				)
			);
	} else {
		await db.insert(codeReviewObservationProgress).values({
			projectId,
			categoryId,
			observationId,
			janeVerdict: nextJane,
			joeVerdict: nextJoe,
			codeReviewRound: cr,
			updatedAt: now
		});
	}
	await refreshProjectReviewSnapshotsFromRelational(projectId);
	await recomputeAndPersistSubmissionProgress(projectId);
	return { ok: true as const };
}
