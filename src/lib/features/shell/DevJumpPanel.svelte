<script lang="ts">
	import { getApp, jumpPhase, resetPrototype } from '$lib/appState.svelte';
	import type { Phase } from '$lib/types';

	const app = getApp();

	const phases: Phase[] = [
		'briefing',
		'project_completion',
		'testing',
		'code_review',
		'standup',
		'accept_project',
		'feedback_360'
	];

	let open = $state(false);
</script>

<div class="fixed bottom-4 left-4 z-40 max-w-sm">
	<button
		type="button"
		class="rounded-lg border border-kood-border bg-kood-surface px-3 py-1.5 text-xs text-kood-muted hover:text-kood-text"
		onclick={() => (open = !open)}>{open ? 'Hide' : 'Show'} demo jumps</button
	>
	{#if open}
		<div class="mt-2 space-y-2 rounded-xl border border-kood-border bg-kood-surface p-3 shadow-xl">
			<p class="text-xs text-kood-muted">Phase (current: {app.phase})</p>
			<div class="flex flex-wrap gap-1">
				{#each phases as p (p)}
					<button
						type="button"
						class="rounded bg-kood-surface-raised px-2 py-1 text-[10px] uppercase text-kood-text/90 hover:bg-kood-bg"
						onclick={() => jumpPhase(p)}>{p.slice(0, 8)}</button
					>
				{/each}
			</div>
			<button
				type="button"
				class="w-full rounded-lg border border-red-500/40 bg-red-950/40 py-1.5 text-xs text-red-200"
				onclick={() => resetPrototype()}>Reset prototype</button
			>
		</div>
	{/if}
</div>
