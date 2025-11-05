<script>
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
</script>

<div class="form-field">
	<label for={name}>
		{label}
		{#if required}
			<span class="required">*</span>
		{/if}
	</label>

	{#if type === 'textarea'}
		<textarea
			id={name}
			{name}
			bind:value
			{placeholder}
			{rows}
			{required}
		></textarea>
	{:else if type === 'select'}
		<select id={name} {name} bind:value {required}>
			<option value="">Select...</option>
			{#each options as option}
				<option value={option}>{option}</option>
			{/each}
		</select>
	{:else if type === 'date'}
		<input
			id={name}
			{name}
			type="date"
			bind:value
			{required}
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
		/>
	{:else}
		<input
			id={name}
			{name}
			{type}
			bind:value
			{placeholder}
			{required}
		/>
	{/if}
</div>

<style>
	.form-field {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #2d3748;
		font-size: 0.95rem;
	}

	.required {
		color: #e53e3e;
	}

	input,
	textarea,
	select {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #cbd5e0;
		border-radius: 6px;
		font-size: 1rem;
		font-family: inherit;
		transition: border-color 0.2s;
		box-sizing: border-box;
	}

	input:focus,
	textarea:focus,
	select:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	textarea {
		resize: vertical;
		min-height: 80px;
	}

	select {
		cursor: pointer;
	}
</style>
