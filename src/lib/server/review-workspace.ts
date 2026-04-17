import { CATEGORIES } from '$lib/constants';
import type { CategorySession, TestingItem } from '$lib/types';
import { parseCodeReviewSavePayload } from './code-review-payload';
import { and, asc, desc, eq, ne, or } from 'drizzle-orm';
import { generateIdFromEntropySize } from 'lucia';
import { getDb } from './db';
import {
	codeReviewObservationProgress,
	codeReviewThreadMessage,
	project,
	reviewPair,
	testingItemProgress,
	testingThreadMessage,
	user,
	type ReviewPairRow
} from './db/schema';

export const PROJECT_STATUSES = ['awaiting_link', 'repo_submitted', 'review_active', 'completed'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export function isProjectStatus(s: string): s is ProjectStatus {
	return (PROJECT_STATUSES as readonly string[]).includes(s);
}

export const DEFAULT_PROJECT_INSTRUCTIONS =
	'Complete the sprint task per course instructions, push your work to Gitea, then paste the repository URL here. Paired reviewers will use this link for the structured code review.';

export const DEFAULT_CATEGORIES_A_JSON = JSON.stringify(['security', 'correctness']);
export const DEFAULT_CATEGORIES_B_JSON = JSON.stringify(['performance', 'structure_architecture']);

export function countSubmitters(): number {
	return getDb()
		.select({ id: user.id })
		.from(user)
		.where(eq(user.role, 'submitter'))
		.all().length;
}

export function ensureActiveProjectForSubmitter(submitterId: string) {
	const db = getDb();
	const rows = db
		.select()
		.from(project)
		.where(and(eq(project.submitterId, submitterId), ne(project.status, 'completed')))
		.orderBy(desc(project.createdAt))
		.limit(1)
		.all();
	if (rows.length > 0) return rows[0];

	const now = Date.now();
	const id = generateIdFromEntropySize(16);
	const row = {
		id,
		submitterId,
		instructions: DEFAULT_PROJECT_INSTRUCTIONS,
		giteaUrl: null as string | null,
		status: 'awaiting_link' as ProjectStatus,
		testingJson: null as string | null,
		codeReviewJson: null as string | null,
		submissionProgress: 'awaiting_repo' as const,
		createdAt: now,
		updatedAt: now
	};
	db.insert(project).values(row).run();
	return row;
}

export function submitProjectRepoUrl(projectId: string, submitterId: string, giteaUrl: string) {
	const db = getDb();
	const trimmed = giteaUrl.trim();
	if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
		return { ok: false as const, error: 'URL must start with http:// or https://' };
	}
	const rows = db
		.select()
		.from(project)
		.where(and(eq(project.id, projectId), eq(project.submitterId, submitterId)))
		.limit(1)
		.all();
	if (!rows[0]) return { ok: false as const, error: 'Project not found' };
	const p = rows[0];
	if (p.status === 'completed') return { ok: false as const, error: 'Project already completed' };
	const now = Date.now();
	db.update(project)
		.set({
			giteaUrl: trimmed,
			status: 'repo_submitted',
			submissionProgress: 'repo_submitted',
			updatedAt: now
		})
		.where(eq(project.id, projectId))
		.run();
	return { ok: true as const };
}

export function getPairForProject(projectId: string) {
	const rows = getDb()
		.select()
		.from(reviewPair)
		.where(eq(reviewPair.projectId, projectId))
		.limit(1)
		.all();
	return rows[0] ?? null;
}

export function getReviewerPairRow(reviewerId: string) {
	const db = getDb();
	const rows = db
		.select()
		.from(reviewPair)
		.where(or(eq(reviewPair.reviewerAId, reviewerId), eq(reviewPair.reviewerBId, reviewerId)))
		.all();
	const active = rows
		.filter((p) => {
			const proj = getProjectById(p.projectId);
			return proj && proj.status !== 'completed';
		})
		.sort((a, b) => b.createdAt - a.createdAt);
	return active[0] ?? null;
}

export function getProjectById(projectId: string) {
	const rows = getDb().select().from(project).where(eq(project.id, projectId)).limit(1).all();
	return rows[0] ?? null;
}

export function userPublicRow(userId: string) {
	const rows = getDb()
		.select({ id: user.id, username: user.username, email: user.email, role: user.role })
		.from(user)
		.where(eq(user.id, userId))
		.limit(1)
		.all();
	return rows[0] ?? null;
}

/** Reviewer A ↔ prototype “jane”; reviewer B ↔ “joe”; submitter ↔ “sandra”. */
export type ReviewRoomLabels = {
	submitterUsername: string;
	reviewerAUsername: string;
	reviewerBUsername: string;
};

export function reviewRoomDisplayLabels(submitterId: string, pair: ReviewPairRow): ReviewRoomLabels {
	const sub = userPublicRow(submitterId);
	const a = userPublicRow(pair.reviewerAId);
	const b = userPublicRow(pair.reviewerBId);
	return {
		submitterUsername: sub?.username ?? 'Submitter',
		reviewerAUsername: a?.username ?? 'Reviewer A',
		reviewerBUsername: b?.username ?? 'Reviewer B'
	};
}

