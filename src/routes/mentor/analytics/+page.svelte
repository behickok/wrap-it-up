<script lang="ts">
	import type { PageData } from './$types';
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import RatingStars from '$lib/components/charts/RatingStars.svelte';

	let { data }: { data: PageData } = $props();

	// Format number with commas
	function formatNumber(num: number): string {
		return new Intl.NumberFormat().format(Math.round(num));
	}

	// Format currency
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}

	// Format date
	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
	}

	// Format hours
	function formatHours(hours: number): string {
		if (hours < 1) return `${Math.round(hours * 60)} min`;
		if (hours < 24) return `${hours.toFixed(1)} hrs`;
		return `${(hours / 24).toFixed(1)} days`;
	}

	// Export to CSV
	async function exportToCSV() {
		const response = await fetch('/api/mentor/analytics/export');
		const blob = await response.blob();
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `mentor-analytics-${new Date().toISOString().split('T')[0]}.csv`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	}

	// Change date range
	function changeDateRange(days: number) {
		window.location.href = `/mentor/analytics?days=${days}`;
	}

	// Calculate rating percentage
	function getRatingPercentage(count: number, total: number): number {
		return total > 0 ? (count / total) * 100 : 0;
	}

	const starDistribution = [
		{ stars: 5, key: 'five_star_count' },
		{ stars: 4, key: 'four_star_count' },
		{ stars: 3, key: 'three_star_count' },
		{ stars: 2, key: 'two_star_count' },
		{ stars: 1, key: 'one_star_count' }
	] as const;
