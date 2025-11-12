<script lang="ts">
	import { enhance } from '$app/forms';
	import FormField from '$lib/components/FormField.svelte';

	let { entry = {} }: { entry?: Record<string, any> } = $props();
	let isSaving = $state(false);
</script>

<form
	method="POST"
	action="?/saveWeddingPrenup"
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
		<h3 class="text-2xl font-semibold mb-2">Prenup & agreements</h3>
		<p class="text-base-content/70">
			Capture the professionals involved, the scope of the agreement, and next deadlines so nothing slips.
		</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<FormField
			label="Current status"
			name="status"
			bind:value={entry.status}
			placeholder="Consult scheduled, drafting, signed…"
		/>
		<FormField label="Your attorney" name="attorney_user" bind:value={entry.attorney_user} />
		<FormField label="Partner's attorney" name="attorney_partner" bind:value={entry.attorney_partner} />
		<FormField
			label="Agreement scope"
			name="agreement_scope"
			type="textarea"
			bind:value={entry.agreement_scope}
			placeholder="Assets to cover, exclusions, spousal support terms…"
		/>
		<FormField label="Review deadline" name="review_deadline" type="date" bind:value={entry.review_deadline} />
		<FormField
			label="Signing plan"
			name="signing_plan"
			type="textarea"
			bind:value={entry.signing_plan}
			placeholder="Who needs to attend, notarization, witnesses…"
		/>
	</div>

	<div class="flex flex-col gap-4">
		<label class="flex items-center gap-2 text-sm">
			<input
				type="checkbox"
				name="financial_disclosures_ready"
				value="1"
				checked={Boolean(entry.financial_disclosures_ready)}
			/>
			<span>All financial disclosures are prepared</span>
		</label>
		<FormField
			label="Storage plan"
			name="storage_plan"
			type="textarea"
			bind:value={entry.storage_plan}
			placeholder="Where the signed document lives + who has copies"
		/>
		<FormField label="Notes" name="notes" type="textarea" bind:value={entry.notes} />
	</div>

	<button type="submit" class="btn btn-primary" disabled={isSaving}>
		{isSaving ? 'Saving…' : 'Save prenup plan'}
	</button>
</form>
