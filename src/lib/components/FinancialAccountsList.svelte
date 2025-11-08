<script lang="ts">
	import { enhance } from '$app/forms';
	import type { BankAccount } from '$lib/types';
	import FormField from './FormField.svelte';

	let { accounts = [], userId }: { accounts?: BankAccount[]; userId: number } = $props();

	let isDialogOpen = $state(false);
	let isEditing = $state(false);
	let currentAccount = $state<Partial<BankAccount>>({
		institution_name: '',
		account_type: 'Checking',
		account_number: '',
		routing_number: '',
		balance: ''
	});

	const accountTypeOptions = [
		'Checking',
		'Savings',
		'Investment',
		'Retirement (401k)',
		'Retirement (IRA)',
		'CD',
		'Money Market',
		'Other'
	];

	function openAddDialog() {
		isEditing = false;
		currentAccount = {
			institution_name: '',
			account_type: 'Checking',
			account_number: '',
			routing_number: '',
			balance: ''
		};
		isDialogOpen = true;
	}

	function openEditDialog(account: BankAccount) {
		isEditing = true;
		currentAccount = { ...account };
		isDialogOpen = true;
	}

	function closeDialog() {
		isDialogOpen = false;
		currentAccount = {
			institution_name: '',
			account_type: 'Checking',
			account_number: '',
			routing_number: '',
			balance: ''
		};
	}

	function formatCurrency(value?: number | string | null): string {
		if (value === undefined || value === null || value === '') return 'Not specified';
		const numberValue = typeof value === 'number' ? value : Number(value);
		if (Number.isNaN(numberValue)) return 'Not specified';
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 2
		}).format(numberValue);
	}
</script>

<div class="space-y-6">
	<div class="flex justify-between items-center">
		<div>
			<h2 class="text-2xl font-semibold" style="color: var(--color-foreground);">Financial Accounts</h2>
			<p class="mt-2" style="color: var(--color-muted-foreground);">
				Track your bank, savings, and investment accounts in one place.
			</p>
		</div>
		<button class="btn" style="background-color: var(--color-primary); color: var(--color-primary-foreground);" onclick={openAddDialog}>
			Add Account
		</button>
	</div>

	{#if accounts.length === 0}
		<div class="card shadow-xl border-2 border-dashed" style="background-color: var(--color-card);">
			<div class="card-body flex flex-col items-center justify-center py-12 text-center">
				<svg
					class="w-16 h-16 mb-4"
					style="color: var(--color-muted-foreground);"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 10h18M5 6h14M6 14h12M9 18h6"
					/>
				</svg>
				<p class="text-lg font-medium mb-2" style="color: var(--color-foreground);">
					No accounts yet
				</p>
				<p class="text-sm mb-4" style="color: var(--color-muted-foreground);">
					Add your first financial account to start tracking balances and institutions.
				</p>
				<button class="btn" style="background-color: var(--color-primary); color: var(--color-primary-foreground);" onclick={openAddDialog}>
					Add Your First Account
				</button>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each accounts as account (account.id)}
				<div class="card shadow-xl h-full" style="background-color: var(--color-card);">
					<div class="card-body flex flex-col">
						<div class="flex justify-between items-start mb-4">
							<div>
								<h3 class="card-title text-lg">{account.institution_name || 'Unnamed Institution'}</h3>
								<p class="text-sm capitalize" style="color: var(--color-muted-foreground);">
									{account.account_type || 'Account'}
								</p>
							</div>
							<span class="text-sm font-semibold" style="color: var(--color-foreground);">
								{formatCurrency(account.balance)}
							</span>
						</div>

						<div class="space-y-2 text-sm flex-1">
							{#if account.account_number}
								<div>
									<span class="font-medium" style="color: var(--color-muted-foreground);">
										Account #
									</span>
									<p style="color: var(--color-foreground);">{account.account_number}</p>
								</div>
							{/if}
							{#if account.routing_number}
								<div>
									<span class="font-medium" style="color: var(--color-muted-foreground);">
										Routing #
									</span>
									<p style="color: var(--color-foreground);">{account.routing_number}</p>
								</div>
							{/if}
						</div>

						<div class="card-actions justify-end mt-4 gap-2">
							<button class="btn btn-sm btn-outline" onclick={() => openEditDialog(account)}>
								Edit
							</button>
							<form method="POST" action="?/deleteBankAccount" use:enhance>
								<input type="hidden" name="id" value={account.id} />
								<button type="submit" class="btn btn-sm" style="background-color: var(--color-destructive); color: var(--color-destructive-foreground);">
									Delete
								</button>
							</form>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<dialog class="modal" class:modal-open={isDialogOpen}>
	<div class="modal-box max-w-2xl">
		<h3 class="font-bold text-lg">{isEditing ? 'Edit Account' : 'Add New Account'}</h3>
		<p class="py-2" style="color: var(--color-muted-foreground);">
			{isEditing ? 'Update account details' : 'Add a financial account to your plan'}
		</p>

		<form
			method="POST"
			action={isEditing ? '?/updateBankAccount' : '?/addBankAccount'}
			use:enhance={() => {
				return async ({ result, update }) => {
					await update();
					if (result.type === 'success') {
						closeDialog();
					}
				};
			}}
		>
			{#if isEditing && currentAccount.id}
				<input type="hidden" name="id" value={currentAccount.id} />
			{/if}

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
				<FormField
					label="Institution Name"
					name="institution_name"
					bind:value={currentAccount.institution_name}
					required
				/>
				<FormField
					label="Account Type"
					name="account_type"
					type="select"
					options={accountTypeOptions}
					bind:value={currentAccount.account_type}
					required
				/>
				<FormField
					label="Account Number (last 4 or masked)"
					name="account_number"
					bind:value={currentAccount.account_number}
					required
				/>
				<FormField
					label="Routing Number"
					name="routing_number"
					bind:value={currentAccount.routing_number}
				/>
				<FormField
					label="Balance"
					name="balance"
					type="number"
					bind:value={currentAccount.balance}
					step="0.01"
					min="0"
				/>
			</div>

			<div class="modal-action">
				<button type="button" class="btn btn-outline" onclick={closeDialog}>Cancel</button>
				<button type="submit" class="btn" style="background-color: var(--color-primary); color: var(--color-primary-foreground);">
					{isEditing ? 'Update' : 'Add'} Account
				</button>
			</div>
		</form>
	</div>

	<form method="dialog" class="modal-backdrop">
		<button onclick={closeDialog}>close</button>
	</form>
</dialog>
