<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';

	let { data }: { data: PageData } = $props();

	// Form state for creating new subscription
	let selectedUserId = $state<number | null>(null);
	let selectedJourneyId = $state<number | null>(null);
	let selectedTierId = $state<number | null>(null);
	let billingCycle = $state<'monthly' | 'annual'>('monthly');
	let subscriptionNotes = $state('');
	let showCreateForm = $state(false);

	// Pricing preview state
	let pricingPreview = $state<{
		monthly: number;
		annual: number;
		platformFee: number;
		creatorRevenue: number;
	} | null>(null);

	// Status update state
	let editingSubscriptionId = $state<number | null>(null);
	let editingStatus = $state('');
	let editingNotes = $state('');

	// Fetch pricing when journey and tier are selected
	async function fetchPricing() {
		if (!selectedJourneyId || !selectedTierId) {
			pricingPreview = null;
			return;
		}

		const formData = new FormData();
		formData.append('journey_id', selectedJourneyId.toString());
		formData.append('tier_id', selectedTierId.toString());

		const response = await fetch('?/getPricingForJourney', {
			method: 'POST',
			body: formData
		});

		const result = await response.json();
		if (result.data?.success && result.data.pricing) {
			const p = result.data.pricing;
			pricingPreview = {
				monthly: p.base_price_monthly,
				annual: p.base_price_annual,
				platformFee:
					billingCycle === 'monthly' ? p.platform_fee_monthly : p.platform_fee_annual,
				creatorRevenue:
					billingCycle === 'monthly' ? p.creator_revenue_monthly : p.creator_revenue_annual
			};
		} else {
			pricingPreview = null;
		}
	}

	// Watch for changes to journey/tier selection
	$effect(() => {
		if (selectedJourneyId && selectedTierId) {
			fetchPricing();
		}
	});

	// Watch for billing cycle changes
	$effect(() => {
		if (pricingPreview) {
			fetchPricing();
		}
	});

	// Format currency
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}

	// Format date
	function formatDate(dateStr: string | null): string {
		if (!dateStr) return 'N/A';
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Start editing subscription status
	function startEditingStatus(subscription: any) {
		editingSubscriptionId = subscription.id;
		editingStatus = subscription.status;
		editingNotes = subscription.notes || '';
	}

	// Cancel editing
	function cancelEditing() {
		editingSubscriptionId = null;
		editingStatus = '';
		editingNotes = '';
	}

	// Get status badge class
	function getStatusBadgeClass(status: string): string {
		switch (status) {
			case 'active':
				return 'badge-success';
			case 'cancelled':
				return 'badge-error';
			case 'paused':
				return 'badge-warning';
			case 'expired':
				return 'badge-neutral';
			default:
				return 'badge-ghost';
		}
	}
</script>

<svelte:head>
	<title>Subscription Management - Wrap It Up Admin</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-4xl font-bold mb-2">Subscription Management</h1>
				<p class="text-base-content/70">Manually manage user subscriptions and billing</p>
			</div>
			<button class="btn btn-primary" onclick={() => (showCreateForm = !showCreateForm)}>
				{showCreateForm ? 'Cancel' : '+ New Subscription'}
			</button>
		</div>
	</div>

	<!-- Create Subscription Form -->
	{#if showCreateForm}
		<div class="card bg-base-100 shadow-xl mb-8">
			<div class="card-body">
				<h2 class="card-title mb-4">Create New Subscription</h2>

				<form
					method="POST"
					action="?/createSubscription"
					use:enhance={() => {
						return async ({ result, update }) => {
							await update();
							if (result.type === 'success') {
								if (result.data?.success) {
									showCreateForm = false;
									selectedUserId = null;
									selectedJourneyId = null;
									selectedTierId = null;
									subscriptionNotes = '';
									pricingPreview = null;
									await invalidateAll();
									alert('Subscription created successfully!');
								} else if (result.data?.error) {
									alert(`Error: ${result.data.error}`);
								}
							}
						};
					}}
				>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<!-- User Selection -->
						<div class="form-control">
							<label class="label" for="user_select">
								<span class="label-text">User *</span>
							</label>
							<select
								id="user_select"
								name="user_id"
								bind:value={selectedUserId}
								class="select select-bordered"
								required
							>
								<option value="">Select user...</option>
								{#each data.users as user}
									<option value={user.id}>
										{user.username} ({user.email})
									</option>
								{/each}
							</select>
						</div>

						<!-- Journey Selection -->
						<div class="form-control">
							<label class="label" for="journey_select">
								<span class="label-text">Journey *</span>
							</label>
							<select
								id="journey_select"
								name="journey_id"
								bind:value={selectedJourneyId}
								class="select select-bordered"
								required
							>
								<option value="">Select journey...</option>
								{#each data.journeys as journey}
									<option value={journey.id}>
										{journey.name}
									</option>
								{/each}
							</select>
						</div>

						<!-- Tier Selection -->
						<div class="form-control">
							<label class="label" for="tier_select">
								<span class="label-text">Service Tier *</span>
							</label>
							<select
								id="tier_select"
								name="tier_id"
								bind:value={selectedTierId}
								class="select select-bordered"
								required
							>
								<option value="">Select tier...</option>
								{#each data.tiers as tier}
									<option value={tier.id}>
										{tier.name}
									</option>
								{/each}
							</select>
						</div>

						<!-- Billing Cycle -->
						<div class="form-control">
							<label class="label" for="billing_cycle_select">
								<span class="label-text">Billing Cycle *</span>
							</label>
							<select
								id="billing_cycle_select"
								name="billing_cycle"
								bind:value={billingCycle}
								class="select select-bordered"
							>
								<option value="monthly">Monthly</option>
								<option value="annual">Annual</option>
							</select>
						</div>

						<!-- Notes -->
						<div class="form-control md:col-span-2">
							<label class="label" for="subscription_notes">
								<span class="label-text">Notes</span>
							</label>
							<textarea
								id="subscription_notes"
								name="notes"
								bind:value={subscriptionNotes}
								class="textarea textarea-bordered"
								rows="2"
								placeholder="Optional notes for manual tracking..."
							></textarea>
						</div>
					</div>

					<!-- Pricing Preview -->
					{#if pricingPreview}
						<div class="alert alert-info mt-4">
							<div>
								<h3 class="font-bold mb-2">Pricing Preview</h3>
								<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
									<div>
										<div class="text-base-content/70">
											{billingCycle === 'monthly' ? 'Monthly' : 'Annual'} Price
										</div>
										<div class="font-bold">
											{formatCurrency(
												billingCycle === 'monthly'
													? pricingPreview.monthly
													: pricingPreview.annual
											)}
										</div>
									</div>
									<div>
										<div class="text-base-content/70">Platform Fee (15%)</div>
										<div class="font-bold">{formatCurrency(pricingPreview.platformFee)}</div>
									</div>
									<div>
										<div class="text-base-content/70">Creator Revenue (85%)</div>
										<div class="font-bold">{formatCurrency(pricingPreview.creatorRevenue)}</div>
									</div>
									<div>
										<div class="text-base-content/70">Payment Method</div>
										<div class="font-bold">Manual</div>
									</div>
								</div>
							</div>
						</div>
					{:else if selectedJourneyId && selectedTierId}
						<div class="alert alert-warning mt-4">
							<span>⚠️ No pricing configured for this journey/tier combination</span>
						</div>
					{/if}

					<!-- Submit Button -->
					<div class="card-actions justify-end mt-6">
						<button
							type="button"
							class="btn btn-ghost"
							onclick={() => {
								showCreateForm = false;
								selectedUserId = null;
								selectedJourneyId = null;
								selectedTierId = null;
								subscriptionNotes = '';
								pricingPreview = null;
							}}
						>
							Cancel
						</button>
						<button
							type="submit"
							class="btn btn-primary"
							disabled={!selectedUserId ||
								!selectedJourneyId ||
								!selectedTierId ||
								!pricingPreview}
						>
							Create Subscription
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Subscriptions List -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title mb-4">Active Subscriptions ({data.subscriptions.length})</h2>

			{#if data.subscriptions.length === 0}
				<div class="text-center py-8 text-base-content/70">
					<p>No subscriptions found. Create your first subscription above.</p>
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="table table-zebra">
						<thead>
							<tr>
								<th>User</th>
								<th>Journey</th>
								<th>Tier</th>
								<th>Billing</th>
								<th>Amount</th>
								<th>Status</th>
								<th>Period</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each data.subscriptions as subscription}
								<tr>
									<!-- User -->
									<td>
										<div class="font-bold">{subscription.username}</div>
										<div class="text-sm opacity-70">{subscription.email}</div>
									</td>

									<!-- Journey -->
									<td>
										<a
											href="/journeys/{subscription.journey_slug}"
											class="link link-primary"
											target="_blank"
										>
											{subscription.journey_name}
										</a>
									</td>

									<!-- Tier -->
									<td>
										<div class="badge badge-outline">{subscription.tier_name}</div>
									</td>

									<!-- Billing Cycle -->
									<td>
										<span class="capitalize">{subscription.billing_cycle}</span>
									</td>

									<!-- Amount -->
									<td>
										<div class="font-bold">{formatCurrency(subscription.price_amount)}</div>
										<div class="text-xs opacity-70">
											Platform: {formatCurrency(subscription.platform_fee)}
										</div>
										<div class="text-xs opacity-70">
											Creator: {formatCurrency(subscription.creator_amount)}
										</div>
									</td>

									<!-- Status -->
									<td>
										{#if editingSubscriptionId === subscription.id}
											<form
												method="POST"
												action="?/updateSubscriptionStatus"
												use:enhance={() => {
													return async ({ result, update }) => {
														await update();
														if (result.type === 'success') {
															if (result.data?.success) {
																cancelEditing();
																await invalidateAll();
																alert('Status updated successfully!');
															} else if (result.data?.error) {
																alert(`Error: ${result.data.error}`);
															}
														}
													};
												}}
											>
												<input type="hidden" name="subscription_id" value={subscription.id} />
												<select
													name="status"
													bind:value={editingStatus}
													class="select select-bordered select-sm"
												>
													<option value="active">Active</option>
													<option value="paused">Paused</option>
													<option value="cancelled">Cancelled</option>
													<option value="expired">Expired</option>
												</select>
												<input type="hidden" name="notes" bind:value={editingNotes} />
												<div class="mt-1 space-x-1">
													<button type="submit" class="btn btn-success btn-xs">Save</button>
													<button type="button" class="btn btn-ghost btn-xs" onclick={cancelEditing}>
														Cancel
													</button>
												</div>
											</form>
										{:else}
											<div class="badge {getStatusBadgeClass(subscription.status)}">
												{subscription.status}
											</div>
										{/if}
									</td>

									<!-- Period -->
									<td>
										<div class="text-sm">
											<div>Start: {formatDate(subscription.current_period_start)}</div>
											<div>End: {formatDate(subscription.current_period_end)}</div>
										</div>
									</td>

									<!-- Actions -->
									<td>
										{#if editingSubscriptionId !== subscription.id}
											<button
												class="btn btn-ghost btn-xs"
												onclick={() => startEditingStatus(subscription)}
											>
												Edit Status
											</button>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>

	<!-- Notes Section -->
	<div class="alert alert-info mt-8">
		<div>
			<h3 class="font-bold mb-2">Manual Subscription Management</h3>
			<ul class="list-disc list-inside text-sm space-y-1">
				<li>All subscriptions are tracked manually until Stripe integration is complete</li>
				<li>
					Transactions are automatically created and marked as "completed" for manual tracking
				</li>
				<li>Platform fee is automatically calculated at 15% (configurable in settings)</li>
				<li>Users must have payment recorded externally (e.g., via bank transfer, cash, etc.)</li>
				<li>Status changes: Active → Paused/Cancelled/Expired as needed</li>
			</ul>
		</div>
	</div>
</div>
