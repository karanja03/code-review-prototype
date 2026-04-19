import { notifyAdminDashboard, notifyProjectReviewUpdate } from '$lib/server/review-live';
import {
	assignReviewPair,
	listProjectsWithSubmittersForAdmin,
	listUsersForAdmin,
	markProjectCompleted
} from '$lib/server/review-workspace';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const users = await listUsersForAdmin();
	const projects = await listProjectsWithSubmittersForAdmin();
	const pairable = projects.filter((p) => p.status === 'repo_submitted');
	const completed = projects.filter((p) => p.status === 'completed');
	const active = projects.filter((p) => p.status !== 'completed');
	return { users, projects, pairable, completed, active };
};

export const actions: Actions = {
	assignPair: async (event) => {
		const admin = event.locals.user;
		if (!admin || admin.role !== 'admin') return fail(403);

		const fd = await event.request.formData();
		const projectId = fd.get('projectId');
		const reviewerAId = fd.get('reviewerAId');
		const reviewerBId = fd.get('reviewerBId');
		if (typeof projectId !== 'string' || typeof reviewerAId !== 'string' || typeof reviewerBId !== 'string') {
			return fail(400, { message: 'Missing fields' });
		}
		const res = await assignReviewPair({
			projectId,
			reviewerAId,
			reviewerBId,
			adminId: admin.id
		});
		if (!res.ok) return fail(400, { message: res.error });
		notifyProjectReviewUpdate(projectId);
		notifyAdminDashboard();
		return { success: true };
	},
	markComplete: async (event) => {
		const admin = event.locals.user;
		if (!admin || admin.role !== 'admin') return fail(403);
		const fd = await event.request.formData();
		const projectId = fd.get('projectId');
		if (typeof projectId !== 'string') return fail(400);
		await markProjectCompleted(projectId);
		notifyProjectReviewUpdate(projectId);
		notifyAdminDashboard();
		return { success: true };
	}
};
