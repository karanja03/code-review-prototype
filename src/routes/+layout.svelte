<script lang="ts">
	import { browser } from '$app/environment';
	import { setContext } from 'svelte';
	import { APP_STATE_STORAGE_KEY, getApp } from '$lib/appState.svelte';
	import { AUTH_SESSION, type SessionUser } from '$lib/auth-context';
	import { createAppSocket } from '$lib/socket';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children, data } = $props();

	const auth = $state<{ sessionUser: SessionUser | null }>({ sessionUser: null });
	$effect(() => {
		auth.sessionUser = data.sessionUser;
	});
	setContext(AUTH_SESSION, auth);

	const app = getApp();

	$effect(() => {
		if (!browser) return;
		const socket = createAppSocket();
		if (!socket) return;
		const onHello = (payload: unknown) => {
			console.debug('[socket.io]', payload);
		};
		socket.on('server:hello', onHello);
		return () => {
			socket.off('server:hello', onHello);
			socket.disconnect();
		};
	});

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
			codeReviewRound: app.codeReviewRound,
			standupItems: app.standupItems,
			standupWhen: app.standupWhen,
			standupVoiceChannel: app.standupVoiceChannel,
			standupTakeaways: app.standupTakeaways,
			standupTakeawayMessages: app.standupTakeawayMessages,
			sandraRatings: app.sandraRatings,
			reviewerRatings: app.reviewerRatings,
			xpMock: app.xpMock,
			leaderboardNote: app.leaderboardNote,
			reviewerAssignmentAccepted: app.reviewerAssignmentAccepted
		};
		localStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(snap));
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
