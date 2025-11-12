<script lang="ts">
	import { enhance } from '$app/forms';
	import FormField from '$lib/components/FormField.svelte';

	let { entry = {} }: { entry?: Record<string, any> } = $props();
	let isSaving = $state(false);
</script>

<form
	method="POST"
	action="?/saveWeddingNameChange"
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
		<h3 class="text-2xl font-semibold mb-2">Name change & identity updates</h3>
		<p class="text-base-content/70">
			Document whether either partner is changing their name and keep all the update tasks in one place.
		</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<FormField label="New name" name="new_name" bind:value={entry.new_name} placeholder="If applicable" />
		<FormField label="Status" name="status" bind:value={entry.status} placeholder="Researching, filed, completed…" />
		<div class="md:col-span-2">
			<label class="flex items-center gap-2 text-sm">
				<input type="checkbox" name="keeping_current_name" value="1" checked={Boolean(entry.keeping_current_name)} />
				<span>I'm keeping my current name (still helpful to track the decision!)</span>
			</label>
		</div>
		<FormField
			label="Legal documents to update"
			name="legal_documents"
			type="textarea"
			bind:value={entry.legal_documents}
			placeholder="Marriage certificate, SSN, passport…"
		/>
		<FormField
			label="IDs & accounts to update"
			name="ids_to_update"
			type="textarea"
			bind:value={entry.ids_to_update}
			placeholder="Driver’s license, banking, insurance, HR systems"
		/>
		<FormField
			label="Digital presence"
			name="digital_accounts"
			type="textarea"
			bind:value={entry.digital_accounts}
			placeholder="Email signature, social media handles, domains"
		/>
		<FormField
			label="Announcement plan"
			name="announcement_plan"
			type="textarea"
			bind:value={entry.announcement_plan}
			placeholder="When/how you’ll share with family, HR, vendors"
		/>
		<FormField label="Target effective date" name="target_effective_date" type="date" bind:value={entry.target_effective_date} />
	</div>

	<FormField label="Notes" name="notes" type="textarea" bind:value={entry.notes} />

	<button type="submit" class="btn btn-primary" disabled={isSaving}>
		{isSaving ? 'Saving…' : 'Save name plan'}
	</button>
</form>
