<script lang="ts">
	import { SECTIONS, JOURNEY_CATEGORIES, type JourneyCategory } from '$lib/types';
	import { getMotivationalMessage } from '$lib/readinessScore';
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
	<div class="journey-visual-container mb-8 overflow-hidden rounded-2xl">
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
					<div
						class="glass-card h-full transition-all duration-500"
						style="--accent-color: {currentCategoryInfo?.color}"
					>
						<div class="pb-3 p-6">
							<div class="flex items-start justify-between gap-4">
								<h3 class="flex-1 text-lg text-glass-title font-semibold">{section.name}</h3>
								{#if sectionScore === 100}
									<span class="badge badge-success shrink-0 text-xs">
										✓
									</span>
								{/if}
							</div>
						</div>
					</div>
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

	<div class="help-card card shadow-xl">
		<div class="card-body">
			<h2 class="card-title flex items-center gap-2">
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				Need Help?
			</h2>
			<p class="leading-relaxed help-text">
				Each section has an "Ask AI" feature to help you think through what information to
				include. Use the journey tabs above to navigate between different life planning areas.
			</p>
		</div>
	</div>
</div>

<style>
	.journey-visual-container {
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.08),
			0 4px 6px -2px rgba(0, 0, 0, 0.04),
			inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
		border: 1px solid color-mix(in oklch, var(--color-base-300) 60%, transparent 40%);
	}

	.help-card {
		background: linear-gradient(
			135deg,
			color-mix(in oklch, var(--color-accent) 12%, var(--color-base-100)),
			color-mix(in oklch, var(--color-accent) 6%, var(--color-base-100))
		);
		border: 1px solid color-mix(in oklch, var(--color-accent) 30%, transparent 70%);
	}

	.help-text {
		color: color-mix(in oklch, var(--color-base-content) 85%, transparent 15%);
		opacity: 0.9;
	}
</style>
