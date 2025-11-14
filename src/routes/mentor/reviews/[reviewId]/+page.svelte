<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { ReviewComment } from '$lib/types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Comment form state
	let commentText = $state('');
	let selectedFieldId = $state<number | null>(null);
	let commentType = $state('feedback');

	// Complete review form state
	let overallFeedback = $state(data.review.mentor_feedback || '');
	let overallRating = $state<number | null>(data.review.overall_rating || null);
	let reviewAction = $state<'approve' | 'request_changes' | null>(null);

	// Show complete modal
	let showCompleteModal = $state(false);

	// Get field value
	function getFieldValue(fieldId: number): string {
		return data.sectionData.get(fieldId) || '';
	}

	// Get comments for field
	function getFieldComments(fieldId: number | null) {
		return data.comments.filter(
			(c: ReviewComment & { author_username: string }) => c.field_id === fieldId
		);
	}

	// Format date
	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	// Open complete modal
	function openCompleteModal(action: 'approve' | 'request_changes') {
		reviewAction = action;
		showCompleteModal = true;
	}

	// Close complete modal
	function closeCompleteModal() {
		showCompleteModal = false;
		reviewAction = null;
	}

	// Status badge color
	function getStatusBadge(status: string): string {
		switch (status) {
			case 'requested':
				return 'badge-warning';
			case 'in_review':
				return 'badge-info';
			case 'approved':
				return 'badge-success';
			case 'changes_requested':
				return 'badge-error';
			default:
				return 'badge-ghost';
		}
	}
</script>

