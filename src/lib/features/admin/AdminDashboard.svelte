<script lang="ts">
	import {
		ADMIN_SLOT_OPTIONS,
		adminAssignSlot,
		adminDebugState,
		adminParticipantList,
		assignedNameForSlot,
		getApp,
		logoutUser,
		PHASE_LABELS,
		roleAssignmentDetails,
		roleAssignmentsComplete
	} from '$lib/appState.svelte';
	import type { AdminSlot, TestingItem } from '$lib/types';

	const app = getApp();
	const participants = $derived(adminParticipantList());
const debugState = $derived(adminDebugState());

	function labelForPhase() {
		return PHASE_LABELS.find((x) => x.id === app.phase)?.label ?? 'Briefing';
	}

	function totalComments(): number {
		return app.testingItems.reduce((sum, item) => sum + item.comments.length, 0);
	}

	function recentTestingComments(limit = 8): Array<{
		id: string;
		itemText: string;
		author: string;
		text: string;
		at: string;
	}> {
		return app.testingItems
			.flatMap((item: TestingItem) =>
				item.comments.map((comment) => ({
					id: comment.id,
					itemText: item.text,
					author: comment.author,
					text: comment.text,
					at: comment.at
				}))
			)
			.sort((a, b) => b.at.localeCompare(a.at))
			.slice(0, limit);
	}

	function recentReviewActions(limit = 8): Array<{
		id: string;
		at: string;
		categoryId: string;
		reviewer: string;
		action: string;
	}> {
		return Object.values(app.categorySessions)
			.flatMap((session) =>
				session.iterations.map((it) => ({
					id: it.id,
					at: it.at,
					categoryId: session.categoryId,
					reviewer: it.reviewer,
					action: it.action
				}))
			)
			.sort((a, b) => b.at.localeCompare(a.at))
			.slice(0, limit);
	}

	function formatWhen(iso: string): string {
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return iso;
		return d.toLocaleString();
	}

	function slotLabel(slot: AdminSlot | null): string {
		if (!slot) return 'Waiting';
		return ADMIN_SLOT_OPTIONS.find((x) => x.id === slot)?.label ?? slot;
	}

	const projectName = 'Mobile Messenger';
	type AdminSection = 'participants' | 'assignment' | 'waiting' | 'activity';
	let activeSection = $state<AdminSection>('participants');
	let sidebarOpen = $state(true);
	let submitterSelection = $state('');
	let reviewer1Selection = $state('');
	let reviewer2Selection = $state('');
	let allowRoleEdits = $state(false);

	const navItems: { id: AdminSection; label: string }[] = [
		{ id: 'participants', label: 'Participants' },
		{ id: 'assignment', label: 'Role assignment' },
		{ id: 'waiting', label: 'People waiting' },
		{ id: 'activity', label: 'Project activity' }
	];

	function syncSelectionsFromAssigned() {
		submitterSelection = assignedNameForSlot('submitter');
		reviewer1Selection = assignedNameForSlot('reviewer1');
		reviewer2Selection = assignedNameForSlot('reviewer2');
	}

	function openSection(id: AdminSection) {
		activeSection = id;
		if (id === 'assignment') syncSelectionsFromAssigned();
	}

	function assignRolesNow() {
		adminAssignSlot('submitter', submitterSelection);
		adminAssignSlot('reviewer1', reviewer1Selection);
		adminAssignSlot('reviewer2', reviewer2Selection);
		allowRoleEdits = false;
		syncSelectionsFromAssigned();
	}

	type MenuItem = { id: AdminSection; label: string; icon: string };
	const menuItems: MenuItem[] = [
		{ id: 'participants', label: 'Participants', icon: '👥' },
		{ id: 'assignment', label: 'Role assignment', icon: '🧩' },
		{ id: 'waiting', label: 'People waiting', icon: '⏳' },
		{ id: 'activity', label: 'Project activity', icon: '📈' }
	];

	const assignmentDetails = $derived(roleAssignmentDetails());
	const assignmentLocked = $derived(roleAssignmentsComplete() && !allowRoleEdits);

	syncSelectionsFromAssigned();
