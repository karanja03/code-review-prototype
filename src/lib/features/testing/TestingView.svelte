<script lang="ts">
	import {
		allMandatoryDoubleAccepted,
		extraItems,
		getApp,
		goToCodeReview,
		mandatoryItems,
		sandraStartNewTestingRound
	} from '$lib/appState.svelte';
	import TestingItemCard from './TestingItemCard.svelte';

	const app = getApp();
	const isReviewer = $derived(app.role === 'jane' || app.role === 'joe');
	const isSandra = $derived(app.role === 'sandra');

	let extraOpen = $state(true);
	let expanded = $state<Record<string, boolean>>({});

	const allIds = $derived([...mandatoryItems(), ...extraItems()].map((i) => i.id));

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
</script>

<div class="mx-auto max-w-4xl space-y-6">
	<header>
		<h2 class="text-2xl font-semibold text-kood-text">Testing</h2>
		<p class="mt-3 text-sm leading-relaxed text-kood-muted">
			Ensures that software works as expected by validating features against requirements. It helps catch bugs
			early, improves reliability, and maintains high-quality standards in development.
		</p>
	</header>

	<section class="rounded-lg border border-kood-border bg-kood-surface p-5">
		<h3 class="text-sm font-semibold text-kood-text">How to do testing?</h3>
		<ol class="mt-3 list-decimal space-y-2 pl-5 text-sm text-kood-muted">
			<li>Clone the repository, then build and run the submitted code.</li>
			<li>Agree on your teamwork: how do you divide testing between reviewers?</li>
			<li>Test functionality and check compliance with the requirements.</li>
			<li>Provide feedback in the group chat and request fixes if necessary.</li>
			<li>Clearly state what changes are mandatory and what are optional fixes.</li>
			<li>Repeat the cycle after submitters make changes as many times as needed.</li>
		</ol>
	</section>

	<div
		class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-kood-border bg-kood-surface px-3 py-2"
	>
		<p class="text-xs text-kood-muted">
			Rows stay <strong class="text-kood-text/80">collapsed</strong> to cut scrolling.
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
			<strong class="text-kood-text">{app.role === 'jane' ? 'Jane' : 'Joe'}:</strong> Accept/Decline works while
			collapsed. Expand to add comments for Sandra.
		</div>
	{/if}

	<section>
		<div class="mb-3 flex flex-wrap items-end justify-between gap-2">
			<h3 class="text-lg font-semibold text-kood-text">Mandatory</h3>
			<p class="text-xs text-kood-muted">{mandatoryItems().length} checks · Jane &amp; Joe each must Accept all</p>
		</div>
		<div class="space-y-2">
			{#each mandatoryItems() as item (item.id)}
				<TestingItemCard item={item} open={isOpen(item.id)} onToggle={() => toggle(item.id)} />
			{/each}
		</div>
	</section>

	<section>
		<button
			type="button"
			class="flex w-full items-center justify-between rounded-lg border border-kood-border bg-kood-surface px-4 py-3 text-left text-sm font-semibold text-kood-text hover:bg-kood-surface-raised"
			onclick={() => (extraOpen = !extraOpen)}
		>
			Extra
			<span class="text-kood-muted">{extraOpen ? '▾' : '▸'}</span>
		</button>
		{#if extraOpen}
			<p class="mt-2 text-xs text-kood-muted">Optional bar — does not block the sprint.</p>
			<div class="mt-3 space-y-2">
				{#each extraItems() as item (item.id)}
					<TestingItemCard item={item} open={isOpen(item.id)} onToggle={() => toggle(item.id)} />
				{/each}
			</div>
		{/if}
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
				Every mandatory row needs <strong class="text-amber-200">Jane</strong> and
				<strong class="text-amber-200">Joe</strong> on Accept.
			</p>
		{/if}
	</div>
</div>
