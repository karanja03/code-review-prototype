<script lang="ts">
	import { completeAcceptProject } from '$lib/appState.svelte';
</script>

<div class="max-w-xl space-y-4">
	<h2 class="text-xl font-semibold text-kood-text">Accept project</h2>
	<p class="text-sm text-kood-muted">
		Formal acceptance after testing, sprint, and standup. This is a low-fi placeholder for institutional approval /
		rubric pass.
	</p>
	<div class="rounded-xl border border-kood-accent/30 bg-kood-accent/5 p-4 text-sm text-kood-text/90">
		Mobile Messenger · Flutter — ready to close the loop with 360° feedback.
	</div>
	<button
		type="button"
		class="rounded-full bg-kood-accent px-5 py-2.5 text-sm font-bold text-kood-accent-foreground"
		onclick={() => completeAcceptProject()}>Continue to 360° feedback</button
	>
</div>
