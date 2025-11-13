<script lang="ts">
	/**
	 * Platform Admin Analytics Dashboard
	 * Comprehensive analytics for platform administrators
	 */

	import type { PageData } from './$types';
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import RatingStars from '$lib/components/charts/RatingStars.svelte';

	let { data }: { data: PageData } = $props();

	// Date range selector state
	let selectedDays = $state(30);
	let isExporting = $state(false);

	// Format numbers with commas
	function formatNumber(num: number): string {
		return num.toLocaleString();
	}

	// Format percentage
	function formatPercentage(value: number): string {
		return `${value.toFixed(1)}%`;
	}

	// Format currency
	function formatCurrency(amount: number): string {
		return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

	// Format relative time
	function formatRelativeTime(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

		if (diffInSeconds < 60) return 'just now';
		if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
		if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
		if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
		return date.toLocaleDateString();
	}

	// Calculate growth percentage
	function calculateGrowth(current: number, previous: number): number {
		if (previous === 0) return current > 0 ? 100 : 0;
		return ((current - previous) / previous) * 100;
	}

	// Handle date range change
	function changeDateRange(days: number) {
		selectedDays = days;
		window.location.href = `/admin/analytics?days=${days}`;
	}

	// Handle export
	async function handleExport() {
		isExporting = true;
		try {
			const response = await fetch(`/api/admin/analytics/export?days=${data.dateRange.days}`);
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `platform-analytics-${new Date().toISOString().split('T')[0]}.csv`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Export failed:', error);
			alert('Failed to export analytics data');
		} finally {
			isExporting = false;
		}
	}

	// Prepare DAU chart data
	const dauChartData = $derived(
		data.dauTrend.map((d: any) => ({
			date: d.date,
			value: d.active_users
		}))
	);

	// Calculate funnel conversion rates
	const funnelData = $derived(() => {
		if (!data.enrollmentFunnel) return [];
		const { page_views, enrollments, completions } = data.enrollmentFunnel;
		return [
			{ stage: 'Page Views', count: page_views, percentage: 100 },
			{
				stage: 'Enrollments',
				count: enrollments,
				percentage: page_views > 0 ? (enrollments / page_views) * 100 : 0
			},
			{
				stage: 'Completions',
				count: completions,
				percentage: enrollments > 0 ? (completions / enrollments) * 100 : 0
			}
		];
	});
</script>

<svelte:head>
	<title>Platform Analytics - Admin Dashboard</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
		<div>
			<h1 class="text-3xl font-bold mb-2">Platform Analytics</h1>
			<p class="text-base-content/70">
				Comprehensive analytics and insights for platform administrators
			</p>
		</div>

		<div class="flex gap-4 mt-4 md:mt-0">
			<!-- Date Range Selector -->
			<div class="join">
				<button
					class="join-item btn btn-sm {selectedDays === 7 ? 'btn-active' : ''}"
					onclick={() => changeDateRange(7)}
				>
					7D
				</button>
				<button
					class="join-item btn btn-sm {selectedDays === 30 ? 'btn-active' : ''}"
					onclick={() => changeDateRange(30)}
				>
					30D
				</button>
				<button
					class="join-item btn btn-sm {selectedDays === 90 ? 'btn-active' : ''}"
					onclick={() => changeDateRange(90)}
				>
					90D
				</button>
				<button
					class="join-item btn btn-sm {selectedDays === 365 ? 'btn-active' : ''}"
					onclick={() => changeDateRange(365)}
				>
					1Y
				</button>
			</div>

			<!-- Export Button -->
			<button class="btn btn-sm btn-primary" onclick={handleExport} disabled={isExporting}>
				{#if isExporting}
					<span class="loading loading-spinner loading-sm"></span>
					Exporting...
				{:else}
					📊 Export CSV
				{/if}
			</button>
		</div>
	</div>

	<!-- Platform Overview Cards -->
	<div class="mb-8">
		<h2 class="text-xl font-semibold mb-4">Platform Overview</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
			<!-- Total Users -->
			<div class="stat bg-base-100 shadow rounded-lg">
				<div class="stat-title">Total Users</div>
				<div class="stat-value text-primary">{formatNumber(data.platformStats.total_users)}</div>
				<div class="stat-desc">
					{formatNumber(data.platformStats.new_users_30d)} new in 30d
				</div>
			</div>

			<!-- Active Journeys -->
			<div class="stat bg-base-100 shadow rounded-lg">
				<div class="stat-title">Active Journeys</div>
				<div class="stat-value text-secondary">
					{formatNumber(data.platformStats.active_journeys)}
				</div>
				<div class="stat-desc">
					{formatNumber(data.platformStats.total_journeys)} total
				</div>
			</div>

			<!-- Active Mentors -->
			<div class="stat bg-base-100 shadow rounded-lg">
				<div class="stat-title">Active Mentors</div>
				<div class="stat-value text-accent">{formatNumber(data.platformStats.active_mentors)}</div>
				<div class="stat-desc">
					{formatNumber(data.platformStats.total_mentors)} total
				</div>
			</div>

			<!-- Total Enrollments -->
			<div class="stat bg-base-100 shadow rounded-lg">
				<div class="stat-title">Total Enrollments</div>
				<div class="stat-value text-info">
					{formatNumber(data.platformStats.total_enrollments)}
				</div>
				<div class="stat-desc">
					{formatPercentage(data.platformStats.completion_rate)} completion rate
				</div>
			</div>

			<!-- Pending Applications -->
			<div class="stat bg-base-100 shadow rounded-lg">
				<div class="stat-title">Pending Reviews</div>
				<div class="stat-value text-warning">
					{formatNumber(data.systemMetrics.pending_applications || 0)}
				</div>
				<div class="stat-desc">
					{formatNumber(data.systemMetrics.reviews_in_progress || 0)} in progress
				</div>
			</div>
		</div>
	</div>

	<!-- User Growth Chart -->
	<div class="mb-8">
		<div class="card bg-base-100 shadow">
			<div class="card-body">
				<h2 class="card-title">Daily Active Users</h2>
				<p class="text-base-content/70 text-sm mb-4">
					User activity trend over the last {data.dateRange.days} days
				</p>

				{#if dauChartData.length > 0}
					<div class="h-64">
						<LineChart
							data={dauChartData}
							xLabel="Date"
							yLabel="Active Users"
							color="oklch(var(--p))"
						/>
					</div>
				{:else}
					<div class="text-center py-8 text-base-content/50">
						<p>No activity data available for this period</p>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Enrollment Funnel -->
	<div class="mb-8">
		<div class="card bg-base-100 shadow">
			<div class="card-body">
				<h2 class="card-title">Enrollment Funnel</h2>
				<p class="text-base-content/70 text-sm mb-4">
					Conversion rates from page views to completions
				</p>

				<div class="space-y-4">
					{#each funnelData() as stage}
						<div class="flex items-center gap-4">
							<div class="w-32 font-medium">{stage.stage}</div>
							<div class="flex-1">
								<div class="w-full bg-base-300 rounded-full h-8 relative overflow-hidden">
									<div
										class="bg-gradient-to-r from-primary to-secondary h-8 rounded-full transition-all flex items-center justify-end pr-3"
										style="width: {stage.percentage}%"
									>
										<span class="text-primary-content text-sm font-semibold">
											{formatPercentage(stage.percentage)}
										</span>
									</div>
								</div>
							</div>
							<div class="w-24 text-right font-semibold">{formatNumber(stage.count)}</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<!-- Journey Performance Rankings -->
	<div class="mb-8">
		<h2 class="text-xl font-semibold mb-4">Top Performing Journeys</h2>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- By Enrollments -->
			<div class="card bg-base-100 shadow">
				<div class="card-body">
					<h3 class="card-title text-lg">Most Enrolled</h3>
					<div class="overflow-x-auto">
						<table class="table table-sm">
							<thead>
								<tr>
									<th>Journey</th>
									<th class="text-right">Enrollments</th>
								</tr>
							</thead>
							<tbody>
								{#each data.topJourneysByEnrollments.slice(0, 5) as journey}
									<tr>
										<td>
											<a
												href="/journeys/{journey.slug}"
												class="link link-hover font-medium truncate block max-w-[200px]"
											>
												{journey.name}
											</a>
										</td>
										<td class="text-right font-semibold">
											{formatNumber(journey.total_enrollments)}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<!-- By Completions -->
			<div class="card bg-base-100 shadow">
				<div class="card-body">
					<h3 class="card-title text-lg">Most Completed</h3>
					<div class="overflow-x-auto">
						<table class="table table-sm">
							<thead>
								<tr>
									<th>Journey</th>
									<th class="text-right">Completions</th>
								</tr>
							</thead>
							<tbody>
								{#each data.topJourneysByCompletions.slice(0, 5) as journey}
									<tr>
										<td>
											<a
												href="/journeys/{journey.slug}"
												class="link link-hover font-medium truncate block max-w-[200px]"
											>
												{journey.name}
											</a>
										</td>
										<td class="text-right font-semibold">
											{formatNumber(journey.total_completions)}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<!-- By Rating -->
			<div class="card bg-base-100 shadow">
				<div class="card-body">
					<h3 class="card-title text-lg">Highest Rated</h3>
					<div class="overflow-x-auto">
						<table class="table table-sm">
							<thead>
								<tr>
									<th>Journey</th>
									<th class="text-right">Rating</th>
								</tr>
							</thead>
							<tbody>
								{#each data.topJourneysByRating.slice(0, 5) as journey}
									<tr>
										<td>
											<a
												href="/journeys/{journey.slug}"
												class="link link-hover font-medium truncate block max-w-[200px]"
											>
												{journey.name}
											</a>
										</td>
										<td class="text-right">
											<RatingStars rating={journey.average_rating || 0} size="sm" showValue />
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Mentor Leaderboard -->
	<div class="mb-8">
		<div class="card bg-base-100 shadow">
			<div class="card-body">
				<h2 class="card-title">Top Mentors</h2>
				<p class="text-base-content/70 text-sm mb-4">
					Highest performing mentors by rating and review completion
				</p>

				<div class="overflow-x-auto">
					<table class="table">
						<thead>
							<tr>
								<th>Rank</th>
								<th>Mentor</th>
								<th class="text-right">Rating</th>
								<th class="text-right">Reviews Completed</th>
								<th class="text-right">Active Journeys</th>
								<th class="text-right">Response Time</th>
							</tr>
						</thead>
						<tbody>
							{#each data.topMentors.slice(0, 10) as mentor, index}
								<tr>
									<td>
										<div class="font-bold text-lg">#{index + 1}</div>
									</td>
									<td>
										<div class="flex items-center gap-3">
											<div class="avatar placeholder">
												<div class="bg-primary text-primary-content rounded-full w-10">
													<span class="text-sm">{mentor.username?.[0]?.toUpperCase()}</span>
												</div>
											</div>
											<div>
												<div class="font-medium">{mentor.username}</div>
												<div class="text-sm text-base-content/70">{mentor.email}</div>
											</div>
										</div>
									</td>
									<td class="text-right">
										<RatingStars rating={mentor.average_rating || 0} size="sm" showValue />
									</td>
									<td class="text-right font-semibold">
										{formatNumber(mentor.completed_reviews || 0)}
									</td>
									<td class="text-right">
										{formatNumber(mentor.assigned_journeys || 0)}
									</td>
									<td class="text-right">
										{mentor.avg_response_time_hours
											? `${mentor.avg_response_time_hours.toFixed(1)}h`
											: 'N/A'}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</div>

	<!-- Recent Activity -->
	<div class="mb-8">
		<div class="card bg-base-100 shadow">
			<div class="card-body">
				<h2 class="card-title">Recent Enrollments</h2>
				<p class="text-base-content/70 text-sm mb-4">Latest platform activity</p>

				<div class="overflow-x-auto">
					<table class="table">
						<thead>
							<tr>
								<th>Time</th>
								<th>User</th>
								<th>Journey</th>
								<th>Tier</th>
							</tr>
						</thead>
						<tbody>
							{#each data.recentEnrollments as enrollment}
								<tr>
									<td class="text-sm text-base-content/70">
										{formatRelativeTime(enrollment.created_at)}
									</td>
									<td>
										<div class="font-medium">{enrollment.username}</div>
									</td>
									<td>
										<div class="font-medium">{enrollment.journey_name}</div>
									</td>
									<td>
										<div class="badge badge-outline">{enrollment.tier_name}</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</div>

	<!-- System Metrics -->
	<div class="mb-8">
		<h2 class="text-xl font-semibold mb-4">System Metrics</h2>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div class="stat bg-base-100 shadow rounded-lg">
				<div class="stat-title">Total Analytics Events</div>
				<div class="stat-value text-sm">
					{formatNumber(data.systemMetrics.total_events || 0)}
				</div>
				<div class="stat-desc">
					{formatNumber(data.systemMetrics.events_7d || 0)} in last 7 days
				</div>
			</div>

			<div class="stat bg-base-100 shadow rounded-lg">
				<div class="stat-title">Total Reviews</div>
				<div class="stat-value text-sm">
					{formatNumber(data.systemMetrics.total_reviews || 0)}
				</div>
				<div class="stat-desc">
					{formatNumber(data.systemMetrics.reviews_in_progress || 0)} in progress
				</div>
			</div>

			<div class="stat bg-base-100 shadow rounded-lg">
				<div class="stat-title">Mentor Applications</div>
				<div class="stat-value text-sm">
					{formatNumber(data.systemMetrics.pending_applications || 0)}
				</div>
				<div class="stat-desc">Pending review</div>
			</div>
		</div>
	</div>
</div>
