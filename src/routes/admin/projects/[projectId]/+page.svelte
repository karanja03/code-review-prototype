<script lang="ts">
	let { data } = $props();

	const started = $derived(
		data.project.createdAt ? new Date(data.project.createdAt).toLocaleString() : '—'
	);
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
</header>
