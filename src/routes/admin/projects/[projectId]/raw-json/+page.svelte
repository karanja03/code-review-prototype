<script lang="ts">
	let { data } = $props();
</script>

<section class="rounded-xl border border-kood-border bg-kood-surface p-4 md:p-5">
	<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">Raw JSON</h2>
	<p class="mt-1 text-xs text-kood-muted">
		Optional snapshots stored on the project row (before or alongside SQL sync).
	</p>

	{#if !data.project.testingJson && !data.project.codeReviewJson}
		<p class="mt-4 text-sm text-kood-muted">No JSON blobs saved on this project.</p>
	{:else}
		{#if data.project.testingJson}
			<p class="mt-4 text-xs text-kood-muted">testing_json</p>
			<pre
				class="mt-1 max-h-[min(24rem,70vh)] overflow-auto rounded-lg border border-kood-border bg-kood-bg p-3 text-xs text-kood-muted">{data.project.testingJson}</pre>
		{/if}
		{#if data.project.codeReviewJson}
			<p class="mt-3 text-xs text-kood-muted">code_review_json</p>
			<pre
				class="mt-1 max-h-[min(24rem,70vh)] overflow-auto rounded-lg border border-kood-border bg-kood-bg p-3 text-xs text-kood-muted">{data.project.codeReviewJson}</pre>
		{/if}
	{/if}
</section>
