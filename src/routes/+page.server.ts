import { lucia } from '$lib/server/auth';
import {
	appendCodeReviewMessageLive,
	appendTestingMessageLive,
	notifyAdminDashboard,
	notifyProjectReviewUpdate,
	recomputeAndPersistSubmissionProgress,
	refreshProjectReviewSnapshotsFromRelational,
	setCodeReviewVerdictLive,
	setTestingVerdictLive
} from '$lib/server/review-live';
import {
	canAccessProject,
	categoryAssigneeMapFromPair,
	ensureActiveProjectForSubmitter,
	getPairForProject,
	getProjectById,
	getReviewerPairRow,
	markProjectCompleted,
	parseCodeReviewSavePayload,
	reviewPersonaForUser,
	reviewRoomDisplayLabels,
	saveProjectReviewWorkspace,
	startNextProjectBatch,
	submitProjectRepoUrl
} from '$lib/server/review-workspace';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';


export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}
	const u = locals.user;
	if (u.role === 'submitter') {
		let projectRow = await ensureActiveProjectForSubmitter(u.id);
		await recomputeAndPersistSubmissionProgress(projectRow.id);
		projectRow = (await getProjectById(projectRow.id)) ?? projectRow;
		const pair = await getPairForProject(projectRow.id);
		const categoryMap = pair ? categoryAssigneeMapFromPair(pair) : null;
		const canMarkComplete = projectRow.submitterId === u.id;
		const reviewRoom = pair ? await reviewRoomDisplayLabels(projectRow.submitterId, pair) : null;
		return {
			workspace: {
				kind: 'submitter' as const,
				viewerId: u.id,
				project: projectRow,
				pair,
				categoryMap,
				reviewRoom,
				canMarkComplete
			}
		};
	}
	if (u.role === 'reviewer') {
		const pair = await getReviewerPairRow(u.id);
		let projectRow = pair ? await getProjectById(pair.projectId) : null;
		if (projectRow) {
			await recomputeAndPersistSubmissionProgress(projectRow.id);
			projectRow = (await getProjectById(projectRow.id)) ?? projectRow;
		}
		const categoryMap = pair ? categoryAssigneeMapFromPair(pair) : null;
		const persona =
			pair && projectRow ? reviewPersonaForUser(pair, u.id, projectRow.submitterId) : null;
		const reviewRoom =
			pair && projectRow ? await reviewRoomDisplayLabels(projectRow.submitterId, pair) : null;
		return {
			workspace: {
				kind: 'reviewer' as const,
				viewerId: u.id,
				project: projectRow,
				pair,
				categoryMap,
				persona,
				reviewRoom,
				canMarkComplete: false as const
			}
		};
	}
	return { workspace: { kind: 'other' as const, viewerId: u.id, role: u.role } };
};

