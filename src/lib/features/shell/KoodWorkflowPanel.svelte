<script lang="ts">
	import {
		canRevisitPhaseInProgress,
		getApp,
		jumpPhase,
		PHASE_LABELS,
		isPhaseComplete,
		isPhaseCurrent
	} from '$lib/appState.svelte';
	import type { Phase } from '$lib/types';

	const app = getApp();

	const steps: Phase[] = [
		'project_completion',
		'testing',
		'code_review',
		'standup',
		'accept_project',
		'feedback_360'
	];

	function labelFor(p: Phase) {
		return PHASE_LABELS.find((x) => x.id === p)?.label ?? p;
	}

	const briefingMock = $derived(app.phase === 'briefing');

	function onStepClick(p: Phase) {
		if (briefingMock) return;
		if (!canRevisitPhaseInProgress(p, app.phase)) return;
		jumpPhase(p);
	}
</script>

<div class="relative">
	<p class="mb-4 text-xs font-semibold uppercase tracking-wide text-kood-muted">Progress</p>
	<p class="mb-3 text-[11px] leading-snug text-kood-muted/90">
		Click a <span class="text-kood-text/80">completed</span> step above your current one to revisit (e.g. Testing
		while in Code review). Your work is kept.
	</p>
	<ol class="relative space-y-0">
		{#each steps as p, i (p)}
			{@const isLast = i === steps.length - 1}
			{@const mockCurrent = briefingMock && i === 0}
			{@const mockDone = briefingMock && i === 1}
			{@const liveCurrent = !briefingMock && isPhaseCurrent(p, app.phase)}
			{@const liveDone = !briefingMock && isPhaseComplete(p, app.phase)}
			{@const revisit = !briefingMock && canRevisitPhaseInProgress(p, app.phase)}
			{@const future = !briefingMock && !liveCurrent && !liveDone}
			<li class="relative flex gap-3 pb-6 {isLast ? 'pb-0' : ''}">
				<div class="relative flex flex-col items-center">
					<button
						type="button"
						class="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition
							{mockCurrent || liveCurrent
							? 'bg-kood-accent text-kood-accent-foreground ring-2 ring-kood-accent/35'
							: mockDone || liveDone
								? revisit
									? 'cursor-pointer bg-kood-accent text-kood-accent-foreground hover:brightness-95'
									: 'bg-kood-accent text-kood-accent-foreground'
								: 'border border-kood-border bg-kood-surface text-kood-muted'}
							{future ? 'opacity-50' : ''}
							{revisit ? '' : 'cursor-default'}"
						aria-current={liveCurrent ? 'step' : undefined}
						aria-label={revisit ? `Revisit ${labelFor(p)}` : liveCurrent ? `Current: ${labelFor(p)}` : labelFor(p)}
						title={revisit ? `Revisit: ${labelFor(p)}` : undefined}
						onclick={() => onStepClick(p)}
					>
						{#if mockDone || liveDone}
							✓
						{:else}
							{i + 1}
						{/if}
					</button>
					{#if !isLast}
						{@const segGreen = briefingMock
							? i === 0
							: isPhaseComplete(steps[i], app.phase)}
						<div
							class="absolute left-1/2 top-8 h-[calc(100%-0.5rem)] w-0.5 -translate-x-1/2 {segGreen
								? 'bg-kood-accent/55'
								: 'bg-kood-border'}"
							aria-hidden="true"
						></div>
					{/if}
				</div>
				<div class="min-w-0 flex-1 pt-1">
					<button
						type="button"
						class="w-full text-left {revisit ? 'cursor-pointer hover:underline' : 'cursor-default'} {future
							? 'opacity-50'
							: ''}"
						aria-label={revisit ? `Revisit ${labelFor(p)}` : labelFor(p)}
						title={revisit ? `Revisit: ${labelFor(p)}` : undefined}
						onclick={() => onStepClick(p)}
					>
						<p
							class="text-sm font-medium leading-tight {mockCurrent || liveCurrent
								? 'text-kood-text'
								: mockDone || liveDone
									? 'text-kood-accent/90'
									: 'text-kood-muted'}"
						>
							{labelFor(p)}
						</p>
					</button>
				</div>
			</li>
		{/each}
	</ol>
	{#if briefingMock}
		<p class="mt-4 text-xs text-kood-muted">
			Press <span class="text-kood-text/80">Start</span> to begin the live journey.
		</p>
	{/if}
</div>
