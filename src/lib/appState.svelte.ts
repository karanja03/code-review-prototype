import { browser } from '$app/environment';
import { seedCategorySessionsForJoeDemo, seedTestingItemsForYouJoeDemo } from '$lib/demo/youJoeDemoSeed';
import { createFullTestingItems } from '$lib/features/testing/checklist';
import { CATEGORIES, emptyObservationRowsForCategory, ACADEMY_BASE } from './constants';
import type {
	CategorySession,
	CodeReviewListEntry,
	CodeReviewObservationRowState,
	Phase,
	Role,
	SandraRating,
	ReviewerRatingSet,
	TestingDecision,
	TestingItem
} from './types';

/** Used by `+layout.svelte` for `localStorage` sync. */
export const APP_STATE_STORAGE_KEY = 'kood-code-review-prototype-v1';

function uid() {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function mergeTestingFromStorage(parsed: unknown): TestingItem[] {
	const fresh = createFullTestingItems();
	if (!Array.isArray(parsed) || parsed.length === 0) return fresh;
	const row = parsed[0] as Record<string, unknown> | undefined;
	if (!row || typeof row.jane !== 'string' || !('section' in row)) return fresh;
	return fresh.map((def) => {
		const old = (parsed as TestingItem[]).find((x) => x.id === def.id);
		if (!old || typeof old.jane !== 'string') return { ...def };
		return {
			...def,
			jane: old.jane,
			joe: old.joe,
			verdictHistory: Array.isArray(old.verdictHistory) ? old.verdictHistory : [],
			comments: Array.isArray(old.comments) ? old.comments : [],
			drafts: old.drafts && typeof old.drafts === 'object' ? { ...old.drafts } : {}
		};
	});
}

function initialCategorySessions(): Record<string, CategorySession> {
	const m: Record<string, CategorySession> = {};
	for (const c of CATEGORIES) {
		m[c.id] = {
			categoryId: c.id,
			observationRows: emptyObservationRowsForCategory(c.id)
		};
	}
	return m;
}

function mergeCategorySessions(
	base: Record<string, CategorySession>,
	patch: Record<string, CategorySession> | undefined
): Record<string, CategorySession> {
	if (!patch) return base;
	const out: Record<string, CategorySession> = { ...base };
	for (const id of Object.keys(base)) {
		const a = base[id];
		const b = patch[id];
		if (!b) continue;
		if (!b.observationRows || typeof b.observationRows !== 'object') {
			out[id] = { ...a };
			continue;
		}
		const mergedRows: Record<string, CodeReviewObservationRowState> = {};
		for (const obsId of Object.keys(a.observationRows)) {
			const ar = a.observationRows[obsId];
			const br = b.observationRows[obsId];
			const ok =
				br &&
				(br.jane === 'pending' || br.jane === 'accept' || br.jane === 'decline') &&
				(br.joe === 'pending' || br.joe === 'accept' || br.joe === 'decline');
			if (!ok) {
				mergedRows[obsId] = { ...ar };
				continue;
			}
			mergedRows[obsId] = {
				jane: br.jane,
				joe: br.joe,
				comments: Array.isArray(br.comments) ? br.comments.map((c) => ({ ...c })) : [],
				drafts: br.drafts && typeof br.drafts === 'object' ? { ...br.drafts } : {},
				verdictHistory: Array.isArray(br.verdictHistory) ? [...br.verdictHistory] : []
			};
		}
		out[id] = { categoryId: id, observationRows: mergedRows };
	}
	return out;
}

function defaultSandraRatings(): SandraRating[] {
	return [
		{ categoryId: 'readability', score: null, comment: '', submitted: false },
		{ categoryId: 'comments', score: null, comment: '', submitted: false },
		{ categoryId: 'security', score: null, comment: '', submitted: false },
		{ categoryId: 'exceptions', score: null, comment: '', submitted: false }
	];
}

function defaultReviewerRatings(): Record<'jane' | 'joe', ReviewerRatingSet> {
	const blank = (): ReviewerRatingSet => ({
		readableCode: { score: null, comment: '', submitted: false },
		codeComments: { score: null, comment: '', submitted: false },
		crossReviewer: { score: null, comment: '', submitted: false }
	});
	return { jane: blank(), joe: blank() };
}

export type Toast = { id: string; message: string };

function createInitialSnapshot() {
	return {
		role: 'sandra' as Role,
		phase: 'briefing' as Phase,
		projectStarted: false,
		submittedForReview: false,
		testingItems: seedTestingItemsForYouJoeDemo(createFullTestingItems()),
		testingRound: 5,
		categorySessions: seedCategorySessionsForJoeDemo(initialCategorySessions()),
		codeReviewRound: 5,
		standupItems: [false, false, false, false, false] as boolean[],
		standupWhen: '',
		standupVoiceChannel: '',
		standupTakeaways: '',
		sandraRatings: defaultSandraRatings(),
		reviewerRatings: defaultReviewerRatings(),
		xpMock: 0,
		leaderboardNote: 'Feedback feeds XP and the leaderboard (mock).',
		// Joe skips the assignment checkbox in this demo (work is already reflected).
		reviewerAssignmentAccepted: { jane: false, joe: true }
	};
}

type Snapshot = ReturnType<typeof createInitialSnapshot>;

const STANDUP_CHECKBOX_COUNT = 5;

function normalizeStandupItems(parsed: unknown, fallback: boolean[]): boolean[] {
	const next = [...fallback];
	if (!Array.isArray(parsed)) return next;
	for (let i = 0; i < STANDUP_CHECKBOX_COUNT; i++) {
		next[i] = i < parsed.length ? Boolean(parsed[i]) : false;
	}
	return next;
}

function normalizeReviewerAssignmentAccepted(
	parsed: unknown,
	fallback: { jane: boolean; joe: boolean }
): { jane: boolean; joe: boolean } {
	if (!parsed || typeof parsed !== 'object') return { ...fallback };
	const o = parsed as Record<string, unknown>;
	return {
		jane: typeof o.jane === 'boolean' ? o.jane : fallback.jane,
		// Demo: Joe never goes through the assignment checkbox; always treated as accepted.
		joe: true
	};
}

function load(): Snapshot {
	if (!browser) return createInitialSnapshot();
	try {
		const raw = localStorage.getItem(APP_STATE_STORAGE_KEY);
		if (!raw) return createInitialSnapshot();
		const p = JSON.parse(raw) as Partial<Snapshot>;
		const base = createInitialSnapshot();
		return {
			...base,
			...p,
			testingItems: mergeTestingFromStorage(p.testingItems),
			testingRound:
				typeof p.testingRound === 'number' && p.testingRound >= 1 ? p.testingRound : base.testingRound,
			categorySessions: mergeCategorySessions(base.categorySessions, p.categorySessions),
			codeReviewRound:
				typeof p.codeReviewRound === 'number' && p.codeReviewRound >= 1
					? p.codeReviewRound
					: base.codeReviewRound,
			reviewerRatings: p.reviewerRatings
				? { ...base.reviewerRatings, ...p.reviewerRatings }
				: base.reviewerRatings,
			sandraRatings: p.sandraRatings?.length ? p.sandraRatings : base.sandraRatings,
			standupItems: normalizeStandupItems(p.standupItems, base.standupItems),
			standupWhen: typeof p.standupWhen === 'string' ? p.standupWhen : base.standupWhen,
			standupVoiceChannel:
				typeof p.standupVoiceChannel === 'string' ? p.standupVoiceChannel : base.standupVoiceChannel,
			standupTakeaways:
				typeof p.standupTakeaways === 'string' ? p.standupTakeaways : base.standupTakeaways,
			reviewerAssignmentAccepted: normalizeReviewerAssignmentAccepted(
				p.reviewerAssignmentAccepted,
				base.reviewerAssignmentAccepted
			)
		};
	} catch {
		return createInitialSnapshot();
	}
}

const data = $state(load());

const toasts = $state<Toast[]>([]);

export function getApp() {
	return data;
}

export function getToasts() {
	return toasts;
}

export function pushToast(message: string) {
	const id = uid();
	toasts.push({ id, message });
	setTimeout(() => {
		const i = toasts.findIndex((t) => t.id === id);
		if (i >= 0) toasts.splice(i, 1);
	}, 4200);
}

export function setRole(role: Role) {
	data.role = role;
}

export function confirmStartProject() {
	data.projectStarted = true;
	data.phase = 'project_completion';
	data.reviewerAssignmentAccepted = { jane: false, joe: true };
	pushToast('Project started — complete the brief, then submit for review.');
}

export function acceptReviewerAssignment(reviewer: 'jane' | 'joe') {
	data.reviewerAssignmentAccepted[reviewer] = true;
	pushToast(`${reviewer === 'jane' ? 'You' : 'Joe'}: assignment accepted — you can review.`);
}

export function reviewerNeedsAssignmentGate(role: Role): boolean {
	if (role !== 'jane' && role !== 'joe') return false;
	if (!data.projectStarted) return false;
	if (role === 'joe') return false;
	return !data.reviewerAssignmentAccepted[role];
}

export function confirmSubmitForReview() {
	data.submittedForReview = true;
	data.phase = 'testing';
	pushToast('Reviewers assigned: You & Joe. Testing phase unlocked.');
}

export function setTestingVerdict(itemId: string, reviewer: 'jane' | 'joe', verdict: TestingDecision) {
	if (data.role !== reviewer) return;
	const item = data.testingItems.find((t) => t.id === itemId);
	if (!item) return;
	if (item.section === 'mandatory' && item.mandatoryOwner && item.mandatoryOwner !== reviewer) {
		return;
	}
	item[reviewer] = verdict;
}

export function setTestingDraft(
	itemId: string,
	who: 'jane' | 'joe' | 'sandra',
	text: string
) {
	const item = data.testingItems.find((t) => t.id === itemId);
	if (!item) return;
	item.drafts = { ...item.drafts, [who]: text };
}

export function postTestingComment(itemId: string) {
	const role = data.role;
	if (role !== 'jane' && role !== 'joe' && role !== 'sandra') return;
	const item = data.testingItems.find((t) => t.id === itemId);
	if (!item) return;
	const key = role;
	const raw = item.drafts[key]?.trim() ?? '';
	if (!raw) {
		pushToast('Write something before posting.');
		return;
	}
	item.comments.push({
		id: uid(),
		round: data.testingRound,
		author: role,
		text: raw,
		at: new Date().toISOString()
	});
	item.drafts = { ...item.drafts, [key]: '' };
	pushToast(role === 'sandra' ? 'Your note was added for reviewers.' : 'Comment posted.');
}

export function sandraStartNewTestingRound() {
	if (data.role !== 'sandra') return;
	for (const item of data.testingItems) {
		item.verdictHistory.push({
			round: data.testingRound,
			jane: item.jane,
			joe: item.joe
		});
		item.jane = 'pending';
		item.joe = 'pending';
	}
	data.testingRound += 1;
	pushToast(`Round ${data.testingRound} started — You & Joe verdicts reset; history kept.`);
}

export function mandatoryItems() {
	return data.testingItems.filter((t) => t.section === 'mandatory');
}

export function extraItems() {
	return data.testingItems.filter((t) => t.section === 'extra');
}

export function reviewerCommentCount(item: TestingItem) {
	return item.comments.filter((c) => c.author === 'jane' || c.author === 'joe').length;
}

/** Mandatory complete when each row is Accepted by its single assigned owner (You or Joe). */
export function mandatoryOwnerAccepted(t: TestingItem): boolean {
	if (t.section !== 'mandatory' || !t.mandatoryOwner) return false;
	return t[t.mandatoryOwner] === 'accept';
}

export function allMandatoryDoubleAccepted() {
	return mandatoryItems().every(mandatoryOwnerAccepted);
}

/** How many mandatory rows are accepted by their owner. */
export function mandatoryOwnedAcceptedCount(): number {
	return mandatoryItems().filter(mandatoryOwnerAccepted).length;
}

/** Mandatory rows where the assigned owner has accepted or declined (not pending). */
export function mandatoryOwnedResolvedCount(): number {
	return mandatoryItems().filter((t) => {
		if (!t.mandatoryOwner) return false;
		const d = t[t.mandatoryOwner];
		return d === 'accept' || d === 'decline';
	}).length;
}

/** For one reviewer: counts for mandatory rows they own (their verdict only). */
export function mandatoryProgressForReviewer(reviewer: 'jane' | 'joe'): {
	owned: number;
	accepted: number;
	declined: number;
	resolved: number;
} {
	const mine = mandatoryItems().filter((t) => t.mandatoryOwner === reviewer);
	const accepted = mine.filter((t) => t[reviewer] === 'accept').length;
	const declined = mine.filter((t) => t[reviewer] === 'decline').length;
	return {
		owned: mine.length,
		accepted,
		declined,
		resolved: accepted + declined
	};
}

export function goToCodeReview() {
	if (!allMandatoryDoubleAccepted()) {
		pushToast('Each mandatory check must be Accepted by its assigned reviewer (You or Joe).');
		return;
	}
	data.phase = 'code_review';
}

export function academyUrl(hint: string) {
	return `${ACADEMY_BASE}/${hint}`;
}

function session(catId: string): CategorySession {
	return data.categorySessions[catId];
}

export function categoryAssignee(catId: string): 'jane' | 'joe' | undefined {
	return CATEGORIES.find((c) => c.id === catId)?.assignee;
}

export function codeReviewObservationsList(): CodeReviewListEntry[] {
	const out: CodeReviewListEntry[] = [];
	for (const c of CATEGORIES) {
		for (const o of c.observations) {
			out.push({
				compositeId: `${c.id}:${o.id}`,
				categoryId: c.id,
				observationId: o.id,
				categoryTitle: c.title,
				observationText: o.text,
				assignee: c.assignee,
				academyHint: c.academyHint
			});
		}
	}
	return out;
}

export function getCodeReviewObservationRow(
	catId: string,
	obsId: string
): CodeReviewObservationRowState {
	const s = session(catId);
	const row = s.observationRows[obsId];
	if (row) return row;
	return {
		jane: 'pending',
		joe: 'pending',
		comments: [],
		drafts: {},
		verdictHistory: []
	};
}

export function setCodeReviewVerdict(
	catId: string,
	obsId: string,
	reviewer: 'jane' | 'joe',
	decision: TestingDecision
) {
	const assignee = categoryAssignee(catId);
	if (assignee !== reviewer) return;
	if (decision !== 'accept' && decision !== 'decline') return;
	const row = session(catId).observationRows[obsId];
	if (!row) return;
	row[reviewer] = decision;
}

export function setCodeReviewDraft(
	catId: string,
	obsId: string,
	author: 'jane' | 'joe' | 'sandra',
	text: string
) {
	const row = session(catId).observationRows[obsId];
	if (!row) return;
	row.drafts = { ...row.drafts, [author]: text };
}

export function codeReviewReviewerCommentCount(catId: string, obsId: string): number {
	const row = session(catId).observationRows[obsId];
	if (!row) return 0;
	return row.comments.filter((c) => c.author === 'jane' || c.author === 'joe').length;
}

export function postCodeReviewComment(catId: string, obsId: string) {
	const role = data.role;
	if (role !== 'jane' && role !== 'joe' && role !== 'sandra') return;
	const row = session(catId).observationRows[obsId];
	if (!row) return;
	const key = role;
	const raw = row.drafts[key]?.trim() ?? '';
	if (!raw) {
		pushToast('Write something before posting.');
		return;
	}
	row.comments.push({
		id: uid(),
		round: data.codeReviewRound,
		author: role,
		text: raw,
		at: new Date().toISOString()
	});
	row.drafts = { ...row.drafts, [key]: '' };
	pushToast(role === 'sandra' ? 'Your note was added for reviewers.' : 'Comment posted.');
}

export function sandraStartNewCodeReviewRound() {
	if (data.role !== 'sandra') return;
	const r = data.codeReviewRound;
	for (const c of CATEGORIES) {
		const s = session(c.id);
		for (const o of c.observations) {
			const row = s.observationRows[o.id];
			if (!row) continue;
			row.verdictHistory.push({
				round: r,
				jane: row.jane,
				joe: row.joe
			});
			row.jane = 'pending';
			row.joe = 'pending';
		}
	}
	data.codeReviewRound += 1;
	pushToast(`Round ${data.codeReviewRound} started — verdicts reset; threads kept.`);
}

export function codeReviewOwnerAccepted(entry: CodeReviewListEntry): boolean {
	const row = getCodeReviewObservationRow(entry.categoryId, entry.observationId);
	return row[entry.assignee] === 'accept';
}

export function codeReviewOwnedResolvedCount(): number {
	let n = 0;
	for (const e of codeReviewObservationsList()) {
		const row = getCodeReviewObservationRow(e.categoryId, e.observationId);
		const d = row[e.assignee];
		if (d === 'accept' || d === 'decline') n++;
	}
	return n;
}

export function codeReviewProgressForReviewer(reviewer: 'jane' | 'joe'): {
	owned: number;
	accepted: number;
	declined: number;
	resolved: number;
} {
	const mine = codeReviewObservationsList().filter((e) => e.assignee === reviewer);
	let accepted = 0;
	let declined = 0;
	for (const e of mine) {
		const row = getCodeReviewObservationRow(e.categoryId, e.observationId);
		if (row[reviewer] === 'accept') accepted++;
		else if (row[reviewer] === 'decline') declined++;
	}
	return {
		owned: mine.length,
		accepted,
		declined,
		resolved: accepted + declined
	};
}

export function allCategoriesComplete(): boolean {
	for (const c of CATEGORIES) {
		for (const o of c.observations) {
			const row = session(c.id).observationRows[o.id];
			if (!row || row[c.assignee] !== 'accept') return false;
		}
	}
	return true;
}

export function goToStandup() {
	if (!allCategoriesComplete()) {
		pushToast('Complete all four categories first.');
		return;
	}
	data.phase = 'standup';
}

export function toggleStandup(i: number) {
	if (i >= 0 && i < STANDUP_CHECKBOX_COUNT) data.standupItems[i] = !data.standupItems[i];
}

export function completeStandup() {
	if (!data.standupItems.every(Boolean)) {
		pushToast('Check off all standup agenda items to continue.');
		return;
	}
	data.phase = 'accept_project';
	data.xpMock += 50;
	pushToast('Standup complete. +50 XP (mock).');
}

export function completeAcceptProject() {
	data.phase = 'feedback_360';
	pushToast('Move on to 360° feedback.');
}

export function setSandraRating(categoryId: string, score: number, comment: string) {
	const r = data.sandraRatings.find((x) => x.categoryId === categoryId);
	if (!r || r.submitted) return;
	r.score = score;
	r.comment = comment;
	r.submitted = true;
	data.xpMock += 15;
	pushToast(`Rating saved for ${categoryId}. +15 XP (mock).`);
}

export function setReviewerRating(
	reviewer: 'jane' | 'joe',
	key: keyof ReviewerRatingSet,
	score: number,
	comment: string
) {
	const block = data.reviewerRatings[reviewer][key];
	if (block.submitted) return;
	block.score = score;
	block.comment = comment;
	block.submitted = true;
	data.xpMock += 15;
	pushToast('Reviewer feedback saved. +15 XP (mock).');
}

export function trainingBlurbFor(reviewer: 'jane' | 'joe'): string {
	const r = data.sandraRatings.filter((x) => {
		const cat = CATEGORIES.find((c) => c.id === x.categoryId);
		return cat?.assignee === reviewer && x.submitted;
	});
	const low = r.filter((x) => x.score !== null && x.score <= 2);
	if (low.length === 0) return 'No critical gaps flagged — great consistency across assigned categories.';
	const titles = low
		.map((x) => CATEGORIES.find((c) => c.id === x.categoryId)?.title ?? x.categoryId)
		.join(', ');
	return `Training suggestion: revisit academy modules tied to ${titles} (peer scores ≤2).`;
}

export function jumpPhase(phase: Phase) {
	const prev = data.phase;
	data.phase = phase;
	if (phase === 'briefing') {
		data.projectStarted = false;
		data.submittedForReview = false;
	} else {
		data.projectStarted = true;
		if (
			phase === 'code_review' ||
			phase === 'standup' ||
			phase === 'accept_project' ||
			phase === 'feedback_360'
		) {
			data.submittedForReview = true;
		}
	}
	const back = phaseStepIndex(phase) < phaseStepIndex(prev);
	pushToast(
		back
			? `Viewing earlier step: ${PHASE_LABELS.find((x) => x.id === phase)?.label ?? phase}. Progress is unchanged.`
			: `Demo: jumped to “${phase}”.`
	);
}

/** True if user may click this step in Progress to revisit (only backward in the linear journey). */
export function canRevisitPhaseInProgress(stepPhase: Phase, currentPhase: Phase): boolean {
	if (currentPhase === 'briefing') return false;
	const cur = phaseStepIndex(currentPhase);
	const mine = phaseStepIndex(stepPhase);
	if (cur < 0 || mine < 0) return false;
	return mine < cur;
}

export function resetPrototype() {
	const fresh = createInitialSnapshot();
	data.role = fresh.role;
	data.phase = fresh.phase;
	data.projectStarted = fresh.projectStarted;
	data.submittedForReview = fresh.submittedForReview;
	data.testingItems = fresh.testingItems;
	data.testingRound = fresh.testingRound;
	data.categorySessions = fresh.categorySessions;
	data.codeReviewRound = fresh.codeReviewRound;
	data.standupItems = fresh.standupItems;
	data.standupWhen = fresh.standupWhen;
	data.standupVoiceChannel = fresh.standupVoiceChannel;
	data.standupTakeaways = fresh.standupTakeaways;
	data.reviewerAssignmentAccepted = fresh.reviewerAssignmentAccepted;
	data.sandraRatings = fresh.sandraRatings;
	data.reviewerRatings = fresh.reviewerRatings;
	data.xpMock = fresh.xpMock;
	data.leaderboardNote = fresh.leaderboardNote;
	if (browser) localStorage.removeItem(APP_STATE_STORAGE_KEY);
	pushToast('Prototype reset to defaults.');
}

export const PHASE_LABELS: { id: Phase; label: string }[] = [
	{ id: 'project_completion', label: 'Project completion' },
	{ id: 'testing', label: 'Testing' },
	{ id: 'code_review', label: 'Code review' },
	{ id: 'standup', label: 'Standup (post-sprint)' },
	{ id: 'accept_project', label: 'Accept project' },
	{ id: 'feedback_360', label: '360° feedback' }
];

export function phaseStepIndex(phase: Phase): number {
	const order: Phase[] = [
		'project_completion',
		'testing',
		'code_review',
		'standup',
		'accept_project',
		'feedback_360'
	];
	if (phase === 'briefing') return -1;
	const i = order.indexOf(phase);
	return i;
}

export function isPhaseComplete(stepPhase: Phase, current: Phase): boolean {
	const cur = phaseStepIndex(current);
	const mine = phaseStepIndex(stepPhase);
	if (cur < 0) return false;
	return cur > mine;
}

export function isPhaseCurrent(stepPhase: Phase, current: Phase): boolean {
	return stepPhase === current;
}
