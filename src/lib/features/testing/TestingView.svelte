<script lang="ts">
	import {
		allMandatoryDoubleAccepted,
		getApp,
		getPersonaDisplayLabel,
		goToCodeReview,
		mandatoryItems,
		mandatoryOwnedResolvedCount,
		mandatoryProgressForReviewer
	} from '$lib/appState.svelte';
	import TestingItemCard from './TestingItemCard.svelte';

	type MandatoryFilter = 'jane_owned' | 'joe_owned';

	const app = getApp();
	const isReviewer = $derived(app.role === 'jane' || app.role === 'joe');
	const isSandra = $derived(app.role === 'sandra');

	let expanded = $state<Record<string, boolean>>({});

	let mandatoryFilter = $state<MandatoryFilter>(
		app.role === 'joe' ? 'joe_owned' : 'jane_owned'
	);

	$effect(() => {
		const r = app.role;
		if (r === 'jane') mandatoryFilter = 'jane_owned';
		else if (r === 'joe') mandatoryFilter = 'joe_owned';
		else mandatoryFilter = 'jane_owned';
	});

	/** When viewing as Joe on Joe’s tab, open two rows that show decline → Sandra fix → accept. */
	let joeChecksHistoryExpanded = $state(false);
	$effect(() => {
		if (app.role !== 'joe' || mandatoryFilter !== 'joe_owned') {
			joeChecksHistoryExpanded = false;
			return;
		}
		if (joeChecksHistoryExpanded) return;
		expanded = { ...expanded, m9: true, m10: true };
		joeChecksHistoryExpanded = true;
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

	const jName = $derived(getPersonaDisplayLabel('jane'));
	const oName = $derived(getPersonaDisplayLabel('joe'));

	const tabJaneBucketLabel = $derived(app.role === 'jane' ? 'Your checks' : jName);
	const tabJoeBucketLabel = $derived(app.role === 'joe' ? 'Your checks' : oName);
	const mandatorySplitBlurb = $derived(
		app.role === 'jane'
			? `first ${janeProg.owned} yours · ${joeProg.owned} for ${oName}`
			: app.role === 'joe'
				? `${janeProg.owned} for ${jName} · ${joeProg.owned} yours`
				: `${janeProg.owned} for ${jName} · ${joeProg.owned} for ${oName}`
	);

	const janeBucketHeader = $derived(app.role === 'jane' ? 'Your bucket' : `${jName}’s bucket`);
	const joeBucketHeader = $derived(app.role === 'joe' ? 'Your bucket' : `${oName}’s bucket`);

	const janeAcceptPct = $derived(
		janeProg.owned === 0 ? 0 : (janeProg.accepted / janeProg.owned) * 100
	);
	const janeDeclinePct = $derived(
		janeProg.owned === 0 ? 0 : (janeProg.declined / janeProg.owned) * 100
	);
	const joeAcceptPct = $derived(
		joeProg.owned === 0 ? 0 : (joeProg.accepted / joeProg.owned) * 100
	);
	const joeDeclinePct = $derived(
		joeProg.owned === 0 ? 0 : (joeProg.declined / joeProg.owned) * 100
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

	function setFilter(f: MandatoryFilter) {
		mandatoryFilter = f;
	}
</script>

<div class="mx-auto max-w-5xl space-y-6">
	<header>
		<h2 class="text-2xl font-semibold text-kood-text">Testing</h2>
		<p class="mt-3 text-sm leading-relaxed text-kood-muted">
			Mandatory checks are <strong class="text-kood-text/90">split between {jName} and {oName}</strong> — each row has
			one owner who Accepts/Declines; the other reviewer reads along and can comment. Progress below always reflects the
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
			<strong class="text-kood-text">{mandatoryOwnedResolvedCount()}</strong>
			<span class="text-kood-muted"> / {mandatoryList.length}</span>
			<span class="text-kood-muted"> rows with a verdict (accepted or declined)</span>
		</p>

		<p class="mt-3 text-[11px] text-kood-muted">
			<span class="inline-flex items-center gap-1">
				<span class="inline-block size-2 rounded-sm bg-kood-accent/55 ring-1 ring-kood-accent/50"></span>
				Accepted
			</span>
			<span class="ml-3 inline-flex items-center gap-1">
				<span class="inline-block size-2 rounded-sm bg-red-500/50 ring-1 ring-red-400/45"></span>
				Declined
			</span>
			<span class="ml-3 inline-flex items-center gap-1">
				<span class="inline-block size-2 rounded-sm bg-kood-bg ring-1 ring-kood-border/60"></span>
				Pending
			</span>
		</p>

		<div class="mt-4 grid gap-4 sm:grid-cols-2">
			<div>
				<div class="flex items-center justify-between text-xs">
					<span class="font-medium text-kood-text">{janeBucketHeader}</span>
					<span class="text-kood-muted">{janeProg.resolved}/{janeProg.owned}</span>
				</div>
				<div
					class="mt-1.5 flex h-2.5 w-full overflow-hidden rounded-full bg-kood-bg ring-1 ring-kood-border/60"
					role="img"
					aria-label="{janeBucketHeader}: {janeProg.accepted} accepted, {janeProg.declined} declined, {janeProg.owned - janeProg.resolved} pending of {janeProg.owned}"
				>
					<div
						class="h-full bg-kood-accent/55 transition-[width] duration-300"
						style="width: {janeAcceptPct}%"
					></div>
					<div
						class="h-full bg-red-500/50 transition-[width] duration-300"
						style="width: {janeDeclinePct}%"
					></div>
				</div>
			</div>
			<div>
				<div class="flex items-center justify-between text-xs">
					<span class="font-medium text-kood-text">{joeBucketHeader}</span>
					<span class="text-kood-muted">{joeProg.resolved}/{joeProg.owned}</span>
				</div>
				<div
					class="mt-1.5 flex h-2.5 w-full overflow-hidden rounded-full bg-kood-bg ring-1 ring-kood-border/60"
					role="img"
					aria-label="{joeBucketHeader}: {joeProg.accepted} accepted, {joeProg.declined} declined, {joeProg.owned - joeProg.resolved} pending of {joeProg.owned}"
				>
					<div
						class="h-full bg-kood-accent/55 transition-[width] duration-300"
						style="width: {joeAcceptPct}%"
					></div>
					<div
						class="h-full bg-red-500/50 transition-[width] duration-300"
						style="width: {joeDeclinePct}%"
					></div>
				</div>
			</div>
		</div>

		<p class="mt-4 text-[11px] leading-relaxed text-kood-muted">
			The bars above reflect <strong class="text-kood-text/80">every</strong> mandatory row in each bucket — you can’t
			finish the phase until each owned row is accepted.
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
			<strong class="text-kood-text">Submitter:</strong> read-only verdicts; expand a row for the full thread.
		</div>
	{:else if isReviewer}
		<div
			class="rounded-lg border border-kood-accent/25 bg-kood-accent/5 px-4 py-3 text-sm text-kood-text/90"
			role="status"
		>
			{#if app.role === 'jane'}
				<strong class="text-kood-text">You:</strong> Accept/Decline only on rows marked for you. Use the other tab (<strong
					class="text-kood-text/90">{tabJoeBucketLabel}</strong>) to see {oName}’s scope (read-only verdicts; you can
				still comment).
			{:else}
				<strong class="text-kood-text">You:</strong> Accept/Decline only on rows in <strong class="text-kood-text/90"
					>{tabJoeBucketLabel}</strong
				>. Use <strong class="text-kood-text/90">{tabJaneBucketLabel}</strong> to read {jName}’s scope (read-only
				verdicts; you can still comment).
			{/if}
		</div>
	{/if}

	<section>
		<div class="mb-3 flex flex-wrap items-end justify-between gap-2">
			<h3 class="text-lg font-semibold text-kood-text">Mandatory</h3>
			<p class="text-xs text-kood-muted">
				{mandatoryList.length} checks · {mandatorySplitBlurb}
			</p>
		</div>

		<div
			class="mb-3 flex flex-wrap gap-2"
			role="tablist"
			aria-label={`${tabJaneBucketLabel} vs ${tabJoeBucketLabel} mandatory checks`}
		>
			<button
				type="button"
				class="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors {mandatoryFilter === 'jane_owned'
					? 'border-kood-accent bg-kood-accent/15 text-kood-accent'
					: 'border-kood-border text-kood-muted hover:bg-kood-surface-raised'}"
				role="tab"
				aria-selected={mandatoryFilter === 'jane_owned'}
				onclick={() => setFilter('jane_owned')}>{tabJaneBucketLabel} ({janeProg.owned})</button
			>
			<button
				type="button"
				class="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors {mandatoryFilter === 'joe_owned'
					? 'border-kood-accent bg-kood-accent/15 text-kood-accent'
					: 'border-kood-border text-kood-muted hover:bg-kood-surface-raised'}"
				role="tab"
				aria-selected={mandatoryFilter === 'joe_owned'}
				onclick={() => setFilter('joe_owned')}>{tabJoeBucketLabel} ({joeProg.owned})</button
			>
		</div>

		<div class="space-y-2">
			{#each mandatoryFiltered as item (item.id)}
				<TestingItemCard item={item} open={isOpen(item.id)} onToggle={() => toggle(item.id)} />
			{/each}
		</div>
	</section>

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
				Every mandatory row must be <strong class="text-amber-200">Accepted by its owner</strong> ({jName} or {oName}).
				Use both reviewer tabs so nothing is missed.
			</p>
		{/if}
	</div>
</div>
