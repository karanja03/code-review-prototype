import { CATEGORIES } from '$lib/constants';
import type {
	CategorySession,
	CodeReviewObservationRowState,
	CodeReviewVerdictSnapshot,
	TestingComment,
	TestingItem,
	TestingVerdictSnapshot
} from '$lib/types';

const T0 = '2026-03-10T09:00:00.000Z';
const T1 = '2026-03-10T09:25:00.000Z';
const T2 = '2026-03-10T11:00:00.000Z';
const T3 = '2026-03-10T14:00:00.000Z';
const T4 = '2026-03-10T16:30:00.000Z';
const T5 = '2026-03-11T09:00:00.000Z';
const T6 = '2026-03-11T11:00:00.000Z';
const T7 = '2026-03-11T15:00:00.000Z';
const T8 = '2026-03-12T10:00:00.000Z';
const T9 = '2026-03-12T11:15:00.000Z';
const T10 = '2026-03-12T13:00:00.000Z';
const T11 = '2026-03-13T09:30:00.000Z';
const T12 = '2026-03-13T14:00:00.000Z';
const T13 = '2026-03-14T10:00:00.000Z';
const T14 = '2026-03-14T10:45:00.000Z';

/** Joe’s bucket: all accepted; m19 + m20 show Joe declining then Sandra fixing until accept. You (Jane) still has work. */
export function seedTestingItemsForYouJoeDemo(items: TestingItem[]): TestingItem[] {
	return items.map((item) => {
		if (item.section !== 'mandatory' || !item.mandatoryOwner) {
			return { ...item };
		}
		if (item.mandatoryOwner === 'joe') {
			if (item.id === 'm19') {
				const verdictHistory: TestingVerdictSnapshot[] = [
					{ round: 1, jane: 'pending', joe: 'decline' },
					{ round: 2, jane: 'pending', joe: 'decline' },
					{ round: 3, jane: 'pending', joe: 'accept' }
				];
				const comments: TestingComment[] = [
					{
						id: 'seed-m19-1',
						round: 1,
						author: 'joe',
						text: 'Declined: archiving a chat removes it from the list, but after a cold start it reappears as if never archived. That breaks the “archive” story in the brief.',
						at: T9
					},
					{
						id: 'seed-m19-2',
						round: 1,
						author: 'sandra',
						text: 'Reproduced — we were only hiding archived threads in memory. Persisted archived ids in local store + sync on launch. Build 39.',
						at: T10
					},
					{
						id: 'seed-m19-3',
						round: 2,
						author: 'joe',
						text: 'Better. Unarchive still leaves the thread pinned to the old sort position until I navigate away — looks like stale list state.',
						at: T11
					},
					{
						id: 'seed-m19-4',
						round: 2,
						author: 'sandra',
						text: 'Fixed: unarchive now triggers a full list refresh + re-sort by last activity. Added a widget test for the ordering.',
						at: T12
					},
					{
						id: 'seed-m19-5',
						round: 3,
						author: 'joe',
						text: 'Checked cold start, kill app, and multi-device — archive/unarchive behaves. Accepting.',
						at: T13
					},
					{
						id: 'seed-m19-6',
						round: 3,
						author: 'sandra',
						text: 'Thanks for sticking with the edge cases — shout if anything regresses.',
						at: T14
					}
				];
				return {
					...item,
					jane: 'pending',
					joe: 'accept',
					verdictHistory,
					comments,
					drafts: { ...item.drafts }
				};
			}
			if (item.id === 'm20') {
				const verdictHistory: TestingVerdictSnapshot[] = [
					{ round: 1, jane: 'pending', joe: 'decline' },
					{ round: 2, jane: 'pending', joe: 'decline' },
					{ round: 3, jane: 'pending', joe: 'decline' },
					{ round: 4, jane: 'pending', joe: 'accept' }
				];
				const comments: TestingComment[] = [
					{
						id: 'seed-m20-1',
						round: 1,
						author: 'joe',
						text: 'Declined for now: sent messages don’t show a clear “delivered” state in the UI on slow networks — looks stuck on “sending”. Please align with spec (sent + delivered).',
						at: T1
					},
					{
						id: 'seed-m20-2',
						round: 1,
						author: 'sandra',
						text: 'Thanks — I reproduced on throttled LTE. Added queued + sent + delivered badges and a timeout toast. Pushed build 42.',
						at: T2
					},
					{
						id: 'seed-m20-3',
						round: 2,
						author: 'joe',
						text: 'Better, but delivered still flickers when the other user is offline — it briefly shows failed then delivered. Can we stabilise that?',
						at: T3
					},
					{
						id: 'seed-m20-4',
						round: 2,
						author: 'sandra',
						text: 'Fixed ordering: we now hold “delivered” until ACK, no intermediate failure flash. Screenshots in thread on Discord.',
						at: T4
					},
					{
						id: 'seed-m20-5',
						round: 3,
						author: 'joe',
						text: 'One more edge case: editing a message after send resets the delivery tick — looks like a new message. Should keep continuity.',
						at: T5
					},
					{
						id: 'seed-m20-6',
						round: 3,
						author: 'sandra',
						text: 'Good catch. Edits now preserve message id for delivery state; added regression test. Build 44.',
						at: T6
					},
					{
						id: 'seed-m20-7',
						round: 4,
						author: 'joe',
						text: 'Verified on two devices + airplane-mode toggles. Accepting — nice work.',
						at: T7
					},
					{
						id: 'seed-m20-8',
						round: 4,
						author: 'sandra',
						text: 'Appreciate the thorough pass. Shout if anything regresses in the next round.',
						at: T8
					}
				];
				return {
					...item,
					jane: 'pending',
					joe: 'accept',
					verdictHistory,
					comments,
					drafts: { ...item.drafts }
				};
			}
			return {
				...item,
				jane: 'pending',
				joe: 'accept',
				verdictHistory: [],
				comments: [],
				drafts: { ...item.drafts }
			};
		}
		return {
			...item,
			jane: 'pending',
			joe: 'pending',
			verdictHistory: [],
			comments: [],
			drafts: { ...item.drafts }
		};
	});
}

