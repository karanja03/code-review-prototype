<script lang="ts">
	const PAGE_SIZE = 8;

	let { data } = $props();

	let pageIdx = $state(0);

	const rows = $derived(data.testingItemProgress);
	const pageCount = $derived(Math.max(1, Math.ceil(rows.length / PAGE_SIZE)));
	const pageSafe = $derived(Math.min(pageIdx, pageCount - 1));
	const slice = $derived(rows.slice(pageSafe * PAGE_SIZE, pageSafe * PAGE_SIZE + PAGE_SIZE));

	$effect(() => {
		if (pageIdx > pageCount - 1) pageIdx = Math.max(0, pageCount - 1);
	});
</script>

<section class="rounded-xl border border-kood-border bg-kood-surface p-4 md:p-5">
	<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">Testing · verdict progress</h2>
	<p class="mt-1 text-xs leading-relaxed text-kood-muted">
		Each row is one checklist item. Values come from the server after sync (column names in the DB are
		<code class="rounded bg-kood-bg px-1 font-mono text-[10px]">jane</code> /
		<code class="rounded bg-kood-bg px-1 font-mono text-[10px]">joe</code> for the two reviewer slots — shown here as
		<strong class="text-kood-text/85">{data.reviewerAName}</strong> (A) and
		<strong class="text-kood-text/85">{data.reviewerBName}</strong> (B). “Owner” is who must Accept/Decline on mandatory
		rows in the prototype.
	</p>

	{#if rows.length === 0}
		<p class="mt-4 text-sm text-kood-muted">No testing progress rows in SQL yet.</p>
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
			<table class="w-full min-w-[640px] border-collapse text-left text-xs">
				<thead>
					<tr class="border-b border-kood-border bg-kood-surface-raised/50 text-kood-muted">
						<th class="px-3 py-2">Item</th>
						<th class="px-3 py-2">Section</th>
						<th class="px-3 py-2">Owner</th>
						<th class="px-3 py-2">{data.reviewerAName} (A)</th>
						<th class="px-3 py-2">{data.reviewerBName} (B)</th>
						<th class="px-3 py-2">Round</th>
					</tr>
				</thead>
				<tbody>
					{#each slice as row (row.itemId)}
						<tr class="border-b border-kood-border/50">
							<td class="px-3 py-2 font-mono text-[11px]">{row.itemId}</td>
							<td class="px-3 py-2">{row.section}</td>
							<td class="px-3 py-2">{row.mandatoryOwner ?? '—'}</td>
							<td class="px-3 py-2">{row.janeVerdict}</td>
							<td class="px-3 py-2">{row.joeVerdict}</td>
							<td class="px-3 py-2">{row.testingRound}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>
