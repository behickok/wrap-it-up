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

<div class="flex justify-center">
	<div class="join join-vertical lg:join-horizontal" role="tablist" aria-label="Journey categories">
		{#each JOURNEY_CATEGORIES as category}
			<button
				type="button"
				role="tab"
				aria-selected={activeCategory === category.id}
				class="join-item btn btn-primary"
				style="--category-color: {category.color}"
				onclick={() => handleTabClick(category.id)}
			>
				<span class="tab-name">{category.name}</span>
				<span class="tab-description">{category.description}</span>
			</button>
		{/each}
	</div>
</div>
