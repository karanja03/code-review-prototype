<script lang="ts">
	import {
		assignedSlotForCurrentUser,
		getApp,
		loginWithName,
		logoutUser,
		reviewerNeedsAssignmentGate,
		slotLabelText
	} from '$lib/appState.svelte';
	import ProjectBriefing from '$lib/features/briefing/ProjectBriefing.svelte';
	import ReviewerBriefingWait from '$lib/features/briefing/ReviewerBriefingWait.svelte';
	import CodeReviewView from '$lib/features/code-review/CodeReviewView.svelte';
	import AdminDashboard from '$lib/features/admin/AdminDashboard.svelte';
	import AcceptView from '$lib/features/project-flow/AcceptView.svelte';
	import Feedback360View from '$lib/features/project-flow/Feedback360View.svelte';
	import ProjectCompletionView from '$lib/features/project-flow/ProjectCompletionView.svelte';
	import StandupView from '$lib/features/project-flow/StandupView.svelte';
	import CurriculumLeftNav from '$lib/features/shell/CurriculumLeftNav.svelte';
	import DevJumpPanel from '$lib/features/shell/DevJumpPanel.svelte';
	import KoodRightChrome from '$lib/features/shell/KoodRightChrome.svelte';
	import KoodWorkflowPanel from '$lib/features/shell/KoodWorkflowPanel.svelte';
	import ReviewerAssignmentPanel from '$lib/features/shell/ReviewerAssignmentPanel.svelte';
	import SidebarMeta from '$lib/features/shell/SidebarMeta.svelte';
	import TestingView from '$lib/features/testing/TestingView.svelte';
	import Modal from '$lib/ui/Modal.svelte';
	import ToastStack from '$lib/ui/ToastStack.svelte';

	const app = getApp();
	let loginName = $state('');
	const currentUserLabel = $derived(app.currentUserName.trim() || 'Unknown user');
	const assignedSlot = $derived(assignedSlotForCurrentUser());
	const assignedSlotLabel = $derived(slotLabelText(assignedSlot));
	const currentRoleLabel = $derived(
		app.role === 'sandra' ? 'Submitter' : app.role === 'jane' ? 'Reviewer 1' : 'Reviewer 2'
	);
	let assignmentModalOpen = $state(false);
	let roleNoticeKeySeen = $state('');

	const reviewerGate = $derived(reviewerNeedsAssignmentGate(app.role));

	function onLoginSubmit(event: SubmitEvent) {
		event.preventDefault();
		loginWithName(loginName);
		if (app.loggedIn) loginName = '';
	}

	function roleNoticeKey(): string {
		const slot = assignedSlot;
		if (!slot || !app.currentUserName.trim()) return '';
		return `${app.currentUserName.trim().toLowerCase()}::${slot}`;
	}

	$effect(() => {
		if (!app.loggedIn || app.isAdminSession) return;
		const key = roleNoticeKey();
		if (!key) return;
		if (key === roleNoticeKeySeen) return;
		roleNoticeKeySeen = key;
		assignmentModalOpen = true;
	});
</script>

<svelte:head>
	<title>Mobile Messenger — //kood prototype</title>
</svelte:head>

