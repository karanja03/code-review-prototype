<script lang="ts">
	import { confirmStartProject } from '$lib/appState.svelte';
	import { MODULE_OPTIONS, PROJECT_MANDATORY_XP } from '$lib/koodUi';
	import Modal from '$lib/ui/Modal.svelte';
	import MobileMessengerBrief from './MobileMessengerBrief.svelte';

	let startOpen = $state(false);
	let modulePick = $state<(typeof MODULE_OPTIONS)[number]>('Mobile App Development');
</script>

<div class="space-y-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<label class="flex flex-col gap-1 text-sm text-kood-muted">
			<span class="text-xs font-semibold uppercase tracking-wide text-kood-muted/90">Select Module</span>
			<select
				bind:value={modulePick}
				class="max-w-xs rounded-lg border border-kood-border bg-kood-surface px-3 py-2 text-sm text-kood-text"
			>
				{#each MODULE_OPTIONS as m (m)}
					<option value={m}>{m}</option>
				{/each}
			</select>
		</label>
	</div>

	<header class="border-b border-kood-border pb-6">
		<div class="flex flex-wrap items-center gap-3 text-xs text-kood-muted">
			<span class="rounded-md bg-kood-surface-raised/90 px-2 py-1 font-medium text-kood-text/90"
				>Mandatory 0 / {PROJECT_MANDATORY_XP}</span
			>
			<span
				class="flex h-7 w-7 items-center justify-center rounded-full border border-kood-border text-kood-muted"
				title="Peers">👥</span
			>
		</div>
		<h1 class="mt-4 text-3xl font-bold tracking-tight text-kood-text">Mobile Messenger 📲</h1>
		<p class="mt-2 max-w-3xl text-base text-kood-muted">A Flutter messaging app to communicate with anyone.</p>
	</header>

	<MobileMessengerBrief />

	<div class="flex flex-wrap items-center gap-3 border-t border-kood-border pt-6">
		<button
			type="button"
			class="rounded-full bg-kood-accent px-8 py-3 text-sm font-bold text-kood-accent-foreground shadow-md shadow-kood-accent/10 hover:brightness-95"
			onclick={() => (startOpen = true)}>Start</button
		>
		<p class="text-xs text-kood-muted">Starts the phased review journey for this project (prototype).</p>
	</div>
</div>

<Modal bind:open={startOpen} title="Are you sure you want to start?">
	<p>
		This locks in the workflow: project completion, testing, code review sprint, standup, accept project, and 360°
		feedback — for <strong class="text-kood-text">Mobile Messenger</strong>.
	</p>
	{#snippet footer()}
		<button
			type="button"
			class="rounded-lg border border-kood-border px-4 py-2 text-sm text-kood-text"
			onclick={() => (startOpen = false)}>Cancel</button
		>
		<button
			type="button"
			class="rounded-lg bg-kood-accent px-4 py-2 text-sm font-semibold text-kood-accent-foreground"
			onclick={() => {
				confirmStartProject();
				startOpen = false;
			}}>Yes</button
		>
	{/snippet}
</Modal>
