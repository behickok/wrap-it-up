<script lang="ts">
	/**
	 * Journey Template Library
	 * Browse, search, and discover journey templates
	 */

	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import RatingStars from '$lib/components/charts/RatingStars.svelte';

	let { data }: { data: PageData } = $props();

	// Template categories
	const CATEGORIES = [
		{ value: 'career', label: 'Career Development', icon: '💼' },
		{ value: 'technical', label: 'Technical Skills', icon: '💻' },
		{ value: 'personal', label: 'Personal Development', icon: '🌱' },
		{ value: 'creative', label: 'Creative Skills', icon: '🎨' },
		{ value: 'business', label: 'Business & Entrepreneurship', icon: '🚀' },
		{ value: 'health', label: 'Health & Wellness', icon: '💪' },
		{ value: 'other', label: 'Other', icon: '📚' }
	];

	// Format numbers
	function formatNumber(num: number): string {
		return num.toLocaleString();
	}

	// Get category info
	function getCategoryInfo(categoryValue: string) {
		return CATEGORIES.find((c) => c.value === categoryValue) || CATEGORIES[6];
	}

	// Handle filter change
	function handleFilterChange(param: string, value: string) {
		const url = new URL(window.location.href);
		if (value) {
			url.searchParams.set(param, value);
		} else {
			url.searchParams.delete(param);
		}
		goto(url.toString());
	}

	// Handle search
	function handleSearch(event: Event) {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);
		const query = formData.get('q') as string;
		handleFilterChange('q', query);
	}
</script>

<svelte:head>
	<title>Journey Templates - Wrap It Up</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-4xl font-bold mb-2">Journey Templates</h1>
		<p class="text-xl text-base-content/70">
			Start your journey faster with pre-built templates from the community
		</p>
	</div>

	<!-- Featured Templates -->
	{#if data.featuredTemplates.length > 0 && !data.filters.category && !data.filters.searchQuery}
		<div class="mb-8">
			<h2 class="text-2xl font-bold mb-4">Featured Templates</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				{#each data.featuredTemplates as template}
					{@const catInfo = getCategoryInfo(template.category)}
					<div class="card bg-gradient-to-br from-primary/10 to-secondary/10 shadow-xl border-2 border-primary">
						<div class="card-body">
							<div class="badge badge-primary badge-sm mb-2">Featured</div>
							<h3 class="card-title">
								<span class="text-xl">{catInfo.icon}</span>
								{template.name}
							</h3>
							<p class="text-sm text-base-content/70 line-clamp-2">
								{template.description || template.journey_description || 'No description'}
							</p>

							<div class="flex items-center gap-4 mt-2 text-sm">
								{#if template.rating > 0}
									<RatingStars rating={template.rating} size="sm" showValue />
								{/if}
								<span class="text-base-content/60">
									{formatNumber(template.downloads)} downloads
								</span>
							</div>

							<div class="card-actions justify-end mt-4">
								<a href="/templates/{template.id}" class="btn btn-primary btn-sm">
									View Template
								</a>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Filters and Search -->
	<div class="card bg-base-100 shadow mb-6">
		<div class="card-body">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<!-- Search -->
				<form onsubmit={handleSearch} class="form-control">
					<label class="label" for="search">
						<span class="label-text">Search Templates</span>
					</label>
					<div class="join">
						<input
							id="search"
							type="text"
							name="q"
							placeholder="Search..."
							class="input input-bordered join-item flex-1"
							value={data.filters.searchQuery || ''}
						/>
						<button type="submit" class="btn btn-primary join-item" aria-label="Search templates">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								/>
							</svg>
						</button>
					</div>
				</form>

				<!-- Category Filter -->
				<div class="form-control">
					<label class="label" for="category">
						<span class="label-text">Category</span>
					</label>
					<select
						id="category"
						class="select select-bordered"
						value={data.filters.category || ''}
						onchange={(e) => handleFilterChange('category', e.currentTarget.value)}
					>
						<option value="">All Categories</option>
						{#each CATEGORIES as cat}
							<option value={cat.value}>
								{cat.icon} {cat.label}
							</option>
						{/each}
					</select>
				</div>

				<!-- Sort By -->
				<div class="form-control">
					<label class="label" for="sort">
						<span class="label-text">Sort By</span>
					</label>
					<select
						id="sort"
						class="select select-bordered"
						value={data.filters.sortBy}
						onchange={(e) => handleFilterChange('sort', e.currentTarget.value)}
					>
						<option value="downloads">Most Downloaded</option>
						<option value="rating">Highest Rated</option>
						<option value="recent">Most Recent</option>
					</select>
				</div>
			</div>
		</div>
	</div>

	<!-- Results Count -->
	<div class="mb-4">
		<p class="text-base-content/70">
			Showing <strong>{data.templates.length}</strong>
			{data.templates.length === 1 ? 'template' : 'templates'}
			{#if data.filters.category}
				in <strong>{getCategoryInfo(data.filters.category).label}</strong>
			{/if}
			{#if data.filters.searchQuery}
				matching "<strong>{data.filters.searchQuery}</strong>"
			{/if}
		</p>
	</div>

	<!-- Templates Grid -->
	{#if data.templates.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each data.templates as template}
				{@const catInfo = getCategoryInfo(template.category)}
				<div class="card bg-base-100 shadow hover:shadow-xl transition-shadow">
					<div class="card-body">
						<!-- Category Badge -->
						<div class="badge badge-outline badge-sm mb-2">{catInfo.icon} {catInfo.label}</div>

						<!-- Title -->
						<h3 class="card-title text-lg">
							{template.name}
						</h3>

						<!-- Description -->
						<p class="text-sm text-base-content/70 line-clamp-2 mb-2">
							{template.description || template.journey_description || 'No description'}
						</p>

						<!-- Stats -->
						<div class="flex flex-wrap items-center gap-3 text-xs text-base-content/60 mb-3">
							{#if template.rating > 0}
								<div class="flex items-center gap-1">
									<RatingStars rating={template.rating} size="sm" />
									<span>({template.rating_count})</span>
								</div>
							{/if}
							<span>📥 {formatNumber(template.downloads)}</span>
							<span>📑 {template.section_count} sections</span>
						</div>

						<!-- Creator -->
						<div class="text-xs text-base-content/60">
							by <span class="font-medium">{template.creator_name}</span>
						</div>

						<!-- Actions -->
						<div class="card-actions justify-end mt-4">
							<a href="/templates/{template.id}" class="btn btn-primary btn-sm">
								View Details
							</a>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<!-- No Results -->
		<div class="card bg-base-100 shadow">
			<div class="card-body text-center py-12">
				<p class="text-lg text-base-content/60 mb-2">No templates found</p>
				<p class="text-sm text-base-content/50 mb-4">Try adjusting your filters or search query</p>
				<button class="btn btn-primary" onclick={() => goto('/templates')}>
					Clear Filters
				</button>
			</div>
		</div>
	{/if}

	<!-- Call to Action -->
	<div class="card bg-secondary text-secondary-content shadow-xl mt-12">
		<div class="card-body text-center">
			<h2 class="card-title text-2xl justify-center mb-2">Share Your Journey</h2>
			<p class="mb-4">
				Have a great journey? Share it with the community as a template and help others succeed!
			</p>
			<div class="card-actions justify-center">
				<a href="/creator/journeys" class="btn btn-primary">Go to My Journeys</a>
			</div>
		</div>
	</div>
</div>
