<script lang="ts">
	import { SECTIONS } from '$lib/types';
	import { getCompletionColor, getMotivationalMessage } from '$lib/readinessScore';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Progress } from '$lib/components/ui/progress';

	let { data } = $props();

	const readinessScore = $derived(data.readinessScore);
	const motivationalMessage = $derived(getMotivationalMessage(readinessScore.total_score));

	// Helper to get badge variant based on color
	function getBadgeVariant(color: string): 'success' | 'warning' | 'destructive' | 'default' {
		if (color === 'green') return 'success';
		if (color === 'yellow') return 'warning';
		if (color === 'orange' || color === 'red') return 'destructive';
		return 'default';
	}
</script>

<div class="max-w-full">
	<Card class="mb-8">
		<CardHeader>
			<CardTitle class="text-3xl">Welcome to Your Planning Workbook</CardTitle>
			<p class="text-lg text-muted-foreground mt-2">{motivationalMessage}</p>
		</CardHeader>
		<CardContent>
			<div class="flex justify-center">
				<div class="bg-gradient-to-br from-primary to-secondary text-primary-foreground rounded-xl p-8 text-center min-w-[200px] shadow-lg">
					<div class="text-5xl font-bold mb-2">{readinessScore.total_score}</div>
					<div class="text-base opacity-90">Overall Readiness Score</div>
					<div class="text-xs opacity-75 mt-1">out of 100 points</div>
				</div>
			</div>
		</CardContent>
	</Card>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
		{#each SECTIONS as section}
			{@const sectionScore = readinessScore.sections[section.id] || 0}
			{@const color = getCompletionColor(sectionScore)}

			<a href="/section/{section.id}" class="block transition-transform hover:-translate-y-1">
				<Card class="h-full hover:shadow-lg transition-shadow">
					<CardHeader>
						<div class="flex justify-between items-start">
							<CardTitle class="text-xl flex-1">{section.name}</CardTitle>
							<Badge variant={getBadgeVariant(color)} class="ml-4">{sectionScore}/100</Badge>
						</div>
					</CardHeader>
					<CardContent class="space-y-3">
						<Progress value={sectionScore} class="h-2" />
						<div class="flex justify-between items-center text-sm text-muted-foreground">
							<span class="font-medium">Priority: {section.weight}/10</span>
							<span class="italic">
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

	<Card class="bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200">
		<CardHeader>
			<CardTitle>Need Help?</CardTitle>
		</CardHeader>
		<CardContent>
			<p class="text-muted-foreground leading-relaxed">
				Each section has an "Ask AI" feature to help you think through what information to include.
				Simply click on any section to get started.
			</p>
		</CardContent>
	</Card>
</div>
