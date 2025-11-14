<script lang="ts">
	/**
	 * Mentor Discovery Page
	 * Browse and discover platform mentors
	 */

	import type { PageData } from './$types';
	import RatingStars from '$lib/components/charts/RatingStars.svelte';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	// Format numbers
	function formatNumber(num: number): string {
		return num.toLocaleString();
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
</script>

<svelte:head>
	<title>Find a Mentor - Wrap It Up</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-4xl font-bold mb-2">Discover Mentors</h1>
		<p class="text-xl text-base-content/70">
			Connect with experienced mentors who can guide your learning journey
		</p>
	</div>

	<!-- Platform Stats -->
	<div class="stats shadow mb-8 w-full">
		<div class="stat">
			<div class="stat-figure text-primary">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					class="inline-block w-8 h-8 stroke-current"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
					></path>
				</svg>
			</div>
			<div class="stat-title">Available Mentors</div>
			<div class="stat-value text-primary">{formatNumber(data.stats.total_mentors)}</div>
			<div class="stat-desc">Ready to help you succeed</div>
		</div>

		<div class="stat">
			<div class="stat-figure text-secondary">⭐</div>
			<div class="stat-title">Average Rating</div>
			<div class="stat-value text-secondary">
				{data.stats.avg_rating ? data.stats.avg_rating.toFixed(1) : 'N/A'}
			</div>
			<div class="stat-desc">Based on learner reviews</div>
		</div>

		<div class="stat">
			<div class="stat-figure text-accent">✅</div>
			<div class="stat-title">Reviews Completed</div>
			<div class="stat-value text-accent">{formatNumber(data.stats.total_reviews || 0)}</div>
			<div class="stat-desc">Total platform reviews</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="card bg-base-100 shadow mb-6">
		<div class="card-body">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<!-- Specialization Filter -->
				<div class="form-control">
					<label class="label" for="specialization">
						<span class="label-text">Specialization</span>
					</label>
					<select
						id="specialization"
						class="select select-bordered"
						value={data.filters.specialization || ''}
						onchange={(e) => handleFilterChange('specialization', e.currentTarget.value)}
					>
						<option value="">All Specializations</option>
						{#each data.specializations as spec}
							<option value={spec.slug}>
								{spec.icon} {spec.name}
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
						<option value="rating">Highest Rated</option>
						<option value="reviews">Most Experienced</option>
						<option value="name">Name (A-Z)</option>
					</select>
				</div>

				<!-- Minimum Rating Filter -->
				<div class="form-control">
					<label class="label" for="min_rating">
						<span class="label-text">Minimum Rating</span>
					</label>
					<select
						id="min_rating"
						class="select select-bordered"
						value={data.filters.minRating.toString()}
						onchange={(e) => handleFilterChange('min_rating', e.currentTarget.value)}
					>
						<option value="0">Any Rating</option>
						<option value="3">3.0+ Stars</option>
						<option value="4">4.0+ Stars</option>
						<option value="4.5">4.5+ Stars</option>
					</select>
				</div>
			</div>
		</div>
	</div>

	<!-- Results Count -->
	<div class="mb-4">
		<p class="text-base-content/70">
			Showing <strong>{data.mentors.length}</strong>
			{data.mentors.length === 1 ? 'mentor' : 'mentors'}
			{#if data.filters.specialization}
				in <strong>
					{data.specializations.find((s) => s.slug === data.filters.specialization)?.name}
				</strong>
			{/if}
		</p>
	</div>

	<!-- Mentors Grid -->
	{#if data.mentors.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each data.mentors as mentor}
				<div class="card bg-base-100 shadow hover:shadow-xl transition-shadow">
					<div class="card-body">
						<!-- Mentor Header -->
						<div class="flex items-start justify-between mb-4">
							<div class="flex items-center gap-3">
								<div class="avatar placeholder">
									<div class="bg-primary text-primary-content rounded-full w-12">
										<span class="text-xl">{mentor.username[0].toUpperCase()}</span>
									</div>
								</div>
								<div>
									<h3 class="card-title text-lg">{mentor.username}</h3>
									{#if mentor.primary_specialization}
										<div class="text-sm text-base-content/60">
											{mentor.primary_icon} {mentor.primary_specialization}
										</div>
									{/if}
								</div>
							</div>
						</div>

						<!-- Rating & Reviews -->
						<div class="flex items-center gap-4 mb-3">
							{#if mentor.average_rating > 0}
								<div class="flex items-center gap-2">
									<RatingStars rating={mentor.average_rating} size="sm" showValue />
								</div>
							{:else}
								<span class="text-sm text-base-content/60">No ratings yet</span>
							{/if}

							<div class="text-sm text-base-content/60">
								{formatNumber(mentor.total_reviews_completed || 0)} review{mentor.total_reviews_completed ===
								1
									? ''
									: 's'}
							</div>
						</div>

						<!-- Bio -->
						{#if mentor.bio}
							<p class="text-sm text-base-content/70 line-clamp-3 mb-3">
								{mentor.bio}
							</p>
						{:else}
							<p class="text-sm text-base-content/50 italic mb-3">No bio provided</p>
						{/if}

						<!-- Specializations -->
						{#if mentor.specializations.length > 0}
							<div class="mb-4">
								<div class="text-xs font-semibold text-base-content/60 mb-2">Specializations</div>
								<div class="flex flex-wrap gap-2">
									{#each mentor.specializations.slice(0, 4) as spec}
										<div
											class="badge badge-sm gap-1"
											style="background-color: {spec.color}20; border-color: {spec.color}; color: {spec.color}"
										>
											{spec.icon} {spec.name}
										</div>
									{/each}
									{#if mentor.specializations.length > 4}
										<div class="badge badge-sm badge-ghost">
											+{mentor.specializations.length - 4} more
										</div>
									{/if}
								</div>
							</div>
						{/if}

						<!-- Actions -->
						<div class="card-actions justify-end mt-auto">
							<a href="/mentor/{mentor.user_id}" class="btn btn-primary btn-sm"> View Profile </a>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<!-- No Results -->
		<div class="card bg-base-100 shadow">
			<div class="card-body text-center py-12">
				<p class="text-lg text-base-content/60 mb-2">No mentors found</p>
				<p class="text-sm text-base-content/50">Try adjusting your filters</p>
				<button class="btn btn-primary mt-4" onclick={() => goto('/mentors')}>
					Clear Filters
				</button>
			</div>
		</div>
	{/if}

	<!-- Call to Action -->
	<div class="card bg-primary text-primary-content shadow-xl mt-12">
		<div class="card-body text-center">
			<h2 class="card-title text-2xl justify-center mb-2">Want to become a mentor?</h2>
			<p class="mb-4">
				Share your expertise and help others succeed on their learning journeys
			</p>
			<div class="card-actions justify-center">
				<a href="/mentor/apply" class="btn btn-secondary"> Apply to Be a Mentor </a>
			</div>
		</div>
	</div>
</div>
