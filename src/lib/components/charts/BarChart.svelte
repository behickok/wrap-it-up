<script lang="ts">
	/**
	 * Simple Bar Chart Component
	 * Uses SVG for lightweight, responsive charts
	 */

	interface ChartData {
		label: string;
		value: number;
	}

	interface Props {
		data: ChartData[];
		color?: string;
		height?: number;
		showGrid?: boolean;
		showLabels?: boolean;
		maxValue?: number;
	}

	let {
		data,
		color = 'oklch(var(--p))',
		height = 200,
		showGrid = true,
		showLabels = true,
		maxValue
	}: Props = $props();

	// Chart dimensions
	const padding = { top: 20, right: 20, bottom: showLabels ? 80 : 20, left: 50 };
	const chartWidth = $derived(800);
	const chartHeight = $derived(height);
	const innerWidth = $derived(chartWidth - padding.left - padding.right);
	const innerHeight = $derived(chartHeight - padding.top - padding.bottom);

	// Calculate scales
	const calculatedMaxValue = $derived(maxValue ?? Math.max(...data.map((d) => d.value), 1));
	const minValue = 0;
	const valueRange = $derived(calculatedMaxValue - minValue || 1);

	// Bar dimensions
	const barWidth = $derived(innerWidth / Math.max(data.length, 1) * 0.8);
	const barSpacing = $derived(innerWidth / Math.max(data.length, 1));

	// Scale functions
	const xScale = $derived((index: number) => index * barSpacing + barSpacing / 2);
	const yScale = $derived(
		(value: number) => innerHeight - ((value - minValue) / valueRange) * innerHeight
	);
	const heightScale = $derived((value: number) => ((value - minValue) / valueRange) * innerHeight);

	// Grid lines
	const gridLines = $derived(() => {
		const lines = [];
		const numLines = 5;
		for (let i = 0; i <= numLines; i++) {
			const y = (innerHeight / numLines) * i;
			const value = calculatedMaxValue - (valueRange / numLines) * i;
			lines.push({ y, value });
		}
		return lines;
	});

	// Format number
	function formatValue(value: number): string {
		if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
		if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
		return value.toFixed(0);
	}

	// Truncate label
	function truncateLabel(label: string, maxLength: number = 15): string {
		return label.length > maxLength ? label.substring(0, maxLength) + '...' : label;
	}
</script>

<div class="chart-container">
	<svg
		viewBox="0 0 {chartWidth} {chartHeight}"
		class="w-full"
		preserveAspectRatio="xMidYMid meet"
	>
		<!-- Grid lines -->
		{#if showGrid}
			{#each gridLines() as line}
				<line
					x1={padding.left}
					y1={padding.top + line.y}
					x2={chartWidth - padding.right}
					y2={padding.top + line.y}
					stroke="oklch(var(--bc) / 0.1)"
					stroke-width="1"
				/>
				<text
					x={padding.left - 10}
					y={padding.top + line.y + 4}
					text-anchor="end"
					class="text-xs fill-base-content/60"
				>
					{formatValue(line.value)}
				</text>
			{/each}
		{/if}

		<!-- Chart group -->
		<g transform="translate({padding.left}, {padding.top})">
			<!-- Bars -->
			{#each data as point, i}
				{@const barHeight = heightScale(point.value)}
				{@const barY = yScale(point.value)}

				<g class="bar-group">
					<!-- Bar -->
					<rect
						x={xScale(i) - barWidth / 2}
						y={barY}
						width={barWidth}
						height={barHeight}
						fill={color}
						rx="4"
						class="transition-all hover:opacity-80"
					>
						<title>{point.label}: {formatValue(point.value)}</title>
					</rect>

					<!-- Value label on top of bar -->
					<text
						x={xScale(i)}
						y={barY - 5}
						text-anchor="middle"
						class="text-xs fill-base-content/80 font-semibold"
					>
						{formatValue(point.value)}
					</text>

					<!-- X-axis labels -->
					{#if showLabels}
						<text
							x={xScale(i)}
							y={innerHeight + 15}
							text-anchor="end"
							class="text-xs fill-base-content/60"
							transform="rotate(-45, {xScale(i)}, {innerHeight + 15})"
						>
							{truncateLabel(point.label)}
						</text>
					{/if}
				</g>
			{/each}
		</g>
	</svg>
</div>

<style>
	.chart-container {
		width: 100%;
		overflow: hidden;
	}

	text {
		font-size: 11px;
	}

	.bar-group:hover rect {
		filter: brightness(1.1);
	}
</style>
