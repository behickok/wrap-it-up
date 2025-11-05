<script>
	import { SECTIONS } from '$lib/types';
	import { getCompletionColor, getMotivationalMessage } from '$lib/readinessScore';

	let { data } = $props();

	const readinessScore = $derived(data.readinessScore);
	const motivationalMessage = $derived(getMotivationalMessage(readinessScore.total_score));
</script>

<div class="dashboard">
	<div class="welcome-section">
		<h2>Welcome to Your Planning Workbook</h2>
		<p class="motivation">{motivationalMessage}</p>
		<div class="score-details">
			<div class="score-card">
				<div class="score-big">{readinessScore.total_score}%</div>
				<div class="score-description">Overall Readiness</div>
			</div>
		</div>
	</div>

	<div class="sections-grid">
		{#each SECTIONS as section}
			{@const sectionScore = readinessScore.sections[section.id] || 0}
			{@const color = getCompletionColor(sectionScore)}

			<a href="/section/{section.id}" class="section-card">
				<div class="section-header">
					<h3>{section.name}</h3>
					<div class="progress-badge {color}">{sectionScore}%</div>
				</div>
				<div class="progress-bar">
					<div class="progress-fill {color}" style="width: {sectionScore}%"></div>
				</div>
				<div class="section-footer">
					<span class="weight-indicator">Priority: {section.weight}/10</span>
					<span class="status">
						{#if sectionScore === 0}
							Not started
						{:else if sectionScore < 100}
							In progress
						{:else}
							Complete
						{/if}
					</span>
				</div>
			</a>
		{/each}
	</div>

	<div class="help-section">
		<div class="help-card">
			<h3>Need Help?</h3>
			<p>
				Each section has an "Ask AI" feature to help you think through what information to include.
				Simply click on any section to get started.
			</p>
		</div>
	</div>
</div>

<style>
	.dashboard {
		max-width: 100%;
	}

	.welcome-section {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.welcome-section h2 {
		margin: 0 0 1rem 0;
		color: #2d3748;
		font-size: 1.8rem;
	}

	.motivation {
		color: #4a5568;
		font-size: 1.1rem;
		margin: 0 0 1.5rem 0;
	}

	.score-details {
		display: flex;
		justify-content: center;
	}

	.score-card {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 2rem;
		border-radius: 12px;
		text-align: center;
		min-width: 200px;
	}

	.score-big {
		font-size: 3rem;
		font-weight: bold;
		line-height: 1;
		margin-bottom: 0.5rem;
	}

	.score-description {
		font-size: 1rem;
		opacity: 0.9;
	}

	.sections-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.section-card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s, box-shadow 0.2s;
		text-decoration: none;
		color: inherit;
		display: block;
	}

	.section-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
	}

	.section-header h3 {
		margin: 0;
		font-size: 1.2rem;
		color: #2d3748;
		flex: 1;
	}

	.progress-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-weight: 600;
		font-size: 0.9rem;
		margin-left: 1rem;
	}

	.progress-badge.green {
		background: #c6f6d5;
		color: #22543d;
	}

	.progress-badge.yellow {
		background: #fef5e7;
		color: #744210;
	}

	.progress-badge.orange {
		background: #fed7d7;
		color: #742a2a;
	}

	.progress-badge.red {
		background: #fed7d7;
		color: #742a2a;
	}

	.progress-bar {
		height: 8px;
		background: #e2e8f0;
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 1rem;
	}

	.progress-fill {
		height: 100%;
		transition: width 0.3s ease;
	}

	.progress-fill.green {
		background: #48bb78;
	}

	.progress-fill.yellow {
		background: #ecc94b;
	}

	.progress-fill.orange {
		background: #ed8936;
	}

	.progress-fill.red {
		background: #f56565;
	}

	.section-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.85rem;
		color: #718096;
	}

	.weight-indicator {
		font-weight: 500;
	}

	.status {
		font-style: italic;
	}

	.help-section {
		margin-top: 2rem;
	}

	.help-card {
		background: linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%);
		border-radius: 12px;
		padding: 2rem;
		text-align: center;
	}

	.help-card h3 {
		margin: 0 0 1rem 0;
		color: #2d3748;
	}

	.help-card p {
		margin: 0;
		color: #4a5568;
		line-height: 1.6;
	}

	@media (max-width: 768px) {
		.sections-grid {
			grid-template-columns: 1fr;
		}

		.score-big {
			font-size: 2.5rem;
		}
	}
</style>
