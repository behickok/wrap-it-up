<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let feedback = $state((data.review as any).feedback || '');
	let isSubmitting = $state(false);

	const review = data.review as any;
	const sectionData = data.sectionData;

	function formatDate(dateString: string): string {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatValue(value: any): string {
		if (value === null || value === undefined || value === '') return 'Not provided';
		if (typeof value === 'boolean') return value ? 'Yes' : 'No';
		if (typeof value === 'object') return JSON.stringify(value, null, 2);
		return String(value);
	}

	function renderSectionData(slug: string, data: any) {
		if (!data) return null;

		// Handle array data (lists)
		if (Array.isArray(data)) {
			if (data.length === 0) {
				return 'No items added yet';
			}
			return data;
		}

		// Handle object data (single forms)
		return data;
	}
</script>

<svelte:head>
	<title>Review: {review.section_name} - Wrap It Up</title>
</svelte:head>

<div class="review-detail">
	<!-- Header -->
	<div class="review-header-bar">
		<a href="/mentor/dashboard" class="btn btn-ghost btn-sm">
			← Back to Dashboard
		</a>
	</div>

	<div class="review-header-card">
		<div class="flex items-start gap-4">
			<div class="text-5xl">{review.journey_icon || '📋'}</div>
			<div class="flex-1">
				<div class="text-sm text-base-content/60 mb-1">{review.journey_name}</div>
				<h1 class="text-2xl font-bold mb-2">{review.section_name}</h1>
				{#if review.section_description}
					<p class="text-sm text-base-content/70">{review.section_description}</p>
				{/if}
			</div>
			<div class="badge badge-lg badge-{review.status === 'completed' ? 'success' : 'info'}">
				{review.status === 'completed' ? 'Completed' : 'In Review'}
			</div>
		</div>

		<div class="review-meta-grid">
			<div class="meta-item">
				<span class="meta-label">User:</span>
				<span class="meta-value">{review.user_name || review.user_email}</span>
			</div>
			<div class="meta-item">
				<span class="meta-label">Submitted:</span>
				<span class="meta-value">{formatDate(review.submitted_at)}</span>
			</div>
			<div class="meta-item">
				<span class="meta-label">Tier:</span>
				<span class="meta-value capitalize">{review.tier_slug}</span>
			</div>
			{#if review.completed_at}
				<div class="meta-item">
					<span class="meta-label">Completed:</span>
					<span class="meta-value">{formatDate(review.completed_at)}</span>
				</div>
			{/if}
		</div>

		{#if review.notes}
			<div class="user-notes">
				<strong class="block mb-2">User's Notes:</strong>
				<p class="whitespace-pre-wrap">{review.notes}</p>
			</div>
		{/if}
	</div>

	<div class="review-content-grid">
		<!-- Section Data Panel -->
		<div class="data-panel">
			<h2 class="panel-title">Section Data</h2>

			{#if sectionData}
				{@const renderedData = renderSectionData(review.section_slug, sectionData)}
				{#if typeof renderedData === 'string'}
					<div class="empty-data">{renderedData}</div>
				{:else if Array.isArray(renderedData)}
					<!-- List view -->
					<div class="data-list">
						{#each renderedData as item, index}
							<div class="data-card">
								<div class="data-card-header">
									<span class="data-card-number">#{index + 1}</span>
								</div>
								<div class="data-fields">
									{#each Object.entries(item) as [key, value]}
										{#if key !== 'id' && key !== 'user_id' && key !== 'created_at' && key !== 'updated_at'}
											<div class="data-field">
												<span class="field-label">{key.replace(/_/g, ' ')}:</span>
												<span class="field-value">{formatValue(value)}</span>
											</div>
										{/if}
									{/each}
								</div>
							</div>
						{/each}
					</div>
				{:else if typeof renderedData === 'object'}
					<!-- Single form view -->
					<div class="data-card">
						<div class="data-fields">
							{#each Object.entries(renderedData) as [key, value]}
								{#if key !== 'id' && key !== 'user_id' && key !== 'created_at' && key !== 'updated_at'}
									<div class="data-field">
										<span class="field-label">{key.replace(/_/g, ' ')}:</span>
										<span class="field-value">{formatValue(value)}</span>
									</div>
								{/if}
							{/each}
						</div>
					</div>
				{/if}
			{:else}
				<div class="empty-data">No data available for this section</div>
			{/if}
		</div>

		<!-- Feedback Panel -->
		<div class="feedback-panel">
			<h2 class="panel-title">Your Feedback</h2>

			{#if form?.message}
				<div class="alert alert-success mb-4">
					<span>{form.message}</span>
				</div>
			{/if}

			{#if form?.error}
				<div class="alert alert-error mb-4">
					<span>{form.error}</span>
				</div>
			{/if}

			{#if review.status !== 'completed'}
				<form method="POST" action="?/submitFeedback" use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						await update();
						isSubmitting = false;
					};
				}}>
					<div class="form-control">
						<label class="label" for="feedback">
							<span class="label-text font-semibold">Feedback for User</span>
						</label>
						<textarea
							id="feedback"
							name="feedback"
							bind:value={feedback}
							class="textarea textarea-bordered h-48"
							placeholder="Provide constructive feedback, suggestions, and guidance for this section..."
							required
						></textarea>
						<label class="label">
							<span class="label-text-alt text-base-content/60">
								Be specific and actionable. Help them improve their plan.
							</span>
						</label>
					</div>

					<div class="button-group">
						<button
							type="submit"
							class="btn btn-primary"
							disabled={isSubmitting || !feedback.trim()}
						>
							{#if isSubmitting}
								<span class="loading loading-spinner loading-sm"></span>
								Submitting...
							{:else}
								✓ Approve & Complete Review
							{/if}
						</button>

						<button
							type="submit"
							formaction="?/requestChanges"
							class="btn btn-outline"
							disabled={isSubmitting || !feedback.trim()}
						>
							💬 Save Feedback (Keep In Review)
						</button>
					</div>
				</form>
			{:else}
				<!-- Completed review - show feedback -->
				<div class="completed-feedback">
					<div class="alert alert-success mb-4">
						<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<span>Review completed on {formatDate(review.completed_at)}</span>
					</div>

					<div class="feedback-display">
						<strong class="block mb-2">Your Feedback:</strong>
						<p class="whitespace-pre-wrap">{review.feedback}</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.review-detail {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
	}

	.review-header-bar {
		margin-bottom: 1rem;
	}

	.review-header-card {
		background: hsl(var(--b1));
		border-radius: 0.5rem;
		padding: 2rem;
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
		margin-bottom: 2rem;
	}

	.review-meta-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid hsl(var(--b2));
	}

	.meta-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.meta-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--bc) / 0.6);
	}

	.meta-value {
		font-weight: 500;
		font-size: 0.875rem;
	}

	.user-notes {
		margin-top: 1.5rem;
		padding: 1rem;
		background: hsl(var(--b2));
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.review-content-grid {
		display: grid;
		grid-template-columns: 1fr 400px;
		gap: 2rem;
		align-items: start;
	}

	@media (max-width: 1024px) {
		.review-content-grid {
			grid-template-columns: 1fr;
		}

		.feedback-panel {
			order: -1;
		}
	}

	.data-panel,
	.feedback-panel {
		background: hsl(var(--b1));
		border-radius: 0.5rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
	}

	.feedback-panel {
		position: sticky;
		top: 2rem;
	}

	.panel-title {
		font-size: 1.25rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
	}

	.data-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.data-card {
		background: hsl(var(--b2));
		border-radius: 0.375rem;
		padding: 1rem;
	}

	.data-card-header {
		margin-bottom: 0.75rem;
	}

	.data-card-number {
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--p));
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.data-fields {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.data-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.field-label {
		font-size: 0.75rem;
		text-transform: capitalize;
		color: hsl(var(--bc) / 0.6);
	}

	.field-value {
		font-size: 0.875rem;
		font-weight: 500;
		word-break: break-word;
	}

	.empty-data {
		text-align: center;
		padding: 2rem;
		color: hsl(var(--bc) / 0.5);
		font-style: italic;
	}

	.button-group {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
		flex-wrap: wrap;
	}

	.completed-feedback {
		margin-top: 1rem;
	}

	.feedback-display {
		padding: 1rem;
		background: hsl(var(--b2));
		border-radius: 0.375rem;
	}

	@media (max-width: 768px) {
		.review-detail {
			padding: 1rem;
		}

		.review-header-card {
			padding: 1.5rem;
		}

		.button-group {
			flex-direction: column;
		}

		.button-group button {
			width: 100%;
		}
	}
</style>
