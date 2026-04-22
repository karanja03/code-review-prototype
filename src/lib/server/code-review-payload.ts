import { CATEGORIES } from '$lib/constants';
import type { CategorySession, StandupTakeawayMessage } from '$lib/types';

const STANDUP_LEN = 5;

export type StandupSnapshotPersisted = {
	standupWhen: string;
	standupVoiceChannel: string;
	standupTakeaways: string;
	standupTakeawayMessages: StandupTakeawayMessage[];
	standupItems: boolean[];
};

/** Optional standup block embedded in `code_review_json` (saved with code review workspace). */
export function parseStandupSnapshotFromCodeReviewJson(
	codeReviewJson: string | null
): StandupSnapshotPersisted | null {
	if (!codeReviewJson) return null;
	try {
		const root = JSON.parse(codeReviewJson) as Record<string, unknown>;
		const s = root.standup;
		if (!s || typeof s !== 'object') return null;
		const o = s as Record<string, unknown>;
		const items: boolean[] = [];
		if (Array.isArray(o.standupItems)) {
			for (let i = 0; i < STANDUP_LEN; i++) {
				items.push(i < o.standupItems.length ? Boolean(o.standupItems[i]) : false);
			}
		} else {
			for (let i = 0; i < STANDUP_LEN; i++) items.push(false);
		}
		const msgs: StandupTakeawayMessage[] = [];
		if (Array.isArray(o.standupTakeawayMessages)) {
			for (const x of o.standupTakeawayMessages) {
				if (!x || typeof x !== 'object') continue;
				const m = x as Record<string, unknown>;
				if (m.author !== 'sandra' && m.author !== 'jane' && m.author !== 'joe') continue;
				if (typeof m.text !== 'string' || !m.text.trim()) continue;
				msgs.push({
					id: typeof m.id === 'string' ? m.id : `m-${msgs.length}`,
					author: m.author,
					text: m.text.slice(0, 2000),
					at: typeof m.at === 'string' ? m.at : ''
				});
			}
		}
		const legacy = typeof o.standupTakeaways === 'string' ? o.standupTakeaways : '';
		if (msgs.length === 0 && legacy.trim()) {
			msgs.push({
				id: 'legacy',
				author: 'sandra',
				text: legacy.trim().slice(0, 2000),
				at: ''
			});
		}
		return {
			standupWhen: typeof o.standupWhen === 'string' ? o.standupWhen : '',
			standupVoiceChannel: typeof o.standupVoiceChannel === 'string' ? o.standupVoiceChannel : '',
			standupTakeaways: legacy,
			standupTakeawayMessages: msgs,
			standupItems: items
		};
	} catch {
		return null;
	}
}

/** Parse code review JSON from UI (legacy category map or wrapped `{ categorySessions, codeReviewRound }`). */
export function parseCodeReviewSavePayload(json: string): {
	sessions: Record<string, CategorySession>;
	codeReviewRound: number;
} | null {
	try {
		const root = JSON.parse(json) as Record<string, unknown>;
		const sessions =
			root.categorySessions && typeof root.categorySessions === 'object'
				? (root.categorySessions as Record<string, CategorySession>)
				: (root as Record<string, CategorySession>);
		if (!sessions || typeof sessions !== 'object') return null;
		if (!CATEGORIES.some((c) => c.id in sessions)) return null;
		const round =
			typeof root.codeReviewRound === 'number' && root.codeReviewRound >= 1
				? root.codeReviewRound
				: 1;
		return { sessions, codeReviewRound: round };
	} catch {
		return null;
	}
}
