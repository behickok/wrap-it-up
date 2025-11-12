<script lang="ts">
	import { enhance } from '$app/forms';
	import FormField from '$lib/components/FormField.svelte';

	let { entry = {} }: { entry?: Record<string, any> } = $props();
	let isSaving = $state(false);
</script>

<form
	method="POST"
	action="?/saveWeddingVenue"
	use:enhance={() => {
		isSaving = true;
		return async ({ update }) => {
			await update();
			isSaving = false;
		};
	}}
	class="space-y-6"
>
	<div>
		<h3 class="text-2xl font-semibold mb-2">Venue research</h3>
		<p class="text-base-content/70">
			Keep logistics, contacts, and budget info tied to your ceremony or reception location.
		</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<FormField label="Venue name" name="venue_name" bind:value={entry.venue_name} required />
		<FormField label="Style / vibe" name="venue_style" bind:value={entry.venue_style} placeholder="Loft, garden, ballroom…" />
		<FormField label="Address" name="venue_address" type="textarea" bind:value={entry.venue_address} />
		<FormField label="Capacity" name="capacity" type="number" bind:value={entry.capacity} />
		<FormField label="Primary contact" name="contact_name" bind:value={entry.contact_name} />
		<FormField label="Contact email" name="contact_email" type="email" bind:value={entry.contact_email} />
		<FormField label="Contact phone" name="contact_phone" type="tel" bind:value={entry.contact_phone} />
		<FormField label="Tour date" name="tour_date" type="date" bind:value={entry.tour_date} />
		<FormField label="Decision deadline" name="decision_deadline" type="date" bind:value={entry.decision_deadline} />
		<FormField label="Deposit amount" name="deposit_amount" type="number" step="0.01" bind:value={entry.deposit_amount} />
		<FormField label="Total cost" name="total_cost" type="number" step="0.01" bind:value={entry.total_cost} />
	</div>

	<FormField
		label="Included items"
		name="included_items"
		type="textarea"
		bind:value={entry.included_items}
		placeholder="Tables, chairs, linens, getting-ready suite…"
	/>
	<FormField
		label="Rain plan / backup space"
		name="rain_plan"
		type="textarea"
		bind:value={entry.rain_plan}
	/>
	<FormField label="Notes" name="notes" type="textarea" bind:value={entry.notes} />

	<button type="submit" class="btn btn-primary" disabled={isSaving}>
		{isSaving ? 'Saving…' : 'Save venue plan'}
	</button>
</form>
