<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const inReviewReviews = $derived(
		data.reviews.filter((r: any) => r.status === 'in_review')
	);
	const pendingReviews = $derived(
		data.reviews.filter((r: any) => r.status === 'pending')
	);

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Mentor Dashboard - Wrap It Up</title>
</svelte:head>

<div class="mentor-dashboard">
	<!-- Header -->
	<div class="header">
		<div>
			<h1 class="text-3xl font-bold">Mentor Dashboard</h1>
			<p class="text-base-content/70 mt-2">
				Welcome back, {data.mentor.display_name}! Review submissions from your mentees.
			</p>
		</div>
	</div>

	<!-- Stats Cards -->
	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-icon">🔍</div>
			<div class="stat-content">
				<div class="stat-value">{inReviewReviews.length}</div>
				<div class="stat-label">In Review</div>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">⏳</div>
			<div class="stat-content">
				<div class="stat-value">{pendingReviews.length}</div>
				<div class="stat-label">Pending</div>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">✅</div>
			<div class="stat-content">
				<div class="stat-value">{data.completedCount}</div>
				<div class="stat-label">Completed</div>
			</div>
		</div>
	</div>

	<!-- In Review Section -->
	{#if inReviewReviews.length > 0}
		<div class="reviews-section">
			<h2 class="section-title">Currently Reviewing</h2>
			<div class="reviews-list">
				{#each inReviewReviews as review}
					<a href="/mentor/reviews/{review.id}" class="review-card in-review">
						<div class="review-header">
							<div class="flex items-center gap-3">
								<div class="text-3xl">{review.journey_icon || '📋'}</div>
								<div>
									<div class="review-journey">{review.journey_name}</div>
									<div class="review-section">{review.section_name}</div>
								</div>
							</div>
							<div class="badge badge-info">In Review</div>
						</div>

						<div class="review-body">
							<div class="review-meta">
								<div class="meta-item">
									<span class="meta-label">User:</span>
									<span class="meta-value">{review.user_name || review.user_email}</span>
								</div>
								<div class="meta-item">
									<span class="meta-label">Submitted:</span>
									<span class="meta-value">{formatDate(review.submitted_at)}</span>
								</div>
							</div>

							{#if review.notes}
								<div class="review-notes">
									<strong>User Notes:</strong>
									<p>{review.notes}</p>
								</div>
							{/if}
						</div>

						<div class="review-footer">
							<span class="review-action">Continue Review →</span>
						</div>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Pending Reviews Section -->
	{#if pendingReviews.length > 0}
		<div class="reviews-section">
			<h2 class="section-title">Available Reviews</h2>
			<div class="reviews-list">
				{#each pendingReviews as review}
					<div class="review-card pending">
						<div class="review-header">
							<div class="flex items-center gap-3">
								<div class="text-3xl">{review.journey_icon || '📋'}</div>
								<div>
									<div class="review-journey">{review.journey_name}</div>
									<div class="review-section">{review.section_name}</div>
								</div>
							</div>
							<div class="badge badge-warning">Pending</div>
						</div>

						<div class="review-body">
							<div class="review-meta">
								<div class="meta-item">
									<span class="meta-label">User:</span>
									<span class="meta-value">{review.user_name || review.user_email}</span>
								</div>
								<div class="meta-item">
									<span class="meta-label">Submitted:</span>
									<span class="meta-value">{formatDate(review.submitted_at)}</span>
								</div>
							</div>

							{#if review.notes}
								<div class="review-notes">
									<strong>User Notes:</strong>
									<p>{review.notes}</p>
								</div>
							{/if}
						</div>

						<div class="review-footer">
							<form method="POST" action="?/claimReview" use:enhance>
								<input type="hidden" name="review_id" value={review.id} />
								<button type="submit" class="btn btn-primary btn-sm">
									Start Review
								</button>
							</form>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Empty State -->
	{#if data.reviews.length === 0}
		<div class="empty-state">
			<div class="text-6xl mb-4">📝</div>
			<h3 class="text-xl font-semibold mb-2">No Reviews Yet</h3>
			<p class="text-base-content/70">
				When users submit sections for review, they'll appear here.
			</p>
		</div>
	{/if}
</div>

<style>
	.mentor-dashboard {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.header {
		margin-bottom: 2rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: hsl(var(--b1));
		border-radius: 0.5rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.stat-icon {
		font-size: 2.5rem;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 700;
		color: hsl(var(--p));
	}

	.stat-label {
		font-size: 0.875rem;
		color: hsl(var(--bc) / 0.6);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.reviews-section {
		margin-bottom: 2rem;
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 1rem;
	}

	.reviews-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.review-card {
		background: hsl(var(--b1));
		border-radius: 0.5rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
		transition: all 0.2s;
		text-decoration: none;
		color: inherit;
		display: block;
	}

	.review-card.in-review {
		border-left: 4px solid hsl(var(--in));
	}

	.review-card.pending {
		border-left: 4px solid hsl(var(--wa));
	}

	.review-card.in-review:hover {
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
		transform: translateY(-2px);
	}

	.review-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid hsl(var(--b2));
	}

	.review-journey {
		font-size: 0.875rem;
		color: hsl(var(--bc) / 0.6);
	}

	.review-section {
		font-size: 1.125rem;
		font-weight: 600;
	}

	.review-body {
		margin-bottom: 1rem;
	}

	.review-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		margin-bottom: 1rem;
	}

	.meta-item {
		display: flex;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.meta-label {
		color: hsl(var(--bc) / 0.6);
	}

	.meta-value {
		font-weight: 500;
	}

	.review-notes {
		background: hsl(var(--b2));
		padding: 1rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.review-notes p {
		margin-top: 0.5rem;
		margin-bottom: 0;
		white-space: pre-wrap;
	}

	.review-footer {
		display: flex;
		justify-content: flex-end;
		padding-top: 1rem;
		border-top: 1px solid hsl(var(--b2));
	}

	.review-action {
		color: hsl(var(--p));
		font-weight: 500;
		font-size: 0.875rem;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: hsl(var(--b1));
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
	}

	@media (max-width: 768px) {
		.mentor-dashboard {
			padding: 1rem;
		}

		.review-header {
			flex-direction: column;
			gap: 1rem;
		}

		.review-meta {
			flex-direction: column;
			gap: 0.5rem;
		}
	}
</style>
