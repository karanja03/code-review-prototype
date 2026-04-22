<script lang="ts">
	let { data } = $props();

	const started = $derived(
		data.project.createdAt ? new Date(data.project.createdAt).toLocaleString() : '—'
	);

	const standup = $derived(data.standupSnapshot);

	const checklistTitles = [
		'Scheduled the ~45 min sync and shared time / voice channel with the team.',
		'Followed the structure: reviewer buckets → cross-review → submitter → shared actions.',
		'Captured takeaways below (what was discussed, key feedback, action items, reflections).',
		'Confirmed everyone had space to speak; notes are specific enough to use later.',
		'Agreed what “done” means for this review before moving to Accept project.'
	] as const;
</script>

<header class="rounded-xl border border-kood-accent/30 bg-kood-surface/80 p-5 lg:p-6">
	<p class="text-xs text-kood-muted">
		<a href="/admin" class="text-kood-accent underline">← Admin</a>
	</p>
	<h1 class="mt-4 font-mono text-xl font-semibold tracking-tight text-kood-text">Project overview</h1>
	<p class="mt-2 text-sm text-kood-muted">
		Status: <span class="text-kood-accent">{data.project.status}</span>
	</p>
	<p class="mt-2 text-sm text-kood-muted">
		Started: <span class="text-kood-text/90">{started}</span>
		<span class="text-kood-muted"> · Project id </span><span class="font-mono text-xs text-kood-text/90">{data.project.id}</span>
	</p>
	{#if data.project.giteaUrl}
		<p class="mt-2 break-all text-sm">
			<a class="text-kood-accent underline" href={data.project.giteaUrl} target="_blank" rel="noreferrer"
				>{data.project.giteaUrl}</a
			>
		</p>
	{/if}

	<div class="mt-5 rounded-lg border border-kood-border/80 bg-kood-bg/40 p-4 text-sm">
		<p class="text-xs font-semibold uppercase tracking-wide text-kood-muted">People on this batch</p>
		<ul class="mt-2 space-y-1.5 text-kood-text/90">
			<li>
				<span class="text-kood-muted">Submitter:</span>
				<span class="font-medium">{data.submitterName}</span>
			</li>
			{#if data.pair}
				<li>
					<span class="text-kood-muted">Reviewer A — Security + Correctness (stored as <code class="font-mono text-[10px]">jane</code>):</span>
					<span class="font-medium">{data.reviewerAName}</span>
					<span class="ml-1 font-mono text-[10px] text-kood-muted">{data.pair.reviewerAId.slice(0, 8)}…</span>
				</li>
				<li>
					<span class="text-kood-muted">Reviewer B — Performance + Structure (stored as <code class="font-mono text-[10px]">joe</code>):</span>
					<span class="font-medium">{data.reviewerBName}</span>
					<span class="ml-1 font-mono text-[10px] text-kood-muted">{data.pair.reviewerBId.slice(0, 8)}…</span>
				</li>
			{:else}
				<li class="text-amber-400/90">No reviewer pair assigned yet — pair reviewers from the admin dashboard.</li>
			{/if}
		</ul>
	</div>

	{#if standup}
		<div class="mt-8 rounded-xl border border-kood-border/80 bg-kood-bg/30 p-5">
			<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">Standup (from saved review state)</h2>
			<p class="mt-1 text-xs text-kood-muted/90">
				Meeting details and checklist are saved by the submitter inside the code review JSON payload.
			</p>
			<dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2">
				<div>
					<dt class="text-xs font-medium text-kood-muted">Meeting start</dt>
					<dd class="mt-1 font-mono text-xs text-kood-text/90">{standup.standupWhen.trim() || '—'}</dd>
				</div>
				<div>
					<dt class="text-xs font-medium text-kood-muted">Voice channel</dt>
					<dd class="mt-1 break-words text-kood-text/90">{standup.standupVoiceChannel.trim() || '—'}</dd>
				</div>
			</dl>
			<div class="mt-4">
				<p class="text-xs font-medium text-kood-muted">Takeaways thread</p>
				{#if standup.standupTakeawayMessages.length > 0}
					<ul class="mt-2 max-h-56 space-y-2 overflow-y-auto rounded-lg border border-kood-border bg-kood-surface px-3 py-2 text-xs">
						{#each standup.standupTakeawayMessages as m (m.id)}
							<li class="rounded-md bg-kood-bg/50 px-2 py-1.5">
								<span class="font-medium text-kood-accent">{m.author}</span>
								<span class="text-kood-muted"> · {m.at || '—'}</span>
								<p class="mt-0.5 whitespace-pre-wrap text-kood-text/90">{m.text}</p>
							</li>
						{/each}
					</ul>
				{:else if standup.standupTakeaways.trim()}
					<pre
						class="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-kood-border bg-kood-surface px-3 py-2 text-xs text-kood-text/90"
					>{standup.standupTakeaways}</pre>
				{:else}
					<p class="mt-1 text-xs text-kood-muted">—</p>
				{/if}
			</div>
			<div class="mt-4">
				<p class="text-xs font-medium text-kood-muted">Submitter checklist</p>
				<ul class="mt-2 space-y-2 text-xs text-kood-text/90">
					{#each checklistTitles as title, i (i)}
						<li class="flex gap-2 rounded-md border border-kood-border/60 bg-kood-surface/50 px-2 py-1.5">
							<span class="shrink-0 text-kood-muted" aria-hidden="true">{standup.standupItems[i] ? '✓' : '·'}</span>
							<span>{title}</span>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}
</header>
