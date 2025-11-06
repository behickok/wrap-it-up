<script lang="ts">
	import type { JourneyCategory } from '$lib/types';

	let { activeCategory = 'plan' }: { activeCategory?: JourneyCategory } = $props();

	const categoryPositions = {
		plan: 0,
		care: 1,
		connect: 2,
		support: 3,
		legacy: 4
	};

	const activeIndex = categoryPositions[activeCategory];
</script>

<div class="journey-visual relative w-full h-48 overflow-hidden">
	<!-- Mountain/Wave layers -->
	<svg
		class="absolute inset-0 w-full h-full"
		viewBox="0 0 1200 300"
		preserveAspectRatio="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<!-- Background mountains -->
		<path
			d="M0,150 Q200,50 400,120 T800,100 T1200,140 L1200,300 L0,300 Z"
			class="mountain-back"
			fill="oklch(85% 0.03 180)"
			opacity="0.3"
		/>

		<!-- Middle layer -->
		<path
			d="M0,180 Q250,80 500,160 T1000,150 T1200,180 L1200,300 L0,300 Z"
			class="mountain-mid"
			fill="oklch(75% 0.06 175)"
			opacity="0.5"
		/>

		<!-- Front layer - Legacy (golden) -->
		<path
			d="M800,200 Q900,120 1000,180 T1200,190 L1200,300 L800,300 Z"
			fill="var(--color-legacy)"
			opacity={activeIndex === 4 ? '0.6' : '0.3'}
			class="transition-opacity duration-300"
		/>

		<!-- Front layer - Support (green) -->
		<path
			d="M600,210 Q700,150 800,200 L800,300 L600,300 Z"
			fill="var(--color-support)"
			opacity={activeIndex === 3 ? '0.6' : '0.3'}
			class="transition-opacity duration-300"
		/>

		<!-- Front layer - Connect (purple) -->
		<path
			d="M400,190 Q500,130 600,210 L600,300 L400,300 Z"
			fill="var(--color-connect)"
			opacity={activeIndex === 2 ? '0.6' : '0.3'}
			class="transition-opacity duration-300"
		/>

		<!-- Front layer - Care (coral) -->
		<path
			d="M200,220 Q300,140 400,190 L400,300 L200,300 Z"
			fill="var(--color-care)"
			opacity={activeIndex === 1 ? '0.6' : '0.3'}
			class="transition-opacity duration-300"
		/>

		<!-- Front layer - Plan (teal) -->
		<path
			d="M0,200 Q100,130 200,220 L200,300 L0,300 Z"
			fill="var(--color-plan)"
			opacity={activeIndex === 0 ? '0.6' : '0.3'}
			class="transition-opacity duration-300"
		/>

		<!-- Journey path line -->
		<path
			d="M50,230 Q200,150 350,180 T650,170 T950,190 L1150,210"
			stroke="white"
			stroke-width="3"
			fill="none"
			opacity="0.8"
			stroke-dasharray="10,5"
		/>

		<!-- Progress indicator -->
		<circle
			cx={50 + activeIndex * 275}
			cy={230 - activeIndex * 15}
			r="8"
			fill="white"
			class="transition-all duration-500 ease-in-out"
		>
			<animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
		</circle>
	</svg>

	<!-- Category labels overlay -->
	<div class="absolute inset-0 flex items-end justify-between px-8 pb-4 pointer-events-none">
		<span
			class="text-xs font-medium transition-opacity duration-300"
			style="color: var(--color-plan); opacity: {activeIndex === 0 ? 1 : 0.5}"
		>
			Plan
		</span>
		<span
			class="text-xs font-medium transition-opacity duration-300"
			style="color: var(--color-care); opacity: {activeIndex === 1 ? 1 : 0.5}"
		>
			Care
		</span>
		<span
			class="text-xs font-medium transition-opacity duration-300"
			style="color: var(--color-connect); opacity: {activeIndex === 2 ? 1 : 0.5}"
		>
			Connect
		</span>
		<span
			class="text-xs font-medium transition-opacity duration-300"
			style="color: var(--color-support); opacity: {activeIndex === 3 ? 1 : 0.5}"
		>
			Support
		</span>
		<span
			class="text-xs font-medium transition-opacity duration-300"
			style="color: var(--color-legacy); opacity: {activeIndex === 4 ? 1 : 0.5}"
		>
			Legacy
		</span>
	</div>
</div>

<style>
	.journey-visual {
		background: linear-gradient(to bottom, oklch(95% 0.01 200), oklch(98% 0.005 200));
	}
</style>
