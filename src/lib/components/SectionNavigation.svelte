<script lang="ts">
	import { SECTIONS, type JourneyCategory } from '$lib/types';
	import { Button } from './ui/button';

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

<style>
	.section-navigation {
		margin: 2rem 0;
		padding: 1.5rem;
		background: var(--color-card);
		border-radius: var(--radius);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		border-radius: var(--radius);
		background: var(--color-background);
		border: 2px solid var(--color-border);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		text-decoration: none;
		color: var(--color-foreground);
		max-width: 280px;
	}

	.nav-link:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
		border-color: var(--color-primary);
	}

	.prev-link:hover {
		transform: translateY(-2px) translateX(-4px);
	}

	.next-link:hover {
		transform: translateY(-2px) translateX(4px);
	}

	.nav-arrow {
		flex-shrink: 0;
		color: var(--color-primary);
	}

	.nav-content {
		flex: 1;
		min-width: 0;
	}

	.nav-label {
		font-size: 0.75rem;
		color: var(--color-muted-foreground);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.25rem;
	}

	.nav-title {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin-bottom: 0.5rem;
	}

	.nav-category-indicator {
		width: 40px;
		height: 3px;
		border-radius: 2px;
	}

	.current-indicator {
		min-width: 120px;
		padding: 0 1rem;
	}

	.nav-placeholder {
		width: 280px;
		height: 80px;
	}

	@media (max-width: 768px) {
		.section-navigation {
			padding: 1rem;
		}

		.nav-link {
			max-width: 200px;
			padding: 0.75rem;
			gap: 0.5rem;
		}

		.nav-title {
			font-size: 0.875rem;
		}

		.current-indicator {
			display: none;
		}

		.nav-placeholder {
			width: 100px;
			height: 60px;
		}
	}
</style>
