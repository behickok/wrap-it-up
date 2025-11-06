<script lang="ts">
	import { SECTIONS, type JourneyCategory } from '$lib/types';

	let { currentSectionId }: { currentSectionId: string } = $props();

	const currentIndex = SECTIONS.findIndex((s) => s.id === currentSectionId);
	const currentSection = SECTIONS[currentIndex];
	const previousSection = currentIndex > 0 ? SECTIONS[currentIndex - 1] : null;
	const nextSection = currentIndex < SECTIONS.length - 1 ? SECTIONS[currentIndex + 1] : null;

	function getCategoryColor(category: JourneyCategory): string {
		const colors: Record<JourneyCategory, string> = {
			plan: 'var(--color-plan)',
			care: 'var(--color-care)',
			connect: 'var(--color-connect)',
			support: 'var(--color-support)',
			legacy: 'var(--color-legacy)'
		};
		return colors[category];
	}
</script>

<div class="section-navigation">
	<div class="flex items-center justify-between gap-4 flex-wrap">
		<div class="flex-1 min-w-0">
			{#if previousSection}
				<a href="/section/{previousSection.id}" class="nav-link prev-link">
					<div class="nav-arrow">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 19l-7-7 7-7"
							/>
						</svg>
					</div>
					<div class="nav-content">
						<div class="nav-label">Previous</div>
						<div class="nav-title truncate">{previousSection.name}</div>
						<div
							class="nav-category-indicator"
							style="background-color: {getCategoryColor(previousSection.category)}"
						></div>
					</div>
				</a>
			{:else}
				<div class="nav-placeholder"></div>
			{/if}
		</div>

		<div class="current-indicator">
			<div class="text-sm text-muted-foreground text-center">
				Section {currentIndex + 1} of {SECTIONS.length}
			</div>
			<div
				class="h-1 rounded-full mt-2"
				style="background-color: {getCategoryColor(currentSection.category)}"
			></div>
		</div>

		<div class="flex-1 min-w-0 flex justify-end">
			{#if nextSection}
				<a href="/section/{nextSection.id}" class="nav-link next-link">
					<div class="nav-content text-right">
						<div class="nav-label">Next</div>
						<div class="nav-title truncate">{nextSection.name}</div>
						<div
							class="nav-category-indicator ml-auto"
							style="background-color: {getCategoryColor(nextSection.category)}"
						></div>
					</div>
					<div class="nav-arrow">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5l7 7-7 7"
							/>
						</svg>
					</div>
				</a>
			{:else}
				<div class="nav-placeholder"></div>
			{/if}
		</div>
	</div>
</div>
