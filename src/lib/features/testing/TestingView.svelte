<script lang="ts">
	import type { TestingItem } from '$lib/types';
	import {
		allMandatoryDoubleAccepted,
		getApp,
		goToCodeReview,
		mandatoryItems,
		mandatoryOwnedAcceptedCount,
		mandatoryOwnerAccepted,
		mandatoryProgressForReviewer,
		sandraStartNewTestingRound
	} from '$lib/appState.svelte';
	import TestingItemCard from './TestingItemCard.svelte';

	const MANDATORY_PAGE_SIZE = 5;

	type MandatoryFilter = 'jane_owned' | 'joe_owned';

	const app = getApp();
	const isReviewer = $derived(app.role === 'jane' || app.role === 'joe');
	const isSandra = $derived(app.role === 'sandra');

	let expanded = $state<Record<string, boolean>>({});

	let mandatoryPage = $state(0);

	let mandatoryFilter = $state<MandatoryFilter>(
		app.role === 'joe' ? 'joe_owned' : 'jane_owned'
	);

	$effect(() => {
		const r = app.role;
		if (r === 'jane') mandatoryFilter = 'jane_owned';
		else if (r === 'joe') mandatoryFilter = 'joe_owned';
		else mandatoryFilter = 'jane_owned';
	});

	const mandatoryList = $derived(mandatoryItems());
	const allIds = $derived(mandatoryList.map((i) => i.id));

	const mandatoryFiltered = $derived(
		mandatoryFilter === 'jane_owned'
			? mandatoryList.filter((t) => t.mandatoryOwner === 'jane')
			: mandatoryList.filter((t) => t.mandatoryOwner === 'joe')
	);

	const janeProg = $derived(mandatoryProgressForReviewer('jane'));
	const joeProg = $derived(mandatoryProgressForReviewer('joe'));

	const janePct = $derived(
		janeProg.owned === 0 ? 0 : Math.round((janeProg.accepted / janeProg.owned) * 100)
	);
	const joePct = $derived(
		joeProg.owned === 0 ? 0 : Math.round((joeProg.accepted / joeProg.owned) * 100)
	);

	const mandatoryPageCount = $derived(
		Math.max(1, Math.ceil(mandatoryFiltered.length / MANDATORY_PAGE_SIZE))
	);
	const mandatoryPageSafe = $derived(Math.min(mandatoryPage, mandatoryPageCount - 1));
	const mandatorySlice = $derived(
		mandatoryFiltered.slice(
			mandatoryPageSafe * MANDATORY_PAGE_SIZE,
			mandatoryPageSafe * MANDATORY_PAGE_SIZE + MANDATORY_PAGE_SIZE
		)
	);

	const totalMandatoryPct = $derived(
		mandatoryList.length === 0
			? 0
			: Math.round((mandatoryOwnedAcceptedCount() / mandatoryList.length) * 100)
	);

	function pageChunkFullyAccepted(items: TestingItem[], pageIdx: number): boolean {
		const start = pageIdx * MANDATORY_PAGE_SIZE;
		const chunk = items.slice(start, start + MANDATORY_PAGE_SIZE);
		return chunk.length > 0 && chunk.every(mandatoryOwnerAccepted);
	}

	const mandatoryPageDone = $derived(
		Array.from({ length: mandatoryPageCount }, (_, i) => pageChunkFullyAccepted(mandatoryFiltered, i))
	);

	function isOpen(id: string) {
		return expanded[id] === true;
	}

	function toggle(id: string) {
		expanded = { ...expanded, [id]: !isOpen(id) };
	}

	function expandAll() {
		const next: Record<string, boolean> = { ...expanded };
		for (const id of allIds) next[id] = true;
		expanded = next;
	}

	function collapseAll() {
		expanded = {};
	}

	function setMandatoryPage(n: number) {
		mandatoryPage = Math.max(0, Math.min(n, mandatoryPageCount - 1));
	}

	function setFilter(f: MandatoryFilter) {
		mandatoryFilter = f;
		mandatoryPage = 0;
	}
</script>

