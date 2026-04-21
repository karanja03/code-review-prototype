<script lang="ts">
	import AdminConversationThreads from '$lib/features/admin/AdminConversationThreads.svelte';

	let { data } = $props();
</script>

<section class="rounded-xl border border-kood-border bg-kood-surface p-4 md:p-5">
	<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">Code review · conversation threads</h2>
	<p class="mt-1 text-xs leading-relaxed text-kood-muted">
		Grouped by observation row; same ordering and colors as testing. Collapse threads to reduce scrolling.
	</p>

	<AdminConversationThreads
		groups={data.codeReviewThreadGroups}
		submitterName={data.submitterName}
		reviewerAName={data.reviewerAName}
		reviewerBName={data.reviewerBName}
		emptyMessage="No code review comments saved yet."
	/>
</section>
