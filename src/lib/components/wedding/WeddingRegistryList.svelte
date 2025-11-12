<script lang="ts">
	import { enhance } from '$app/forms';
	import FormField from '$lib/components/FormField.svelte';
	import type { WeddingRegistryItem } from '$lib/types';

	let { items = [] }: { items?: WeddingRegistryItem[] } = $props();
	let newItem = $state({
		retailer: '',
		item_name: '',
		item_url: '',
		price: '',
		quantity: '1',
		priority: '',
		status: '',
		notes: ''
	});
</script>

<div class="space-y-8">
	<div>
		<h3 class="text-2xl font-semibold mb-2">Registry tracker</h3>
		<p class="text-base-content/70">
			Mix experiential gifts, funds, and classic registry items. Track fulfillment status and duplicate requests.
		</p>
	</div>

	<div class="card bg-base-100 shadow-lg border border-base-200">
		<div class="card-body">
			<h4 class="card-title">Add registry item</h4>
			<form
				method="POST"
				action="?/saveWeddingRegistryItem"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						newItem = {
							retailer: '',
							item_name: '',
							item_url: '',
							price: '',
							quantity: '1',
							priority: '',
							status: '',
							notes: ''
						};
					};
				}}
				class="grid grid-cols-1 md:grid-cols-2 gap-4"
			>
				<FormField label="Retailer / Fund" name="retailer" bind:value={newItem.retailer} placeholder="Crate & Barrel, Honeymoon fund…" />
				<FormField label="Item name" name="item_name" bind:value={newItem.item_name} required />
				<FormField label="Item URL" name="item_url" type="url" bind:value={newItem.item_url} />
				<FormField label="Price" name="price" type="number" step="0.01" bind:value={newItem.price} />
				<FormField label="Quantity" name="quantity" type="number" bind:value={newItem.quantity} />
				<FormField label="Priority" name="priority" bind:value={newItem.priority} placeholder="Must-have, nice-to-have…" />
				<FormField label="Status" name="status" bind:value={newItem.status} placeholder="Open, reserved, purchased" />
				<FormField label="Notes" name="notes" type="textarea" bind:value={newItem.notes} />
				<div class="md:col-span-2">
					<button class="btn btn-primary" type="submit">Save item</button>
				</div>
			</form>
		</div>
	</div>

	{#if items.length === 0}
		<div class="alert alert-info">No registry items yet.</div>
	{:else}
		<div class="grid gap-4 md:grid-cols-2">
			{#each items as item (item.id)}
				<div class="card bg-base-100 shadow border border-base-200">
					<div class="card-body space-y-3">
						<div class="flex items-start justify-between gap-4">
							<div>
								<h4 class="text-xl font-semibold">{item.item_name}</h4>
								<p class="text-sm text-base-content/60">{item.retailer || 'Registry item'}</p>
							</div>
							<div class="text-right">
								{#if item.price}
									<p class="font-semibold">${item.price}</p>
								{/if}
								<span class="badge badge-outline text-xs">{item.status || 'Open'}</span>
							</div>
						</div>

						{#if item.item_url}
							<a href={item.item_url} target="_blank" rel="noopener noreferrer" class="link link-primary text-sm">
								View item
							</a>
						{/if}

						{#if item.notes}
							<p class="text-sm text-base-content/70">{item.notes}</p>
						{/if}

						<details class="bg-base-200/50 rounded-lg px-4 py-3">
							<summary class="cursor-pointer font-semibold">Update item</summary>
							<div class="mt-4 space-y-3">
								<form method="POST" action="?/saveWeddingRegistryItem" use:enhance class="grid grid-cols-1 gap-4">
									<input type="hidden" name="id" value={item.id} />
									<FormField label="Retailer / Fund" name="retailer" value={item.retailer} />
									<FormField label="Item name" name="item_name" value={item.item_name} />
									<FormField label="Item URL" name="item_url" type="url" value={item.item_url} />
									<FormField label="Price" name="price" type="number" value={item.price} />
									<FormField label="Quantity" name="quantity" type="number" value={item.quantity} />
									<FormField label="Priority" name="priority" value={item.priority} />
									<FormField label="Status" name="status" value={item.status} />
									<FormField label="Notes" name="notes" type="textarea" value={item.notes} />
									<button class="btn btn-primary btn-sm" type="submit">Update</button>
								</form>
								<form method="POST" action="?/deleteWeddingRegistryItem" use:enhance class="flex justify-end">
									<input type="hidden" name="id" value={item.id} />
									<button class="btn btn-error btn-sm" type="submit">Delete item</button>
								</form>
							</div>
						</details>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
