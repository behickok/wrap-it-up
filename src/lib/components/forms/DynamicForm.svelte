<script lang="ts">
	import type { ParsedSectionField, ValidationResult } from '$lib/types';
	import DynamicFormField from './DynamicFormField.svelte';
	import { enhance } from '$app/forms';

	interface Props {
		fields: ParsedSectionField[];
		initialData?: Record<string, any>;
		sectionId: number;
		sectionSlug: string;
		onSubmit?: (data: Record<string, any>) => void;
		readonly?: boolean;
	}

	let {
		fields,
		initialData = {},
		sectionId,
		sectionSlug,
		onSubmit,
		readonly = false
	}: Props = $props();

	// Initialize form data
	let formData: Record<string, any> = $state({});
	let errors: Record<string, string> = $state({});
	let isSubmitting = $state(false);
	let saveMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// Initialize form data from initial values
	$effect(() => {
		const data: Record<string, any> = {};
		fields.forEach(field => {
			data[field.field_name] = initialData[field.field_name] ?? field.default_value ?? '';
		});
		formData = data;
	});

	// Sort fields by display order
	const sortedFields = $derived(
		[...fields].sort((a, b) => a.display_order - b.display_order)
	);

	// Check conditional logic
	function shouldShowField(field: ParsedSectionField): boolean {
		if (!field.conditional_logic) return true;

		const logic = field.conditional_logic;
		const watchedValue = formData[logic.field];

		switch (logic.operator) {
			case 'equals':
				return watchedValue === logic.value;
			case 'not_equals':
				return watchedValue !== logic.value;
			case 'contains':
				return String(watchedValue).includes(String(logic.value));
			case 'not_contains':
				return !String(watchedValue).includes(String(logic.value));
			case 'is_empty':
				return !watchedValue || watchedValue === '' || (Array.isArray(watchedValue) && watchedValue.length === 0);
			case 'is_not_empty':
				return Boolean(watchedValue) && !(Array.isArray(watchedValue) && watchedValue.length === 0);
			default:
				return true;
		}
	}

	// Validate form
	function validateForm(): ValidationResult {
		const newErrors: Record<string, string> = {};

		sortedFields.forEach(field => {
			if (!shouldShowField(field)) return;

			const value = formData[field.field_name];

			// Required field validation
			if (field.is_required) {
				if (value === null || value === undefined || value === '' ||
					(Array.isArray(value) && value.length === 0)) {
					newErrors[field.field_name] = `${field.field_label} is required`;
				}
			}

			// Type-specific validation
			if (value && field.field_type.validation_schema) {
				const schema = JSON.parse(field.field_type.validation_schema);

				// Email validation
				if (schema.format === 'email') {
					const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
					if (!emailRegex.test(value)) {
						newErrors[field.field_name] = 'Please enter a valid email address';
					}
				}

				// URL validation
				if (schema.format === 'uri') {
					try {
						new URL(value);
					} catch {
						newErrors[field.field_name] = 'Please enter a valid URL';
					}
				}

				// Max length validation
				if (schema.maxLength && String(value).length > schema.maxLength) {
					newErrors[field.field_name] = `Maximum length is ${schema.maxLength} characters`;
				}

				// Number validation
				if (schema.type === 'number') {
					if (isNaN(value)) {
						newErrors[field.field_name] = 'Please enter a valid number';
					}
					if (schema.minimum !== undefined && value < schema.minimum) {
						newErrors[field.field_name] = `Minimum value is ${schema.minimum}`;
					}
					if (schema.maximum !== undefined && value > schema.maximum) {
						newErrors[field.field_name] = `Maximum value is ${schema.maximum}`;
					}
				}

				// Pattern validation
				if (schema.pattern) {
					const regex = new RegExp(schema.pattern);
					if (!regex.test(value)) {
						newErrors[field.field_name] = 'Please enter a value in the correct format';
					}
				}
			}
		});

		errors = newErrors;
		return {
			isValid: Object.keys(newErrors).length === 0,
			errors: newErrors
		};
	}

	// Handle form submission
	async function handleSubmit() {
		const validation = validateForm();
		if (!validation.isValid) {
			saveMessage = { type: 'error', text: 'Please fix the errors below' };
			return;
		}

		if (onSubmit) {
			onSubmit(formData);
		}
	}

	// Calculate completion percentage
	const completionPercentage = $derived(() => {
		const visibleFields = sortedFields.filter(shouldShowField);
		if (visibleFields.length === 0) return 0;

		const completedFields = visibleFields.filter(field => {
			const value = formData[field.field_name];
			return value !== null && value !== undefined && value !== '' &&
				   !(Array.isArray(value) && value.length === 0);
		});

		return Math.round((completedFields.length / visibleFields.length) * 100);
	});
</script>

<div class="dynamic-form">
	<!-- Progress indicator -->
	<div class="mb-8">
		<div class="flex justify-between items-center mb-2">
			<span class="text-sm font-medium">Section Progress</span>
			<span class="text-sm font-medium">{completionPercentage()}%</span>
		</div>
		<progress
			class="progress progress-primary w-full"
			value={completionPercentage()}
			max="100"
		></progress>
	</div>

	<!-- Save message -->
	{#if saveMessage}
		<div
			class="alert mb-6"
			class:alert-success={saveMessage.type === 'success'}
			class:alert-error={saveMessage.type === 'error'}
		>
			<span>{saveMessage.text}</span>
		</div>
	{/if}

	<form
		method="POST"
		action="?/saveSectionData"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ result, update }) => {
				isSubmitting = false;
				if (result.type === 'success') {
					saveMessage = { type: 'success', text: 'Changes saved successfully!' };
					setTimeout(() => saveMessage = null, 3000);
				} else {
					saveMessage = { type: 'error', text: 'Failed to save changes' };
				}
				await update();
			};
		}}
	>
		<!-- Hidden fields -->
		<input type="hidden" name="section_id" value={sectionId} />
		<input type="hidden" name="section_slug" value={sectionSlug} />
		<input type="hidden" name="form_data" value={JSON.stringify(formData)} />

		<!-- Dynamic fields -->
		<div class="space-y-4">
			{#each sortedFields as field (field.id)}
				{#if shouldShowField(field)}
					<DynamicFormField
						{field}
						bind:value={formData[field.field_name]}
						error={errors[field.field_name]}
						disabled={readonly || isSubmitting}
					/>
				{/if}
			{/each}
		</div>

		<!-- Form actions -->
		{#if !readonly}
			<div class="form-actions mt-8 flex gap-4">
				<button
					type="submit"
					class="btn btn-primary"
					disabled={isSubmitting}
					onclick={handleSubmit}
				>
					{#if isSubmitting}
						<span class="loading loading-spinner"></span>
						Saving...
					{:else}
						Save Changes
					{/if}
				</button>

				<button
					type="button"
					class="btn btn-ghost"
					disabled={isSubmitting}
					onclick={() => {
						// Reset form to initial data
						fields.forEach(field => {
							formData[field.field_name] = initialData[field.field_name] ?? field.default_value ?? '';
						});
						errors = {};
						saveMessage = null;
					}}
				>
					Reset
				</button>
			</div>
		{/if}
	</form>
</div>

<style>
	.dynamic-form {
		max-width: 800px;
	}

	:global(.space-y-4 > :not(:last-child)) {
		margin-bottom: 1rem;
	}
</style>
