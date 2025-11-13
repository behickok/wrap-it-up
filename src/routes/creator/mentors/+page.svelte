<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Modal state
	let reviewingApplicationId = $state<number | null>(null);
	let reviewAction = $state<'approve' | 'reject' | null>(null);
	let rejectionReason = $state('');
	let reviewNotes = $state('');
	let assigningMentor = $state(false);
	let selectedJourneyId = $state<number | null>(null);
	let selectedMentorId = $state<number | null>(null);
	let reviewRate = $state(25);
	let revenueShare = $state(10);
	let maxReviewsPerWeek = $state(10);

	// Get application by ID
	const getApplication = (id: number) => {
		return data.pendingApplications.find((app) => app.id === id);
	};

	// Format date
	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Parse expertise
	function parseExpertise(expertiseJson: string | null): string[] {
		if (!expertiseJson) return [];
		try {
			const parsed = JSON.parse(expertiseJson);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}

	// Format currency
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}

	// Open review modal
	function openReviewModal(applicationId: number, action: 'approve' | 'reject') {
		reviewingApplicationId = applicationId;
		reviewAction = action;
		rejectionReason = '';
		reviewNotes = '';
	}

	// Close review modal
	function closeReviewModal() {
		reviewingApplicationId = null;
		reviewAction = null;
		rejectionReason = '';
		reviewNotes = '';
	}

	// Open assign modal
	function openAssignModal() {
		assigningMentor = true;
		selectedJourneyId = data.creatorJourneys[0]?.id || null;
		selectedMentorId = data.availableMentors[0]?.user_id || null;
		reviewRate = 25;
		revenueShare = 10;
		maxReviewsPerWeek = 10;
	}

	// Close assign modal
	function closeAssignModal() {
		assigningMentor = false;
		selectedJourneyId = null;
		selectedMentorId = null;
	}
</script>

