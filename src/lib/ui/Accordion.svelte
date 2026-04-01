<script lang="ts">
	let {
		title,
		defaultOpen = false,
		badge,
		children
	}: {
		title: string;
		defaultOpen?: boolean;
		badge?: string;
		children?: import('svelte').Snippet;
	} = $props();

	let open = $state(false);
	$effect(() => {
		open = defaultOpen;
	});
</script>

<div class="overflow-hidden rounded-xl border border-kood-border bg-kood-surface">
	<button
		type="button"
		class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-kood-surface-raised/80"
		onclick={() => (open = !open)}
	>
		<span class="font-medium text-kood-text">{title}</span>
		<span class="flex items-center gap-2">
			{#if badge}
				<span class="rounded-full bg-kood-accent/15 px-2 py-0.5 text-xs text-kood-accent">{badge}</span>
			{/if}
			<span class="text-kood-muted">{open ? '▾' : '▸'}</span>
		</span>
	</button>
	{#if open}
		<div class="border-t border-kood-border px-4 py-3 text-sm leading-relaxed text-kood-text/90">
			{@render children?.()}
		</div>
	{/if}
</div>
