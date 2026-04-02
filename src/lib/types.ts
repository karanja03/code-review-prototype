export type Role = 'sandra' | 'jane' | 'joe';

export type Phase =
	| 'briefing'
	| 'project_completion'
	| 'testing'
	| 'code_review'
	| 'standup'
	| 'accept_project'
	| 'feedback_360';

export type TestingDecision = 'pending' | 'accept' | 'decline';

export interface TestingVerdictSnapshot {
	round: number;
	jane: TestingDecision;
	joe: TestingDecision;
}

export interface TestingComment {
	id: string;
	round: number;
	author: 'jane' | 'joe' | 'sandra';
	text: string;
	at: string;
}

export interface TestingItem {
	id: string;
	section: 'mandatory' | 'extra';
	text: string;
	/** Mandatory only: exactly one reviewer owns Accept/Decline; the other observes (read-only). */
	mandatoryOwner?: 'jane' | 'joe';
	/** Each reviewer’s verdict for the current round. */
	jane: TestingDecision;
	joe: TestingDecision;
	verdictHistory: TestingVerdictSnapshot[];
	comments: TestingComment[];
	drafts: Partial<Record<'jane' | 'joe' | 'sandra', string>>;
}

export interface ObservationDef {
	id: string;
	text: string;
}

export interface CategoryDef {
	id: string;
	title: string;
	assignee: 'jane' | 'joe';
	academyHint: string;
	/** Short context on the reviewer assignment screen */
	assignmentBlurb: string;
	observations: ObservationDef[];
}

export interface ReviewIterationRecord {
	id: string;
	at: string;
	reviewer: 'jane' | 'joe';
	categoryId: string;
	action: 'nudge' | 'accept';
	entries: { observationId: string; checked: boolean; comment?: string }[];
}

export interface CategorySession {
	categoryId: string;
	completed: boolean;
	checks: Record<string, boolean>;
	/** Observations that passed in a prior nudge — stay checked; checkbox disabled to avoid repeat work. */
	lockedObservationIds: Record<string, boolean>;
	draftComments: Record<string, string>;
	iterations: ReviewIterationRecord[];
	pendingNudge: null | {
		at: string;
		reviewer: 'jane' | 'joe';
		items: { observationId: string; comment: string }[];
	};
}

export interface SandraRating {
	categoryId: string;
	score: number | null;
	comment: string;
	submitted: boolean;
}

export interface ReviewerRatingSet {
	readableCode: { score: number | null; comment: string; submitted: boolean };
	codeComments: { score: number | null; comment: string; submitted: boolean };
	crossReviewer: { score: number | null; comment: string; submitted: boolean };
}
