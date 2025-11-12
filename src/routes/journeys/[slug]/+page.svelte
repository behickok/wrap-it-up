<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

let { data }: { data: PageData } = $props();
const comingSoon = !['wedding', 'care'].includes(data.journey.slug);

	let selectedTierId = $state(data.tiers[0]?.id || 1);
	let isSubmitting = $state(false);

	function formatPrice(monthly: number, annual: number): string {
		if (monthly === 0) return 'Free';
		return `$${monthly}/mo`;
	}

	function getTierColor(index: number): string {
		const colors = ['info', 'primary', 'secondary'];
		return colors[index] || 'neutral';
	}

	function handleTierSelect(tierId: number) {
		selectedTierId = tierId;
	}
</script>

<svelte:head>
	<title>{data.journey.name} - Wrap It Up</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-7xl">
	<!-- Journey Header -->
	<div class="mb-8">
		<div class="flex items-center gap-4 mb-4">
			<div class="text-6xl">{data.journey.icon || '📋'}</div>
			<div>
				<h1 class="text-4xl font-bold">{data.journey.name}</h1>
				<p class="text-lg text-base-content/70 mt-2">
					{data.journey.description || 'Comprehensive planning and preparation for this life transition.'}
				</p>
				{#if comingSoon}
					<div class={`badge mt-3 ${data.isSubscribed ? 'badge-info' : 'badge-warning'}`}>
						{data.isSubscribed ? 'Limited access' : 'Coming soon'}
					</div>
				{/if}
			</div>
		</div>

		{#if data.isSubscribed}
			<div class="alert alert-success">
				<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<span>You're currently on the <strong>{data.existingSubscription.tier_name}</strong> plan</span>
				<div>
					<a href="/journeys/{data.journey.slug}/dashboard" class="btn btn-sm btn-ghost">
						Go to Dashboard
					</a>
				</div>
			</div>
		{/if}
	</div>

	{#if !data.isSubscribed}
		{#if comingSoon}
			<div class="alert alert-warning mb-12">
				<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<div>
					<h3 class="font-bold">This journey is coming soon!</h3>
					<p>We're still polishing the experience. Existing subscribers will keep access, but new enrollments are paused.</p>
				</div>
			</div>
		{:else}
		<!-- Service Tier Selection -->
		<div class="mb-12">
			<h2 class="text-3xl font-bold mb-4 text-center">Choose Your Plan</h2>
			<p class="text-center text-base-content/70 mb-8 max-w-2xl mx-auto">
				Select the level of support that's right for you. You can always upgrade later.
			</p>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				{#each data.tiers as tier, index}
					{@const isSelected = selectedTierId === tier.id}
					{@const colorClass = getTierColor(index)}
					<div
						class="card bg-base-100 border-2 transition-all cursor-pointer hover:shadow-xl"
						class:border-primary={isSelected}
						class:shadow-xl={isSelected}
						onclick={() => handleTierSelect(tier.id)}
						role="button"
						tabindex="0"
					>
						<div class="card-body">
							<div class="badge badge-{colorClass} mb-2">{tier.name}</div>
							<div class="text-3xl font-bold mb-2">
								{formatPrice(tier.price_monthly, tier.price_annual)}
							</div>
							{#if tier.price_annual > 0}
								<div class="text-sm text-base-content/60 mb-4">
									${tier.price_annual}/year (save ${tier.price_monthly * 12 - tier.price_annual})
								</div>
							{:else}
								<div class="text-sm text-base-content/60 mb-4">
									{tier.description}
								</div>
							{/if}

							<ul class="space-y-2 mb-4">
								{#each tier.features as feature}
									<li class="flex items-start gap-2">
										<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-success shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
										</svg>
										<span class="text-sm">{feature}</span>
									</li>
								{/each}
							</ul>

							{#if isSelected}
								<div class="badge badge-primary w-full">Selected</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<!-- Subscribe Button -->
			<div class="mt-8 text-center">
				<form method="POST" action="?/subscribe" use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						await update();
						isSubmitting = false;
					};
				}}>
					<input type="hidden" name="tier_id" value={selectedTierId} />
					<button type="submit" class="btn btn-primary btn-lg" disabled={isSubmitting}>
						{#if isSubmitting}
							<span class="loading loading-spinner"></span>
							Starting Journey...
						{:else}
							Start Journey
						{/if}
					</button>
				</form>
			</div>
		</div>
		{/if}
	{/if}

	<!-- What's Included Section -->
	<div class="divider my-12"></div>

	<div class="mb-8">
		<h2 class="text-3xl font-bold mb-4">What's Included in This Journey</h2>
		<p class="text-base-content/70 mb-6">
			Your journey is organized into {data.categories.length} categories with {data.sections.length} sections to help you prepare.
		</p>

		<div class="space-y-6">
			{#each data.categories as category}
				{@const categorySections = data.sectionsByCategory[category.id] || []}
				<div class="card bg-base-100 shadow-md">
					<div class="card-body">
						<h3 class="card-title text-xl flex items-center gap-2">
							<span class="text-2xl">{category.icon || '📂'}</span>
							{category.name}
						</h3>
						<p class="text-sm text-base-content/70 mb-4">{category.description}</p>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
							{#each categorySections as section}
								<div class="flex items-center gap-2 text-sm">
									<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
									</svg>
									<span>{section.name}</span>
									{#if section.is_required}
										<div class="badge badge-xs badge-warning">Required</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Back Button -->
	<div class="mt-8">
		<a href="/journeys" class="btn btn-ghost">
			← Back to Journey Library
		</a>
	</div>
</div>
