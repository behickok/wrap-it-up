<script lang="ts">
	import { enhance } from '$app/forms';
	import FormField from '$lib/components/FormField.svelte';

	let { entry = {} }: { entry?: Record<string, any> } = $props();
	let isSaving = $state(false);
</script>

<form
	method="POST"
	action="?/saveWeddingJointFinances"
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
			<h3 class="text-2xl font-semibold mb-2">Money conversations</h3>
			<p class="text-base-content/70">
				Outline the accounts you’ll merge, how bills are split, and the cadence for regular check-ins.
			</p>
	</div>
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<FormField
			label="Shared money values"
			name="shared_values"
			type="textarea"
			bind:value={entry.shared_values}
			placeholder="What does financial security look like for both of you?"
		/>
		<FormField
			label="Accounts to merge"
			name="accounts_to_merge"
			type="textarea"
			bind:value={entry.accounts_to_merge}
			placeholder="Checking, savings, credit cards…"
		/>
		<FormField
			label="New accounts to open"
			name="new_accounts"
			type="textarea"
			bind:value={entry.new_accounts}
			placeholder="Joint checking, vacation fund, investment accounts"
		/>
		<FormField
			label="Bill split plan"
			name="bill_split_plan"
			type="textarea"
			bind:value={entry.bill_split_plan}
			placeholder="Percent split, who triggers transfers, autopay details"
		/>
		<FormField
			label="Emergency fund & big goals"
			name="emergency_fund_plan"
			type="textarea"
			bind:value={entry.emergency_fund_plan}
		/>
		<FormField
			label="Budgeting tools / apps"
			name="budgeting_tools"
			bind:value={entry.budgeting_tools}
			placeholder="Notion, Tiller, YNAB, spreadsheets…"
		/>
		<FormField
			label="Monthly money date cadence"
			name="monthly_checkin_cadence"
			bind:value={entry.monthly_checkin_cadence}
			placeholder="First Sunday, every payday, etc."
		/>
	</div>
	<FormField label="Notes" name="notes" type="textarea" bind:value={entry.notes} />

	<button type="submit" class="btn btn-primary" disabled={isSaving}>
		{isSaving ? 'Saving…' : 'Save joint finance plan'}
	</button>
</form>
