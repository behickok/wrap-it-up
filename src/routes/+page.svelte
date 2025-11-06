<script lang="ts">
	import { SECTIONS, JOURNEY_CATEGORIES, type JourneyCategory } from '$lib/types';
	import { getCompletionColor, getMotivationalMessage } from '$lib/readinessScore';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Progress } from '$lib/components/ui/progress';
	import JourneyTabs from '$lib/components/JourneyTabs.svelte';
	import JourneyVisual from '$lib/components/JourneyVisual.svelte';

	let { data } = $props();

	const readinessScore = $derived(data.readinessScore);
	const motivationalMessage = $derived(getMotivationalMessage(readinessScore.total_score));

	let activeCategory = $state<JourneyCategory>('plan');

	const sectionsInCategory = $derived(
		SECTIONS.filter((section) => section.category === activeCategory)
	);

	// Helper to get badge variant based on color
	function getBadgeVariant(color: string): 'success' | 'warning' | 'destructive' | 'default' {
		if (color === 'green') return 'success';
		if (color === 'yellow') return 'warning';
		if (color === 'orange' || color === 'red') return 'destructive';
		return 'default';
	}

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

<div class="max-w-full journey-dashboard">
	<!-- Welcome Card with Readiness Score -->
	<Card class="mb-6 overflow-hidden border-none shadow-lg">
		<div class="bg-gradient-to-br from-primary/10 to-secondary/10 p-8">
			<div class="text-center mb-6">
				<h1 class="text-4xl font-bold text-foreground mb-3">Your Life Planning Journey</h1>
				<p class="text-lg text-muted-foreground max-w-2xl mx-auto">{motivationalMessage}</p>
			</div>
			<div class="flex justify-center">
				<div
					class="bg-gradient-to-br from-primary to-secondary text-primary-foreground rounded-2xl p-8 text-center min-w-[220px] shadow-xl"
				>
					<div class="text-6xl font-bold mb-2">{readinessScore.total_score}</div>
					<div class="text-lg opacity-90">Overall Readiness</div>
					<div class="text-sm opacity-75 mt-1">out of 100 points</div>
				</div>
			</div>
		</div>
	</Card>

	<!-- Journey Visual -->
	<div class="mb-8 rounded-2xl overflow-hidden shadow-md">
		<JourneyVisual {activeCategory} />
	</div>

	<!-- Journey Category Tabs -->
	<JourneyTabs bind:activeCategory />

	<!-- Category Overview and Sections -->
	{#key activeCategory}
		{@const currentCategoryInfo = JOURNEY_CATEGORIES.find((c) => c.id === activeCategory)}
		{@const categoryScore = getCategoryScore(activeCategory)}
		{@const categoryColor = getCompletionColor(categoryScore)}

		<!-- Category Overview Card -->
		<Card class="mb-6 border-2 transition-all duration-300" style="border-color: {currentCategoryInfo?.color}">
			<CardHeader>
				<div class="flex items-center justify-between flex-wrap gap-4">
					<div>
						<CardTitle class="text-2xl mb-2">{currentCategoryInfo?.name}</CardTitle>
						<p class="text-muted-foreground">{currentCategoryInfo?.description}</p>
					</div>
					<Badge variant={getBadgeVariant(categoryColor)} class="text-lg px-4 py-2">
						{categoryScore}% Complete
					</Badge>
				</div>
			</CardHeader>
		</Card>

		<!-- Sections in Category -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
			{#each sectionsInCategory as section}
				{@const sectionScore = readinessScore.sections[section.id] || 0}
				{@const color = getCompletionColor(sectionScore)}

				<a
					href="/section/{section.id}"
					class="block transition-all duration-300 hover:-translate-y-2"
				>
					<Card class="h-full hover:shadow-xl transition-all duration-300 border-l-4" style="border-left-color: {currentCategoryInfo?.color}">
						<CardHeader>
							<div class="flex justify-between items-start gap-4">
								<CardTitle class="text-xl flex-1">{section.name}</CardTitle>
								<Badge variant={getBadgeVariant(color)} class="shrink-0">{sectionScore}/100</Badge>
							</div>
						</CardHeader>
						<CardContent class="space-y-3">
							<Progress value={sectionScore} class="h-3" />
							<div class="flex justify-between items-center text-sm">
								<span class="font-medium text-muted-foreground">
									Priority: {section.weight}/10
								</span>
								<span class="italic text-muted-foreground">
									{#if sectionScore === 0}
										Not started
									{:else if sectionScore < 100}
										In progress
									{:else}
										Complete
									{/if}
								</span>
							</div>
						</CardContent>
					</Card>
				</a>
			{/each}
		</div>
	{/key}

	<!-- Help Card -->
	<Card class="bg-gradient-to-br from-accent to-accent/50 border-accent">
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<svg
					class="w-6 h-6"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
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
			<p class="text-muted-foreground leading-relaxed">
				Each section has an "Ask AI" feature to help you think through what information to include.
				Use the journey tabs above to navigate between different life planning areas.
			</p>
		</CardContent>
	</Card>
</div>
