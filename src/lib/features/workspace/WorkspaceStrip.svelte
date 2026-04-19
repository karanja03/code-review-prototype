<script lang="ts">
	import { enhance } from '$app/forms';
	import { getApp } from '$lib/appState.svelte';

	type Proj = { id: string; status: string; giteaUrl: string | null };
	type RP = { projectId: string };

	type CatMap = Record<string, 'jane' | 'joe'> | null;

	type ReviewRoom = {
		submitterUsername: string;
		reviewerAUsername: string;
		reviewerBUsername: string;
	};

	type Workspace =
		| {
				kind: 'submitter';
				viewerId: string;
				project: Proj;
				pair: RP | null;
				categoryMap?: CatMap;
				reviewRoom: ReviewRoom | null;
		  }
		| {
				kind: 'reviewer';
				viewerId: string;
				project: Proj | null;
				pair: RP | null;
				categoryMap?: CatMap;
				persona?: 'sandra' | 'jane' | 'joe' | null;
				reviewRoom: ReviewRoom | null;
		  }
		| { kind: 'other'; viewerId: string; role: string };

	let { workspace }: { workspace: Workspace } = $props();

	const app = getApp();

	const submitter = $derived(workspace.kind === 'submitter' ? workspace : null);
	const reviewer = $derived(workspace.kind === 'reviewer' ? workspace : null);

	/** Hide the submitter batch card until they've started the journey (briefing → Start). Repo URL only makes sense after that. */
	const showSubmitterStrip = $derived.by(() => {
		const s = submitter;
		if (!s) return false;
		if (s.project.status !== 'awaiting_link') return true;
		return app.projectStarted;
	});
</script>

{#if submitter && showSubmitterStrip}
	<section class="mb-6 rounded-xl border border-kood-accent/30 bg-kood-surface/80 p-4 text-sm">
		<h3 class="font-semibold text-kood-text">Your project batch</h3>
		<p class="mt-1 text-xs text-kood-muted">Status: <span class="text-kood-accent">{submitter.project.status}</span></p>
		{#if submitter.project.giteaUrl}
			<p class="mt-2 break-all text-kood-muted">
				Repo: <a class="text-kood-accent underline" href={submitter.project.giteaUrl} target="_blank" rel="noreferrer"
					>{submitter.project.giteaUrl}</a
				>
			</p>
		{/if}
		{#if submitter.project.status === 'awaiting_link'}
			<form method="post" action="?/submitRepo" class="mt-3 space-y-2" use:enhance>
				<input type="hidden" name="projectId" value={submitter.project.id} />
				<label class="block text-xs font-semibold uppercase text-kood-muted" for="giteaUrl">Gitea repository URL</label>
				<input
					id="giteaUrl"
					name="giteaUrl"
					type="url"
					required
					placeholder="https://gitea.example.com/user/repo"
					class="w-full rounded border border-kood-border bg-kood-bg px-3 py-2 text-kood-text"
				/>
				<button
					type="submit"
					class="rounded bg-kood-accent px-4 py-2 text-xs font-semibold text-kood-bg hover:opacity-90"
				>
					Submit repo link
				</button>
			</form>
		{/if}
		{#if submitter.pair}
			<p class="mt-3 text-xs text-kood-muted">
				Reviewers:
				<strong class="text-kood-text/90">{submitter.reviewRoom?.reviewerAUsername ?? 'Reviewer A'}</strong>
				&amp;
				<strong class="text-kood-text/90">{submitter.reviewRoom?.reviewerBUsername ?? 'Reviewer B'}</strong>
				— use <strong class="text-kood-text/90">Server sync</strong> below to save Testing and Code review progress for
				everyone on this batch.
			</p>
		{:else if submitter.project.status === 'repo_submitted'}
			<p class="mt-3 text-xs text-kood-muted">
				<strong class="text-kood-text/90">Awaiting reviewers.</strong> An admin will assign two reviewers to this repo.
				Then use Server sync to share saved threads from the prototype Testing and Code review steps.
			</p>
		{:else if submitter.project.status === 'review_active'}
			<p class="mt-2 text-xs text-kood-muted">Review is active — continue the sprint in the main workspace and project room.</p>
		{/if}
		{#if submitter.project.status === 'completed'}
			<form method="post" action="?/startNextBatch" class="mt-3" use:enhance>
				<button
					type="submit"
					class="rounded border border-kood-border px-3 py-1.5 text-xs text-kood-text hover:bg-kood-border/30"
				>
					Start next review batch (new project)
				</button>
			</form>
		{/if}
	</section>
{:else if reviewer}
	<section class="mb-6 rounded-xl border border-kood-border bg-kood-surface/80 p-4 text-sm">
		<h3 class="font-semibold text-kood-text">Reviewer assignment</h3>
		{#if reviewer.pair && reviewer.project}
			<p class="mt-2 text-xs text-kood-muted">
				Paired review · project status <span class="text-kood-accent">{reviewer.project.status}</span>
			</p>
			{#if reviewer.project.giteaUrl}
				<p class="mt-2 break-all">
					<a class="text-kood-accent underline" href={reviewer.project.giteaUrl} target="_blank" rel="noreferrer"
						>{reviewer.project.giteaUrl}</a
					>
				</p>
			{/if}
			<p class="mt-3 text-xs text-kood-muted">
				Use <strong class="text-kood-text/90">Server sync</strong> below to save Testing and Code review state with the
				submitter and your peer.
			</p>
		{:else}
			<p class="mt-2 text-xs text-kood-muted">You are not assigned to a project yet. An admin will pair you with a partner.</p>
		{/if}
	</section>
{/if}
