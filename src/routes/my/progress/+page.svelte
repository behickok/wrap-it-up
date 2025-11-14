<script lang="ts">
	/**
	 * User Progress Dashboard
	 * Visualize learning journey and achievements
	 */

	import type { PageData } from './$types';
	import LineChart from '$lib/components/charts/LineChart.svelte';

	let { data }: { data: PageData } = $props();

	// Format numbers
	function formatNumber(num: number): string {
		return num.toLocaleString();
	}

	// Format date
	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	// Format relative time
	function formatRelativeTime(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

		if (diffInDays === 0) return 'Today';
		if (diffInDays === 1) return 'Yesterday';
		if (diffInDays < 7) return `${diffInDays} days ago`;
		if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
		return formatDate(dateString);
	}

	// Get status badge class
	function getStatusBadge(status: string) {
		switch (status) {
			case 'completed':
				return 'badge-success';
			case 'in_progress':
				return 'badge-warning';
			default:
				return 'badge-ghost';
		}
	}

	// Prepare activity chart data (last 30 days)
	const activityChartData = $derived(() => {
		// Fill in missing days with 0
		const chartData: { date: string; value: number }[] = [];
		const activityMap = new Map(
			data.recentActivity.map((a: any) => [a.activity_date, a.event_count])
		);

		for (let i = 29; i >= 0; i--) {
			const date = new Date();
			date.setDate(date.getDate() - i);
			const dateStr = date.toISOString().split('T')[0];
			chartData.push({
				date: dateStr,
				value: activityMap.get(dateStr) || 0
			});
		}

		return chartData;
	});

	// Get streak status
	const streakStatus = $derived(() => {
		if (!data.activityStreak.last_activity_date) {
			return { active: false, message: 'Start your streak today!' };
		}

		const lastDate = new Date(data.activityStreak.last_activity_date);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		lastDate.setHours(0, 0, 0, 0);

		const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

		if (diffDays === 0) {
			return { active: true, message: "Keep it up! You're on fire! 🔥" };
		} else if (diffDays === 1) {
			return { active: false, message: 'Your streak ended yesterday. Start a new one!' };
		} else {
			return { active: false, message: 'Start a new streak today!' };
		}
	});
</script>

