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

<div class="flex justify-center mb-8">
	<div class="journey-tabs-container" role="tablist" aria-label="Journey categories">
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
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
		max-width: 900px;
	}

	@media (min-width: 1024px) {
		.journey-tabs-container {
			flex-direction: row;
			gap: 0;
			border-radius: 1rem;
			overflow: hidden;
			box-shadow:
				0 4px 6px -1px rgba(0, 0, 0, 0.06),
				0 2px 4px -1px rgba(0, 0, 0, 0.04);
		}
	}

	.journey-tab {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 1rem 1.5rem;
		border: 1px solid var(--color-base-300);
		background: linear-gradient(
			135deg,
			color-mix(in oklch, var(--category-color) 8%, var(--color-base-100)),
			var(--color-base-100)
		);
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
		border-radius: 0.75rem;
	}

	@media (min-width: 1024px) {
		.journey-tab {
			border-radius: 0;
		}

		.journey-tab:first-child {
			border-top-left-radius: 1rem;
			border-bottom-left-radius: 1rem;
		}

		.journey-tab:last-child {
			border-top-right-radius: 1rem;
			border-bottom-right-radius: 1rem;
		}

		.journey-tab::after {
			content: '';
			position: absolute;
			bottom: 0;
			left: 0;
			right: 0;
			height: 3px;
			background: var(--category-color);
			opacity: 0;
			transition: opacity 0.3s ease;
		}
	}

	.journey-tab:hover {
		background: linear-gradient(
			135deg,
			color-mix(in oklch, var(--category-color) 15%, var(--color-base-100)),
			color-mix(in oklch, var(--category-color) 8%, var(--color-base-100))
		);
		border-color: color-mix(in oklch, var(--category-color) 40%, transparent 60%);
		transform: translateY(-2px);
		box-shadow:
			0 6px 8px -2px rgba(0, 0, 0, 0.08),
			0 3px 5px -1px rgba(0, 0, 0, 0.05);
	}

	@media (min-width: 1024px) {
		.journey-tab:hover {
			transform: translateY(0);
			box-shadow: none;
		}

		.journey-tab:hover::after {
			opacity: 0.5;
		}
	}

	.journey-tab.active {
		background: linear-gradient(
			135deg,
			color-mix(in oklch, var(--category-color) 20%, white),
			color-mix(in oklch, var(--category-color) 12%, white)
		);
		border-color: color-mix(in oklch, var(--category-color) 60%, transparent 40%);
		box-shadow:
			0 8px 12px -3px color-mix(in oklch, var(--category-color) 20%, transparent 80%),
			0 4px 6px -2px color-mix(in oklch, var(--category-color) 15%, transparent 85%),
			inset 0 1px 0 0 color-mix(in oklch, white 40%, transparent 60%);
	}

	@media (min-width: 1024px) {
		.journey-tab.active {
			box-shadow:
				inset 0 1px 0 0 color-mix(in oklch, white 40%, transparent 60%);
		}

		.journey-tab.active::after {
			opacity: 1;
		}
	}

	.tab-name {
		font-size: 1.125rem;
		font-weight: 700;
		color: color-mix(in oklch, var(--category-color) 70%, var(--color-base-content) 30%);
		transition: color 0.3s ease;
	}

	.journey-tab.active .tab-name {
		color: color-mix(in oklch, var(--category-color) 85%, var(--color-base-content) 15%);
	}

	.tab-description {
		font-size: 0.75rem;
		color: var(--color-base-content);
		opacity: 0.7;
		margin-top: 0.25rem;
		text-align: center;
		transition: opacity 0.3s ease;
	}

	.journey-tab:hover .tab-description,
	.journey-tab.active .tab-description {
		opacity: 0.9;
	}
</style>
