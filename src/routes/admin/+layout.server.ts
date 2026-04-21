import { PROJECT_THEME_DISPLAY } from '$lib/koodUi';
import { listProjectsWithSubmittersForAdmin } from '$lib/server/review-workspace';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/');
	}
	const rows = listProjectsWithSubmittersForAdmin();
	const adminProjects = rows.map((p) => ({
		id: p.id,
		themeTitle: PROJECT_THEME_DISPLAY,
		status: p.status,
		submitterUsername: p.submitterUsername
	}));
	return { adminProjects };
};
