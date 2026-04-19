<script lang="ts">
	import { getContext } from 'svelte';
	import { page } from '$app/stores';
	import { AUTH_SESSION, type SessionUser } from '$lib/auth-context';
	import CurriculumLeftNav from './CurriculumLeftNav.svelte';
	import KoodRightChrome from './KoodRightChrome.svelte';
	import KoodWorkflowPanel from './KoodWorkflowPanel.svelte';
	import RoleSwitcher from './RoleSwitcher.svelte';
	import SidebarMeta from './SidebarMeta.svelte';
	import type { Snippet } from 'svelte';

	let {
		children,
		variant = 'workspace',
		adminDashboardActive = false
	}: {
		children: Snippet;
		variant?: 'workspace' | 'admin' | 'auth';
		/** When `variant="admin"`, pass true on `/admin` so “Dashboard” shows as current. */
		adminDashboardActive?: boolean;
	} = $props();

	const auth = getContext<{ sessionUser: SessionUser | null }>(AUTH_SESSION);

	type AdminProjectRow = { id: string; themeTitle: string; status: string; submitterUsername: string };
	const getAdminProjects = getContext<undefined | (() => AdminProjectRow[])>('kood-admin-projects');
	const adminProjects = $derived(getAdminProjects?.() ?? []);
	const adminPath = $derived($page.url.pathname);
	const adminProjectMatch = $derived(adminPath.match(/^\/admin\/projects\/([^/]+)/));
	const adminOpenProjectId = $derived(adminProjectMatch?.[1] ?? null);

	function adminProjectLinkActive(href: string): boolean {
		const n = (s: string) => {
			const t = s.replace(/\/$/, '');
			return t === '' ? '/' : t;
		};
		return n(adminPath) === n(href);
	}

	const subLink = (active: boolean) =>
		active
			? 'block rounded px-1.5 py-1 bg-kood-accent/15 text-kood-text'
			: 'block rounded px-1.5 py-1 text-kood-muted hover:text-kood-text';
</script>