export function listUsersForAdmin() {
	return getDb()
		.select({ id: user.id, username: user.username, email: user.email, role: user.role })
		.from(user)
		.orderBy(asc(user.username))
		.all();
}

export function listProjectsWithSubmittersForAdmin() {
	return getDb()
		.select({
			id: project.id,
			status: project.status,
			giteaUrl: project.giteaUrl,
			createdAt: project.createdAt,
			submitterUsername: user.username,
			submitterEmail: user.email
		})
		.from(project)
		.innerJoin(user, eq(project.submitterId, user.id))
		.orderBy(desc(project.createdAt))
		.all();
}

export function assignReviewPair(params: {
	projectId: string;
	reviewerAId: string;
	reviewerBId: string;
	adminId: string;
	categoriesAJson?: string;
	categoriesBJson?: string;
}) {
	const { projectId, reviewerAId, reviewerBId, adminId } = params;
	if (reviewerAId === reviewerBId) return { ok: false as const, error: 'Pick two different reviewers' };

	const db = getDb();
	const a = userPublicRow(reviewerAId);
	const b = userPublicRow(reviewerBId);
	if (!a || a.role !== 'reviewer') return { ok: false as const, error: 'Reviewer A must be a reviewer account' };
	if (!b || b.role !== 'reviewer') return { ok: false as const, error: 'Reviewer B must be a reviewer account' };

	const p = getProjectById(projectId);
	if (!p) return { ok: false as const, error: 'Project not found' };
	if (p.status !== 'repo_submitted') {
		return { ok: false as const, error: 'Project must have a submitted repo (status repo_submitted) before pairing' };
	}
	if (getPairForProject(projectId)) return { ok: false as const, error: 'This project already has a reviewer pair' };

	const now = Date.now();
	const id = generateIdFromEntropySize(16);
	db.insert(reviewPair)
		.values({
			id,
			projectId,
			reviewerAId,
			reviewerBId,
			categoriesAJson: params.categoriesAJson ?? DEFAULT_CATEGORIES_A_JSON,
			categoriesBJson: params.categoriesBJson ?? DEFAULT_CATEGORIES_B_JSON,
			createdById: adminId,
			createdAt: now
		})
		.run();

	db.update(project)
		.set({ status: 'review_active', submissionProgress: 'testing', updatedAt: now })
		.where(eq(project.id, projectId))
		.run();

	return { ok: true as const };
}

export function markProjectCompleted(projectId: string) {
	const now = Date.now();
	getDb()
		.update(project)
		.set({ status: 'completed', submissionProgress: 'completed', updatedAt: now })
		.where(eq(project.id, projectId))
		.run();
}

/** Persists prototype Testing + Code review sprint state (threads, verdicts, rounds). */
export function saveProjectReviewWorkspace(projectId: string, testingJson: string, codeReviewJson: string) {
	const now = Date.now();
	getDb()
		.update(project)
		.set({ testingJson, codeReviewJson, updatedAt: now })
		.where(eq(project.id, projectId))
		.run();
	try {
		syncReviewRelationalTablesFromPayload(projectId, testingJson, codeReviewJson);
	} catch (e) {
		console.error('[review-workspace] syncReviewRelationalTablesFromPayload', e);
	}
}

export { parseCodeReviewSavePayload } from './code-review-payload';

function syncReviewRelationalTablesFromPayload(
	projectId: string,
	testingJson: string,
	codeReviewJson: string
) {
	const db = getDb();
	const now = Date.now();

	db.transaction((tx) => {
		tx.delete(testingThreadMessage).where(eq(testingThreadMessage.projectId, projectId)).run();
		tx.delete(testingItemProgress).where(eq(testingItemProgress.projectId, projectId)).run();
		tx.delete(codeReviewThreadMessage).where(eq(codeReviewThreadMessage.projectId, projectId)).run();
		tx.delete(codeReviewObservationProgress).where(eq(codeReviewObservationProgress.projectId, projectId)).run();

		let testingDoc: { testingItems?: TestingItem[]; testingRound?: number };
		try {
			testingDoc = JSON.parse(testingJson) as { testingItems?: TestingItem[]; testingRound?: number };
		} catch {
			testingDoc = {};
		}
		const tr =
			typeof testingDoc.testingRound === 'number' && testingDoc.testingRound >= 1
				? testingDoc.testingRound
				: 1;
		for (const item of testingDoc.testingItems ?? []) {
			if (!item?.id) continue;
			tx.insert(testingItemProgress)
				.values({
					projectId,
					itemId: item.id,
					section: item.section,
					itemSummary: (typeof item.text === 'string' ? item.text : item.id).slice(0, 500),
					mandatoryOwner: item.mandatoryOwner ?? null,
					janeVerdict: item.jane,
					joeVerdict: item.joe,
					testingRound: tr,
					updatedAt: now
				})
				.run();
			for (const c of item.comments ?? []) {
				if (!c || typeof c.text !== 'string' || !c.text.trim()) continue;
				const author = String(c.author);
				if (author !== 'sandra' && author !== 'jane' && author !== 'joe') continue;
				tx.insert(testingThreadMessage)
					.values({
						id: generateIdFromEntropySize(16),
						projectId,
						itemId: item.id,
						round: typeof c.round === 'number' ? c.round : 0,
						authorPersona: author,
						body: c.text,
						postedAt: typeof c.at === 'string' ? (Date.parse(c.at) || now) : now
					})
					.run();
			}
		}

		const cr = parseCodeReviewSavePayload(codeReviewJson);
		if (cr) {
			for (const cat of CATEGORIES) {
				const s = cr.sessions[cat.id];
				if (!s?.observationRows) continue;
				for (const o of cat.observations) {
					const row = s.observationRows[o.id];
					if (!row) continue;
					tx.insert(codeReviewObservationProgress)
						.values({
							projectId,
							categoryId: cat.id,
							observationId: o.id,
							janeVerdict: row.jane,
							joeVerdict: row.joe,
							codeReviewRound: cr.codeReviewRound,
							updatedAt: now
						})
						.run();
					for (const c of row.comments ?? []) {
						if (!c || typeof c.text !== 'string' || !c.text.trim()) continue;
						const author = String(c.author);
						if (author !== 'sandra' && author !== 'jane' && author !== 'joe') continue;
						tx.insert(codeReviewThreadMessage)
							.values({
								id: generateIdFromEntropySize(16),
								projectId,
								categoryId: cat.id,
								observationId: o.id,
								round: typeof c.round === 'number' ? c.round : 0,
								authorPersona: author,
								body: c.text,
								postedAt: typeof c.at === 'string' ? (Date.parse(c.at) || now) : now
							})
							.run();
					}
				}
			}
		}
	});
}

