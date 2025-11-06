<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';

	type SelectOption = string | { value: string; label?: string; disabled?: boolean };
	type NormalizedOption = { value: string; label: string; disabled?: boolean };

	let {
		label,
		name,
		type = 'text',
		value = $bindable(),
		placeholder = '',
		required = false,
		rows = 3,
		options = [] as SelectOption[]
	} = $props();

	// Ensure value is never undefined
	if (value === undefined) {
		value = '';
	}

	// For select, we need to handle the selected state
	const normalizeOption = (option: SelectOption): NormalizedOption => {
		if (typeof option === 'string') {
			return { value: option, label: option };
		}
		return {
			value: option.value,
			label: option.label ?? option.value,
			disabled: option.disabled
		};
	};

	const normalizedOptions = $derived(options.map(normalizeOption));
	let selected = $state<NormalizedOption | undefined>(undefined);
	let selectOpen = $state(false);

	// Update value when selected changes
	$effect(() => {
		if (type !== 'select') {
			return;
		}

		const nextValue = selected?.value ?? '';
		if (value !== nextValue) {
			value = nextValue;
		}
	});

	// Update selected when value changes externally
	$effect(() => {
		if (type !== 'select') {
			return;
		}

		if (!value) {
			if (selected !== undefined) {
				selected = undefined;
			}
			return;
		}

		const match = normalizedOptions.find(option => option.value === value);
		const nextSelected = match ?? { value, label: value };

		if (!selected || selected.value !== nextSelected.value || selected.label !== nextSelected.label) {
			selected = nextSelected;
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
		<Select bind:selected bind:open={selectOpen} name={name} required={required} items={normalizedOptions}>
			<SelectTrigger id={name} class="w-full">
				<span>{selected?.label || 'Select...'}</span>
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="" label="Select...">Select...</SelectItem>
				{#each normalizedOptions as option}
					<SelectItem value={option.value} label={option.label} disabled={option.disabled}>
						{option.label}
					</SelectItem>
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
