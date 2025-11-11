<script lang="ts">
	import { enhance } from '$app/forms';

	interface Props {
		sectionId: number;
		sectionName: string;
		userJourneyId: number;
		tierSlug: string;
		currentReview?: any;
	}

	let { sectionId, sectionName, userJourneyId, tierSlug, currentReview }: Props = $props();

	let isSubmitting = $state(false);
	let showModal = $state(false);
	let notes = $state('');

	// Check if user has review feature access
	const hasReviewAccess = $derived(tierSlug === 'guided' || tierSlug === 'premium');

	// Determine review status
	const reviewStatus = $derived(currentReview?.status || null);
	const isPending = $derived(reviewStatus === 'pending');
	const isInReview = $derived(reviewStatus === 'in_review');
	const isCompleted = $derived(reviewStatus === 'completed');
	const canSubmit = $derived(!isPending && !isInReview);

	function openModal() {
		showModal = true;
		notes = '';
	}

	function closeModal() {
		showModal = false;
		notes = '';
	}

	function getStatusBadge() {
		if (isCompleted) return { text: 'Reviewed', class: 'badge-success' };
		if (isInReview) return { text: 'In Review', class: 'badge-info' };
		if (isPending) return { text: 'Pending Review', class: 'badge-warning' };
		return null;
	}

	const statusBadge = $derived(getStatusBadge());
</script>

{#if hasReviewAccess}
	<div class="submit-review-container">
		{#if statusBadge}
			<div class="badge {statusBadge.class} badge-lg">
				{statusBadge.text}
			</div>
		{/if}

		{#if canSubmit}
			<button
				type="button"
				class="btn btn-outline btn-primary btn-sm"
				onclick={openModal}
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				Submit for Review
			</button>
		{:else if currentReview}
			<button
				type="button"
				class="btn btn-ghost btn-sm"
				onclick={() => (showModal = true)}
			>
				View Review Status
			</button>
		{/if}
	</div>

	<!-- Modal -->
	{#if showModal}
		<div class="modal modal-open">
			<div class="modal-box max-w-2xl">
				<h3 class="font-bold text-lg mb-4">
					{canSubmit ? 'Submit' : 'Review Status'}: {sectionName}
				</h3>

				{#if currentReview && !canSubmit}
					<!-- Show review status and feedback -->
					<div class="space-y-4">
						<div class="alert alert-info">
							<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
							<span>
								{#if isPending}
									Your review request has been submitted and is waiting for a guide to be assigned.
								{:else if isInReview}
									A guide is currently reviewing your section. You'll receive feedback soon!
								{:else if isCompleted}
									Your review has been completed. Check the feedback below.
								{/if}
							</span>
						</div>

						{#if currentReview.feedback}
							<div class="card bg-base-200">
								<div class="card-body">
									<h4 class="card-title text-sm">Guide Feedback</h4>
									<p class="whitespace-pre-wrap">{currentReview.feedback}</p>
									{#if currentReview.completed_at}
										<p class="text-xs text-base-content/60 mt-2">
											Completed: {new Date(currentReview.completed_at).toLocaleDateString()}
										</p>
									{/if}
								</div>
							</div>
						{/if}

						{#if isCompleted}
							<form method="POST" action="?/requestReReview" use:enhance={() => {
								isSubmitting = true;
								return async ({ update }) => {
									await update();
									isSubmitting = false;
									closeModal();
								};
							}}>
								<input type="hidden" name="review_id" value={currentReview.id} />
								<button
									type="submit"
									class="btn btn-primary btn-sm"
									disabled={isSubmitting}
								>
									Request Another Review
								</button>
							</form>
						{/if}
					</div>
				{:else}
					<!-- Submit new review form -->
					<form method="POST" action="?/submitForReview" use:enhance={() => {
						isSubmitting = true;
						return async ({ update }) => {
							await update();
							isSubmitting = false;
							closeModal();
						};
					}}>
						<input type="hidden" name="user_journey_id" value={userJourneyId} />
						<input type="hidden" name="section_id" value={sectionId} />

						<div class="form-control">
							<label class="label" for="notes">
								<span class="label-text">Notes for your guide (optional)</span>
							</label>
							<textarea
								id="notes"
								name="notes"
								bind:value={notes}
								class="textarea textarea-bordered h-24"
								placeholder="Any specific questions or areas you'd like feedback on?"
							></textarea>
						</div>

						<div class="alert alert-info mt-4">
							<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
							<span class="text-sm">
								A guide will review your <strong>{sectionName}</strong> section and provide personalized feedback within 2-3 business days.
							</span>
						</div>

						<div class="modal-action">
							<button
								type="button"
								class="btn btn-ghost"
								onclick={closeModal}
								disabled={isSubmitting}
							>
								Cancel
							</button>
							<button
								type="submit"
								class="btn btn-primary"
								disabled={isSubmitting}
							>
								{#if isSubmitting}
									<span class="loading loading-spinner loading-sm"></span>
									Submitting...
								{:else}
									Submit for Review
								{/if}
							</button>
						</div>
					</form>
				{/if}

				{#if !canSubmit && currentReview}
					<div class="modal-action">
						<button type="button" class="btn" onclick={closeModal}>
							Close
						</button>
					</div>
				{/if}
			</div>
			<div class="modal-backdrop" onclick={closeModal}></div>
		</div>
	{/if}
{/if}

<style>
	.submit-review-container {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.modal-backdrop {
		position: absolute;
		inset: 0;
		background-color: hsl(var(--b1) / 0.6);
		cursor: pointer;
	}
</style>
