<script lang="ts">
	import { getApp } from '$lib/appState.svelte';
	import { MESSENGER_REPO, PROJECT_MANDATORY_XP } from '$lib/koodUi';

	const app = getApp();
</script>

<div class="space-y-4">
	{#if app.phase !== 'briefing' && app.projectStarted}
		<div
			class="flex items-center justify-between rounded-xl border border-kood-accent/25 bg-kood-accent/5 px-3 py-2 text-sm"
		>
			<span class="text-kood-text/90">6 d 23 h 58 min</span>
			<span class="rounded-md bg-amber-500/20 px-2 py-0.5 text-xs text-amber-200">+10 XP</span>
		</div>
	{/if}

	<div class="rounded-xl border border-kood-border bg-kood-surface p-3 text-xs">
		<p class="font-semibold uppercase tracking-wide text-kood-muted">Repository for this project</p>
		<a class="mt-1 block break-all text-kood-accent hover:underline" href={MESSENGER_REPO}>{MESSENGER_REPO}</a>
	</div>

	{#if app.submittedForReview}
		<div
			class="flex items-center gap-2 rounded-xl border border-kood-accent/30 bg-kood-accent/8 px-3 py-2 text-xs text-kood-text/90"
		>
			<span aria-hidden="true">✓</span>
			Submitted 4/1/2026, 1:55 PM
		</div>
	{/if}

	<div class="rounded-xl border border-kood-border bg-kood-surface p-3">
		<p class="text-2xl font-semibold text-kood-text">XP {app.xpMock} / {PROJECT_MANDATORY_XP}</p>
		<p class="text-xs text-kood-muted">Mock counter — nudges, standup, and ratings add XP.</p>
	</div>

	<div class="rounded-xl border border-kood-border bg-kood-surface p-3">
		<p class="text-xs font-semibold uppercase text-kood-muted">Reviews</p>
		<p class="mt-1 text-sm text-kood-muted">
			{app.submittedForReview ? 'Jane & Joe assigned (demo).' : 'Submit task to see your reviewer(s).'}
		</p>
	</div>
</div>
