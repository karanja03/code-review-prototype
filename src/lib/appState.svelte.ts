import { browser } from '$app/environment';
import { seedCategorySessionsForJoeDemo, seedTestingItemsForYouJoeDemo } from '$lib/demo/youJoeDemoSeed';
import { createFullTestingItems } from '$lib/features/testing/checklist';
import { MESSENGER_REPO } from '$lib/koodUi';
import { CATEGORIES, ACADEMY_BASE, emptyObservationRowsForCategory } from './constants';
import type {
	AdminSlot,
	CategorySession,
	CodeReviewListEntry,
	CodeReviewObservationRowState,
	Phase,
	RegisteredUser,
	Role,
	SandraRating,
	ReviewerRatingSet,
	TestingDecision,
	TestingItem
} from './types';

/** Used by layout for server JSON sync. */
export const APP_STATE_API_PATH = '/api/prototype-state';
let lastServerSnapshotJson = '';

function uid() {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function debugLog(event: string, payload?: unknown) {
	if (!browser) return;
	console.info(`[appState] ${event}`, payload ?? '');
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
		{ categoryId: 'security', score: null, comment: '', submitted: false },
		{ categoryId: 'correctness', score: null, comment: '', submitted: false },
		{ categoryId: 'performance', score: null, comment: '', submitted: false },
		{ categoryId: 'structure_architecture', score: null, comment: '', submitted: false }
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
		loggedIn: false,
		isAdminSession: false,
		currentUserName: '',
		registeredUsers: [] as RegisteredUser[],
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
		reviewerAssignmentAccepted: { jane: false, joe: false },
		latestSubmission: null as null | { by: string; at: string; repo: string }
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

/** Re-align stored Sandra ratings when category ids change (e.g. after prototype updates). */
function normalizeSandraRatings(parsed: unknown): SandraRating[] {
	const base = defaultSandraRatings();
	if (!Array.isArray(parsed)) return base;
	const byId = new Map<string, SandraRating>();
	for (const x of parsed) {
		if (!x || typeof x !== 'object') continue;
		const r = x as SandraRating;
		if (typeof r.categoryId !== 'string') continue;
		byId.set(r.categoryId, {
			categoryId: r.categoryId,
			score: typeof r.score === 'number' || r.score === null ? r.score : null,
			comment: typeof r.comment === 'string' ? r.comment : '',
			submitted: Boolean(r.submitted)
		});
	}
	return base.map((row) => {
		const old = byId.get(row.categoryId);
		if (!old) return { ...row };
		return { ...row, score: old.score, comment: old.comment, submitted: old.submitted };
	});
}

function normalizeRegisteredUsers(parsed: unknown): RegisteredUser[] {
	if (!Array.isArray(parsed)) return [];
	const out: RegisteredUser[] = [];
	for (const row of parsed) {
		if (!row || typeof row !== 'object') continue;
		const v = row as Record<string, unknown>;
		if (typeof v.id !== 'string' || typeof v.name !== 'string') continue;
		const assignedSlot =
			v.assignedSlot === 'submitter' || v.assignedSlot === 'reviewer1' || v.assignedSlot === 'reviewer2'
				? v.assignedSlot
				: null;
		out.push({
			id: v.id,
			name: v.name.trim(),
			joinedAt: typeof v.joinedAt === 'string' ? v.joinedAt : new Date().toISOString(),
			lastSeenAt: typeof v.lastSeenAt === 'string' ? v.lastSeenAt : new Date().toISOString(),
			assignedSlot,
			assignedAt: typeof v.assignedAt === 'string' ? v.assignedAt : null,
			assignedBy: typeof v.assignedBy === 'string' ? v.assignedBy : null,
			isAdmin: Boolean(v.isAdmin)
		});
	}
	return out.filter((x) => x.name.length > 0);
}

function slotToRole(slot: AdminSlot): Role {
	if (slot === 'submitter') return 'sandra';
	if (slot === 'reviewer1') return 'jane';
	return 'joe';
}

function roleForUserName(users: RegisteredUser[], name: string): Role | null {
	const who = users.find((x) => x.name.toLowerCase() === name.toLowerCase());
	if (!who?.assignedSlot) return null;
	return slotToRole(who.assignedSlot);
}

function slotForUserName(users: RegisteredUser[], name: string): AdminSlot | null {
	const who = users.find((x) => x.name.toLowerCase() === name.toLowerCase());
	return who?.assignedSlot ?? null;
}

function slotLabel(slot: AdminSlot | null): string {
	if (!slot) return 'Unassigned';
	if (slot === 'submitter') return 'Submitter';
	if (slot === 'reviewer1') return 'Reviewer 1';
	return 'Reviewer 2';
}

export function slotLabelText(slot: AdminSlot | null): string {
	return slotLabel(slot);
}

function ensureRegisteredParticipant(name: string, nowIso = new Date().toISOString()) {
	const normalized = name.trim();
	if (!normalized) return;
	const idx = data.registeredUsers.findIndex((x) => x.name.toLowerCase() === normalized.toLowerCase());
	if (idx >= 0) {
		data.registeredUsers[idx].name = normalized;
		data.registeredUsers[idx].lastSeenAt = nowIso;
		data.registeredUsers[idx].isAdmin = false;
		debugLog('participant_updated', { name: normalized, id: data.registeredUsers[idx].id });
		return;
	}
	data.registeredUsers.push({
		id: uid(),
		name: normalized,
		joinedAt: nowIso,
		lastSeenAt: nowIso,
		assignedSlot: null,
		assignedAt: null,
		assignedBy: null,
		isAdmin: false
	});
	debugLog('participant_created', { name: normalized });
}

function applySnapshotPatch(p: Partial<Snapshot>, preserveSession = true) {
	const base = createInitialSnapshot();
	const currentSession = {
		loggedIn: data.loggedIn,
		isAdminSession: data.isAdminSession,
		currentUserName: data.currentUserName,
		role: data.role
	};
	const merged = {
		...base,
		...p,
		loggedIn: typeof p.loggedIn === 'boolean' ? p.loggedIn : base.loggedIn,
		isAdminSession: typeof p.isAdminSession === 'boolean' ? p.isAdminSession : base.isAdminSession,
		currentUserName: typeof p.currentUserName === 'string' ? p.currentUserName : base.currentUserName,
		registeredUsers: normalizeRegisteredUsers(p.registeredUsers),
		testingItems: mergeTestingFromStorage(p.testingItems),
		testingRound:
			typeof p.testingRound === 'number' && p.testingRound >= 1 ? p.testingRound : base.testingRound,
		categorySessions: mergeCategorySessions(base.categorySessions, p.categorySessions),
		reviewerRatings: p.reviewerRatings ? { ...base.reviewerRatings, ...p.reviewerRatings } : base.reviewerRatings,
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

	if (merged.loggedIn && !merged.isAdminSession && merged.currentUserName.trim()) {
		const name = merged.currentUserName.trim();
		const exists = merged.registeredUsers.some((x) => x.name.toLowerCase() === name.toLowerCase());
		if (!exists) {
			merged.registeredUsers.push({
				id: uid(),
				name,
				joinedAt: new Date().toISOString(),
				lastSeenAt: new Date().toISOString(),
				assignedSlot: null,
				assignedAt: null,
				assignedBy: null,
				isAdmin: false
			});
		}
	}

	if (preserveSession) {
		data.loggedIn = currentSession.loggedIn;
		data.isAdminSession = currentSession.isAdminSession;
		data.currentUserName = currentSession.currentUserName;
		data.role = currentSession.role;
	} else {
		data.loggedIn = merged.loggedIn;
		data.isAdminSession = merged.isAdminSession;
		data.currentUserName = merged.currentUserName;
		data.role = merged.role;
	}
	data.registeredUsers = merged.registeredUsers;
	data.phase = merged.phase;
	data.projectStarted = merged.projectStarted;
	data.submittedForReview = merged.submittedForReview;
	data.testingItems = merged.testingItems;
	data.testingRound = merged.testingRound;
	data.categorySessions = merged.categorySessions;
	data.standupItems = merged.standupItems;
	data.standupWhen = merged.standupWhen;
	data.standupVoiceChannel = merged.standupVoiceChannel;
	data.standupTakeaways = merged.standupTakeaways;
	data.sandraRatings = merged.sandraRatings;
	data.reviewerRatings = merged.reviewerRatings;
	data.xpMock = merged.xpMock;
	data.leaderboardNote = merged.leaderboardNote;
	data.reviewerAssignmentAccepted = merged.reviewerAssignmentAccepted;
	data.latestSubmission = merged.latestSubmission ?? null;

	if (
		preserveSession &&
		currentSession.loggedIn &&
		!currentSession.isAdminSession &&
		currentSession.currentUserName.trim()
	) {
		const mappedRole = roleForUserName(merged.registeredUsers, currentSession.currentUserName);
		if (mappedRole && mappedRole !== currentSession.role) {
			data.role = mappedRole;
			const slot = slotForUserName(merged.registeredUsers, currentSession.currentUserName);
			pushToast(`Great news! You were assigned as ${slotLabel(slot)}.`);
		}
	}
}

function createSnapshotFromData(): Snapshot {
	return {
		loggedIn: false,
		isAdminSession: false,
		currentUserName: '',
		registeredUsers: data.registeredUsers,
		role: 'sandra',
		phase: data.phase,
		projectStarted: data.projectStarted,
		submittedForReview: data.submittedForReview,
		codeReviewRound: data.codeReviewRound,
		testingRound: data.testingRound,
		testingItems: data.testingItems,
		categorySessions: data.categorySessions,
		standupItems: data.standupItems,
		standupWhen: data.standupWhen,
		standupVoiceChannel: data.standupVoiceChannel,
		standupTakeaways: data.standupTakeaways,
		sandraRatings: data.sandraRatings,
		reviewerRatings: data.reviewerRatings,
		xpMock: data.xpMock,
		leaderboardNote: data.leaderboardNote,
		reviewerAssignmentAccepted: data.reviewerAssignmentAccepted,
		latestSubmission: data.latestSubmission
	};
}

function load(): Snapshot {
	return createInitialSnapshot();
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
	if (data.isAdminSession) return;
	data.role = role;
}

export function loginWithName(name: string) {
	const normalized = name.trim();
	if (!normalized) return;
	const nowIso = new Date().toISOString();
	const isAdmin = normalized.toLowerCase() === 'admin';
	data.currentUserName = normalized;
	data.loggedIn = true;
	data.isAdminSession = isAdmin;

	if (!isAdmin) {
		ensureRegisteredParticipant(normalized, nowIso);
		const mappedRole = roleForUserName(data.registeredUsers, normalized);
		if (mappedRole) {
			data.role = mappedRole;
		}
		// Persist participant registration immediately for cross-tab/browser visibility.
		void persistAppStateToServer();
	}
	debugLog('login_with_name', {
		name: normalized,
		isAdmin,
		registeredUsers: data.registeredUsers.map((x) => ({
			id: x.id,
			name: x.name,
			isAdmin: x.isAdmin,
			assignedSlot: x.assignedSlot
		}))
	});

	pushToast(isAdmin ? 'Admin dashboard unlocked.' : `Welcome, ${normalized}.`);
}

export function logoutUser() {
	data.currentUserName = '';
	data.loggedIn = false;
	data.isAdminSession = false;
	pushToast('Logged out.');
}

export function adminParticipantList(): RegisteredUser[] {
	const list = data.registeredUsers
		.filter((x) => !x.isAdmin)
		.slice()
		.sort((a, b) => a.name.localeCompare(b.name));
	debugLog('admin_participant_list', { count: list.length, names: list.map((x) => x.name) });
	return list;
}

export const ADMIN_SLOT_OPTIONS: { id: AdminSlot; label: string }[] = [
	{ id: 'submitter', label: 'Submitter' },
	{ id: 'reviewer1', label: 'Reviewer 1' },
	{ id: 'reviewer2', label: 'Reviewer 2' }
];

export function assignedNameForSlot(slot: AdminSlot): string {
	return data.registeredUsers.find((x) => x.assignedSlot === slot)?.name ?? '';
}

export function displayNameForRole(role: Role): string {
	if (role === 'sandra') return assignedNameForSlot('submitter') || 'Submitter';
	if (role === 'jane') return assignedNameForSlot('reviewer1') || 'Reviewer 1';
	return assignedNameForSlot('reviewer2') || 'Reviewer 2';
}

export function assignedSlotForCurrentUser(): AdminSlot | null {
	const me = data.currentUserName.trim();
	if (!me) return null;
	return slotForUserName(data.registeredUsers, me);
}

export function adminAssignSlot(slot: AdminSlot, name: string) {
	if (!data.isAdminSession) return;
	const normalized = name.trim();
	for (const user of data.registeredUsers) {
		if (user.assignedSlot === slot) {
			user.assignedSlot = null;
			user.assignedAt = null;
			user.assignedBy = null;
		}
	}
	if (!normalized) return;

	const target = data.registeredUsers.find((x) => x.name.toLowerCase() === normalized.toLowerCase());
	if (!target || target.isAdmin) return;

	if (target.assignedSlot && target.assignedSlot !== slot) {
		target.assignedSlot = null;
		target.assignedAt = null;
		target.assignedBy = null;
	}
	target.assignedSlot = slot;
	target.assignedAt = new Date().toISOString();
	target.assignedBy = data.currentUserName || 'admin';
	debugLog('admin_assign_slot', { slot, name: target.name });
	pushToast(`${target.name} assigned as ${ADMIN_SLOT_OPTIONS.find((x) => x.id === slot)?.label ?? slot}.`);
	void persistAppStateToServer();
}

export function roleAssignmentsComplete(): boolean {
	return Boolean(assignedNameForSlot('submitter') && assignedNameForSlot('reviewer1') && assignedNameForSlot('reviewer2'));
}

export function roleAssignmentDetails() {
	return (['submitter', 'reviewer1', 'reviewer2'] as AdminSlot[]).map((slot) => {
		const person = data.registeredUsers.find((x) => x.assignedSlot === slot);
		return {
			slot,
			slotLabel: slotLabel(slot),
			name: person?.name ?? '',
			assignedAt: person?.assignedAt ?? null,
			assignedBy: person?.assignedBy ?? null
		};
	});
}

export function adminDebugState() {
	return {
		loggedIn: data.loggedIn,
		isAdminSession: data.isAdminSession,
		currentUserName: data.currentUserName,
		registeredUsers: data.registeredUsers.map((x) => ({
			id: x.id,
			name: x.name,
			isAdmin: x.isAdmin,
			assignedSlot: x.assignedSlot,
			assignedAt: x.assignedAt,
			assignedBy: x.assignedBy,
			joinedAt: x.joinedAt,
			lastSeenAt: x.lastSeenAt
		}))
	};
}

export async function hydrateAppStateFromServer() {
	if (!browser) return;
	try {
		const res = await fetch(APP_STATE_API_PATH);
		if (!res.ok) return;
		const payload = (await res.json()) as { snapshot?: Partial<Snapshot> };
		if (!payload.snapshot) return;
		lastServerSnapshotJson = JSON.stringify(payload.snapshot);
		applySnapshotPatch(payload.snapshot, true);
		debugLog('hydrated_from_server', { registeredCount: data.registeredUsers.length });
	} catch (err) {
		debugLog('hydrate_failed', err);
	}
}

export async function persistAppStateToServer() {
	if (!browser) return;
	try {
		const snapshot = createSnapshotFromData();
		const nextJson = JSON.stringify(snapshot);
		if (nextJson === lastServerSnapshotJson) return;
		const res = await fetch(APP_STATE_API_PATH, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ snapshot })
		});
		if (!res.ok) {
			debugLog('persist_failed_status', res.status);
			return;
		}
		lastServerSnapshotJson = nextJson;
	} catch (err) {
		debugLog('persist_failed', err);
	}
}

