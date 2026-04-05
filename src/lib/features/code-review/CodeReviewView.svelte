<script lang="ts">
	import { allCategoriesComplete, goToStandup, trainingBlurbFor } from '$lib/appState.svelte';
	import { CATEGORIES } from '$lib/constants';
	import Accordion from '$lib/ui/Accordion.svelte';
	import CategoryPanel from './CategoryPanel.svelte';
	import CodeReview7Day from './CodeReview7Day.svelte';
</script>

<div class="space-y-6">
	<header class="space-y-3">
		<p class="text-xs font-semibold uppercase tracking-wide text-kood-accent">Code review</p>
		<h2 class="text-2xl font-semibold tracking-tight text-kood-text">The heart of quality feedback</h2>
		<p class="max-w-3xl text-sm leading-relaxed text-kood-muted">
			Code reviews help you spot different ways to solve problems, sharpen reflection, and raise coding quality.
			It is not about right or wrong — it is about leaning into a deep technical discussion.
		</p>
		<div class="flex flex-wrap gap-2 pt-1">
			<span class="rounded-full bg-kood-accent/15 px-2.5 py-0.5 text-xs font-semibold text-kood-accent">+10</span>
			<span class="rounded-full bg-kood-accent/15 px-2.5 py-0.5 text-xs font-semibold text-kood-accent">+10</span>
			<span class="text-xs text-kood-muted">Teamwork XP for active participation in the review call (mock).</span>
		</div>
	</header>

	<section class="rounded-xl border border-kood-border bg-kood-surface p-5 text-sm text-kood-muted">
		<h3 class="text-sm font-semibold text-kood-text">By participating, you will</h3>
		<ul class="mt-3 list-disc space-y-2 pl-5">
			<li>Refine your skills and reinforce good practices.</li>
			<li>Learn to communicate clearly about technical decisions.</li>
			<li>Keep standards high while collaborating with peers.</li>
		</ul>
	</section>

	<section class="rounded-xl border border-kood-border bg-kood-surface p-5">
		<h3 class="text-sm font-semibold text-kood-text">Instructions</h3>
		<ol class="mt-3 list-decimal space-y-2 pl-5 text-sm text-kood-muted">
			<li>
				<strong class="text-kood-text/90">Schedule</strong> a ~45 minute meeting after the sprint categories are
				all accepted. Add time and place in <strong class="text-kood-text/90">Standup (post-sprint)</strong> — that
				phase stays separate so async review and the live call stay distinct.
			</li>
			<li>
				<strong class="text-kood-text/90">Prepare</strong> individually before the call. Align on who already
				looked at which parts of the repo (here: Jane → Security &amp; Exception handling, Joe → Readability &amp;
				Comments).
			</li>
			<li>
				<strong class="text-kood-text/90">During the session</strong> take notes. Anyone can facilitate; capture
				takeaways in the standup screen so they stay actionable.
			</li>
		</ol>
	</section>

	<Accordion title="What to discuss on the call (structure)" badge="Post-sprint" defaultOpen={false}>
		<p class="text-kood-muted">
			Use this order so the conversation stays fair and complete. It mirrors how work was split in this sprint.
		</p>
		<ol class="mt-4 list-decimal space-y-4 pl-5 text-sm text-kood-text/90">
			<li>
				<strong class="text-kood-text">Jane — assigned categories</strong>
				<span class="text-kood-muted"> (Security, Exception handling)</span>
				<p class="mt-1 text-kood-muted">
					Walk through main findings, nudges sent to Sandra, and what changed since. Peers ask clarifying questions
					only — Jane owns the narrative for her scope.
				</p>
			</li>
			<li>
				<strong class="text-kood-text">Joe — assigned categories</strong>
				<span class="text-kood-muted"> (Readability, How to write comments)</span>
				<p class="mt-1 text-kood-muted">
					Same pattern: outcomes, trade-offs, anything still fuzzy. Keep cross-talk light until step 3.
				</p>
			</li>
			<li>
				<strong class="text-kood-text">Cross-review awareness</strong>
				<p class="mt-1 text-kood-muted">
					How did each reviewer show up in the <em>other</em> person’s themes? (e.g. security-aware comments in
					readable code, or clarity risks in exception paths.) Aim for constructive, specific examples.
				</p>
			</li>
			<li>
				<strong class="text-kood-text">Sandra (submitter)</strong>
				<p class="mt-1 text-kood-muted">
					How you responded to feedback, what was hard to fix, and what you would still like reviewers to sanity-check.
					Agree on any remaining risk or follow-up demos.
				</p>
			</li>
			<li>
				<strong class="text-kood-text">Everyone — close the loop</strong>
				<p class="mt-1 text-kood-muted">
					Shared action items, academy or docs follow-ups, and a crisp “done for this review” line so the project can
					move to accept / 360° feedback without loose ends.
				</p>
			</li>
		</ol>
	</Accordion>

	<div class="rounded-lg border border-kood-border bg-kood-bg/50 px-4 py-3 text-xs text-kood-muted">
		<strong class="text-kood-text/90">Async vs live:</strong> The panels below are the sprint (async). The structured
		call lives in <strong class="text-kood-text/90">Standup (post-sprint)</strong> once every category shows complete.
	</div>

	<header class="border-t border-kood-border pt-6">
		<h2 class="text-xl font-semibold text-kood-text">Sprint · category boards</h2>
		<p class="mt-1 text-sm text-kood-muted">
			Structured review for <strong class="text-kood-text">Mobile Messenger</strong>. Four categories are
			auto-assigned (FIFO demo): <strong class="text-kood-text">Jane</strong> → Security &amp; Exception handling ·
			<strong class="text-kood-text">Joe</strong> → Code readability &amp; Comments. Peers see each other's
			categories read-only. Only the assignee can accept or nudge.
		</p>
	</header>

	<div class="grid gap-3 rounded-xl border border-kood-border bg-kood-surface p-4 sm:grid-cols-2">
		<div>
			<p class="text-xs font-semibold uppercase text-kood-muted">Jane</p>
			<p class="text-sm text-kood-text/90">Security, Exception handling</p>
		</div>
		<div>
			<p class="text-xs font-semibold uppercase text-kood-muted">Joe</p>
			<p class="text-sm text-kood-text/90">Code readability, How to write comments</p>
		</div>
	</div>

	<div class="grid gap-4 lg:grid-cols-2">
		{#each CATEGORIES as cat (cat.id)}
			<CategoryPanel category={cat} />
		{/each}
	</div>

	<CodeReview7Day />

	<div class="flex flex-wrap items-center gap-3">
		<button
			type="button"
			class="rounded-full bg-kood-accent px-5 py-2.5 text-sm font-bold text-kood-accent-foreground disabled:opacity-40"
			disabled={!allCategoriesComplete()}
			onclick={() => goToStandup()}>Complete sprint → Standup</button
		>
	</div>

	{#if allCategoriesComplete()}
		<p class="text-sm text-kood-accent/90">
			All categories accepted. Open <strong class="text-kood-text">Standup (post-sprint)</strong> for meeting details,
			the discussion checklist, and takeaways.
		</p>
	{/if}

	<details class="rounded-xl border border-kood-border bg-kood-surface p-4 text-sm text-kood-muted">
		<summary class="cursor-pointer text-kood-text/90">Reviewer training hints (from Sandra's future ratings)</summary>
		<p class="mt-2">{trainingBlurbFor('jane')}</p>
		<p class="mt-1">{trainingBlurbFor('joe')}</p>
	</details>
</div>
