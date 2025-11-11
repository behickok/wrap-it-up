<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.journey.name} Dashboard - Wrap It Up</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-7xl">
	<!-- Journey Header -->
	<div class="flex items-center justify-between mb-8">
		<div class="flex items-center gap-4">
			<div class="text-5xl">{data.journey.icon || '📋'}</div>
			<div>
				<h1 class="text-3xl font-bold">{data.journey.name}</h1>
				<p class="text-sm text-base-content/70">
					{data.subscription.tier_name} Plan
				</p>
			</div>
		</div>

		<a href="/journeys" class="btn btn-ghost btn-sm">
			← All Journeys
		</a>
	</div>

	<!-- Progress Overview -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
		<div class="card bg-base-200">
			<div class="card-body">
				<h3 class="card-title text-lg">Overall Progress</h3>
				<div class="text-4xl font-bold">{data.completionPercentage}%</div>
				<progress class="progress progress-primary w-full" value={data.completionPercentage} max="100"></progress>
			</div>
		</div>

		<div class="card bg-base-200">
			<div class="card-body">
				<h3 class="card-title text-lg">Sections Complete</h3>
				<div class="text-4xl font-bold">{data.sectionsCompleted}/{data.sectionsTotal}</div>
				<p class="text-sm text-base-content/70">Keep going!</p>
			</div>
		</div>

		<div class="card bg-base-200">
			<div class="card-body">
				<h3 class="card-title text-lg">Your Plan</h3>
				<div class="badge badge-primary badge-lg">{data.subscription.tier_name}</div>
				{#if data.subscription.tier_slug === 'essentials'}
					<a href="/journeys/{data.journey.slug}" class="text-sm link link-primary mt-2">
						Upgrade plan
					</a>
				{/if}
			</div>
		</div>
	</div>

	<!-- Coming Soon Notice -->
	<div class="alert alert-info mb-8">
		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
		</svg>
		<div>
			<h3 class="font-bold">Journey Dashboard Coming Soon!</h3>
			<div class="text-sm">
				We're building out the full dashboard experience for this journey. In the meantime,
				{#if data.journey.slug === 'care'}
					you can access your Care Journey through the <a href="/" class="link font-semibold">legacy dashboard</a>.
				{:else}
					check back soon for updates!
				{/if}
			</div>
		</div>
	</div>

	<!-- Tier-Specific Features Info -->
	<div class="card bg-base-100 shadow-md">
		<div class="card-body">
			<h2 class="card-title">Your {data.subscription.tier_name} Plan Includes:</h2>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
				{#if data.subscription.tier_slug === 'essentials' || data.subscription.tier_slug === 'guided' || data.subscription.tier_slug === 'premium'}
					<div class="flex items-start gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						<span>Full access to all forms and checklists</span>
					</div>
					<div class="flex items-start gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						<span>AI-powered assistance</span>
					</div>
					<div class="flex items-start gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						<span>Progress tracking</span>
					</div>
					<div class="flex items-start gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						<span>PDF export</span>
					</div>
				{/if}

				{#if data.subscription.tier_slug === 'guided' || data.subscription.tier_slug === 'premium'}
					<div class="flex items-start gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						<div>
							<span>Expert review & feedback</span>
							<div class="badge badge-warning badge-xs ml-2">Coming Soon</div>
						</div>
					</div>
					<div class="flex items-start gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						<div>
							<span>Email notifications</span>
							<div class="badge badge-warning badge-xs ml-2">Coming Soon</div>
						</div>
					</div>
				{/if}

				{#if data.subscription.tier_slug === 'premium'}
					<div class="flex items-start gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						<div>
							<span>1-on-1 guide sessions</span>
							<div class="badge badge-warning badge-xs ml-2">Coming Soon</div>
						</div>
					</div>
					<div class="flex items-start gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						<div>
							<span>Priority support</span>
							<div class="badge badge-warning badge-xs ml-2">Coming Soon</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