export const actions: Actions = {
	signout: async (event) => {
		if (!event.locals.session) {
			return fail(401);
		}
		await lucia.invalidateSession(event.locals.session.id);
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
		throw redirect(302, '/login');
	},
	submitRepo: async (event) => {
		const u = event.locals.user;
		if (!u || u.role !== 'submitter') return fail(403, { message: 'Only the submitter can submit a repo URL' });
		const fd = await event.request.formData();
		const projectId = fd.get('projectId');
		const url = fd.get('giteaUrl');
		if (typeof projectId !== 'string' || typeof url !== 'string') {
			return fail(400, { message: 'Missing fields' });
		}
		const res = await submitProjectRepoUrl(projectId, u.id, url);
		if (!res.ok) return fail(400, { message: res.error });
		notifyProjectReviewUpdate(projectId);
		notifyAdminDashboard();
		throw redirect(303, '/');
	},
	startNextBatch: async (event) => {
		const u = event.locals.user;
		if (!u || u.role !== 'submitter') return fail(403);
		const res = await startNextProjectBatch(u.id);
		if (!res.ok) return fail(400, { message: res.error });
		notifyProjectReviewUpdate(res.projectId);
		notifyAdminDashboard();
		throw redirect(303, '/');
	},
	saveReviewState: async (event) => {
		const u = event.locals.user;
		if (!u) return fail(401);
		const fd = await event.request.formData();
		const projectId = fd.get('projectId');
		const testingPayload = fd.get('testingPayload');
		const codeReviewPayload = fd.get('codeReviewPayload');
		if (typeof projectId !== 'string') return fail(400, { message: 'Missing project' });
		if (!(await canAccessProject(u.id, u.role, projectId))) return fail(403);
		if (typeof testingPayload !== 'string' || typeof codeReviewPayload !== 'string') {
			return fail(400, { message: 'Missing payloads' });
		}
		let testingDoc: unknown;
		try {
			testingDoc = JSON.parse(testingPayload);
		} catch {
			return fail(400, { message: 'Invalid JSON' });
		}
		if (!testingDoc || typeof testingDoc !== 'object') return fail(400, { message: 'Invalid testing payload' });
		const t = testingDoc as Record<string, unknown>;
		if (!Array.isArray(t.testingItems)) return fail(400, { message: 'testingItems must be an array' });
		if (!parseCodeReviewSavePayload(codeReviewPayload)) {
			return fail(400, { message: 'Invalid code review payload' });
		}

		await saveProjectReviewWorkspace(projectId, testingPayload, codeReviewPayload);
		await refreshProjectReviewSnapshotsFromRelational(projectId);
		await recomputeAndPersistSubmissionProgress(projectId);
		notifyProjectReviewUpdate(projectId);
		return { success: true };
	},
	appendTestingMessage: async (event) => {
		const u = event.locals.user;
		if (!u) return fail(401);
		const fd = await event.request.formData();
		const projectId = fd.get('projectId');
		const itemId = fd.get('itemId');
		const authorPersona = fd.get('authorPersona');
		const body = fd.get('body');
		const roundStr = fd.get('round');
		if (typeof projectId !== 'string' || typeof itemId !== 'string') return fail(400);
		if (!(await canAccessProject(u.id, u.role, projectId))) return fail(403);
		if (typeof authorPersona !== 'string' || typeof body !== 'string' || typeof roundStr !== 'string') {
			return fail(400);
		}
		const round = Number(roundStr);
		const res = await appendTestingMessageLive({
			projectId,
			userId: u.id,
			role: u.role,
			itemId,
			authorPersona,
			body,
			round: Number.isFinite(round) ? round : 0
		});
		if (!res.ok) return fail(403, { message: 'error' in res ? res.error : 'Forbidden' });
		notifyProjectReviewUpdate(projectId);
		return { success: true };
	},
	setTestingVerdict: async (event) => {
		const u = event.locals.user;
		if (!u) return fail(401);
		const fd = await event.request.formData();
		const projectId = fd.get('projectId');
		const itemId = fd.get('itemId');
		const persona = fd.get('persona');
		const verdict = fd.get('verdict');
		const testingRoundStr = fd.get('testingRound');
		if (typeof projectId !== 'string' || typeof itemId !== 'string') return fail(400);
		if (!(await canAccessProject(u.id, u.role, projectId))) return fail(403);
		if (persona !== 'jane' && persona !== 'joe') return fail(400);
		if (verdict !== 'accept' && verdict !== 'decline') return fail(400);
		const tr = typeof testingRoundStr === 'string' ? Number(testingRoundStr) : NaN;
		const res = await setTestingVerdictLive({
			projectId,
			userId: u.id,
			role: u.role,
			persona,
			itemId,
			verdict,
			testingRound: Number.isFinite(tr) && tr >= 1 ? tr : 1
		});
		if (!res.ok) return fail(403, { message: 'error' in res ? res.error : 'Forbidden' });
		notifyProjectReviewUpdate(projectId);
		return { success: true };
	},
	appendCodeReviewMessage: async (event) => {
		const u = event.locals.user;
		if (!u) return fail(401);
		const fd = await event.request.formData();
		const projectId = fd.get('projectId');
		const categoryId = fd.get('categoryId');
		const observationId = fd.get('observationId');
		const authorPersona = fd.get('authorPersona');
		const body = fd.get('body');
		const roundStr = fd.get('round');
		if (typeof projectId !== 'string' || typeof categoryId !== 'string' || typeof observationId !== 'string') {
			return fail(400);
		}
		if (!(await canAccessProject(u.id, u.role, projectId))) return fail(403);
		if (typeof authorPersona !== 'string' || typeof body !== 'string' || typeof roundStr !== 'string') {
			return fail(400);
		}
		const round = Number(roundStr);
		const res = await appendCodeReviewMessageLive({
			projectId,
			userId: u.id,
			role: u.role,
			categoryId,
			observationId,
			authorPersona,
			body,
			round: Number.isFinite(round) ? round : 0
		});
		if (!res.ok) return fail(403, { message: 'error' in res ? res.error : 'Forbidden' });
		notifyProjectReviewUpdate(projectId);
		return { success: true };
	},
	setCodeReviewVerdict: async (event) => {
		const u = event.locals.user;
		if (!u) return fail(401);
		const fd = await event.request.formData();
		const projectId = fd.get('projectId');
		const categoryId = fd.get('categoryId');
		const observationId = fd.get('observationId');
		const persona = fd.get('persona');
		const verdict = fd.get('verdict');
		const codeReviewRoundStr = fd.get('codeReviewRound');
		if (typeof projectId !== 'string' || typeof categoryId !== 'string' || typeof observationId !== 'string') {
			return fail(400);
		}
		if (!(await canAccessProject(u.id, u.role, projectId))) return fail(403);
		if (persona !== 'jane' && persona !== 'joe') return fail(400);
		if (verdict !== 'accept' && verdict !== 'decline') return fail(400);
		const cr = typeof codeReviewRoundStr === 'string' ? Number(codeReviewRoundStr) : NaN;
		const res = await setCodeReviewVerdictLive({
			projectId,
			userId: u.id,
			role: u.role,
			persona,
			categoryId,
			observationId,
			verdict,
			codeReviewRound: Number.isFinite(cr) && cr >= 1 ? cr : 1
		});
		if (!res.ok) return fail(403, { message: 'error' in res ? res.error : 'Forbidden' });
		notifyProjectReviewUpdate(projectId);
		return { success: true };
	},
	markReviewComplete: async (event) => {
		const u = event.locals.user;
		if (!u) return fail(401);
		const fd = await event.request.formData();
		const projectId = fd.get('projectId');
		if (typeof projectId !== 'string') return fail(400);
		const projectRow = await getProjectById(projectId);
		if (!projectRow) return fail(404);
		const isSubmitter = u.role === 'submitter' && projectRow.submitterId === u.id;
		const isAdmin = u.role === 'admin';
		if (!isSubmitter && !isAdmin) return fail(403);
		await markProjectCompleted(projectId);
		notifyProjectReviewUpdate(projectId);
		notifyAdminDashboard();
		throw redirect(303, '/');
	}
};
