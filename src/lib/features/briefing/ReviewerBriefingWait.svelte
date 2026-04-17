<script lang="ts">
	import { CATEGORIES } from '$lib/constants';
	import { categoryAssignee, getApp, getPersonaDisplayLabel } from '$lib/appState.svelte';

	const app = getApp();

	const janeCats = $derived(
		CATEGORIES.filter((c) => categoryAssignee(c.id) === 'jane').map((c) => c.title)
	);
	const joeCats = $derived(
		CATEGORIES.filter((c) => categoryAssignee(c.id) === 'joe').map((c) => c.title)
	);
	const myCats = $derived(app.role === 'jane' ? janeCats : joeCats);
	const peerName = $derived(app.role === 'jane' ? getPersonaDisplayLabel('joe') : getPersonaDisplayLabel('jane'));
	const submitterName = $derived(getPersonaDisplayLabel('sandra'));
	const peerCats = $derived(app.role === 'jane' ? joeCats : janeCats);
</script>

<div class="mx-auto max-w-2xl space-y-8">
	<div
		class="rounded-xl border border-kood-accent/30 bg-kood-accent/5 px-4 py-3 text-sm text-kood-text/90"
		role="status"
	>
		<p class="font-semibold text-kood-text">Reviewer · waiting on submitter</p>
		<p class="mt-1 text-kood-muted">
			You do <strong class="text-kood-text/90">not</strong> start this project. Only the submitter ({submitterName})
			presses <strong class="text-kood-text/90">Start</strong> on Mobile Messenger.
		</p>
	</div>

	<header>
		<h1 class="text-2xl font-bold tracking-tight text-kood-text">Mobile Messenger 📲</h1>
		<p class="mt-2 text-sm text-kood-muted">
			When the journey begins, you’ll get an in-app assignment with your categories and responsibilities. Until then,
			you can read the brief from the module list like any other learner — but the phased workflow unlocks for you
			after {submitterName} starts.
		</p>
	</header>

	<section class="rounded-xl border border-kood-border bg-kood-surface p-5">
		<h2 class="text-sm font-semibold text-kood-text">Your review scope (preview)</h2>
		<p class="mt-2 text-sm text-kood-muted">
			After {submitterName} starts, you’ll confirm this officially in the assignment panel.
		</p>
		<ul class="mt-3 list-disc space-y-1 pl-5 text-sm text-kood-text/90">
			{#each myCats as t (t)}
				<li>{t}</li>
			{/each}
		</ul>
		<p class="mt-4 text-xs text-kood-muted">
			<span class="font-medium text-kood-text/80">{peerName}</span> will own: {peerCats.join(' · ')} (you’ll see
			those read-only during the code review sprint).
		</p>
	</section>

	<section class="rounded-xl border border-kood-border bg-kood-surface p-5 text-sm text-kood-muted">
		<h2 class="text-sm font-semibold text-kood-text">What you’ll do as reviewer</h2>
		<ul class="mt-3 list-disc space-y-2 pl-5">
			<li>Mandatory testing is split: you own roughly half the rows; the peer reads along and can comment.</li>
			<li>Own Accept / Nudge on <strong class="text-kood-text/90">your</strong> code-review categories only.</li>
			<li>Join the post-sprint standup prepared to present your findings.</li>
		</ul>
	</section>
</div>
