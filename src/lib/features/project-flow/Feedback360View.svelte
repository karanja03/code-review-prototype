<script lang="ts">
	import { getApp, setReviewerRating, setSandraRating, trainingBlurbFor } from '$lib/appState.svelte';
	import { CATEGORIES } from '$lib/constants';

	const app = getApp();

	const sandraBlocks = $derived(
		CATEGORIES.map((c) => ({
			cat: c,
			rating: app.sandraRatings.find((r) => r.categoryId === c.id)!
		}))
	);

	const reviewerBlock = $derived(
		app.role === 'jane' || app.role === 'joe' ? app.reviewerRatings[app.role] : null
	);

	function submitSandra(categoryId: string) {
		const r = app.sandraRatings.find((x) => x.categoryId === categoryId);
		if (!r || r.score === null) return;
		setSandraRating(categoryId, r.score, r.comment);
	}

	function submitReviewer(reviewer: 'jane' | 'joe', key: 'readableCode' | 'codeComments' | 'crossReviewer') {
		const b = app.reviewerRatings[reviewer][key];
		if (b.score === null) return;
		setReviewerRating(reviewer, key, b.score, b.comment);
	}

	function parseScore(v: string): number | null {
		return v === '' ? null : Number(v);
	}
</script>

<div class="space-y-10">
	<h2 class="text-xl font-semibold text-kood-text">360° feedback</h2>
	<p class="text-sm text-kood-muted">
		Sandra rates reviewers on the categories they owned. Reviewers rate Sandra's code traits and cross-review
		awareness. Scores are mocked into profiles, XP, and training nudges.
	</p>

	{#if app.role === 'sandra'}
		<section class="space-y-4">
			<h3 class="text-lg font-medium text-kood-text">Rate reviewers (1 = Bad, 5 = Good)</h3>
			<div class="grid gap-4 md:grid-cols-2">
				{#each sandraBlocks as { cat, rating } (cat.id)}
					<div class="rounded-xl border border-kood-border bg-kood-surface p-4">
						<p class="text-sm font-medium text-kood-text">{cat.title}</p>
						<p class="text-xs text-kood-muted">
							Reviewer: {cat.assignee === 'jane' ? 'You' : 'Joe'}
						</p>
						<label class="mt-3 block text-xs text-kood-muted" for="sc-{cat.id}">Score</label>
						<select
							id="sc-{cat.id}"
							class="mt-1 w-full rounded-lg border border-kood-border bg-kood-bg px-2 py-2 text-sm text-kood-text disabled:opacity-50"
							disabled={rating.submitted}
							value={rating.score === null ? '' : String(rating.score)}
							onchange={(e) =>
								(rating.score = parseScore((e.currentTarget as HTMLSelectElement).value))}
						>
							<option value="">Choose…</option>
							{#each [1, 2, 3, 4, 5] as n (n)}
								<option value={n}>{n}</option>
							{/each}
						</select>
						<label class="mt-2 block text-xs text-kood-muted" for="tx-{cat.id}">Comment</label>
						<textarea
							id="tx-{cat.id}"
							rows="2"
							class="mt-1 w-full rounded-lg border border-kood-border bg-kood-bg px-2 py-2 text-sm text-kood-text disabled:opacity-50"
							disabled={rating.submitted}
							bind:value={rating.comment}
						></textarea>
						{#if rating.submitted}
							<p class="mt-2 text-xs text-kood-accent">Submitted</p>
						{:else}
							<button
								type="button"
								class="mt-3 rounded-lg bg-kood-accent px-3 py-1.5 text-xs font-bold text-kood-accent-foreground"
								onclick={() => submitSandra(cat.id)}>Submit</button
							>
						{/if}
					</div>
				{/each}
			</div>
			<div class="rounded-xl border border-kood-border bg-kood-surface p-4 text-sm text-kood-muted">
				<p class="font-medium text-kood-text/90">Profile hints (mock)</p>
				<p class="mt-1">{trainingBlurbFor('jane')}</p>
				<p class="mt-1">{trainingBlurbFor('joe')}</p>
			</div>
		</section>
	{:else if reviewerBlock}
		<section class="space-y-4">
			<h3 class="text-lg font-medium text-kood-text">
				{app.role === 'joe' ? 'Joe' : 'You'} — rate Sandra & cross-reviewer
			</h3>
			<p class="text-sm text-kood-muted">
				Scale for cross input: 1 = No cross input · 3 = Minor · 5 = Constructive cross input on areas you did
				not own.
			</p>

			<div class="grid gap-4 md:grid-cols-2">
				<div class="rounded-xl border border-kood-border bg-kood-surface p-4">
					<p class="text-sm font-medium text-kood-text">Sandra — structure &amp; architecture</p>
					<select
						class="mt-2 w-full rounded-lg border border-kood-border bg-kood-bg px-2 py-2 text-sm text-kood-text disabled:opacity-50"
						disabled={reviewerBlock.readableCode.submitted}
						value={reviewerBlock.readableCode.score === null
							? ''
							: String(reviewerBlock.readableCode.score)}
						onchange={(e) =>
							(reviewerBlock.readableCode.score = parseScore(
								(e.currentTarget as HTMLSelectElement).value
							))}
					>
						<option value="">Score…</option>
						{#each [1, 2, 3, 4, 5] as n (n)}
							<option value={n}>{n}</option>
						{/each}
					</select>
					<textarea
						rows="2"
						class="mt-2 w-full rounded-lg border border-kood-border bg-kood-bg px-2 py-2 text-sm text-kood-text"
						disabled={reviewerBlock.readableCode.submitted}
						bind:value={reviewerBlock.readableCode.comment}
					></textarea>
					{#if !reviewerBlock.readableCode.submitted}
						<button
							type="button"
							class="mt-2 rounded-lg bg-kood-accent px-3 py-1.5 text-xs font-bold text-kood-accent-foreground"
							onclick={() => submitReviewer(app.role as 'jane' | 'joe', 'readableCode')}>Submit</button
						>
					{:else}
						<p class="mt-2 text-xs text-kood-accent">Submitted</p>
					{/if}
				</div>

				<div class="rounded-xl border border-kood-border bg-kood-surface p-4">
					<p class="text-sm font-medium text-kood-text">Sandra — performance</p>
					<select
						class="mt-2 w-full rounded-lg border border-kood-border bg-kood-bg px-2 py-2 text-sm text-kood-text disabled:opacity-50"
						disabled={reviewerBlock.codeComments.submitted}
						value={reviewerBlock.codeComments.score === null
							? ''
							: String(reviewerBlock.codeComments.score)}
						onchange={(e) =>
							(reviewerBlock.codeComments.score = parseScore(
								(e.currentTarget as HTMLSelectElement).value
							))}
					>
						<option value="">Score…</option>
						{#each [1, 2, 3, 4, 5] as n (n)}
							<option value={n}>{n}</option>
						{/each}
					</select>
					<textarea
						rows="2"
						class="mt-2 w-full rounded-lg border border-kood-border bg-kood-bg px-2 py-2 text-sm text-kood-text"
						disabled={reviewerBlock.codeComments.submitted}
						bind:value={reviewerBlock.codeComments.comment}
					></textarea>
					{#if !reviewerBlock.codeComments.submitted}
						<button
							type="button"
							class="mt-2 rounded-lg bg-kood-accent px-3 py-1.5 text-xs font-bold text-kood-accent-foreground"
							onclick={() => submitReviewer(app.role as 'jane' | 'joe', 'codeComments')}>Submit</button
						>
					{:else}
						<p class="mt-2 text-xs text-kood-accent">Submitted</p>
					{/if}
				</div>

				<div class="rounded-xl border border-kood-border bg-kood-surface p-4 md:col-span-2">
					<p class="text-sm font-medium text-kood-text">
						Cross reviewer ({app.role === 'joe' ? 'You' : 'Joe'}) — awareness in your categories
					</p>
					<p class="text-xs text-kood-muted">
						{app.role === 'joe'
							? 'Did your peer raise relevant questions in security / correctness?'
							: 'Did Joe raise relevant questions in performance / structure & architecture?'}
					</p>
					<select
						class="mt-2 w-full max-w-xs rounded-lg border border-kood-border bg-kood-bg px-2 py-2 text-sm text-kood-text disabled:opacity-50"
						disabled={reviewerBlock.crossReviewer.submitted}
						value={reviewerBlock.crossReviewer.score === null
							? ''
							: String(reviewerBlock.crossReviewer.score)}
						onchange={(e) =>
							(reviewerBlock.crossReviewer.score = parseScore(
								(e.currentTarget as HTMLSelectElement).value
							))}
					>
						<option value="">Score…</option>
						{#each [1, 2, 3, 4, 5] as n (n)}
							<option value={n}>{n}</option>
						{/each}
					</select>
					<textarea
						rows="2"
						class="mt-2 w-full rounded-lg border border-kood-border bg-kood-bg px-2 py-2 text-sm text-kood-text"
						disabled={reviewerBlock.crossReviewer.submitted}
						bind:value={reviewerBlock.crossReviewer.comment}
					></textarea>
					{#if !reviewerBlock.crossReviewer.submitted}
						<button
							type="button"
							class="mt-2 rounded-lg bg-kood-accent px-3 py-1.5 text-xs font-bold text-kood-accent-foreground"
							onclick={() => submitReviewer(app.role as 'jane' | 'joe', 'crossReviewer')}>Submit</button
						>
					{:else}
						<p class="mt-2 text-xs text-kood-accent">Submitted</p>
					{/if}
				</div>
			</div>

			<p class="text-xs text-kood-muted">{app.leaderboardNote} Current mock XP: {app.xpMock}</p>
		</section>
	{/if}
</div>
