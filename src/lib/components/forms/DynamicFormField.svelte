<script lang="ts">
import type {
	ParsedSectionField,
	FieldConfig,
	SelectFieldConfig,
	NumberFieldConfig,
	FileFieldConfig,
	TextAreaFieldConfig,
	RatingFieldConfig
} from '$lib/types';

	interface Props {
		field: ParsedSectionField;
		value?: any;
		error?: string;
		onInput?: (value: any) => void;
		disabled?: boolean;
	}

	let { field, value = $bindable(), error, onInput, disabled = false }: Props = $props();

	// Initialize value based on field type
	if (value === undefined || value === null) {
		switch (field.field_type.type_name) {
			case 'checkbox':
				value = false;
				break;
			case 'multiselect':
				value = [];
				break;
			default:
				value = field.default_value || '';
		}
	}

	// Handle input changes
	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

		switch (field.field_type.type_name) {
			case 'checkbox':
				value = (target as HTMLInputElement).checked;
				break;
			case 'number':
			case 'currency':
				value = target.value ? parseFloat(target.value) : null;
				break;
			case 'multiselect':
				const select = target as HTMLSelectElement;
				value = Array.from(select.selectedOptions).map(opt => opt.value);
				break;
			default:
				value = target.value;
		}

		onInput?.(value);
	}

	const config: any = field.field_config ?? {};

	const getConfigValue = <T>(key: string): T | undefined => {
		return config[key] as T | undefined;
	};

	const getConfig = <T extends FieldConfig>(): T => {
		return config as T;
	};

	const normalizeOptions = (options: any): Array<{ value: string; label: string }> => {
		if (!Array.isArray(options)) return [];
		return options
			.map((option) => {
				if (typeof option === 'string') {
					const trimmed = option.trim();
					return trimmed ? { value: trimmed, label: trimmed } : null;
				}
				const value = (option?.value ?? option?.label ?? '').toString().trim();
				const label = (option?.label ?? option?.value ?? '').toString().trim();
				if (!value) return null;
				return { value, label: label || value };
			})
			.filter((option): option is { value: string; label: string } => Boolean(option));
	};

	const selectOptions = $derived(normalizeOptions(getConfig<SelectFieldConfig>().options));

	// Get placeholder
	const placeholder =
		(field as any)?.placeholder ?? getConfigValue<string>('placeholder') ?? '';
</script>

