<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	let { data }: { data: PageData } = $props();

	// Group sections by category
	const sectionsByCategory = $derived.by(() => {
		const grouped: Record<number, typeof data.sections> = {};
		for (const section of data.sections) {
			if (!grouped[section.category_id]) {
				grouped[section.category_id] = [];
			}
			grouped[section.category_id].push(section);
		}
		return grouped;
	});

	// Calculate total sections
	const totalSections = $derived(data.sections.length);

	// Format currency
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}
</script>

<svelte:head>
	<title>{data.journey.name} - Wrap It Up</title>
	<meta name="description" content={data.journey.description || `Join the ${data.journey.name} journey`} />
</svelte:head>

<div class="min-h-screen bg-base-200">
	<!-- Hero Section -->
	<div class="bg-gradient-to-r from-primary to-secondary text-primary-content">
		<div class="container mx-auto px-4 py-12">
			<div class="max-w-4xl">
				<!-- Back to Marketplace -->
				<a href="/marketplace" class="btn btn-ghost btn-sm mb-4">
					← Back to Marketplace
				</a>

				<!-- Journey Header -->
				<div class="flex items-start gap-6">
					<div class="text-7xl">{data.journey.icon || '🎯'}</div>
					<div class="flex-1">
						<div class="flex items-center gap-3 mb-2">
							<h1 class="text-4xl md:text-5xl font-bold">{data.journey.name}</h1>
							{#if data.journey.is_featured}
								<div class="badge badge-warning badge-lg">Featured</div>
							{/if}
						</div>
						<p class="text-xl opacity-90 mb-3">
							{data.journey.description || 'A comprehensive journey to guide you through this important life event'}
						</p>
						<div class="flex items-center gap-4 text-sm opacity-80">
							<span>by {data.journey.creator_username}</span>
							{#if data.journey.use_count > 0}
								<span>• {data.journey.use_count} {data.journey.use_count === 1 ? 'user' : 'users'}</span>
							{/if}
							<span>• {totalSections} sections</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="container mx-auto px-4 py-8 max-w-7xl">
		<div class="grid lg:grid-cols-3 gap-8">
			<!-- Main Content (2/3) -->
			<div class="lg:col-span-2 space-y-8">
				<!-- Already Subscribed Message -->
				{#if data.userSubscription}
					<div class="alert alert-success">
						<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<div>
							<h3 class="font-bold">You're already on this journey!</h3>
							<div class="text-sm">
								<a href="/journeys/{data.journey.slug}/dashboard" class="link">
									Go to your dashboard →
								</a>
							</div>
						</div>
					</div>
				{/if}

				<!-- Journey Overview -->
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<h2 class="card-title text-2xl mb-4">What's Included</h2>
						<div class="grid gap-4">
							{#each data.categories as category}
								{@const categorySections = sectionsByCategory[category.id] || []}
								{#if categorySections.length > 0}
									<div class="border-l-4 border-primary pl-4">
										<h3 class="font-bold text-lg flex items-center gap-2">
											<span>{category.icon || '📁'}</span>
											<span>{category.name}</span>
											<span class="badge badge-neutral">{categorySections.length}</span>
										</h3>
										{#if category.description}
											<p class="text-sm text-base-content/70 mb-2">{category.description}</p>
										{/if}
										<ul class="list-disc list-inside space-y-1 text-sm">
											{#each categorySections as section}
												<li>{section.name}</li>
											{/each}
										</ul>
									</div>
								{/if}
							{/each}
						</div>
					</div>
				</div>

				<!-- All Sections Detail -->
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<h2 class="card-title text-2xl mb-4">Section Details</h2>
						<div class="space-y-6">
							{#each data.categories as category}
								{@const categorySections = sectionsByCategory[category.id] || []}
								{#if categorySections.length > 0}
									<div>
										<h3 class="font-bold text-xl mb-3 flex items-center gap-2 text-primary">
											<span>{category.icon || '📁'}</span>
											<span>{category.name}</span>
										</h3>
										<div class="space-y-3">
											{#each categorySections as section}
												<div class="p-4 bg-base-200 rounded-lg">
													<h4 class="font-semibold text-lg">{section.name}</h4>
													{#if section.description}
														<p class="text-sm text-base-content/70 mt-1">
															{section.description}
														</p>
													{/if}
													<div class="flex gap-2 mt-2">
														<div class="badge badge-sm">Weight: {section.weight}/10</div>
														{#if section.is_required}
															<div class="badge badge-sm badge-warning">Required</div>
														{/if}
													</div>
												</div>
											{/each}
										</div>
									</div>
								{/if}
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Sidebar (1/3) - Pricing -->
			<div class="lg:col-span-1">
				<div class="sticky top-4 space-y-4">
					<div class="card bg-base-100 shadow-xl">
						<div class="card-body">
							<h2 class="card-title text-2xl mb-4">Choose Your Plan</h2>

							{#if data.pricing.length === 0}
								<div class="alert alert-warning">
									<span>Pricing coming soon. Check back later!</span>
								</div>
							{:else}
								<div class="space-y-4">
									{#each data.pricing as tier}
										<div class="border-2 rounded-lg p-4 {tier.tier_slug === 'premium' ? 'border-primary bg-primary/5' : 'border-base-300'}">
											<div class="flex justify-between items-start mb-2">
												<h3 class="font-bold text-lg">{tier.tier_name}</h3>
												{#if tier.tier_slug === 'premium'}
													<div class="badge badge-primary">Popular</div>
												{/if}
											</div>

											{#if tier.tier_description}
												<p class="text-sm text-base-content/70 mb-3">
													{tier.tier_description}
												</p>
											{/if}

											<!-- Pricing -->
											<div class="mb-3">
												{#if tier.base_price_monthly > 0}
													<div class="flex items-baseline gap-2">
														<span class="text-3xl font-bold">
															{formatCurrency(tier.base_price_monthly)}
														</span>
														<span class="text-base-content/70">/month</span>
													</div>
													{#if tier.base_price_annual > 0 && tier.base_price_annual < tier.base_price_monthly * 12}
														<div class="text-sm text-base-content/70 mt-1">
															or {formatCurrency(tier.base_price_annual)}/year (save {formatCurrency((tier.base_price_monthly * 12) - tier.base_price_annual)})
														</div>
													{/if}
												{:else}
													<div class="text-2xl font-bold">Free</div>
												{/if}
											</div>

											<!-- Features -->
											{#if tier.features && tier.features.length > 0}
												<ul class="space-y-2 text-sm mb-4">
													{#each tier.features as feature}
														<li class="flex items-start gap-2">
															<svg class="w-5 h-5 text-success flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
															</svg>
															<span>{feature}</span>
														</li>
													{/each}
												</ul>
											{/if}

											<!-- CTA Button -->
											{#if data.userSubscription}
												<a href="/journeys/{data.journey.slug}/dashboard" class="btn btn-success btn-block">
													Go to Dashboard
												</a>
											{:else if data.isAuthenticated}
												<form method="POST" action="?/enroll" use:enhance>
													<input type="hidden" name="tier_id" value={tier.tier_id} />
													<button type="submit" class="btn btn-primary btn-block">
														Start Journey
													</button>
												</form>
												<p class="text-xs text-center text-base-content/60 mt-2">
													Free enrollment • Manual payment setup
												</p>
											{:else}
												<a href="/login?redirect=/journeys/{data.journey.slug}" class="btn btn-primary btn-block">
													Sign In to Start
												</a>
											{/if}
										</div>
									{/each}
								</div>
							{/if}

							<!-- Help Text -->
							<div class="mt-4 text-sm text-base-content/70 text-center">
								💡 All plans include lifetime access to your journey data
							</div>
						</div>
					</div>

					<!-- Creator Info -->
					<div class="card bg-base-100 shadow-xl">
						<div class="card-body">
							<h3 class="font-bold text-lg mb-2">About the Creator</h3>
							<div class="flex items-center gap-3">
								<div class="avatar placeholder">
									<div class="bg-neutral text-neutral-content rounded-full w-12">
										<span class="text-xl">{data.journey.creator_username.charAt(0).toUpperCase()}</span>
									</div>
								</div>
								<div>
									<div class="font-semibold">{data.journey.creator_username}</div>
									<div class="text-sm text-base-content/70">Journey Creator</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