<div class="mx-auto max-w-5xl space-y-6">
	<header>
		<h2 class="text-2xl font-semibold text-kood-text">Testing</h2>
		<p class="mt-3 text-sm leading-relaxed text-kood-muted">
			Mandatory checks are <strong class="text-kood-text/90">split between Jane and Joe</strong> — each row has one
			owner who Accepts/Declines; the other reviewer reads along and can comment. Progress below always reflects the
			<strong class="text-kood-text/90">full</strong> mandatory list.
		</p>
	</header>

	{#if isReviewer}
		<section class="rounded-lg border border-kood-border bg-kood-surface p-5">
			<h3 class="text-sm font-semibold text-kood-text">How to do testing?</h3>
			<ol class="mt-3 list-decimal space-y-2 pl-5 text-sm text-kood-muted">
				<li>Clone the repository, then build and run the submitted code.</li>
				<li>
					<strong class="text-kood-text/90">Mandatory split is assigned in the UI</strong> — focus on your owned rows;
					watch the peer’s tab to stay aligned.
				</li>
				<li>Test functionality and check compliance with the requirements.</li>
				<li>Provide feedback in the group chat and request fixes if necessary.</li>
				<li>Clearly state what changes are mandatory and what are optional fixes.</li>
				<li>Repeat the cycle after submitters make changes as many times as needed.</li>
			</ol>
		</section>
	{/if}

	<section
		class="rounded-lg border border-kood-border bg-kood-surface p-4"
		aria-label="Mandatory checklist progress"
	>
		<p class="text-xs font-semibold uppercase tracking-wide text-kood-muted">Team · mandatory completion</p>
		<p class="mt-1 text-sm text-kood-text">
			<strong class="text-kood-accent">{mandatoryOwnedAcceptedCount()}</strong>
			<span class="text-kood-muted"> / {mandatoryList.length}</span>
			<span class="text-kood-muted"> rows accepted by their assigned reviewer</span>
		</p>
		<div class="mt-2 h-3 overflow-hidden rounded-full bg-kood-bg ring-1 ring-kood-border/60">
			<div
				class="h-full rounded-full bg-kood-accent transition-[width] duration-300"
				style="width: {totalMandatoryPct}%"
			></div>
		</div>
		<p class="mt-1 text-right text-[11px] font-medium text-kood-muted">{totalMandatoryPct}% of mandatory scope done</p>

		<div class="mt-5 grid gap-4 sm:grid-cols-2">
			<div>
				<div class="flex items-center justify-between text-xs">
					<span class="font-medium text-kood-text">Jane’s bucket</span>
					<span class="text-kood-muted">{janeProg.accepted}/{janeProg.owned}</span>
				</div>
				<div class="mt-1.5 h-2 overflow-hidden rounded-full bg-kood-bg">
					<div
						class="h-full rounded-full bg-kood-accent/70 transition-[width] duration-300"
						style="width: {janePct}%"
					></div>
				</div>
			</div>
			<div>
				<div class="flex items-center justify-between text-xs">
					<span class="font-medium text-kood-text">Joe’s bucket</span>
					<span class="text-kood-muted">{joeProg.accepted}/{joeProg.owned}</span>
				</div>
				<div class="mt-1.5 h-2 overflow-hidden rounded-full bg-kood-bg">
					<div
						class="h-full rounded-full bg-kood-text/25 transition-[width] duration-300"
						style="width: {joePct}%"
					></div>
				</div>
			</div>
		</div>

		<p class="mt-4 text-[11px] leading-relaxed text-kood-muted">
			Pagination only changes which cards you see. The bars above always count <strong class="text-kood-text/80"
				>every</strong
			> mandatory row — you can’t finish the phase until both buckets reach their totals.
		</p>
	</section>

	<div
		class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-kood-border bg-kood-surface px-3 py-2"
	>
		<p class="text-xs text-kood-muted">
			Chevron to expand is on the <strong class="text-kood-text/80">right</strong> of each row.
		</p>
		<div class="flex flex-wrap gap-2">
			<button
				type="button"
				class="rounded-md border border-kood-border px-2.5 py-1 text-xs text-kood-text/90 hover:bg-kood-surface-raised"
				onclick={expandAll}>Expand all</button
			>
			<button
				type="button"
				class="rounded-md border border-kood-border px-2.5 py-1 text-xs text-kood-text/90 hover:bg-kood-surface-raised"
				onclick={collapseAll}>Collapse all</button
			>
		</div>
	</div>

	{#if isSandra}
		<div
			class="rounded-lg border border-kood-border bg-kood-surface px-4 py-3 text-sm text-kood-text/90"
			role="status"
		>
			<strong class="text-kood-text">Submitter:</strong> read-only verdicts; expand a row for the full thread. Use
			<strong class="text-kood-text">Start new testing round</strong> after fixes.
		</div>
	{:else if isReviewer}
		<div
			class="rounded-lg border border-kood-accent/25 bg-kood-accent/5 px-4 py-3 text-sm text-kood-text/90"
			role="status"
		>
			<strong class="text-kood-text">{app.role === 'jane' ? 'Jane' : 'Joe'}:</strong> Accept/Decline only on rows
			marked for you. Open the <strong class="text-kood-text/90">Peer</strong> tab to see the other reviewer’s scope
			(read-only verdicts; you can still comment).
		</div>
	{/if}

	<section>
		<div class="mb-3 flex flex-wrap items-end justify-between gap-2">
			<h3 class="text-lg font-semibold text-kood-text">Mandatory</h3>
			<p class="text-xs text-kood-muted">
				{mandatoryList.length} checks · first {janeProg.owned} owned by Jane, remaining {joeProg.owned} by Joe
			</p>
		</div>

		<div class="mb-3 flex flex-wrap gap-2" role="tablist" aria-label="Jane’s vs Joe’s mandatory checks">
			<button
				type="button"
				class="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors {mandatoryFilter === 'jane_owned'
					? 'border-kood-accent bg-kood-accent/15 text-kood-accent'
					: 'border-kood-border text-kood-muted hover:bg-kood-surface-raised'}"
				role="tab"
				aria-selected={mandatoryFilter === 'jane_owned'}
				onclick={() => setFilter('jane_owned')}>Jane’s checks ({janeProg.owned})</button
			>
			<button
				type="button"
				class="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors {mandatoryFilter === 'joe_owned'
					? 'border-kood-accent bg-kood-accent/15 text-kood-accent'
					: 'border-kood-border text-kood-muted hover:bg-kood-surface-raised'}"
				role="tab"
				aria-selected={mandatoryFilter === 'joe_owned'}
				onclick={() => setFilter('joe_owned')}>Joe’s checks ({joeProg.owned})</button
			>
		</div>

		{#if mandatoryPageCount > 1}
			<div
				class="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-kood-border bg-kood-bg/40 px-3 py-2"
			>
				<div class="flex flex-wrap items-center gap-2">
					<button
						type="button"
						class="rounded-md border border-kood-border px-2 py-1 text-xs text-kood-text hover:bg-kood-surface-raised disabled:opacity-40"
						disabled={mandatoryPageSafe <= 0}
						onclick={() => setMandatoryPage(mandatoryPageSafe - 1)}>Previous page</button
					>
					<button
						type="button"
						class="rounded-md border border-kood-border px-2 py-1 text-xs text-kood-text hover:bg-kood-surface-raised disabled:opacity-40"
						disabled={mandatoryPageSafe >= mandatoryPageCount - 1}
						onclick={() => setMandatoryPage(mandatoryPageSafe + 1)}>Next page</button
					>
					<span class="text-xs text-kood-muted">
						Page <strong class="text-kood-text/90">{mandatoryPageSafe + 1}</strong> / {mandatoryPageCount}
						· showing
						<strong class="text-kood-text/90">{mandatoryFiltered.length === 0 ? 0 : mandatoryPageSafe * MANDATORY_PAGE_SIZE + 1}</strong>–{Math.min(
							(mandatoryPageSafe + 1) * MANDATORY_PAGE_SIZE,
							mandatoryFiltered.length
						)}
						of {mandatoryFiltered.length} in this view
					</span>
				</div>
				<div class="flex flex-wrap items-center gap-1.5" role="list" aria-label="Page status (owner accepted)">
					{#each mandatoryPageDone as done, i (i)}
						<button
							type="button"
							class="h-2.5 w-2.5 rounded-sm border transition-colors {done
								? 'border-kood-accent bg-kood-accent/80'
								: 'border-kood-border bg-kood-surface'} {i === mandatoryPageSafe
								? 'ring-2 ring-kood-accent/50 ring-offset-1 ring-offset-kood-bg'
								: ''}"
							title={done ? `Page ${i + 1}: all rows accepted by owner` : `Page ${i + 1}: still open`}
							aria-label={`Go to page ${i + 1}`}
							onclick={() => setMandatoryPage(i)}
						></button>
					{/each}
				</div>
			</div>
		{/if}

		<div class="space-y-2">
			{#each mandatorySlice as item (item.id)}
				<TestingItemCard item={item} open={isOpen(item.id)} onToggle={() => toggle(item.id)} />
			{/each}
		</div>
	</section>

	{#if isSandra}
		<div class="flex flex-wrap gap-3 rounded-lg border border-kood-border bg-kood-surface p-4">
			<button
				type="button"
				class="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200/90 hover:bg-amber-500/15"
				onclick={() => sandraStartNewTestingRound()}>Start new testing round</button
			>
			<p class="text-xs text-kood-muted">
				Archives current verdicts per row and bumps the round; comments stay in the thread.
			</p>
		</div>
	{/if}

	<div class="rounded-lg border border-kood-border bg-kood-surface p-4 text-sm text-kood-muted">
		<p class="text-xs uppercase tracking-wide text-kood-muted/80">Submitted</p>
		<p class="mt-1 text-kood-text/90">4/1/2026, 1:55 PM (mock)</p>
	</div>

	<div class="space-y-2">
		<button
			type="button"
			class="rounded-full bg-kood-accent px-5 py-2.5 text-sm font-bold text-kood-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
			disabled={!allMandatoryDoubleAccepted()}
			onclick={() => goToCodeReview()}>Continue to code review sprint</button
		>
		{#if !allMandatoryDoubleAccepted()}
			<p class="text-xs text-amber-400/90">
				Every mandatory row must be <strong class="text-amber-200">Accepted by its owner</strong> (Jane or Joe). Use
				tabs and pages so nothing is missed.
			</p>
		{/if}
	</div>
</div>
