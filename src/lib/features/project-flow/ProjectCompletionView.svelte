<script lang="ts">
	import { assignedNameForSlot, confirmSubmitForReview } from '$lib/appState.svelte';
	import { MESSENGER_REPO } from '$lib/koodUi';
	import Modal from '$lib/ui/Modal.svelte';

	let reviewOpen = $state(false);
	const reviewer1Name = $derived(assignedNameForSlot('reviewer1') || 'Reviewer 1');
	const reviewer2Name = $derived(assignedNameForSlot('reviewer2') || 'Reviewer 2');
</script>

<div class="space-y-4">
	<h2 class="text-xl font-semibold text-kood-text">Project completion · Mobile Messenger</h2>
	<p class="text-sm text-kood-muted">
		Finish the Flutter messenger per the brief. When you're ready, submit for review — reviewers will be assigned
		({reviewer1Name} and {reviewer2Name}).
	</p>
	<div class="rounded-xl border border-kood-border bg-kood-surface p-4 text-sm text-kood-text/90">
		<p class="text-xs font-semibold uppercase tracking-wide text-kood-muted">Repository for this project</p>
		<a class="mt-1 block break-all text-kood-accent hover:underline" href={MESSENGER_REPO}>{MESSENGER_REPO}</a>
	</div>
	<button
		type="button"
		class="w-full max-w-md rounded-xl border-2 border-kood-accent/70 bg-kood-surface-raised py-4 text-sm font-bold text-kood-accent hover:bg-kood-surface"
		onclick={() => (reviewOpen = true)}>Submit for review</button
	>
</div>

<Modal bind:open={reviewOpen} title="Are you ready?">
	<p>This action will assign your task to {reviewer1Name} and {reviewer2Name} for review.</p>
	{#snippet footer()}
		<button
			type="button"
			class="rounded-lg border border-kood-border px-4 py-2 text-sm text-kood-text"
			onclick={() => (reviewOpen = false)}>Cancel</button
		>
		<button
			type="button"
			class="rounded-lg bg-kood-accent px-4 py-2 text-sm font-semibold text-kood-accent-foreground"
			onclick={() => {
				confirmSubmitForReview();
				reviewOpen = false;
			}}>Yes</button
		>
	{/snippet}
</Modal>
