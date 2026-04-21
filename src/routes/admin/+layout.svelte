<script lang="ts">
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';

	type AdminProjectRow = { id: string; themeTitle: string; status: string; submitterUsername: string };
	let { data, children }: { data: { adminProjects: AdminProjectRow[] }; children: Snippet } = $props();

	setContext('kood-admin-projects', () => data.adminProjects);
</script>

{@render children()}
