<script lang="ts">
	import { displayNameForRole, getApp } from '$lib/appState.svelte';
	import { MESSENGER_REPO, PROJECT_MANDATORY_XP } from '$lib/koodUi';

	const app = getApp();
	const reviewer1Name = $derived(displayNameForRole('jane'));
	const reviewer2Name = $derived(displayNameForRole('joe'));
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

	{#if app.projectStarted}
		<div class="rounded-xl border border-kood-border bg-kood-surface p-3 text-xs">
			<p class="font-semibold uppercase tracking-wide text-kood-muted">Reviewer assignment</p>
			<p class="mt-2 text-kood-muted">Mobile Messenger — who has confirmed they will review.</p>
			<ul class="mt-2 space-y-1.5 text-sm">
				<li class="flex items-center justify-between gap-2">
					<span class="text-kood-text/90">{reviewer1Name}</span>
					<span
						class="rounded-md px-2 py-0.5 text-[11px] font-medium {app.reviewerAssignmentAccepted.jane
							? 'bg-kood-accent/20 text-kood-accent'
							: 'bg-kood-surface-raised text-kood-muted'}">{app.reviewerAssignmentAccepted.jane
							? 'Accepted'
							: 'Pending'}</span
					>
				</li>
				<li class="flex items-center justify-between gap-2">
					<span class="text-kood-text/90">{reviewer2Name}</span>
					<span
						class="rounded-md px-2 py-0.5 text-[11px] font-medium {app.reviewerAssignmentAccepted.joe
							? 'bg-kood-accent/20 text-kood-accent'
							: 'bg-kood-surface-raised text-kood-muted'}">{app.reviewerAssignmentAccepted.joe
							? 'Accepted'
							: 'Pending'}</span
					>
				</li>
			</ul>
			{#if app.reviewerAssignmentAccepted.jane && app.reviewerAssignmentAccepted.joe}
				<p class="mt-2 text-[11px] text-kood-accent/90">Both reviewers confirmed — good to proceed through testing.</p>
			{/if}
		</div>
	{/if}

	<div class="rounded-xl border border-kood-border bg-kood-surface p-3">
		<p class="text-2xl font-semibold text-kood-text">XP {app.xpMock} / {PROJECT_MANDATORY_XP}</p>
		<p class="text-xs text-kood-muted">Mock counter — nudges, standup, and ratings add XP.</p>
	</div>

	<div class="rounded-xl border border-kood-border bg-kood-surface p-3">
		<p class="text-xs font-semibold uppercase text-kood-muted">Reviews</p>
		<p class="mt-1 text-sm text-kood-muted">
			{app.submittedForReview
				? `${reviewer1Name} & ${reviewer2Name} assigned (demo).`
				: 'Submit task to see your reviewer(s).'}
		</p>
	</div>
</div>
