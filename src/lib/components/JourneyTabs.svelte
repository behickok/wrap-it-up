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
		margin-bottom: 1rem;
	}

	.journey-tabs {
		display: flex;
		gap: 0.75rem;
		overflow-x: auto;
		overflow-y: hidden;
		padding: 0.5rem 0;
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
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 1rem 2rem;
		min-width: 160px;
		border: none;
		background: white;
		border-radius: 2rem;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		flex-shrink: 0;
	}

	.journey-tab::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 2rem;
		padding: 2px;
		background: linear-gradient(135deg, var(--category-color), transparent);
		-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
		-webkit-mask-composite: xor;
		mask-composite: exclude;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.journey-tab:hover::before {
		opacity: 0.5;
	}

	.journey-tab.active::before {
		opacity: 1;
		padding: 3px;
	}

	.journey-tab:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
	}

	.journey-tab.active {
		background: linear-gradient(135deg, var(--category-color), white);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		transform: translateY(-4px) scale(1.05);
	}

	.tab-name {
		font-size: 1.125rem;
		font-weight: 600;
		color: oklch(30% 0.03 230);
		transition: color 0.3s ease;
		margin-bottom: 0.25rem;
	}

	.journey-tab.active .tab-name {
		color: oklch(20% 0.05 230);
	}

	.tab-description {
		font-size: 0.75rem;
		color: oklch(60% 0.02 230);
		transition: color 0.3s ease;
		white-space: nowrap;
	}

	.journey-tab.active .tab-description {
		color: oklch(40% 0.03 230);
		font-weight: 500;
	}

	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.journey-tabs-container {
			padding: 0 0.5rem;
		}

		.journey-tabs {
			gap: 0.5rem;
			justify-content: flex-start;
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