<svelte:head>
	<title>Manage Mentors - Wrap It Up Creator</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-4xl font-bold mb-2">Manage Mentors</h1>
		<p class="text-base-content/70">
			Review applications and assign mentors to your journeys
		</p>
	</div>

	<!-- Success/Error Messages -->
	{#if form?.success}
		<div class="alert alert-success mb-6">
			<span>
				{#if form.action === 'approve'}
					Application approved! Mentor profile created successfully.
				{:else if form.action === 'reject'}
					Application rejected.
				{:else if form.action === 'assign'}
					Mentor assigned to journey successfully!
				{:else if form.action === 'remove'}
					Mentor removed from journey.
				{/if}
			</span>
		</div>
	{/if}

	{#if form?.error}
		<div class="alert alert-error mb-6">
			<span>{form.error}</span>
		</div>
	{/if}

	<!-- Pending Applications -->
	<div class="card bg-base-100 shadow-xl mb-8">
		<div class="card-body">
			<h2 class="card-title text-2xl mb-4">
				Pending Applications ({data.pendingApplications.length})
			</h2>

			{#if data.pendingApplications.length === 0}
				<p class="text-base-content/70">No pending applications at this time.</p>
			{:else}
				<div class="space-y-4">
					{#each data.pendingApplications as application}
						{@const expertise = parseExpertise(application.expertise)}
						<div class="border border-base-300 rounded-lg p-4">
							<!-- Header -->
							<div class="flex justify-between items-start mb-3">
								<div>
									<h3 class="font-bold text-lg">{application.username}</h3>
									<p class="text-sm text-base-content/70">{application.email}</p>
									<p class="text-xs text-base-content/60 mt-1">
										Applied {formatDate(application.applied_at)}
									</p>
								</div>
								<div class="badge badge-warning">Pending</div>
							</div>

							<!-- Quick Info -->
							<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
								<div>
									<span class="text-base-content/70">Experience:</span>
									<span class="font-semibold ml-1">{application.experience_years || 0} years</span>
								</div>
								<div>
									<span class="text-base-content/70">Availability:</span>
									<span class="font-semibold ml-1">{application.availability_hours || 0} hrs/week</span>
								</div>
								<div>
									<span class="text-base-content/70">Desired Rate:</span>
									<span class="font-semibold ml-1">{formatCurrency(application.hourly_rate || 0)}/hr</span>
								</div>
								<div>
									<span class="text-base-content/70">Expertise:</span>
									<span class="font-semibold ml-1">{expertise.length} areas</span>
								</div>
							</div>

							<!-- Expertise Tags -->
							{#if expertise.length > 0}
								<div class="flex flex-wrap gap-2 mb-3">
									{#each expertise as exp}
										<div class="badge badge-outline badge-sm">{exp}</div>
									{/each}
								</div>
							{/if}

							<!-- Bio Preview -->
							<div class="mb-3">
								<p class="text-sm font-semibold mb-1">Bio:</p>
								<p class="text-sm text-base-content/70 line-clamp-2">
									{application.bio || 'No bio provided'}
								</p>
							</div>

							<!-- Why Mentor Preview -->
							<div class="mb-3">
								<p class="text-sm font-semibold mb-1">Why Mentor:</p>
								<p class="text-sm text-base-content/70 line-clamp-2">
									{application.why_mentor || 'Not provided'}
								</p>
							</div>

							<!-- Actions -->
							<div class="flex gap-2">
								<button
									class="btn btn-success btn-sm"
									onclick={() => openReviewModal(application.id, 'approve')}
								>
									Approve
								</button>
								<button
									class="btn btn-error btn-sm"
									onclick={() => openReviewModal(application.id, 'reject')}
								>
									Reject
								</button>
								<details class="dropdown dropdown-end">
									<summary class="btn btn-ghost btn-sm">View Details</summary>
									<div class="dropdown-content z-10 menu p-4 shadow bg-base-200 rounded-box w-96 max-h-96 overflow-y-auto">
										<div class="space-y-3">
											<div>
												<p class="font-bold text-sm">Education:</p>
												<p class="text-sm">{application.education || 'Not provided'}</p>
											</div>
											<div>
												<p class="font-bold text-sm">Certifications:</p>
												<p class="text-sm">{application.certifications || 'None listed'}</p>
											</div>
											<div>
												<p class="font-bold text-sm">Sample Feedback:</p>
												<p class="text-sm">{application.sample_feedback || 'Not provided'}</p>
											</div>
										</div>
									</div>
								</details>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Assigned Mentors -->
	<div class="card bg-base-100 shadow-xl mb-8">
		<div class="card-body">
			<div class="flex justify-between items-center mb-4">
				<h2 class="card-title text-2xl">
					Assigned Mentors ({data.assignedMentors.length})
				</h2>
				<button class="btn btn-primary btn-sm" onclick={openAssignModal}>
					+ Assign Mentor
				</button>
			</div>

			{#if data.assignedMentors.length === 0}
				<p class="text-base-content/70">
					No mentors assigned yet. Assign mentors to provide Guided tier support.
				</p>
			{:else}
				<div class="overflow-x-auto">
					<table class="table table-zebra">
						<thead>
							<tr>
								<th>Mentor</th>
								<th>Journey</th>
								<th>Rate</th>
								<th>Revenue Share</th>
								<th>Max/Week</th>
								<th>Stats</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each data.assignedMentors as assignment}
								<tr>
									<td>
										<div class="font-bold">{assignment.mentor_username}</div>
										<div class="text-xs opacity-70">{assignment.mentor_email}</div>
										<div class="text-xs">
											Rating: {assignment.mentor_rating.toFixed(1)} ⭐
											({assignment.mentor_total_reviews} reviews)
										</div>
									</td>
									<td>
										<a href="/admin/journeys/{assignment.journey_id}/edit" class="link">
											{assignment.journey_name}
										</a>
									</td>
									<td>{formatCurrency(assignment.review_rate)}/review</td>
									<td>{assignment.revenue_share_percentage}%</td>
									<td>{assignment.max_reviews_per_week}</td>
									<td>
										<div class="text-xs">
											<div>{assignment.total_reviews} total</div>
											<div>{assignment.average_rating.toFixed(1)} ⭐ avg</div>
										</div>
									</td>
									<td>
										<form
											method="POST"
											action="?/removeMentor"
											use:enhance={() => {
												return async ({ result, update }) => {
													await update();
													if (result.type === 'success' && result.data?.success) {
														await invalidateAll();
													}
												};
											}}
										>
											<input type="hidden" name="assignment_id" value={assignment.id} />
											<button
												type="submit"
												class="btn btn-ghost btn-xs"
												onclick={(e) => {
													if (!confirm('Remove this mentor from the journey?')) {
														e.preventDefault();
													}
												}}
											>
												Remove
											</button>
										</form>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Review Application Modal -->
{#if reviewingApplicationId && reviewAction}
	{@const application = getApplication(reviewingApplicationId)}
	{#if application}
		<div class="modal modal-open">
			<div class="modal-box">
				<h3 class="font-bold text-lg mb-4">
					{reviewAction === 'approve' ? 'Approve' : 'Reject'} Application
				</h3>

				<p class="mb-4">
					{reviewAction === 'approve'
						? `Approve ${application.username} as a mentor? This will create their mentor profile.`
						: `Reject ${application.username}'s application? They can reapply after 30 days.`}
				</p>

				<form
					method="POST"
					action="?/{reviewAction === 'approve' ? 'approveApplication' : 'rejectApplication'}"
					use:enhance={() => {
						return async ({ result, update }) => {
							await update();
							if (result.type === 'success' && result.data?.success) {
								closeReviewModal();
								await invalidateAll();
							}
						};
					}}
				>
					<input type="hidden" name="application_id" value={reviewingApplicationId} />

					{#if reviewAction === 'reject'}
						<div class="form-control mb-4">
							<label class="label" for="rejection_reason">
								<span class="label-text">Rejection Reason *</span>
							</label>
							<textarea
								id="rejection_reason"
								name="rejection_reason"
								bind:value={rejectionReason}
								class="textarea textarea-bordered"
								rows="3"
								placeholder="Explain why the application is being rejected..."
								required
							></textarea>
						</div>
					{/if}

					<div class="form-control mb-4">
						<label class="label" for="notes">
							<span class="label-text">Internal Notes (optional)</span>
						</label>
						<textarea
							id="notes"
							name="notes"
							bind:value={reviewNotes}
							class="textarea textarea-bordered"
							rows="2"
							placeholder="Internal notes for your records..."
						></textarea>
					</div>

					<div class="modal-action">
						<button type="button" class="btn btn-ghost" onclick={closeReviewModal}>
							Cancel
						</button>
						<button
							type="submit"
							class="btn {reviewAction === 'approve' ? 'btn-success' : 'btn-error'}"
						>
							{reviewAction === 'approve' ? 'Approve' : 'Reject'}
						</button>
					</div>
				</form>
			</div>
			<div class="modal-backdrop" onclick={closeReviewModal}></div>
		</div>
	{/if}
{/if}

<!-- Assign Mentor Modal -->
{#if assigningMentor}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg mb-4">Assign Mentor to Journey</h3>

			<form
				method="POST"
				action="?/assignMentor"
				use:enhance={() => {
					return async ({ result, update }) => {
						await update();
						if (result.type === 'success' && result.data?.success) {
							closeAssignModal();
							await invalidateAll();
						}
					};
				}}
			>
				<div class="form-control mb-4">
					<label class="label" for="journey_id">
						<span class="label-text">Journey *</span>
					</label>
					<select
						id="journey_id"
						name="journey_id"
						bind:value={selectedJourneyId}
						class="select select-bordered"
						required
					>
						<option value="">Select journey...</option>
						{#each data.creatorJourneys as journey}
							<option value={journey.id}>{journey.name}</option>
						{/each}
					</select>
				</div>

				<div class="form-control mb-4">
					<label class="label" for="mentor_user_id">
						<span class="label-text">Mentor *</span>
					</label>
					<select
						id="mentor_user_id"
						name="mentor_user_id"
						bind:value={selectedMentorId}
						class="select select-bordered"
						required
					>
						<option value="">Select mentor...</option>
						{#each data.availableMentors as mentor}
							<option value={mentor.user_id}>
								{mentor.username} - {mentor.average_rating.toFixed(1)} ⭐ ({mentor.total_reviews} reviews)
							</option>
						{/each}
					</select>
				</div>

				<div class="form-control mb-4">
					<label class="label" for="review_rate">
						<span class="label-text">Review Rate ($) *</span>
					</label>
					<input
						type="number"
						id="review_rate"
						name="review_rate"
						bind:value={reviewRate}
						class="input input-bordered"
						min="0"
						step="1"
						required
					/>
					<label class="label">
						<span class="label-text-alt">Amount paid per completed review</span>
					</label>
				</div>

				<div class="form-control mb-4">
					<label class="label" for="revenue_share">
						<span class="label-text">Revenue Share (%)</span>
					</label>
					<input
						type="number"
						id="revenue_share"
						name="revenue_share"
						bind:value={revenueShare}
						class="input input-bordered"
						min="0"
						max="100"
						step="0.1"
					/>
					<label class="label">
						<span class="label-text-alt">Percentage of Guided tier subscription revenue</span>
					</label>
				</div>

				<div class="form-control mb-4">
					<label class="label" for="max_reviews_per_week">
						<span class="label-text">Max Reviews Per Week</span>
					</label>
					<input
						type="number"
						id="max_reviews_per_week"
						name="max_reviews_per_week"
						bind:value={maxReviewsPerWeek}
						class="input input-bordered"
						min="1"
						step="1"
					/>
				</div>

				<div class="modal-action">
					<button type="button" class="btn btn-ghost" onclick={closeAssignModal}>
						Cancel
					</button>
					<button type="submit" class="btn btn-primary">Assign Mentor</button>
				</div>
			</form>
		</div>
		<div class="modal-backdrop" onclick={closeAssignModal}></div>
	</div>
{/if}
