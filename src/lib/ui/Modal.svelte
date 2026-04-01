<script lang="ts">
	let {
		open = $bindable(false),
		title,
		children,
		footer
	}: {
		open?: boolean;
		title: string;
		children?: import('svelte').Snippet;
		footer?: import('svelte').Snippet;
	} = $props();
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
		role="presentation"
		onclick={(e) => e.target === e.currentTarget && (open = false)}
	>
		<div
			class="max-w-md rounded-xl border border-kood-border bg-kood-surface-raised p-6 shadow-xl"
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
		>
			<h2 id="modal-title" class="text-lg font-semibold text-kood-text">{title}</h2>
			<div class="mt-3 text-sm text-kood-text/90">
				{@render children?.()}
			</div>
			{#if footer}
				<div class="mt-6 flex flex-wrap justify-end gap-2">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
