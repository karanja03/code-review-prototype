<script lang="ts">
	import { getApp, reviewerNeedsAssignmentGate } from '$lib/appState.svelte';
	import ProjectBriefing from '$lib/features/briefing/ProjectBriefing.svelte';
	import ReviewerBriefingWait from '$lib/features/briefing/ReviewerBriefingWait.svelte';
	import CodeReviewView from '$lib/features/code-review/CodeReviewView.svelte';
	import AcceptView from '$lib/features/project-flow/AcceptView.svelte';
	import Feedback360View from '$lib/features/project-flow/Feedback360View.svelte';
	import ProjectCompletionView from '$lib/features/project-flow/ProjectCompletionView.svelte';
	import StandupView from '$lib/features/project-flow/StandupView.svelte';
	import CurriculumLeftNav from '$lib/features/shell/CurriculumLeftNav.svelte';
	import DevJumpPanel from '$lib/features/shell/DevJumpPanel.svelte';
	import KoodRightChrome from '$lib/features/shell/KoodRightChrome.svelte';
	import KoodWorkflowPanel from '$lib/features/shell/KoodWorkflowPanel.svelte';
	import ReviewerAssignmentPanel from '$lib/features/shell/ReviewerAssignmentPanel.svelte';
	import RoleSwitcher from '$lib/features/shell/RoleSwitcher.svelte';
	import SidebarMeta from '$lib/features/shell/SidebarMeta.svelte';
	import TestingView from '$lib/features/testing/TestingView.svelte';
	import ToastStack from '$lib/ui/ToastStack.svelte';

	const app = getApp();

	const reviewerGate = $derived(reviewerNeedsAssignmentGate(app.role));
</script>

<svelte:head>
	<title>Mobile Messenger — //kood prototype</title>
</svelte:head>

<div class="min-h-screen bg-kood-bg text-kood-text">
	<div class="mx-auto flex min-h-screen max-w-[1700px] flex-col lg:flex-row">
		<aside
			class="flex w-full shrink-0 flex-col border-b border-kood-border lg:w-[240px] lg:border-b-0 lg:border-r lg:px-4 lg:py-5"
		>
			<div class="px-4 pt-4 lg:px-0 lg:pt-0">
				<p class="font-mono text-lg font-semibold tracking-tight text-kood-text">//kood</p>
				<p class="mt-0.5 text-[10px] uppercase tracking-wider text-kood-muted/70">Prototype UI</p>
			</div>

			<div class="mt-5 px-4 lg:px-0">
				<CurriculumLeftNav />
			</div>

			<div class="mt-6 border-t border-kood-border px-4 py-4 lg:px-0">
				<p class="text-xs font-semibold uppercase tracking-wide text-kood-muted">Demo</p>
				<p class="mt-2 text-xs text-kood-muted">Switch persona for sprint + 360° flows</p>
				<div class="mt-2">
					<RoleSwitcher />
				</div>
			</div>

			<div class="mt-auto space-y-2 border-t border-kood-border px-4 py-4 text-xs text-kood-muted lg:border-0 lg:px-0 lg:pb-0">
				<p class="flex items-center gap-2"><span>🌙</span> Dark</p>
				<p class="flex items-center gap-2"><span>☕</span> Gitea</p>
				<p class="flex items-center gap-2"><span>👤</span> Wambui Karanja</p>
				<p class="text-kood-muted/70">Log out</p>
			</div>
		</aside>

		<main class="min-w-0 flex-1 px-4 py-6 lg:px-10 lg:py-8">
			{#if app.phase === 'briefing'}
				{#if app.role === 'sandra'}
					<ProjectBriefing />
				{:else}
					<ReviewerBriefingWait />
				{/if}
			{:else if reviewerGate}
				<ReviewerAssignmentPanel />
			{:else if app.phase === 'project_completion'}
				<ProjectCompletionView />
			{:else if app.phase === 'testing'}
				<TestingView />
			{:else if app.phase === 'code_review'}
				<CodeReviewView />
			{:else if app.phase === 'standup'}
				<StandupView />
			{:else if app.phase === 'accept_project'}
				<AcceptView />
			{:else if app.phase === 'feedback_360'}
				<Feedback360View />
			{/if}
		</main>

		<aside
			class="w-full shrink-0 border-t border-kood-border px-4 py-6 lg:w-[300px] lg:border-l lg:border-t-0 lg:px-5 lg:py-8"
		>
			<KoodWorkflowPanel />
			<div class="mt-8">
				<SidebarMeta />
			</div>
			<KoodRightChrome />
		</aside>
	</div>
</div>

<ToastStack />
<DevJumpPanel />
