<script lang="ts">
	import {
		academyUrl,
		acceptCategory,
		allObservationsChecked,
		canInteractCategory,
		getApp,
		nudgeCategory,
		setDraftComment,
		setObservationCheck,
		sandraAcknowledgeNudge
	} from '$lib/appState.svelte';
	import type { CategoryDef } from '$lib/types';

	let { category }: { category: CategoryDef } = $props();

	const app = getApp();

	const session = $derived(app.categorySessions[category.id]);
	const interactive = $derived(canInteractCategory(category.id, app.role));
	const readOnlyPeer = $derived(
		(app.role === 'jane' || app.role === 'joe') && !interactive
	);

	function obsLocked(obsId: string) {
		return session.lockedObservationIds[obsId] === true;
	}

	function toggle(obsId: string) {
		if (!interactive || session.completed || obsLocked(obsId)) return;
		setObservationCheck(category.id, obsId, !session.checks[obsId]);
	}

	function onAccept() {
		if (!interactive || !allObservationsChecked(category.id)) return;
		const r = app.role === 'jane' ? 'jane' : 'joe';
		acceptCategory(category.id, r);
	}

	function onNudge() {
		if (!interactive) return;
		const r = app.role === 'jane' ? 'jane' : 'joe';
		nudgeCategory(category.id, r);
	}

	function onAck() {
		sandraAcknowledgeNudge(category.id);
	}
</script>

<div
	class="flex h-full flex-col rounded-xl border p-4 transition
		{readOnlyPeer ? 'border-kood-border/60 bg-kood-bg/50 opacity-80' : 'border-kood-border bg-kood-surface/80'}
		{session.completed ? 'ring-1 ring-kood-accent/35' : ''}"
>
	<div class="flex flex-wrap items-start justify-between gap-2">
		<div>
			<h3 class="font-semibold text-kood-text">{category.title}</h3>
			<p class="text-xs text-kood-muted">
				Assigned: <span class="text-kood-text/90">{category.assignee === 'jane' ? 'Jane' : 'Joe'}</span>
				{#if readOnlyPeer}
					<span class="ml-2 rounded bg-kood-surface-raised px-1.5 py-0.5 text-[10px] uppercase text-kood-text/90"
						>Read-only</span
					>
				{/if}
			</p>
		</div>
		<a
			class="text-xs text-kood-accent underline-offset-2 hover:underline"
			href={academyUrl(category.academyHint)}
			target="_blank"
			rel="noreferrer">Open in review academy</a
		>
	</div>

	{#if session.completed}
		<p class="mt-3 rounded-lg bg-kood-accent/10 px-3 py-2 text-sm text-kood-text">
			{category.title} has been fully reviewed to Sandra's and {category.assignee === 'jane'
				? "Jane's"
				: "Joe's"} satisfaction.
		</p>
	{/if}

	<ul class="mt-4 flex flex-1 flex-col gap-3">
		{#each category.observations as obs (obs.id)}
			<li class="rounded-lg border border-kood-border bg-kood-surface p-3">
				<label
					class="flex items-start gap-3 {readOnlyPeer || session.completed || obsLocked(obs.id)
						? 'cursor-default'
						: 'cursor-pointer'}"
				>
					<input
						type="checkbox"
						class="mt-1 h-4 w-4 rounded border-kood-border bg-kood-surface-raised text-kood-accent focus:ring-kood-accent disabled:opacity-50"
						checked={session.checks[obs.id] ?? false}
						disabled={!interactive || session.completed || obsLocked(obs.id)}
						onchange={() => toggle(obs.id)}
					/>
					<span class="text-sm text-kood-text">{obs.text}</span>
				</label>
				{#if interactive && !session.completed && obsLocked(obs.id)}
					<p class="mt-1.5 pl-7 text-[11px] text-kood-muted/90">
						Cleared in a prior round — stays checked so you only re-verify open items.
					</p>
				{/if}
				{#if interactive && !session.completed && !session.checks[obs.id]}
					<div class="mt-2 pl-7">
						<label class="text-xs text-kood-muted" for="c-{category.id}-{obs.id}">Feedback if unchecked</label>
						<textarea
							id="c-{category.id}-{obs.id}"
							rows="2"
							class="mt-1 w-full resize-y rounded-md border border-kood-border bg-kood-bg px-2 py-1.5 text-sm text-kood-text placeholder:text-kood-muted"
							placeholder="Required before nudge…"
							value={session.draftComments[obs.id] ?? ''}
							oninput={(e) =>
								setDraftComment(category.id, obs.id, (e.currentTarget as HTMLTextAreaElement).value)}
						></textarea>
					</div>
				{/if}
			</li>
		{/each}
	</ul>

	{#if app.role === 'sandra' && session.pendingNudge}
		<div class="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
			<p class="font-medium">Feedback from {session.pendingNudge.reviewer === 'jane' ? 'Jane' : 'Joe'}</p>
			<ul class="mt-2 list-disc space-y-1 pl-4 text-amber-100/90">
				{#each session.pendingNudge.items as it (it.observationId)}
					<li>
						<span class="text-kood-text/90"
							>{category.observations.find((o) => o.id === it.observationId)?.text}</span
						>: {it.comment}
					</li>
				{/each}
			</ul>
			<button
				type="button"
				class="mt-3 rounded-lg bg-kood-accent px-3 py-1.5 text-xs font-semibold text-kood-accent-foreground"
				onclick={onAck}>I've addressed this (new round)</button
			>
		</div>
	{/if}

	{#if interactive && !session.completed}
		<div class="mt-4 flex flex-wrap gap-2">
			<button
				type="button"
				class="rounded-lg bg-kood-accent px-4 py-2 text-sm font-semibold text-kood-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
				disabled={!allObservationsChecked(category.id)}
				onclick={onAccept}>Accept category</button
			>
			<button
				type="button"
				class="rounded-lg border border-kood-border bg-kood-surface-raised px-4 py-2 text-sm font-medium text-kood-text hover:bg-kood-surface"
				onclick={onNudge}>Nudge Sandra</button
			>
		</div>
	{/if}

	{#if session.iterations.length > 0}
		<details class="mt-4 border-t border-kood-border pt-3 text-xs text-kood-muted">
			<summary class="cursor-pointer text-kood-text/90">Iteration history ({session.iterations.length})</summary>
			<ol class="mt-2 space-y-3">
				{#each [...session.iterations].reverse() as it (it.id)}
					<li class="rounded bg-kood-bg/70 p-2.5">
						<p class="font-medium text-kood-text/90">
							<span class="text-kood-accent/90">{it.action.toUpperCase()}</span>
							<span class="font-normal text-kood-muted">
								· {new Date(it.at).toLocaleString()} · {it.reviewer}</span
							>
						</p>
						<ul class="mt-2 list-none space-y-1.5 pl-0">
							{#each it.entries as en (en.observationId)}
								{@const obsLabel = category.observations.find((o) => o.id === en.observationId)?.text ?? en.observationId}
								<li class="text-kood-text/90">
									<span class="font-mono text-kood-muted">{en.checked ? '✓' : '✗'}</span>
									<span class="ml-1">{obsLabel}</span>{#if en.comment}<span class="text-kood-muted"> — </span><span
										class="text-kood-text/80">{en.comment}</span
									>{/if}
								</li>
							{/each}
						</ul>
					</li>
				{/each}
			</ol>
		</details>
	{/if}
</div>
