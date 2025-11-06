<script lang="ts">
	import { SECTIONS, JOURNEY_CATEGORIES, type JourneyCategory } from '$lib/types';
	import { getMotivationalMessage } from '$lib/readinessScore';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Progress } from '$lib/components/ui/progress';
	import JourneyTabs from '$lib/components/JourneyTabs.svelte';
	import JourneyVisual from '$lib/components/JourneyVisual.svelte';
	import SectionContent from '$lib/components/SectionContent.svelte';

	let { data } = $props();

	const readinessScore = $derived(data.readinessScore);
	const motivationalMessage = $derived(getMotivationalMessage(readinessScore.total_score));

	let activeCategory = $state<JourneyCategory>('plan');
	let activeSection = $state<string>('legal'); // First section in 'plan' category

	const sectionsInCategory = $derived(
		SECTIONS.filter((section) => section.category === activeCategory)
	);

	const activeSectionData = $derived(
		SECTIONS.find((section) => section.id === activeSection)
	);

	// Update active section when category changes to first section in that category
	$effect(() => {
		const firstSectionInCategory = SECTIONS.find((s) => s.category === activeCategory);
		if (firstSectionInCategory) {
			activeSection = firstSectionInCategory.id;
		}
	});

	function getCategoryScore(category: JourneyCategory): number {
		const categorySections = SECTIONS.filter((s) => s.category === category);
		if (categorySections.length === 0) return 0;

		const totalScore = categorySections.reduce(
			(sum, section) => sum + (readinessScore.sections[section.id] || 0),
			0
		);
		return Math.round(totalScore / categorySections.length);
	}
</script>

