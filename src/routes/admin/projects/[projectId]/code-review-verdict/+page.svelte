<script lang="ts">
	const PAGE_SIZE = 8;

	let { data } = $props();

	let pageIdx = $state(0);

	const rows = $derived(data.codeReviewObservationProgress);
	const pageCount = $derived(Math.max(1, Math.ceil(rows.length / PAGE_SIZE)));
	const pageSafe = $derived(Math.min(pageIdx, pageCount - 1));
	const slice = $derived(rows.slice(pageSafe * PAGE_SIZE, pageSafe * PAGE_SIZE + PAGE_SIZE));

	$effect(() => {
		if (pageIdx > pageCount - 1) pageIdx = Math.max(0, pageCount - 1);
	});
</script>

<section class="rounded-xl border border-kood-border bg-kood-surface p-4 md:p-5">
	<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">Code review · verdict progress</h2>
	<p class="mt-1 text-xs leading-relaxed text-kood-muted">
		Each row is one observation on the sprint board. Reviewer columns use the same A/B slots as testing (
		<strong class="text-kood-text/85">{data.reviewerAName}</strong>,
		<strong class="text-kood-text/85">{data.reviewerBName}</strong>).
	</p>

	{#if rows.length === 0}
		<p class="mt-4 text-sm text-kood-muted">No code review observation rows in SQL yet.</p>
	{:else}
		<div class="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-kood-muted">
			<span
				>Showing <strong class="text-kood-text/90">{pageSafe * PAGE_SIZE + 1}</strong>–<strong class="text-kood-text/90"
					>{Math.min((pageSafe + 1) * PAGE_SIZE, rows.length)}</strong
				>
				of <strong class="text-kood-text/90">{rows.length}</strong> rows</span
			>
			<div class="flex flex-wrap gap-2">
				<button
					type="button"
					class="rounded-md border border-kood-border px-2 py-1 text-kood-text hover:bg-kood-surface-raised disabled:opacity-40"
					disabled={pageSafe <= 0}
					onclick={() => (pageIdx = pageSafe - 1)}>Previous</button
				>
				<button
					type="button"
					class="rounded-md border border-kood-border px-2 py-1 text-kood-text hover:bg-kood-surface-raised disabled:opacity-40"
					disabled={pageSafe >= pageCount - 1}
					onclick={() => (pageIdx = pageSafe + 1)}>Next</button
				>
			</div>
		</div>

		<div class="mt-3 overflow-x-auto rounded-lg border border-kood-border bg-kood-bg/40">
			<table class="w-full min-w-[560px] border-collapse text-left text-xs">
				<thead>
					<tr class="border-b border-kood-border bg-kood-surface-raised/50 text-kood-muted">
						<th class="px-3 py-2">Category</th>
						<th class="px-3 py-2">Observation</th>
						<th class="px-3 py-2">{data.reviewerAName} (A)</th>
						<th class="px-3 py-2">{data.reviewerBName} (B)</th>
						<th class="px-3 py-2">Round</th>
					</tr>
				</thead>
				<tbody>
					{#each slice as row (`${row.categoryId}-${row.observationId}`)}
						<tr class="border-b border-kood-border/50">
							<td class="px-3 py-2">{row.categoryId}</td>
							<td class="px-3 py-2 font-mono text-[11px]">{row.observationId}</td>
							<td class="px-3 py-2">{row.janeVerdict}</td>
							<td class="px-3 py-2">{row.joeVerdict}</td>
							<td class="px-3 py-2">{row.codeReviewRound}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>
