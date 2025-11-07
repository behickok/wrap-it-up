<script lang="ts">
	import { SECTIONS, JOURNEY_CATEGORIES, type JourneyCategory } from '$lib/types';
	import { getMotivationalMessage } from '$lib/readinessScore';
	import JourneyTabs from '$lib/components/JourneyTabs.svelte';
	import JourneyVisual from '$lib/components/JourneyVisual.svelte';
	import SectionContent from '$lib/components/SectionContent.svelte';
	import { exportToPDF } from '$lib/pdfExport';

	let { data } = $props();

	let isExporting = $state(false);
	let exportStatus = $state<{ type: 'success' | 'error'; message: string } | null>(null);

	async function handleExport() {
		isExporting = true;
		exportStatus = null;

		try {
			const result = await exportToPDF();
			if (result.success) {
				exportStatus = {
					type: 'success',
					message: `PDF exported successfully: ${result.filename}`
				};
			} else {
				exportStatus = {
					type: 'error',
					message: result.error || 'Failed to export PDF'
				};
			}
		} catch (error) {
			exportStatus = {
				type: 'error',
				message: 'An unexpected error occurred'
			};
		} finally {
			isExporting = false;
			// Clear status after 5 seconds
			setTimeout(() => {
				exportStatus = null;
			}, 5000);
		}
	}

	const readinessScore = $derived(data.readinessScore);
	const motivationalMessage = $derived(getMotivationalMessage(readinessScore.total_score));

	let activeCategory = $state<JourneyCategory>('plan');
	let activeSection = $state<string>('legal'); // First section in 'plan' category
	let isUserScrolling = $state(false);

	const sectionsInCategory = $derived(
		SECTIONS.filter((section) => section.category === activeCategory)
	);

	const activeSectionData = $derived(
		SECTIONS.find((section) => section.id === activeSection)
	);

	// Update active section when category changes to first section in that category
	$effect(() => {
		const firstSectionInCategory = SECTIONS.find((s) => s.category === activeCategory);
		if (firstSectionInCategory) {
			activeSection = firstSectionInCategory.id;
		}
	});

	// Scroll spy: update active section based on scroll position
	$effect(() => {
		if (typeof window === 'undefined') return;

		let timeoutId: number | undefined;

		const handleScroll = () => {
			isUserScrolling = true;
			clearTimeout(timeoutId);

			timeoutId = window.setTimeout(() => {
				isUserScrolling = false;
			}, 150);

			const sectionElements = sectionsInCategory.map(section => ({
				id: section.id,
				element: document.getElementById(`section-${section.id}`)
			})).filter(item => item.element);

			// Find which section is currently in view
			const scrollPosition = window.scrollY + 200; // Offset for better UX

			for (let i = sectionElements.length - 1; i >= 0; i--) {
				const { id, element } = sectionElements[i];
				if (element && element.offsetTop <= scrollPosition) {
					if (activeSection !== id) {
						activeSection = id;
					}
					break;
				}
			}
		};

		window.addEventListener('scroll', handleScroll, { passive: true });

		return () => {
			window.removeEventListener('scroll', handleScroll);
			clearTimeout(timeoutId);
		};
	});

	function getCategoryScore(category: JourneyCategory): number {
		const categorySections = SECTIONS.filter((s) => s.category === category);
		if (categorySections.length === 0) return 0;

		const totalScore = categorySections.reduce(
			(sum, section) => sum + (readinessScore.sections[section.id] || 0),
			0
		);
		return Math.round(totalScore / categorySections.length);
	}
</script>

