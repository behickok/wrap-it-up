<script lang="ts">
	/**
	 * Simple Line Chart Component
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
	}

	let {
		data,
		color = 'oklch(var(--p))',
		height = 200,
		showGrid = true,
		showLabels = true
	}: Props = $props();

	// Chart dimensions
	const padding = { top: 20, right: 20, bottom: showLabels ? 60 : 20, left: 50 };
	const chartWidth = $derived(800);
	const chartHeight = $derived(height);
	const innerWidth = $derived(chartWidth - padding.left - padding.right);
	const innerHeight = $derived(chartHeight - padding.top - padding.bottom);

	// Calculate scales
	const maxValue = $derived(Math.max(...data.map((d) => d.value), 1));
	const minValue = $derived(Math.min(...data.map((d) => d.value), 0));
	const valueRange = $derived(maxValue - minValue || 1);

	// Scale functions
	const xScale = $derived((index: number) => (index / Math.max(data.length - 1, 1)) * innerWidth);
	const yScale = $derived(
		(value: number) => innerHeight - ((value - minValue) / valueRange) * innerHeight
	);

	// Generate path for line
	const linePath = $derived(() => {
		if (data.length === 0) return '';

		const points = data.map((d, i) => `${xScale(i)},${yScale(d.value)}`);
		return `M ${points.join(' L ')}`;
	});

	// Generate area fill path
	const areaPath = $derived(() => {
		if (data.length === 0) return '';

		const points = data.map((d, i) => `${xScale(i)},${yScale(d.value)}`);
		const areaPoints = [
			`M ${xScale(0)},${innerHeight}`,
			...points.map((p, i) => (i === 0 ? `L ${p}` : `L ${p}`)),
			`L ${xScale(data.length - 1)},${innerHeight}`,
			'Z'
		];
		return areaPoints.join(' ');
	});

	// Grid lines
	const gridLines = $derived(() => {
		const lines = [];
		const numLines = 5;
		for (let i = 0; i <= numLines; i++) {
			const y = (innerHeight / numLines) * i;
			const value = maxValue - (valueRange / numLines) * i;
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

	// Label display logic
	const displayLabels = $derived(() => {
		const maxLabels = 10;
		if (data.length <= maxLabels) return data.map((d, i) => ({ index: i, label: d.label }));

		const step = Math.ceil(data.length / maxLabels);
		return data
			.map((d, i) => ({ index: i, label: d.label }))
			.filter((_, i) => i % step === 0);
	});
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
			<!-- Area fill -->
			<path d={areaPath()} fill={color} opacity="0.1" />

			<!-- Line -->
			<path d={linePath()} stroke={color} stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" />

			<!-- Data points -->
			{#each data as point, i}
				<circle cx={xScale(i)} cy={yScale(point.value)} r="4" fill={color}>
					<title>{point.label}: {formatValue(point.value)}</title>
				</circle>
			{/each}

			<!-- X-axis labels -->
			{#if showLabels}
				{#each displayLabels() as item}
					<text
						x={xScale(item.index)}
						y={innerHeight + 20}
						text-anchor="middle"
						class="text-xs fill-base-content/60"
						transform="rotate(-45, {xScale(item.index)}, {innerHeight + 20})"
					>
						{item.label}
					</text>
				{/each}
			{/if}
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
</style>
