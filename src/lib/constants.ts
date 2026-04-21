import type { CategoryDef, CodeReviewObservationRowState } from './types';

export const ACADEMY_BASE = 'https://kood-review-academy-prototype-sxyr.vercel.app/academy';

/** You (jane): Security + Correctness. Joe: Performance + Structure & architecture. */
export const CATEGORIES: CategoryDef[] = [
	{
		id: 'security',
		title: 'Security',
		assignee: 'jane',
		academyHint: 'cat-security',
		assignmentBlurb:
			'The system should resist abuse, protect sensitive data, enforce access control, and avoid trusting the wrong inputs.',
		observations: [
			{
				id: 's1',
				text: 'Input sanitization — Treat external input as untrusted; validate and escape before it drives queries or behaviour.'
			},
			{
				id: 's2',
				text: 'Authentication handling — Verify that a user is who they claim to be with proper mechanisms, not client-only flags.'
			},
			{
				id: 's3',
				text: 'Authorization checks — Users only reach what they should; watch missing permission checks and access-by-ID gaps.'
			}
		]
	},
	{
		id: 'correctness',
		title: 'Correctness',
		assignee: 'jane',
		academyHint: 'cat-correctness',
		assignmentBlurb:
			'Does the code do what it is supposed to — requirements, edge cases, validation, data integrity, and plain logic?',
		observations: [
			{
				id: 'cr1',
				text: 'Requirement implementation — Behaviour matches the task; required features exist and nothing central is missing or wrong.'
			},
			{
				id: 'cr2',
				text: 'Edge case handling — Unusual inputs (empty, zero, large, null, boundaries) do not break important flows.'
			},
			{
				id: 'cr3',
				text: 'Input validation — External inputs are checked for type, range, format, and missing values where it matters.'
			}
		]
	},
	{
		id: 'performance',
		title: 'Performance',
		assignee: 'joe',
		academyHint: 'cat-performance',
		assignmentBlurb:
			'Is the solution efficient enough for real-world load — algorithms, data access, memory, I/O, and obvious reuse?',
		observations: [
			{
				id: 'p1',
				text: 'Algorithm complexity — How work grows with input size; avoid accidental heavy nested scans where indexes or maps fit.'
			},
			{
				id: 'p2',
				text: 'Database query efficiency — Watch N+1 patterns, over-fetching, and many tiny queries where one batch would do.'
			},
			{
				id: 'p3',
				text: 'Memory efficiency — Avoid loading huge datasets into memory when pagination, streaming, or filtering is enough.'
			}
		]
	},
	{
		id: 'structure_architecture',
		title: 'Structure & architecture',
		assignee: 'joe',
		academyHint: 'cat-structure',
		assignmentBlurb:
			'Is the codebase organized so the system stays understandable, scalable, and maintainable as it grows?',
		observations: [
			{
				id: 'st1',
				text: 'Separation of concerns — Business logic, UI, data access, and infrastructure are not mixed in one place.'
			},
			{
				id: 'st2',
				text: 'Module organization — Folders and files group related concerns so the layout is predictable for newcomers.'
			},
			{
				id: 'st3',
				text: 'Dependency management — Coupling, import fan-in, and circular dependencies stay under control.'
			}
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
