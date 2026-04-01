import { browser } from '$app/environment';
import { createFullTestingItems } from '$lib/features/testing/checklist';
import { CATEGORIES, emptyChecks, emptyDraftComments, ACADEMY_BASE } from './constants';
import type {
	CategorySession,
	Phase,
	ReviewIterationRecord,
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
			completed: false,
			checks: emptyChecks(c.id),
			lockedObservationIds: {},
			draftComments: emptyDraftComments(c.id),
			iterations: [],
			pendingNudge: null
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
		out[id] = {
			...a,
			...b,
			lockedObservationIds:
				b.lockedObservationIds && typeof b.lockedObservationIds === 'object'
					? { ...b.lockedObservationIds }
					: { ...a.lockedObservationIds }
		};
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
		testingItems: createFullTestingItems(),
		testingRound: 1,
		categorySessions: initialCategorySessions(),
		standupItems: [false, false, false, false, false] as boolean[],
		standupWhen: '',
		standupVoiceChannel: '',
		standupTakeaways: '',
		sandraRatings: defaultSandraRatings(),
		reviewerRatings: defaultReviewerRatings(),
		xpMock: 0,
		leaderboardNote: 'Feedback feeds XP and the leaderboard (mock).'
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
			reviewerRatings: p.reviewerRatings
				? { ...base.reviewerRatings, ...p.reviewerRatings }
				: base.reviewerRatings,
			sandraRatings: p.sandraRatings?.length ? p.sandraRatings : base.sandraRatings,
			standupItems: normalizeStandupItems(p.standupItems, base.standupItems),
			standupWhen: typeof p.standupWhen === 'string' ? p.standupWhen : base.standupWhen,
			standupVoiceChannel:
				typeof p.standupVoiceChannel === 'string' ? p.standupVoiceChannel : base.standupVoiceChannel,
			standupTakeaways:
				typeof p.standupTakeaways === 'string' ? p.standupTakeaways : base.standupTakeaways
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
	pushToast('Project started — complete the brief, then submit for review.');
}

export function confirmSubmitForReview() {
	data.submittedForReview = true;
	data.phase = 'testing';
	pushToast('Reviewers assigned: Jane & Joe. Testing phase unlocked.');
}

export function setTestingVerdict(itemId: string, reviewer: 'jane' | 'joe', verdict: TestingDecision) {
	if (data.role !== reviewer) return;
	const item = data.testingItems.find((t) => t.id === itemId);
	if (!item) return;
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
	pushToast(`Round ${data.testingRound} started — Jane & Joe verdicts reset; history kept.`);
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

export function allMandatoryDoubleAccepted() {
	return mandatoryItems().every((t) => t.jane === 'accept' && t.joe === 'accept');
}

export function goToCodeReview() {
	if (!allMandatoryDoubleAccepted()) {
		pushToast('Jane and Joe must each Accept every mandatory item.');
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

export function setObservationCheck(catId: string, obsId: string, checked: boolean) {
	const s = session(catId);
	if (s.completed) return;
	if (s.lockedObservationIds[obsId]) return;
	s.checks[obsId] = checked;
}

export function setDraftComment(catId: string, obsId: string, text: string) {
	session(catId).draftComments[obsId] = text;
}

export function categoryAssignee(catId: string): 'jane' | 'joe' | undefined {
	return CATEGORIES.find((c) => c.id === catId)?.assignee;
}

export function canInteractCategory(catId: string, role: Role): boolean {
	if (role !== 'jane' && role !== 'joe') return false;
	const a = categoryAssignee(catId);
	return a === role;
}

export function allObservationsChecked(catId: string): boolean {
	const cat = CATEGORIES.find((c) => c.id === catId);
	if (!cat) return false;
	const s = session(catId);
	return cat.observations.every((o) => s.checks[o.id]);
}

export function acceptCategory(catId: string, reviewer: 'jane' | 'joe') {
	const s = session(catId);
	if (s.completed) return;
	if (!allObservationsChecked(catId)) return;
	const cat = CATEGORIES.find((c) => c.id === catId);
	if (!cat) return;
	const record: ReviewIterationRecord = {
		id: uid(),
		at: new Date().toISOString(),
		reviewer,
		categoryId: catId,
		action: 'accept',
		entries: cat.observations.map((o) => ({
			observationId: o.id,
			checked: true,
			comment: undefined
		}))
	};
	s.iterations.push(record);
	s.completed = true;
	s.pendingNudge = null;
	pushToast(`${cat.title} marked complete.`);
}

export function nudgeCategory(catId: string, reviewer: 'jane' | 'joe') {
	const s = session(catId);
	if (s.completed) return;
	const cat = CATEGORIES.find((c) => c.id === catId);
	if (!cat) return;
	const unchecked = cat.observations.filter((o) => !s.checks[o.id]);
	if (unchecked.length === 0) return;
	for (const o of unchecked) {
		if (!s.draftComments[o.id]?.trim()) {
			pushToast(`Add feedback for each unchecked observation in ${cat.title}.`);
			return;
		}
	}
	const entries = cat.observations.map((o) => ({
		observationId: o.id,
		checked: s.checks[o.id],
		comment: s.checks[o.id] ? undefined : s.draftComments[o.id]?.trim()
	}));
	const record: ReviewIterationRecord = {
		id: uid(),
		at: new Date().toISOString(),
		reviewer,
		categoryId: catId,
		action: 'nudge',
		entries
	};
	s.iterations.push(record);
	s.pendingNudge = {
		at: record.at,
		reviewer,
		items: unchecked.map((o) => ({
			observationId: o.id,
			comment: s.draftComments[o.id]!.trim()
		}))
	};
	pushToast(`Nudge sent to Sandra (${cat.title}). Discuss on Discord.`);
}

export function sandraAcknowledgeNudge(catId: string) {
	const s = session(catId);
	if (!s.pendingNudge) return;
	const last = s.iterations[s.iterations.length - 1];
	if (!last || last.action !== 'nudge') {
		s.pendingNudge = null;
		return;
	}
	const nextChecks: Record<string, boolean> = { ...s.checks };
	const nextLocked: Record<string, boolean> = { ...s.lockedObservationIds };
	for (const e of last.entries) {
		nextChecks[e.observationId] = e.checked;
		if (e.checked) {
			nextLocked[e.observationId] = true;
		} else {
			delete nextLocked[e.observationId];
		}
	}
	s.checks = nextChecks;
	s.lockedObservationIds = nextLocked;
	s.draftComments = emptyDraftComments(catId);
	s.pendingNudge = null;
	pushToast('Sandra acknowledged — cleared items stay locked; fix remaining checks only.');
}

export function allCategoriesComplete(): boolean {
	return CATEGORIES.every((c) => data.categorySessions[c.id].completed);
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
	data.standupItems = fresh.standupItems;
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
