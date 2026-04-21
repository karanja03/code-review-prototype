<script lang="ts">
	import type { AuditPersona, GroupedAuditThread } from '$lib/server/review-audit';

	let {
		groups,
		submitterName,
		reviewerAName,
		reviewerBName,
		emptyMessage
	}: {
		groups: GroupedAuditThread[];
		submitterName: string;
		reviewerAName: string;
		reviewerBName: string;
		emptyMessage: string;
	} = $props();

	function threadBubbleClass(persona: AuditPersona | undefined): string {
		const base =
			'rounded-r-md border border-kood-border/50 border-l-[3px] pl-3 py-2.5 pr-3 text-sm';
		if (persona === 'sandra') return `${base} border-l-amber-400/85 bg-amber-500/[0.08]`;
		if (persona === 'jane') return `${base} border-l-kood-accent bg-kood-accent/[0.12]`;
		if (persona === 'joe') return `${base} border-l-violet-400/80 bg-violet-500/[0.1]`;
		return `${base} border-l-kood-border bg-kood-bg/50`;
	}

	let expandAll = $state(false);
</script>

<p class="mt-2 flex flex-wrap gap-3 text-[11px] text-kood-muted">
	<span class="inline-flex items-center gap-1.5"
		><span class="inline-block h-3 w-1 rounded-sm bg-amber-400/85"></span> {submitterName}</span
	>
	<span class="inline-flex items-center gap-1.5"
		><span class="inline-block h-3 w-1 rounded-sm bg-kood-accent"></span> {reviewerAName} (slot A)</span
	>
	<span class="inline-flex items-center gap-1.5"
		><span class="inline-block h-3 w-1 rounded-sm bg-violet-400/80"></span> {reviewerBName} (slot B)</span
	>
</p>

<div class="mt-3 flex flex-wrap gap-2">
	<button
		type="button"
		class="rounded-md border border-kood-border px-2.5 py-1 text-[11px] text-kood-text/90 hover:bg-kood-surface-raised"
		onclick={() => {
			expandAll = true;
		}}>Expand all threads</button
	>
	<button
		type="button"
		class="rounded-md border border-kood-border px-2.5 py-1 text-[11px] text-kood-text/90 hover:bg-kood-surface-raised"
		onclick={() => {
			expandAll = false;
		}}>Collapse all</button
	>
</div>

<ul class="mt-4 space-y-3">
	{#key expandAll}
		{#each groups as group (group.context)}
			<li class="rounded-xl border border-kood-border bg-kood-bg/25">
				<details class="group" open={expandAll}>
				<summary
					class="cursor-pointer list-none rounded-xl px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden"
				>
					<div class="flex flex-wrap items-start justify-between gap-2">
						<h3 class="text-left text-xs font-medium leading-snug text-kood-text/95">{group.context}</h3>
						<span class="shrink-0 rounded-md bg-kood-surface-raised/80 px-2 py-0.5 text-[10px] text-kood-muted"
							>{group.messages.length} message{group.messages.length === 1 ? '' : 's'}</span
						>
					</div>
					<p class="mt-1 text-[11px] text-kood-muted">Click to expand · messages in time order</p>
				</summary>
				<ol class="space-y-2.5 border-t border-kood-border/60 px-4 pb-4 pt-3" aria-label="Messages in conversation order">
					{#each group.messages as t, mi (mi)}
						<li class={threadBubbleClass(t.authorPersona)}>
							<p class="text-[11px] text-kood-muted">
								<span class="font-semibold text-kood-text">{t.authorLabel}</span>
								{#if t.round != null}
									<span class="text-kood-muted"> · round {t.round}</span>
								{/if}
								<span class="text-kood-muted"> · {t.at ? new Date(t.at).toLocaleString() : '—'}</span>
							</p>
							<p class="mt-1.5 whitespace-pre-wrap text-kood-text/90">{t.text}</p>
						</li>
					{/each}
				</ol>
				</details>
			</li>
		{/each}
	{/key}
</ul>

{#if groups.length === 0}
	<p class="mt-2 text-sm text-kood-muted">{emptyMessage}</p>
{/if}
