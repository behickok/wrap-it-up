<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Format date
	function formatDate(dateStr: string | null): string {
		if (!dateStr) return 'N/A';
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Get progress status
	function getProgressStatus(percentage: number): { text: string; class: string } {
		if (percentage === 0) return { text: 'Not Started', class: 'badge-ghost' };
		if (percentage === 100) return { text: 'Completed', class: 'badge-success' };
		return { text: 'In Progress', class: 'badge-warning' };
	}

	// Get progress bar color
	function getProgressColor(percentage: number): string {
		if (percentage === 0) return 'bg-base-300';
		if (percentage < 30) return 'bg-error';
		if (percentage < 70) return 'bg-warning';
		return 'bg-success';
	}
</script>

<svelte:head>
	<title>My Journeys - Wrap It Up</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-4xl font-bold mb-2">My Journeys</h1>
		<p class="text-base-content/70">Track your progress across all enrolled journeys</p>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
		<div class="stat bg-base-100 shadow rounded-lg">
			<div class="stat-title">Total Journeys</div>
			<div class="stat-value text-primary">{data.stats.total}</div>
		</div>

		<div class="stat bg-base-100 shadow rounded-lg">
			<div class="stat-title">In Progress</div>
			<div class="stat-value text-warning">{data.stats.inProgress}</div>
		</div>

		<div class="stat bg-base-100 shadow rounded-lg">
			<div class="stat-title">Not Started</div>
			<div class="stat-value text-base-content">{data.stats.notStarted}</div>
		</div>

		<div class="stat bg-base-100 shadow rounded-lg">
			<div class="stat-title">Completed</div>
			<div class="stat-value text-success">{data.stats.completed}</div>
		</div>
	</div>

	<!-- Journeys List -->
	{#if data.journeys.length === 0}
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body text-center py-12">
				<div class="text-6xl mb-4">🎯</div>
				<h2 class="text-2xl font-bold mb-2">No Journeys Yet</h2>
				<p class="text-base-content/70 mb-6">
					Browse the marketplace to find and enroll in journeys
				</p>
				<a href="/marketplace" class="btn btn-primary">
					Browse Marketplace
				</a>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each data.journeys as journey}
				{@const status = getProgressStatus(journey.progressPercentage)}
				<div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
					<div class="card-body">
						<!-- Journey Header -->
						<div class="flex items-start gap-3 mb-3">
							<div class="text-4xl">{journey.icon || '🎯'}</div>
							<div class="flex-1">
								<h3 class="card-title text-lg">
									{journey.name}
									{#if journey.is_featured}
										<div class="badge badge-primary badge-sm">Featured</div>
									{/if}
								</h3>
								<p class="text-sm text-base-content/70">
									by {journey.creator_username}
								</p>
							</div>
						</div>

						<!-- Description -->
						{#if journey.description}
							<p class="text-sm text-base-content/70 mb-3 line-clamp-2">
								{journey.description}
							</p>
						{/if}

						<!-- Status Badge -->
						<div class="flex items-center gap-2 mb-3">
							<div class="badge {status.class}">{status.text}</div>
							<div class="badge badge-outline">{journey.tier_name}</div>
						</div>

						<!-- Progress Bar -->
						<div class="mb-3">
							<div class="flex justify-between text-xs mb-1">
								<span class="text-base-content/70">Progress</span>
								<span class="font-bold">{journey.progressPercentage}%</span>
							</div>
							<div class="w-full bg-base-300 rounded-full h-2">
								<div
									class="{getProgressColor(journey.progressPercentage)} h-2 rounded-full transition-all"
									style="width: {journey.progressPercentage}%"
								></div>
							</div>
							<div class="text-xs text-base-content/70 mt-1">
								{journey.completedSections} of {journey.totalSections} sections completed
							</div>
						</div>

						<!-- Metadata -->
						<div class="text-xs text-base-content/60 mb-4">
							<div>Started: {formatDate(journey.started_at)}</div>
							{#if journey.completed_at}
								<div>Completed: {formatDate(journey.completed_at)}</div>
							{/if}
						</div>

						<!-- Actions -->
						<div class="card-actions">
							<a
								href="/journeys/{journey.slug}/dashboard"
								class="btn btn-primary btn-block btn-sm"
							>
								{journey.progressPercentage === 0 ? 'Start Journey' : journey.progressPercentage === 100 ? 'View Journey' : 'Continue Journey'}
							</a>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Browse More -->
		<div class="text-center mt-8">
			<a href="/marketplace" class="btn btn-outline">
				Browse More Journeys
			</a>
		</div>
	{/if}
</div>
