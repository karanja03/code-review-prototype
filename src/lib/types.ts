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

/** Standup “takeaways thread” — one message per person per post (chat-style, not a shared textarea). */
export interface StandupTakeawayMessage {
	id: string;
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

/** Flat row for the code-review sprint UI (mirrors testing mandatory list entries). */
export interface CodeReviewListEntry {
	compositeId: string;
	categoryId: string;
	observationId: string;
	categoryTitle: string;
	observationText: string;
	assignee: 'jane' | 'joe';
	academyHint: string;
}

/** Per observation in a category — same verdict + thread pattern as testing mandatory rows. */
export interface CodeReviewVerdictSnapshot {
	round: number;
	jane: TestingDecision;
	joe: TestingDecision;
}

export interface CodeReviewObservationRowState {
	jane: TestingDecision;
	joe: TestingDecision;
	comments: TestingComment[];
	drafts: Partial<Record<'jane' | 'joe' | 'sandra', string>>;
	verdictHistory: CodeReviewVerdictSnapshot[];
}

export interface CategorySession {
	categoryId: string;
	observationRows: Record<string, CodeReviewObservationRowState>;
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
