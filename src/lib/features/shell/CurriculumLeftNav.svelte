<script lang="ts">
	let commsOpen = $state(true);
</script>

<nav class="flex flex-col gap-1 text-sm">
	<button
		type="button"
		class="w-full rounded-lg px-2 py-2 text-left text-kood-muted transition hover:bg-kood-surface-raised/80 hover:text-kood-text"
	>
		← Back
	</button>
	<button
		type="button"
		class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-kood-muted transition hover:bg-kood-surface-raised/80 hover:text-kood-text"
	>
		<span class="text-kood-muted/80">ⓘ</span> Module Description
	</button>

	<div class="mt-4 space-y-0.5 border-t border-kood-border pt-4">
		<button
			type="button"
			class="w-full truncate rounded-lg px-2 py-1.5 text-left text-kood-muted hover:bg-kood-surface-raised/60 hover:text-kood-text/90"
			title="Literal Maintainer"
			>1 Literal Maintain…</button
		>
		<button
			type="button"
			class="w-full truncate rounded-lg px-2 py-1.5 text-left text-kood-muted hover:bg-kood-surface-raised/60 hover:text-kood-text/90"
			>2 Boredom</button
		>
		<button
			type="button"
			class="w-full truncate rounded-lg px-2 py-1.5 text-left text-kood-muted hover:bg-kood-surface-raised/60 hover:text-kood-text/90"
			>3 Artist</button
		>
		<div class="rounded-lg">
			<button
				type="button"
				class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-kood-text/90 hover:bg-kood-surface-raised/60"
				onclick={() => (commsOpen = !commsOpen)}
			>
				<span class="text-xs text-kood-muted">{commsOpen ? '▾' : '▸'}</span>
				4 Comms
			</button>
			{#if commsOpen}
				<div class="ml-4 mt-1 space-y-0.5 border-l border-kood-border pl-3">
					<div
						class="rounded-full bg-kood-accent px-3 py-1.5 text-left text-xs font-medium text-kood-accent-foreground"
					>
						Mobile Messenger
					</div>
					<button
						type="button"
						class="w-full rounded-lg px-3 py-1.5 text-left text-xs text-kood-muted hover:bg-kood-surface-raised/60 hover:text-kood-text/90"
						>Web Messenger</button
					>
				</div>
			{/if}
		</div>
	</div>
</nav>
