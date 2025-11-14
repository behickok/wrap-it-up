<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Filter state
	let searchQuery = $state(data.filters.search || '');
	let selectedCategory = $state(data.filters.category || '');

	// Get lowest price for a journey
	function getLowestPrice(pricing: any[]) {
		if (!pricing || pricing.length === 0) return null;
		const prices = pricing
			.filter((p) => p.base_price_monthly > 0)
			.map((p) => p.base_price_monthly);
		return prices.length > 0 ? Math.min(...prices) : null;
	}

	// Apply filters
	function applyFilters() {
		const params = new URLSearchParams();
		if (searchQuery) params.set('q', searchQuery);
		if (selectedCategory) params.set('category', selectedCategory);
		window.location.href = `/marketplace?${params.toString()}`;
	}

	// Clear filters
	function clearFilters() {
		searchQuery = '';
		selectedCategory = '';
		window.location.href = '/marketplace';
	}
</script>

<svelte:head>
	<title>Journey Marketplace - Wrap It Up</title>
	<meta name="description" content="Discover life journeys to help you plan and organize important life events" />
</svelte:head>

<div class="min-h-screen bg-base-200">
	<!-- Hero Section -->
	<div class="bg-gradient-to-r from-primary to-secondary text-primary-content">
		<div class="container mx-auto px-4 py-16">
			<div class="max-w-3xl">
				<h1 class="text-5xl font-bold mb-4">Journey Marketplace</h1>
				<p class="text-xl opacity-90">
					Discover guided journeys to help you navigate life's important moments
				</p>
			</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="bg-base-100 border-b border-base-300">
		<div class="container mx-auto px-4 py-6">
			<div class="flex flex-wrap gap-4 items-end">
				<!-- Search -->
				<div class="form-control flex-1 min-w-[250px]">
					<label class="label" for="journey-search">
						<span class="label-text">Search journeys</span>
					</label>
					<input
						id="journey-search"
						type="text"
						bind:value={searchQuery}
						placeholder="Search by name or description..."
						class="input input-bordered w-full"
						onkeydown={(e) => e.key === 'Enter' && applyFilters()}
					/>
				</div>

				<!-- Category Filter -->
				<div class="form-control min-w-[200px]">
					<label class="label" for="category-filter">
						<span class="label-text">Category</span>
					</label>
					<select
						id="category-filter"
						bind:value={selectedCategory}
						class="select select-bordered"
					>
						<option value="">All Categories</option>
						{#each data.allCategories as category}
							<option value={category.name}>
								{category.icon || ''} {category.name}
							</option>
						{/each}
					</select>
				</div>

				<!-- Action Buttons -->
				<div class="flex gap-2">
					<button class="btn btn-primary" onclick={applyFilters}>Apply Filters</button>
					{#if data.filters.category || data.filters.search}
						<button class="btn btn-ghost" onclick={clearFilters}>Clear</button>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Journeys Grid -->
	<div class="container mx-auto px-4 py-8">
		{#if data.journeys.length === 0}
			<div class="text-center py-16">
				<div class="text-6xl mb-4">🔍</div>
				<h2 class="text-2xl font-bold mb-2">No journeys found</h2>
				<p class="text-base-content/70 mb-4">
					{#if data.filters.category || data.filters.search}
						Try adjusting your filters to see more results
					{:else}
						Check back soon for new journeys
					{/if}
				</p>
				{#if data.filters.category || data.filters.search}
					<button class="btn btn-primary" onclick={clearFilters}>Clear Filters</button>
				{/if}
			</div>
		{:else}
			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each data.journeys as journey}
					{@const lowestPrice = getLowestPrice(journey.pricing)}

					<a
						href="/journeys/{journey.slug}"
						class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300 {journey.is_featured ? 'ring-2 ring-primary' : ''}"
					>
						<div class="card-body">
							<!-- Featured Badge -->
							{#if journey.is_featured}
								<div class="badge badge-primary absolute top-4 right-4">Featured</div>
							{/if}

							<!-- Journey Icon & Title -->
							<div class="flex items-start gap-4 mb-4">
								<div class="text-5xl">{journey.icon || '🎯'}</div>
								<div class="flex-1">
									<h2 class="card-title text-2xl">{journey.name}</h2>
									<p class="text-sm text-base-content/70 mt-1">
										by {journey.creator_username}
									</p>
								</div>
							</div>

							<!-- Description -->
							<p class="text-base-content/80 line-clamp-3 mb-4">
								{journey.description || 'No description available'}
							</p>

							<!-- Categories -->
							{#if journey.categories && journey.categories.length > 0}
								<div class="flex flex-wrap gap-2 mb-4">
									{#each journey.categories.slice(0, 3) as category}
										<div class="badge badge-outline">
											{category.icon || ''} {category.name}
										</div>
									{/each}
									{#if journey.categories.length > 3}
										<div class="badge badge-outline">
											+{journey.categories.length - 3} more
										</div>
									{/if}
								</div>
							{/if}

							<!-- Pricing -->
							<div class="divider my-2"></div>
							<div class="flex justify-between items-center">
								<div>
									{#if lowestPrice !== null}
										<div class="text-sm text-base-content/70">Starting at</div>
										<div class="text-2xl font-bold">${lowestPrice.toFixed(2)}/mo</div>
									{:else if journey.pricing.length > 0}
										<div class="text-sm text-base-content/70">Pricing available</div>
										<div class="text-lg font-semibold">Contact for details</div>
									{:else}
										<div class="text-sm text-base-content/70">Coming soon</div>
										<div class="text-lg font-semibold">Pricing TBA</div>
									{/if}
								</div>
								<div>
									<span class="btn btn-primary btn-sm">View Details →</span>
								</div>
							</div>

							<!-- Stats -->
							{#if journey.use_count > 0}
								<div class="text-xs text-base-content/60 mt-2">
									{journey.use_count} {journey.use_count === 1 ? 'user' : 'users'} joined
								</div>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Call to Action for Creators -->
	<div class="bg-base-100 border-t border-base-300">
		<div class="container mx-auto px-4 py-16 text-center">
			<h2 class="text-3xl font-bold mb-4">Are you a creator?</h2>
			<p class="text-lg text-base-content/70 mb-6 max-w-2xl mx-auto">
				Share your expertise and help others navigate life's important moments. Create and monetize your own journeys on our platform.
			</p>
			<a href="/admin/journeys" class="btn btn-primary btn-lg">Create Your Journey</a>
		</div>
	</div>
</div>

<style>
	.line-clamp-3 {
		display: -webkit-box;
		line-clamp: 3;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
