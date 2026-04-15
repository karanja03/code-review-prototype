<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { getApp, hydrateAppStateFromServer, persistAppStateToServer } from '$lib/appState.svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	const app = getApp();
	let hasHydratedFromServer = false;
	let saveTimer: ReturnType<typeof setTimeout> | null = null;

	onMount(() => {
		let pollTimer: ReturnType<typeof setInterval> | null = null;
		const boot = async () => {
			await hydrateAppStateFromServer();
			hasHydratedFromServer = true;
			pollTimer = setInterval(() => {
				void hydrateAppStateFromServer();
			}, 1400);
		};
		void boot();
		return () => {
			if (pollTimer) clearInterval(pollTimer);
		};
	});

	// Persist updates to the JSON file with lightweight debounce.
	$effect(() => {
		if (!browser || !hasHydratedFromServer) return;
		const snap = {
			registeredUsers: app.registeredUsers,
			phase: app.phase,
			projectStarted: app.projectStarted,
			submittedForReview: app.submittedForReview,
			testingRound: app.testingRound,
			testingItems: app.testingItems,
			categorySessions: app.categorySessions,
			codeReviewRound: app.codeReviewRound,
			standupItems: app.standupItems,
			standupWhen: app.standupWhen,
			standupVoiceChannel: app.standupVoiceChannel,
			standupTakeaways: app.standupTakeaways,
			sandraRatings: app.sandraRatings,
			reviewerRatings: app.reviewerRatings,
			xpMock: app.xpMock,
			leaderboardNote: app.leaderboardNote,
			reviewerAssignmentAccepted: app.reviewerAssignmentAccepted
		};
		void snap;
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			void persistAppStateToServer();
		}, 220);
		return () => {
			if (saveTimer) clearTimeout(saveTimer);
		};
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
