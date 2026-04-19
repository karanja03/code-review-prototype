<script lang="ts">
	import { browser } from '$app/environment';
	import { invalidateAll } from '$app/navigation';
	import { setContext } from 'svelte';
	import { APP_STATE_STORAGE_KEY, getApp } from '$lib/appState.svelte';
	import { AUTH_SESSION, type SessionUser } from '$lib/auth-context';
	import { realtimeClientLog } from '$lib/realtimeDebug';
	import { getRealtimeSocket } from '$lib/socket';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children, data } = $props();

	const auth = $state<{ sessionUser: SessionUser | null }>({ sessionUser: null });
	$effect(() => {
		auth.sessionUser = data.sessionUser;
	});
	setContext(AUTH_SESSION, auth);

	const app = getApp();

	/** Socket.IO when a Node server attaches it (dev / `node server.js`); polling fallback if the socket never connects. */
	let pollTimer: ReturnType<typeof setInterval> | undefined;
	let bootTimer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		if (!browser) return;
		const socket = getRealtimeSocket();
		if (!socket) return;

		const sessionUser = data.sessionUser;

		const bump = (source: string) => {
			realtimeClientLog('invalidateAll()', { source });
			void invalidateAll();
		};
		const onWorkspace = () => bump('socket:workspace:invalidate');
		const onReview = () => bump('socket:review:invalidate');
		socket.on('workspace:invalidate', onWorkspace);
		socket.on('review:invalidate', onReview);

		const armPoll = () => {
			if (pollTimer) return;
			realtimeClientLog('polling fallback ON (every 5s) — socket not usable');
			pollTimer = setInterval(() => bump('poll:fallback'), 5000);
		};
		const disarmPoll = () => {
			if (pollTimer) {
				clearInterval(pollTimer);
				pollTimer = undefined;
				realtimeClientLog('polling fallback OFF');
			}
		};

		/** Rooms are per socket connection — must run on every `connect` (reload, reconnect, wake from sleep). */
		const syncSessionRooms = () => {
			if (!sessionUser) {
				realtimeClientLog('syncSessionRooms skipped (no sessionUser)');
				return;
			}
			realtimeClientLog('emit joinUser', sessionUser.id.slice(0, 8) + '…', sessionUser.role);
			socket.emit('joinUser', sessionUser.id);
			if (sessionUser.role === 'admin') {
				realtimeClientLog('emit joinRole admin');
				socket.emit('joinRole', 'admin');
			}
		};

		const onConnect = () => {
			realtimeClientLog('socket connected', socket.id);
			disarmPoll();
			syncSessionRooms();
		};
		const onDisconnect = (reason: string) => {
			realtimeClientLog('socket disconnect', reason);
			armPoll();
		};
		const onConnectError = (err: unknown) => {
			const msg = err instanceof Error ? err.message : String(err);
			realtimeClientLog('socket connect_error', msg);
			armPoll();
		};

		socket.on('connect', onConnect);
		socket.on('disconnect', onDisconnect);
		socket.on('connect_error', onConnectError);

		realtimeClientLog('socket state', {
			connected: socket.connected,
			id: socket.id,
			hasSession: !!sessionUser
		});

		if (socket.connected) syncSessionRooms();
		else {
			bootTimer = setTimeout(() => {
				if (!socket.connected) {
					realtimeClientLog('socket still disconnected after 2.5s — arming poll');
					armPoll();
				}
			}, 2500);
		}

		return () => {
			socket.off('workspace:invalidate', onWorkspace);
			socket.off('review:invalidate', onReview);
			socket.off('connect', onConnect);
			socket.off('disconnect', onDisconnect);
			socket.off('connect_error', onConnectError);
			disarmPoll();
			if (bootTimer) clearTimeout(bootTimer);
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
