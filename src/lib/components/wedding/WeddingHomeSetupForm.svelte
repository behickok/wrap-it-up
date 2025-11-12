<script lang="ts">
	import { enhance } from '$app/forms';
	import FormField from '$lib/components/FormField.svelte';

	let { entry = {} }: { entry?: Record<string, any> } = $props();
	let isSaving = $state(false);
</script>

<form
	method="POST"
	action="?/saveWeddingHomeSetup"
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
		<h3 class="text-2xl font-semibold mb-2">Home + rituals</h3>
		<p class="text-base-content/70">
			Set expectations for your shared space, utilities, and the way you want your home to feel in the first year.
		</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<FormField
			label="Housing plan"
			name="housing_plan"
			type="textarea"
			bind:value={entry.housing_plan}
			placeholder="Staying put, moving, purchasing, signing a lease…"
		/>
		<FormField label="Move-in or reset date" name="move_in_date" type="date" bind:value={entry.move_in_date} />
		<FormField
			label="Utilities + automation"
			name="utilities_plan"
			type="textarea"
			bind:value={entry.utilities_plan}
			placeholder="Whose name is on each bill, autopay owner, reminders"
		/>
		<FormField
			label="Design / vibe"
			name="design_style"
			type="textarea"
			bind:value={entry.design_style}
			placeholder="Mood board keywords, colors, furniture decisions"
		/>
		<FormField
			label="Shared calendar / task link"
			name="shared_calendar_link"
			bind:value={entry.shared_calendar_link}
			placeholder="Google Calendar link, Notion board, Asana project URL"
		/>
		<FormField
			label="Hosting & traditions"
			name="hosting_goals"
			type="textarea"
			bind:value={entry.hosting_goals}
			placeholder="Game nights, family dinners, seasonal rituals"
		/>
		<FormField
			label="First-month priorities"
			name="first_month_priorities"
			type="textarea"
			bind:value={entry.first_month_priorities}
			placeholder="Unpack office, set up emergency kit, plant herb garden…"
		/>
	</div>

	<FormField label="Notes" name="notes" type="textarea" bind:value={entry.notes} />

	<button type="submit" class="btn btn-primary" disabled={isSaving}>
		{isSaving ? 'Saving…' : 'Save home plan'}
	</button>
</form>
