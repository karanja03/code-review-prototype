<script lang="ts">
	import PrototypePageShell from '$lib/features/shell/PrototypePageShell.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Project {data.project.id.slice(0, 8)}… — Admin</title>
</svelte:head>

<PrototypePageShell variant="admin">
	<div class="mx-auto max-w-3xl space-y-8">
		<header class="rounded-xl border border-kood-accent/30 bg-kood-surface/80 p-5 lg:p-6">
			<p class="text-xs text-kood-muted">
				<a href="/admin" class="text-kood-accent underline">← Admin</a>
			</p>
			<h1 class="mt-4 font-mono text-xl font-semibold tracking-tight text-kood-text">Project audit</h1>
			<p class="mt-2 text-sm text-kood-muted">
				Status: <span class="text-kood-accent">{data.project.status}</span>
			</p>
			{#if data.project.giteaUrl}
				<p class="mt-2 break-all text-sm">
					<a class="text-kood-accent underline" href={data.project.giteaUrl} target="_blank" rel="noreferrer"
						>{data.project.giteaUrl}</a
					>
				</p>
			{/if}

			{#if data.pair}
				<p class="mt-4 text-sm text-kood-muted">
					Pair reviewers (IDs): <span class="font-mono text-xs text-kood-text">{data.pair.reviewerAId}</span> ·
					<span class="font-mono text-xs text-kood-text">{data.pair.reviewerBId}</span>
				</p>
			{/if}
		</header>

		{#if data.testingItemProgress.length > 0}
			<section class="rounded-xl border border-kood-border bg-kood-surface p-4 md:p-5">
				<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">Testing · verdict progress (SQL)</h2>
				<p class="mt-1 text-xs text-kood-muted">
					Latest accept/decline/pending per checklist row (same ids as the prototype).
				</p>
				<div class="mt-3 overflow-x-auto rounded-lg border border-kood-border bg-kood-bg/40">
					<table class="w-full min-w-[640px] border-collapse text-left text-xs">
						<thead>
							<tr class="border-b border-kood-border bg-kood-surface-raised/50 text-kood-muted">
								<th class="px-3 py-2">Item</th>
								<th class="px-3 py-2">Section</th>
								<th class="px-3 py-2">Owner</th>
								<th class="px-3 py-2">Reviewer 1</th>
								<th class="px-3 py-2">Reviewer 2</th>
								<th class="px-3 py-2">Round</th>
							</tr>
						</thead>
						<tbody>
							{#each data.testingItemProgress as row (row.itemId)}
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
			</section>
		{/if}

		{#if data.codeReviewObservationProgress.length > 0}
			<section class="rounded-xl border border-kood-border bg-kood-surface p-4 md:p-5">
				<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">Code review · verdict progress (SQL)</h2>
				<p class="mt-1 text-xs text-kood-muted">Per observation row — matches the sprint board.</p>
				<div class="mt-3 overflow-x-auto rounded-lg border border-kood-border bg-kood-bg/40">
					<table class="w-full min-w-[560px] border-collapse text-left text-xs">
						<thead>
							<tr class="border-b border-kood-border bg-kood-surface-raised/50 text-kood-muted">
								<th class="px-3 py-2">Category</th>
								<th class="px-3 py-2">Observation</th>
								<th class="px-3 py-2">Reviewer 1</th>
								<th class="px-3 py-2">Reviewer 2</th>
								<th class="px-3 py-2">Round</th>
							</tr>
						</thead>
						<tbody>
							{#each data.codeReviewObservationProgress as row (`${row.categoryId}-${row.observationId}`)}
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
			</section>
		{/if}

		<section class="rounded-xl border border-kood-border bg-kood-surface p-4 md:p-5">
			<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">Testing · conversation threads</h2>
			<p class="mt-1 text-xs text-kood-muted">
				Reviewer ↔ submitter messages on each checklist row (from SQL after sync, otherwise from saved JSON).
			</p>
			<ul class="mt-3 space-y-4 text-sm">
				{#each data.testingThreads as t, ti (ti)}
					<li class="rounded-lg border border-kood-border bg-kood-bg/30 p-3">
						<p class="text-xs text-kood-muted">{t.context}</p>
						<p class="mt-2 text-xs text-kood-muted">
							<span class="font-semibold text-kood-text">{t.authorLabel}</span>
							{#if t.round != null}
								· round {t.round}
							{/if}
							· {t.at ? new Date(t.at).toLocaleString() : '—'}
						</p>
						<p class="mt-2 whitespace-pre-wrap text-kood-text/90">{t.text}</p>
					</li>
				{/each}
			</ul>
			{#if data.testingThreads.length === 0}
				<p class="mt-2 text-sm text-kood-muted">No testing comments saved yet.</p>
			{/if}
		</section>

		<section class="rounded-xl border border-kood-border bg-kood-surface p-4 md:p-5">
			<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">Code review · conversation threads</h2>
			<p class="mt-1 text-xs text-kood-muted">
				Messages on each observation row (from SQL after sync, otherwise from saved JSON).
			</p>
			<ul class="mt-3 space-y-4 text-sm">
				{#each data.codeReviewThreads as t, ci (ci)}
					<li class="rounded-lg border border-kood-border bg-kood-bg/30 p-3">
						<p class="text-xs text-kood-muted">{t.context}</p>
						<p class="mt-2 text-xs text-kood-muted">
							<span class="font-semibold text-kood-text">{t.authorLabel}</span>
							{#if t.round != null}
								· round {t.round}
							{/if}
							· {t.at ? new Date(t.at).toLocaleString() : '—'}
						</p>
						<p class="mt-2 whitespace-pre-wrap text-kood-text/90">{t.text}</p>
					</li>
				{/each}
			</ul>
			{#if data.codeReviewThreads.length === 0}
				<p class="mt-2 text-sm text-kood-muted">No code review comments saved yet.</p>
			{/if}
		</section>

		{#if data.project.testingJson || data.project.codeReviewJson}
			<section class="rounded-xl border border-kood-border bg-kood-surface p-4 md:p-5">
				<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">Raw JSON (optional)</h2>
				{#if data.project.testingJson}
					<p class="mt-2 text-xs text-kood-muted">testing_json</p>
					<pre
						class="mt-1 max-h-48 overflow-auto rounded-lg border border-kood-border bg-kood-bg p-3 text-xs text-kood-muted">{data.project.testingJson}</pre>
				{/if}
				{#if data.project.codeReviewJson}
					<p class="mt-3 text-xs text-kood-muted">code_review_json</p>
					<pre
						class="mt-1 max-h-48 overflow-auto rounded-lg border border-kood-border bg-kood-bg p-3 text-xs text-kood-muted">{data.project.codeReviewJson}</pre>
				{/if}
			</section>
		{/if}
	</div>
</PrototypePageShell>
