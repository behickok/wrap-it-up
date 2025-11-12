<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Calculate trend for a metric
	function calculateTrend(analytics: any[], metric: string): string {
		if (analytics.length < 2) return '0';
		const latest = analytics[0]?.[metric] || 0;
		const previous = analytics[1]?.[metric] || 0;
		if (previous === 0) return latest > 0 ? '+100' : '0';
		const change = ((latest - previous) / previous) * 100;
		return change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1);
	}

	// Get the latest metric value
	function getLatestMetric(journeyId: number, metric: string): number {
		const analytics = data.analytics.get(journeyId);
		return analytics?.[0]?.[metric] || 0;
	}
</script>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="flex justify-between items-center mb-8">
		<div>
			<h1 class="text-4xl font-bold">Creator Dashboard</h1>
			<p class="text-base-content/70 mt-2">
				Welcome back, {data.user.username}
			</p>
		</div>
		<a href="/admin/journeys" class="btn btn-primary">
			+ Create New Journey
		</a>
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
			<div class="stat-desc">{data.summary.publishedJourneys} published</div>
		</div>

		<div class="stat bg-base-100 shadow rounded-lg">
			<div class="stat-figure text-secondary">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
				</svg>
			</div>
			<div class="stat-title">Total Users</div>
			<div class="stat-value text-secondary">{data.summary.totalUsers}</div>
			<div class="stat-desc">Across all journeys</div>
		</div>

		<div class="stat bg-base-100 shadow rounded-lg">
			<div class="stat-figure text-accent">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
				</svg>
			</div>
			<div class="stat-title">Avg Completion</div>
			<div class="stat-value text-accent">{data.summary.avgCompletion}%</div>
			<div class="stat-desc">User progress</div>
		</div>

		<div class="stat bg-base-100 shadow rounded-lg">
			<div class="stat-figure text-success">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
				</svg>
			</div>
			<div class="stat-title">Avg Score</div>
			<div class="stat-value text-success">{data.summary.avgScore}</div>
			<div class="stat-desc">Out of 100 points</div>
		</div>
	</div>

	<!-- Journey List -->
	<div class="mb-8">
		<h2 class="text-2xl font-bold mb-4">Your Journeys</h2>

		{#if data.journeys.length === 0}
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body text-center py-12">
					<div class="text-6xl mb-4">🎯</div>
					<h3 class="text-2xl font-bold mb-2">No Journeys Yet</h3>
					<p class="text-base-content/70 mb-4">
						Create your first journey to help users navigate their life transitions
					</p>
					<a href="/admin/journeys" class="btn btn-primary">
						Create Your First Journey
					</a>
				</div>
			</div>
		{:else}
			<div class="grid gap-6">
				{#each data.journeys as journey}
					{@const analytics = data.analytics.get(journey.id) || []}
					{@const latestUsers = getLatestMetric(journey.id, 'total_users')}
					{@const latestCompletion = getLatestMetric(journey.id, 'avg_completion_percentage')}
					{@const latestScore = getLatestMetric(journey.id, 'avg_score')}
					{@const userTrend = calculateTrend(analytics, 'total_users')}

					<div class="card bg-base-100 shadow-xl">
						<div class="card-body">
							<div class="flex justify-between items-start mb-4">
								<div class="flex gap-4 items-start flex-1">
									<div class="text-4xl">{journey.icon || '🎯'}</div>
									<div class="flex-1">
										<div class="flex items-center gap-2 mb-2">
											<h3 class="card-title text-2xl">{journey.name}</h3>
											{#if journey.is_published}
												<div class="badge badge-success">Published</div>
											{:else}
												<div class="badge badge-warning">Draft</div>
											{/if}
											{#if journey.is_featured}
												<div class="badge badge-info">⭐ Featured</div>
											{/if}
										</div>
										<p class="text-base-content/70 mb-3">
											{journey.description || 'No description'}
										</p>

										<!-- Analytics Summary -->
										<div class="grid grid-cols-3 gap-4 mt-4">
											<div>
												<div class="text-sm text-base-content/60">Users</div>
												<div class="text-2xl font-bold">{latestUsers}</div>
												{#if analytics.length > 1}
													<div class="text-sm" class:text-success={parseFloat(userTrend) > 0} class:text-error={parseFloat(userTrend) < 0}>
														{userTrend}%
													</div>
												{/if}
											</div>
											<div>
												<div class="text-sm text-base-content/60">Completion</div>
												<div class="text-2xl font-bold">{Math.round(latestCompletion)}%</div>
											</div>
											<div>
												<div class="text-sm text-base-content/60">Avg Score</div>
												<div class="text-2xl font-bold">{Math.round(latestScore)}</div>
											</div>
										</div>
									</div>
								</div>

								<div class="flex flex-col gap-2">
									<a
										href="/creator/journeys/{journey.id}/analytics"
										class="btn btn-sm btn-primary"
									>
										📊 Analytics
									</a>
									<a
										href="/admin/journeys/{journey.id}/edit"
										class="btn btn-sm btn-outline"
									>
										✏️ Edit
									</a>
									<a
										href="/journeys/{journey.slug}"
										class="btn btn-sm btn-ghost"
										target="_blank"
									>
										👁️ Preview
									</a>
								</div>
							</div>

							<!-- Recent Activity Chart (Sparkline) -->
							{#if analytics.length > 0}
								<div class="mt-4 pt-4 border-t border-base-300">
									<div class="text-sm text-base-content/60 mb-2">Last 30 Days Activity</div>
									<div class="flex items-end gap-1 h-16">
										{#each analytics.reverse() as day}
											<div
												class="flex-1 bg-primary rounded-t transition-all hover:bg-primary-focus"
												style="height: {(day.active_users / Math.max(...analytics.map(a => a.active_users), 1)) * 100}%"
												title="{day.metric_date}: {day.active_users} active users"
											></div>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Quick Actions -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<a href="/admin/journeys" class="card bg-primary text-primary-content shadow-xl hover:shadow-2xl transition-shadow">
			<div class="card-body text-center">
				<div class="text-4xl mb-2">➕</div>
				<h3 class="card-title justify-center">Create Journey</h3>
				<p>Build a new journey for your users</p>
			</div>
		</a>

		<a href="/creator/analytics" class="card bg-secondary text-secondary-content shadow-xl hover:shadow-2xl transition-shadow">
			<div class="card-body text-center">
				<div class="text-4xl mb-2">📊</div>
				<h3 class="card-title justify-center">View Analytics</h3>
				<p>Deep dive into your journey metrics</p>
			</div>
		</a>

		<a href="/creator/community" class="card bg-accent text-accent-content shadow-xl hover:shadow-2xl transition-shadow">
			<div class="card-body text-center">
				<div class="text-4xl mb-2">👥</div>
				<h3 class="card-title justify-center">Community</h3>
				<p>Connect with other creators</p>
			</div>
		</a>
	</div>
</div>

<style>
	.stat {
		padding: 1.5rem;
	}

	.sparkline-bar {
		min-width: 4px;
	}
</style>