<div class="form-control mb-6">
	<label class="label" for={field.field_name}>
		<span class="label-text">
			{field.field_label}
			{#if field.is_required}
				<span class="text-error">*</span>
			{/if}
		</span>
	</label>

	{#if field.help_text}
		<div class="label">
			<span class="label-text-alt text-base-content/70">{field.help_text}</span>
		</div>
	{/if}

	<!-- Text Input -->
	{#if field.field_type.type_name === 'text'}
		<input
			id={field.field_name}
			name={field.field_name}
			type="text"
			bind:value
			oninput={handleInput}
			placeholder={placeholder}
			required={field.is_required}
			disabled={disabled}
			maxlength={getConfigValue<number>('maxLength')}
			pattern={getConfigValue<string>('pattern')}
			class="input input-bordered w-full"
			class:input-error={error}
		/>

	<!-- Email Input -->
	{:else if field.field_type.type_name === 'email'}
		<input
			id={field.field_name}
			name={field.field_name}
			type="email"
			bind:value
			oninput={handleInput}
			placeholder={placeholder}
			required={field.is_required}
			disabled={disabled}
			class="input input-bordered w-full"
			class:input-error={error}
		/>

	<!-- Phone Input -->
	{:else if field.field_type.type_name === 'phone'}
		<input
			id={field.field_name}
			name={field.field_name}
			type="tel"
			bind:value
			oninput={handleInput}
			placeholder={placeholder}
			required={field.is_required}
			disabled={disabled}
			class="input input-bordered w-full"
			class:input-error={error}
		/>

	<!-- URL Input -->
	{:else if field.field_type.type_name === 'url'}
		<input
			id={field.field_name}
			name={field.field_name}
			type="url"
			bind:value
			oninput={handleInput}
			placeholder={placeholder}
			required={field.is_required}
			disabled={disabled}
			class="input input-bordered w-full"
			class:input-error={error}
		/>

	<!-- Number Input -->
	{:else if field.field_type.type_name === 'number'}
		<input
			id={field.field_name}
			name={field.field_name}
			type="number"
			bind:value
			oninput={handleInput}
			placeholder={placeholder}
			required={field.is_required}
			disabled={disabled}
			min={getConfig<NumberFieldConfig>().min}
			max={getConfig<NumberFieldConfig>().max}
			step={getConfig<NumberFieldConfig>().step || 'any'}
			class="input input-bordered w-full"
			class:input-error={error}
		/>

	<!-- Currency Input -->
	{:else if field.field_type.type_name === 'currency'}
		<div class="input-group">
			{#if getConfig<NumberFieldConfig>().prefix}
				<span>{getConfig<NumberFieldConfig>().prefix}</span>
			{/if}
			<input
				id={field.field_name}
				name={field.field_name}
				type="number"
				bind:value
				oninput={handleInput}
				placeholder={placeholder}
				required={field.is_required}
				disabled={disabled}
				min={getConfig<NumberFieldConfig>().min || 0}
				step={getConfig<NumberFieldConfig>().step || 0.01}
				class="input input-bordered w-full"
				class:input-error={error}
			/>
			{#if getConfig<NumberFieldConfig>().suffix}
				<span>{getConfig<NumberFieldConfig>().suffix}</span>
			{/if}
		</div>

	<!-- Date Input -->
	{:else if field.field_type.type_name === 'date'}
		<input
			id={field.field_name}
			name={field.field_name}
			type="date"
			bind:value
			oninput={handleInput}
			required={field.is_required}
			disabled={disabled}
			class="input input-bordered w-full"
			class:input-error={error}
		/>

	<!-- DateTime Input -->
	{:else if field.field_type.type_name === 'datetime'}
		<input
			id={field.field_name}
			name={field.field_name}
			type="datetime-local"
			bind:value
			oninput={handleInput}
			required={field.is_required}
			disabled={disabled}
			class="input input-bordered w-full"
			class:input-error={error}
		/>

	<!-- Textarea -->
	{:else if field.field_type.type_name === 'textarea'}
		<textarea
			id={field.field_name}
			name={field.field_name}
			bind:value
			oninput={handleInput}
			placeholder={placeholder}
			required={field.is_required}
			disabled={disabled}
			rows={getConfig<TextAreaFieldConfig>().rows || 4}
			maxlength={getConfig<TextAreaFieldConfig>().maxLength}
			class="textarea textarea-bordered w-full"
			class:textarea-error={error}
		></textarea>

	<!-- Select Dropdown -->
	{:else if field.field_type.type_name === 'select'}
		<select
			id={field.field_name}
			name={field.field_name}
			bind:value
			onchange={handleInput}
			required={field.is_required}
			disabled={disabled}
			class="select select-bordered w-full text-base-content"
			class:select-error={error}
		>
			<option value="">{getConfig<SelectFieldConfig>().placeholder || 'Select...'}</option>
			{#each selectOptions as option}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>

	<!-- Multi-Select -->
	{:else if field.field_type.type_name === 'multiselect'}
		<select
			id={field.field_name}
			name={field.field_name}
			bind:value
			onchange={handleInput}
			required={field.is_required}
			disabled={disabled}
			multiple
			class="select select-bordered w-full min-h-32 text-base-content"
			class:select-error={error}
		>
			{#each selectOptions as option}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
		<div class="label">
			<span class="label-text-alt">Hold Ctrl/Cmd to select multiple</span>
		</div>

	<!-- Radio Buttons -->
	{:else if field.field_type.type_name === 'radio'}
		<div class="flex flex-col gap-2">
			{#each selectOptions as option}
				<label class="label cursor-pointer justify-start gap-2">
					<input
						type="radio"
						name={field.field_name}
						value={option.value}
						checked={value === option.value}
						onchange={handleInput}
						required={field.is_required}
						disabled={disabled}
						class="radio"
					/>
					<span class="label-text">{option.label}</span>
				</label>
			{/each}
		</div>

	<!-- Checkbox -->
	{:else if field.field_type.type_name === 'checkbox'}
		<label class="label cursor-pointer justify-start gap-2">
			<input
				id={field.field_name}
				name={field.field_name}
				type="checkbox"
				bind:checked={value}
				onchange={handleInput}
				required={field.is_required}
				disabled={disabled}
				class="checkbox"
			/>
			<span class="label-text">{field.field_label}</span>
		</label>

	<!-- File Upload -->
	{:else if field.field_type.type_name === 'file'}
		<input
			id={field.field_name}
			name={field.field_name}
			type="file"
			onchange={handleInput}
			required={field.is_required}
			disabled={disabled}
			accept={getConfig<FileFieldConfig>().accept}
			multiple={getConfig<FileFieldConfig>().multiple}
			class="file-input file-input-bordered w-full"
			class:input-error={error}
		/>
		{#if getConfig<FileFieldConfig>().maxSize}
			<div class="label">
				<span class="label-text-alt">
					Max size: {(getConfig<FileFieldConfig>().maxSize! / 1024 / 1024).toFixed(1)}MB
				</span>
			</div>
		{/if}

	<!-- Rating -->
	{:else if field.field_type.type_name === 'rating'}
		<div class="rating rating-lg">
			{#each Array(getConfig<RatingFieldConfig>().max || 5) as _, i}
				<input
					type="radio"
					name={field.field_name}
					value={i + 1}
					checked={value === i + 1}
					onchange={handleInput}
					disabled={disabled}
					class="mask mask-star-2 bg-orange-400"
				/>
			{/each}
		</div>

	<!-- Fallback for unknown types -->
	{:else}
		<input
			id={field.field_name}
			name={field.field_name}
			type="text"
			bind:value
			oninput={handleInput}
			placeholder={placeholder}
			required={field.is_required}
			disabled={disabled}
			class="input input-bordered w-full"
			class:input-error={error}
		/>
	{/if}

	{#if error}
		<div class="label">
			<span class="label-text-alt text-error">{error}</span>
		</div>
	{/if}
</div>

<style>
	.input-error,
	.textarea-error,
	.select-error {
		border-color: var(--error);
	}
</style>
