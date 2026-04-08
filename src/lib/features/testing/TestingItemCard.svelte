<script lang="ts">
	import {
		getApp,
		postTestingComment,
		reviewerCommentCount,
		setTestingDraft,
		setTestingVerdict
	} from '$lib/appState.svelte';
	import type { TestingItem } from '$lib/types';
	import {
		commentAuthorLabel,
		formatShortTimestamp,
		formatVerdictHistoryLine,
		reviewerDisplayName,
		verdictChipClass,
		verdictLabel
	} from './testingUtils';

	let {
		item,
		open = false,
		onToggle
	}: {
		item: TestingItem;
		open?: boolean;
		onToggle: () => void;
	} = $props();

	const app = getApp();
	const isReviewer = $derived(app.role === 'jane' || app.role === 'joe');
	const isSandra = $derived(app.role === 'sandra');
	const self = $derived(app.role === 'jane' || app.role === 'joe' ? app.role : null);
	const peer = $derived(self === 'jane' ? 'joe' : self === 'joe' ? 'jane' : null);
	const owner = $derived(item.mandatoryOwner ?? null);
	const flagged = $derived(
		item.section === 'mandatory' && owner
			? item[owner] === 'decline'
			: item.jane === 'decline' || item.joe === 'decline'
	);
	const n = $derived(reviewerCommentCount(item));
	const canSetVerdict = $derived(
		isReviewer && self && (item.section !== 'mandatory' || !owner || owner === self)
	);
</script>

<div
	class="rounded-lg border bg-kood-surface transition-colors {flagged
		? 'border-kood-warn-border'
		: 'border-kood-border'}"