{#if variant === 'auth'}
	<!-- Sign-in / sign-up only: no curriculum chrome or workspace landing panels -->
	<div class="min-h-screen bg-kood-bg text-kood-text">
		<div class="flex min-h-screen flex-col">
			<header class="shrink-0 border-b border-kood-border px-4 py-5 lg:px-10">
				<p class="font-mono text-lg font-semibold tracking-tight text-kood-text">//kood</p>
				<p class="mt-0.5 text-[10px] uppercase tracking-wider text-kood-muted/70">Prototype UI</p>
			</header>
			<main class="flex flex-1 flex-col justify-center px-4 py-10 lg:px-10">
				{@render children()}
			</main>
		</div>
	</div>
{:else}
<div class="min-h-screen bg-kood-bg text-kood-text">
	<div class="mx-auto flex min-h-screen max-w-[1700px] flex-col lg:flex-row">
		<aside
			class="flex w-full shrink-0 flex-col border-b border-kood-border lg:w-[240px] lg:border-b-0 lg:border-r lg:px-4 lg:py-5"
		>
			<div class="px-4 pt-4 lg:px-0 lg:pt-0">
				<a href="/" class="block">
					<p class="font-mono text-lg font-semibold tracking-tight text-kood-text">//kood</p>
					<p class="mt-0.5 text-[10px] uppercase tracking-wider text-kood-muted/70">Prototype UI</p>
				</a>
			</div>

			{#if variant === 'admin'}
				<nav class="mt-6 space-y-1 px-4 text-sm lg:px-0" aria-label="Admin">
					<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-kood-muted">Admin</p>
					<a
						href="/"
						class="block rounded-lg px-2 py-2 text-kood-muted transition hover:bg-kood-surface-raised/80 hover:text-kood-text"
						>Workspace</a
					>
					<a
						href="/admin"
						class="block rounded-lg px-2 py-2 transition {adminDashboardActive
							? 'bg-kood-surface-raised/80 text-kood-text'
							: 'text-kood-muted hover:bg-kood-surface-raised/80 hover:text-kood-text'}"
						>Dashboard</a
					>

					{#if adminProjects.length > 0}
						<p class="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-kood-muted">Projects</p>
						<ul class="space-y-1">
							{#each adminProjects as p (p.id)}
								<li>
									<details class="group" open={p.id === adminOpenProjectId}>
										<summary
											class="cursor-pointer list-none rounded-lg px-2 py-2 marker:content-none text-kood-muted transition hover:bg-kood-surface-raised/80 hover:text-kood-text [&::-webkit-details-marker]:hidden"
										>
											<span class="block truncate text-xs font-medium text-kood-text/95">{p.themeTitle}</span>
											<span class="block text-[10px] text-kood-muted"
												>{p.status} · {p.submitterUsername}</span
											>
										</summary>
										<ul class="mt-1 space-y-0.5 border-l border-kood-border/60 pl-3 text-[11px]">
											<li>
												<a href="/admin/projects/{p.id}" class={subLink(adminProjectLinkActive(`/admin/projects/${p.id}`))}
													>Overview</a
												>
											</li>
											<li>
												<a
													href="/admin/projects/{p.id}/testing-verdict"
													class={subLink(adminProjectLinkActive(`/admin/projects/${p.id}/testing-verdict`))}
													>Testing verdicts</a
												>
											</li>
											<li>
												<a
													href="/admin/projects/{p.id}/testing-threads"
													class={subLink(adminProjectLinkActive(`/admin/projects/${p.id}/testing-threads`))}
													>Testing threads</a
												>
											</li>
											<li>
												<a
													href="/admin/projects/{p.id}/code-review-verdict"
													class={subLink(adminProjectLinkActive(`/admin/projects/${p.id}/code-review-verdict`))}
													>Code review verdicts</a
												>
											</li>
											<li>
												<a
													href="/admin/projects/{p.id}/code-review-threads"
													class={subLink(adminProjectLinkActive(`/admin/projects/${p.id}/code-review-threads`))}
													>Code review threads</a
												>
											</li>
											<li>
												<a
													href="/admin/projects/{p.id}/raw-json"
													class={subLink(adminProjectLinkActive(`/admin/projects/${p.id}/raw-json`))}
													>Raw JSON</a
												>
											</li>
										</ul>
									</details>
								</li>
							{/each}
						</ul>
					{/if}
				</nav>

				<div class="min-h-0 flex-1" aria-hidden="true"></div>

				<div class="space-y-3 border-t border-kood-border px-4 py-4 text-xs text-kood-muted lg:px-0 lg:pb-0">
					{#if auth.sessionUser}
						<form method="post" action="/?/signout">
							<button
								type="submit"
								class="text-left text-kood-muted/90 underline decoration-kood-border decoration-dotted hover:text-kood-text"
							>
								Log out
							</button>
						</form>
					{/if}
				</div>
			{:else}
				<div class="mt-5 px-4 lg:px-0">
					<CurriculumLeftNav />
				</div>

				<div class="mt-6 border-t border-kood-border px-4 py-4 lg:px-0">
					<p class="text-xs font-semibold uppercase tracking-wide text-kood-muted">Demo</p>
					{#if auth.sessionUser?.role === 'admin'}
						<p class="mt-2 text-xs text-kood-muted">Switch persona for sprint + 360° flows</p>
						<div class="mt-2">
							<RoleSwitcher />
						</div>
					{:else if auth.sessionUser}
						<p class="mt-2 text-xs text-kood-muted">
							Your account role is fixed — use <strong class="text-kood-text/90">Server sync</strong> when you have a
							batch to save Testing and Code review threads for the team.
						</p>
					{:else}
						<p class="mt-2 text-xs text-kood-muted">Sign in to use the live workspace.</p>
					{/if}
				</div>

				<div class="mt-auto space-y-2 border-t border-kood-border px-4 py-4 text-xs text-kood-muted lg:border-0 lg:px-0 lg:pb-0">
					<p class="flex items-center gap-2"><span>🌙</span> Dark</p>
					<p class="flex items-center gap-2"><span>☕</span> Gitea</p>
					{#if auth.sessionUser}
						{#if auth.sessionUser.role === 'admin'}
							<p class="mt-1">
								<a class="text-kood-accent underline" href="/admin">Admin dashboard</a>
							</p>
						{/if}
						<p class="flex items-center gap-2">
							<span>👤</span> {auth.sessionUser.username}
						</p>
						<p class="break-all text-kood-muted/90">{auth.sessionUser.email}</p>
						<p class="text-[10px] uppercase tracking-wide text-kood-muted/80">
							Role: {auth.sessionUser.role}
						</p>
						<form method="post" action="/?/signout">
							<button
								type="submit"
								class="text-left text-kood-muted/90 underline decoration-kood-border decoration-dotted hover:text-kood-text"
							>
								Log out
							</button>
						</form>
					{:else}
						<p class="flex items-center gap-2"><span>👤</span> Guest</p>
						<p class="flex flex-col gap-1">
							<a class="text-kood-text underline" href="/login">Sign in</a>
							<a class="text-kood-muted/90 underline" href="/signup">Sign up</a>
						</p>
					{/if}
				</div>
			{/if}
		</aside>

		<main class="min-w-0 flex-1 px-4 py-6 lg:px-10 lg:py-8">
			{@render children()}
		</main>

		{#if variant === 'workspace'}
			<aside
				class="w-full shrink-0 border-t border-kood-border px-4 py-6 lg:w-[300px] lg:border-l lg:border-t-0 lg:px-5 lg:py-8"
			>
				<KoodWorkflowPanel />
				<div class="mt-8">
					<SidebarMeta />
				</div>
				<KoodRightChrome />
			</aside>
		{/if}
	</div>
</div>
{/if}