<div class="journey-dashboard">
	<div class="mb-8 overflow-hidden rounded-2xl shadow-md">
		<JourneyVisual {activeCategory} />
	</div>

	<JourneyTabs bind:activeCategory />

	{#key activeCategory}
		{@const currentCategoryInfo = JOURNEY_CATEGORIES.find((c) => c.id === activeCategory)}
		{@const categoryScore = getCategoryScore(activeCategory)}

		<div class="mb-8 flex flex-nowrap overflow-x-auto gap-4 pb-4 justify-center">
			{#each sectionsInCategory as section}
				{@const sectionScore = readinessScore.sections[section.id] || 0}
				<button
					onclick={() => activeSection = section.id}
					class="card-button flex-shrink-0 transition-all duration-500"
					class:active={activeSection === section.id}
				>
					<Card
						class="glass-card h-full transition-all duration-500"
						style="--accent-color: {currentCategoryInfo?.color}"
					>
						<CardHeader class="pb-3">
							<div class="flex items-start justify-between gap-4">
								<CardTitle class="flex-1 text-lg text-glass-title">{section.name}</CardTitle>
								{#if sectionScore === 100}
									<Badge variant="success" class="shrink-0 px-2 py-0.5 text-xs">
										✓
									</Badge>
								{/if}
							</div>
						</CardHeader>
					</Card>
				</button>
			{/each}
		</div>

		<!-- Active Section Content -->
		{#if activeSection}
			<div class="mb-8">
				<SectionContent sectionId={activeSection} {data} />
			</div>
		{/if}
	{/key}

	<Card class="border-accent bg-gradient-to-br from-accent to-accent/50">
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				Need Help?
			</CardTitle>
		</CardHeader>
		<CardContent>
			<p class="leading-relaxed text-muted-foreground">
				Each section has an "Ask AI" feature to help you think through what information to
				include. Use the journey tabs above to navigate between different life planning areas.
			</p>
		</CardContent>
	</Card>
</div>

<style>
	.category-glass {
		--category-fallback: var(--color-plan);
		--category-tone: var(--category-color, var(--category-fallback));
		position: relative;
		border-radius: 1.75rem;
		background: linear-gradient(
			140deg,
			color-mix(in srgb, var(--category-tone) 14%, rgba(255, 255, 255, 0.92)) 0%,
			color-mix(in srgb, var(--category-tone) 6%, rgba(255, 255, 255, 0.65)) 100%
		);
		border: 1px solid color-mix(in srgb, var(--category-tone) 18%, rgba(255, 255, 255, 0.7));
		box-shadow: 0 24px 48px -28px color-mix(in srgb, var(--category-tone) 55%, rgba(20, 48, 42, 0.55));
		backdrop-filter: blur(24px);
		-webkit-backdrop-filter: blur(24px);
	}

	.category-glass::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background: radial-gradient(circle at 20% 15%, rgba(255, 255, 255, 0.85), transparent 55%);
		opacity: 0.85;
		pointer-events: none;
	}

	.category-glass > :global(*) {
		position: relative;
		z-index: 1;
	}

	.card-button {
		perspective: 1000px;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		min-width: 200px;
		max-width: 250px;
	}

	.card-button:focus {
		outline: none;
	}

	.glass-card {
		--accent-base: var(--accent-color, var(--color-plan));
		position: relative;
		overflow: hidden;
		border-radius: 1.5rem;
		background: linear-gradient(
			150deg,
			color-mix(in srgb, var(--accent-base) 12%, rgba(255, 255, 255, 0.92)) 0%,
			color-mix(in srgb, var(--accent-base) 6%, rgba(255, 255, 255, 0.7)) 100%
		);
		border: 1px solid color-mix(in srgb, var(--accent-base) 12%, rgba(255, 255, 255, 0.6));
		box-shadow: 0 22px 48px -30px color-mix(in srgb, var(--accent-base) 48%, rgba(18, 54, 47, 0.55));
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		transform-origin: center top;
		transition:
			background 350ms ease,
			border-color 350ms ease,
			box-shadow 350ms ease,
			transform 350ms ease;
	}

	.glass-card::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background:
			radial-gradient(circle at 15% 20%, rgba(255, 255, 255, 0.75), transparent 55%),
			radial-gradient(circle at 80% 0%, rgba(255, 255, 255, 0.4), transparent 60%);
		opacity: 0.85;
		pointer-events: none;
	}

	.glass-card::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		border: 1px solid rgba(255, 255, 255, 0.45);
		mix-blend-mode: screen;
		opacity: 0.6;
		pointer-events: none;
	}

	.card-button:hover .glass-card,
	.card-button:focus-visible .glass-card,
	.card-button.active .glass-card {
		transform: translateY(-8px) scale(1.01);
		background: linear-gradient(
			155deg,
			color-mix(in srgb, var(--accent-base) 16%, rgba(255, 255, 255, 0.95)) 0%,
			color-mix(in srgb, var(--accent-base) 10%, rgba(255, 255, 255, 0.72)) 100%
		);
		border-color: color-mix(in srgb, var(--accent-base) 22%, rgba(255, 255, 255, 0.75));
		box-shadow: 0 32px 60px -28px color-mix(in srgb, var(--accent-base) 58%, rgba(18, 60, 52, 0.5));
	}

	.card-button.active .glass-card {
		border-color: color-mix(in srgb, var(--accent-base) 35%, rgba(255, 255, 255, 0.85));
		box-shadow:
			0 0 0 3px color-mix(in srgb, var(--accent-base) 24%, rgba(255, 255, 255, 0.8)),
			0 32px 60px -28px color-mix(in srgb, var(--accent-base) 58%, rgba(18, 60, 52, 0.5));
	}

	.glass-card > :global(*) {
		position: relative;
		z-index: 1;
	}

	.text-glass-title {
		color: color-mix(in srgb, var(--accent-base) 70%, rgba(24, 47, 42, 0.9));
	}

	.glass-card-content {
		padding-bottom: 2.5rem;
	}

	/* Horizontal scrollbar styling for cards */
	.mb-8.flex {
		scrollbar-width: thin;
		scrollbar-color: color-mix(in srgb, var(--accent-color, var(--color-plan)) 30%, rgba(200, 200, 200, 0.5))
			rgba(240, 240, 240, 0.3);
	}

	.mb-8.flex::-webkit-scrollbar {
		height: 8px;
	}

	.mb-8.flex::-webkit-scrollbar-track {
		background: rgba(240, 240, 240, 0.3);
		border-radius: 10px;
	}

	.mb-8.flex::-webkit-scrollbar-thumb {
		background: color-mix(in srgb, var(--accent-color, var(--color-plan)) 30%, rgba(200, 200, 200, 0.5));
		border-radius: 10px;
	}

	.mb-8.flex::-webkit-scrollbar-thumb:hover {
		background: color-mix(in srgb, var(--accent-color, var(--color-plan)) 50%, rgba(150, 150, 150, 0.7));
	}

	.glass-meta {
		color: color-mix(in srgb, var(--accent-base) 25%, rgba(60, 76, 74, 0.85));
	}

	.glass-progress {
		position: relative;
		background: linear-gradient(90deg, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.12));
		border: 1px solid rgba(255, 255, 255, 0.45);
		box-shadow: inset 0 2px 6px rgba(12, 48, 43, 0.12);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
	}

	:global(.glass-progress > div) {
		border-radius: 9999px;
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--accent-base) 88%, rgba(255, 255, 255, 0.2)),
			color-mix(in srgb, var(--accent-base) 72%, rgba(255, 255, 255, 0.1))
		);
		box-shadow: 0 10px 24px -14px color-mix(in srgb, var(--accent-base) 65%, rgba(20, 57, 49, 0.6));
	}

	@media (max-width: 768px) {
		.category-glass {
			border-radius: 1.5rem;
		}

		.glass-card {
			border-radius: 1.4rem;
		}
	}
</style>
