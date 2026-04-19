<script lang="ts">
	import { browser } from '$app/environment';
	import { invalidateAll } from '$app/navigation';
	import { getContext } from 'svelte';
	import { io } from 'socket.io-client';
	import { setActiveCollaboration } from '$lib/collaborationContext';
	import {
		getApp,
		importCategorySessionsFromServer,
		importTestingStateFromServer,
		reviewerNeedsAssignmentGate,
		setCategoryAssigneeOverride,
		setRole,
		setWorkspaceDisplayNames,
		syncLiveReviewWorkspaceFromServer
	} from '$lib/appState.svelte';
	import { AUTH_SESSION, type SessionUser } from '$lib/auth-context';
	import ReviewProgressSave from '$lib/features/workspace/ReviewProgressSave.svelte';
	import WorkspaceStrip from '$lib/features/workspace/WorkspaceStrip.svelte';
	import ProjectBriefing from '$lib/features/briefing/ProjectBriefing.svelte';
	import ReviewerBriefingWait from '$lib/features/briefing/ReviewerBriefingWait.svelte';
	import CodeReviewView from '$lib/features/code-review/CodeReviewView.svelte';
	import AcceptView from '$lib/features/project-flow/AcceptView.svelte';
	import Feedback360View from '$lib/features/project-flow/Feedback360View.svelte';
	import ProjectCompletionView from '$lib/features/project-flow/ProjectCompletionView.svelte';
	import StandupView from '$lib/features/project-flow/StandupView.svelte';
	import DevJumpPanel from '$lib/features/shell/DevJumpPanel.svelte';
	import PrototypePageShell from '$lib/features/shell/PrototypePageShell.svelte';
	import ReviewerAssignmentPanel from '$lib/features/shell/ReviewerAssignmentPanel.svelte';
	import TestingView from '$lib/features/testing/TestingView.svelte';
	import ToastStack from '$lib/ui/ToastStack.svelte';

	const app = getApp();

	const reviewerGate = $derived(reviewerNeedsAssignmentGate(app.role));

	const auth = getContext<{ sessionUser: SessionUser | null }>(AUTH_SESSION);

	let { data } = $props();

	const reviewSaveContext = $derived.by(() => {
		const w = data.workspace;
		if (w.kind === 'submitter') {
			return { project: w.project, canMarkComplete: w.canMarkComplete };
		}
		if (w.kind === 'reviewer' && w.project) {
			return { project: w.project, canMarkComplete: w.canMarkComplete };
		}
		return null;
	});

	let syncedRoomKey = $state('');

	$effect(() => {
		if (!browser) return;
		const w = data.workspace;
		const p = w.kind === 'submitter' ? w.project : w.kind === 'reviewer' ? w.project : null;
		if (w.kind === 'other' || !p || !w.viewerId) {
			setActiveCollaboration(null);
			return () => setActiveCollaboration(null);
		}
		setActiveCollaboration({ projectId: p.id, userId: w.viewerId });
		const socket = io(window.location.origin, { path: '/socket.io', withCredentials: true });
		socket.emit('joinProject', p.id);
		const onInvalidate = () => {
			void invalidateAll();
		};
		socket.on('review:invalidate', onInvalidate);
		return () => {
			socket.emit('leaveProject', p.id);
			socket.off('review:invalidate', onInvalidate);
			socket.disconnect();
			setActiveCollaboration(null);
		};
	});

	$effect(() => {
		if (!browser) return;
		const w = data.workspace;
		const r = auth.sessionUser?.role;
		if (r === 'admin') {
			setCategoryAssigneeOverride(null);
			return () => setCategoryAssigneeOverride(null);
		}
		if (r === 'submitter' && w.kind === 'submitter') {
			setRole('sandra');
			setCategoryAssigneeOverride(w.categoryMap ?? null);
			return () => setCategoryAssigneeOverride(null);
		}
		if (r === 'reviewer' && w.kind === 'reviewer') {
			if (w.persona === 'jane' || w.persona === 'joe') setRole(w.persona);
			else setRole('jane');
			setCategoryAssigneeOverride(w.categoryMap ?? null);
			return () => setCategoryAssigneeOverride(null);
		}
		setCategoryAssigneeOverride(null);
	});

	$effect(() => {
		if (!browser) return;
		const w = data.workspace;
		if (w.kind === 'submitter' || w.kind === 'reviewer') {
			if (w.reviewRoom) {
				setWorkspaceDisplayNames({
					sandra: w.reviewRoom.submitterUsername,
					jane: w.reviewRoom.reviewerAUsername,
					joe: w.reviewRoom.reviewerBUsername
				});
				syncLiveReviewWorkspaceFromServer(w);
			} else {
				setWorkspaceDisplayNames(null);
			}
		} else {
			setWorkspaceDisplayNames(null);
		}
		return () => setWorkspaceDisplayNames(null);
	});

	$effect(() => {
		if (!browser) return;
		const w = data.workspace;
		const p = w.kind === 'submitter' ? w.project : w.kind === 'reviewer' ? w.project : null;
		if (!p) return;
		const key = `${p.id}:${p.updatedAt}:${p.codeReviewJson ?? ''}:${p.testingJson ?? ''}`;
		if (key === syncedRoomKey) return;
		syncedRoomKey = key;
		if (p.testingJson) {
			try {
				importTestingStateFromServer(JSON.parse(p.testingJson));
			} catch {
				/* ignore corrupt snapshot */
			}
		}
		if (p.codeReviewJson) {
			try {
				importCategorySessionsFromServer(JSON.parse(p.codeReviewJson));
			} catch {
				/* ignore corrupt snapshot */
			}
		}
	});
</script>

<svelte:head>
	<title>Mobile Messenger — //kood prototype</title>
</svelte:head>

<PrototypePageShell>
	<WorkspaceStrip workspace={data.workspace} />
	{#if reviewSaveContext}
		<ReviewProgressSave
			project={reviewSaveContext.project}
			canMarkComplete={reviewSaveContext.canMarkComplete}
		/>
	{/if}
	{#if app.phase === 'briefing'}
		{#if app.role === 'sandra'}
			<ProjectBriefing />
		{:else}
			<ReviewerBriefingWait />
		{/if}
	{:else if reviewerGate}
		<ReviewerAssignmentPanel />
	{:else if app.phase === 'project_completion'}
		<ProjectCompletionView workspace={data.workspace} />
	{:else if app.phase === 'testing'}
		<TestingView />
	{:else if app.phase === 'code_review'}
		<CodeReviewView />
	{:else if app.phase === 'standup'}
		<StandupView project={reviewSaveContext?.project ?? null} />
	{:else if app.phase === 'accept_project'}
		<AcceptView />
	{:else if app.phase === 'feedback_360'}
		<Feedback360View />
	{/if}
</PrototypePageShell>

<ToastStack />
{#if auth.sessionUser?.role === 'admin'}
	<DevJumpPanel />
{/if}
