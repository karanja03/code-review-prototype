<script lang="ts">
	import PrototypePageShell from '$lib/features/shell/PrototypePageShell.svelte';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: { project: { id: string } }; children: Snippet } = $props();
</script>

<svelte:head>
	<title>Project {data.project.id.slice(0, 8)}… — Admin</title>
</svelte:head>

<PrototypePageShell variant="admin">
	<div class="mx-auto w-full max-w-3xl space-y-8">
		{@render children()}
	</div>
</PrototypePageShell>
