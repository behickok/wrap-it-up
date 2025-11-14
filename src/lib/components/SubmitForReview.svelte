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

	// Determine review status (Phase 4 statuses: requested, in_review, changes_requested, approved)
	const reviewStatus = $derived(currentReview?.status || null);
	const isRequested = $derived(reviewStatus === 'requested');
	const isInReview = $derived(reviewStatus === 'in_review');
	const isApproved = $derived(reviewStatus === 'approved');
	const isChangesRequested = $derived(reviewStatus === 'changes_requested');
	const canSubmit = $derived(!isRequested && !isInReview);

	function openModal() {
		showModal = true;
		notes = '';
	}

	function closeModal() {
		showModal = false;
		notes = '';
	}

	function getStatusBadge() {
		if (isApproved) return { text: '✓ Approved', class: 'badge-success' };
		if (isChangesRequested) return { text: 'Changes Requested', class: 'badge-warning' };
		if (isInReview) return { text: 'In Review', class: 'badge-info' };
		if (isRequested) return { text: 'Awaiting Mentor', class: 'badge-warning' };
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
						<div class="alert {isApproved ? 'alert-success' : 'alert-info'}">
							<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
							<span>
								{#if isRequested}
									Your review request has been submitted and is waiting for a mentor to claim it.
								{:else if isInReview}
									A mentor is currently reviewing your section. You'll receive feedback soon!
								{:else if isApproved}
									Your section has been approved! Check the feedback below.
								{:else if isChangesRequested}
									Your mentor has requested some changes. Review the feedback and resubmit when ready.
								{/if}
							</span>
						</div>

						{#if currentReview.mentor_feedback}
							<div class="card bg-base-200">
								<div class="card-body">
									<h4 class="card-title text-sm">Mentor Feedback</h4>
									<p class="whitespace-pre-wrap">{currentReview.mentor_feedback}</p>
									{#if currentReview.overall_rating}
										<div class="mt-2">
											<span class="font-semibold">Rating:</span>
											<span class="ml-2">{currentReview.overall_rating} / 5 ⭐</span>
										</div>
									{/if}
									{#if currentReview.reviewed_at}
										<p class="text-xs text-base-content/60 mt-2">
											Reviewed: {new Date(currentReview.reviewed_at).toLocaleDateString()}
										</p>
									{/if}
								</div>
							</div>
						{/if}

						{#if isApproved || isChangesRequested}
							<form method="POST" action="?/requestReview" use:enhance={() => {
								isSubmitting = true;
								return async ({ update }) => {
									await update();
									isSubmitting = false;
									closeModal();
								};
							}}>
								<input type="hidden" name="section_id" value={sectionId} />
								<input type="hidden" name="priority" value="normal" />
								<button
									type="submit"
									class="btn btn-primary btn-sm"
									disabled={isSubmitting}
								>
									{isChangesRequested ? 'Resubmit for Review' : 'Request Another Review'}
								</button>
							</form>
						{/if}
					</div>
				{:else}
					<!-- Submit new review form -->
					<form method="POST" action="?/requestReview" use:enhance={() => {
						isSubmitting = true;
						return async ({ update }) => {
							await update();
							isSubmitting = false;
							closeModal();
						};
					}}>
						<input type="hidden" name="section_id" value={sectionId} />
						<input type="hidden" name="priority" value="normal" />

						<div class="form-control">
							<label class="label" for="client_notes">
								<span class="label-text">Notes for your mentor (optional)</span>
							</label>
							<textarea
								id="client_notes"
								name="client_notes"
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
								A mentor will review your <strong>{sectionName}</strong> section and provide personalized feedback within 2-3 business days.
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
			<div
				class="modal-backdrop"
				role="button"
				tabindex="0"
				onclick={closeModal}
				onkeydown={(event) => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						closeModal();
					}
				}}
				aria-label="Close review modal"
			></div>
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
