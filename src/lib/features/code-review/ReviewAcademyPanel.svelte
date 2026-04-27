<script lang="ts">
	import { ACADEMY_CONTENT } from '$lib/academyContent';
	import Modal from '$lib/ui/Modal.svelte';

	interface Props {
		categoryId: string | null;
		onClose: () => void;
	}

	let { categoryId, onClose } = $props();

	const content = $derived(categoryId ? ACADEMY_CONTENT[categoryId] : null);
	let isOpen = $state(false);

	$effect(() => {
		isOpen = categoryId !== null;
	});

	$effect(() => {
		if (!isOpen && categoryId !== null) {
			onClose();
		}
	});

	function handleClose() {
		isOpen = false;
		onClose();
	}
</script>

{#if isOpen && categoryId && content}
	<Modal
		bind:open={isOpen}
		title={content.title}
	>
		<div class="max-h-96 overflow-y-auto space-y-6">
			<!-- Description -->
			<p class="text-sm text-kood-muted">{content.description}</p>

			<!-- Key Points -->
			<section>
				<h2 class="mb-4 text-lg font-semibold text-kood-text">What to look for</h2>
				<div class="space-y-3">
					{#each content.keyPoints as point}
						<div class="rounded-lg border border-kood-border bg-kood-bg/50 px-4 py-3">
							<p class="font-medium text-kood-text">{point.title}</p>
							<p class="mt-1 text-sm text-kood-muted">{point.description}</p>
						</div>
					{/each}
				</div>
			</section>

			<!-- Common Patterns -->
			<section>
				<h2 class="mb-4 text-lg font-semibold text-kood-text">Common patterns to watch</h2>
				<ul class="space-y-2">
					{#each content.commonPatterns as pattern}
						<li class="flex gap-3 text-sm">
							<span class="shrink-0 text-kood-accent">✓</span>
							<span class="text-kood-muted">{pattern}</span>
						</li>
					{/each}
				</ul>
			</section>

			<!-- Tips for Reviewers -->
			<section class="rounded-lg border border-kood-accent/20 bg-kood-accent/5 p-4">
				<h2 class="mb-3 text-sm font-semibold text-kood-text">Reviewer mindset</h2>
				<ul class="space-y-2">
					{#each content.reviewerTips as tip}
						<li class="flex gap-2 text-sm text-kood-muted">
							<span class="shrink-0">💡</span>
							<span>{tip}</span>
						</li>
					{/each}
				</ul>
			</section>
		</div>
	</Modal>
{/if}
