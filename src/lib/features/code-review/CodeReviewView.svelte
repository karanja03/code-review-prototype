<script lang="ts">
	import { allCategoriesComplete, trainingBlurbFor } from '$lib/appState.svelte';
	import Accordion from '$lib/ui/Accordion.svelte';
	import CodeReview7Day from './CodeReview7Day.svelte';
	import CodeReviewSprintBoard from './CodeReviewSprintBoard.svelte';
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
		<strong class="text-kood-text/90">Async vs live:</strong> The sprint board below matches the Testing flow
		(Accept/Decline, threads, Jane’s vs Joe’s tabs). The structured call lives in
		<strong class="text-kood-text/90">Standup (post-sprint)</strong> once every observation is accepted.
	</div>

	<CodeReviewSprintBoard />

	{#if allCategoriesComplete()}
		<p class="text-sm text-kood-accent/90">
			All observations accepted. Open <strong class="text-kood-text">Standup (post-sprint)</strong> for meeting
			details, the discussion checklist, and takeaways.
		</p>
	{/if}

	<CodeReview7Day />

	<details class="rounded-xl border border-kood-border bg-kood-surface p-4 text-sm text-kood-muted">
		<summary class="cursor-pointer text-kood-text/90">Reviewer training hints (from Sandra's future ratings)</summary>
		<p class="mt-2">{trainingBlurbFor('jane')}</p>
		<p class="mt-1">{trainingBlurbFor('joe')}</p>
	</details>
</div>
