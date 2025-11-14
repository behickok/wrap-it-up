<script lang="ts">
	/**
	 * Performance Dashboard UI
	 * Phase 8: Display performance metrics and monitoring data
	 */

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Format numbers
	function formatNumber(num: number): string {
		return new Intl.NumberFormat().format(Math.round(num));
	}

	// Format milliseconds
	function formatMs(ms: number): string {
		return `${Math.round(ms)}ms`;
	}

	// Format percentage
	function formatPercent(value: number): string {
		return `${Math.round(value * 100)}%`;
	}

	// Get rating color
	function getRatingColor(rating: string): string {
		switch (rating) {
			case 'good':
				return 'success';
			case 'needs-improvement':
				return 'warning';
			case 'poor':
				return 'error';
			default:
				return 'neutral';
		}
	}

	// Format date/time
	function formatDateTime(dateStr: string): string {
		return new Date(dateStr).toLocaleString();
	}
</script>

<div class="container mx-auto p-6 max-w-7xl">
	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-2">Performance Dashboard</h1>
		<p class="text-base-content/70">Monitor platform performance, caching, and system health</p>
	</div>

	<!-- Platform Stats Overview -->
	{#if data.platformStats}
		<div class="stats shadow mb-6 w-full">
			<div class="stat">
				<div class="stat-title">Total Users</div>
				<div class="stat-value text-primary">{formatNumber(data.platformStats.total_users)}</div>
				<div class="stat-desc">{formatNumber(data.platformStats.active_users)} active today</div>
			</div>

			<div class="stat">
				<div class="stat-title">Total Journeys</div>
				<div class="stat-value text-secondary">
					{formatNumber(data.platformStats.total_journeys)}
				</div>
				<div class="stat-desc">
					{formatNumber(data.platformStats.active_journeys)} with enrollments
				</div>
			</div>

			<div class="stat">
				<div class="stat-title">Reviews</div>
				<div class="stat-value">{formatNumber(data.platformStats.total_reviews)}</div>
				<div class="stat-desc">
					{formatNumber(data.platformStats.completed_reviews)} completed today
				</div>
			</div>

			<div class="stat">
				<div class="stat-title">Avg Review Time</div>
				<div class="stat-value text-accent">
					{data.platformStats.avg_review_time_hours
						? Math.round(data.platformStats.avg_review_time_hours)
						: 0}h
				</div>
				<div class="stat-desc">From claim to completion</div>
			</div>
		</div>
	{/if}

	<!-- Core Web Vitals -->
	<div class="card bg-base-100 shadow-xl mb-6">
		<div class="card-body">
			<h2 class="card-title">Core Web Vitals (Last 7 Days)</h2>

			{#if Object.keys(data.webVitalsScores).length > 0}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each Object.entries(data.webVitalsScores) as [metric, score]}
						<div class="stat bg-base-200 rounded-lg">
							<div class="stat-title">{metric}</div>
							<div class="stat-value text-{getRatingColor(score.rating)}">
								{metric === 'CLS' ? score.value.toFixed(3) : formatMs(score.value)}
							</div>
							<div class="stat-desc">
								<span class="badge badge-{getRatingColor(score.rating)} badge-sm mr-2">
									{score.rating}
								</span>
								{formatNumber(score.sampleCount)} samples
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="alert alert-info">
					<span>No web vitals data yet. Vitals are tracked automatically as users browse.</span>
				</div>
			{/if}

			<div class="text-sm text-base-content/60 mt-4">
				<strong>Thresholds:</strong> LCP &lt; 2.5s, FID &lt; 100ms, CLS &lt; 0.1, FCP &lt; 1.8s,
				TTFB &lt; 800ms
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
		<!-- Cache Performance -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">Cache Performance</h2>

				{#if data.cacheMetrics && data.cacheMetrics.length > 0}
					<div class="overflow-x-auto">
						<table class="table table-sm">
							<thead>
								<tr>
									<th>Cache Type</th>
									<th>Entries</th>
									<th>Active</th>
									<th>Avg Accesses</th>
								</tr>
							</thead>
							<tbody>
								{#each data.cacheMetrics as metric}
									<tr>
										<td class="font-mono">{metric.cache_type}</td>
										<td>{formatNumber(metric.total_entries)}</td>
										<td>{formatNumber(metric.active_entries)}</td>
										<td>{Math.round(metric.avg_accesses)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<div class="alert alert-info">
						<span>No cache data yet.</span>
					</div>
				{/if}

				{#if data.cachePerformance && data.cachePerformance.length > 0}
					<div class="divider">Hit Rate (Last 7 Days)</div>
					<div class="space-y-2">
						{#each data.cachePerformance.slice(0, 5) as perf}
							<div>
								<div class="flex justify-between text-sm mb-1">
									<span class="font-mono">{perf.cache_type}</span>
									<span>{formatPercent(perf.hit_rate || 0)}</span>
								</div>
								<progress
									class="progress progress-success w-full"
									value={perf.hit_rate * 100}
									max="100"
								></progress>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Job Queue Health -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">Background Jobs (Last 7 Days)</h2>

				{#if data.jobQueueHealth && data.jobQueueHealth.length > 0}
					<div class="overflow-x-auto">
						<table class="table table-sm">
							<thead>
								<tr>
									<th>Job Type</th>
									<th>Total</th>
									<th>Pending</th>
									<th>Completed</th>
									<th>Failed</th>
								</tr>
							</thead>
							<tbody>
								{#each data.jobQueueHealth as job}
									<tr>
										<td class="font-mono text-xs">{job.job_type}</td>
										<td>{formatNumber(job.total_jobs)}</td>
										<td>
											{#if job.pending > 0}
												<span class="badge badge-warning badge-sm">{job.pending}</span>
											{:else}
												0
											{/if}
										</td>
										<td>{formatNumber(job.completed)}</td>
										<td>
											{#if job.failed > 0}
												<span class="badge badge-error badge-sm">{job.failed}</span>
											{:else}
												0
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<div class="alert alert-info">
						<span>No background jobs executed yet.</span>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Slow Queries -->
	<div class="card bg-base-100 shadow-xl mb-6">
		<div class="card-body">
			<h2 class="card-title">Slow Queries (&gt; 100ms, Last 7 Days)</h2>

			{#if data.slowQueries && data.slowQueries.length > 0}
				<div class="overflow-x-auto">
					<table class="table table-sm">
						<thead>
							<tr>
								<th>Query Name</th>
								<th>Executions</th>
								<th>Avg Time</th>
								<th>Max Time</th>
								<th>Avg Rows</th>
							</tr>
						</thead>
						<tbody>
							{#each data.slowQueries as query}
								<tr>
									<td class="font-mono text-xs">{query.query_name}</td>
									<td>{formatNumber(query.execution_count)}</td>
									<td>
										<span class="badge badge-warning">{formatMs(query.avg_time_ms)}</span>
									</td>
									<td>
										<span class="badge badge-error">{formatMs(query.max_time_ms)}</span>
									</td>
									<td>{query.avg_rows ? Math.round(query.avg_rows) : 'N/A'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="alert alert-success">
					<span>No slow queries detected! All queries are performing well.</span>
				</div>
			{/if}
		</div>
	</div>

	<!-- API Performance -->
	<div class="card bg-base-100 shadow-xl mb-6">
		<div class="card-body">
			<h2 class="card-title">API Performance (Last 7 Days)</h2>

			{#if data.apiPerformance && data.apiPerformance.length > 0}
				<div class="overflow-x-auto">
					<table class="table table-sm">
						<thead>
							<tr>
								<th>Endpoint</th>
								<th>Method</th>
								<th>Requests</th>
								<th>Avg Time</th>
								<th>Error Rate</th>
							</tr>
						</thead>
						<tbody>
							{#each data.apiPerformance as api}
								<tr>
									<td class="font-mono text-xs">{api.endpoint}</td>
									<td><span class="badge badge-sm">{api.method}</span></td>
									<td>{formatNumber(api.request_count)}</td>
									<td>{formatMs(api.avg_response_time)}</td>
									<td>
										{#if api.error_rate > 5}
											<span class="badge badge-error">{formatPercent(api.error_rate / 100)}</span>
										{:else if api.error_rate > 1}
											<span class="badge badge-warning">{formatPercent(api.error_rate / 100)}</span>
										{:else}
											<span class="badge badge-success">{formatPercent(api.error_rate / 100)}</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="alert alert-info">
					<span>No API performance data yet.</span>
				</div>
			{/if}
		</div>
	</div>

	<!-- Database Stats -->
	{#if data.dbStats}
		<div class="card bg-base-100 shadow-xl mb-6">
			<div class="card-body">
				<h2 class="card-title">Database Statistics</h2>

				<div class="stats shadow">
					<div class="stat">
						<div class="stat-title">Analytics Events</div>
						<div class="stat-value text-sm">{formatNumber(data.dbStats.total_events)}</div>
					</div>

					<div class="stat">
						<div class="stat-title">Query Logs</div>
						<div class="stat-value text-sm">{formatNumber(data.dbStats.total_query_logs)}</div>
					</div>

					<div class="stat">
						<div class="stat-title">Web Vitals</div>
						<div class="stat-value text-sm">{formatNumber(data.dbStats.total_web_vitals)}</div>
					</div>

					<div class="stat">
						<div class="stat-title">Cache Entries</div>
						<div class="stat-value text-sm">{formatNumber(data.dbStats.total_cache_entries)}</div>
					</div>

					<div class="stat">
						<div class="stat-title">Background Jobs</div>
						<div class="stat-value text-sm">{formatNumber(data.dbStats.total_jobs)}</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Recent Slow Query Logs -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">Recent Slow Queries (Last 24 Hours)</h2>

			{#if data.recentQueryLogs && data.recentQueryLogs.length > 0}
				<div class="overflow-x-auto">
					<table class="table table-xs">
						<thead>
							<tr>
								<th>Time</th>
								<th>Query</th>
								<th>Duration</th>
								<th>Rows</th>
								<th>Endpoint</th>
							</tr>
						</thead>
						<tbody>
							{#each data.recentQueryLogs.slice(0, 20) as log}
								<tr>
									<td class="text-xs">{formatDateTime(log.recorded_at)}</td>
									<td class="font-mono text-xs max-w-md truncate">{log.query_name}</td>
									<td>
										<span
											class="badge badge-{log.execution_time_ms > 500
												? 'error'
												: 'warning'} badge-sm"
										>
											{formatMs(log.execution_time_ms)}
										</span>
									</td>
									<td>{log.row_count || 'N/A'}</td>
									<td class="text-xs">{log.endpoint || 'N/A'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="alert alert-success">
					<span>No slow queries in the last 24 hours!</span>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.stat-value {
		font-size: 1.5rem;
	}

	@media (min-width: 1024px) {
		.stat-value {
			font-size: 2rem;
		}
	}
</style>
