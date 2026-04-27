<script lang="ts">
	import { ACADEMY_BASE, CATEGORIES } from '$lib/constants';
	import { academyUrl, acceptReviewerAssignment, closeAcademyPanel, getApp, openAcademyPanel } from '$lib/appState.svelte';
	import ReviewAcademyPanel from '../code-review/ReviewAcademyPanel.svelte';

	const app = getApp();

	const role = $derived(app.role === 'jane' || app.role === 'joe' ? app.role : 'jane');
	const displayName = $derived(role === 'jane' ? 'You' : 'Joe');
	const peerName = $derived(role === 'jane' ? 'Joe' : 'You');

	const myCategories = $derived(CATEGORIES.filter((c) => c.assignee === role));

	let agreed = $state(false);

	/** You (jane) must tick the box; Joe never does in this demo. */
	const canContinue = $derived(role === 'joe' || agreed);

	function onConfirm() {
		if (!canContinue) return;
		acceptReviewerAssignment(role);
	}
</script>

<div class="mx-auto w-full max-w-5xl">
	<div class="overflow-hidden rounded-xl border border-kood-border bg-kood-surface">
		<div
			class="flex items-center gap-2 border-b border-kood-accent/25 bg-kood-accent/10 px-4 py-3"
			role="status"
		>
			<span class="h-2 w-2 shrink-0 rounded-full bg-kood-accent ring-2 ring-kood-accent/30"></span>
			<span class="text-sm font-semibold text-kood-text">Assignment · Mobile Messenger</span>
		</div>

		<div class="space-y-6 p-6">
			<header>
				<p class="text-xs font-semibold uppercase tracking-wide text-kood-accent">Reviewer</p>
				<h2 class="mt-1 text-xl font-semibold text-kood-text">
					{displayName}, you’ve been assigned to review this project
				</h2>
				<p class="mt-2 text-sm text-kood-muted">
					The submitter started the journey. Below are <strong class="text-kood-text/90">your</strong> categories
					and how to show up for them. {peerName} has a parallel assignment — you’ll each drive different boards
					during the code review sprint.
				</p>
			</header>

			<section>
				<h3 class="text-sm font-semibold text-kood-text">Your categories</h3>
				<p class="mt-1 text-xs text-kood-muted">
					Only you Accept / Decline on these; the other reviewer sees them read-only. Each line links to the matching
					module in Review Academy if you want a refresher.
				</p>
				<ul class="mt-3 space-y-3">
					{#each myCategories as c (c.id)}
						<li class="rounded-lg border border-kood-border bg-kood-bg/50 px-3 py-3 text-sm">
							<p class="font-medium text-kood-text">{c.title}</p>
							<p class="mt-1 text-xs leading-relaxed text-kood-muted">{c.assignmentBlurb}</p>
							<button
								type="button"
								class="mt-2 text-xs font-medium text-kood-accent cursor-pointer hover:underline"
								onclick={() => {
									openAcademyPanel(c.id);
								}}
							>
								Open in Review Academy →
							</button>
						</li>
					{/each}
				</ul>
				<p class="mt-3 text-xs text-kood-muted">
					Need the whole school, not just one topic?
					<a
						class="font-medium text-kood-accent underline-offset-2 hover:underline"
						href={ACADEMY_BASE}
						target="_blank"
						rel="noreferrer">Review Academy home</a
					>
				</p>
			</section>

			<section class="rounded-xl border border-kood-accent/20 bg-kood-accent/5 p-4">
				<h3 class="text-sm font-semibold text-kood-text">“This is a review, not a roast” 🍞</h3>
				<p class="mt-2 text-sm leading-relaxed text-kood-muted">
					We’re here for <strong class="text-kood-text/90">depth</strong>, not dunking. Assume Sandra already tried
					hard; your job is to make the next version safer and clearer—without making a human regret opening the repo.
				</p>
				<ul class="mt-3 list-none space-y-2 text-sm text-kood-text/90">
					<li class="flex gap-2">
						<span class="shrink-0" aria-hidden="true">🧠</span>
						<span
							><strong class="text-kood-text">Critique the code, cheer the effort.</strong> “This path could leak
							X” beats “why would anyone ship this.”</span
						>
					</li>
					<li class="flex gap-2">
						<span class="shrink-0" aria-hidden="true">🎯</span>
						<span
							><strong class="text-kood-text">Be specific.</strong> Point to files, lines, or flows. Vague dread
							helps nobody.</span
						>
					</li>
					<li class="flex gap-2">
						<span class="shrink-0" aria-hidden="true">🤝</span>
						<span
							><strong class="text-kood-text">Nudge = “please fix,” not “you’re fired.”</strong> Tie feedback to
							requirements and risk, not vibes.</span
						>
					</li>
					<li class="flex gap-2">
						<span class="shrink-0" aria-hidden="true">☕</span>
						<span
							><strong class="text-kood-text">If you’re tired, pause before sending.</strong> The diff will still
							be there after coffee. (Classic “don’t email angry,” but for Git.)</span
						>
					</li>
				</ul>
				<p class="mt-3 border-t border-kood-accent/15 pt-3 text-xs italic text-kood-muted">
					Internal monologue we endorse: <span class="not-italic text-kood-text/80"
						>“I am a helpful senior duck, not a comments-section goblin.”</span
					>
				</p>
			</section>

			<section class="rounded-lg border border-kood-border bg-kood-bg/30 p-4 text-sm text-kood-muted">
				<h3 class="text-sm font-semibold text-kood-text">Your responsibilities ({displayName})</h3>
				<ul class="mt-2 list-disc space-y-2 pl-5">
					{#if role === 'jane'}
						<li>Own <strong class="text-kood-text/90">Security</strong> and <strong class="text-kood-text/90">Correctness</strong> boards: fair, evidence-based checks.</li>
						<li>Use <strong class="text-kood-text/90">Decline</strong> plus the thread when something must change—clear, actionable, linked to what you saw.</li>
						<li>In <strong class="text-kood-text/90">testing</strong>, Accept/Decline only on <strong class="text-kood-text/90">your</strong> mandatory rows (split with your peer); comment anywhere.</li>
						<li>In <strong class="text-kood-text/90">standup</strong>, walk through your categories first, then join cross-review with curiosity.</li>
					{:else}
						<li>Own <strong class="text-kood-text/90">Performance</strong> and <strong class="text-kood-text/90">Structure &amp; architecture</strong> boards: scaling and maintainability, not micro-optimisation theatre.</li>
						<li>Use <strong class="text-kood-text/90">Decline</strong> plus the thread when something must change—clear, actionable, linked to what you saw.</li>
						<li>In <strong class="text-kood-text/90">testing</strong>, Accept/Decline only on <strong class="text-kood-text/90">your</strong> mandatory rows (split with your peer); comment anywhere.</li>
						<li>In <strong class="text-kood-text/90">standup</strong>, walk through your categories first, then join cross-review with curiosity.</li>
					{/if}
				</ul>
			</section>

			<section class="rounded-lg border border-kood-border/80 bg-kood-surface-raised/40 p-4 text-sm text-kood-muted">
				<h3 class="text-sm font-semibold text-kood-text">Submitter (Sandra) — different hat 🎩</h3>
				<p class="mt-2">
					Sandra ships fixes, answers threads, and may start new testing rounds. She doesn’t score your categories—you
					do. In standup, she connects “what changed” with “what still worries me.”
				</p>
			</section>

			<div class="border-t border-kood-border pt-4">
				{#if role === 'jane'}
					<label class="flex cursor-pointer items-start gap-3 text-sm text-kood-text/90">
						<input
							type="checkbox"
							class="mt-1 h-4 w-4 shrink-0 rounded border-kood-border bg-kood-surface-raised text-kood-accent focus:ring-kood-accent"
							bind:checked={agreed}
						/>
						<span>I understand my assignment and responsibilities, and I will start reviewing.</span>
					</label>
				{:else}
					<p class="text-sm text-kood-muted">
						In this prototype Joe is already on the hook—no extra confirmation step. Continue when you want to
						explore the flow as Joe.
					</p>
				{/if}
				<button
					type="button"
					class="mt-4 rounded-full bg-kood-accent px-6 py-2.5 text-sm font-bold text-kood-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
					disabled={!canContinue}
					onclick={onConfirm}>Confirm and continue</button
				>
			</div>
		</div>
	</div>
</div>

<ReviewAcademyPanel
	categoryId={app.openedAcademyCategory}
	onClose={() => closeAcademyPanel()}
/>
