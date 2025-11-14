<script lang="ts">
	/**
	 * Rating Stars Component
	 * Displays star rating visualization
	 */

	interface Props {
		rating: number; // 0-5
		maxRating?: number;
		size?: 'sm' | 'md' | 'lg';
		showValue?: boolean;
	}

	let {
		rating,
		maxRating = 5,
		size = 'md',
		showValue = false
	}: Props = $props();

	// Calculate star sizes
	const sizes = {
		sm: 'w-4 h-4',
		md: 'w-5 h-5',
		lg: 'w-6 h-6'
	};

	const starSize = $derived(sizes[size]);

	// Calculate filled, half-filled, and empty stars
	const fullStars = $derived(Math.floor(rating));
	const hasHalfStar = $derived(rating % 1 >= 0.5);
	const emptyStars = $derived(maxRating - fullStars - (hasHalfStar ? 1 : 0));
</script>

<div class="flex items-center gap-1">
	<!-- Full stars -->
	{#each Array(fullStars) as _, i}
		<svg
			class="{starSize} fill-warning"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
		>
			<path
				d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
			/>
		</svg>
	{/each}

	<!-- Half star -->
	{#if hasHalfStar}
		<svg
			class="{starSize}"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
		>
			<defs>
				<linearGradient id="half-star-{rating}">
					<stop offset="50%" stop-color="oklch(var(--wa))" />
					<stop offset="50%" stop-color="oklch(var(--bc) / 0.2)" />
				</linearGradient>
			</defs>
			<path
				fill="url(#half-star-{rating})"
				d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
			/>
		</svg>
	{/if}

	<!-- Empty stars -->
	{#each Array(emptyStars) as _, i}
		<svg
			class="{starSize} fill-base-content/20"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
		>
			<path
				d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
			/>
		</svg>
	{/each}

	<!-- Rating value -->
	{#if showValue}
		<span class="text-sm font-semibold ml-1">
			{rating.toFixed(1)}
		</span>
	{/if}
</div>
