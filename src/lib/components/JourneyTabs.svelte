<script lang="ts">
	import { JOURNEY_CATEGORIES, type JourneyCategory } from '$lib/types';

	let {
		activeCategory = $bindable('plan'),
		onCategoryChange
	}: {
		activeCategory?: JourneyCategory;
		onCategoryChange?: (category: JourneyCategory) => void;
	} = $props();

	function handleTabClick(categoryId: JourneyCategory) {
		activeCategory = categoryId;
		if (onCategoryChange) {
			onCategoryChange(categoryId);
		}
	}
</script>

<div class="journey-tabs-container">
	<div class="journey-tabs" role="tablist" aria-label="Journey categories">
		{#each JOURNEY_CATEGORIES as category}
			<button
				type="button"
				role="tab"
				aria-selected={activeCategory === category.id}
				class="journey-tab"
				class:active={activeCategory === category.id}
				style="--category-color: {category.color}"
				onclick={() => handleTabClick(category.id)}
			>
				<span class="tab-name">{category.name}</span>
				<span class="tab-description">{category.description}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.journey-tabs-container {
		width: 100%;
		padding: 0 1rem;
		margin-bottom: 1.5rem;
	}

	.journey-tabs {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
		flex-wrap: wrap;
		padding: 0.5rem 0;
	}

	.journey-tab {
		--tab-fallback: var(--color-plan);
		--tab-tone: var(--category-color, var(--tab-fallback));
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 1rem 2rem;
		min-width: 160px;
		border-radius: 2rem;
		cursor: pointer;
		border: none;
		appearance: none;
		color: inherit;
		background: transparent;
		overflow: hidden;
		flex-shrink: 0;
		transition: transform 350ms ease, box-shadow 350ms ease;
	}

	.journey-tab::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background: linear-gradient(
			140deg,
			color-mix(in srgb, var(--tab-tone) 14%, rgba(255, 255, 255, 0.94)) 0%,
			color-mix(in srgb, var(--tab-tone) 6%, rgba(255, 255, 255, 0.7)) 100%
		);
		border: 1px solid color-mix(in srgb, var(--tab-tone) 16%, rgba(255, 255, 255, 0.65));
		box-shadow: 0 18px 36px -24px color-mix(in srgb, var(--tab-tone) 52%, rgba(24, 52, 42, 0.45));
		backdrop-filter: blur(26px);
		-webkit-backdrop-filter: blur(26px);
		transition:
			background 350ms ease,
			border-color 350ms ease,
			box-shadow 350ms ease;
	}

	.journey-tab::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background: radial-gradient(circle at 20% 15%, rgba(255, 255, 255, 0.85), transparent 60%);
		opacity: 0.85;
		pointer-events: none;
		transition: opacity 350ms ease;
	}

	.journey-tab > :global(*) {
		position: relative;
		z-index: 1;
	}

	.journey-tab:hover,
	.journey-tab:focus-visible {
		transform: translateY(-4px);
	}

	.journey-tab:hover::before,
	.journey-tab:focus-visible::before {
		background: linear-gradient(
			145deg,
			color-mix(in srgb, var(--tab-tone) 21%, rgba(255, 255, 255, 0.98)) 0%,
			color-mix(in srgb, var(--tab-tone) 10%, rgba(255, 255, 255, 0.72)) 100%
		);
		border-color: color-mix(in srgb, var(--tab-tone) 24%, rgba(255, 255, 255, 0.72));
		box-shadow: 0 28px 52px -28px color-mix(in srgb, var(--tab-tone) 60%, rgba(24, 52, 42, 0.35));
	}

	.journey-tab:focus-visible {
		outline: none;
	}

	.journey-tab:focus-visible::before {
		box-shadow:
			0 0 0 3px color-mix(in srgb, var(--tab-tone) 28%, rgba(255, 255, 255, 0.8)),
			0 28px 52px -28px color-mix(in srgb, var(--tab-tone) 60%, rgba(24, 52, 42, 0.35));
	}

	.journey-tab.active::before {
		background: linear-gradient(
			145deg,
			color-mix(in srgb, var(--tab-tone) 24%, rgba(255, 255, 255, 0.98)) 0%,
			color-mix(in srgb, var(--tab-tone) 12%, rgba(255, 255, 255, 0.75)) 100%
		);
		border-color: color-mix(in srgb, var(--tab-tone) 32%, rgba(255, 255, 255, 0.78));
		box-shadow:
			0 34px 68px -28px color-mix(in srgb, var(--tab-tone) 58%, rgba(24, 52, 42, 0.55)),
			0 0 0 1px color-mix(in srgb, var(--tab-tone) 28%, rgba(255, 255, 255, 0.6)),
			0 14px 28px -22px color-mix(in srgb, var(--tab-tone) 72%, rgba(30, 58, 49, 0.38));
	}

	.journey-tab.active::after {
		opacity: 0.95;
	}

	.tab-name {
		font-size: 1.125rem;
		font-weight: 600;
		color: color-mix(in srgb, var(--tab-tone) 55%, rgba(32, 52, 46, 0.9));
		margin-bottom: 0.25rem;
		transition: color 300ms ease;
	}

	.journey-tab.active .tab-name {
		color: color-mix(in srgb, var(--tab-tone) 85%, rgba(28, 56, 50, 0.95));
	}

	.tab-description {
		font-size: 0.75rem;
		color: color-mix(in srgb, var(--tab-tone) 24%, rgba(76, 92, 88, 0.85));
		transition: color 300ms ease;
		white-space: nowrap;
		font-weight: 500;
	}

	.journey-tab.active .tab-description {
		color: color-mix(in srgb, var(--tab-tone) 54%, rgba(48, 68, 62, 0.88));
	}

	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.journey-tabs-container {
			padding: 0 0.5rem;
		}

		.journey-tabs {
			gap: 0.5rem;
			justify-content: flex-start;
			overflow-x: auto;
			overflow-y: hidden;
			flex-wrap: nowrap;
			scrollbar-width: thin;
			scrollbar-color: oklch(85% 0.02 200) transparent;
		}

		.journey-tabs::-webkit-scrollbar {
			height: 6px;
		}

		.journey-tabs::-webkit-scrollbar-track {
			background: transparent;
		}

		.journey-tabs::-webkit-scrollbar-thumb {
			background: oklch(85% 0.02 200);
			border-radius: 3px;
		}

		.journey-tab {
			min-width: 140px;
			padding: 0.875rem 1.5rem;
		}

		.tab-name {
			font-size: 1rem;
		}

		.tab-description {
			font-size: 0.625rem;
		}
	}

	@media (max-width: 480px) {
		.journey-tab {
			min-width: 120px;
			padding: 0.75rem 1.25rem;
		}

		.tab-description {
			display: none;
		}
	}
</style>
