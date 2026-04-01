<script lang="ts">
	import { browser } from '$app/environment';
	import { APP_STATE_STORAGE_KEY, getApp } from '$lib/appState.svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	const app = getApp();

	// `$effect` cannot live at module scope in `.svelte.ts`; persist here during component init.
	$effect(() => {
		if (!browser) return;
		const snap = {
			role: app.role,
			phase: app.phase,
			projectStarted: app.projectStarted,
			submittedForReview: app.submittedForReview,
			testingRound: app.testingRound,
			testingItems: app.testingItems,
			categorySessions: app.categorySessions,
			standupItems: app.standupItems,
			standupWhen: app.standupWhen,
			standupVoiceChannel: app.standupVoiceChannel,
			standupTakeaways: app.standupTakeaways,
			sandraRatings: app.sandraRatings,
			reviewerRatings: app.reviewerRatings,
			xpMock: app.xpMock,
			leaderboardNote: app.leaderboardNote
		};
		localStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(snap));
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