function richReadabilityR1(): CodeReviewObservationRowState {
	const verdictHistory: CodeReviewVerdictSnapshot[] = [
		{ round: 1, jane: 'pending', joe: 'decline' },
		{ round: 2, jane: 'pending', joe: 'decline' },
		{ round: 3, jane: 'pending', joe: 'decline' },
		{ round: 4, jane: 'pending', joe: 'accept' }
	];
	const comments = [
		{
			id: 'seed-cr-r1-1',
			round: 1,
			author: 'joe' as const,
			text: 'This reads okay at a glance, but the main chat flow still has a 200-line widget with mixed concerns — hard to review. Can we split layout vs state?',
			at: T1
		},
		{
			id: 'seed-cr-r1-2',
			round: 1,
			author: 'sandra' as const,
			text: 'Split into ChatScreen + ChatBody + composer hook; no behaviour change. PR linked in standup notes.',
			at: T2
		},
		{
			id: 'seed-cr-r1-3',
			round: 2,
			author: 'joe' as const,
			text: 'Structure is better. Naming still leaks implementation (FooManager2). Prefer intent-based names per our checklist.',
			at: T3
		},
		{
			id: 'seed-cr-r1-4',
			round: 2,
			author: 'sandra' as const,
			text: 'Renamed to match domain language (ConversationList, MessageComposer). Updated tests.',
			at: T4
		},
		{
			id: 'seed-cr-r1-5',
			round: 3,
			author: 'joe' as const,
			text: 'Almost there — one private helper is doing network + parsing. Boundary should be at the repository.',
			at: T5
		},
		{
			id: 'seed-cr-r1-6',
			round: 3,
			author: 'sandra' as const,
			text: 'Moved parsing into ChatRepository; widget only maps view state. Added unit test for mapper.',
			at: T6
		},
		{
			id: 'seed-cr-r1-7',
			round: 4,
			author: 'joe' as const,
			text: 'Reads clean now. Accepting this observation.',
			at: T7
		},
		{
			id: 'seed-cr-r1-8',
			round: 4,
			author: 'sandra' as const,
			text: 'Thanks for the iterative feedback — helps keep the refactor honest.',
			at: T8
		}
	];
	return {
		jane: 'pending',
		joe: 'accept',
		comments,
		drafts: {},
		verdictHistory
	};
}

/** Joe’s code-review categories: all observations accepted; readability r1 has full thread. Your (Jane) categories stay pending. */
export function seedCategorySessionsForJoeDemo(
	sessions: Record<string, CategorySession>
): Record<string, CategorySession> {
	const out: Record<string, CategorySession> = JSON.parse(JSON.stringify(sessions));
	for (const c of CATEGORIES) {
		if (c.assignee !== 'joe') continue;
		const s = out[c.id];
		if (!s?.observationRows) continue;
		for (const o of c.observations) {
			if (c.id === 'readability' && o.id === 'r1') {
				s.observationRows[o.id] = richReadabilityR1();
			} else {
				s.observationRows[o.id] = {
					jane: 'pending',
					joe: 'accept',
					comments: [],
					drafts: {},
					verdictHistory: []
				};
			}
		}
	}
	return out;
}
