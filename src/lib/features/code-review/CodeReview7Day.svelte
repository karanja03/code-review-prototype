<script lang="ts">
	const days = [
		{ day: 1, title: 'Kickoff', desc: "Agree on scope, requirements, and what 'done' means.", phase: 'Prepare' },
		{ day: 2, title: 'First pass', desc: 'Reviewer checks core flows and notes risks early.', phase: 'Prepare' },
		{ day: 3, title: 'Fix window', desc: 'Submitter iterates; reviewer stays available for quick checks.', phase: 'Prepare' },
		{ day: 4, title: 'Deep dive', desc: 'Edge cases, error handling, readability, structure.', phase: 'Review' },
		{ day: 5, title: 'Polish', desc: 'Tighten naming, logs, docs, and test coverage.', phase: 'Review' },
		{ day: 6, title: 'Verify', desc: 'Re-test critical flows. Confirm all issues resolved.', phase: 'Close', highlight: true },
		{ day: 7, title: 'Close out', desc: 'Summarise: what was tested, what improved, what remains.', phase: 'Close', highlight: true }
	];
</script>

<div class="rounded-2xl border border-kood-border bg-kood-surface p-6">
	<h3 class="text-lg font-semibold text-kood-text">The 7-day review rhythm</h3>
	<p class="mt-1 text-sm text-kood-muted">Consistency beats intensity — here's how to spread the work.</p>

	<div class="mt-6 flex flex-wrap gap-6 text-xs font-semibold uppercase tracking-wide text-kood-muted">
		<span class="text-kood-text/80">📅 Prepare · Days 1–3</span>
		<span class="text-kood-text/80">🔍 Review · Days 4–5</span>
		<span class="text-kood-accent">✓ Close · Days 6–7</span>
	</div>

	<div class="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
		<div
			class="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-kood-border lg:block"
			aria-hidden="true"
		></div>
		{#each days as d (d.day)}
			<div class="relative flex flex-col items-center text-center">
				<div
					class="relative z-[1] mb-2 flex h-12 w-12 items-center justify-center rounded-full text-lg
						{d.highlight
						? 'bg-kood-accent text-kood-accent-foreground ring-2 ring-kood-accent/40'
						: 'bg-kood-surface-raised text-kood-text/90'}"
				>
					{d.day === 1 ? '🚀' : d.day === 2 ? '👁' : d.day === 3 ? '🔧' : d.day === 4 ? '🔍' : d.day === 5 ? '✨' : d.day === 6 ? '🧪' : '🎯'}
				</div>
				<p class="text-[10px] font-semibold uppercase text-kood-muted">Day {d.day}</p>
				<p class="text-xs font-medium text-kood-text">{d.title}</p>
				<div class="mt-2 rounded-lg border border-kood-border bg-kood-bg/40 p-2 text-left">
					<p class="text-[11px] leading-snug text-kood-muted">{d.desc}</p>
				</div>
			</div>
		{/each}
	</div>

	<div class="mt-6 flex flex-wrap gap-3">
		<button
			type="button"
			class="rounded-lg border border-kood-border bg-kood-surface-raised px-5 py-2.5 text-sm font-medium text-kood-text hover:bg-kood-surface"
			onclick={() => window.open('https://kood-review-academy-prototype-sxyr.vercel.app/', '_blank')}
			>Review categories again (academy)</button
		>
	</div>
</div>
