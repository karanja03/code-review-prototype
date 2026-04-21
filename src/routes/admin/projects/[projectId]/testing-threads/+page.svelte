<script lang="ts">
	import AdminConversationThreads from '$lib/features/admin/AdminConversationThreads.svelte';

	let { data } = $props();
</script>

<section class="rounded-xl border border-kood-border bg-kood-surface p-4 md:p-5">
	<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">Testing · conversation threads</h2>
	<p class="mt-1 text-xs leading-relaxed text-kood-muted">
		Grouped by checklist row. Each thread is <strong class="text-kood-text/85">one shared conversation</strong> (submitter +
		both reviewers); messages are in time order. Collapse rows you do not need to read — use Expand all when you want
		everything open. From SQL after sync, otherwise from saved JSON.
	</p>

	<AdminConversationThreads
		groups={data.testingThreadGroups}
		submitterName={data.submitterName}
		reviewerAName={data.reviewerAName}
		reviewerBName={data.reviewerBName}
		emptyMessage="No testing comments saved yet."
	/>
</section>
