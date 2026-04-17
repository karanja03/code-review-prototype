<script lang="ts">
	import { enhance } from '$app/forms';
	import PrototypePageShell from '$lib/features/shell/PrototypePageShell.svelte';

	let { form } = $props();
</script>

<svelte:head>
	<title>Sign in — //kood prototype</title>
</svelte:head>

<PrototypePageShell>
	<div class="mx-auto max-w-md">
		<section class="rounded-xl border border-kood-accent/30 bg-kood-surface/80 p-5 lg:p-6">
			<h1 class="font-mono text-xl font-semibold tracking-tight text-kood-text">Sign in</h1>
			<p class="mt-2 text-sm text-kood-muted">Use the email or username you registered with.</p>

			{#if form?.message}
				<p class="mt-4 rounded-lg border border-kood-danger/40 bg-kood-danger-bg px-3 py-2 text-sm text-kood-danger">
					{form.message}
				</p>
			{/if}

			<form method="post" class="mt-8 space-y-4" use:enhance>
				<div>
					<label class="block text-xs font-semibold uppercase tracking-wide text-kood-muted" for="identifier"
						>Email or username</label
					>
					<input
						class="mt-1 w-full rounded border border-kood-border bg-kood-bg px-3 py-2 text-sm text-kood-text"
						id="identifier"
						name="identifier"
						autocomplete="username"
						required
					/>
				</div>
				<div>
					<label class="block text-xs font-semibold uppercase tracking-wide text-kood-muted" for="password"
						>Password</label
					>
					<input
						class="mt-1 w-full rounded border border-kood-border bg-kood-bg px-3 py-2 text-sm text-kood-text"
						type="password"
						id="password"
						name="password"
						autocomplete="current-password"
						required
					/>
				</div>
				<button
					type="submit"
					class="w-full rounded bg-kood-accent px-4 py-2 text-sm font-semibold text-kood-bg hover:opacity-90"
				>
					Sign in
				</button>
			</form>

			<p class="mt-6 text-sm text-kood-muted">
				New here?
				<a class="text-kood-accent underline" href="/signup">Create an account</a>
			</p>
		</section>
	</div>
</PrototypePageShell>
