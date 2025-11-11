<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const { journeys, subscribedJourneyIds } = data;

	function isSubscribed(journeyId: number): boolean {
		return subscribedJourneyIds.includes(journeyId);
	}
</script>

<svelte:head>
	<title>Journey Library - Wrap It Up</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-7xl">
	<div class="mb-8">
		<h1 class="text-4xl font-bold mb-2">Your Journey Library</h1>
		<p class="text-lg text-base-content/70">
			Choose a journey that matches your life transition. Each journey provides guided steps,
			expert resources, and tools to help you prepare.
		</p>
	</div>

	{#if data.userJourneys.length > 0}
		<div class="alert alert-info mb-8">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
			</svg>
			<span>You have {data.userJourneys.length} active {data.userJourneys.length === 1 ? 'journey' : 'journeys'}</span>
		</div>
	{/if}

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{#each journeys as journey}
			<div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
				<div class="card-body">
					<div class="flex items-start justify-between mb-2">
						<div class="text-5xl">{journey.icon || '📋'}</div>
						{#if isSubscribed(journey.id)}
							<div class="badge badge-success gap-2">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-4 h-4 stroke-current">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
								</svg>
								Active
							</div>
						{/if}
					</div>

					<h2 class="card-title text-2xl mb-2">{journey.name}</h2>
					<p class="text-base-content/70 flex-grow">
						{journey.description || 'Comprehensive planning and preparation for this life transition.'}
					</p>

					<div class="card-actions justify-end mt-4">
						{#if isSubscribed(journey.id)}
							<a href="/journeys/{journey.slug}/dashboard" class="btn btn-primary btn-sm">
								Continue Journey
							</a>
						{:else}
							<a href="/journeys/{journey.slug}" class="btn btn-outline btn-sm">
								Learn More
							</a>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>

	{#if journeys.length === 0}
		<div class="alert alert-warning">
			<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
			</svg>
			<span>No journeys available at this time.</span>
		</div>
	{/if}
</div>

<style>
	.card:hover {
		transform: translateY(-2px);
		transition: transform 0.2s ease-in-out;
	}
</style>