<div class="journey-dashboard">
	<!-- Export Section -->
	<div class="export-header">
		<div class="export-info">
			<h2 class="export-title">Your End-of-Life Planning Document</h2>
			<p class="export-description">
				Export your completed information to a professionally formatted PDF document
			</p>
		</div>
		<button
			class="btn btn-primary export-button"
			onclick={handleExport}
			disabled={isExporting}
		>
			{#if isExporting}
				<span class="loading loading-spinner loading-sm"></span>
				Generating PDF...
			{:else}
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
				Export to PDF
			{/if}
		</button>
	</div>

	{#if exportStatus}
		<div class="alert {exportStatus.type === 'success' ? 'alert-success' : 'alert-error'} mb-6">
			<svg class="w-6 h-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
				{#if exportStatus.type === 'success'}
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
				{:else}
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
				{/if}
			</svg>
			<span>{exportStatus.message}</span>
		</div>
	{/if}

	<div class="journey-visual-container mb-8 overflow-hidden rounded-2xl">
		<JourneyVisual {activeCategory} />
	</div>

	<JourneyTabs bind:activeCategory />

	{#key activeCategory}
		{@const currentCategoryInfo = JOURNEY_CATEGORIES.find((c) => c.id === activeCategory)}
		{@const categoryScore = getCategoryScore(activeCategory)}

		<div class="sections-layout">
			<!-- Sidebar Navigation -->
			<nav class="sections-sidebar">
				<div class="sidebar-sticky">
					<h3 class="sidebar-title" style="color: {currentCategoryInfo?.color}">
						{currentCategoryInfo?.name} Sections
					</h3>
					<ul class="sections-menu">
						{#each sectionsInCategory as section}
							{@const sectionScore = readinessScore.sections[section.id] || 0}
							<li>
								<button
									onclick={() => {
										activeSection = section.id;
										document.getElementById(`section-${section.id}`)?.scrollIntoView({
											behavior: 'smooth',
											block: 'start'
										});
									}}
									class="section-menu-item"
									class:active={activeSection === section.id}
									style="--category-color: {currentCategoryInfo?.color}"
								>
									<span class="section-menu-name">{section.name}</span>
									{#if sectionScore === 100}
										<span class="section-menu-check">✓</span>
									{/if}
								</button>
							</li>
						{/each}
					</ul>
				</div>
			</nav>

			<!-- Main Content Area with all sections -->
			<div class="sections-content">
				{#each sectionsInCategory as section}
					{@const sectionScore = readinessScore.sections[section.id] || 0}
					<div
						id="section-{section.id}"
						class="section-block"
						data-section-id={section.id}
					>
						<SectionContent sectionId={section.id} {data} />
					</div>
				{/each}
			</div>
		</div>
	{/key}

	<!-- <div class="help-card card shadow-xl">
		<div class="card-body">
			<h2 class="card-title flex items-center gap-2">
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				Need Help?
			</h2>
			<p class="leading-relaxed help-text">
				Each section has an "Ask AI" feature to help you think through what information to
				include. Use the journey tabs above to navigate between different life planning areas.
			</p>
		</div>
	</div> -->
</div>

<style>
	/* Export Header */
	.export-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 2rem;
		padding: 2rem;
		margin-bottom: 2rem;
		background: linear-gradient(
			135deg,
			color-mix(in oklch, var(--color-primary) 12%, var(--color-base-100)),
			color-mix(in oklch, var(--color-primary) 6%, var(--color-base-100))
		);
		border: 1px solid color-mix(in oklch, var(--color-primary) 30%, transparent 70%);
		border-radius: 1rem;
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.06),
			0 2px 4px -1px rgba(0, 0, 0, 0.04);
	}

	.export-info {
		flex: 1;
	}

	.export-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: color-mix(in oklch, var(--color-base-content) 90%, transparent 10%);
		margin-bottom: 0.5rem;
	}

	.export-description {
		font-size: 0.9375rem;
		color: color-mix(in oklch, var(--color-base-content) 70%, transparent 30%);
	}

	.export-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
		font-weight: 600;
		white-space: nowrap;
		transition: all 0.2s ease;
	}

	.export-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	@media (max-width: 768px) {
		.export-header {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.export-button {
			width: 100%;
			justify-content: center;
		}

		.export-title {
			font-size: 1.25rem;
		}
	}

	.journey-visual-container {
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.08),
			0 4px 6px -2px rgba(0, 0, 0, 0.04),
			inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
		border: 1px solid color-mix(in oklch, var(--color-base-300) 60%, transparent 40%);
	}

	.help-card {
		background: linear-gradient(
			135deg,
			color-mix(in oklch, var(--color-accent) 12%, var(--color-base-100)),
			color-mix(in oklch, var(--color-accent) 6%, var(--color-base-100))
		);
		border: 1px solid color-mix(in oklch, var(--color-accent) 30%, transparent 70%);
	}

	.help-text {
		color: color-mix(in oklch, var(--color-base-content) 85%, transparent 15%);
		opacity: 0.9;
	}

	/* Sections layout with sidebar */
	.sections-layout {
		display: flex;
		gap: 2rem;
		align-items: flex-start;
		margin-bottom: 2rem;
	}

	/* Sidebar Navigation */
	.sections-sidebar {
		width: 280px;
		flex-shrink: 0;
		position: sticky;
		top: 4rem;
		align-self: flex-start;
	}

	.sidebar-sticky {
		max-height: calc(100vh - 2rem);
		overflow-y: auto;
		background: linear-gradient(
			135deg,
			color-mix(in oklch, var(--color-base-100) 98%, var(--color-primary)),
			var(--color-base-100)
		);
		border: 1px solid var(--color-base-300);
		border-radius: 1rem;
		padding: 1.5rem;
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.06),
			0 2px 4px -1px rgba(0, 0, 0, 0.04);
		scrollbar-width: thin;
	}

	.sidebar-sticky::-webkit-scrollbar {
		width: 6px;
	}

	.sidebar-sticky::-webkit-scrollbar-track {
		background: transparent;
	}

	.sidebar-sticky::-webkit-scrollbar-thumb {
		background: color-mix(in oklch, var(--color-base-content) 20%, transparent 80%);
		border-radius: 3px;
	}

	.sidebar-title {
		font-size: 1.125rem;
		font-weight: 700;
		margin-bottom: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 2px solid var(--color-base-300);
	}

	.sections-menu {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.section-menu-item {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		font-size: 0.9375rem;
		font-weight: 600;
		color: color-mix(in oklch, var(--color-base-content) 85%, transparent 15%);
	}

	.section-menu-item:hover {
		background: color-mix(in oklch, var(--category-color) 8%, var(--color-base-100));
		border-color: color-mix(in oklch, var(--category-color) 20%, transparent 80%);
	}

	.section-menu-item.active {
		background: linear-gradient(
			135deg,
			color-mix(in oklch, var(--category-color) 15%, var(--color-base-100)),
			color-mix(in oklch, var(--category-color) 8%, var(--color-base-100))
		);
		border-color: color-mix(in oklch, var(--category-color) 40%, transparent 60%);
		color: color-mix(in oklch, var(--category-color) 70%, var(--color-base-content) 30%);
	}

	.section-menu-name {
		flex: 1;
	}

	.section-menu-check {
		flex-shrink: 0;
		width: 1.5rem;
		height: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-success);
		color: var(--color-success-content);
		border-radius: 50%;
		font-size: 0.75rem;
		font-weight: 700;
	}

	/* Main content area */
	.sections-content {
		flex: 1;
		min-width: 0;
	}

	.section-block {
		scroll-margin-top: 2rem;
	}

	.section-block:not(:last-child) {
		margin-bottom: 3rem;
	}

	/* Mobile: Hide sidebar, show sections stacked */
	@media (max-width: 1024px) {
		.sections-layout {
			flex-direction: column;
		}

		.sections-sidebar {
			width: 100%;
			order: 1;
		}

		.sections-menu {
			flex-direction: row;
			flex-wrap: wrap;
			gap: 0.5rem;
		}

		.section-menu-item {
			flex: 1;
			min-width: 150px;
		}

		.sections-content {
			order: 2;
		}
	}

	@media (max-width: 768px) {
		/* On smaller devices the sidebar sits above content, so sticky isn't needed */
		.sections-sidebar {
			position: static;
			top: 0;
		}

		.sidebar-sticky {
			max-height: none;
			overflow: visible;
		}
	}

	@media (max-width: 640px) {
		.sections-menu {
			flex-direction: column;
		}

		.section-menu-item {
			min-width: 100%;
		}
	}
</style>
