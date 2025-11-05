<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';

	let {
		label,
		name,
		type = 'text',
		value = $bindable(),
		placeholder = '',
		required = false,
		rows = 3,
		options = []
	} = $props();

	// Ensure value is never undefined
	if (value === undefined) {
		value = '';
	}

	// For select, we need to handle the selected state
	let selected = $state(value ? { value: value, label: value } : undefined);

	// Update value when selected changes
	$effect(() => {
		if (type === 'select' && selected) {
			value = selected.value;
		}
	});

	// Update selected when value changes externally
	$effect(() => {
		if (type === 'select' && value && (!selected || selected.value !== value)) {
			selected = { value: value, label: value };
		}
	});
</script>

<div class="mb-6">
	<Label for={name} class="mb-2 block">
		{label}
		{#if required}
			<span class="text-destructive">*</span>
		{/if}
	</Label>

	{#if type === 'textarea'}
		<Textarea
			id={name}
			{name}
			bind:value
			{placeholder}
			{rows}
			{required}
		/>
	{:else if type === 'select'}
		<Select bind:selected>
			<SelectTrigger id={name} class="w-full">
				<span>{selected?.label || 'Select...'}</span>
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="" label="Select...">Select...</SelectItem>
				{#each options as option}
					<SelectItem value={option} label={option}>{option}</SelectItem>
				{/each}
			</SelectContent>
		</Select>
	{:else if type === 'date'}
		<Input
			id={name}
			{name}
			type="date"
			bind:value
			{required}
		/>
	{:else if type === 'number'}
		<Input
			id={name}
			{name}
			type="number"
			bind:value
			{placeholder}
			{required}
			step="0.01"
		/>
	{:else}
		<Input
			id={name}
			{name}
			{type}
			bind:value
			{placeholder}
			{required}
		/>
	{/if}
</div>
