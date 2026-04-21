import { CATEGORIES } from '$lib/constants';
import type { CategorySession, TestingItem } from '$lib/types';

export type AuditPersona = 'sandra' | 'jane' | 'joe';

export type AuditThreadEntry = {
	context: string;
	authorLabel: string;
	/** Present when the author maps to Submitter / Reviewer 1 / Reviewer 2 (for admin styling). */
	authorPersona?: AuditPersona;
	round?: number;
	at: string;
	text: string;
};

export type GroupedAuditThread = {
	context: string;
	messages: AuditThreadEntry[];
};

/** Map stored author string to a known persona, if any. */
export function normalizeAuditPersona(author: string): AuditPersona | undefined {
	if (author === 'sandra' || author === 'jane' || author === 'joe') return author;
	return undefined;
}

function messageSortKey(m: AuditThreadEntry): number {
	const round = m.round ?? 0;
	const t = Date.parse(m.at);
	const time = Number.isFinite(t) ? t : 0;
	return round * 1e15 + time;
}

/**
 * One card per checklist row / observation: messages ordered by round then time.
 * Groups ordered by the earliest message in each thread.
 */
export function groupAuditThreads(entries: AuditThreadEntry[]): GroupedAuditThread[] {
	const byContext = new Map<string, AuditThreadEntry[]>();
	for (const e of entries) {
		const list = byContext.get(e.context);
		if (list) list.push(e);
		else byContext.set(e.context, [e]);
	}
	const groups: GroupedAuditThread[] = [];
	for (const [context, messages] of byContext) {
		messages.sort((a, b) => messageSortKey(a) - messageSortKey(b));
		groups.push({ context, messages });
	}
	groups.sort((a, b) => {
		const ta = a.messages[0] ? messageSortKey(a.messages[0]) : 0;
		const tb = b.messages[0] ? messageSortKey(b.messages[0]) : 0;
		return ta - tb;
	});
	return groups;
}

export function personaDisplayName(author: string): string {
	if (author === 'sandra') return 'Submitter';
	if (author === 'jane') return 'Reviewer 1';
	if (author === 'joe') return 'Reviewer 2';
	return author;
}

function truncate(s: string, n: number): string {
	if (s.length <= n) return s;
	return `${s.slice(0, n)}…`;
}

/** Flatten saved Testing checklist comment threads for admin audit. */
export function auditTestingThreads(testingJson: string | null): AuditThreadEntry[] {
	const out: AuditThreadEntry[] = [];
	if (!testingJson) return out;
	try {
		const doc = JSON.parse(testingJson) as { testingItems?: TestingItem[] };
		const items = doc.testingItems;
		if (!Array.isArray(items)) return out;
		for (const item of items) {
			if (!item?.id || !Array.isArray(item.comments)) continue;
			const prefix = item.section === 'mandatory' ? 'Testing · mandatory' : 'Testing · extra';
			const snippet = truncate(typeof item.text === 'string' ? item.text : item.id, 80);
			for (const c of item.comments) {
				if (!c || typeof c.text !== 'string') continue;
				const raw = String(c.author);
				out.push({
					context: `${prefix} · ${item.id} — ${snippet}`,
					authorLabel: personaDisplayName(raw),
					authorPersona: normalizeAuditPersona(raw),
					round: typeof c.round === 'number' ? c.round : undefined,
					at: typeof c.at === 'string' ? c.at : '',
					text: c.text
				});
			}
		}
	} catch {
		/* invalid JSON */
	}
	return out;
}

/** Flatten saved code-review observation comment threads for admin audit. */
export function auditCodeReviewThreads(codeReviewJson: string | null): AuditThreadEntry[] {
	const out: AuditThreadEntry[] = [];
	if (!codeReviewJson) return out;
	try {
		const root = JSON.parse(codeReviewJson) as Record<string, unknown>;
		const sessions =
			root.categorySessions && typeof root.categorySessions === 'object'
				? (root.categorySessions as Record<string, CategorySession>)
				: (root as Record<string, CategorySession>);
		if (!sessions || typeof sessions !== 'object') return out;
		for (const cat of CATEGORIES) {
			const s = sessions[cat.id];
			if (!s?.observationRows) continue;
			for (const o of cat.observations) {
				const row = s.observationRows[o.id];
				if (!row || !Array.isArray(row.comments)) continue;
				const obsSnippet = truncate(o.text, 72);
				for (const c of row.comments) {
					if (!c || typeof c.text !== 'string') continue;
					const raw = String(c.author);
					out.push({
						context: `Code review · ${cat.title} · ${o.id} — ${obsSnippet}`,
						authorLabel: personaDisplayName(raw),
						authorPersona: normalizeAuditPersona(raw),
						round: typeof c.round === 'number' ? c.round : undefined,
						at: typeof c.at === 'string' ? c.at : '',
						text: c.text
					});
				}
			}
		}
	} catch {
		/* invalid JSON */
	}
	return out;
}
