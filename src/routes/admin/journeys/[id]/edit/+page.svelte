<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
import type { FieldType, SectionField } from '$lib/types';

let { data }: { data: PageData } = $props();
type ServiceTierData = (typeof data.serviceTiers)[number];
type SectionData = (typeof data.sections)[number];
type FieldData = (typeof data.fields)[number];
type JourneyCategoryData = (typeof data.journeyCategories)[number];

function getSectionsByCategory(categoryId: number) {
	return data.sections.filter((section: SectionData) => section.category_id === categoryId);
}
function findSectionById(sectionId: number) {
	return data.sections.find((section: SectionData) => section.section_id === sectionId) ?? null;
}

	// Tab state
	let activeTab = $state<'info' | 'categories' | 'sections' | 'pricing' | 'preview'>('info');

	// Journey info editing
	let editingJourney = $state(false);
	let journeyForm = $state({
		name: data.journey.name,
		slug: data.journey.slug,
		description: data.journey.description || '',
		icon: data.journey.icon || '🎯'
	});

	// Category management
	let showCategoryPicker = $state(false);
	let newCategoryForm = $state({
		name: '',
		description: '',
		icon: '📁'
	});

	// Section editing
	let editingSection = $state<number | null>(null);
	let creatingSection = $state(false);
	let sectionForm = $state({
		name: '',
		slug: '',
		description: '',
		category_id: 0,
		weight: 5,
		scoring_type: 'field_count'
	});

	// Field editing
	let editingField = $state<number | null>(null);
	let creatingField = $state<number | null>(null); // section_id
	let fieldForm = $state<{
		field_name: string;
		field_label: string;
		field_type_id: number;
		is_required: boolean;
		importance_level: string;
		help_text: string;
		placeholder: string;
	}>({
		field_name: '',
		field_label: '',
		field_type_id: data.fieldTypes[0]?.id || 0,
		is_required: false,
		importance_level: 'optional',
		help_text: '',
		placeholder: ''
	});
	type FieldConfigEditorState = {
		rows: string;
		optionsText: string;
		min: string;
		max: string;
		step: string;
		prefix: string;
		suffix: string;
		ratingMax: string;
		maxSize: string;
		accept: string;
	};
	function createDefaultFieldConfig(): FieldConfigEditorState {
		return {
			rows: '4',
			optionsText: '',
			min: '',
			max: '',
			step: '',
			prefix: '',
			suffix: '',
			ratingMax: '5',
			maxSize: '',
			accept: ''
		};
	}
	let fieldConfigEditor = $state<FieldConfigEditorState>(createDefaultFieldConfig());
	const selectedFieldType = $derived(getSelectedFieldType());

	// Preview state
	let previewSectionId = $state<number | null>(null);

	// Pricing state
let pricingData = $state(
	data.serviceTiers.map((tier: ServiceTierData) => {
		const existing = data.journeyPricing.find((p) => p.tier_id === tier.id);
			return {
				tier_id: tier.id,
				tier_name: tier.name,
				tier_slug: tier.slug,
				monthly_price: existing?.base_price_monthly || 0,
				annual_price: existing?.base_price_annual || 0
			};
		})
	);
	let savingPricing = $state(false);

	// Calculate pricing breakdown
	function calculateBreakdown(price: number) {
		const platformFee = Math.round(price * (data.platformFeePercentage / 100) * 100) / 100;
		const creatorReceives = Math.round((price - platformFee) * 100) / 100;
		return { platformFee, creatorReceives };
	}

	// Save pricing
	async function savePricing() {
		savingPricing = true;
		try {
			const formData = new FormData();
			formData.append('pricing_data', JSON.stringify(pricingData));

			const response = await fetch('?/savePricing', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				await invalidateAll();
				alert('Pricing saved successfully!');
			} else {
				alert('Failed to save pricing');
			}
		} catch (error) {
			console.error('Error saving pricing:', error);
			alert('Failed to save pricing');
		} finally {
			savingPricing = false;
		}
	}

	// Helper functions
	function autoGenerateSlug(name: string): string {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '_')
			.replace(/^_|_$/g, '');
	}

	function updateSectionSlug() {
		if (!editingSection) {
			sectionForm.slug = autoGenerateSlug(sectionForm.name);
		}
	}

	function updateFieldName() {
		if (!editingField) {
			fieldForm.field_name = autoGenerateSlug(fieldForm.field_label);
		}
	}

function openSectionEditor(sectionId: number) {
	const section = data.sections.find((s: SectionData) => s.section_id === sectionId);
		if (section) {
			editingSection = sectionId;
			sectionForm = {
				name: section.name,
				slug: section.slug,
				description: section.description || '',
				category_id: section.category_id,
				weight: section.weight,
				scoring_type: section.scoring_type
			};
		}
	}

