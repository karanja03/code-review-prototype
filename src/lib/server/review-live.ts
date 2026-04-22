import { CATEGORIES, emptyObservationRowsForCategory } from '$lib/constants';
import { createFullTestingItems, withMandatoryOwners } from '$lib/features/testing/checklist';
import type { CategorySession, TestingDecision, TestingItem } from '$lib/types';
import { and, eq } from 'drizzle-orm';
import { generateIdFromEntropySize } from 'lucia';
import { broadcastToProject } from '../../../socket-setup.mjs';
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
	broadcastToProject(projectId, 'review:invalidate', { projectId });
}

function testingMandatoryAllAccepted(projectId: string): boolean {
	const template = withMandatoryOwners(createFullTestingItems());
	const mandatory = template.filter((t) => t.section === 'mandatory');
	const rows = listTestingItemProgressForProject(projectId);
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

function codeReviewAllAccepted(projectId: string): boolean {
	const pair = getPairForProject(projectId);
	const rows = listCodeReviewObservationProgressForProject(projectId);
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

export function deriveSubmissionProgress(projectId: string): SubmissionProgress {
	const p = getProjectById(projectId);
	if (!p) return 'awaiting_repo';
	if (p.status === 'completed') return 'completed';
	const pair = getPairForProject(projectId);
	if (p.status === 'awaiting_link') return 'awaiting_repo';
	if (!pair && p.status === 'repo_submitted') return 'repo_submitted';
	if (pair && codeReviewAllAccepted(projectId)) return 'code_review_passed';
	if (pair && testingMandatoryAllAccepted(projectId)) return 'testing_passed';
	if (pair || p.status === 'review_active') return 'testing';
	return 'repo_submitted';
}

export function recomputeAndPersistSubmissionProgress(projectId: string) {
	const next = deriveSubmissionProgress(projectId);
	getDb()
		.update(project)
		.set({ submissionProgress: next, updatedAt: Date.now() })
		.where(eq(project.id, projectId))
		.run();
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

export function buildTestingSnapshotJson(projectId: string, previousJson: string | null): string {
	const { testingRound: prevRound, byId: prevById } = parseTestingPrev(previousJson);
	const template = withMandatoryOwners(createFullTestingItems());
	const progress = listTestingItemProgressForProject(projectId);
	const progById = new Map(progress.map((r) => [r.itemId, r]));
	const msgs = listTestingThreadMessagesForProject(projectId);
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

export function buildCodeReviewSnapshotJson(projectId: string, previousJson: string | null): string {
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
	const prog = listCodeReviewObservationProgressForProject(projectId);
	const msgs = listCodeReviewThreadMessagesForProject(projectId);
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

export function refreshProjectReviewSnapshotsFromRelational(projectId: string) {
	const p = getProjectById(projectId);
	if (!p) return;
	const testingJson = buildTestingSnapshotJson(projectId, p.testingJson);
	const codeReviewJson = buildCodeReviewSnapshotJson(projectId, p.codeReviewJson);
	getDb()
		.update(project)
		.set({ testingJson, codeReviewJson, updatedAt: Date.now() })
		.where(eq(project.id, projectId))
		.run();
}

function assertLivePersona(
	projectId: string,
	userId: string,
	role: string,
	declared: string
): 'sandra' | 'jane' | 'joe' | null {
	const p = getProjectById(projectId);
	if (!p) return null;
	const pair = getPairForProject(projectId);
	const persona = reviewPersonaForUser(pair, userId, p.submitterId);
	if (!persona) return null;
	if (persona !== declared) return null;
	if (role === 'submitter' && persona !== 'sandra') return null;
	if (role === 'reviewer' && persona === 'sandra') return null;
	if (role === 'reviewer' && !pair) return null;
	return persona;
}

export function appendTestingMessageLive(params: {
	projectId: string;
	userId: string;
	role: string;
	itemId: string;
	authorPersona: string;
	body: string;
	round: number;
}) {
	const { projectId, userId, role, itemId, authorPersona, body, round } = params;
	const persona = assertLivePersona(projectId, userId, role, authorPersona);
	if (!persona) return { ok: false as const, error: 'Forbidden' };
	const template = withMandatoryOwners(createFullTestingItems());
	if (!template.some((t) => t.id === itemId)) return { ok: false as const, error: 'Unknown item' };
	const trimmed = body.trim();
	if (!trimmed) return { ok: false as const, error: 'Empty body' };
	const db = getDb();
	const now = Date.now();
	db.insert(testingThreadMessage)
		.values({
			id: generateIdFromEntropySize(16),
			projectId,
			itemId,
			round: Number.isFinite(round) && round >= 0 ? round : 0,
			authorPersona: persona,
			body: trimmed,
			postedAt: now,
			authorUserId: userId
		})
		.run();
	refreshProjectReviewSnapshotsFromRelational(projectId);
	recomputeAndPersistSubmissionProgress(projectId);
	return { ok: true as const };
}

export function setTestingVerdictLive(params: {
	projectId: string;
	userId: string;
	role: string;
	persona: 'jane' | 'joe';
	itemId: string;
	verdict: 'accept' | 'decline';
	testingRound: number;
}) {
	const { projectId, userId, role, persona, itemId, verdict, testingRound } = params;
	const eff = assertLivePersona(projectId, userId, role, persona);
	if (eff !== persona) return { ok: false as const, error: 'Forbidden' };
	const template = withMandatoryOwners(createFullTestingItems());
	const item = template.find((t) => t.id === itemId);
	if (!item) return { ok: false as const, error: 'Unknown item' };
	if (item.section === 'mandatory' && item.mandatoryOwner && item.mandatoryOwner !== persona) {
		return { ok: false as const, error: 'Not assigned reviewer for this row' };
	}
	const db = getDb();
	const now = Date.now();
	const existing = db
		.select()
		.from(testingItemProgress)
		.where(and(eq(testingItemProgress.projectId, projectId), eq(testingItemProgress.itemId, itemId)))
		.limit(1)
		.all()[0];
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
		db.update(testingItemProgress)
			.set({
				janeVerdict: nextJane,
				joeVerdict: nextJoe,
				testingRound: tr,
				updatedAt: now
			})
			.where(and(eq(testingItemProgress.projectId, projectId), eq(testingItemProgress.itemId, itemId)))
			.run();
	} else {
		db.insert(testingItemProgress)
			.values({
				projectId,
				itemId,
				section: item.section,
				itemSummary: item.text.slice(0, 500),
				mandatoryOwner: item.mandatoryOwner ?? null,
				janeVerdict: nextJane,
				joeVerdict: nextJoe,
				testingRound: tr,
				updatedAt: now
			})
			.run();
	}
	refreshProjectReviewSnapshotsFromRelational(projectId);
	recomputeAndPersistSubmissionProgress(projectId);
	return { ok: true as const };
}

export function appendCodeReviewMessageLive(params: {
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
	const persona = assertLivePersona(projectId, userId, role, authorPersona);
	if (!persona) return { ok: false as const, error: 'Forbidden' };
	const cat = CATEGORIES.find((c) => c.id === categoryId);
	if (!cat || !cat.observations.some((o) => o.id === observationId)) {
		return { ok: false as const, error: 'Unknown observation' };
	}
	const trimmed = body.trim();
	if (!trimmed) return { ok: false as const, error: 'Empty body' };
	const db = getDb();
	const now = Date.now();
	db.insert(codeReviewThreadMessage)
		.values({
			id: generateIdFromEntropySize(16),
			projectId,
			categoryId,
			observationId,
			round: Number.isFinite(round) && round >= 0 ? round : 0,
			authorPersona: persona,
			body: trimmed,
			postedAt: now,
			authorUserId: userId
		})
		.run();
	refreshProjectReviewSnapshotsFromRelational(projectId);
	recomputeAndPersistSubmissionProgress(projectId);
	return { ok: true as const };
}

export function setCodeReviewVerdictLive(params: {
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
	const eff = assertLivePersona(projectId, userId, role, persona);
	if (eff !== persona) return { ok: false as const, error: 'Forbidden' };
	const pair = getPairForProject(projectId);
	const catMap = pair ? categoryAssigneeMapFromPair(pair) : {};
	const assignee = catMap[categoryId] ?? CATEGORIES.find((c) => c.id === categoryId)?.assignee;
	if (assignee !== persona) return { ok: false as const, error: 'Not assignee for category' };
	const cat = CATEGORIES.find((c) => c.id === categoryId);
	if (!cat || !cat.observations.some((o) => o.id === observationId)) {
		return { ok: false as const, error: 'Unknown observation' };
	}
	const db = getDb();
	const now = Date.now();
	const existing = db
		.select()
		.from(codeReviewObservationProgress)
		.where(
			and(
				eq(codeReviewObservationProgress.projectId, projectId),
				eq(codeReviewObservationProgress.categoryId, categoryId),
				eq(codeReviewObservationProgress.observationId, observationId)
			)
		)
		.limit(1)
		.all()[0];
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
		db.update(codeReviewObservationProgress)
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
			)
			.run();
	} else {
		db.insert(codeReviewObservationProgress)
			.values({
				projectId,
				categoryId,
				observationId,
				janeVerdict: nextJane,
				joeVerdict: nextJoe,
				codeReviewRound: cr,
				updatedAt: now
			})
			.run();
	}
	refreshProjectReviewSnapshotsFromRelational(projectId);
	recomputeAndPersistSubmissionProgress(projectId);
	return { ok: true as const };
}
