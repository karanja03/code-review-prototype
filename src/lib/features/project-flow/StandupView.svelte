<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { tick } from 'svelte';
	import {
		addStandupTakeawayMessage,
		completeStandup,
		exportCodeReviewWorkspaceForPersistence,
		exportTestingStateForPersistence,
		getApp,
		getPersonaDisplayLabel,
		pushToast,
		reviewerCategoriesPossessivePhrase,
		reviewerSlotDisplayLabel,
		submitterDiscussionLabel,
		toggleStandup
	} from '$lib/appState.svelte';
	import { formatShortTimestamp } from '$lib/features/testing/testingUtils';

	type Proj = { id: string; status: string };

	let { project = null }: { project?: Proj | null } = $props();

	const app = getApp();

	const isSubmitter = $derived(app.role === 'sandra');
	const isReviewer = $derived(app.role === 'jane' || app.role === 'joe');
	/** Submitter + both reviewers can post takeaway bubbles and publish the thread. */
	const canEditTakeaways = $derived(isSubmitter || isReviewer);

	const takeawayThread = $derived(app.standupTakeawayMessages);

	/** Any linked project row — do not gate on status (standup can run while status still matches review flow). */
	const canPublishToServer = $derived(Boolean(project?.id));

	const slotJane = $derived(reviewerSlotDisplayLabel('jane'));
	const slotJoe = $derived(reviewerSlotDisplayLabel('joe'));
	const submitterName = $derived(submitterDiscussionLabel());

	const agenda = $derived([
		'Scheduled the ~45 min sync and shared time / voice channel with the team.',
		`Followed the structure: ${reviewerCategoriesPossessivePhrase('jane')} → ${reviewerCategoriesPossessivePhrase('joe')} → cross-review → ${submitterName} → shared actions.`,
		'Captured takeaways below (what was discussed, key feedback, action items, reflections).',
		'Confirmed everyone had space to speak; notes are specific enough to use later.',
		'Agreed what “done” means for this review before moving to Accept project.'
	]);

	const maxTakeawayChars = 2000;

	let takeawayDraft = $state('');

	let saveForm: HTMLFormElement | undefined = $state();
	let testingField: HTMLInputElement | undefined = $state();
	let codeField: HTMLInputElement | undefined = $state();

	async function submitStandupToServer() {
		await tick();
		const t = testingField;
		const c = codeField;
		const f = saveForm;
		const pid = project?.id;
		if (!pid) {
			pushToast('No project linked — open this screen from your assigned review (signed-in submitter or reviewer).');
			return;
		}
		if (!t || !c || !f) {
			pushToast('Save form is not ready — refresh the page and try again.');
			return;
		}
		t.value = JSON.stringify(exportTestingStateForPersistence());
		c.value = JSON.stringify(exportCodeReviewWorkspaceForPersistence());
		f.requestSubmit();
	}

	function postTakeaway() {
		addStandupTakeawayMessage(takeawayDraft);
		takeawayDraft = '';
	}
</script>

<!-- Full testing + code review JSON (includes standup block); all Publish buttons use this. -->
<form
	bind:this={saveForm}
	method="post"
	action="?/saveReviewState"
	class="hidden"
	use:enhance={() => {
		return async ({ result, update }) => {
			await update();
			if (result.type === 'success') {
				pushToast('Saved to server — others will see it after refresh.');
			} else if (result.type === 'failure') {
				pushToast('Save failed — check you are logged in and try again.');
			}
			await invalidateAll();
		};
	}}
>
	<input type="hidden" name="projectId" value={project?.id ?? ''} />
	<input bind:this={testingField} type="hidden" name="testingPayload" value="" />
	<input bind:this={codeField} type="hidden" name="codeReviewPayload" value="" />
</form>

