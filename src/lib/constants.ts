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
			},
			{
				id: 's4',
				text: 'Sensitive data protection — No hardcoded secrets or sensitive values in logs; store and handle credentials safely.'
			},
			{
				id: 's5',
				text: 'Dependency vulnerabilities — Third-party libraries are maintained and not knowingly risky or unnecessary.'
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
			},
			{
				id: 'cr4',
				text: 'Data integrity — Updates and transactions keep related data consistent without partial or inconsistent states.'
			},
			{
				id: 'cr5',
				text: 'Logical correctness — Conditions, operators, algorithms, and loops match the intended behaviour.'
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
			},
			{
				id: 'p4',
				text: 'I/O efficiency — Reuse or batch APIs, files, and network calls instead of repeating identical work in tight loops.'
			},
			{
				id: 'p5',
				text: 'Caching usage — Do not recompute or refetch the same expensive result when a small cache or reuse is clearly better.'
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
			},
			{
				id: 'st4',
				text: 'Layer boundaries — Logic stays in the layer it belongs to, without leaking DB or transport details upward.'
			},
			{
				id: 'st5',
				text: 'Code cohesion — Each module keeps closely related responsibilities instead of unrelated grab-bags.'
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
