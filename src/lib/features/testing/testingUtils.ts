import { getPersonaDisplayLabel } from '$lib/appState.svelte';
import type { TestingComment, TestingDecision } from '$lib/types';

export function verdictChipClass(d: TestingDecision) {
	if (d === 'accept') return 'bg-kood-accent/15 text-kood-accent ring-kood-accent/40';
	if (d === 'decline') return 'bg-red-500/10 text-red-300 ring-red-400/35';
	return 'bg-kood-bg text-kood-muted ring-kood-border';
}

export function verdictLabel(d: TestingDecision) {
	if (d === 'accept') return 'Accept';
	if (d === 'decline') return 'Decline';
	return 'Pending';
}

export function formatShortTimestamp(iso: string) {
	try {
		return new Date(iso).toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	} catch {
		return iso;
	}
}

export function reviewerDisplayName(author: 'jane' | 'joe' | 'sandra'): string {
	return getPersonaDisplayLabel(author);
}

export function commentAuthorLabel(a: TestingComment['author']) {
	return reviewerDisplayName(a);
}

export function formatVerdictHistoryLine(h: {
	round: number;
	jane: TestingDecision;
	joe: TestingDecision;
}): string {
	const j = getPersonaDisplayLabel('jane');
	const o = getPersonaDisplayLabel('joe');
	return `R${h.round}: ${j} ${h.jane} · ${o} ${h.joe}`;
}
