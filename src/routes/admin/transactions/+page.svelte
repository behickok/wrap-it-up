<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';

	let { data }: { data: PageData } = $props();

	// Filter state
	let typeFilter = $state(data.filters.type || '');
	let statusFilter = $state(data.filters.status || '');
	let searchQuery = $state(data.filters.search || '');
	let startDate = $state(data.filters.startDate || '');
	let endDate = $state(data.filters.endDate || '');

	// Transaction editing state
	let editingTransactionId = $state<number | null>(null);
	let editingStatus = $state('');
	let editingNotes = $state('');

	// Manual transaction creation
	let showCreateForm = $state(false);

	// Apply filters
	function applyFilters() {
		const params = new URLSearchParams();
		if (typeFilter) params.set('type', typeFilter);
		if (statusFilter) params.set('status', statusFilter);
		if (searchQuery) params.set('q', searchQuery);
		if (startDate) params.set('start_date', startDate);
		if (endDate) params.set('end_date', endDate);
		window.location.href = `/admin/transactions?${params.toString()}`;
	}

	// Clear filters
	function clearFilters() {
		typeFilter = '';
		statusFilter = '';
		searchQuery = '';
		startDate = '';
		endDate = '';
		window.location.href = '/admin/transactions';
	}

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

	// Format datetime
	function formatDateTime(dateStr: string | null): string {
		if (!dateStr) return 'N/A';
		return new Date(dateStr).toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Start editing transaction
	function startEditing(transaction: any) {
		editingTransactionId = transaction.id;
		editingStatus = transaction.status;
		editingNotes = transaction.notes || '';
	}

	// Cancel editing
	function cancelEditing() {
		editingTransactionId = null;
		editingStatus = '';
		editingNotes = '';
	}

	// Get status badge class
	function getStatusBadgeClass(status: string): string {
		switch (status) {
			case 'completed':
				return 'badge-success';
			case 'pending':
				return 'badge-warning';
			case 'failed':
				return 'badge-error';
			case 'refunded':
				return 'badge-info';
			case 'cancelled':
				return 'badge-neutral';
			default:
				return 'badge-ghost';
		}
	}

	// Get type badge class
	function getTypeBadgeClass(type: string): string {
		switch (type) {
			case 'subscription':
				return 'badge-primary';
			case 'review':
				return 'badge-secondary';
			case 'session':
				return 'badge-accent';
			case 'affiliate':
				return 'badge-info';
			case 'refund':
				return 'badge-error';
			default:
				return 'badge-ghost';
		}
	}
</script>

<svelte:head>
	<title>Transaction Tracking - Wrap It Up Admin</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-4xl font-bold mb-2">Transaction Tracking</h1>
				<p class="text-base-content/70">Monitor all financial transactions and revenue</p>
			</div>
			<button class="btn btn-primary" onclick={() => (showCreateForm = !showCreateForm)}>
				{showCreateForm ? 'Cancel' : '+ Manual Transaction'}
			</button>
		</div>
	</div>

	<!-- Summary Stats -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
		<div class="stat bg-base-100 shadow rounded-lg">
			<div class="stat-title">Total Transactions</div>
			<div class="stat-value text-2xl">{data.summary.total_count}</div>
			<div class="stat-desc">All time</div>
		</div>

		<div class="stat bg-base-100 shadow rounded-lg">
			<div class="stat-title">Total Revenue</div>
			<div class="stat-value text-2xl">{formatCurrency(data.summary.total_amount)}</div>
			<div class="stat-desc">Gross revenue</div>
		</div>

		<div class="stat bg-base-100 shadow rounded-lg">
			<div class="stat-title">Platform Fees</div>
			<div class="stat-value text-2xl">{formatCurrency(data.summary.total_platform_fee)}</div>
			<div class="stat-desc">15% of revenue</div>
		</div>

		<div class="stat bg-base-100 shadow rounded-lg">
			<div class="stat-title">Creator Revenue</div>
			<div class="stat-value text-2xl">{formatCurrency(data.summary.total_creator_amount)}</div>
			<div class="stat-desc">85% of revenue</div>
		</div>
	</div>

	<!-- Status Breakdown -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
		<div class="stat bg-base-100 shadow rounded-lg">
			<div class="stat-title">Completed</div>
			<div class="stat-value text-success">{data.summary.completed_count}</div>
		</div>

		<div class="stat bg-base-100 shadow rounded-lg">
			<div class="stat-title">Pending</div>
			<div class="stat-value text-warning">{data.summary.pending_count}</div>
		</div>

		<div class="stat bg-base-100 shadow rounded-lg">
			<div class="stat-title">Failed</div>
			<div class="stat-value text-error">{data.summary.failed_count}</div>
		</div>
	</div>

	<!-- Revenue by Type -->
	{#if data.revenueByType.length > 0}
		<div class="card bg-base-100 shadow-xl mb-8">
			<div class="card-body">
				<h2 class="card-title">Revenue by Transaction Type</h2>
				<div class="overflow-x-auto">
					<table class="table">
						<thead>
							<tr>
								<th>Type</th>
								<th>Count</th>
								<th>Total Amount</th>
								<th>Platform Fee</th>
								<th>Creator Amount</th>
							</tr>
						</thead>
						<tbody>
							{#each data.revenueByType as revenue}
								<tr>
									<td>
										<div class="badge {getTypeBadgeClass(revenue.transaction_type)}">
											{revenue.transaction_type}
										</div>
									</td>
									<td>{revenue.count}</td>
									<td class="font-bold">{formatCurrency(revenue.total_amount)}</td>
									<td>{formatCurrency(revenue.platform_fee)}</td>
									<td>{formatCurrency(revenue.creator_amount)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}

	<!-- Create Manual Transaction Form -->
	{#if showCreateForm}
		<div class="card bg-base-100 shadow-xl mb-8">
			<div class="card-body">
				<h2 class="card-title">Create Manual Transaction</h2>
				<form
					method="POST"
					action="?/createManualTransaction"
					use:enhance={() => {
						return async ({ result, update }) => {
							await update();
							if (result.type === 'success' && result.data?.success) {
								showCreateForm = false;
								await invalidateAll();
								alert('Transaction created successfully!');
							} else if (result.data?.error) {
								alert(`Error: ${result.data.error}`);
							}
						};
					}}
				>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="form-control">
							<label class="label">
								<span class="label-text">Transaction Type *</span>
							</label>
							<select name="transaction_type" class="select select-bordered" required>
								<option value="">Select type...</option>
								<option value="subscription">Subscription</option>
								<option value="review">Review</option>
								<option value="session">Session</option>
								<option value="affiliate">Affiliate</option>
								<option value="adjustment">Adjustment</option>
							</select>
						</div>

						<div class="form-control">
							<label class="label">
								<span class="label-text">Amount *</span>
							</label>
							<input
								type="number"
								name="amount"
								step="0.01"
								min="0"
								class="input input-bordered"
								placeholder="0.00"
								required
							/>
						</div>

						<div class="form-control">
							<label class="label">
								<span class="label-text">User ID *</span>
							</label>
							<input
								type="number"
								name="user_id"
								class="input input-bordered"
								placeholder="User ID"
								required
							/>
						</div>

						<div class="form-control">
							<label class="label">
								<span class="label-text">Journey ID *</span>
							</label>
							<input
								type="number"
								name="journey_id"
								class="input input-bordered"
								placeholder="Journey ID"
								required
							/>
						</div>

						<div class="form-control md:col-span-2">
							<label class="label">
								<span class="label-text">Description</span>
							</label>
							<input
								type="text"
								name="description"
								class="input input-bordered"
								placeholder="Transaction description..."
							/>
						</div>

						<div class="form-control md:col-span-2">
							<label class="label">
								<span class="label-text">Notes</span>
							</label>
							<textarea
								name="notes"
								class="textarea textarea-bordered"
								rows="2"
								placeholder="Internal notes..."
							></textarea>
						</div>
					</div>

					<div class="card-actions justify-end mt-4">
						<button type="button" class="btn btn-ghost" onclick={() => (showCreateForm = false)}>
							Cancel
						</button>
						<button type="submit" class="btn btn-primary">Create Transaction</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Filters -->
	<div class="card bg-base-100 shadow-xl mb-8">
		<div class="card-body">
			<h2 class="card-title mb-4">Filters</h2>

			<div class="grid grid-cols-1 md:grid-cols-5 gap-4">
				<!-- Type Filter -->
				<div class="form-control">
					<label class="label">
						<span class="label-text">Type</span>
					</label>
					<select bind:value={typeFilter} class="select select-bordered">
						<option value="">All Types</option>
						<option value="subscription">Subscription</option>
						<option value="review">Review</option>
						<option value="session">Session</option>
						<option value="affiliate">Affiliate</option>
						<option value="refund">Refund</option>
						<option value="adjustment">Adjustment</option>
					</select>
				</div>

				<!-- Status Filter -->
				<div class="form-control">
					<label class="label">
						<span class="label-text">Status</span>
					</label>
					<select bind:value={statusFilter} class="select select-bordered">
						<option value="">All Statuses</option>
						<option value="pending">Pending</option>
						<option value="completed">Completed</option>
						<option value="failed">Failed</option>
						<option value="refunded">Refunded</option>
						<option value="cancelled">Cancelled</option>
					</select>
				</div>

				<!-- Search -->
				<div class="form-control">
					<label class="label">
						<span class="label-text">Search</span>
					</label>
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="User or journey..."
						class="input input-bordered"
						onkeydown={(e) => e.key === 'Enter' && applyFilters()}
					/>
				</div>

				<!-- Start Date -->
				<div class="form-control">
					<label class="label">
						<span class="label-text">Start Date</span>
					</label>
					<input type="date" bind:value={startDate} class="input input-bordered" />
				</div>

				<!-- End Date -->
				<div class="form-control">
					<label class="label">
						<span class="label-text">End Date</span>
					</label>
					<input type="date" bind:value={endDate} class="input input-bordered" />
				</div>
			</div>

			<!-- Filter Actions -->
			<div class="flex gap-2 mt-4">
				<button class="btn btn-primary" onclick={applyFilters}>Apply Filters</button>
				{#if data.filters.type || data.filters.status || data.filters.search || data.filters.startDate || data.filters.endDate}
					<button class="btn btn-ghost" onclick={clearFilters}>Clear</button>
				{/if}
			</div>
		</div>
	</div>

	<!-- Transactions Table -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title mb-4">
				Transactions ({data.transactions.length})
			</h2>

			{#if data.transactions.length === 0}
				<div class="text-center py-8 text-base-content/70">
					<p>No transactions found.</p>
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="table table-zebra">
						<thead>
							<tr>
								<th>ID</th>
								<th>Date</th>
								<th>Type</th>
								<th>User</th>
								<th>Journey</th>
								<th>Amount</th>
								<th>Status</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each data.transactions as transaction}
								<tr>
									<!-- ID -->
									<td class="font-mono text-sm">#{transaction.id}</td>

									<!-- Date -->
									<td>
										<div class="text-sm">{formatDate(transaction.transaction_date)}</div>
										<div class="text-xs opacity-70">{formatDateTime(transaction.created_at)}</div>
									</td>

									<!-- Type -->
									<td>
										<div class="badge {getTypeBadgeClass(transaction.transaction_type)}">
											{transaction.transaction_type}
										</div>
									</td>

									<!-- User -->
									<td>
										<div class="font-bold">{transaction.username}</div>
										<div class="text-xs opacity-70">{transaction.email}</div>
									</td>

									<!-- Journey -->
									<td>
										<a
											href="/journeys/{transaction.journey_slug}"
											class="link link-primary"
											target="_blank"
										>
											{transaction.journey_name}
										</a>
									</td>

									<!-- Amount -->
									<td>
										<div class="font-bold">{formatCurrency(transaction.amount)}</div>
										<div class="text-xs opacity-70">
											Platform: {formatCurrency(transaction.platform_fee)}
										</div>
										<div class="text-xs opacity-70">
											Creator: {formatCurrency(transaction.creator_amount)}
										</div>
									</td>

									<!-- Status -->
									<td>
										{#if editingTransactionId === transaction.id}
											<form
												method="POST"
												action="?/updateTransactionStatus"
												use:enhance={() => {
													return async ({ result, update }) => {
														await update();
														if (result.type === 'success' && result.data?.success) {
															cancelEditing();
															await invalidateAll();
															alert('Transaction updated successfully!');
														} else if (result.data?.error) {
															alert(`Error: ${result.data.error}`);
														}
													};
												}}
											>
												<input type="hidden" name="transaction_id" value={transaction.id} />
												<select
													name="status"
													bind:value={editingStatus}
													class="select select-bordered select-sm"
												>
													<option value="pending">Pending</option>
													<option value="completed">Completed</option>
													<option value="failed">Failed</option>
													<option value="refunded">Refunded</option>
													<option value="cancelled">Cancelled</option>
												</select>
												<textarea
													name="notes"
													bind:value={editingNotes}
													class="textarea textarea-bordered textarea-sm mt-1 w-full"
													rows="2"
													placeholder="Notes..."
												></textarea>
												<div class="mt-1 space-x-1">
													<button type="submit" class="btn btn-success btn-xs">Save</button>
													<button type="button" class="btn btn-ghost btn-xs" onclick={cancelEditing}>
														Cancel
													</button>
												</div>
											</form>
										{:else}
											<div class="badge {getStatusBadgeClass(transaction.status)}">
												{transaction.status}
											</div>
											{#if transaction.completed_at}
												<div class="text-xs opacity-70 mt-1">
													{formatDate(transaction.completed_at)}
												</div>
											{/if}
										{/if}
									</td>

									<!-- Actions -->
									<td>
										{#if editingTransactionId !== transaction.id}
											<button
												class="btn btn-ghost btn-xs"
												onclick={() => startEditing(transaction)}
											>
												Edit
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

	<!-- Notes -->
	<div class="alert alert-info mt-8">
		<div>
			<h3 class="font-bold mb-2">Transaction Tracking Notes</h3>
			<ul class="list-disc list-inside text-sm space-y-1">
				<li>All transactions are tracked manually until Stripe integration</li>
				<li>Platform fee is automatically calculated at 15%</li>
				<li>
					Mark transactions as "completed" once payment is verified externally (e.g., bank
					transfer)
				</li>
				<li>Use notes field to track payment method, reference numbers, etc.</li>
				<li>Showing most recent 200 transactions (use filters to narrow results)</li>
			</ul>
		</div>
	</div>
</div>
