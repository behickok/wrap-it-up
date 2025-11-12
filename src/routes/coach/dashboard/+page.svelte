<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let editingNotes: number | null = $state(null);
	let notesText = $state('');

	function startEditingNotes(relationshipId: number, currentNotes: string) {
		editingNotes = relationshipId;
		notesText = currentNotes || '';
	}

	function cancelEditingNotes() {
		editingNotes = null;
		notesText = '';
	}

	function getStatusBadgeClass(status: string): string {
		switch (status) {
			case 'active':
				return 'badge-success';
			case 'pending':
				return 'badge-warning';
			case 'paused':
				return 'badge-info';
			case 'ended':
				return 'badge-error';
			default:
				return '';
		}
	}

	function getAccessLevelBadge(level: string): string {
		switch (level) {
			case 'view':
				return '👁️ View Only';
			case 'edit':
				return '✏️ Can Edit';
			case 'full':
				return '🔓 Full Access';
			default:
				return level;
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-4xl font-bold">Coach Dashboard</h1>
		<p class="text-base-content/70 mt-2">
			Manage your clients and help them on their journeys
		</p>
	</div>

	<!-- Summary Stats -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
		<div class="stat bg-base-100 shadow rounded-lg">
			<div class="stat-figure text-success">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
				</svg>
			</div>
			<div class="stat-title">Active Clients</div>
			<div class="stat-value text-success">{data.summary.activeClients}</div>
			<div class="stat-desc">Currently coaching</div>
		</div>

		<div class="stat bg-base-100 shadow rounded-lg">
			<div class="stat-figure text-warning">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
				</svg>
			</div>
			<div class="stat-title">Pending Requests</div>
			<div class="stat-value text-warning">{data.summary.pendingRequests}</div>
			<div class="stat-desc">Awaiting your response</div>
		</div>

		<div class="stat bg-base-100 shadow rounded-lg">
			<div class="stat-figure text-primary">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
				</svg>
			</div>
			<div class="stat-title">Total Clients</div>
			<div class="stat-value text-primary">{data.summary.totalClients}</div>
			<div class="stat-desc">All time</div>
		</div>
	</div>

	<!-- Clients List -->
	<div class="mb-8">
		<h2 class="text-2xl font-bold mb-4">Your Clients</h2>

		{#if data.clients.length === 0}
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body text-center py-12">
					<div class="text-6xl mb-4">👥</div>
					<h3 class="text-2xl font-bold mb-2">No Clients Yet</h3>
					<p class="text-base-content/70 mb-4">
						When users request coaching, they'll appear here
					</p>
				</div>
			</div>
		{:else}
			<div class="grid gap-6">
				{#each data.clients as client}
					<div class="card bg-base-100 shadow-xl">
						<div class="card-body">
							<div class="flex justify-between items-start">
								<div class="flex-1">
									<div class="flex items-center gap-3 mb-2">
										<div class="avatar placeholder">
											<div class="bg-primary text-primary-content rounded-full w-12">
												<span class="text-xl">{client.client_username.charAt(0).toUpperCase()}</span>
											</div>
										</div>
										<div>
											<h3 class="text-xl font-bold">{client.client_username}</h3>
											<p class="text-sm text-base-content/70">{client.client_email}</p>
										</div>
									</div>

									<div class="flex gap-2 mb-3">
										<div class="badge {getStatusBadgeClass(client.status)}">
											{client.status}
										</div>
										<div class="badge badge-outline">
											{getAccessLevelBadge(client.access_level)}
										</div>
										{#if client.journey_name}
											<div class="badge badge-ghost">
												{client.journey_name}
											</div>
										{:else}
											<div class="badge badge-ghost">
												All Journeys
											</div>
										{/if}
									</div>

									<!-- Notes Section -->
									<div class="mt-4">
										{#if editingNotes === client.id}
											<form method="POST" action="?/updateNotes" use:enhance>
												<input type="hidden" name="relationship_id" value={client.id} />
												<textarea
													name="notes"
													bind:value={notesText}
													class="textarea textarea-bordered w-full mb-2"
													rows="3"
													placeholder="Add notes about this client..."
												></textarea>
												<div class="flex gap-2">
													<button type="submit" class="btn btn-sm btn-primary">
														Save Notes
													</button>
													<button
														type="button"
														class="btn btn-sm btn-ghost"
														onclick={cancelEditingNotes}
													>
														Cancel
													</button>
												</div>
											</form>
										{:else}
											<div class="bg-base-200 rounded-lg p-3">
												<div class="flex justify-between items-center mb-1">
													<span class="text-sm font-semibold">Coach Notes</span>
													<button
														class="btn btn-xs btn-ghost"
														onclick={() => startEditingNotes(client.id, client.notes || '')}
													>
														✏️ Edit
													</button>
												</div>
												<p class="text-sm text-base-content/70">
													{client.notes || 'No notes yet...'}
												</p>
											</div>
										{/if}
									</div>
								</div>

								<div class="flex flex-col gap-2">
									{#if client.status === 'pending'}
										<form method="POST" action="?/acceptClient" use:enhance>
											<input type="hidden" name="relationship_id" value={client.id} />
											<button type="submit" class="btn btn-sm btn-success">
												✓ Accept
											</button>
										</form>
										<form method="POST" action="?/rejectClient" use:enhance>
											<input type="hidden" name="relationship_id" value={client.id} />
											<button type="submit" class="btn btn-sm btn-error">
												✗ Reject
											</button>
										</form>
									{:else if client.status === 'active'}
										<a
											href="/coach/clients/{client.client_user_id}"
											class="btn btn-sm btn-primary"
										>
											View Journey
										</a>
										<form method="POST" action="?/pauseClient" use:enhance>
											<input type="hidden" name="relationship_id" value={client.id} />
											<button type="submit" class="btn btn-sm btn-warning">
												⏸️ Pause
											</button>
										</form>
									{:else if client.status === 'paused'}
										<form method="POST" action="?/acceptClient" use:enhance>
											<input type="hidden" name="relationship_id" value={client.id} />
											<button type="submit" class="btn btn-sm btn-success">
												▶️ Resume
											</button>
										</form>
									{/if}
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Coach Profile Settings -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">Coach Profile</h2>
			<p class="text-base-content/70 mb-4">
				Manage your coaching profile and availability
			</p>
			<div class="flex gap-4">
				<a href="/coach/profile" class="btn btn-outline">
					Edit Profile
				</a>
				<a href="/coach/availability" class="btn btn-outline">
					Set Availability
				</a>
			</div>
		</div>
	</div>
</div>

<style>
	.stat {
		padding: 1.5rem;
	}
</style>
