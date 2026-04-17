<script lang="ts">
	import { CATEGORIES } from '$lib/constants';
	import type { CategoryDef, CodeReviewListEntry } from '$lib/types';
	import {
		academyUrl,
		allCategoriesComplete,
		categoryAssignee,
		codeReviewObservationsList,
		codeReviewOwnerAccepted,
		codeReviewOwnedResolvedCount,
		codeReviewProgressForReviewer,
		getApp,
		getPersonaDisplayLabel,
		goToStandup,
		sandraStartNewCodeReviewRound
	} from '$lib/appState.svelte';
	import CodeReviewItemCard from './CodeReviewItemCard.svelte';

	type Filter = 'jane_owned' | 'joe_owned';

	type CategoryPage = { category: CategoryDef; entries: CodeReviewListEntry[] };

	const app = getApp();
	const isReviewer = $derived(app.role === 'jane' || app.role === 'joe');
	const isSandra = $derived(app.role === 'sandra');

	let expanded = $state<Record<string, boolean>>({});
	let page = $state(0);
	let filter = $state<Filter>(app.role === 'joe' ? 'joe_owned' : 'jane_owned');

	$effect(() => {
		const r = app.role;
		if (r === 'jane') filter = 'jane_owned';
		else if (r === 'joe') filter = 'joe_owned';
		else filter = 'jane_owned';
	});

	const fullList = $derived(codeReviewObservationsList());
	const allIds = $derived(fullList.map((e) => e.compositeId));

	const categoryGroups = $derived.by((): CategoryPage[] => {
		const assignee = filter === 'jane_owned' ? 'jane' : 'joe';
		const groups: CategoryPage[] = [];
		for (const c of CATEGORIES) {
			if (categoryAssignee(c.id) !== assignee) continue;
			const entries = fullList.filter((e) => e.categoryId === c.id);
			if (entries.length > 0) groups.push({ category: c, entries });
		}
		return groups;
	});

	const pageCount = $derived(categoryGroups.length);
	const pageSafe = $derived(pageCount === 0 ? 0 : Math.min(page, pageCount - 1));
	const currentGroup = $derived(
		pageCount === 0 ? null : (categoryGroups[pageSafe] ?? null)
	);

	$effect(() => {
		const n = categoryGroups.length;
		if (n > 0 && page > n - 1) page = n - 1;
	});

	const janeProg = $derived(codeReviewProgressForReviewer('jane'));
	const joeProg = $derived(codeReviewProgressForReviewer('joe'));

	const jName = $derived(getPersonaDisplayLabel('jane'));
	const oName = $derived(getPersonaDisplayLabel('joe'));
	const sandraName = $derived(getPersonaDisplayLabel('sandra'));

	const janeCategoryCount = $derived(CATEGORIES.filter((c) => categoryAssignee(c.id) === 'jane').length);
	const joeCategoryCount = $derived(CATEGORIES.filter((c) => categoryAssignee(c.id) === 'joe').length);

	const tabJaneBucketLabel = $derived(app.role === 'jane' ? 'Your checks' : jName);
	const tabJoeBucketLabel = $derived(app.role === 'joe' ? 'Your checks' : oName);
	const codeReviewCategoryBlurb = $derived(
		app.role === 'jane'
			? `You ${janeCategoryCount} categories · ${oName} ${joeCategoryCount} categories`
			: app.role === 'joe'
				? `${jName}: ${janeCategoryCount} · You ${joeCategoryCount} categories`
				: `${jName}: ${janeCategoryCount} · ${oName}: ${joeCategoryCount}`
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

	const pageDone = $derived(
		categoryGroups.map(
			(g) => g.entries.length > 0 && g.entries.every(codeReviewOwnerAccepted)
		)
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

	function setPage(n: number) {
		page = Math.max(0, Math.min(n, pageCount - 1));
	}

	function setFilter(f: Filter) {
		filter = f;
		page = 0;
	}
</script>

<div class="mx-auto max-w-5xl space-y-6">
	<header class="border-t border-kood-border pt-6">
		<h2 class="text-xl font-semibold text-kood-text">Sprint · category observations</h2>
		<p class="mt-1 text-sm text-kood-muted">
			{#if app.role === 'joe'}
				You own Performance and Structure &amp; architecture; {jName} owns Security and Correctness. Only the assignee
				Accepts/Declines; the peer reads along and can use the thread.
			{:else if app.role === 'sandra'}
				{sandraName} (submitter) follows both boards read-only. {jName} owns Security and Correctness; {oName} owns
				Performance and Structure &amp; architecture. Only each assignee Accepts/Declines on their rows.
			{:else}
				You own Security and Correctness; {oName} owns Performance and Structure &amp; architecture. Only the assignee
				Accepts/Declines; the peer reads along and can use the thread.
			{/if}
		</p>
	</header>

	{#if isReviewer}
		<section class="rounded-lg border border-kood-border bg-kood-surface p-5">
			<h3 class="text-sm font-semibold text-kood-text">How to run the async sprint?</h3>
			<ol class="mt-3 list-decimal space-y-2 pl-5 text-sm text-kood-muted">
				<li>Accept or decline each observation; use the thread for specifics (paper plane to send).</li>
				<li>Align with the live call plan in Standup once every row in every category is accepted.</li>
			</ol>
		</section>
	{/if}

	<section
		class="rounded-lg border border-kood-border bg-kood-surface p-4"
		aria-label="Sprint observation progress"
	>
		<p class="text-xs font-semibold uppercase tracking-wide text-kood-muted">Team · sprint completion</p>
		<p class="mt-1 text-sm text-kood-text">
			<strong class="text-kood-text">{codeReviewOwnedResolvedCount()}</strong>
			<span class="text-kood-muted"> / {fullList.length}</span>
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
					aria-label="{janeBucketHeader}: {janeProg.accepted} accepted, {janeProg.declined} declined"
				>
					<div class="h-full bg-kood-accent/55 transition-[width] duration-300" style="width: {janeAcceptPct}%"></div>
					<div class="h-full bg-red-500/50 transition-[width] duration-300" style="width: {janeDeclinePct}%"></div>
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
					aria-label="{joeBucketHeader}: {joeProg.accepted} accepted, {joeProg.declined} declined"
				>
					<div class="h-full bg-kood-accent/55 transition-[width] duration-300" style="width: {joeAcceptPct}%"></div>
					<div class="h-full bg-red-500/50 transition-[width] duration-300" style="width: {joeDeclinePct}%"></div>
				</div>
			</div>
		</div>

		<p class="mt-4 text-[11px] leading-relaxed text-kood-muted">
			Pages switch <strong class="text-kood-text/80">whole categories</strong> for the active tab so it is always clear
			what theme you are in. You need <strong class="text-kood-text/80">every</strong> observation accepted by its
			assignee before the sprint can move to Standup.
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
			<strong class="text-kood-text">Start new review round</strong> after fixes.
		</div>
	{:else if isReviewer}
		<div
			class="rounded-lg border border-kood-accent/25 bg-kood-accent/5 px-4 py-3 text-sm text-kood-text/90"
			role="status"
		>
			{#if app.role === 'jane'}
				<strong class="text-kood-text">You:</strong> Accept/Decline only on rows in your tab. Use <strong
					class="text-kood-text/90">{tabJoeBucketLabel}</strong> to see {oName}’s scope (read-only verdicts; you can still
				comment).
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
			<h3 class="text-lg font-semibold text-kood-text">Observations</h3>
			<p class="text-xs text-kood-muted">
				{fullList.length} rows · {codeReviewCategoryBlurb}
			</p>
		</div>

		<div
			class="mb-3 flex flex-wrap gap-2"
			role="tablist"
			aria-label={`${tabJaneBucketLabel} vs ${tabJoeBucketLabel} observation lists`}
		>
			<button
				type="button"
				class="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors {filter === 'jane_owned'
					? 'border-kood-accent bg-kood-accent/15 text-kood-accent'
					: 'border-kood-border text-kood-muted hover:bg-kood-surface-raised'}"
				role="tab"
				aria-selected={filter === 'jane_owned'}
				onclick={() => setFilter('jane_owned')}>{tabJaneBucketLabel} ({janeProg.owned})</button
			>
			<button
				type="button"
				class="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors {filter === 'joe_owned'
					? 'border-kood-accent bg-kood-accent/15 text-kood-accent'
					: 'border-kood-border text-kood-muted hover:bg-kood-surface-raised'}"
				role="tab"
				aria-selected={filter === 'joe_owned'}
				onclick={() => setFilter('joe_owned')}>{tabJoeBucketLabel} ({joeProg.owned})</button
			>
		</div>

		{#if pageCount > 1}
			<div
				class="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-kood-border bg-kood-bg/40 px-3 py-2"
			>
				<div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
					<button
						type="button"
						class="rounded-md border border-kood-border px-2 py-1 text-xs text-kood-text hover:bg-kood-surface-raised disabled:opacity-40"
						disabled={pageSafe <= 0}
						onclick={() => setPage(pageSafe - 1)}>Previous category</button
					>
					<button
						type="button"
						class="rounded-md border border-kood-border px-2 py-1 text-xs text-kood-text hover:bg-kood-surface-raised disabled:opacity-40"
						disabled={pageSafe >= pageCount - 1}
						onclick={() => setPage(pageSafe + 1)}>Next category</button
					>
					<span class="text-xs text-kood-muted">
						Category <strong class="text-kood-text/90">{pageSafe + 1}</strong> / {pageCount}
						{#if currentGroup}
							· <strong class="text-kood-text/90">{currentGroup.category.title}</strong>
						{/if}
					</span>
				</div>
				<div
					class="flex flex-wrap items-center gap-1.5"
					role="list"
					aria-label="Category completion (all observations accepted by assignee)"
				>
					{#each pageDone as done, i (i)}
						<button
							type="button"
							class="h-2.5 w-2.5 rounded-sm border transition-colors {done
								? 'border-kood-accent bg-kood-accent/80'
								: 'border-kood-border bg-kood-surface'} {i === pageSafe
								? 'ring-2 ring-kood-accent/50 ring-offset-1 ring-offset-kood-bg'
								: ''}"
							title={done
								? `${categoryGroups[i]?.category.title ?? 'Category'}: complete`
								: `${categoryGroups[i]?.category.title ?? 'Category'}: still open`}
							aria-label={`Go to category ${i + 1}`}
							onclick={() => setPage(i)}
						></button>
					{/each}
				</div>
			</div>
		{/if}

		{#if currentGroup}
			<div class="overflow-hidden rounded-lg border border-kood-border bg-kood-surface">
				<div
					class="flex flex-wrap items-end justify-between gap-3 border-b border-kood-border bg-kood-surface-raised/50 px-4 py-3"
				>
					<div class="min-w-0">
						<h4 class="text-lg font-semibold tracking-tight text-kood-text md:text-xl">
							{currentGroup.category.title}
						</h4>
						<p class="mt-1 text-xs text-kood-muted">
							{currentGroup.entries.length}
							{currentGroup.entries.length === 1 ? 'observation' : 'observations'} · assigned to
							<strong class="text-kood-text/90">
								{categoryAssignee(currentGroup.category.id) === 'jane'
									? app.role === 'jane'
										? 'You'
										: jName
									: app.role === 'joe'
										? 'You'
										: oName}
							</strong>
						</p>
					</div>
					<a
						class="shrink-0 text-sm font-medium text-kood-accent underline-offset-2 hover:underline"
						href={academyUrl(currentGroup.category.academyHint)}
						target="_blank"
						rel="noreferrer">Open in review academy</a
					>
				</div>
				<div class="space-y-2 p-3 sm:p-4">
					{#each currentGroup.entries as entry (entry.compositeId)}
						<CodeReviewItemCard
							entry={entry}
							open={isOpen(entry.compositeId)}
							onToggle={() => toggle(entry.compositeId)}
						/>
					{/each}
				</div>
			</div>
		{:else}
			<p class="rounded-lg border border-kood-border bg-kood-surface px-4 py-6 text-center text-sm text-kood-muted">
				No categories in this tab.
			</p>
		{/if}
	</section>

	{#if isSandra}
		<div class="flex flex-wrap gap-3 rounded-lg border border-kood-border bg-kood-surface p-4">
			<button
				type="button"
				class="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200/90 hover:bg-amber-500/15"
				onclick={() => sandraStartNewCodeReviewRound()}>Start new review round</button
			>
			<p class="text-xs text-kood-muted">
				Archives current verdicts per row and bumps the round; comments stay in the thread.
			</p>
		</div>
	{/if}

	<div class="flex flex-wrap items-center gap-3">
		<button
			type="button"
			class="rounded-full bg-kood-accent px-5 py-2.5 text-sm font-bold text-kood-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
			disabled={!allCategoriesComplete()}
			onclick={() => goToStandup()}>Complete sprint → Standup</button
		>
	</div>

	{#if !allCategoriesComplete()}
		<p class="text-xs text-amber-400/90">
			Every observation must be <strong class="text-amber-200">Accepted by its assignee</strong> ({jName} or {oName}).
			Use tabs and category pages so nothing is missed.
		</p>
	{/if}
</div>
