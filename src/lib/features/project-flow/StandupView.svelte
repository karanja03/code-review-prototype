<script lang="ts">
	import {
		completeStandup,
		getApp,
		reviewerCategoriesPossessivePhrase,
		reviewerSlotDisplayLabel,
		submitterDiscussionLabel,
		toggleStandup
	} from '$lib/appState.svelte';

	const app = getApp();

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

	const maxTakeaways = 1000;
</script>

<div class="max-w-2xl space-y-8">
	<header class="space-y-2">
		<p class="text-xs font-semibold uppercase tracking-wide text-kood-accent">Post-sprint</p>
		<h2 class="text-xl font-semibold text-kood-text">Standup · review call (≈45 minutes)</h2>
		<p class="text-sm text-kood-muted">
			This phase is the <strong class="text-kood-text/90">live</strong> debrief after the async sprint. Staff or
			experts may drop in occasionally — keep the channel name and time visible for everyone.
		</p>
	</header>

	<section class="rounded-xl border border-kood-border bg-kood-surface p-5">
		<h3 class="text-sm font-semibold text-kood-text">Meeting details</h3>
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
		<p class="mt-3 text-xs text-kood-muted/80">Use a short-lived project Discord; archive when the project closes.</p>
	</section>

	<section class="rounded-xl border border-kood-border bg-kood-surface p-5">
		<h3 class="text-sm font-semibold text-kood-text">Discussion guide (on the call)</h3>
		<p class="mt-2 text-xs text-kood-muted">
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
	</section>

	<section class="rounded-xl border border-kood-border bg-kood-surface p-5">
		<h3 class="text-sm font-semibold text-kood-text">Meeting summary</h3>
		<p class="mt-2 text-xs text-kood-muted">
			Good notes speed up learning and future reviews. Be clear, specific, and actionable.
		</p>
		<p class="mt-3 text-xs font-medium text-kood-text/90">Takeaways from this session</p>
		<p class="mt-1 text-[11px] text-kood-muted">
			What was discussed · Key feedback · Action items · Participants’ reflection
			<span class="block text-kood-muted/70">(Prototype: always editable.)</span>
		</p>
		<textarea
			class="mt-2 min-h-[140px] w-full resize-y rounded-lg border border-kood-border bg-kood-bg px-3 py-2 text-sm text-kood-text placeholder:text-kood-muted/70"
			maxlength={maxTakeaways}
			placeholder="We discussed the following points in the meeting…"
			bind:value={app.standupTakeaways}
		></textarea>
		<p class="mt-1 text-right text-[11px] text-kood-muted">
			{app.standupTakeaways.length} / {maxTakeaways}
		</p>
	</section>

	<div>
		<h3 class="text-sm font-semibold text-kood-text">Checklist</h3>
		<p class="mt-1 text-xs text-kood-muted">Check each item when it is true for this call.</p>
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
	</div>

	<button
		type="button"
		class="rounded-full bg-kood-accent px-5 py-2.5 text-sm font-bold text-kood-accent-foreground"
		onclick={() => completeStandup()}>Complete standup</button
	>
</div>