<div class="min-h-screen bg-kood-bg text-kood-text">
	{#if !app.loggedIn}
		<div class="login-screen relative min-h-screen overflow-hidden">
			<div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_32%,rgba(220,249,0,0.08),transparent_42%),radial-gradient(circle_at_86%_10%,rgba(220,249,0,0.05),transparent_34%)]"></div>
			<header class="relative z-20 mx-auto flex w-full max-w-[1280px] items-center justify-between px-6 py-7 md:px-10">
				<p class="font-mono text-3xl font-semibold tracking-tight text-kood-text">//kood</p>
				<div class="flex items-center gap-3 text-sm">
				</div>
			</header>

			<div class="relative z-10 mx-auto grid min-h-[calc(100vh-96px)] w-full max-w-[1280px] grid-cols-1 items-center gap-12 px-6 pb-10 md:px-10 lg:grid-cols-[1.1fr_0.9fr]">
				<section class="relative space-y-6">
					<div class="absolute -left-5 top-16 h-16 w-16 rounded-full bg-kood-accent/85"></div>
					<div class="absolute -left-2 top-40 h-12 w-12 rounded-full bg-kood-accent/75"></div>
					<p class="relative z-10 font-mono text-4xl font-semibold tracking-tight text-kood-text md:text-5xl">
						Where IT careers start
					</p>
					<p class="max-w-[520px] text-base text-kood-muted">
						Join the session, collaborate, and move through the review journey with your team.
					</p>
					<div class="hero-photo-shell mt-6 h-[260px] w-full max-w-[620px] overflow-hidden">
						<div class="hero-photo-image"></div>
						<div class="hero-photo-vignette"></div>
					</div>
				</section>

				<section class="relative">
					<div class="pointer-events-none absolute -right-6 -top-6 hidden h-32 w-32 rounded-full border border-kood-accent/25 lg:block"></div>
					<div class="pointer-events-none absolute -right-14 top-1/2 hidden h-48 w-48 -translate-y-1/2 rounded-full border border-kood-accent/15 lg:block"></div>
					<div class="pointer-events-none absolute -right-8 top-16 hidden h-44 w-44 bg-[radial-gradient(circle,rgba(220,249,0,0.5)_1px,transparent_1px)] bg-[length:14px_14px] opacity-35 lg:block"></div>

					<form
						class="relative rounded-2xl border border-kood-border/80 bg-kood-surface/95 p-6 shadow-[0_16px_40px_rgba(7,10,17,0.45)] md:p-8"
						onsubmit={onLoginSubmit}
					>
						<p class="text-3xl font-semibold tracking-tight text-kood-text">Log in</p>
						<p class="mt-2 text-sm text-kood-muted">Enter your name to continue.</p>

						<label class="mt-6 block space-y-2">
							<span class="text-xs font-semibold uppercase tracking-wide text-kood-muted">Name</span>
							<input
								type="text"
								class="w-full rounded-lg border border-kood-border/90 bg-kood-bg px-3 py-2.5 text-sm text-kood-text outline-none transition focus:border-kood-accent"
								placeholder="e.g. James"
								bind:value={loginName}
								maxlength={50}
								required
							/>
						</label>

						<button
							type="submit"
							class="mt-6 w-full rounded-lg bg-kood-accent px-4 py-2.5 text-sm font-semibold text-kood-accent-foreground transition hover:brightness-95"
						>
							Start
						</button>

						<div class="mt-3 text-center text-xs text-kood-muted/70">
							No password needed in this phase. Use "admin" for admin dashboard.
						</div>
					</form>
				</section>
			</div>
		</div>
	{:else if app.isAdminSession}
		<AdminDashboard />
	{:else}
		<div class="mx-auto flex min-h-screen max-w-[1700px] flex-col lg:flex-row">
			<aside
				class="flex w-full shrink-0 flex-col border-b border-kood-border lg:w-[240px] lg:border-b-0 lg:border-r lg:px-4 lg:py-5"
			>
				<div class="px-4 pt-4 lg:px-0 lg:pt-0">
					<p class="font-mono text-lg font-semibold tracking-tight text-kood-text">//kood</p>
					<p class="mt-0.5 text-[10px] uppercase tracking-wider text-kood-muted/70">Prototype UI</p>
				</div>

				<div class="mt-5 px-4 lg:px-0">
					<div class="mb-3 rounded-lg border border-kood-border bg-kood-surface-raised px-3 py-2 text-xs text-kood-muted">
						Signed in as <span class="font-semibold text-kood-text">{currentUserLabel}</span>
					</div>
					<CurriculumLeftNav />
				</div>

				<div class="mt-auto space-y-2 border-t border-kood-border px-4 py-4 text-xs text-kood-muted lg:border-0 lg:px-0 lg:pb-0">
					<p class="flex items-center gap-2"><span>🌙</span> Dark</p>
					<p class="flex items-center gap-2"><span>☕</span> Gitea</p>
					<p class="flex items-center gap-2"><span>👤</span> {currentUserLabel}</p>
					<button
						type="button"
						class="text-kood-muted/70 underline-offset-2 hover:text-kood-text hover:underline"
						onclick={logoutUser}
					>
						Log out
					</button>
				</div>
			</aside>

			<main class="min-w-0 flex-1 px-4 py-6 lg:px-10 lg:py-8">
				<div class="mb-4 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<div class="rounded-lg border border-kood-border bg-kood-surface-raised px-3 py-2 text-sm text-kood-muted">
							Hello, <span class="font-semibold text-kood-text">{currentUserLabel}</span> 👋
						</div>
						<div class="rounded-full border border-kood-accent/45 bg-kood-accent/15 px-3 py-1 text-xs font-semibold text-kood-text">
							{currentRoleLabel}
						</div>
					</div>
					<button
						type="button"
						class="rounded-lg border border-kood-border bg-kood-surface px-3 py-2 text-sm text-kood-text transition hover:border-kood-accent/40"
						onclick={logoutUser}
					>
						Log out
					</button>
				</div>
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
	{/if}
</div>

<ToastStack />
<DevJumpPanel />
<Modal bind:open={assignmentModalOpen} title="Role assigned 🎉">
	{#snippet children()}
		<p>
			Hey <strong>{currentUserLabel}</strong>, you were assigned as
			<strong>{assignedSlotLabel}</strong> in this project.
		</p>
		<p class="mt-2 text-kood-muted">Your dashboard and workflow now match that role.</p>
	{/snippet}
	{#snippet footer()}
		<button
			type="button"
			class="rounded-lg bg-kood-accent px-3 py-1.5 text-sm font-semibold text-kood-accent-foreground"
			onclick={() => (assignmentModalOpen = false)}
		>
			Close
		</button>
	{/snippet}
</Modal>

<style>
	.hero-photo-shell {
		position: relative;
		background: transparent;
	}

	.hero-photo-image {
		position: absolute;
		inset: 0;
		background-image: url('/hero-login.jpg');
		background-size: cover;
		background-position: center;
		/* Show the photo only inside two diagonal stripe windows. */
		-webkit-mask-image: linear-gradient(
			-30deg,
			transparent 0%,
			transparent 24%,
			#000 24%,
			#000 42%,
			transparent 42%,
			transparent 58%,
			#000 58%,
			#000 76%,
			transparent 76%,
			transparent 100%
		);
		mask-image: linear-gradient(
			-30deg,
			transparent 0%,
			transparent 24%,
			#000 24%,
			#000 42%,
			transparent 42%,
			transparent 58%,
			#000 58%,
			#000 76%,
			transparent 76%,
			transparent 100%
		);
	}

	.hero-photo-vignette {
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, rgba(22, 30, 46, 0.06), rgba(22, 30, 46, 0.24));
	}
</style>