<svelte:head>
	<title>My Progress - Wrap It Up</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-4xl font-bold mb-2">Your Learning Progress</h1>
		<p class="text-xl text-base-content/70">Track your achievements and keep learning!</p>
	</div>

	<!-- Overall Stats -->
	<div class="stats shadow w-full mb-8">
		<div class="stat">
			<div class="stat-figure text-primary">🎯</div>
			<div class="stat-title">Overall Progress</div>
			<div class="stat-value text-primary">{data.stats.overallCompletion}%</div>
			<div class="stat-desc">
				{data.stats.completedSections} of {data.stats.totalSections} sections complete
			</div>
		</div>

		<div class="stat">
			<div class="stat-figure text-secondary">📚</div>
			<div class="stat-title">Journeys</div>
			<div class="stat-value text-secondary">{data.stats.totalJourneys}</div>
			<div class="stat-desc">
				{data.stats.completedJourneys} completed, {data.stats.inProgressJourneys} in progress
			</div>
		</div>

		<div class="stat">
			<div class="stat-figure text-accent">🏆</div>
			<div class="stat-title">Milestones</div>
			<div class="stat-value text-accent">{data.activitySummary.total_milestones}</div>
			<div class="stat-desc">Achievements earned</div>
		</div>

		<div class="stat">
			<div class="stat-figure text-warning">🔥</div>
			<div class="stat-title">Current Streak</div>
			<div class="stat-value text-warning">{data.activityStreak.current_streak}</div>
			<div class="stat-desc">
				Longest: {data.activityStreak.longest_streak} day{data.activityStreak.longest_streak === 1
					? ''
					: 's'}
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Main Content -->
		<div class="lg:col-span-2 space-y-6">
			<!-- Activity Chart -->
			<div class="card bg-base-100 shadow">
				<div class="card-body">
					<h2 class="card-title">Activity (Last 30 Days)</h2>
					<p class="text-sm text-base-content/70 mb-4">
						{streakStatus().message}
					</p>

					{#if activityChartData().length > 0}
						<div class="h-48">
							<LineChart
								data={activityChartData()}
								xLabel="Date"
								yLabel="Actions"
								color="oklch(var(--wa))"
							/>
						</div>
					{:else}
						<div class="text-center py-8 text-base-content/50">
							<p>No activity yet. Start learning to build your streak!</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Journey Progress -->
			<div class="card bg-base-100 shadow">
				<div class="card-body">
					<h2 class="card-title">Your Journeys</h2>

					{#if data.journeyProgress.length > 0}
						<div class="space-y-4">
							{#each data.journeyProgress as journey}
								<div class="card bg-base-200">
									<div class="card-body p-4">
										<div class="flex items-start justify-between mb-2">
											<div class="flex-1">
												<h3 class="font-bold text-lg">
													<a href="/journeys/{journey.journey_slug}" class="link link-hover">
														{journey.journey_name}
													</a>
												</h3>
												<div class="flex items-center gap-2 mt-1">
													<span class="badge {getStatusBadge(journey.status)}">
														{journey.status.replace('_', ' ')}
													</span>
													<span class="text-sm text-base-content/60">
														Enrolled {formatRelativeTime(journey.enrolled_at)}
													</span>
												</div>
											</div>
										</div>

										<!-- Progress Bar -->
										<div class="mb-2">
											<div class="flex items-center justify-between text-sm mb-1">
												<span>{journey.completed_sections} of {journey.total_sections} sections</span>
												<span class="font-semibold">
													{Math.round(journey.completion_percentage || 0)}%
												</span>
											</div>
											<progress
												class="progress progress-primary w-full"
												value={journey.completion_percentage || 0}
												max="100"
											></progress>
										</div>

										{#if journey.completed_at}
											<div class="text-sm text-success">
												✅ Completed {formatDate(journey.completed_at)}
											</div>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="text-center py-12 text-base-content/50">
							<p class="text-lg mb-2">No journeys yet</p>
							<p class="text-sm">Start your learning journey today!</p>
							<a href="/journeys" class="btn btn-primary mt-4"> Browse Journeys </a>
						</div>
					{/if}
				</div>
			</div>

			<!-- Certificates -->
			{#if data.certificates.length > 0}
				<div class="card bg-base-100 shadow">
					<div class="card-body">
						<h2 class="card-title">Your Certificates</h2>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							{#each data.certificates as cert}
								<div class="card bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary">
									<div class="card-body p-4">
										<div class="flex items-center gap-2 mb-2">
											<span class="text-2xl">🎓</span>
											<h3 class="font-bold">{cert.journey_name}</h3>
										</div>
										<p class="text-sm text-base-content/70">
											Completed in {cert.completion_time_days} day{cert.completion_time_days === 1
												? ''
												: 's'}
										</p>
										<p class="text-sm text-base-content/70">Issued: {formatDate(cert.issue_date)}</p>
										<div class="card-actions justify-end mt-2">
											<a href="/certificates/{cert.certificate_id}" class="btn btn-primary btn-sm">
												View Certificate
											</a>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Sidebar -->
		<div class="lg:col-span-1 space-y-6">
			<!-- Recent Milestones -->
			<div class="card bg-base-100 shadow">
				<div class="card-body">
					<h2 class="card-title">Recent Milestones</h2>

					{#if data.milestones.length > 0}
						<div class="space-y-3 max-h-96 overflow-y-auto">
							{#each data.milestones as milestone}
								<div
									class="p-3 rounded-lg border-l-4"
									style="border-color: {milestone.color || '#666'}"
								>
									<div class="flex items-start gap-3">
										<span class="text-2xl">{milestone.icon || '🏆'}</span>
										<div class="flex-1 min-w-0">
											<h4 class="font-semibold text-sm">{milestone.milestone_name}</h4>
											{#if milestone.milestone_description}
												<p class="text-xs text-base-content/70 mb-1">
													{milestone.milestone_description}
												</p>
											{/if}
											<p class="text-xs text-base-content/50">
												{formatRelativeTime(milestone.achieved_at)}
											</p>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="text-center py-8 text-base-content/50">
							<p class="text-sm">No milestones yet</p>
							<p class="text-xs mt-1">Keep learning to earn achievements!</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Stats Card -->
			<div class="card bg-gradient-to-br from-primary/10 to-secondary/10">
				<div class="card-body">
					<h3 class="font-semibold mb-3">Your Stats</h3>
					<div class="stats stats-vertical shadow-sm bg-base-100">
						<div class="stat p-4">
							<div class="stat-title text-xs">Total Active Days</div>
							<div class="stat-value text-2xl">{data.activityStreak.total_active_days}</div>
						</div>
						<div class="stat p-4">
							<div class="stat-title text-xs">Learning Streak</div>
							<div class="stat-value text-2xl">
								{data.activityStreak.current_streak} 🔥
							</div>
							<div class="stat-desc text-xs">
								Best: {data.activityStreak.longest_streak} days
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Motivational Card -->
			<div class="card bg-accent text-accent-content">
				<div class="card-body text-center">
					<h3 class="font-bold text-lg mb-2">Keep Going!</h3>
					<p class="text-sm">
						{#if data.stats.inProgressJourneys > 0}
							You have {data.stats.inProgressJourneys} journey{data.stats.inProgressJourneys === 1
								? ''
								: 's'} in progress. Keep up the great work!
						{:else if data.stats.completedJourneys > 0}
							Amazing job completing {data.stats.completedJourneys} journey{data.stats
								.completedJourneys === 1
								? ''
								: 's'}! Ready for your next challenge?
						{:else}
							Start your first journey today and begin your learning adventure!
						{/if}
					</p>
					{#if data.stats.inProgressJourneys === 0}
						<a href="/journeys" class="btn btn-secondary btn-sm mt-2"> Browse Journeys </a>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>