<div class="max-w-2xl space-y-8">
	<header class="space-y-2">
		<p class="text-xs font-semibold uppercase tracking-wide text-kood-accent">Post-sprint</p>
		<h2 class="text-xl font-semibold text-kood-text">Standup · review call (≈45 minutes)</h2>
		<p class="text-sm text-kood-muted">
			This phase is the <strong class="text-kood-text/90">live</strong> debrief after the async sprint. Staff or
			experts may drop in occasionally — keep the channel name and time visible for everyone.
		</p>
		{#if !isSubmitter}
			<p class="text-xs text-amber-400/90">
				Meeting logistics and the checklist are entered by the <strong class="text-kood-text/90">submitter</strong> (call
				lead). What they save to the server appears here for reviewers.
			</p>
		{/if}
	</header>

	<section class="rounded-xl border border-kood-border bg-kood-surface p-5">
		<h3 class="text-sm font-semibold text-kood-text">Meeting details</h3>
		{#if isSubmitter}
			<div class="mt-4 grid gap-4 sm:grid-cols-2">
				<label class="block text-xs text-kood-muted">
					<span class="mb-1 block font-medium text-kood-text/90">Meeting start</span>
					<input
						type="datetime-local"
						class="mt-1 w-full rounded-lg border border-kood-border bg-kood-bg px-3 py-2 text-sm text-kood-text"
						bind:value={app.standupWhen}
					/>
				</label>
				<label class="block text-xs text-kood-muted">
					<span class="mb-1 block font-medium text-kood-text/90">Voice channel</span>
					<input
						type="text"
						class="mt-1 w-full rounded-lg border border-kood-border bg-kood-bg px-3 py-2 text-sm text-kood-text placeholder:text-kood-muted"
						placeholder="Discord voice channel name"
						bind:value={app.standupVoiceChannel}
					/>
				</label>
			</div>
			<p class="mt-3 text-xs text-kood-muted/80">
				Use a short-lived project Discord; archive when the project closes.
			</p>
			{#if canPublishToServer}
				<button
					type="button"
					class="mt-3 rounded-lg bg-kood-accent px-4 py-2 text-sm font-semibold text-kood-accent-foreground hover:opacity-95"
					onclick={() => submitStandupToServer()}>Publish meeting details</button
				>
				<p class="mt-2 text-[11px] text-kood-muted/85">
					Saves time and voice channel to the server (with your current testing &amp; code review snapshot) so
					reviewers see them after refresh.
				</p>
			{/if}
		{:else}
			<dl class="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
				<div>
					<dt class="text-xs font-medium text-kood-muted">Meeting start</dt>
					<dd class="mt-1 text-kood-text">{app.standupWhen.trim() ? app.standupWhen : '—'}</dd>
				</div>
				<div>
					<dt class="text-xs font-medium text-kood-muted">Voice channel</dt>
					<dd class="mt-1 break-words text-kood-text">{app.standupVoiceChannel.trim() ? app.standupVoiceChannel : '—'}</dd>
				</div>
			</dl>
		{/if}
	</section>

	<section class="rounded-xl border border-kood-border bg-kood-surface p-5">
		<details class="group" open={isSubmitter}>
			<summary
				class="cursor-pointer list-none text-sm font-semibold text-kood-text [&::-webkit-details-marker]:hidden"
			>
				<span class="inline-flex items-center gap-2">
					Discussion guide (on the call)
					{#if !isSubmitter}
						<span class="text-xs font-normal text-kood-muted">— tap to expand the full agenda</span>
					{/if}
				</span>
			</summary>
			<p class="mt-3 text-xs text-kood-muted">
				Facilitator keeps time; everyone else contributes under each block. Same order as on the Code review page.
			</p>
			<ol class="mt-4 list-decimal space-y-3 pl-5 text-sm text-kood-text/90">
				<li>
					<strong class="text-kood-text">{slotJane}</strong> — Security &amp; correctness: findings, feedback, fixes.
				</li>
				<li>
					<strong class="text-kood-text">{slotJoe}</strong> — Performance &amp; structure &amp; architecture: findings,
					feedback, fixes.
				</li>
				<li>
					<strong class="text-kood-text">Cross-review</strong> — How each reviewer engaged with the other’s focus
					areas (concrete examples).
				</li>
				<li>
					<strong class="text-kood-text">{submitterName}</strong> — Submitter perspective: what changed, what is still
					risky, what you need from reviewers before sign-off.
				</li>
				<li>
					<strong class="text-kood-text">Everyone</strong> — Action items, academy follow-ups, and alignment on
					closure.
				</li>
			</ol>
		</details>
	</section>

	<section class="rounded-xl border border-kood-border bg-kood-surface p-5">
		<h3 class="text-sm font-semibold text-kood-text">Meeting summary</h3>
		<p class="mt-2 text-xs text-kood-muted">
			Good notes speed up learning and future reviews. Be clear, specific, and actionable.
		</p>
		<p class="mt-3 text-xs font-medium text-kood-text/90">Takeaways thread</p>
		<p class="mt-1 text-[11px] text-kood-muted">
			Each person posts their own message; everyone sees the thread. Publish so others load it from the server.
		</p>

		<div
			class="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-lg border border-kood-border bg-kood-bg/40 px-2 py-2"
			role="log"
			aria-label="Standup takeaway messages"
		>
			{#if takeawayThread.length === 0}
				<p class="px-2 py-4 text-center text-xs text-kood-muted">No takeaways yet — be the first to post below.</p>
			{:else}
				{#each takeawayThread as m (m.id)}
					<div class="flex {m.author === app.role ? 'justify-end' : 'justify-start'}">
						<div
							class="max-w-[min(100%,22rem)] rounded-lg px-3 py-2 text-sm {m.author === app.role
								? 'bg-kood-accent/20 text-kood-text'
								: 'bg-kood-surface-raised text-kood-text/90 ring-1 ring-kood-border'}"
						>
							<div class="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-[10px] text-kood-muted">
								<span class="font-semibold text-kood-text/80">{getPersonaDisplayLabel(m.author)}</span>
								<span>{m.at ? formatShortTimestamp(m.at) : '—'}</span>
							</div>
							<p class="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed">{m.text}</p>
						</div>
					</div>
				{/each}
			{/if}
		</div>

		{#if canEditTakeaways}
			<div class="mt-4 rounded-lg border border-kood-border border-dashed bg-kood-bg/30 p-3">
				<label class="text-[11px] font-medium text-kood-muted" for="standup-takeaway-draft">Your takeaway</label>
				<textarea
					id="standup-takeaway-draft"
					rows="3"
					class="mt-1 w-full resize-y rounded-md border border-kood-border bg-kood-bg px-2.5 py-2 text-sm text-kood-text placeholder:text-kood-muted/60"
					maxlength={maxTakeawayChars}
					placeholder="Add your note for the thread…"
					bind:value={takeawayDraft}
				></textarea>
				<p class="mt-1 text-right text-[11px] text-kood-muted">{takeawayDraft.length} / {maxTakeawayChars}</p>
				<div class="mt-2 flex flex-wrap gap-2">
					<button
						type="button"
						class="rounded-lg bg-kood-surface-raised px-3 py-1.5 text-xs font-semibold text-kood-text ring-1 ring-kood-border hover:bg-kood-bg"
						disabled={!takeawayDraft.trim()}
						onclick={() => postTakeaway()}>Post to thread</button
					>
					{#if canPublishToServer}
						<button
							type="button"
							class="rounded-lg bg-kood-accent px-3 py-1.5 text-xs font-semibold text-kood-accent-foreground hover:opacity-95"
							onclick={() => submitStandupToServer()}>Publish thread to server</button
						>
					{/if}
				</div>
				{#if !canPublishToServer}
					<p class="mt-2 text-[11px] text-amber-400/90">
						Sign in on a paired project to publish the thread so others see it after refresh.
					</p>
				{/if}
			</div>
		{:else}
			<p class="mt-3 text-xs text-kood-muted/90">Read-only: only the submitter and paired reviewers can post here.</p>
		{/if}
	</section>

	<div>
		<h3 class="text-sm font-semibold text-kood-text">Checklist</h3>
		{#if isSubmitter}
			<p class="mt-1 text-xs text-kood-muted">You lead the call — check each item when it is true for this meeting.</p>
			<ul class="mt-4 space-y-3">
				{#each agenda as line, i (i)}
					<li class="flex items-start gap-3 rounded-xl border border-kood-border bg-kood-bg/40 p-4">
						<input
							type="checkbox"
							class="mt-1 h-4 w-4 shrink-0 rounded border border-kood-border bg-kood-surface-raised text-kood-accent focus:ring-kood-accent"
							checked={app.standupItems[i]}
							onchange={() => toggleStandup(i)}
						/>
						<span class="text-sm text-kood-text">{line}</span>
					</li>
				{/each}
			</ul>
			{#if canPublishToServer}
				<button
					type="button"
					class="mt-4 rounded-lg border border-kood-border bg-kood-bg px-4 py-2 text-sm font-medium text-kood-text hover:bg-kood-surface-raised"
					onclick={() => submitStandupToServer()}>Publish checklist progress</button
				>
				<p class="mt-2 text-[11px] text-kood-muted/85">
					Saves checklist state with your sprint snapshot so reviewers can follow along.
				</p>
			{/if}
		{:else}
			<p class="mt-1 text-xs text-kood-muted">Submitter progress (read-only)</p>
			<ul class="mt-4 space-y-3">
				{#each agenda as line, i (i)}
					<li class="flex items-start gap-3 rounded-xl border border-kood-border bg-kood-bg/40 p-4">
						<span
							class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border border-kood-border text-[11px] text-kood-muted"
							aria-hidden="true">{app.standupItems[i] ? '✓' : ''}</span>
						<span class="text-sm text-kood-text">{line}</span>
					</li>
				{/each}
			</ul>
	{/if}
</div>

	{#if isSubmitter}
		<button
			type="button"
			class="rounded-full bg-kood-accent px-5 py-2.5 text-sm font-bold text-kood-accent-foreground"
			onclick={() => completeStandup()}>Complete standup</button
		>
	{/if}
</div>
