<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Insurance } from '$lib/types';
	import FormField from './FormField.svelte';

	let { policies = [], userId }: { policies?: Insurance[]; userId: number } = $props();

	let isDialogOpen = $state(false);
	let isEditing = $state(false);
	let currentPolicy = $state<Partial<Insurance>>({
		insurance_type: '',
		provider: '',
		policy_number: '',
		coverage_amount: '',
		beneficiary: '',
		agent_name: '',
		agent_phone: '',
		premium_amount: '',
		premium_frequency: 'Monthly'
	});

	const insuranceTypes = [
		'Life',
		'Health',
		'Disability',
		'Homeowners',
		'Renters',
		'Auto',
		'Long-term Care',
		'Other'
	];

	const premiumFrequencies = ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'];

	function openAddDialog() {
		isEditing = false;
		currentPolicy = {
			insurance_type: 'Life',
			premium_frequency: 'Monthly'
		};
		isDialogOpen = true;
	}

	function openEditDialog(policy: Insurance) {
		isEditing = true;
		currentPolicy = { ...policy };
		isDialogOpen = true;
	}

	function closeDialog() {
		isDialogOpen = false;
		currentPolicy = {
			insurance_type: 'Life',
			premium_frequency: 'Monthly'
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
			<h2 class="text-2xl font-semibold" style="color: var(--color-foreground);">Insurance Policies</h2>
			<p class="mt-2" style="color: var(--color-muted-foreground);">
				Document each policy’s coverage, beneficiaries, and agent contacts.
			</p>
		</div>
		<button class="btn" style="background-color: var(--color-primary); color: var(--color-primary-foreground);" onclick={openAddDialog}>
			Add Policy
		</button>
	</div>

	{#if policies.length === 0}
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
						d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<p class="text-lg font-medium mb-2" style="color: var(--color-foreground);">
					No policies found
				</p>
				<p class="text-sm mb-4" style="color: var(--color-muted-foreground);">
					Add your first policy to keep critical coverage details handy.
				</p>
				<button class="btn" style="background-color: var(--color-primary); color: var(--color-primary-foreground);" onclick={openAddDialog}>
					Add Your First Policy
				</button>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each policies as policy (policy.id)}
				<div class="card shadow-xl h-full" style="background-color: var(--color-card);">
					<div class="card-body flex flex-col">
						<div class="flex justify-between items-start mb-4">
							<div>
								<h3 class="card-title text-lg">{policy.insurance_type || 'Insurance Policy'}</h3>
								<p class="text-sm" style="color: var(--color-muted-foreground);">
									{policy.provider || 'Provider not specified'}
								</p>
							</div>
							<span class="text-sm font-semibold" style="color: var(--color-foreground);">
								{formatCurrency(policy.coverage_amount)}
							</span>
						</div>

						<div class="space-y-2 text-sm flex-1">
							{#if policy.policy_number}
								<div>
									<span class="font-medium" style="color: var(--color-muted-foreground);">
										Policy #
									</span>
									<p style="color: var(--color-foreground);">{policy.policy_number}</p>
								</div>
							{/if}
							{#if policy.beneficiary}
								<div>
									<span class="font-medium" style="color: var(--color-muted-foreground);">
										Beneficiary
									</span>
									<p style="color: var(--color-foreground);">{policy.beneficiary}</p>
								</div>
							{/if}
							{#if policy.agent_name}
								<div>
									<span class="font-medium" style="color: var(--color-muted-foreground);">
										Agent
									</span>
									<p style="color: var(--color-foreground);">
										{policy.agent_name}{policy.agent_phone ? ` • ${policy.agent_phone}` : ''}
									</p>
								</div>
							{/if}
							{#if policy.premium_amount}
								<div>
									<span class="font-medium" style="color: var(--color-muted-foreground);">
										Premium
									</span>
									<p style="color: var(--color-foreground);">
										{formatCurrency(policy.premium_amount)} / {policy.premium_frequency || 'frequency not set'}
									</p>
								</div>
							{/if}
						</div>

						<div class="card-actions justify-end mt-4 gap-2">
							<button class="btn btn-sm btn-outline" onclick={() => openEditDialog(policy)}>
								Edit
							</button>
							<form method="POST" action="?/deleteInsurance" use:enhance>
								<input type="hidden" name="id" value={policy.id} />
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
		<h3 class="font-bold text-lg">{isEditing ? 'Edit Policy' : 'Add New Policy'}</h3>
		<p class="py-2" style="color: var(--color-muted-foreground);">
			{isEditing ? 'Update policy details' : 'Document a new insurance policy'}
		</p>

		<form
			method="POST"
			action={isEditing ? '?/updateInsurance' : '?/addInsurance'}
			use:enhance={() => {
				return async ({ result, update }) => {
					await update();
					if (result.type === 'success') {
						closeDialog();
					}
				};
			}}
		>
			{#if isEditing && currentPolicy.id}
				<input type="hidden" name="id" value={currentPolicy.id} />
			{/if}

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
				<FormField
					label="Insurance Type"
					name="insurance_type"
					type="select"
					options={insuranceTypes}
					bind:value={currentPolicy.insurance_type}
					required
				/>
				<FormField
					label="Provider"
					name="provider"
					bind:value={currentPolicy.provider}
					required
				/>
				<FormField
					label="Policy Number"
					name="policy_number"
					bind:value={currentPolicy.policy_number}
					required
				/>
				<FormField
					label="Coverage Amount"
					name="coverage_amount"
					type="number"
					bind:value={currentPolicy.coverage_amount}
					step="0.01"
					min="0"
				/>
				<FormField
					label="Beneficiary"
					name="beneficiary"
					bind:value={currentPolicy.beneficiary}
				/>
				<FormField
					label="Agent Name"
					name="agent_name"
					bind:value={currentPolicy.agent_name}
				/>
				<FormField
					label="Agent Phone"
					name="agent_phone"
					type="tel"
					bind:value={currentPolicy.agent_phone}
				/>
				<FormField
					label="Premium Amount"
					name="premium_amount"
					type="number"
					bind:value={currentPolicy.premium_amount}
					step="0.01"
					min="0"
				/>
				<FormField
					label="Premium Frequency"
					name="premium_frequency"
					type="select"
					options={premiumFrequencies}
					bind:value={currentPolicy.premium_frequency}
				/>
			</div>

			<div class="modal-action">
				<button type="button" class="btn btn-outline" onclick={closeDialog}>Cancel</button>
				<button type="submit" class="btn" style="background-color: var(--color-primary); color: var(--color-primary-foreground);">
					{isEditing ? 'Update' : 'Add'} Policy
				</button>
			</div>
		</form>
	</div>

	<form method="dialog" class="modal-backdrop">
		<button onclick={closeDialog}>close</button>
	</form>
</dialog>
