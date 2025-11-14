<script lang="ts">
	import { enhance } from '$app/forms';

	interface Props {
		userJourneyId: number;
		journeyName: string;
		tierSlug: string;
		mentors?: any[];
	}

	let { userJourneyId, journeyName, tierSlug, mentors = [] }: Props = $props();

	let showModal = $state(false);
	let isSubmitting = $state(false);
	let selectedMentor = $state<number | null>(null);
	let selectedDate = $state('');
	let selectedTime = $state('');
	let notes = $state('');

	// Check if user has session booking access
	const hasSessionAccess = $derived(tierSlug === 'premium');

	// Get available time slots (9 AM - 5 PM, 1-hour intervals)
	const timeSlots = [
		'09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
	];

	// Get minimum date (tomorrow)
	const minDate = $derived(() => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		return tomorrow.toISOString().split('T')[0];
	});

	// Get maximum date (3 months from now)
	const maxDate = $derived(() => {
		const threeMonths = new Date();
		threeMonths.setMonth(threeMonths.getMonth() + 3);
		return threeMonths.toISOString().split('T')[0];
	});

	function openModal() {
		showModal = true;
		selectedMentor = mentors.length > 0 ? mentors[0].id : null;
		selectedDate = '';
		selectedTime = '';
		notes = '';
	}

	function closeModal() {
		showModal = false;
		selectedMentor = null;
		selectedDate = '';
		selectedTime = '';
		notes = '';
	}

	const canSubmit = $derived(selectedMentor && selectedDate && selectedTime);
</script>

{#if hasSessionAccess}
	<button
		type="button"
		class="btn btn-outline btn-secondary btn-sm"
		onclick={openModal}
	>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
		</svg>
		Book 1-on-1 Session
	</button>

	<!-- Modal -->
	{#if showModal}
		<div class="modal modal-open">
			<div class="modal-box max-w-2xl">
				<h3 class="font-bold text-lg mb-4">
					Book a 1-on-1 Session
				</h3>

				<form method="POST" action="?/bookSession" use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						await update();
						isSubmitting = false;
						closeModal();
					};
				}}>
					<input type="hidden" name="user_journey_id" value={userJourneyId} />

					<div class="space-y-4">
						<!-- Mentor Selection -->
						<div class="form-control">
							<label class="label" for="mentor_id">
								<span class="label-text font-semibold">Select Mentor</span>
							</label>
							{#if mentors.length > 0}
								<select
									id="mentor_id"
									name="mentor_id"
									bind:value={selectedMentor}
									class="select select-bordered w-full"
									required
								>
									{#each mentors as mentor}
										<option value={mentor.id}>
											{mentor.display_name} - ${mentor.hourly_rate}/hour
										</option>
									{/each}
								</select>
							{:else}
								<div class="alert alert-warning">
									<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
									</svg>
									<span>No mentors available at the moment. Please check back later.</span>
								</div>
							{/if}
						</div>

						{#if mentors.length > 0}
							<!-- Date Selection -->
							<div class="form-control">
								<label class="label" for="session_date">
									<span class="label-text font-semibold">Select Date</span>
								</label>
								<input
									type="date"
									id="session_date"
									name="session_date"
									bind:value={selectedDate}
									min={minDate()}
									max={maxDate()}
									class="input input-bordered w-full"
									required
								/>
								<div class="label">
									<span class="label-text-alt text-base-content/60">
										Available dates: tomorrow through next 3 months
									</span>
								</div>
							</div>

							<!-- Time Selection -->
							<div class="form-control">
								<label class="label" for="session_time">
									<span class="label-text font-semibold">Select Time (EST)</span>
								</label>
								<select
									id="session_time"
									name="session_time"
									bind:value={selectedTime}
									class="select select-bordered w-full"
									required
								>
									<option value="">Choose a time...</option>
									{#each timeSlots as slot}
										<option value={slot}>{slot}</option>
									{/each}
								</select>
							</div>

							<!-- Notes -->
							<div class="form-control">
								<label class="label" for="session_notes">
									<span class="label-text">Session Focus (optional)</span>
								</label>
								<textarea
									id="session_notes"
									name="notes"
									bind:value={notes}
									class="textarea textarea-bordered h-24"
									placeholder="What would you like to discuss during this session?"
								></textarea>
							</div>

							<!-- Info Alert -->
							<div class="alert alert-info">
								<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
								</svg>
								<span class="text-sm">
									Sessions are 1 hour long. Your mentor will reach out to confirm and provide a video call link.
								</span>
							</div>
						{/if}
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
						{#if mentors.length > 0}
							<button
								type="submit"
								class="btn btn-primary"
								disabled={isSubmitting || !canSubmit}
							>
								{#if isSubmitting}
									<span class="loading loading-spinner loading-sm"></span>
									Booking...
								{:else}
									Book Session
								{/if}
							</button>
						{/if}
					</div>
				</form>
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
				aria-label="Close booking modal"
			></div>
		</div>
	{/if}
{/if}

<style>
	.modal-backdrop {
		position: absolute;
		inset: 0;
		background-color: hsl(var(--b1) / 0.6);
		cursor: pointer;
	}
</style>
