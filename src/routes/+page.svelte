<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const user = $derived(data.user);
	const enrolledJourneys = $derived(data.enrolledJourneys ?? []);
	const availableJourneys = $derived(data.availableJourneys ?? []);
	const featuredJourneys = $derived(data.featuredJourneys ?? []);
	const AVAILABLE_JOURNEYS = ['wedding', 'care'];

	const hasEnrolledJourneys = $derived(enrolledJourneys.length > 0);
	const marketingHighlights = [
		{
			title: 'Personalized journeys',
			description: 'Step-by-step roadmaps crafted for major life transitions.',
			icon: '🧭'
		},
		{
			title: 'Expert guidance',
			description: 'Tiered plans that scale from self-serve checklists to mentor support.',
			icon: '🤝'
		},
		{
			title: 'Centralized vault',
			description: 'Securely capture legal, financial, medical, and legacy details in one place.',
			icon: '🔐'
		}
	];

	function getJourneyIcon(icon: string | null | undefined) {
		return icon || '🗂️';
	}
	function formatJourneyDescription(description: string | null | undefined) {
		return description ?? 'A guided experience with curated sections, tips, and accountability.';
	}
	function formatStartDate(value: string | null | undefined) {
		if (!value) return '—';
		const parsed = new Date(value);
		return Number.isNaN(parsed.valueOf()) ? '—' : parsed.toLocaleDateString();
	}

	function journeyComingSoon(slug: string): boolean {
		return !AVAILABLE_JOURNEYS.includes(slug);
	}
</script>

