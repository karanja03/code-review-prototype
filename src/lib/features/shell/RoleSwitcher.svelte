<script lang="ts">
	import { getApp, getPersonaDisplayLabel, setRole } from '$lib/appState.svelte';
	import type { Role } from '$lib/types';

	const app = getApp();

	const roles = $derived<{ id: Role; label: string }[]>([
		{ id: 'sandra', label: `${getPersonaDisplayLabel('sandra')} (submitter)` },
		{ id: 'jane', label: `${getPersonaDisplayLabel('jane')} (reviewer)` },
		{ id: 'joe', label: `${getPersonaDisplayLabel('joe')} (reviewer)` }
	]);
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
