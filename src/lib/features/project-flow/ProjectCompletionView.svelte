<script lang="ts">
	type SubmitterWorkspace = {
		kind: 'submitter';
		project: { status: string };
	};

	let { workspace }: { workspace: SubmitterWorkspace | { kind: string } } = $props();

	const submitter = $derived(workspace.kind === 'submitter' ? (workspace as SubmitterWorkspace) : null);
	const status = $derived(submitter?.project.status ?? '');
</script>

<div class="max-w-xl space-y-4">
	<h2 class="text-xl font-semibold text-kood-text">Project completion · Mobile Messenger</h2>

	{#if !submitter}
		<p class="text-sm text-kood-muted">This step is for the submitter account.</p>
	{:else if status === 'awaiting_link'}
		<p class="text-sm text-kood-muted">
			Finish the Flutter messenger per the brief, then add your Gitea repository URL in
			<strong class="text-kood-text/90">Your project batch</strong> at the top of the page. The next phase opens
			only after that link is saved and reviewers have been assigned.
		</p>
	{:else if status === 'repo_submitted'}
		<p class="text-sm text-kood-muted">
			Your repository link has been received. Please wait while an administrator assigns reviewers to your project.
			The testing phase will appear here automatically when reviewers are paired and the review begins.
		</p>
	{:else if status === 'review_active' || status === 'completed'}
		<p class="text-sm text-kood-muted">Loading the next step…</p>
	{:else}
		<p class="text-sm text-kood-muted">Please wait…</p>
	{/if}
</div>