function openFieldEditor(fieldId: number) {
	const field = data.fields.find((f: FieldData) => f.id === fieldId);
		if (field) {
			editingField = fieldId;
			fieldForm = {
				field_name: field.field_name,
				field_label: field.field_label,
				field_type_id: field.field_type_id,
				is_required: field.is_required,
				importance_level: field.importance_level,
				help_text: field.help_text || '',
				placeholder: field.placeholder || ''
			};
			populateFieldConfigEditor(field.field_config || '', field.type_name);
		}
	}

	function resetSectionForm() {
		sectionForm = {
			name: '',
			slug: '',
			description: '',
			category_id: data.journeyCategories[0]?.category_id || 0,
			weight: 5,
			scoring_type: 'field_count'
		};
		creatingSection = false;
		editingSection = null;
	}

	function resetFieldForm() {
		fieldForm = {
			field_name: '',
			field_label: '',
			field_type_id: data.fieldTypes[0]?.id || 0,
			is_required: false,
			importance_level: 'optional',
			help_text: '',
			placeholder: ''
		};
		resetFieldConfigEditor();
		creatingField = null;
		editingField = null;
	}

	function resetFieldConfigEditor() {
		fieldConfigEditor = createDefaultFieldConfig();
	}

	function optionLineFromConfig(option: any): string {
		if (typeof option === 'string') {
			return option;
		}
		const value = (option?.value ?? option?.label ?? '').toString().trim();
		const label = (option?.label ?? option?.value ?? '').toString().trim();
		if (!value) return '';
		return label && label !== value ? `${label} | ${value}` : value;
	}

	function populateFieldConfigEditor(configJSON: string | null, typeName?: string) {
		resetFieldConfigEditor();
		if (!configJSON) return;
		try {
			const parsed = JSON.parse(configJSON);
			if (typeof parsed.rows === 'number') fieldConfigEditor.rows = parsed.rows.toString();
			if (Array.isArray(parsed.options)) {
				const optionLines = parsed.options
					.map(optionLineFromConfig)
					.filter((line: string) => line.trim().length > 0);
				fieldConfigEditor.optionsText = optionLines.join('\n');
			}
			if (typeof parsed.min === 'number') fieldConfigEditor.min = parsed.min.toString();
			if (typeof parsed.max === 'number') {
				if (typeName === 'rating') {
					fieldConfigEditor.ratingMax = parsed.max.toString();
				} else {
					fieldConfigEditor.max = parsed.max.toString();
				}
			}
			if (typeof parsed.step === 'number') fieldConfigEditor.step = parsed.step.toString();
			if (typeof parsed.prefix === 'string') fieldConfigEditor.prefix = parsed.prefix;
			if (typeof parsed.suffix === 'string') fieldConfigEditor.suffix = parsed.suffix;
			if (typeof parsed.maxSize === 'number') {
				fieldConfigEditor.maxSize = Math.round(parsed.maxSize / (1024 * 1024)).toString();
			}
			if (typeof parsed.accept === 'string') fieldConfigEditor.accept = parsed.accept;
		} catch (err) {
			console.warn('Failed to parse field config:', err);
		}
	}

	function getSelectedFieldType(): (typeof data.fieldTypes)[number] | undefined {
		return data.fieldTypes.find((ft) => ft.id === fieldForm.field_type_id) ?? data.fieldTypes[0];
	}

	function supportsOptions(typeName?: string) {
		return typeName === 'select' || typeName === 'multiselect' || typeName === 'radio';
	}

	function handleFieldTypeChange(event: Event) {
		const value = parseInt((event.target as HTMLSelectElement).value);
		if (!isNaN(value)) {
			fieldForm.field_type_id = value;
			resetFieldConfigEditor();
		}
	}

	function buildFieldConfig() {
		const type = selectedFieldType;
		if (!type) return {};

		const config: Record<string, any> = {};

		if (type.type_name === 'textarea') {
			const rows = parseInt(fieldConfigEditor.rows);
			if (!isNaN(rows) && rows > 0) {
				config.rows = rows;
			}
		}

		if (supportsOptions(type.type_name)) {
			const options = fieldConfigEditor.optionsText
				.split('\n')
				.map((line) => line.trim())
				.filter(Boolean)
				.map((line) => {
					const [labelPart, valuePart] = line
						.split('|')
						.map((part) => part.trim())
						.filter((part) => part.length > 0);
					if (valuePart) {
						return {
							label: labelPart,
							value: valuePart
						};
					}
					return {
						label: labelPart,
						value: labelPart
					};
				});
			if (options.length > 0) {
				config.options = options;
			}
		}

		if (type.type_name === 'number') {
			const min = parseFloat(fieldConfigEditor.min);
			const max = parseFloat(fieldConfigEditor.max);
			const step = parseFloat(fieldConfigEditor.step);
			if (!isNaN(min)) config.min = min;
			if (!isNaN(max)) config.max = max;
			if (!isNaN(step)) config.step = step;
		}

		if (type.type_name === 'currency') {
			if (fieldConfigEditor.prefix.trim()) config.prefix = fieldConfigEditor.prefix.trim();
			if (fieldConfigEditor.suffix.trim()) config.suffix = fieldConfigEditor.suffix.trim();
		}

		if (type.type_name === 'rating') {
			const max = parseInt(fieldConfigEditor.ratingMax);
			if (!isNaN(max) && max > 0) {
				config.max = max;
			}
		}

		if (type.type_name === 'file') {
			const maxSizeMb = parseInt(fieldConfigEditor.maxSize);
			if (!isNaN(maxSizeMb) && maxSizeMb > 0) {
				config.maxSize = maxSizeMb * 1024 * 1024;
			}
			if (fieldConfigEditor.accept.trim()) {
				config.accept = fieldConfigEditor.accept.trim();
			}
		}

		return config;
	}

	function buildFieldConfigJSON() {
		const config = buildFieldConfig();
		return Object.keys(config).length > 0 ? JSON.stringify(config) : '';
	}