</script>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="flex justify-between items-center mb-8">
		<div>
			<h1 class="text-4xl font-bold">Mentor Analytics</h1>
			<p class="text-base-content/70 mt-2">
				Your performance insights for the last {data.dateRange.days} days
			</p>
		</div>
		<div class="flex gap-2">
			<!-- Date Range Selector -->
			<details class="dropdown dropdown-end">
				<summary class="btn btn-outline" aria-haspopup="listbox">
					📅 Last {data.dateRange.days} Days
				</summary>
				<ul class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52" role="listbox">
					<li><button type="button" onclick={() => changeDateRange(7)}>Last 7 Days</button></li>
					<li><button type="button" onclick={() => changeDateRange(30)}>Last 30 Days</button></li>
					<li><button type="button" onclick={() => changeDateRange(90)}>Last 90 Days</button></li>
					<li><button type="button" onclick={() => changeDateRange(365)}>Last Year</button></li>
				</ul>
			</details>
			<button class="btn btn-primary" onclick={exportToCSV}>
				📥 Export CSV
			</button>
		</div>
	</div>

	<!-- Performance Summary Stats -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
		<div class="stat bg-base-100 shadow rounded-lg">
			<div class="stat-figure text-primary">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
				</svg>
			</div>
			<div class="stat-title">Total Reviews</div>
			<div class="stat-value text-primary">{formatNumber(data.performanceStats?.total_reviews || 0)}</div>
			<div class="stat-desc">{formatNumber(data.performanceStats?.completed_reviews || 0)} completed</div>
		</div>

		<div class="stat bg-base-100 shadow rounded-lg">
			<div class="stat-figure text-secondary">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
				</svg>
			</div>
			<div class="stat-title">Avg Turnaround</div>
			<div class="stat-value text-secondary">
				{formatHours(data.performanceStats?.avg_turnaround_hours || 0)}
			</div>
			<div class="stat-desc">
				Response: {formatHours(data.performanceStats?.avg_response_hours || 0)}
			</div>
		</div>

		<div class="stat bg-base-100 shadow rounded-lg">
			<div class="stat-figure text-accent">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
				</svg>
			</div>
			<div class="stat-title">Average Rating</div>
			<div class="stat-value text-accent">
				{(data.ratingsBreakdown?.avg_overall_rating || 0).toFixed(1)} ⭐
			</div>
			<div class="stat-desc">
				{formatNumber(data.ratingsBreakdown?.total_ratings || 0)} ratings
			</div>
		</div>

		<div class="stat bg-base-100 shadow rounded-lg">
			<div class="stat-figure text-success">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
				</svg>
			</div>
			<div class="stat-title">Total Earnings</div>
			<div class="stat-value text-success">
				{formatCurrency(data.earningsSummary?.total_earnings || 0)}
			</div>
			<div class="stat-desc">
				Pending: {formatCurrency(data.earningsSummary?.pending_amount || 0)}
			</div>
		</div>
	</div>

	<!-- Rating Breakdown -->
	{#if data.ratingsBreakdown && (data.ratingsBreakdown.total_ratings ?? 0) > 0}
		{@const ratings = data.ratingsBreakdown}
		<div class="card bg-base-100 shadow-xl mb-8">
			<div class="card-body">
				<h2 class="card-title text-2xl mb-4">Rating Breakdown</h2>

				<div class="grid md:grid-cols-2 gap-8">
					<!-- Star Distribution -->
					<div>
						<h3 class="font-semibold mb-4">Star Distribution</h3>
						<div class="space-y-2">
							{#each starDistribution as entry}
								{@const count = ratings[entry.key] || 0}
								{@const percentage = getRatingPercentage(count, ratings.total_ratings || 0)}
								<div class="flex items-center gap-2">
									<div class="w-16 text-sm font-medium">{entry.stars} ⭐</div>
									<div class="flex-1">
										<div class="w-full bg-base-300 rounded-full h-4">
											<div
												class="bg-accent h-4 rounded-full transition-all"
												style="width: {percentage}%"
											></div>
										</div>
									</div>
									<div class="w-16 text-sm text-right">{count} ({percentage.toFixed(0)}%)</div>
								</div>
							{/each}
						</div>
					</div>

					<!-- Rating Categories -->
					<div>
						<h3 class="font-semibold mb-4">Performance Metrics</h3>
						<div class="space-y-4">
							<div>
								<div class="flex justify-between mb-1">
									<span class="text-sm">Helpfulness</span>
									<span class="text-sm font-bold">
										{(ratings.avg_helpfulness_rating ?? 0).toFixed(1)} / 5.0
									</span>
								</div>
								<RatingStars rating={ratings.avg_helpfulness_rating ?? 0} />
							</div>

							<div>
								<div class="flex justify-between mb-1">
									<span class="text-sm">Timeliness</span>
									<span class="text-sm font-bold">
										{(ratings.avg_timeliness_rating ?? 0).toFixed(1)} / 5.0
									</span>
								</div>
								<RatingStars rating={ratings.avg_timeliness_rating ?? 0} />
							</div>

							<div>
								<div class="flex justify-between mb-1">
									<span class="text-sm">Communication</span>
									<span class="text-sm font-bold">
										{(ratings.avg_communication_rating ?? 0).toFixed(1)} / 5.0
									</span>
								</div>
								<RatingStars rating={ratings.avg_communication_rating ?? 0} />
							</div>

							<div class="mt-4 pt-4 border-t border-base-300">
								<div class="stat bg-base-200 rounded-lg p-3">
									<div class="stat-title text-xs">Would Recommend</div>
									<div class="stat-value text-xl">
										{(ratings.recommend_percentage ?? 0).toFixed(0)}%
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Activity Timeline -->
	{#if data.activityTimeline && data.activityTimeline.length > 0}
		<div class="card bg-base-100 shadow-xl mb-8">
			<div class="card-body">
				<h2 class="card-title text-2xl mb-4">Activity Timeline</h2>
				<LineChart
					data={data.activityTimeline.map((d: any) => ({
						label: formatDate(d.date),
						value: d.reviews_completed || 0
					}))}
					color="oklch(var(--p))"
					height={250}
				/>
				<div class="grid grid-cols-3 gap-4 mt-4">
					<div class="stat bg-base-200 rounded-lg p-3">
						<div class="stat-title text-xs">Avg Reviews/Day</div>
						<div class="stat-value text-lg">
							{(
								data.activityTimeline.reduce((sum: number, d: any) => sum + (d.reviews_completed || 0), 0) /
								data.activityTimeline.length
							).toFixed(1)}
						</div>
					</div>
					<div class="stat bg-base-200 rounded-lg p-3">
						<div class="stat-title text-xs">Peak Day</div>
						<div class="stat-value text-lg">
							{Math.max(...data.activityTimeline.map((d: any) => d.reviews_completed || 0))}
						</div>
					</div>
					<div class="stat bg-base-200 rounded-lg p-3">
						<div class="stat-title text-xs">Active Days</div>
						<div class="stat-value text-lg">
							{data.activityTimeline.filter((d: any) => d.reviews_completed > 0).length}
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Earnings Breakdown -->
	{#if data.earningsSummary}
		<div class="card bg-base-100 shadow-xl mb-8">
			<div class="card-body">
				<h2 class="card-title text-2xl mb-4">Earnings Breakdown</h2>
				<div class="grid md:grid-cols-3 gap-4">
					<div class="stat bg-base-200 rounded-lg p-4">
						<div class="stat-title">Review Earnings</div>
						<div class="stat-value text-2xl">
							{formatCurrency(data.earningsSummary.review_earnings || 0)}
						</div>
					</div>
					<div class="stat bg-base-200 rounded-lg p-4">
						<div class="stat-title">Revenue Share</div>
						<div class="stat-value text-2xl">
							{formatCurrency(data.earningsSummary.revenue_share_earnings || 0)}
						</div>
					</div>
					<div class="stat bg-base-200 rounded-lg p-4">
						<div class="stat-title">Bonus Earnings</div>
						<div class="stat-value text-2xl">
							{formatCurrency(data.earningsSummary.bonus_earnings || 0)}
						</div>
					</div>
				</div>

				<div class="mt-4 p-4 bg-info/10 rounded-lg">
					<div class="flex justify-between items-center">
						<div>
							<div class="font-semibold">Pending Payout</div>
							<div class="text-sm text-base-content/70">
								{data.earningsSummary.total_transactions || 0} transactions
							</div>
						</div>
						<div class="text-2xl font-bold">
							{formatCurrency(data.earningsSummary.pending_amount || 0)}
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Journey Assignments -->
	{#if data.assignments && data.assignments.length > 0}
		<div class="card bg-base-100 shadow-xl mb-8">
			<div class="card-body">
				<h2 class="card-title text-2xl mb-4">Journey Assignments</h2>
				<div class="grid gap-4">
					{#each data.assignments as assignment}
						<div class="card bg-base-200">
							<div class="card-body p-4">
								<div class="flex items-center gap-3">
									<div class="text-3xl">{assignment.journey_icon || '🎯'}</div>
									<div class="flex-1">
										<h3 class="font-semibold">{assignment.journey_name}</h3>
										<div class="text-sm text-base-content/60">
											Rate: {formatCurrency(assignment.review_rate || 0)}/review •
											{assignment.total_reviews || 0} reviews completed •
											{(assignment.average_rating || 0).toFixed(1)} ⭐
										</div>
									</div>
									<a href="/journeys/{assignment.journey_slug}" class="btn btn-sm btn-outline">
										View Journey
									</a>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Recent Reviews -->
	{#if data.recentReviews && data.recentReviews.length > 0}
		<div class="card bg-base-100 shadow-xl mb-8">
			<div class="card-body">
				<h2 class="card-title text-2xl mb-4">Recent Reviews</h2>
				<div class="overflow-x-auto">
					<table class="table">
						<thead>
							<tr>
								<th>Journey</th>
								<th>Section</th>
								<th>Client</th>
								<th>Status</th>
								<th>Requested</th>
								<th>Turnaround</th>
							</tr>
						</thead>
						<tbody>
							{#each data.recentReviews as review}
								<tr>
									<td>{review.journey_name}</td>
									<td>{review.section_name}</td>
									<td>{review.client_username}</td>
									<td>
										<div class="badge" class:badge-success={review.status === 'approved'} class:badge-warning={review.status === 'in_review'} class:badge-info={review.status === 'requested'}>
											{review.status}
										</div>
									</td>
									<td>{formatDate(review.requested_at)}</td>
									<td>
										{review.turnaround_hours ? formatHours(review.turnaround_hours) : '-'}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}

	<!-- Back to Dashboard -->
	<div class="text-center mt-8">
		<a href="/mentor/dashboard" class="btn btn-outline">
			← Back to Dashboard
		</a>
	</div>
</div>

<style>
	.stat {
		padding: 1rem;
	}
</style>
