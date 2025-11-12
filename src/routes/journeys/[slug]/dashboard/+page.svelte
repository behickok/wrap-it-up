<script lang="ts">
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import { exportToPDF } from '$lib/pdfExport';
	import { getMotivationalMessage } from '$lib/readinessScore';
	import SectionContent from '$lib/components/SectionContent.svelte';
	import SubmitForReview from '$lib/components/SubmitForReview.svelte';
	import BookSession from '$lib/components/BookSession.svelte';

let { data }: { data: PageData } = $props();
console.log('sectionData.credentials', data.sectionData?.credentials);

let isExporting = $state(false);
	let exportStatus = $state<{ type: 'success' | 'error'; message: string } | null>(null);
	let activeCategory = $state<number>(data.categories[0]?.id || 0);
	let activeSection = $state<string>('');
	let isUserScrolling = $state(false);
	let showScrollTop = $state(false);

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
			setTimeout(() => {
				exportStatus = null;
			}, 5000);
		}
	}

	const sectionsInCategory = $derived(
		data.sectionsByCategory[activeCategory] || []
	);

	const activeSectionData = $derived(
		sectionsInCategory.find((section: any) => section.slug === activeSection)
	);

	const motivationalMessage = $derived(
		getMotivationalMessage(data.completionPercentage)
	);

	// Update active section when category changes to first section in that category
	$effect(() => {
		const firstSection = sectionsInCategory[0];
		if (firstSection && !activeSection) {
			activeSection = firstSection.slug;
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

			showScrollTop = window.scrollY > 400;

			const sectionElements = sectionsInCategory.map((section: any) => ({
				id: section.slug,
				element: document.getElementById(`section-${section.slug}`)
			})).filter((item: any) => item.element);

			const scrollPosition = window.scrollY + 200;

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

		handleScroll();

		window.addEventListener('scroll', handleScroll, { passive: true });

		return () => {
			window.removeEventListener('scroll', handleScroll);
			clearTimeout(timeoutId);
		};
	});

	function getCategoryScore(categoryId: number): number {
		const categorySections = data.sectionsByCategory[categoryId] || [];
		if (categorySections.length === 0) return 0;

		const totalScore = categorySections.reduce(
			(sum: number, section: any) => sum + (data.progressMap[section.id]?.score || 0),
			0
		);
		return Math.round(totalScore / categorySections.length);
	}

	function scrollToTop() {
		if (typeof window === 'undefined') return;
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function getSectionProgress(sectionId: number): any {
		return data.progressMap[sectionId] || { score: 0, is_completed: false };
	}

	function getSectionReview(sectionId: number): any {
		return data.reviewsMap?.[sectionId] || null;
	}
</script>

<svelte:head>
	<title>{data.journey.name} Dashboard - Wrap It Up</title>
</svelte:head>

<div class="journey-dashboard">
	<!-- Journey Header -->
	<div class="export-header">
		<div class="flex items-center gap-4 mb-4">
			<div class="text-5xl">{data.journey.icon || '📋'}</div>
			<div>
				<h1 class="text-3xl font-bold">{data.journey.name}</h1>
				<p class="text-sm text-base-content/70">
					{data.subscription.tier_name} Plan • {data.completionPercentage}% Complete
				</p>
			</div>
		</div>

		<div class="export-info">
			<h2 class="export-title">Your Progress</h2>
			<p class="export-description">
				{motivationalMessage} - {data.sectionsCompleted} of {data.sectionsTotal} sections completed
			</p>
		</div>

		<div class="flex gap-2">
			<a href="/journeys" class="btn btn-ghost btn-sm">
				← All Journeys
			</a>
			<BookSession
				userJourneyId={data.subscription.id}
				journeyName={data.journey.name}
				tierSlug={data.subscription.tier_slug}
				mentors={data.mentors || []}
			/>
			{#if data.journey.slug === 'care'}
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
						Export PDF
					{/if}
				</button>
			{/if}
		</div>
	</div>

	{#if exportStatus}
		<div class="alert alert-{exportStatus.type === 'success' ? 'success' : 'error'} mb-4">
			<span>{exportStatus.message}</span>
		</div>
	{/if}

	<!-- Category Tabs -->
	<div class="tabs-container">
		<div role="tablist" class="tabs tabs-bordered">
			{#each data.categories as category}
				{@const score = getCategoryScore(category.id)}
				<button
					role="tab"
					class="tab"
					class:tab-active={activeCategory === category.id}
					onclick={() => { activeCategory = category.id; }}
				>
					<span class="tab-icon">{category.icon || '📂'}</span>
					<span class="tab-text">{category.name}</span>
					<span class="tab-score">{score}%</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Main Content Area -->
	<div class="content-grid">
		<!-- Sidebar -->
		<aside class="sidebar">
			<div class="sidebar-content">
				<h3 class="sidebar-title">Sections</h3>
				<ul class="section-list">
					{#each sectionsInCategory as section}
						{@const progress = getSectionProgress(section.id)}
						<li>
							<button
								class="section-link"
								class:active={activeSection === section.slug}
								onclick={() => { activeSection = section.slug; }}
							>
								<div class="flex-1">
									<div class="section-link-title">{section.name}</div>
									{#if section.is_required}
										<div class="badge badge-xs badge-warning mt-1">Required</div>
									{/if}
								</div>
								<div class="section-score" class:complete={progress.is_completed}>
									{Math.round(progress.score)}%
								</div>
							</button>
						</li>
					{/each}
				</ul>
			</div>
		</aside>

		<!-- Main Content -->
			<main class="main-content">
				{#each sectionsInCategory as section}
					{@const review = getSectionReview(section.id)}
					{@const progress = getSectionProgress(section.id)}
					<section id="section-{section.slug}" class="content-section">
					<div class="section-header">
						<div class="section-header-top">
							<div>
								<h2 class="section-title">{section.name}</h2>
								{#if section.description}
									<p class="section-description">{section.description}</p>
								{/if}
							</div>
								<SubmitForReview
									sectionId={section.id}
									sectionName={section.name}
									userJourneyId={data.subscription.id}
									tierSlug={data.subscription.tier_slug}
									currentReview={review}
								/>
						</div>
							<div class="section-progress">
							<div class="progress-label">
								<span>Progress: {Math.round(progress.score)}%</span>
								{#if progress.is_completed}
									<span class="badge badge-success badge-sm">✓ Complete</span>
								{/if}
							</div>
							<progress class="progress progress-primary w-full" value={progress.score} max="100"></progress>
						</div>
					</div>

					<div class="section-body">
						<SectionContent
							sectionId={section.slug}
							{...data}
						/>
					</div>
				</section>
			{/each}
		</main>
	</div>

	<!-- Scroll to Top Button -->
	{#if showScrollTop}
		<button
			class="btn btn-circle btn-primary fixed bottom-8 right-8 shadow-lg z-50"
			onclick={scrollToTop}
			aria-label="Scroll to top"
		>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
			</svg>
		</button>
	{/if}
</div>

<style>
	.journey-dashboard {
		max-width: 100%;
		margin: 0 auto;
	}

	.export-header {
		background: linear-gradient(135deg, hsl(var(--p)) 0%, hsl(var(--s)) 100%);
		color: hsl(var(--pc));
		padding: 2rem;
		border-radius: 1rem;
		margin-bottom: 2rem;
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
	}

	.export-info {
		margin: 1rem 0;
	}

	.export-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}

	.export-description {
		opacity: 0.9;
	}

	.export-button {
		gap: 0.5rem;
	}

	.tabs-container {
		background: hsl(var(--b1));
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 2rem;
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
	}

	.tabs {
		width: 100%;
		overflow-x: auto;
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		white-space: nowrap;
	}

	.tab-icon {
		font-size: 1.25rem;
	}

	.tab-score {
		font-weight: 600;
		opacity: 0.7;
		font-size: 0.875rem;
	}

	.content-grid {
		display: grid;
		grid-template-columns: 280px 1fr;
		gap: 2rem;
		align-items: start;
	}

	@media (max-width: 1024px) {
		.content-grid {
			grid-template-columns: 1fr;
		}

		.sidebar {
			position: static;
			max-height: none;
		}
	}

	.sidebar {
		position: sticky;
		top: 2rem;
		max-height: calc(100vh - 4rem);
		overflow-y: auto;
	}

	.sidebar-content {
		background: hsl(var(--b1));
		border-radius: 0.5rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
	}

	.sidebar-title {
		font-size: 1.125rem;
		font-weight: 700;
		margin-bottom: 1rem;
	}

	.section-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.section-link {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.75rem;
		border-radius: 0.5rem;
		background: transparent;
		border: none;
		text-align: left;
		cursor: pointer;
		transition: all 0.2s;
		width: 100%;
	}

	.section-link:hover {
		background: hsl(var(--b2));
	}

	.section-link.active {
		background: hsl(var(--p) / 0.1);
		border-left: 3px solid hsl(var(--p));
	}

	.section-link-title {
		font-weight: 500;
		font-size: 0.875rem;
	}

	.section-score {
		font-size: 0.75rem;
		font-weight: 600;
		opacity: 0.6;
		min-width: 3rem;
		text-align: right;
	}

	.section-score.complete {
		color: hsl(var(--su));
		opacity: 1;
	}

	.main-content {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.content-section {
		background: hsl(var(--b1));
		border-radius: 0.5rem;
		padding: 2rem;
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
	}

	.section-header {
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid hsl(var(--b2));
	}

	.section-header-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	@media (max-width: 768px) {
		.section-header-top {
			flex-direction: column;
			align-items: stretch;
		}
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}

	.section-description {
		color: hsl(var(--bc) / 0.7);
		margin-bottom: 0;
	}

	.section-progress {
		margin-top: 1rem;
	}

	.progress-label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
	}

	.section-body {
		/* Content from SectionContent component will go here */
	}
</style>
