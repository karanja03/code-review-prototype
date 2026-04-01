<script lang="ts">
	import { getToasts } from '$lib/appState.svelte';

	const list = getToasts();
</script>

<div class="pointer-events-none fixed bottom-4 right-4 z-[60] flex max-w-sm flex-col gap-2">
	{#each list as t (t.id)}
		<div
			class="pointer-events-auto rounded-lg border border-kood-accent/35 bg-kood-surface px-4 py-3 text-sm text-kood-text shadow-lg"
		>
			{t.message}
		</div>
	{/each}
</div>