<svelte:head>
	<title>Review: {data.review.section_name} - {data.review.client_username}</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-6">
		<div class="flex justify-between items-start mb-2">
			<div>
				<h1 class="text-3xl font-bold">{data.review.section_name}</h1>
				<p class="text-base-content/70">
					{data.review.journey_name} • Client: {data.review.client_username}
				</p>
			</div>
			<div class="badge {getStatusBadge(data.review.status)} badge-lg">
				{data.review.status.replace('_', ' ')}
			</div>
		</div>

		<div class="text-sm text-base-content/60">
			Requested: {formatDate(data.review.requested_at)}
			{#if data.review.claimed_at}
				• Claimed: {formatDate(data.review.claimed_at)}
			{/if}
		</div>
	</div>

	<!-- Success/Error Messages -->
	{#if form?.success}
		<div class="alert alert-success mb-6">
			<span>{form.message || 'Success!'}</span>
		</div>
	{/if}

	{#if form?.error}
		<div class="alert alert-error mb-6">
			<span>{form.error}</span>
		</div>
	{/if}

	<!-- Claim Review (if not claimed) -->
	{#if data.review.status === 'requested' && !data.review.mentor_user_id}
		<div class="card bg-base-100 shadow-xl mb-6">
			<div class="card-body">
				<h2 class="card-title">Review Available</h2>
				<p>This review has not been claimed yet. Claim it to begin reviewing.</p>

				{#if data.review.client_notes}
					<div class="bg-base-200 p-4 rounded-lg mt-2">
						<p class="font-semibold text-sm mb-1">Client Notes:</p>
						<p class="text-sm">{data.review.client_notes}</p>
					</div>
				{/if}

				<form
					method="POST"
					action="?/claimReview"
					use:enhance={() => {
						return async ({ result, update }) => {
							await update();
							if (result.type === 'success' && result.data?.success) {
								await invalidateAll();
							}
						};
					}}
				>
					<button type="submit" class="btn btn-primary mt-4">Claim Review</button>
				</form>
			</div>
		</div>
	{/if}

	<!-- Review Interface (if claimed) -->
	{#if data.review.mentor_user_id}
		<!-- Client Notes -->
		{#if data.review.client_notes}
			<div class="card bg-base-200 shadow mb-6">
				<div class="card-body">
					<h3 class="font-bold">Client Notes:</h3>
					<p>{data.review.client_notes}</p>
				</div>
			</div>
		{/if}

		<!-- Section Fields and Data -->
		<div class="card bg-base-100 shadow-xl mb-6">
			<div class="card-body">
				<h2 class="card-title mb-4">Section Content</h2>

				<div class="space-y-6">
					{#each data.fields as field}
						{@const value = getFieldValue(field.id)}
						{@const fieldComments = getFieldComments(field.id)}
						<div class="border border-base-300 rounded-lg p-4">
							<!-- Field Label -->
							<div class="flex justify-between items-start mb-2">
								<div>
									<h3 class="font-bold text-lg">{field.label}</h3>
									{#if field.description}
										<p class="text-sm text-base-content/70">{field.description}</p>
									{/if}
								</div>
								<div class="badge badge-outline">{field.field_type}</div>
							</div>

							<!-- Client's Answer -->
							<div class="bg-base-200 p-4 rounded-lg mb-3">
								<p class="text-sm font-semibold mb-1">Client's Response:</p>
								{#if value}
									<p class="whitespace-pre-wrap">{value}</p>
								{:else}
									<p class="text-base-content/50 italic">No response provided</p>
								{/if}
							</div>

							<!-- Existing Comments for this Field -->
							{#if fieldComments.length > 0}
								<div class="mb-3">
									<p class="text-sm font-semibold mb-2">Comments:</p>
									<div class="space-y-2">
										{#each fieldComments as comment}
											<div class="bg-base-300 p-3 rounded">
												<div class="flex justify-between items-start mb-1">
													<span class="text-xs font-semibold">{comment.author_username}</span>
													<span class="text-xs text-base-content/60">
														{formatDate(comment.created_at)}
													</span>
												</div>
												<p class="text-sm">{comment.comment_text}</p>
											</div>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Add Comment for this Field -->
							{#if data.review.status === 'in_review'}
								<form
									method="POST"
									action="?/addComment"
									use:enhance={() => {
										return async ({ result, update }) => {
											await update();
											if (result.type === 'success' && result.data?.success) {
												commentText = '';
												await invalidateAll();
											}
										};
									}}
								>
									<input type="hidden" name="field_id" value={field.id} />
									<input type="hidden" name="comment_type" value="feedback" />
									<div class="form-control">
										<textarea
											name="comment_text"
											bind:value={commentText}
											class="textarea textarea-bordered textarea-sm"
											rows="2"
											placeholder="Add feedback for this field..."
										></textarea>
										<div class="mt-2">
											<button type="submit" class="btn btn-sm btn-outline">Add Comment</button>
										</div>
									</div>
								</form>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- General Comments -->
		<div class="card bg-base-100 shadow-xl mb-6">
			<div class="card-body">
				<h2 class="card-title">General Comments</h2>

				{#if true}
					{@const generalComments = getFieldComments(null)}
					{#if generalComments.length > 0}
					<div class="space-y-2 mb-4">
						{#each generalComments as comment}
							<div class="bg-base-200 p-3 rounded">
								<div class="flex justify-between items-start mb-1">
									<span class="text-xs font-semibold">{comment.author_username}</span>
									<span class="text-xs text-base-content/60">
										{formatDate(comment.created_at)}
									</span>
								</div>
								<p class="text-sm">{comment.comment_text}</p>
							</div>
						{/each}
					</div>
				{/if}

				{#if data.review.status === 'in_review'}
					<form
						method="POST"
						action="?/addComment"
						use:enhance={() => {
							return async ({ result, update }) => {
								await update();
								if (result.type === 'success' && result.data?.success) {
									commentText = '';
									await invalidateAll();
								}
							};
						}}
					>
						<input type="hidden" name="comment_type" value="general" />
						<div class="form-control">
							<label class="label" for="general_comment">
								<span class="label-text">Add a general comment</span>
							</label>
							<textarea
								id="general_comment"
								name="comment_text"
								bind:value={commentText}
								class="textarea textarea-bordered"
								rows="3"
								placeholder="Overall observations, suggestions, or encouragement..."
							></textarea>
							<div class="mt-2">
								<button type="submit" class="btn btn-sm btn-outline">Add Comment</button>
							</div>
						</div>
					</form>
				{/if}
				{/if}
			</div>
		</div>

		<!-- Complete Review Actions -->
		{#if data.review.status === 'in_review'}
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">Complete Review</h2>
					<p class="text-sm text-base-content/70 mb-4">
						Ready to complete this review? Provide your overall feedback and approve or request
						changes.
					</p>

					<div class="flex gap-3">
						<button
							class="btn btn-success"
							onclick={() => openCompleteModal('approve')}
						>
							Approve Section
						</button>
						<button
							class="btn btn-warning"
							onclick={() => openCompleteModal('request_changes')}
						>
							Request Changes
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Completed Review Summary -->
		{#if data.review.status === 'approved' || data.review.status === 'changes_requested'}
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">Review Complete</h2>

					<div class="bg-base-200 p-4 rounded-lg">
						<p class="font-semibold mb-2">Overall Feedback:</p>
						<p class="whitespace-pre-wrap">{data.review.mentor_feedback}</p>
					</div>

					{#if data.review.overall_rating}
						<div class="mt-3">
							<span class="font-semibold">Rating:</span>
							<span class="ml-2">{data.review.overall_rating} / 5 ⭐</span>
						</div>
					{/if}

					<div class="text-sm text-base-content/60 mt-3">
						Reviewed: {formatDate(data.review.reviewed_at)}
						{#if data.review.turnaround_hours}
							• Turnaround: {data.review.turnaround_hours.toFixed(1)} hours
						{/if}
					</div>

					<div class="mt-4">
						<a href="/mentor/dashboard" class="btn btn-outline">Back to Dashboard</a>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>

<!-- Complete Review Modal -->
{#if showCompleteModal && reviewAction}
	<div class="modal modal-open">
		<div class="modal-box max-w-2xl">
			<h3 class="font-bold text-lg mb-4">
				{reviewAction === 'approve' ? 'Approve Section' : 'Request Changes'}
			</h3>

			<p class="mb-4">
				{reviewAction === 'approve'
					? 'Approve this section and provide your overall feedback to the client.'
					: 'Request changes from the client and explain what needs to be improved.'}
			</p>

			<form
				method="POST"
				action="?/completeReview"
				use:enhance={() => {
					return async ({ result, update }) => {
						await update();
						if (result.type === 'redirect') {
							// Let the redirect happen
						}
					};
				}}
			>
				<input type="hidden" name="action" value={reviewAction} />

				<div class="form-control mb-4">
					<label class="label" for="feedback">
						<span class="label-text">Overall Feedback *</span>
					</label>
					<textarea
						id="feedback"
						name="feedback"
						bind:value={overallFeedback}
						class="textarea textarea-bordered"
						rows="6"
						placeholder="Provide comprehensive feedback on the client's work..."
						required
					aria-describedby="overall-feedback-help"
					></textarea>
					<div class="label">
						<span id="overall-feedback-help" class="label-text-alt">Minimum 50 characters</span>
					</div>
				</div>

				{#if reviewAction === 'approve'}
					<div class="form-control mb-4">
						<label class="label" for="overall_rating">
							<span class="label-text">Rating (Optional)</span>
						</label>
						<select
							id="overall_rating"
							name="overall_rating"
							bind:value={overallRating}
							class="select select-bordered"
						>
							<option value="">No rating</option>
							<option value="1">1 - Needs significant improvement</option>
							<option value="2">2 - Below expectations</option>
							<option value="3">3 - Meets expectations</option>
							<option value="4">4 - Exceeds expectations</option>
							<option value="5">5 - Outstanding work</option>
						</select>
					</div>
				{/if}

				<div class="modal-action">
					<button type="button" class="btn btn-ghost" onclick={closeCompleteModal}>Cancel</button>
					<button
						type="submit"
						class="btn {reviewAction === 'approve' ? 'btn-success' : 'btn-warning'}"
					>
						{reviewAction === 'approve' ? 'Approve' : 'Request Changes'}
					</button>
				</div>
			</form>
		</div>
		<button
			type="button"
			class="modal-backdrop"
			aria-label="Close review modal"
			onclick={closeCompleteModal}
		></button>
	</div>
{/if}