>
	<div class="flex items-start gap-2 px-3 py-2.5">
		<div class="min-w-0 flex-1">
			<div class="flex flex-wrap items-center gap-2">
				<span class="font-mono text-[10px] uppercase tracking-wide text-kood-muted">{item.id}</span>
				{#if flagged}
					<span class="text-[10px] font-semibold uppercase text-amber-400/90">Attention</span>
				{/if}
				<span class="text-[10px] text-kood-muted/70">R{app.testingRound}</span>
			</div>
			{#if open}
				<p class="mt-1 text-sm leading-relaxed text-kood-text">{item.text}</p>
			{:else}
				<p class="mt-1 line-clamp-2 text-sm text-kood-text/90">{item.text}</p>
			{/if}
		</div>
		{#if isSandra || isReviewer}
			<div
				class="shrink-0 self-start rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-kood-muted ring-1 ring-kood-border"
				title="Notes from You & Joe"
			>
				{n}
			</div>
		{/if}
		<button
			type="button"
			class="mt-0.5 shrink-0 p-1 text-kood-muted hover:text-kood-text"
			aria-expanded={open}
			aria-label={open ? 'Collapse row' : 'Expand row'}
			onclick={onToggle}
		>
			<svg
				class="size-3.5 transition-transform duration-150 {open ? 'rotate-90' : ''}"
				viewBox="0 0 12 12"
				fill="none"
				stroke="currentColor"
				stroke-width="1.25"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M4.5 2.5 7.5 6l-3 3.5" />
			</svg>
		</button>
	</div>

	<div
		class="flex flex-wrap items-center gap-2 border-t border-kood-border px-3 py-2 text-xs"
		role="group"
		aria-label="Verdicts and quick actions"
	>
		{#if item.section === 'mandatory' && owner}
			{#if (item[owner] === 'accept' || item[owner] === 'decline') && !canSetVerdict}
				<span class="rounded px-2 py-0.5 ring-1 {verdictChipClass(item[owner])}"
					>{verdictLabel(item[owner])}</span
				>
			{/if}
		{:else}
			{#if item.jane === 'accept' || item.jane === 'decline'}
				{#if !(isReviewer && self === 'jane' && canSetVerdict)}
					<span class="rounded px-2 py-0.5 ring-1 {verdictChipClass(item.jane)}"
						>You · {verdictLabel(item.jane)}</span
					>
				{/if}
			{/if}
			{#if item.joe === 'accept' || item.joe === 'decline'}
				{#if !(isReviewer && self === 'joe' && canSetVerdict)}
					<span class="rounded px-2 py-0.5 ring-1 {verdictChipClass(item.joe)}"
						>Joe · {verdictLabel(item.joe)}</span
					>
				{/if}
			{/if}
		{/if}
		{#if canSetVerdict}
			<div class="ml-auto flex flex-wrap gap-1">
				<button
					type="button"
					class="rounded px-2 py-0.5 text-[11px] font-medium {item[self!] === 'decline'
						? 'bg-red-500/15 text-red-300 ring-1 ring-red-400/35'
						: 'bg-kood-bg text-kood-text/80 ring-1 ring-kood-border hover:bg-kood-surface-raised'}"
					onclick={() => setTestingVerdict(item.id, self!, 'decline')}>Decline</button
				>
				<button
					type="button"
					class="rounded px-2 py-0.5 text-[11px] font-medium {item[self!] === 'accept'
						? 'bg-kood-accent/20 text-kood-accent ring-1 ring-kood-accent/40'
						: 'bg-kood-bg text-kood-text/80 ring-1 ring-kood-border hover:bg-kood-surface-raised'}"
					onclick={() => setTestingVerdict(item.id, self!, 'accept')}>Accept</button
				>
			</div>
		{:else if isReviewer && self && item.section === 'mandatory' && owner && owner !== self}
			<p class="ml-auto max-w-[14rem] text-right text-[11px] text-kood-muted">
				Read-only verdict here — expand to comment in the thread.
			</p>
		{/if}
		{#if isSandra && !open}
			<p class="ml-auto text-[11px] text-kood-muted">Expand for thread</p>
		{/if}
	</div>

	{#if open}
		<div class="space-y-3 border-t border-kood-border px-3 pb-3 pt-2.5">
			{#if isReviewer && self && peer}
				{#if item.section === 'mandatory' && owner}
					{#if owner === self}
						<p class="text-[11px] text-kood-muted">
							The other reviewer can read and comment; they do not set a verdict on this row.
						</p>
					{:else}
						<p class="text-[11px] text-kood-muted">
							Verdict is read-only for you here. Notes in the thread still help the submitter.
						</p>
					{/if}
				{:else if item[peer] === 'accept' || item[peer] === 'decline'}
					<p class="text-[11px] text-kood-muted">
						{reviewerDisplayName(peer)}: {verdictLabel(item[peer])} (read-only)
					</p>
				{/if}
			{/if}

			{#if isSandra}
				<p class="text-xs text-kood-muted">
					Read-only verdicts — reply in the thread; reviewers see updates by round.
				</p>
			{/if}

			<div>
				<p class="text-[11px] font-medium uppercase tracking-wide text-kood-muted">Thread</p>
				{#if item.comments.length === 0}
					<p class="mt-1.5 text-xs text-kood-muted/80">No notes yet.</p>
				{:else}
					<ul class="mt-1.5 max-h-36 space-y-1.5 overflow-y-auto text-xs">
						{#each item.comments as c (c.id)}
							<li class="rounded-md border border-kood-border bg-kood-bg px-2.5 py-1.5">
								<div class="flex flex-wrap justify-between gap-1 text-[10px] text-kood-muted">
									<span class="font-medium text-kood-text/80">{commentAuthorLabel(c.author)}</span>
									<span>R{c.round} · {formatShortTimestamp(c.at)}</span>
								</div>
								<p class="mt-0.5 whitespace-pre-wrap text-kood-text/90">{c.text}</p>
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			{#if isReviewer && self}
				<div>
					<label class="text-[11px] text-kood-muted" for="d-{item.id}">Comment</label>
					<div class="relative mt-1">
						<textarea
							id="d-{item.id}"
							rows="2"
							class="min-h-[4.5rem] w-full resize-y rounded-md border border-kood-border bg-kood-bg py-2 pl-2.5 pr-11 pb-9 text-sm text-kood-text placeholder:text-kood-muted/60"
							placeholder="Findings, required vs optional…"
							value={item.drafts[self] ?? ''}
							oninput={(e) =>
								setTestingDraft(item.id, self, (e.currentTarget as HTMLTextAreaElement).value)}
						></textarea>
						<button
							type="button"
							class="absolute bottom-2 right-2 rounded-md p-2 text-kood-accent hover:bg-kood-accent/10 disabled:pointer-events-none disabled:opacity-35"
							aria-label="Send comment"
							disabled={!(item.drafts[self]?.trim())}
							onclick={() => postTestingComment(item.id)}
						>
							<svg
								class="size-[18px]"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path d="m22 2-7 20-4-9-9-4Z" />
								<path d="M22 2 11 13" />
							</svg>
						</button>
					</div>
				</div>
			{/if}

			{#if isSandra}
				<div>
					<label class="text-[11px] text-kood-muted" for="s-{item.id}">Reply</label>
					<div class="relative mt-1">
						<textarea
							id="s-{item.id}"
							rows="2"
							class="min-h-[4.5rem] w-full resize-y rounded-md border border-kood-border bg-kood-bg py-2 pl-2.5 pr-11 pb-9 text-sm text-kood-text placeholder:text-kood-muted/60"
							placeholder="What changed, how to verify…"
							value={item.drafts.sandra ?? ''}
							oninput={(e) =>
								setTestingDraft(item.id, 'sandra', (e.currentTarget as HTMLTextAreaElement).value)}
						></textarea>
						<button
							type="button"
							class="absolute bottom-2 right-2 rounded-md p-2 text-kood-accent hover:bg-kood-accent/15 disabled:pointer-events-none disabled:opacity-35"
							aria-label="Send reply"
							disabled={!(item.drafts.sandra?.trim())}
							onclick={() => postTestingComment(item.id)}
						>
							<svg
								class="size-[18px]"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path d="m22 2-7 20-4-9-9-4Z" />
								<path d="M22 2 11 13" />
							</svg>
						</button>
					</div>
				</div>
			{/if}

			{#if item.verdictHistory.length > 0}
				<details class="text-xs text-kood-muted">
					<summary class="cursor-pointer text-kood-text/70">Past rounds ({item.verdictHistory.length})</summary>
					<ul class="mt-1.5 space-y-1">
						{#each [...item.verdictHistory].reverse() as h, i (i)}
							<li class="rounded bg-kood-bg px-2 py-1 font-mono text-[10px] text-kood-muted">
								{formatVerdictHistoryLine(h)}
							</li>
						{/each}
					</ul>
				</details>
			{/if}

			<button
				type="button"
				class="text-[11px] text-kood-muted hover:text-kood-text"
				onclick={onToggle}>Collapse</button
			>
		</div>
	{/if}
</div>