</script>

<section class="min-h-screen bg-kood-bg text-kood-text">
	<div class="flex h-screen overflow-hidden">
		<aside
			class="admin-sidebar border-r border-kood-border bg-kood-bg/75 transition-all duration-200 {sidebarOpen ? 'w-[280px]' : 'w-[78px]'}"
		>
			<div class="flex h-full flex-col p-3">
				<div
					class="mb-3 flex items-center rounded-lg border border-kood-border bg-kood-surface/70 py-2 {sidebarOpen ? 'justify-between px-3' : 'justify-center px-2'}"
				>
					{#if sidebarOpen}
						<div>
							<p class="font-mono text-sm font-semibold">//kood admin</p>
							<p class="text-[10px] uppercase tracking-wide text-kood-muted">Role based control</p>
						</div>
					{/if}
					<button
						type="button"
						class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-kood-border text-kood-muted transition hover:text-kood-text"
						onclick={() => (sidebarOpen = !sidebarOpen)}
						aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
					>
						<svg
							viewBox="0 0 24 24"
							aria-hidden="true"
							class="h-4 w-4 fill-none stroke-current stroke-2"
						>
							<path stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16" />
						</svg>
					</button>
				</div>

				<nav class="space-y-1.5">
					{#each menuItems as item (item.id)}
						<button
							type="button"
							class="w-full rounded-md border px-3 py-2 text-left text-sm transition {activeSection === item.id
								? 'border-kood-accent/35 bg-kood-surface text-kood-text'
								: 'border-transparent text-kood-muted hover:border-kood-border/60 hover:bg-kood-surface/30 hover:text-kood-text'}"
							onclick={() => openSection(item.id)}
						>
							<span class="inline-flex items-center gap-2">
								<span>{item.icon}</span>
								{#if sidebarOpen}
									<span>{item.label}</span>
								{:else}
									<span>{item.label.slice(0, 1)}</span>
								{/if}
							</span>
						</button>
					{/each}
				</nav>

				<div class="mt-auto space-y-3">
					<div class="rounded-lg border border-kood-border bg-kood-surface/70 p-3">
						<p class="text-[10px] uppercase tracking-wide text-kood-muted">Project</p>
						<p class="mt-1 text-sm font-semibold">{sidebarOpen ? projectName : 'MM'}</p>
						{#if sidebarOpen}
							<p class="mt-1 text-[11px] text-kood-muted">Phase: {labelForPhase()}</p>
						{/if}
					</div>
					<div class="rounded-lg border border-kood-border bg-kood-surface/70 p-3">
						<p class="text-[10px] uppercase tracking-wide text-kood-muted">Participants</p>
						<p class="mt-1 text-xl font-semibold">{participants.length}</p>
					</div>
				</div>
			</div>
		</aside>

		<div class="flex min-w-0 flex-1 flex-col">
			<header class="flex items-center justify-between border-b border-kood-border bg-kood-surface/35 px-4 py-3 lg:px-6">
				<div>
					<p class="text-xs uppercase tracking-wide text-kood-muted">Dashboard > Reports > Overall analytics</p>
					<h1 class="text-xl font-semibold text-kood-text">Admin dashboard</h1>
				</div>
				<div class="flex items-center gap-2">
					<button
						type="button"
						class="rounded-lg bg-kood-accent px-3 py-1.5 text-sm font-semibold text-kood-accent-foreground"
					>
						+ New project
					</button>
					<button
						type="button"
						class="rounded-lg border border-kood-accent/55 px-3 py-1.5 text-sm text-kood-text"
						onclick={logoutUser}
					>
						Log out
					</button>
				</div>
			</header>

			<main class="min-w-0 flex-1 overflow-y-auto bg-kood-bg/55 p-4 lg:p-6">
				<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					<div class="rounded-xl border border-kood-border bg-kood-surface p-4">
						<p class="text-xs uppercase tracking-wide text-kood-muted">Current phase</p>
						<p class="mt-2 text-lg font-semibold text-kood-text">{labelForPhase()}</p>
					</div>
					<div class="rounded-xl border border-kood-border bg-kood-surface p-4">
						<p class="text-xs uppercase tracking-wide text-kood-muted">Submitted for review</p>
						<p class="mt-2 text-lg font-semibold text-kood-text">{app.submittedForReview ? 'Yes' : 'No'}</p>
					</div>
					<div class="rounded-xl border border-kood-border bg-kood-surface p-4">
						<p class="text-xs uppercase tracking-wide text-kood-muted">Comments posted</p>
						<p class="mt-2 text-lg font-semibold text-kood-text">{totalComments()}</p>
					</div>
					<div class="rounded-xl border border-kood-border bg-kood-surface p-4">
						<p class="text-xs uppercase tracking-wide text-kood-muted">Project</p>
						<p class="mt-2 text-lg font-semibold text-kood-text">{projectName}</p>
						{#if app.latestSubmission}
							<p class="mt-2 text-xs text-kood-muted">Last submitted by {app.latestSubmission.by}</p>
						{/if}
					</div>
				</div>

				<div class="mt-4">
					{#if activeSection === 'participants'}
						<div class="rounded-2xl border border-kood-border bg-kood-surface p-6">
							<h2 class="text-lg font-semibold text-kood-text">Participants and projects</h2>
							<p class="mt-1 text-xs text-kood-muted">Performance overview across active review sessions.</p>
							<div class="mt-3 overflow-x-auto">
								<table class="min-w-full text-left text-sm">
									<thead class="text-kood-muted">
										<tr>
											<th class="px-3 py-2 font-medium">Name</th>
											<th class="px-3 py-2 font-medium">Project</th>
											<th class="px-3 py-2 font-medium">Role</th>
											<th class="px-3 py-2 font-medium">Last seen</th>
											<th class="px-3 py-2 font-medium">Actions</th>
										</tr>
									</thead>
									<tbody>
										{#if participants.length === 0}
											<tr>
												<td class="px-3 py-3 text-kood-muted" colspan="5">No participants yet.</td>
											</tr>
										{:else}
											{#each participants as person (person.id)}
												<tr class="border-t border-kood-border/70">
													<td class="px-3 py-2 text-kood-text">{person.name}</td>
													<td class="px-3 py-2 text-kood-muted">{projectName}</td>
													<td class="px-3 py-2 text-kood-muted">{slotLabel(person.assignedSlot)}</td>
													<td class="px-3 py-2 text-kood-muted">{formatWhen(person.lastSeenAt)}</td>
													<td class="px-3 py-2">
														<button
															type="button"
															class="rounded-md bg-kood-accent px-2 py-1 text-xs font-semibold text-kood-accent-foreground"
														>
															Manage
														</button>
													</td>
												</tr>
											{/each}
										{/if}
									</tbody>
								</table>
							</div>
						</div>
					{:else if activeSection === 'assignment'}
						<div class="rounded-2xl border border-kood-border bg-kood-surface p-6">
							<div class="flex flex-wrap items-center justify-between gap-3">
								<div>
									<h2 class="text-lg font-semibold text-kood-text">Role assignment</h2>
									<p class="mt-1 text-xs text-kood-muted">Map participant names to workflow roles.</p>
								</div>
								{#if roleAssignmentsComplete()}
									<button
										type="button"
										class="rounded-lg border border-kood-border px-3 py-1.5 text-xs text-kood-text hover:border-kood-accent/35"
										onclick={() => (allowRoleEdits = !allowRoleEdits)}
									>
										{allowRoleEdits ? 'Cancel edit' : 'Edit assignments'}
									</button>
								{/if}
							</div>
							<div class="mt-4 grid gap-4 md:grid-cols-3">
								<label class="space-y-2 rounded-lg border border-kood-border bg-kood-bg/40 p-3">
									<span class="text-xs font-semibold uppercase tracking-wide text-kood-muted">Submitter</span>
									<select
										class="w-full rounded-md border border-kood-border bg-kood-bg px-2 py-2 text-sm text-kood-text outline-none focus:border-kood-accent"
										bind:value={submitterSelection}
										disabled={assignmentLocked}
									>
										<option value="">Unassigned</option>
										{#each participants as person (person.id)}
											<option value={person.name}>{person.name}</option>
										{/each}
									</select>
								</label>
								<label class="space-y-2 rounded-lg border border-kood-border bg-kood-bg/40 p-3">
									<span class="text-xs font-semibold uppercase tracking-wide text-kood-muted">Reviewer 1</span>
									<select
										class="w-full rounded-md border border-kood-border bg-kood-bg px-2 py-2 text-sm text-kood-text outline-none focus:border-kood-accent"
										bind:value={reviewer1Selection}
										disabled={assignmentLocked}
									>
										<option value="">Unassigned</option>
										{#each participants as person (person.id)}
											<option value={person.name}>{person.name}</option>
										{/each}
									</select>
								</label>
								<label class="space-y-2 rounded-lg border border-kood-border bg-kood-bg/40 p-3">
									<span class="text-xs font-semibold uppercase tracking-wide text-kood-muted">Reviewer 2</span>
									<select
										class="w-full rounded-md border border-kood-border bg-kood-bg px-2 py-2 text-sm text-kood-text outline-none focus:border-kood-accent"
										bind:value={reviewer2Selection}
										disabled={assignmentLocked}
									>
										<option value="">Unassigned</option>
										{#each participants as person (person.id)}
											<option value={person.name}>{person.name}</option>
										{/each}
									</select>
								</label>
							</div>
							<button
								type="button"
								class="mt-4 rounded-lg bg-kood-accent px-4 py-2 text-sm font-semibold text-kood-accent-foreground"
								onclick={assignRolesNow}
								disabled={assignmentLocked}
							>
								Assign roles
							</button>
							{#if assignmentLocked}
								<p class="mt-2 text-xs text-kood-muted">
									Roles already assigned. Use "Edit assignments" only if you need to change them.
								</p>
							{/if}
							<div class="mt-4 overflow-x-auto">
								<table class="min-w-full text-left text-sm">
									<thead class="text-kood-muted">
										<tr>
											<th class="px-3 py-2 font-medium">Role</th>
											<th class="px-3 py-2 font-medium">Person</th>
											<th class="px-3 py-2 font-medium">Assigned at</th>
											<th class="px-3 py-2 font-medium">Assigned by</th>
										</tr>
									</thead>
									<tbody>
										{#each assignmentDetails as row (row.slot)}
											<tr class="border-t border-kood-border/70">
												<td class="px-3 py-2 text-kood-text">{row.slotLabel}</td>
												<td class="px-3 py-2 text-kood-muted">{row.name || 'Unassigned'}</td>
												<td class="px-3 py-2 text-kood-muted">{row.assignedAt ? formatWhen(row.assignedAt) : '-'}</td>
												<td class="px-3 py-2 text-kood-muted">{row.assignedBy || '-'}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{:else if activeSection === 'waiting'}
						<div class="rounded-2xl border border-kood-border bg-kood-surface p-6">
							<h2 class="text-lg font-semibold text-kood-text">People waiting</h2>
							<p class="mt-1 text-xs text-kood-muted">Participants who still need role assignment.</p>
							<div class="mt-3 overflow-x-auto">
								<table class="min-w-full text-left text-sm">
									<thead class="text-kood-muted">
										<tr>
											<th class="px-3 py-2 font-medium">Name</th>
											<th class="px-3 py-2 font-medium">Project</th>
											<th class="px-3 py-2 font-medium">Joined</th>
										</tr>
									</thead>
									<tbody>
										{#if participants.filter((x) => !x.assignedSlot).length === 0}
											<tr>
												<td class="px-3 py-3 text-kood-muted" colspan="3">Nobody waiting right now.</td>
											</tr>
										{:else}
											{#each participants.filter((x) => !x.assignedSlot) as person (person.id)}
												<tr class="border-t border-kood-border/70">
													<td class="px-3 py-2 text-kood-text">{person.name}</td>
													<td class="px-3 py-2 text-kood-muted">{projectName}</td>
													<td class="px-3 py-2 text-kood-muted">{formatWhen(person.joinedAt)}</td>
												</tr>
											{/each}
										{/if}
									</tbody>
								</table>
							</div>
						</div>
					{:else}
						<div class="space-y-4">
							<div class="rounded-2xl border border-kood-border bg-kood-surface p-6">
								<h2 class="text-lg font-semibold text-kood-text">Latest submission</h2>
								{#if app.latestSubmission}
									<div class="mt-3 grid gap-3 md:grid-cols-3 text-sm">
										<div>
											<p class="text-xs uppercase tracking-wide text-kood-muted">Submitted by</p>
											<p class="mt-1 text-kood-text">{app.latestSubmission.by}</p>
										</div>
										<div>
											<p class="text-xs uppercase tracking-wide text-kood-muted">Submitted at</p>
											<p class="mt-1 text-kood-text">{formatWhen(app.latestSubmission.at)}</p>
										</div>
										<div>
											<p class="text-xs uppercase tracking-wide text-kood-muted">Repository</p>
											<a class="mt-1 block break-all text-kood-accent hover:underline" href={app.latestSubmission.repo}>
												{app.latestSubmission.repo}
											</a>
										</div>
									</div>
								{:else}
									<p class="mt-2 text-sm text-kood-muted">No project submission has happened yet.</p>
								{/if}
							</div>
							<div class="grid gap-4 xl:grid-cols-2">
							<div class="rounded-2xl border border-kood-border bg-kood-surface p-6">
								<h2 class="text-lg font-semibold text-kood-text">Testing comments ({projectName})</h2>
								<div class="mt-3 space-y-3">
									{#if recentTestingComments().length === 0}
										<p class="text-sm text-kood-muted">No comments yet.</p>
									{:else}
										{#each recentTestingComments() as item (item.id)}
											<div class="rounded-lg border border-kood-border/70 bg-kood-bg/35 p-3">
												<p class="text-xs uppercase tracking-wide text-kood-muted">{item.author} - {formatWhen(item.at)}</p>
												<p class="mt-1 text-sm text-kood-text">{item.text}</p>
												<p class="mt-1 text-xs text-kood-muted">Item: {item.itemText}</p>
											</div>
										{/each}
									{/if}
								</div>
							</div>
							<div class="rounded-2xl border border-kood-border bg-kood-surface p-6">
								<h2 class="text-lg font-semibold text-kood-text">Review actions ({projectName})</h2>
								<div class="mt-3 space-y-3">
									{#if recentReviewActions().length === 0}
										<p class="text-sm text-kood-muted">No review actions yet.</p>
									{:else}
										{#each recentReviewActions() as action (action.id)}
											<div class="rounded-lg border border-kood-border/70 bg-kood-bg/35 p-3">
												<p class="text-xs uppercase tracking-wide text-kood-muted">{formatWhen(action.at)}</p>
												<p class="mt-1 text-sm text-kood-text">
													{action.reviewer} {action.action} in {action.categoryId}
												</p>
											</div>
										{/each}
									{/if}
								</div>
							</div>
							</div>
						</div>
					{/if}

					<details class="mt-4 rounded-lg border border-kood-border bg-kood-surface/70 p-3 text-xs text-kood-muted">
						<summary class="cursor-pointer font-semibold text-kood-text">Debug state</summary>
						<pre class="mt-2 overflow-auto whitespace-pre-wrap break-all">{JSON.stringify(debugState, null, 2)}</pre>
					</details>
				</div>
			</main>
		</div>
	</div>
</section>
