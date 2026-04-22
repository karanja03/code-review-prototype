<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { exportCodeReviewWorkspaceForPersistence, exportTestingStateForPersistence } from '$lib/appState.svelte';

	type Proj = {
		id: string;
		status: string;
	};

	let { project, canMarkComplete }: { project: Proj; canMarkComplete: boolean } = $props();

	let saveForm: HTMLFormElement | undefined = $state();
	let testingField: HTMLInputElement | undefined = $state();
	let codeField: HTMLInputElement | undefined = $state();

	const showSave = $derived(project.status === 'review_active' || project.status === 'repo_submitted');

	function submitSave() {
		const t = testingField;
		const c = codeField;
		const f = saveForm;
		if (!t || !c || !f) return;
		t.value = JSON.stringify(exportTestingStateForPersistence());
		c.value = JSON.stringify(exportCodeReviewWorkspaceForPersistence());
		f.requestSubmit();
	}

</script>

<section class="mb-8 rounded-xl border border-kood-border bg-kood-surface/60 p-4">
	<div class="flex flex-wrap items-end justify-between gap-3 border-b border-kood-border pb-3">
		<div>
			<h2 class="text-sm font-semibold text-kood-text">Server sync</h2>
			<p class="mt-1 max-w-xl text-xs text-kood-muted">
				The threads under <strong class="text-kood-text/90">Testing</strong> and
				<strong class="text-kood-text/90">Code review</strong> (comments, accept/decline, rounds) live in the prototype
				UI. Standup details (meeting time, voice channel, takeaways, checklist) are included in the code review
				payload. Use this to push your current copy to the database so the submitter, both reviewers, and admins see
				the same saved state.
			</p>
		</div>
		{#if showSave}
			<div class="flex flex-wrap gap-2">
				<button
					type="button"
					class="rounded border border-kood-border px-3 py-1.5 text-xs hover:bg-kood-border/20"
					onclick={submitSave}
				>
					Save testing &amp; code review
				</button>
				{#if canMarkComplete && project.status === 'review_active'}
					<form
						method="post"
						action="?/markReviewComplete"
						use:enhance={() => {
							return async ({ update }) => {
								await update();
								await invalidateAll();
							};
						}}
					>
						<input type="hidden" name="projectId" value={project.id} />
						<button
							type="submit"
							class="rounded bg-kood-accent/20 px-3 py-1.5 text-xs font-semibold text-kood-accent hover:bg-kood-accent/30"
						>
							Mark review complete
						</button>
					</form>
				{/if}
			</div>
		{/if}
	</div>

	<form
		bind:this={saveForm}
		method="post"
		action="?/saveReviewState"
		class="hidden"
		use:enhance={() => {
			return async ({ update }) => {
				await update();
				await invalidateAll();
			};
		}}
	>
		<input type="hidden" name="projectId" value={project.id} />
		<input bind:this={testingField} type="hidden" name="testingPayload" value="" />
		<input bind:this={codeField} type="hidden" name="codeReviewPayload" value="" />
	</form>
</section>