{#if !user}
	<section class="hero min-h-[70vh] bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10">
		<div class="container mx-auto px-4 py-16 grid lg:grid-cols-2 gap-12 items-center">
			<div class="space-y-6">
				<p class="badge badge-primary badge-outline">Wrap It Up</p>
				<h1 class="text-4xl md:text-5xl font-bold leading-tight">
					Bring clarity to life’s biggest transitions.
				</h1>
				<p class="text-lg text-base-content/70">
					Create a single, guided workspace for every document, password, preference, and story
					that matters. Choose a journey, invite trusted collaborators, and stay accountable with
					mentors when you need them.
				</p>
				<div class="flex flex-wrap gap-4">
					<a href="/register" class="btn btn-primary btn-lg shadow-lg">Get started</a>
					<a href="/login" class="btn btn-ghost btn-lg">Log in</a>
				</div>
			</div>
			<div class="bg-base-100 rounded-3xl shadow-xl p-8 border border-base-200 space-y-6">
				<h2 class="text-2xl font-semibold mb-2">What makes Wrap It Up different?</h2>
				<div class="grid gap-6">
					{#each marketingHighlights as highlight}
						<div class="flex gap-4 items-start">
							<div class="text-3xl shrink-0">{highlight.icon}</div>
							<div>
								<h3 class="font-semibold text-lg">{highlight.title}</h3>
								<p class="text-base-content/70">{highlight.description}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<section class="container mx-auto px-4 py-16 space-y-8">
		<h2 class="text-3xl font-bold text-center">Journeys designed by planners and estate pros</h2>
		<p class="text-center max-w-3xl mx-auto text-base-content/70">
			Each journey bundles the sections, tasks, and expert checkpoints that keep you organized. Start
			free with Essentials or upgrade when you want more support.
		</p>

		{#if featuredJourneys.length > 0}
			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-10">
				{#each featuredJourneys as journey}
					{@const comingSoon = journeyComingSoon(journey.slug)}
					<article class="card bg-base-100 shadow-xl border border-base-200">
						<div class="card-body space-y-3">
							<div class="flex items-center gap-3">
								<div class="text-4xl">{getJourneyIcon(journey.icon)}</div>
								<div>
									<h3 class="card-title">{journey.name}</h3>
									<p class="text-sm text-base-content/60 uppercase tracking-wide">Journey</p>
									{#if comingSoon}
										<p class="badge badge-warning mt-1">Coming soon</p>
									{/if}
								</div>
							</div>
							<p class="text-base-content/70">
								{formatJourneyDescription(journey.description)}
							</p>
							<div class="card-actions justify-end">
								{#if comingSoon}
									<button class="btn btn-disabled btn-sm" disabled>Coming Soon</button>
								{:else}
									<a href={`/journeys/${journey.slug}`} class="btn btn-primary btn-sm">View details</a>
								{/if}
							</div>
						</div>
					</article>
				{/each}
			</div>
		{:else}
			<div class="text-center text-base-content/60">Journeys are being curated. Check back soon!</div>
		{/if}
	</section>
{:else if hasEnrolledJourneys}
	<section class="container mx-auto px-4 py-12 space-y-8">
		<div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
			<div>
				<p class="text-sm uppercase tracking-wide text-base-content/50">Your journeys</p>
				<h1 class="text-4xl font-bold">Welcome back{user?.email ? `, ${user.email}` : ''}</h1>
				<p class="text-base-content/70">Pick up where you left off or explore a new path.</p>
			</div>
			<a href="/journeys" class="btn btn-ghost">Browse full library</a>
		</div>

		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each enrolledJourneys as journey}
				{@const comingSoon = journeyComingSoon(journey.journey_slug)}
				<article class="card bg-base-100 shadow-xl border border-primary/20">
					<div class="card-body space-y-4">
						<div class="flex items-center gap-3">
							<div class="text-4xl">{getJourneyIcon(journey.journey_icon)}</div>
							<div>
								<h2 class="card-title">{journey.journey_name}</h2>
								<p class="badge badge-outline badge-sm mt-1">{journey.tier_name} plan</p>
								{#if comingSoon}
									<p class="text-xs text-warning mt-1">Future journey (coming soon)</p>
								{/if}
							</div>
						</div>
						<p class="text-base-content/70">
							{formatJourneyDescription(journey.journey_description)}
						</p>
						<div class="flex items-center justify-between text-sm text-base-content/60">
							<span>Started {formatStartDate(journey.started_at)}</span>
							<span class="font-medium capitalize">{journey.status}</span>
						</div>
						<div class="card-actions justify-between items-center">
							<a href={`/journeys/${journey.journey_slug}`} class="btn btn-ghost btn-sm">
								View journey
							</a>
							<a href={`/journeys/${journey.journey_slug}/dashboard`} class="btn btn-primary btn-sm">
								Open dashboard
							</a>
						</div>
					</div>
				</article>
			{/each}
		</div>

		{#if availableJourneys.length > 0}
			<div class="mt-16 space-y-4">
				<div class="flex items-center justify-between flex-wrap gap-2">
					<div>
						<h2 class="text-2xl font-semibold">Explore more journeys</h2>
						<p class="text-base-content/70">Add another plan to keep every transition organized.</p>
					</div>
					<a href="/journeys" class="btn btn-outline btn-sm">See all journeys</a>
				</div>
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each availableJourneys as journey}
						{@const comingSoon = journeyComingSoon(journey.slug)}
						<article class="card bg-base-100 border border-base-200">
							<div class="card-body space-y-3">
								<div class="text-3xl">{getJourneyIcon(journey.icon)}</div>
								<h3 class="card-title">{journey.name}</h3>
								<p class="text-sm text-base-content/70">
									{formatJourneyDescription(journey.description)}
								</p>
								<div class="card-actions">
									{#if comingSoon}
										<button class="btn btn-disabled btn-sm w-full" disabled>Coming Soon</button>
									{:else}
										<a href={`/journeys/${journey.slug}`} class="btn btn-outline btn-sm w-full">
											Explore journey
										</a>
									{/if}
								</div>
							</div>
						</article>
					{/each}
				</div>
			</div>
		{/if}
	</section>
{:else}
	<section class="container mx-auto px-4 py-16 space-y-8">
		<div class="max-w-2xl space-y-4">
			<p class="text-sm uppercase tracking-wide text-base-content/50">Choose your starting point</p>
			<h1 class="text-4xl font-bold">Let’s start your first journey</h1>
			<p class="text-base-content/70">
				You’re logged in, but you haven’t enrolled in a journey yet. Browse the library below and pick
				the plan that best fits what you’re preparing for.
			</p>
		</div>

		{#if availableJourneys.length > 0}
			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each availableJourneys as journey}
					{@const comingSoon = journeyComingSoon(journey.slug)}
					<article class="card bg-base-100 shadow-lg border border-base-200">
						<div class="card-body space-y-3">
							<div class="flex items-center gap-3">
								<div class="text-4xl">{getJourneyIcon(journey.icon)}</div>
								<div>
									<h2 class="card-title">{journey.name}</h2>
									{#if comingSoon}
										<p class="text-sm text-warning">Coming soon</p>
									{:else}
										<p class="text-sm text-base-content/60">Guided journey</p>
									{/if}
								</div>
							</div>
							<p class="text-base-content/70">
								{formatJourneyDescription(journey.description)}
							</p>
							<div class="card-actions justify-between items-center pt-2">
								{#if comingSoon}
									<button class="btn btn-disabled btn-sm flex-1" disabled>Coming Soon</button>
								{:else}
									<a href={`/journeys/${journey.slug}`} class="btn btn-primary btn-sm flex-1">
										View details
									</a>
									<a href={`/journeys/${journey.slug}#plans`} class="btn btn-ghost btn-sm">
										Choose plan
									</a>
								{/if}
							</div>
						</div>
					</article>
				{/each}
			</div>
		{:else}
			<div class="alert alert-info border-info/30">
				<div>
					<h3 class="font-semibold">No journeys available yet</h3>
					<p>Our team is setting up new experiences. Check back soon or contact support.</p>
				</div>
			</div>
		{/if}
	</section>
{/if}
