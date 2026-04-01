<script lang="ts">
	import { getApp, setRole } from '$lib/appState.svelte';
	import type { Role } from '$lib/types';

	const app = getApp();

	const roles: { id: Role; label: string }[] = [
		{ id: 'sandra', label: 'Sandra (submitter)' },
		{ id: 'jane', label: 'Jane (reviewer)' },
		{ id: 'joe', label: 'Joe (reviewer)' }
	];
</script>

<div class="flex flex-wrap gap-2">
	{#each roles as r (r.id)}
		<button
			type="button"
			class="rounded-lg px-3 py-1.5 text-xs font-medium transition
				{app.role === r.id
				? 'bg-kood-accent text-kood-accent-foreground'
				: 'bg-kood-surface-raised text-kood-text/90 hover:bg-kood-surface'}"
			onclick={() => setRole(r.id)}
		>
			{r.label}
		</button>
	{/each}
</div>
