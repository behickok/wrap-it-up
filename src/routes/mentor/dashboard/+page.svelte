<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Format date
	function formatDate(dateStr: string | null): string {
		if (!dateStr) return 'N/A';
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Format currency
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}

	// Get status badge class
	function getStatusBadgeClass(status: string): string {
		switch (status) {
			case 'requested':
				return 'badge-warning';
			case 'in_review':
				return 'badge-info';
			case 'approved':
				return 'badge-success';
			case 'changes_requested':
				return 'badge-error';
			default:
				return 'badge-ghost';
		}
	}

	// Get priority badge class
	function getPriorityBadgeClass(priority: string): string {
		switch (priority) {
			case 'urgent':
				return 'badge-error';
			case 'high':
				return 'badge-warning';
			case 'normal':
				return 'badge-info';
			case 'low':
				return 'badge-ghost';
			default:
				return 'badge-ghost';
		}
	}
</script>

<svelte:head>
	<title>Mentor Dashboard - Wrap It Up</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-4xl font-bold mb-2">Mentor Dashboard</h1>
		<p class="text-base-content/70">Review client journey sections and provide expert feedback</p>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
		<div class="stat bg-gradient-to-br from-warning to-warning/80 text-warning-content shadow-xl rounded-lg">
			<div class="stat-title text-warning-content/80">Pending Reviews</div>
			<div class="stat-value text-3xl">{data.stats.pending_count}</div>
			<div class="stat-desc text-warning-content/70">Awaiting claim</div>
		</div>

		<div class="stat bg-gradient-to-br from-info to-info/80 text-info-content shadow-xl rounded-lg">
			<div class="stat-title text-info-content/80">In Progress</div>
			<div class="stat-value text-3xl">{data.stats.in_progress_count}</div>
			<div class="stat-desc text-info-content/70">Currently reviewing</div>
		</div>

		<div class="stat bg-gradient-to-br from-success to-success/80 text-success-content shadow-xl rounded-lg">
			<div class="stat-title text-success-content/80">Completed</div>
			<div class="stat-value text-3xl">{data.stats.completed_reviews}</div>
			<div class="stat-desc text-success-content/70">All time</div>
		</div>

		<div class="stat bg-gradient-to-br from-primary to-primary/80 text-primary-content shadow-xl rounded-lg">
			<div class="stat-title text-primary-content/80">Avg Rating</div>
			<div class="stat-value text-3xl">{data.stats.average_rating.toFixed(1)} ⭐</div>
			<div class="stat-desc text-primary-content/70">Client satisfaction</div>
		</div>
	</div>

	<!-- Additional Stats Row -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
		<div class="stat bg-base-100 shadow rounded-lg">
			<div class="stat-title">Total Earnings</div>
			<div class="stat-value text-2xl text-success">{formatCurrency(data.stats.total_earnings)}</div>
		</div>

		<div class="stat bg-base-100 shadow rounded-lg">
			<div class="stat-title">Avg Turnaround</div>
			<div class="stat-value text-2xl">{data.stats.average_turnaround_hours.toFixed(1)}h</div>
		</div>

		<div class="stat bg-base-100 shadow rounded-lg">
			<div class="stat-title">Assigned Journeys</div>
			<div class="stat-value text-2xl">{data.assignedJourneys.length}</div>
		</div>
	</div>

	<!-- Pending Reviews -->
	<div class="card bg-base-100 shadow-xl mb-8">
		<div class="card-body">
			<h2 class="card-title text-2xl mb-4">
				Pending Reviews ({data.pendingReviews.length})
			</h2>

			{#if data.pendingReviews.length === 0}
				<p class="text-base-content/70">
					No pending reviews at the moment. Check back soon!
				</p>
			{:else}
				<div class="overflow-x-auto">
					<table class="table table-zebra">
						<thead>
							<tr>
								<th>Client</th>
								<th>Journey</th>
								<th>Section</th>
								<th>Priority</th>
								<th>Requested</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each data.pendingReviews as review}
								<tr>
									<td>
										<div class="font-bold">{review.client_username}</div>
										<div class="text-xs opacity-70">{review.client_email}</div>
									</td>
									<td>{review.journey_name}</td>
									<td>{review.section_name}</td>
									<td>
										<div class="badge {getPriorityBadgeClass(review.priority)}">
											{review.priority}
										</div>
									</td>
									<td class="text-sm">{formatDate(review.requested_at)}</td>
									<td>
										<a
											href="/mentor/reviews/{review.id}"
											class="btn btn-primary btn-sm"
										>
											Start Review
										</a>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>

	<!-- In Progress Reviews -->
	{#if data.inProgressReviews.length > 0}
		<div class="card bg-base-100 shadow-xl mb-8">
			<div class="card-body">
				<h2 class="card-title text-2xl mb-4">
					In Progress ({data.inProgressReviews.length})
				</h2>

				<div class="overflow-x-auto">
					<table class="table table-zebra">
						<thead>
							<tr>
								<th>Client</th>
								<th>Journey</th>
								<th>Section</th>
								<th>Claimed</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each data.inProgressReviews as review}
								<tr>
									<td>
										<div class="font-bold">{review.client_username}</div>
										<div class="text-xs opacity-70">{review.client_email}</div>
									</td>
									<td>{review.journey_name}</td>
									<td>{review.section_name}</td>
									<td class="text-sm">{formatDate(review.claimed_at)}</td>
									<td>
										<a
											href="/mentor/reviews/{review.id}"
											class="btn btn-info btn-sm"
										>
											Continue Review
										</a>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}

	<!-- Recent Completed Reviews -->
	{#if data.completedReviews.length > 0}
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title text-2xl mb-4">
					Recent Completed Reviews
				</h2>

				<div class="overflow-x-auto">
					<table class="table table-sm">
						<thead>
							<tr>
								<th>Client</th>
								<th>Journey</th>
								<th>Section</th>
								<th>Status</th>
								<th>Completed</th>
								<th>Rating</th>
							</tr>
						</thead>
						<tbody>
							{#each data.completedReviews as review}
								<tr>
									<td class="text-sm">{review.client_username}</td>
									<td class="text-sm">{review.journey_name}</td>
									<td class="text-sm">{review.section_name}</td>
									<td>
										<div class="badge badge-sm {getStatusBadgeClass(review.status)}">
											{review.status.replace('_', ' ')}
										</div>
									</td>
									<td class="text-xs">{formatDate(review.reviewed_at)}</td>
									<td>
										{#if review.overall_rating}
											{review.overall_rating} ⭐
										{:else}
											<span class="text-xs opacity-50">Not rated</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}

	<!-- Help Section -->
	<div class="alert alert-info mt-8">
		<div>
			<h3 class="font-bold mb-2">Mentor Guide</h3>
			<ul class="list-disc list-inside text-sm space-y-1">
				<li>Click "Start Review" to claim a pending review request</li>
				<li>Provide detailed, constructive feedback on each section</li>
				<li>You can approve sections or request changes with specific guidance</li>
				<li>Clients can rate your reviews - maintain high quality for better ratings</li>
				<li>Fast turnaround times improve your mentor stats and client satisfaction</li>
			</ul>
		</div>
	</div>
</div>
