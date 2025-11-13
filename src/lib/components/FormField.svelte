<script lang="ts">
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
		value = type === 'checkbox' ? false : '';
	}
	if (type === 'checkbox') {
		value = Boolean(value);
	}

	// For select, normalize options
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
</script>

<div class="form-control mb-6">
	<label class="label" for={name}>
		<span class="label-text">
			{label}
			{#if required}
				<span style="color: var(--color-destructive);">*</span>
			{/if}
		</span>
	</label>

	{#if type === 'textarea'}
		<textarea
			id={name}
			{name}
			bind:value
			{placeholder}
			{rows}
			{required}
			class="textarea textarea-bordered w-full"
		></textarea>
	{:else if type === 'checkbox'}
		<label class="label cursor-pointer justify-start gap-3">
			<input
				id={name}
				{name}
				type="checkbox"
				class="checkbox checkbox-primary"
				bind:checked={value}
			/>
			<span class="label-text">{placeholder || `Check if ${label.toLowerCase()}`}</span>
		</label>
	{:else if type === 'select'}
		<select
			id={name}
			{name}
			bind:value
			{required}
			class="select select-bordered w-full"
		>
			<option value="">Select...</option>
			{#each normalizedOptions as option}
				<option value={option.value} disabled={option.disabled}>
					{option.label}
				</option>
			{/each}
		</select>
	{:else if type === 'date'}
		<input
			id={name}
			{name}
			type="date"
			bind:value
			{required}
			class="input input-bordered w-full"
		/>
	{:else if type === 'number'}
		<input
			id={name}
			{name}
			type="number"
			bind:value
			{placeholder}
			{required}
			step="0.01"
			class="input input-bordered w-full"
		/>
	{:else}
		<input
			id={name}
			{name}
			{type}
			bind:value
			{placeholder}
			{required}
			class="input input-bordered w-full"
		/>
	{/if}
</div>
