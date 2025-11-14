<script lang="ts">
	/**
	 * Mentor Availability Management Page
	 * Set weekly availability schedule and blocked dates
	 */

	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Days of the week
	const DAYS = [
		{ value: 0, label: 'Sunday', short: 'Sun' },
		{ value: 1, label: 'Monday', short: 'Mon' },
		{ value: 2, label: 'Tuesday', short: 'Tue' },
		{ value: 3, label: 'Wednesday', short: 'Wed' },
		{ value: 4, label: 'Thursday', short: 'Thu' },
		{ value: 5, label: 'Friday', short: 'Fri' },
		{ value: 6, label: 'Saturday', short: 'Sat' }
	];

	// Common timezones
	const TIMEZONES = [
		{ value: 'America/New_York', label: 'Eastern Time (ET)' },
		{ value: 'America/Chicago', label: 'Central Time (CT)' },
		{ value: 'America/Denver', label: 'Mountain Time (MT)' },
		{ value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
		{ value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
		{ value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
		{ value: 'Europe/London', label: 'London (GMT/BST)' },
		{ value: 'Europe/Paris', label: 'Paris (CET)' },
		{ value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
		{ value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
		{ value: 'UTC', label: 'UTC' }
	];

	// Form state for adding availability
	let newAvailability = $state({
		day_of_week: 1, // Monday by default
		start_time: '09:00',
		end_time: '17:00',
		timezone: 'America/New_York'
	});

	// Form state for adding blocked dates
	let newBlockedDate = $state({
		start_date: '',
		end_date: '',
		reason: ''
	});

	// UI state
	let isAddingAvailability = $state(false);
	let isAddingBlockedDate = $state(false);

	// Group availability by day
	const availabilityByDay = $derived(() => {
		const grouped: Record<number, any[]> = {};
		for (let i = 0; i <= 6; i++) {
			grouped[i] = [];
		}

		data.availability.forEach((slot: any) => {
			grouped[slot.day_of_week].push(slot);
		});

		return grouped;
	});

	// Format time for display (HH:MM -> h:MM AM/PM)
	function formatTime(time24: string): string {
		const [hours, minutes] = time24.split(':').map(Number);
		const period = hours >= 12 ? 'PM' : 'AM';
		const hours12 = hours % 12 || 12;
		return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
	}

	// Format date for display
	function formatDate(dateString: string): string {
		const date = new Date(dateString + 'T00:00:00');
		return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
	}

	// Calculate days until/since date
	function getDaysUntil(dateString: string): number {
		const date = new Date(dateString + 'T00:00:00');
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const diffTime = date.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	}

	// Set minimum date for blocked dates (today)
	const today = $derived(() => {
		const date = new Date();
		return date.toISOString().split('T')[0];
	});
</script>

<svelte:head>
	<title>Availability Management - Mentor Dashboard</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-2">Availability Management</h1>
		<p class="text-base-content/70">
			Set your weekly availability schedule and mark dates when you're unavailable
		</p>
	</div>

	<!-- Success/Error Messages -->
	{#if form?.success}
		<div class="alert alert-success mb-6">
			<span>{form.message}</span>
		</div>
	{/if}

	{#if form?.error}
		<div class="alert alert-error mb-6">
			<span>{form.error}</span>
		</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Weekly Availability -->
		<div class="lg:col-span-2">
			<div class="card bg-base-100 shadow">
				<div class="card-body">
					<div class="flex items-center justify-between mb-4">
						<h2 class="card-title">Weekly Availability</h2>
						<button
							class="btn btn-sm btn-primary"
							onclick={() => (isAddingAvailability = !isAddingAvailability)}
						>
							{isAddingAvailability ? 'Cancel' : '+ Add Time Slot'}
						</button>
					</div>

					<!-- Add Availability Form -->
					{#if isAddingAvailability}
						<form method="POST" action="?/addAvailability" use:enhance class="mb-6">
							<div class="card bg-base-200">
								<div class="card-body">
									<h3 class="font-semibold mb-4">Add New Time Slot</h3>

									<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
										<!-- Day Selection -->
										<div class="form-control">
											<label class="label" for="day_of_week">
												<span class="label-text">Day of Week</span>
											</label>
											<select
												id="day_of_week"
												name="day_of_week"
												class="select select-bordered"
												bind:value={newAvailability.day_of_week}
												required
											>
												{#each DAYS as day}
													<option value={day.value}>{day.label}</option>
												{/each}
											</select>
										</div>

										<!-- Timezone -->
										<div class="form-control">
											<label class="label" for="timezone">
												<span class="label-text">Timezone</span>
											</label>
											<select
												id="timezone"
												name="timezone"
												class="select select-bordered"
												bind:value={newAvailability.timezone}
												required
											>
												{#each TIMEZONES as tz}
													<option value={tz.value}>{tz.label}</option>
												{/each}
											</select>
										</div>

										<!-- Start Time -->
										<div class="form-control">
											<label class="label" for="start_time">
												<span class="label-text">Start Time</span>
											</label>
											<input
												id="start_time"
												type="time"
												name="start_time"
												class="input input-bordered"
												bind:value={newAvailability.start_time}
												required
											/>
										</div>

										<!-- End Time -->
										<div class="form-control">
											<label class="label" for="end_time">
												<span class="label-text">End Time</span>
											</label>
											<input
												id="end_time"
												type="time"
												name="end_time"
												class="input input-bordered"
												bind:value={newAvailability.end_time}
												required
											/>
										</div>
									</div>

									<div class="card-actions justify-end mt-4">
										<button type="submit" class="btn btn-primary"> Add Time Slot </button>
									</div>
								</div>
							</div>
						</form>
					{/if}

					<!-- Availability Calendar -->
					<div class="space-y-3">
						{#each DAYS as day}
							{@const slots = availabilityByDay()[day.value]}
							<div class="card bg-base-200">
								<div class="card-body p-4">
									<div class="flex items-start justify-between">
										<div class="flex-1">
											<h3 class="font-semibold text-lg mb-2">{day.label}</h3>

											{#if slots.length > 0}
												<div class="space-y-2">
													{#each slots as slot}
														<div class="flex items-center justify-between bg-base-100 p-3 rounded">
															<div>
																<span class="font-medium">
																	{formatTime(slot.start_time)} - {formatTime(slot.end_time)}
																</span>
																<span class="text-sm text-base-content/70 ml-2">
																	({slot.timezone})
																</span>
															</div>

															<form method="POST" action="?/removeAvailability" use:enhance>
																<input type="hidden" name="availability_id" value={slot.id} />
																<button type="submit" class="btn btn-ghost btn-sm btn-circle">
																	🗑️
																</button>
															</form>
														</div>
													{/each}
												</div>
											{:else}
												<p class="text-base-content/50 text-sm">Not available</p>
											{/if}
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>

					<!-- Help Text -->
					<div class="mt-4 p-4 bg-info/10 rounded-lg">
						<p class="text-sm text-base-content/70">
							💡 <strong>Tip:</strong> Set multiple time slots per day if you have split availability.
							Reviews will only be assigned during your available hours.
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Blocked Dates Sidebar -->
		<div class="lg:col-span-1">
			<div class="card bg-base-100 shadow">
				<div class="card-body">
					<div class="flex items-center justify-between mb-4">
						<h2 class="card-title">Blocked Dates</h2>
						<button
							class="btn btn-sm btn-outline"
							onclick={() => (isAddingBlockedDate = !isAddingBlockedDate)}
						>
							{isAddingBlockedDate ? 'Cancel' : '+ Add'}
						</button>
					</div>

					<!-- Add Blocked Date Form -->
					{#if isAddingBlockedDate}
						<form method="POST" action="?/addBlockedDate" use:enhance class="mb-6">
							<div class="card bg-base-200">
								<div class="card-body p-4">
									<h3 class="font-semibold mb-3 text-sm">Block Date Range</h3>

									<div class="space-y-3">
										<!-- Start Date -->
										<div class="form-control">
											<label class="label" for="start_date">
												<span class="label-text text-sm">Start Date</span>
											</label>
											<input
												id="start_date"
												type="date"
												name="start_date"
												class="input input-bordered input-sm"
												bind:value={newBlockedDate.start_date}
												min={today()}
												required
											/>
										</div>

										<!-- End Date -->
										<div class="form-control">
											<label class="label" for="end_date">
												<span class="label-text text-sm">End Date</span>
											</label>
											<input
												id="end_date"
												type="date"
												name="end_date"
												class="input input-bordered input-sm"
												bind:value={newBlockedDate.end_date}
												min={newBlockedDate.start_date || today()}
												required
											/>
										</div>

										<!-- Reason -->
										<div class="form-control">
											<label class="label" for="reason">
												<span class="label-text text-sm">Reason (optional)</span>
											</label>
											<input
												id="reason"
												type="text"
												name="reason"
												class="input input-bordered input-sm"
												placeholder="e.g., Vacation"
												bind:value={newBlockedDate.reason}
											/>
										</div>
									</div>

									<div class="card-actions justify-end mt-4">
										<button type="submit" class="btn btn-primary btn-sm"> Add Block </button>
									</div>
								</div>
							</div>
						</form>
					{/if}

					<!-- Blocked Dates List -->
					{#if data.blockedDates.length > 0}
						<div class="space-y-2">
							{#each data.blockedDates as blocked}
								{@const daysUntil = getDaysUntil(blocked.start_date)}
								<div class="card bg-base-200">
									<div class="card-body p-3">
										<div class="flex items-start justify-between">
											<div class="flex-1">
												<div class="font-medium text-sm">
													{formatDate(blocked.start_date)}
													{#if blocked.start_date !== blocked.end_date}
														→ {formatDate(blocked.end_date)}
													{/if}
												</div>

												{#if blocked.reason}
													<div class="text-xs text-base-content/70 mt-1">
														{blocked.reason}
													</div>
												{/if}

												<div class="text-xs text-base-content/50 mt-1">
													{#if daysUntil > 0}
														In {daysUntil} day{daysUntil === 1 ? '' : 's'}
													{:else if daysUntil === 0}
														Today
													{:else}
														Active now
													{/if}
												</div>
											</div>

											<form method="POST" action="?/removeBlockedDate" use:enhance>
												<input type="hidden" name="blocked_date_id" value={blocked.id} />
												<button type="submit" class="btn btn-ghost btn-xs btn-circle">
													🗑️
												</button>
											</form>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="text-center py-8 text-base-content/50">
							<p class="text-sm">No blocked dates</p>
							<p class="text-xs mt-1">Add dates when you're unavailable</p>
						</div>
					{/if}

					<!-- Help Text -->
					<div class="mt-4 p-3 bg-warning/10 rounded-lg">
						<p class="text-xs text-base-content/70">
							⚠️ Reviews won't be assigned to you during blocked dates. Existing reviews remain yours.
						</p>
					</div>
				</div>
			</div>

			<!-- Quick Stats -->
			<div class="card bg-base-100 shadow mt-6">
				<div class="card-body">
					<h3 class="font-semibold mb-3">Availability Stats</h3>

					<div class="stats stats-vertical shadow-sm">
						<div class="stat p-4">
							<div class="stat-title text-xs">Total Time Slots</div>
							<div class="stat-value text-2xl">{data.availability.length}</div>
						</div>

						<div class="stat p-4">
							<div class="stat-title text-xs">Active Blocks</div>
							<div class="stat-value text-2xl">{data.blockedDates.length}</div>
						</div>

						<div class="stat p-4">
							<div class="stat-title text-xs">Days with Availability</div>
							<div class="stat-value text-2xl">
								{Object.values(availabilityByDay()).filter((slots: any[]) => slots.length > 0)
									.length}
							</div>
							<div class="stat-desc text-xs">of 7 days</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
