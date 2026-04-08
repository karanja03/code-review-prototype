import type { CategoryDef, CodeReviewObservationRowState } from './types';

export const ACADEMY_BASE = 'https://kood-review-academy-prototype-sxyr.vercel.app/academy';

export const CATEGORIES: CategoryDef[] = [
	{
		id: 'readability',
		title: 'Code Readability',
		assignee: 'joe',
		academyHint: 'cat-functional',
		assignmentBlurb:
			'Can a teammate follow the story—structure, naming, and flow—without reverse‑engineering every file?',
		observations: [
			{ id: 'r1', text: 'Code is easy to understand at first glance' },
			{ id: 'r2', text: 'Code flow is logical and easy to follow' },
			{ id: 'r3', text: 'Naming conveys intent for modules and functions' },
			{ id: 'r4', text: 'Dead code and noise are removed or justified' }
		]
	},
	{
		id: 'security',
		title: 'Security',
		assignee: 'jane',
		academyHint: 'cat-security',
		assignmentBlurb:
			'Inputs, secrets, auth boundaries, and dependencies—think like a friendly attacker, not a judge.',
		observations: [
			{ id: 's1', text: 'Inputs are validated and sanitized where needed' },
			{ id: 's2', text: 'Secrets are not committed or logged' },
			{ id: 's3', text: 'Authorization boundaries are respected' },
			{ id: 's4', text: 'Risky dependencies are reviewed, not ignored' }
		]
	},
	{
		id: 'exceptions',
		title: 'Exception Handling',
		assignee: 'jane',
		academyHint: 'cat-exceptions',
		assignmentBlurb:
			'When things break: safe user‑facing messages, useful logs, and graceful degradation—not silent fails.',
		observations: [
			{ id: 'e1', text: 'Errors are handled at appropriate boundaries' },
			{ id: 'e2', text: 'User-facing errors are safe and helpful' },
			{ id: 'e3', text: 'Logging includes actionable context' },
			{ id: 'e4', text: 'Failures degrade gracefully' }
		]
	},
	{
		id: 'comments',
		title: 'How to Write Comments',
		assignee: 'joe',
		academyHint: 'cat-comments',
		assignmentBlurb:
			'Comments that explain why, docs that match the code, and TODOs that actually have an owner.',
		observations: [
			{ id: 'c1', text: 'Complex logic includes explanatory comments' },
			{ id: 'c2', text: 'Comments match behavior (not stale)' },
			{ id: 'c3', text: 'Public APIs are documented' },
			{ id: 'c4', text: 'TODOs reference tickets or owners' }
		]
	}
];

export function emptyCodeReviewObservationRow(): CodeReviewObservationRowState {
	return {
		jane: 'pending',
		joe: 'pending',
		comments: [],
		drafts: {},
		verdictHistory: []
	};
}

export function emptyObservationRowsForCategory(
	categoryId: string
): Record<string, CodeReviewObservationRowState> {
	const cat = CATEGORIES.find((c) => c.id === categoryId);
	const o: Record<string, CodeReviewObservationRowState> = {};
	cat?.observations.forEach((obs) => {
		o[obs.id] = emptyCodeReviewObservationRow();
	});
	return o;
}
