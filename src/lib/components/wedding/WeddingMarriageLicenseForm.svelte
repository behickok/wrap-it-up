<script lang="ts">
	import { enhance } from '$app/forms';
	import FormField from '$lib/components/FormField.svelte';

	let { entry = {} }: { entry?: Record<string, any> } = $props();
	let isSaving = $state(false);
</script>

<form
	method="POST"
	action="?/saveWeddingMarriageLicense"
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
		<h3 class="text-2xl font-semibold mb-2">Marriage license timeline</h3>
		<p class="text-base-content/70">
			Track the jurisdiction, appointments, and paperwork needed to file your marriage license on time.
		</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<FormField label="Jurisdiction / County" name="jurisdiction" bind:value={entry.jurisdiction} required />
		<FormField label="Clerk office address" name="office_address" bind:value={entry.office_address} type="textarea" />
		<FormField label="Appointment date" name="appointment_date" type="date" bind:value={entry.appointment_date} />
		<FormField label="Expiration date" name="expiration_date" type="date" bind:value={entry.expiration_date} />
		<FormField
			label="Required documents"
			name="required_documents"
			type="textarea"
			bind:value={entry.required_documents}
			placeholder="IDs, divorce decrees, certificate copies…"
		/>
		<FormField
			label="Witness requirements"
			name="witness_requirements"
			type="textarea"
			bind:value={entry.witness_requirements}
			placeholder="Names, number of witnesses, notarization steps"
		/>
		<FormField label="Application fee" name="fee_amount" type="number" step="0.01" bind:value={entry.fee_amount} />
		<FormField label="Confirmation number" name="confirmation_number" bind:value={entry.confirmation_number} />
	</div>

	<FormField
		label="Notes"
		name="notes"
		type="textarea"
		bind:value={entry.notes}
		placeholder="Parking tips, who is picking it up, etc."
	/>

	<button type="submit" class="btn btn-primary" disabled={isSaving}>
		{isSaving ? 'Saving…' : 'Save license plan'}
	</button>
</form>
