<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

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

	// Format month from YYYY-MM
	function formatMonth(monthStr: string): string {
		const [year, month] = monthStr.split('-');
		return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short'
		});
	}

	// Calculate percentage
	function calculatePercentage(value: number, total: number): number {
		if (total === 0) return 0;
		return Math.round((value / total) * 100);
	}

	// Get max revenue for chart scaling
	const maxMonthlyRevenue = $derived(
		data.monthlyRevenue.length > 0
			? Math.max(...data.monthlyRevenue.map((m) => m.revenue))
			: 0
	);
</script>

<svelte:head>
	<title>Revenue Dashboard - Wrap It Up</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-4xl font-bold mb-2">Revenue Dashboard</h1>
		<p class="text-base-content/70">Track your earnings and journey performance</p>
	</div>

	<!-- Revenue Summary -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
		<div class="stat bg-gradient-to-br from-primary to-primary/80 text-primary-content shadow-xl rounded-lg">
			<div class="stat-title text-primary-content/80">Month-to-Date</div>
			<div class="stat-value text-3xl">{formatCurrency(data.revenueSummary.mtd_revenue)}</div>
			<div class="stat-desc text-primary-content/70">Revenue this month</div>
		</div>

		<div class="stat bg-gradient-to-br from-secondary to-secondary/80 text-secondary-content shadow-xl rounded-lg">
			<div class="stat-title text-secondary-content/80">Projected Monthly</div>
			<div class="stat-value text-3xl">{formatCurrency(data.revenueSummary.projected_monthly)}</div>
			<div class="stat-desc text-secondary-content/70">From active subscriptions</div>
		</div>

		<div class="stat bg-gradient-to-br from-accent to-accent/80 text-accent-content shadow-xl rounded-lg">
			<div class="stat-title text-accent-content/80">All-Time Revenue</div>
			<div class="stat-value text-3xl">{formatCurrency(data.revenueSummary.all_time_revenue)}</div>
			<div class="stat-desc text-accent-content/70">Total earnings</div>
		</div>

		<div class="stat bg-gradient-to-br from-success to-success/80 text-success-content shadow-xl rounded-lg">
			<div class="stat-title text-success-content/80">Pending Payout</div>
			<div class="stat-value text-3xl">{formatCurrency(data.revenueSummary.pending_payout)}</div>
			<div class="stat-desc text-success-content/70">Ready for withdrawal</div>
		</div>
	</div>

	<!-- Active Subscriptions -->
	<div class="card bg-base-100 shadow-xl mb-8">
		<div class="card-body">
			<h2 class="card-title">Active Subscriptions</h2>
			<div class="stat-value text-4xl text-primary">{data.revenueSummary.active_subscriptions}</div>
			<p class="text-base-content/70">
				Monthly recurring subscribers across all your journeys
			</p>
		</div>
	</div>

	<!-- Monthly Revenue Trend -->
	{#if data.monthlyRevenue.length > 0}
		<div class="card bg-base-100 shadow-xl mb-8">
			<div class="card-body">
				<h2 class="card-title mb-6">Revenue Trend (Last 6 Months)</h2>

				<div class="space-y-4">
					{#each data.monthlyRevenue.reverse() as month}
						{@const barWidth = maxMonthlyRevenue > 0 ? (month.revenue / maxMonthlyRevenue) * 100 : 0}
						<div>
							<div class="flex justify-between mb-1">
								<span class="font-semibold">{formatMonth(month.month)}</span>
								<span class="text-base-content/70">
									{formatCurrency(month.revenue)} ({month.transaction_count} transactions)
								</span>
							</div>
							<div class="w-full bg-base-300 rounded-full h-4">
								<div
									class="bg-gradient-to-r from-primary to-secondary h-4 rounded-full transition-all"
									style="width: {barWidth}%"
								></div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Revenue by Journey -->
	{#if data.revenueByJourney.length > 0}
		<div class="card bg-base-100 shadow-xl mb-8">
			<div class="card-body">
				<h2 class="card-title mb-4">Revenue by Journey</h2>

				<div class="overflow-x-auto">
					<table class="table">
						<thead>
							<tr>
								<th>Journey</th>
								<th>Total Revenue</th>
								<th>Subscription Revenue</th>
								<th>Active Subscribers</th>
								<th>Transactions</th>
							</tr>
						</thead>
						<tbody>
							{#each data.revenueByJourney as journey}
								<tr>
									<td>
										<a
											href="/admin/journeys/{journey.journey_id}/edit"
											class="link link-primary font-bold"
										>
											{journey.journey_name}
										</a>
									</td>
									<td class="font-bold">{formatCurrency(journey.total_revenue)}</td>
									<td>{formatCurrency(journey.subscription_revenue)}</td>
									<td>
										<div class="badge badge-primary">{journey.active_subscribers}</div>
									</td>
									<td>{journey.transaction_count}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{:else}
		<div class="alert alert-info mb-8">
			<span>
				No revenue data yet. Start by publishing your journeys and adding pricing in the Journey
				Editor.
			</span>
		</div>
	{/if}

	<!-- Revenue by Type -->
	{#if data.revenueByType.length > 0}
		<div class="card bg-base-100 shadow-xl mb-8">
			<div class="card-body">
				<h2 class="card-title mb-4">Revenue by Type</h2>

				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each data.revenueByType as type}
						<div class="stat bg-base-200 rounded-lg">
							<div class="stat-title capitalize">{type.transaction_type}</div>
							<div class="stat-value text-2xl">{formatCurrency(type.revenue)}</div>
							<div class="stat-desc">{type.count} transactions</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Recent Transactions -->
	{#if data.recentTransactions.length > 0}
		<div class="card bg-base-100 shadow-xl mb-8">
			<div class="card-body">
				<h2 class="card-title mb-4">Recent Transactions</h2>

				<div class="overflow-x-auto">
					<table class="table table-zebra">
						<thead>
							<tr>
								<th>Date</th>
								<th>Type</th>
								<th>Journey</th>
								<th>User</th>
								<th>Amount</th>
								<th>Your Earnings</th>
							</tr>
						</thead>
						<tbody>
							{#each data.recentTransactions.slice(0, 20) as transaction}
								<tr>
									<td class="text-sm">{formatDate(transaction.completed_at)}</td>
									<td>
										<div class="badge badge-sm capitalize">{transaction.transaction_type}</div>
									</td>
									<td>
										<a href="/journeys/{transaction.journey_slug}" class="link link-primary">
											{transaction.journey_name}
										</a>
									</td>
									<td>{transaction.username}</td>
									<td>{formatCurrency(transaction.amount)}</td>
									<td class="font-bold text-success">
										{formatCurrency(transaction.creator_amount)}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				{#if data.recentTransactions.length > 20}
					<p class="text-sm text-base-content/70 mt-4">
						Showing 20 of {data.recentTransactions.length} recent transactions
					</p>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Journey List -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title mb-4">Your Journeys ({data.journeys.length})</h2>

			{#if data.journeys.length === 0}
				<div class="text-center py-8">
					<p class="text-base-content/70 mb-4">You haven't created any journeys yet.</p>
					<a href="/admin/journeys" class="btn btn-primary">Create Your First Journey</a>
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each data.journeys as journey}
						<div class="card bg-base-200">
							<div class="card-body">
								<h3 class="card-title text-lg">
									{journey.name}
									{#if journey.is_featured}
										<div class="badge badge-primary badge-sm">Featured</div>
									{/if}
								</h3>

								<div class="space-y-2 text-sm">
									<div class="flex justify-between">
										<span class="text-base-content/70">Status:</span>
										<span class="badge {journey.is_published ? 'badge-success' : 'badge-warning'}">
											{journey.is_published ? 'Published' : 'Draft'}
										</span>
									</div>

									<div class="flex justify-between">
										<span class="text-base-content/70">Users:</span>
										<span class="font-bold">{journey.use_count}</span>
									</div>
								</div>

								<div class="card-actions justify-end mt-4">
									<a href="/admin/journeys/{journey.id}/edit" class="btn btn-sm btn-primary">
										Edit Journey
									</a>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Payout Information -->
	<div class="alert alert-info mt-8">
		<div>
			<h3 class="font-bold mb-2">Payout Information</h3>
			<ul class="list-disc list-inside text-sm space-y-1">
				<li>Minimum payout amount: $100.00</li>
				<li>Payouts are processed manually - contact admin to request payout</li>
				<li>Platform fee: 15% (you receive 85% of all revenue)</li>
				<li>All amounts shown are after platform fees (your net earnings)</li>
				<li>Transaction history is available for tax reporting purposes</li>
			</ul>
		</div>
	</div>
</div>