export function confirmStartProject() {
	data.projectStarted = true;
	data.phase = 'project_completion';
	data.reviewerAssignmentAccepted = { jane: false, joe: false };
	pushToast('Project started — complete the brief, then submit for review.');
	void persistAppStateToServer();
}

export function acceptReviewerAssignment(reviewer: 'jane' | 'joe') {
	data.reviewerAssignmentAccepted[reviewer] = true;
	pushToast(`${reviewer === 'jane' ? 'You' : 'Joe'}: assignment accepted — you can review.`);
}

export function reviewerNeedsAssignmentGate(role: Role): boolean {
	if (role !== 'jane' && role !== 'joe') return false;
	if (!data.projectStarted) return false;
	return !data.reviewerAssignmentAccepted[role];
}

export function confirmSubmitForReview() {
	data.submittedForReview = true;
	data.phase = 'testing';
	data.latestSubmission = {
		by: data.currentUserName || 'Submitter',
		at: new Date().toISOString(),
		repo: MESSENGER_REPO
	};
	const r1 = assignedNameForSlot('reviewer1') || 'Reviewer 1';
	const r2 = assignedNameForSlot('reviewer2') || 'Reviewer 2';
	pushToast(`Reviewers assigned: ${r1} and ${r2}. Testing phase unlocked.`);
	void persistAppStateToServer();
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
	data.loggedIn = fresh.loggedIn;
	data.isAdminSession = fresh.isAdminSession;
	data.currentUserName = fresh.currentUserName;
	data.registeredUsers = fresh.registeredUsers;
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