export function listTestingItemProgressForProject(projectId: string) {
	return getDb()
		.select()
		.from(testingItemProgress)
		.where(eq(testingItemProgress.projectId, projectId))
		.orderBy(asc(testingItemProgress.itemId))
		.all();
}

export function listTestingThreadMessagesForProject(projectId: string) {
	return getDb()
		.select()
		.from(testingThreadMessage)
		.where(eq(testingThreadMessage.projectId, projectId))
		.orderBy(asc(testingThreadMessage.postedAt), asc(testingThreadMessage.id))
		.all();
}

export function listCodeReviewObservationProgressForProject(projectId: string) {
	return getDb()
		.select()
		.from(codeReviewObservationProgress)
		.where(eq(codeReviewObservationProgress.projectId, projectId))
		.orderBy(
			asc(codeReviewObservationProgress.categoryId),
			asc(codeReviewObservationProgress.observationId)
		)
		.all();
}

export function listCodeReviewThreadMessagesForProject(projectId: string) {
	return getDb()
		.select()
		.from(codeReviewThreadMessage)
		.where(eq(codeReviewThreadMessage.projectId, projectId))
		.orderBy(asc(codeReviewThreadMessage.postedAt), asc(codeReviewThreadMessage.id))
		.all();
}

export function canAccessProject(userId: string, role: string, projectId: string): boolean {
	const p = getProjectById(projectId);
	if (!p) return false;
	if (role === 'admin') return true;
	if (role === 'submitter' && p.submitterId === userId) return true;
	if (role === 'reviewer') {
		const pair = getPairForProject(projectId);
		if (!pair) return false;
		return pair.reviewerAId === userId || pair.reviewerBId === userId;
	}
	return false;
}

export function reviewPersonaForUser(
	pair: ReviewPairRow | null,
	userId: string,
	submitterId: string
): 'sandra' | 'jane' | 'joe' | null {
	if (submitterId === userId) return 'sandra';
	if (!pair) return null;
	if (pair.reviewerAId === userId) return 'jane';
	if (pair.reviewerBId === userId) return 'joe';
	return null;
}

export function categoryAssigneeMapFromPair(pair: ReviewPairRow): Record<string, 'jane' | 'joe'> {
	const a = JSON.parse(pair.categoriesAJson) as string[];
	const b = JSON.parse(pair.categoriesBJson) as string[];
	const map: Record<string, 'jane' | 'joe'> = {};
	for (const id of a) map[id] = 'jane';
	for (const id of b) map[id] = 'joe';
	return map;
}

export function startNextProjectBatch(submitterId: string) {
	const db = getDb();
	const open = db
		.select()
		.from(project)
		.where(and(eq(project.submitterId, submitterId), ne(project.status, 'completed')))
		.limit(1)
		.all();
	if (open.length > 0) {
		return { ok: false as const, error: 'Finish or complete the current project before starting a new batch' };
	}
	const now = Date.now();
	const id = generateIdFromEntropySize(16);
	db.insert(project)
		.values({
			id,
			submitterId,
			instructions: DEFAULT_PROJECT_INSTRUCTIONS,
			giteaUrl: null,
			status: 'awaiting_link',
			testingJson: null,
			codeReviewJson: null,
			submissionProgress: 'awaiting_repo',
			createdAt: now,
			updatedAt: now
		})
		.run();
	return { ok: true as const, projectId: id };
}