function getSectionFields(sectionId: number) {
	return data.fields.filter((f: FieldData) => f.section_id === sectionId);
}

	function getCategoryColor(categoryName: string): string {
		const colors: Record<string, string> = {
			Planning: 'badge-primary',
			Preparation: 'badge-secondary',
			Ceremony: 'badge-accent',
			Reception: 'badge-info',
			Legal: 'badge-warning',
			Financial: 'badge-success'
		};
		return colors[categoryName] || 'badge-neutral';
	}

	// Drag and drop for fields (simplified version)
	let draggedFieldId = $state<number | null>(null);

	function handleDragStart(fieldId: number) {
		draggedFieldId = fieldId;
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
	}

	async function handleDrop(event: DragEvent, targetFieldId: number) {
		event.preventDefault();
		if (!draggedFieldId || draggedFieldId === targetFieldId) return;

	const sectionId = data.fields.find((f: FieldData) => f.id === draggedFieldId)?.section_id;
		if (!sectionId) return;

	const sectionFields = getSectionFields(sectionId);
	const draggedIndex = sectionFields.findIndex((f: FieldData) => f.id === draggedFieldId);
	const targetIndex = sectionFields.findIndex((f: FieldData) => f.id === targetFieldId);

		if (draggedIndex === -1 || targetIndex === -1) return;

		// Reorder the fields
		const reorderedFields = [...sectionFields];
		const [removed] = reorderedFields.splice(draggedIndex, 1);
		reorderedFields.splice(targetIndex, 0, removed);

		// Submit reorder
		const formData = new FormData();
		formData.append('field_ids', JSON.stringify(reorderedFields.map((f) => f.id)));

		await fetch(`?/reorderFields`, {
			method: 'POST',
			body: formData
		});

		await invalidateAll();
		draggedFieldId = null;
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-7xl">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center gap-4 mb-4">
			<a href="/admin/journeys" class="btn btn-ghost btn-sm">← Back to Journeys</a>
		</div>
		<div class="flex items-center gap-4">
			<div class="text-5xl">{data.journey.icon}</div>
			<div>
				<h1 class="text-4xl font-bold">{data.journey.name}</h1>
				<p class="text-base-content/70 mt-1">{data.journey.description || 'No description'}</p>
			</div>
		</div>
	</div>

	<!-- Tabs -->
	<div class="tabs tabs-boxed mb-6">
		<button
			class="tab"
			class:tab-active={activeTab === 'info'}
			onclick={() => (activeTab = 'info')}
		>
			Journey Info
		</button>
		<button
			class="tab"
			class:tab-active={activeTab === 'categories'}
			onclick={() => (activeTab = 'categories')}
		>
			Categories ({data.journeyCategories.length})
		</button>
		<button
			class="tab"
			class:tab-active={activeTab === 'sections'}
			onclick={() => (activeTab = 'sections')}
		>
			Sections & Fields ({data.sections.length})
		</button>
		<button
			class="tab"
			class:tab-active={activeTab === 'pricing'}
			onclick={() => (activeTab = 'pricing')}
		>
			Pricing
		</button>
		<button
			class="tab"
			class:tab-active={activeTab === 'preview'}
			onclick={() => (activeTab = 'preview')}
		>
			Preview
		</button>
	</div>

	<!-- Tab Content -->
	{#if activeTab === 'info'}
		<!-- Journey Info Tab -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">Journey Information</h2>

				{#if editingJourney}
					<form
						method="POST"
						action="?/updateJourney"
						use:enhance={() => {
							return async ({ result, update }) => {
								await update();
								if (result.type === 'success') {
									editingJourney = false;
									invalidateAll();
								}
							};
						}}
					>
						<div class="form-control mb-4">
							<label class="label" for="name">
								<span class="label-text">Journey Name *</span>
							</label>
							<input
								id="name"
								name="name"
								type="text"
								bind:value={journeyForm.name}
								required
								class="input input-bordered"
							/>
						</div>

						<div class="form-control mb-4">
							<label class="label" for="slug">
								<span class="label-text">URL Slug *</span>
							</label>
							<input
								id="slug"
								name="slug"
								type="text"
								bind:value={journeyForm.slug}
								required
								pattern="[a-z0-9-]+"
								class="input input-bordered"
							/>
						</div>

						<div class="form-control mb-4">
							<label class="label" for="description">
								<span class="label-text">Description</span>
							</label>
							<textarea
								id="description"
								name="description"
								bind:value={journeyForm.description}
								rows="3"
								class="textarea textarea-bordered"
							></textarea>
						</div>

						<div class="form-control mb-4">
							<label class="label" for="icon">
								<span class="label-text">Icon (emoji)</span>
							</label>
							<input
								id="icon"
								name="icon"
								type="text"
								bind:value={journeyForm.icon}
								maxlength="4"
								class="input input-bordered"
							/>
						</div>

						<div class="flex gap-2">
							<button type="submit" class="btn btn-primary">Save Changes</button>
							<button
								type="button"
								class="btn"
								onclick={() => {
									editingJourney = false;
									journeyForm = {
										name: data.journey.name,
										slug: data.journey.slug,
										description: data.journey.description || '',
										icon: data.journey.icon || '🎯'
									};
								}}
							>
								Cancel
							</button>
						</div>
					</form>
				{:else}
					<div class="space-y-2">
						<div>
							<span class="font-semibold">Name:</span>
							{data.journey.name}
						</div>
						<div>
							<span class="font-semibold">Slug:</span>
							<code class="bg-base-200 px-2 py-1 rounded">{data.journey.slug}</code>
						</div>
						<div>
							<span class="font-semibold">Description:</span>
							{data.journey.description || 'No description'}
						</div>
						<div>
							<span class="font-semibold">Icon:</span>
							<span class="text-2xl">{data.journey.icon}</span>
						</div>
					</div>
					<div class="card-actions justify-end mt-4">
						<button class="btn btn-primary" onclick={() => (editingJourney = true)}>
							Edit Journey Info
						</button>
					</div>
				{/if}
			</div>
		</div>
	{:else if activeTab === 'categories'}
		<!-- Categories Tab -->
		<div class="space-y-4">
			<div class="flex justify-between items-center">
				<h2 class="text-2xl font-bold">Journey Categories</h2>
				<button
					class="btn btn-primary btn-sm"
					onclick={() => {
						newCategoryForm = { name: '', description: '', icon: '📁' };
						showCategoryPicker = true;
					}}
				>
					+ Add Category
				</button>
			</div>

			{#if data.journeyCategories.length === 0}
				<div class="alert alert-info">
					<span>No categories assigned yet. Add categories to organize your sections.</span>
				</div>
			{:else}
				<div class="grid gap-4">
					{#each data.journeyCategories as jc}
						<div class="card bg-base-100 shadow-xl">
							<div class="card-body">
								<div class="flex justify-between items-start">
									<div class="flex gap-3 items-start">
										<div class="text-3xl">{jc.icon || '📁'}</div>
										<div>
											<h3 class="card-title">{jc.name}</h3>
											<p class="text-sm text-base-content/70">{jc.description || ''}</p>
											<div class="text-sm text-base-content/60 mt-2">
												Order: {jc.display_order}
											</div>
										</div>
									</div>
									<form method="POST" action="?/removeCategory" use:enhance>
										<input type="hidden" name="category_id" value={jc.category_id} />
										<button type="submit" class="btn btn-sm btn-error btn-ghost">Remove</button>
									</form>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Category Picker Modal -->
		{#if showCategoryPicker}
			<div class="modal modal-open">
				<div class="modal-box">
					<h3 class="font-bold text-lg mb-4">Add Category</h3>

					<form
						method="POST"
						action="?/addCategory"
						use:enhance={() => {
							return async ({ result, update }) => {
								await update();
								if (result.type === 'success') {
									showCategoryPicker = false;
									newCategoryForm = { name: '', description: '', icon: '📁' };
									invalidateAll();
								}
							};
						}}
					>
						<div class="form-control mb-4">
							<label class="label" for="category_name">
								<span class="label-text">Category Name</span>
							</label>
							<input
								id="category_name"
								name="category_name"
								type="text"
								class="input input-bordered"
								placeholder="e.g. Planning"
								bind:value={newCategoryForm.name}
								required
							/>
						</div>

						<div class="form-control mb-4">
							<label class="label" for="category_description">
								<span class="label-text">Description</span>
							</label>
							<textarea
								id="category_description"
								name="category_description"
								class="textarea textarea-bordered"
								rows="3"
								bind:value={newCategoryForm.description}
								placeholder="Short description for this category"
							></textarea>
						</div>

						<div class="form-control mb-4">
							<label class="label" for="category_icon">
								<span class="label-text">Icon (emoji)</span>
							</label>
							<input
								id="category_icon"
								name="category_icon"
								type="text"
								class="input input-bordered"
								maxlength="4"
								bind:value={newCategoryForm.icon}
							/>
						</div>

						<div class="form-control mb-4">
							<label class="label" for="display_order">
								<span class="label-text">Display Order</span>
							</label>
							<input
								id="display_order"
								name="display_order"
								type="number"
								value={data.journeyCategories.length + 1}
								class="input input-bordered"
							/>
						</div>

						<div class="modal-action">
							<button
								type="button"
								class="btn"
								onclick={() => {
									showCategoryPicker = false;
									newCategoryForm = { name: '', description: '', icon: '📁' };
								}}
							>
								Cancel
							</button>
							<button type="submit" class="btn btn-primary">Add Category</button>
						</div>
					</form>
				</div>
				<div
					class="modal-backdrop"
					role="button"
					tabindex="0"
					onclick={() => {
						showCategoryPicker = false;
						newCategoryForm = { name: '', description: '', icon: '📁' };
					}}
					onkeydown={(event) => {
						if (event.key === 'Enter' || event.key === ' ') {
							event.preventDefault();
							showCategoryPicker = false;
							newCategoryForm = { name: '', description: '', icon: '📁' };
						}
					}}
					aria-label="Close category picker"
				></div>
			</div>
		{/if}
	{:else if activeTab === 'sections'}
		<!-- Sections & Fields Tab -->
		<div class="space-y-6">
			<div class="flex justify-between items-center">
				<h2 class="text-2xl font-bold">Sections & Fields</h2>
				<button
					class="btn btn-primary btn-sm"
					onclick={() => {
						resetSectionForm();
						creatingSection = true;
					}}
					disabled={data.journeyCategories.length === 0}
				>
					+ Create Section
				</button>
			</div>

			{#if data.journeyCategories.length === 0}
				<div class="alert alert-warning">
					<span>Please add at least one category before creating sections.</span>
				</div>
			{:else if data.sections.length === 0}
				<div class="alert alert-info">
					<span>No sections yet. Create your first section to get started.</span>
				</div>
			{:else}
				<!-- Group sections by category -->
				{#each data.journeyCategories as jc}
					{@const categorySections = getSectionsByCategory(jc.category_id)}
					{#if categorySections.length > 0}
						<div class="mb-6">
							<h3 class="text-xl font-semibold mb-4 flex items-center gap-2">
								<span>{jc.icon}</span>
								<span>{jc.name}</span>
								<span class="badge badge-neutral">{categorySections.length} sections</span>
							</h3>

							<div class="space-y-4">
								{#each categorySections as section}
									{@const sectionFields = getSectionFields(section.section_id)}
									<div class="card bg-base-100 shadow-lg border-l-4 border-primary">
										<div class="card-body">
											<div class="flex justify-between items-start">
												<div class="flex-1">
													<h4 class="text-lg font-bold">{section.name}</h4>
													<p class="text-sm text-base-content/70 mt-1">
														{section.description || 'No description'}
													</p>
													<div class="flex gap-4 mt-2 text-sm text-base-content/60">
														<span
															>Slug: <code class="bg-base-200 px-2 py-1 rounded"
																>{section.slug}</code
															></span
														>
														<span>Weight: {section.weight}</span>
														<span>Type: {section.scoring_type}</span>
													</div>

													<!-- Fields List -->
													<div class="mt-4">
														<div class="flex justify-between items-center mb-2">
															<h5 class="font-semibold text-sm">
																Fields ({sectionFields.length})
															</h5>
															<button
																class="btn btn-xs btn-primary"
																onclick={() => {
																	resetFieldForm();
																	creatingField = section.section_id;
																}}
															>
																+ Add Field
															</button>
														</div>

														{#if sectionFields.length > 0}
															<div class="space-y-2">
																{#each sectionFields as field}
									<div
										role="listitem"
										class="flex items-center gap-2 p-2 bg-base-200 rounded cursor-move"
																		draggable="true"
																		ondragstart={() => handleDragStart(field.id)}
																		ondragover={handleDragOver}
																		ondrop={(e) => handleDrop(e, field.id)}
																	>
																		<div class="text-xl">☰</div>
																		<div class="flex-1">
																			<div class="font-medium text-sm">
																				{field.field_label}
																				{#if field.is_required}
																					<span class="text-error">*</span>
																				{/if}
																			</div>
																			<div class="text-xs text-base-content/60">
																				{field.display_name} • {field.importance_level}
																			</div>
																		</div>
																		<div class="flex gap-1">
																			<button
																				class="btn btn-xs btn-ghost"
																				onclick={() => openFieldEditor(field.id)}
																			>
																				Edit
																			</button>
																			<form
																				method="POST"
																				action="?/deleteField"
																				use:enhance
																				onsubmit={(e) => {
																					if (
																						!confirm('Are you sure you want to delete this field?')
																					) {
																						e.preventDefault();
																					}
																				}}
																			>
																				<input type="hidden" name="field_id" value={field.id} />
																				<button type="submit" class="btn btn-xs btn-ghost text-error">
																					Delete
																				</button>
																			</form>
																		</div>
																	</div>
																{/each}
															</div>
														{:else}
															<div class="text-sm text-base-content/60 italic">
																No fields yet. Add your first field above.
															</div>
														{/if}
													</div>
												</div>

												<div class="flex gap-2">
													<button
														class="btn btn-sm btn-ghost"
														onclick={() => openSectionEditor(section.section_id)}
													>
														Edit
													</button>
													<form
														method="POST"
														action="?/deleteSection"
														use:enhance
														onsubmit={(e) => {
															if (
																!confirm(
																	'Are you sure you want to delete this section and all its fields?'
																)
															) {
																e.preventDefault();
															}
														}}
													>
														<input type="hidden" name="section_id" value={section.section_id} />
														<button type="submit" class="btn btn-sm btn-ghost text-error">
															Delete
														</button>
													</form>
												</div>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				{/each}
			{/if}
		</div>

		<!-- Create/Edit Section Modal -->
		{#if creatingSection || editingSection}
			<div class="modal modal-open">
				<div class="modal-box max-w-2xl">
					<h3 class="font-bold text-lg mb-4">
						{creatingSection ? 'Create Section' : 'Edit Section'}
					</h3>

					<form
						method="POST"
						action={creatingSection ? '?/createSection' : '?/updateSection'}
						use:enhance={() => {
							return async ({ result, update }) => {
								await update();
								if (result.type === 'success') {
									resetSectionForm();
									invalidateAll();
								}
							};
						}}
					>
						{#if editingSection}
							<input type="hidden" name="section_id" value={editingSection} />
						{/if}

						<div class="form-control mb-4">
							<label class="label" for="section_name">
								<span class="label-text">Section Name *</span>
							</label>
							<input
								id="section_name"
								name="name"
								type="text"
								bind:value={sectionForm.name}
								oninput={updateSectionSlug}
								required
								class="input input-bordered"
							/>
						</div>

						<div class="form-control mb-4">
							<label class="label" for="section_slug">
								<span class="label-text">Section Slug *</span>
							</label>
							<input
								id="section_slug"
								name="slug"
								type="text"
								bind:value={sectionForm.slug}
								required
								pattern="[a-z0-9_]+"
								class="input input-bordered"
							/>
							<div class="label">
								<span class="label-text-alt">Use lowercase letters, numbers, and underscores</span>
							</div>
						</div>

						<div class="form-control mb-4">
							<label class="label" for="section_description">
								<span class="label-text">Description</span>
							</label>
							<textarea
								id="section_description"
								name="description"
								bind:value={sectionForm.description}
								rows="3"
								class="textarea textarea-bordered"
							></textarea>
						</div>

						<div class="grid grid-cols-2 gap-4 mb-4">
							<div class="form-control">
								<label class="label" for="section_category">
									<span class="label-text">Category *</span>
								</label>
								<select
									id="section_category"
									name="category_id"
									bind:value={sectionForm.category_id}
									required
									class="select select-bordered"
								>
									{#each data.journeyCategories as jc}
										<option value={jc.category_id}>
											{jc.icon} {jc.name}
										</option>
									{/each}
								</select>
							</div>

							<div class="form-control">
								<label class="label" for="section_weight">
									<span class="label-text">Weight (1-10)</span>
								</label>
								<input
									id="section_weight"
									name="weight"
									type="number"
									min="1"
									max="10"
									bind:value={sectionForm.weight}
									class="input input-bordered"
								/>
							</div>
						</div>

						<div class="form-control mb-4">
							<label class="label" for="section_scoring_type">
								<span class="label-text">Scoring Type</span>
							</label>
							<select
								id="section_scoring_type"
								name="scoring_type"
								bind:value={sectionForm.scoring_type}
								class="select select-bordered"
							>
								<option value="field_count">Field Count</option>
								<option value="list_items">List Items</option>
								<option value="custom">Custom</option>
							</select>
						</div>

						<div class="modal-action">
							<button type="button" class="btn" onclick={resetSectionForm}>Cancel</button>
							<button type="submit" class="btn btn-primary">
								{creatingSection ? 'Create Section' : 'Save Changes'}
							</button>
						</div>
					</form>
				</div>
		<div
			class="modal-backdrop"
			role="button"
			tabindex="0"
			onclick={resetSectionForm}
			onkeydown={(event) => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					resetSectionForm();
				}
			}}
			aria-label="Close section form"
		></div>
			</div>
		{/if}

		<!-- Create/Edit Field Modal -->
		{#if creatingField || editingField}
			<div class="modal modal-open">
				<div class="modal-box max-w-2xl">
					<h3 class="font-bold text-lg mb-4">
						{creatingField ? 'Add Field' : 'Edit Field'}
					</h3>

					<form
						method="POST"
						action={creatingField ? '?/createField' : '?/updateField'}
						use:enhance={() => {
							return async ({ result, update }) => {
								await update();
								if (result.type === 'success') {
									resetFieldForm();
									invalidateAll();
								}
							};
						}}
					>
						{#if creatingField}
							<input type="hidden" name="section_id" value={creatingField} />
						{:else if editingField}
							<input type="hidden" name="field_id" value={editingField} />
						{/if}

						<div class="form-control mb-4">
							<label class="label" for="field_label">
								<span class="label-text">Field Label *</span>
							</label>
							<input
								id="field_label"
								name="field_label"
								type="text"
								bind:value={fieldForm.field_label}
								oninput={updateFieldName}
								required
								placeholder="e.g., Wedding Date"
								class="input input-bordered"
							/>
						</div>

						<div class="form-control mb-4">
							<label class="label" for="field_name">
								<span class="label-text">Field Name (database key) *</span>
							</label>
							<input
								id="field_name"
								name="field_name"
								type="text"
								bind:value={fieldForm.field_name}
								required
								pattern="[a-z0-9_]+"
								placeholder="e.g., wedding_date"
								class="input input-bordered"
							/>
							<div class="label">
								<span class="label-text-alt">Use lowercase letters, numbers, and underscores</span>
							</div>
						</div>

						<div class="grid grid-cols-2 gap-4 mb-4">
							<div class="form-control">
								<label class="label" for="field_type_id">
									<span class="label-text">Field Type *</span>
								</label>
								<select
									id="field_type_id"
									name="field_type_id"
									bind:value={fieldForm.field_type_id}
									onchange={handleFieldTypeChange}
									required
									class="select select-bordered"
								>
									{#each data.fieldTypes as ft}
										<option value={ft.id}>
											{ft.icon || ''} {ft.display_name}
										</option>
									{/each}
								</select>
							</div>

							<div class="form-control">
								<label class="label" for="importance_level">
									<span class="label-text">Importance *</span>
								</label>
								<select
									id="importance_level"
									name="importance_level"
									bind:value={fieldForm.importance_level}
									required
									class="select select-bordered"
								>
									<option value="critical">Critical (40 pts)</option>
									<option value="important">Important (30 pts)</option>
									<option value="optional">Optional (10 pts)</option>
								</select>
							</div>
						</div>

						<div class="form-control mb-4">
							<label class="label" for="help_text">
								<span class="label-text">Help Text</span>
							</label>
							<textarea
								id="help_text"
								name="help_text"
								bind:value={fieldForm.help_text}
								rows="2"
								placeholder="Helpful information for the user"
								class="textarea textarea-bordered"
							></textarea>
						</div>

						<div class="form-control mb-4">
							<label class="label" for="placeholder">
								<span class="label-text">Placeholder</span>
							</label>
							<input
								id="placeholder"
								name="placeholder"
								type="text"
								bind:value={fieldForm.placeholder}
								placeholder="e.g., Enter your email"
								class="input input-bordered"
							/>
						</div>

						<div class="bg-base-200 rounded-lg p-4 mb-4 space-y-4">
							<div>
								<div class="flex items-center justify-between">
									<h4 class="font-semibold text-base">Field Configuration</h4>
									<span class="text-sm text-base-content/60">{selectedFieldType?.display_name}</span>
								</div>
								<p class="text-sm text-base-content/60">
									Use these helpers to configure how this field behaves. We'll handle the JSON behind the scenes.
								</p>
							</div>

							{#if selectedFieldType?.type_name === 'textarea'}
								<div class="form-control">
									<label class="label" for="config_rows">
										<span class="label-text">Visible Rows</span>
									</label>
									<input
										id="config_rows"
										type="number"
										min="1"
										class="input input-bordered"
										bind:value={fieldConfigEditor.rows}
									/>
								</div>
							{/if}

							{#if supportsOptions(selectedFieldType?.type_name)}
								<div class="form-control">
									<label class="label" for="config_options">
										<span class="label-text">Options</span>
									</label>
									<textarea
										id="config_options"
										class="textarea textarea-bordered"
										rows="4"
										bind:value={fieldConfigEditor.optionsText}
										placeholder="Enter one option per line"
									></textarea>
									<div class="label">
										<span class="label-text-alt">Shown for dropdowns, multi-selects, and radio buttons.</span>
									</div>
								</div>
							{/if}

							{#if selectedFieldType?.type_name === 'number'}
								<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div class="form-control">
										<label class="label" for="config_min">
											<span class="label-text">Min</span>
										</label>
										<input
											id="config_min"
											type="number"
											class="input input-bordered"
											bind:value={fieldConfigEditor.min}
										/>
									</div>
									<div class="form-control">
										<label class="label" for="config_max">
											<span class="label-text">Max</span>
										</label>
										<input
											id="config_max"
											type="number"
											class="input input-bordered"
											bind:value={fieldConfigEditor.max}
										/>
									</div>
									<div class="form-control">
										<label class="label" for="config_step">
											<span class="label-text">Step</span>
										</label>
										<input
											id="config_step"
											type="number"
											class="input input-bordered"
											bind:value={fieldConfigEditor.step}
											placeholder="e.g., 0.5"
										/>
									</div>
								</div>
							{/if}

							{#if selectedFieldType?.type_name === 'currency'}
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div class="form-control">
										<label class="label" for="config_prefix">
											<span class="label-text">Prefix</span>
										</label>
										<input
											id="config_prefix"
											type="text"
											class="input input-bordered"
											placeholder="e.g., $"
											bind:value={fieldConfigEditor.prefix}
										/>
									</div>
									<div class="form-control">
										<label class="label" for="config_suffix">
											<span class="label-text">Suffix</span>
										</label>
										<input
											id="config_suffix"
											type="text"
											class="input input-bordered"
											placeholder="e.g., USD"
											bind:value={fieldConfigEditor.suffix}
										/>
									</div>
								</div>
							{/if}

							{#if selectedFieldType?.type_name === 'rating'}
								<div class="form-control">
									<label class="label" for="config_rating_max">
										<span class="label-text">Maximum Rating</span>
									</label>
									<input
										id="config_rating_max"
										type="number"
										min="1"
										class="input input-bordered"
										bind:value={fieldConfigEditor.ratingMax}
									/>
								</div>
							{/if}

							{#if selectedFieldType?.type_name === 'file'}
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div class="form-control">
										<label class="label" for="config_max_size">
											<span class="label-text">Max File Size (MB)</span>
										</label>
										<input
											id="config_max_size"
											type="number"
											min="1"
											class="input input-bordered"
											bind:value={fieldConfigEditor.maxSize}
										/>
									</div>
									<div class="form-control">
										<label class="label" for="config_accept">
											<span class="label-text">Accepted Types</span>
										</label>
										<input
											id="config_accept"
											type="text"
											class="input input-bordered"
											placeholder=".pdf,.jpg"
											bind:value={fieldConfigEditor.accept}
										/>
									</div>
								</div>
							{/if}

							{#if !supportsOptions(selectedFieldType?.type_name) && selectedFieldType?.type_name !== 'textarea' && selectedFieldType?.type_name !== 'number' && selectedFieldType?.type_name !== 'currency' && selectedFieldType?.type_name !== 'rating' && selectedFieldType?.type_name !== 'file'}
								<p class="text-sm text-base-content/60">
									This field type doesn't need extra configuration. You're all set!
								</p>
							{/if}
						</div>

						<input type="hidden" name="field_config" value={buildFieldConfigJSON()} />

						<div class="form-control mb-4">
							<label class="label cursor-pointer justify-start gap-2">
								<input
									type="checkbox"
									name="is_required"
									bind:checked={fieldForm.is_required}
									value="true"
									class="checkbox checkbox-primary"
								/>
								<span class="label-text">Required Field</span>
							</label>
						</div>

						<div class="modal-action">
							<button type="button" class="btn" onclick={resetFieldForm}>Cancel</button>
							<button type="submit" class="btn btn-primary">
								{creatingField ? 'Add Field' : 'Save Changes'}
							</button>
						</div>
					</form>
				</div>
		<div
			class="modal-backdrop"
			role="button"
			tabindex="0"
			onclick={resetFieldForm}
			onkeydown={(event) => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					resetFieldForm();
				}
			}}
			aria-label="Close field form"
		></div>
			</div>
		{/if}
	{:else if activeTab === 'pricing'}
		<!-- Pricing Tab -->
		<div class="space-y-6">
			<div class="flex justify-between items-center">
				<div>
					<h2 class="text-2xl font-bold">Journey Pricing</h2>
					<p class="text-base-content/70 mt-1">
						Set prices for each service tier. Platform fee: {data.platformFeePercentage}%
					</p>
				</div>
				<button
					class="btn btn-primary"
					onclick={savePricing}
					disabled={savingPricing}
				>
					{savingPricing ? 'Saving...' : 'Save Pricing'}
				</button>
			</div>

			<div class="alert alert-info">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					class="stroke-current shrink-0 w-6 h-6"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					></path>
				</svg>
				<div>
					<h3 class="font-bold">Pricing Model</h3>
					<div class="text-sm">
						You set the price clients pay. Platform keeps {data.platformFeePercentage}%, you receive
						{100 - data.platformFeePercentage}%. For example: if you set $100/month, you receive $
						{100 - data.platformFeePercentage}, platform keeps ${data.platformFeePercentage}.
					</div>
				</div>
			</div>

			<!-- Pricing Cards for Each Tier -->
			<div class="grid gap-6 md:grid-cols-3">
				{#each pricingData as pricing, index}
					{@const monthlyBreakdown = calculateBreakdown(pricing.monthly_price)}
					{@const annualBreakdown = calculateBreakdown(pricing.annual_price)}

					<div class="card bg-base-100 shadow-xl border-2 {pricing.tier_slug === 'premium' ? 'border-primary' : 'border-base-300'}">
						<div class="card-body">
							<h3 class="card-title text-2xl">
								{pricing.tier_name}
								{#if pricing.tier_slug === 'premium'}
									<div class="badge badge-primary">Popular</div>
								{/if}
							</h3>

							<!-- Monthly Pricing -->
							<div class="form-control mt-4">
								<div class="label">
									<span class="label-text font-semibold">Monthly Price</span>
								</div>
								<label class="input-group">
									<span>$</span>
									<input
										type="number"
										step="0.01"
										min="0"
										bind:value={pricing.monthly_price}
										placeholder="0.00"
										class="input input-bordered w-full"
									/>
									<span>/mo</span>
								</label>

								{#if pricing.monthly_price > 0}
									<div class="mt-2 p-3 bg-base-200 rounded-lg text-sm space-y-1">
										<div class="flex justify-between">
											<span class="text-base-content/70">Client pays:</span>
											<span class="font-semibold">${pricing.monthly_price.toFixed(2)}</span>
										</div>
										<div class="flex justify-between text-success">
											<span>You receive ({100 - data.platformFeePercentage}%):</span>
											<span class="font-bold">${monthlyBreakdown.creatorReceives.toFixed(2)}</span>
										</div>
										<div class="flex justify-between text-base-content/60">
											<span>Platform fee ({data.platformFeePercentage}%):</span>
											<span>${monthlyBreakdown.platformFee.toFixed(2)}</span>
										</div>
									</div>
								{/if}
							</div>

							<div class="divider">OR</div>

							<!-- Annual Pricing -->
							<div class="form-control">
								<div class="label">
									<span class="label-text font-semibold">Annual Price</span>
									{#if pricing.monthly_price > 0}
										<span class="label-text-alt">
											(${(pricing.monthly_price * 12).toFixed(2)} if monthly)
										</span>
									{/if}
								</div>
								<label class="input-group">
									<span>$</span>
									<input
										type="number"
										step="0.01"
										min="0"
										bind:value={pricing.annual_price}
										placeholder="0.00"
										class="input input-bordered w-full"
									/>
									<span>/yr</span>
								</label>

								{#if pricing.annual_price > 0}
									<div class="mt-2 p-3 bg-base-200 rounded-lg text-sm space-y-1">
										<div class="flex justify-between">
											<span class="text-base-content/70">Client pays:</span>
											<span class="font-semibold">${pricing.annual_price.toFixed(2)}</span>
										</div>
										<div class="flex justify-between text-success">
											<span>You receive ({100 - data.platformFeePercentage}%):</span>
											<span class="font-bold">${annualBreakdown.creatorReceives.toFixed(2)}</span>
										</div>
										<div class="flex justify-between text-base-content/60">
											<span>Platform fee ({data.platformFeePercentage}%):</span>
											<span>${annualBreakdown.platformFee.toFixed(2)}</span>
										</div>
										{#if pricing.monthly_price > 0 && pricing.annual_price < pricing.monthly_price * 12}
											<div class="flex justify-between text-warning mt-2 pt-2 border-t border-base-300">
												<span>Annual savings:</span>
												<span class="font-bold">
													${((pricing.monthly_price * 12) - pricing.annual_price).toFixed(2)}
												</span>
											</div>
										{/if}
									</div>
								{/if}
							</div>

							{#if pricing.tier_slug === 'essentials'}
								<div class="alert alert-sm mt-4">
									<span class="text-xs">
										💡 Consider offering Essentials for free or low cost to attract users
									</span>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<!-- Pricing Tips -->
			<div class="card bg-base-200">
				<div class="card-body">
					<h3 class="card-title text-lg">💡 Pricing Tips</h3>
					<ul class="list-disc list-inside space-y-2 text-sm">
						<li>
							<strong>Essentials Tier:</strong> Consider free or low-cost ($0-$15/mo) to build your user
							base
						</li>
						<li>
							<strong>Guided Tier:</strong> Include mentor review value. Typical range: $25-$50/month
						</li>
						<li>
							<strong>Premium Tier:</strong> Include concierge sessions. Typical range: $75-$150/month
						</li>
						<li>
							<strong>Annual Discount:</strong> Offer 10-20% discount for annual plans to encourage commitment
						</li>
						<li>
							<strong>Test Pricing:</strong> You can always adjust prices later based on user feedback
						</li>
					</ul>
				</div>
			</div>
		</div>
	{:else if activeTab === 'preview'}
		<!-- Preview Tab -->
		<div class="space-y-4">
			<h2 class="text-2xl font-bold">Journey Preview</h2>

			<div class="alert alert-info">
				<span
					>This preview shows how your journey will appear to users. Select a section to see its
					form.</span
				>
			</div>

			<!-- Category and Section Navigation -->
			{#each data.journeyCategories as jc}
				{@const categorySections = getSectionsByCategory(jc.category_id)}
				{#if categorySections.length > 0}
					<div class="card bg-base-100 shadow-lg">
						<div class="card-body">
							<h3 class="text-xl font-bold flex items-center gap-2">
								<span>{jc.icon}</span>
								<span>{jc.name}</span>
							</h3>
							<p class="text-sm text-base-content/70">{jc.description || ''}</p>

							<div class="divider"></div>

							<div class="space-y-2">
								{#each categorySections as section}
									<button
										class="btn btn-block justify-start"
										class:btn-primary={previewSectionId === section.section_id}
										onclick={() => (previewSectionId = section.section_id)}
									>
										<span class="font-semibold">{section.name}</span>
										<span class="badge badge-neutral ml-auto">
											{getSectionFields(section.section_id).length} fields
										</span>
									</button>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			{/each}

			<!-- Section Preview -->
			{#if previewSectionId}
				{@const section = findSectionById(previewSectionId)}
				{@const sectionFields = section ? getSectionFields(section.section_id) : []}
				{#if section}
					<div class="card bg-base-100 shadow-xl border-2 border-primary">
						<div class="card-body">
							<h3 class="card-title text-2xl">{section.name}</h3>
							{#if section.description}
								<p class="text-base-content/70">{section.description}</p>
							{/if}

							<div class="divider"></div>

							{#if sectionFields.length === 0}
								<div class="alert alert-warning">
									<span>No fields defined for this section yet.</span>
								</div>
							{:else}
								<form class="space-y-4">
									{#each sectionFields as field}
										<div class="form-control">
											<label class="label" for={`preview_${field.field_name}`}>
												<span class="label-text font-semibold">
													{field.field_label}
													{#if field.is_required}
														<span class="text-error">*</span>
													{/if}
												</span>
												<span class="label-text-alt badge {field.importance_level === 'critical' ? 'badge-error' : field.importance_level === 'important' ? 'badge-warning' : 'badge-info'}">
													{field.importance_level}
												</span>
											</label>

											{#if field.help_text}
												<div class="label">
													<span class="label-text-alt">{field.help_text}</span>
												</div>
											{/if}

											<!-- Field Type Preview -->
											{#if field.type_name === 'textarea'}
												<textarea
													id={`preview_${field.field_name}`}
													placeholder={field.placeholder || ''}
													class="textarea textarea-bordered"
													disabled
												></textarea>
											{:else if field.type_name === 'select' || field.type_name === 'radio'}
												<select
													id={`preview_${field.field_name}`}
													class="select select-bordered"
													disabled
												>
													<option>{field.placeholder || 'Select an option...'}</option>
												</select>
											{:else if field.type_name === 'checkbox'}
												<input
													id={`preview_${field.field_name}`}
													type="checkbox"
													class="checkbox"
													disabled
												/>
											{:else if field.type_name === 'date'}
												<input
													id={`preview_${field.field_name}`}
													type="date"
													placeholder={field.placeholder || ''}
													class="input input-bordered"
													disabled
												/>
											{:else if field.type_name === 'number' || field.type_name === 'currency'}
												<input
													id={`preview_${field.field_name}`}
													type="number"
													placeholder={field.placeholder || ''}
													class="input input-bordered"
													disabled
												/>
											{:else}
												<input
													id={`preview_${field.field_name}`}
													type="text"
													placeholder={field.placeholder || ''}
													class="input input-bordered"
													disabled
												/>
											{/if}
										</div>
									{/each}

									<div class="alert">
										<span>This is a preview only. No data will be saved.</span>
									</div>
								</form>
							{/if}
						</div>
					</div>
				{/if}
			{:else}
				<div class="card bg-base-200">
					<div class="card-body items-center text-center">
						<p class="text-base-content/70">Select a section above to preview its form</p>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.modal-backdrop {
		background-color: rgba(0, 0, 0, 0.5);
	}

	.cursor-move {
		cursor: move;
	}
</style>
