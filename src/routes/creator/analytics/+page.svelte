<script lang="ts">
	import type { PageData } from './$types';
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import BarChart from '$lib/components/charts/BarChart.svelte';

	let { data }: { data: PageData } = $props();

	// Format number with commas
	function formatNumber(num: number): string {
		return new Intl.NumberFormat().format(Math.round(num));
	}

	// Format date
	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
	}

	// Export to CSV
	async function exportToCSV() {
		const response = await fetch('/api/creator/analytics/export');
		const blob = await response.blob();
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `journey-analytics-${new Date().toISOString().split('T')[0]}.csv`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	}

	// Change date range
	function changeDateRange(days: number) {
		window.location.href = `/creator/analytics?days=${days}`;
	}
</script>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="flex justify-between items-center mb-8">
		<div>
			<h1 class="text-4xl font-bold">Analytics Dashboard</h1>
			<p class="text-base-content/70 mt-2">
				Insights for your journeys over the last {data.dateRange.days} days
			</p>
		</div>
		<div class="flex gap-2">
			<!-- Date Range Selector -->
			<div class="dropdown dropdown-end">
				<label tabindex="0" class="btn btn-outline">
					📅 Last {data.dateRange.days} Days
				</label>
				<ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
					<li><button onclick={() => changeDateRange(7)}>Last 7 Days</button></li>
					<li><button onclick={() => changeDateRange(30)}>Last 30 Days</button></li>
					<li><button onclick={() => changeDateRange(90)}>Last 90 Days</button></li>
					<li><button onclick={() => changeDateRange(365)}>Last Year</button></li>
				</ul>
			</div>
			<button class="btn btn-primary" onclick={exportToCSV}>
				📥 Export CSV
			</button>
		</div>
	</div>

	<!-- Summary Stats -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
		<div class="stat bg-base-100 shadow rounded-lg">
			<div class="stat-figure text-primary">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
				</svg>
			</div>
			<div class="stat-title">Total Journeys</div>
			<div class="stat-value text-primary">{data.summary.totalJourneys}</div>
			<div class="stat-desc">Active journeys</div>
		</div>

		<div class="stat bg-base-100 shadow rounded-lg">
			<div class="stat-figure text-secondary">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
				</svg>
			</div>
			<div class="stat-title">Total Enrollments</div>
			<div class="stat-value text-secondary">{formatNumber(data.summary.totalEnrollments)}</div>
			<div class="stat-desc">{formatNumber(data.summary.totalActiveUsers)} active</div>
		</div>

		<div class="stat bg-base-100 shadow rounded-lg">
			<div class="stat-figure text-accent">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
				</svg>
			</div>
			<div class="stat-title">Completion Rate</div>
			<div class="stat-value text-accent">{data.summary.completionRate}%</div>
			<div class="stat-desc">{formatNumber(data.summary.totalCompletedUsers)} completed</div>
		</div>

		<div class="stat bg-base-100 shadow rounded-lg">
			<div class="stat-figure text-success">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
				</svg>
			</div>
			<div class="stat-title">Avg Review Rating</div>
			<div class="stat-value text-success">{data.summary.avgRating}</div>
			<div class="stat-desc">{formatNumber(data.summary.totalReviews)} reviews</div>
		</div>
	</div>

	<!-- Daily Active Users Trend -->
	{#if data.dauTrend && data.dauTrend.length > 0}
		<div class="card bg-base-100 shadow-xl mb-8">
			<div class="card-body">
				<h2 class="card-title text-2xl mb-4">Daily Active Users</h2>
				<LineChart
					data={data.dauTrend.map((d: any) => ({
						label: formatDate(d.date),
						value: d.active_users || 0
					}))}
					color="oklch(var(--p))"
					height={250}
				/>
			</div>
		</div>
	{/if}

	<!-- Journey Performance -->
	<div class="mb-8">
		<h2 class="text-2xl font-bold mb-4">Journey Performance</h2>

		{#if data.journeyAnalytics.length === 0}
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body text-center py-12">
					<div class="text-6xl mb-4">📊</div>
					<h3 class="text-2xl font-bold mb-2">No Analytics Data Yet</h3>
					<p class="text-base-content/70 mb-4">
						Analytics will appear once users start enrolling in your journeys
					</p>
				</div>
			</div>
		{:else}
			<div class="grid gap-6">
				{#each data.journeyAnalytics as journey}
					{@const engagementData = data.engagementTrends.get(journey.journey_id) || []}
					{@const sectionData = data.sectionStats.get(journey.journey_id) || []}
					{@const journeyInfo = data.journeys.find((j: any) => j.id === journey.journey_id)}

					<div class="card bg-base-100 shadow-xl">
						<div class="card-body">
							<!-- Journey Header -->
							<div class="flex items-center gap-3 mb-4">
								<div class="text-3xl">{journeyInfo?.icon || '🎯'}</div>
								<div class="flex-1">
									<h3 class="card-title text-xl">{journey.journey_name}</h3>
									<div class="text-sm text-base-content/60">/{journey.journey_slug}</div>
								</div>
								<a href="/admin/journeys/{journey.journey_id}/edit" class="btn btn-sm btn-outline">
									Edit Journey
								</a>
							</div>

							<!-- Journey Stats Grid -->
							<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
								<div class="stat bg-base-200 rounded-lg p-4">
									<div class="stat-title text-xs">Enrollments</div>
									<div class="stat-value text-2xl">{formatNumber(journey.total_enrollments || 0)}</div>
								</div>
								<div class="stat bg-base-200 rounded-lg p-4">
									<div class="stat-title text-xs">Active Users</div>
									<div class="stat-value text-2xl">{formatNumber(journey.active_users || 0)}</div>
								</div>
								<div class="stat bg-base-200 rounded-lg p-4">
									<div class="stat-title text-xs">Completed</div>
									<div class="stat-value text-2xl">{formatNumber(journey.completed_users || 0)}</div>
								</div>
								<div class="stat bg-base-200 rounded-lg p-4">
									<div class="stat-title text-xs">Avg Rating</div>
									<div class="stat-value text-2xl">{(journey.avg_review_rating || 0).toFixed(1)} ⭐</div>
								</div>
							</div>

							<!-- Engagement Trend Chart -->
							{#if engagementData.length > 0}
								<div class="mb-6">
									<h4 class="font-semibold mb-3">Engagement Trend</h4>
									<LineChart
										data={engagementData.map((d: any) => ({
											label: formatDate(d.date),
											value: d.active_users || 0
										}))}
										color="oklch(var(--s))"
										height={200}
									/>
								</div>
							{/if}

							<!-- Section Completion Rates -->
							{#if sectionData.length > 0}
								<div>
									<h4 class="font-semibold mb-3">Section Completion Rates</h4>
									<BarChart
										data={sectionData.slice(0, 10).map((s: any) => ({
											label: s.section_name || 'Unknown',
											value: parseFloat(s.completion_rate) || 0
										}))}
										color="oklch(var(--a))"
										height={200}
										maxValue={100}
									/>
									{#if sectionData.length > 10}
										<p class="text-sm text-base-content/60 mt-2">
											Showing top 10 sections. {sectionData.length - 10} more sections available.
										</p>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Back to Dashboard -->
	<div class="text-center mt-8">
		<a href="/creator/dashboard" class="btn btn-outline">
			← Back to Dashboard
		</a>
	</div>
</div>

<style>
	.stat {
		padding: 1rem;
	}
</style>
