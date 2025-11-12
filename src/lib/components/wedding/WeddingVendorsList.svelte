<script lang="ts">
	import { enhance } from '$app/forms';
	import FormField from '$lib/components/FormField.svelte';
	import type { WeddingVendor } from '$lib/types';

	let { vendors = [] }: { vendors?: WeddingVendor[] } = $props();
	let newVendor = $state({
		vendor_type: '',
		business_name: '',
		contact_name: '',
		contact_email: '',
		contact_phone: '',
		deposit_amount: '',
		balance_due: '',
		next_payment_due: '',
		status: '',
		notes: ''
	});
</script>

<div class="space-y-8">
	<div>
		<h3 class="text-2xl font-semibold mb-2">Vendor roster</h3>
		<p class="text-base-content/70">
			Add the professionals you’re working with, track payments, and keep contact details at your fingertips.
		</p>
	</div>

	<div class="card bg-base-100 shadow-lg border border-base-200">
		<div class="card-body">
			<h4 class="card-title">Add vendor</h4>
			<form
				method="POST"
				action="?/saveWeddingVendor"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						newVendor = {
							vendor_type: '',
							business_name: '',
							contact_name: '',
							contact_email: '',
							contact_phone: '',
							deposit_amount: '',
							balance_due: '',
							next_payment_due: '',
							status: '',
							notes: ''
						};
					};
				}}
				class="grid grid-cols-1 md:grid-cols-2 gap-4"
			>
				<FormField label="Vendor type" name="vendor_type" bind:value={newVendor.vendor_type} placeholder="Planner, florist, DJ…" />
				<FormField label="Business name" name="business_name" bind:value={newVendor.business_name} required />
				<FormField label="Contact name" name="contact_name" bind:value={newVendor.contact_name} />
				<FormField label="Contact email" name="contact_email" type="email" bind:value={newVendor.contact_email} />
				<FormField label="Contact phone" name="contact_phone" type="tel" bind:value={newVendor.contact_phone} />
				<FormField label="Next payment due" name="next_payment_due" type="date" bind:value={newVendor.next_payment_due} />
				<FormField label="Deposit" name="deposit_amount" type="number" bind:value={newVendor.deposit_amount} />
				<FormField label="Balance remaining" name="balance_due" type="number" bind:value={newVendor.balance_due} />
				<FormField label="Status" name="status" bind:value={newVendor.status} placeholder="Consult scheduled, booked, paid…" />
				<FormField label="Notes" name="notes" type="textarea" bind:value={newVendor.notes} />
				<div class="md:col-span-2">
					<button class="btn btn-primary" type="submit">Save vendor</button>
				</div>
			</form>
		</div>
	</div>

	{#if vendors.length === 0}
		<div class="alert alert-info">No vendors added yet.</div>
	{:else}
		<div class="grid gap-4">
			{#each vendors as vendor (vendor.id)}
				<div class="card bg-base-100 shadow border border-base-200">
					<div class="card-body space-y-4">
						<div class="flex items-center justify-between gap-4">
							<div>
								<h4 class="text-xl font-semibold">{vendor.business_name}</h4>
								<p class="text-sm text-base-content/60">{vendor.vendor_type || 'Vendor'}</p>
							</div>
							<span class="badge badge-outline">{vendor.status || 'Planning'}</span>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
							{#if vendor.contact_name}
								<p><strong>Contact:</strong> {vendor.contact_name}</p>
							{/if}
							{#if vendor.contact_email}
								<p><strong>Email:</strong> {vendor.contact_email}</p>
							{/if}
							{#if vendor.contact_phone}
								<p><strong>Phone:</strong> {vendor.contact_phone}</p>
							{/if}
							{#if vendor.next_payment_due}
								<p><strong>Next payment:</strong> {vendor.next_payment_due}</p>
							{/if}
							{#if vendor.deposit_amount}
								<p><strong>Deposit:</strong> ${vendor.deposit_amount}</p>
							{/if}
							{#if vendor.balance_due}
								<p><strong>Balance:</strong> ${vendor.balance_due}</p>
							{/if}
						</div>

						{#if vendor.notes}
							<p class="text-sm text-base-content/70">{vendor.notes}</p>
						{/if}

						<details class="bg-base-200/50 rounded-lg px-4 py-3">
							<summary class="cursor-pointer font-semibold">Update vendor</summary>
							<div class="mt-4 space-y-3">
								<form method="POST" action="?/saveWeddingVendor" use:enhance class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<input type="hidden" name="id" value={vendor.id} />
									<FormField label="Vendor type" name="vendor_type" value={vendor.vendor_type} />
									<FormField label="Business name" name="business_name" value={vendor.business_name} />
									<FormField label="Contact name" name="contact_name" value={vendor.contact_name} />
									<FormField label="Contact email" name="contact_email" type="email" value={vendor.contact_email} />
									<FormField label="Contact phone" name="contact_phone" type="tel" value={vendor.contact_phone} />
									<FormField label="Next payment due" name="next_payment_due" type="date" value={vendor.next_payment_due} />
									<FormField label="Deposit" name="deposit_amount" type="number" value={vendor.deposit_amount} />
									<FormField label="Balance remaining" name="balance_due" type="number" value={vendor.balance_due} />
									<FormField label="Status" name="status" value={vendor.status} />
									<FormField label="Notes" name="notes" type="textarea" value={vendor.notes} />
									<div class="md:col-span-2">
										<button class="btn btn-primary btn-sm" type="submit">Update</button>
									</div>
								</form>
								<form method="POST" action="?/deleteWeddingVendor" use:enhance class="flex justify-end">
									<input type="hidden" name="id" value={vendor.id} />
									<button class="btn btn-error btn-sm" type="submit">Delete vendor</button>
								</form>
							</div>
						</details>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
