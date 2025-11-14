<script lang="ts">
	import { enhance } from '$app/forms';
	import FormField from '$lib/components/FormField.svelte';
	import type { ListSectionDefinition, ListFieldDefinition } from '$lib/types';

	type ListItem = Record<string, any>;

	interface Props {
		sectionSlug: string;
		items: ListItem[];
		definition: ListSectionDefinition;
	}

	let { sectionSlug, items = [], definition }: Props = $props();

	let listItems = $state<ListItem[]>([]);
	let isFormOpen = $state(false);
	let editingIndex = $state<number | null>(null);
	let formDraft = $state<ListItem>({});
	let saveForm: HTMLFormElement | null = null;
	let serializedData = $state('');
	let isSubmitting = $state(false);
	let errorMessage = $state<string | null>(null);

	$effect(() => {
		listItems = items?.map((item) => ({ ...item })) ?? [];
		updateSerializedData();
	});

	function updateSerializedData() {
		serializedData = JSON.stringify(listItems ?? []);
	}

	function startAdd() {
		editingIndex = null;
		formDraft = createEmptyDraft(definition.fields);
		isFormOpen = true;
	}

	function startEdit(index: number) {
		const existing = listItems[index];
		if (!existing) return;
		editingIndex = index;
		formDraft = { ...existing };
		isFormOpen = true;
	}

	function cancelEdit() {
		isFormOpen = false;
		editingIndex = null;
		formDraft = {};
	}

	function createEmptyDraft(fields: ListFieldDefinition[]): ListItem {
		const draft: ListItem = {};
		fields.forEach((field) => {
			if (field.type === 'checkbox') {
				draft[field.name] = false;
			} else {
				draft[field.name] = '';
			}
		});
		return draft;
	}

	function generateId(): string {
		if (crypto?.randomUUID) return crypto.randomUUID();
		return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
	}

	function normalizeDraftValues(draft: ListItem): ListItem {
		const normalized: ListItem = { ...draft };
		definition.fields.forEach((field) => {
			const value = normalized[field.name];
			if (field.type === 'number') {
				normalized[field.name] = value === '' || value === null || value === undefined ? null : Number(value);
			} else if (field.type === 'checkbox') {
				normalized[field.name] = Boolean(value);
			}
		});
		return normalized;
	}

	function upsertItem() {
		const updated = [...listItems];
		const normalizedDraft = normalizeDraftValues(formDraft);
		const timestamp = new Date().toISOString();

		if (!normalizedDraft.id) {
			normalizedDraft.id = generateId();
		}
		if (!normalizedDraft.created_at) {
			normalizedDraft.created_at = timestamp;
		}
		normalizedDraft.updated_at = timestamp;

		if (editingIndex === null) {
			updated.push(normalizedDraft);
		} else {
			updated[editingIndex] = normalizedDraft;
		}

		listItems = updated;
		updateSerializedData();
		submitChanges();
		isFormOpen = false;
		editingIndex = null;
	}

	function deleteItem(index: number) {
		const updated = [...listItems];
		updated.splice(index, 1);
		listItems = updated;
		updateSerializedData();
		submitChanges();
	}

	function submitChanges() {
		if (!saveForm) return;
		errorMessage = null;
		isSubmitting = true;
		saveForm.requestSubmit();
	}

	function formatValue(field: ListFieldDefinition, value: any): string {
		if (field.type === 'checkbox') {
			return value ? 'Yes' : 'No';
		}
		if (value === null || value === undefined || value === '') return '—';
		return String(value);
	}
</script>

<div class="space-y-6">
	<div class="flex flex-col gap-2">
		<h3 class="text-2xl font-semibold text-foreground">{definition.title}</h3>
		{#if definition.description}
			<p class="text-base-content/70">{definition.description}</p>
		{/if}
		<div class="flex gap-3">
			<button class="btn btn-primary" type="button" onclick={startAdd}>
				{definition.addLabel ?? 'Add Item'}
			</button>
		</div>
	</div>

	{#if errorMessage}
		<div class="alert alert-error">
			{errorMessage}
		</div>
	{/if}

	{#if listItems.length === 0}
		<div class="card border-2 border-dashed">
			<div class="card-body text-center">
				<h4 class="text-lg font-semibold">
					{definition.emptyState?.title ?? 'No entries yet'}
				</h4>
				<p class="text-sm text-base-content/70">
					{definition.emptyState?.description ?? 'Start by adding your first entry.'}
				</p>
			</div>
		</div>
	{:else}
		<div class="grid gap-4 md:grid-cols-2">
			{#each listItems as item, index (item.id ?? index)}
				<div class="card bg-base-100 border border-base-200 shadow">
					<div class="card-body space-y-3">
						{#each definition.fields as field (field.name)}
							{#if item[field.name]}
								<div class="text-sm">
									<p class="font-semibold text-base-content/70">{field.label}</p>
									<p class="text-base-content">{formatValue(field, item[field.name])}</p>
								</div>
							{/if}
						{/each}
						<div class="flex justify-end gap-2">
							<button class="btn btn-sm btn-outline" type="button" onclick={() => startEdit(index)}>
								Edit
							</button>
							<button class="btn btn-sm btn-error" type="button" onclick={() => deleteItem(index)}>
								Delete
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if isFormOpen}
		<div class="modal modal-open">
			<div class="modal-box max-w-2xl">
				<h4 class="text-xl font-semibold mb-4">
					{editingIndex === null ? definition.addLabel ?? 'Add Item' : 'Edit Item'}
				</h4>
				<div class="space-y-4">
					{#each definition.fields as field (field.name)}
						<FormField
							label={field.label}
							name={field.name}
							bind:value={formDraft[field.name]}
							type={field.type ?? 'text'}
							placeholder={field.placeholder}
							required={field.required}
							rows={field.rows ?? 3}
							options={field.options ?? []}
						/>
					{/each}
				</div>
				<div class="modal-action flex gap-2">
					<button class="btn btn-ghost" type="button" onclick={cancelEdit}>Cancel</button>
					<button class="btn btn-primary" type="button" onclick={upsertItem}>
						{editingIndex === null ? 'Add' : 'Save'}
					</button>
				</div>
			</div>
		</div>
	{/if}

	<form
		method="POST"
		action="?/saveSectionData"
		bind:this={saveForm}
		use:enhance={() => {
			isSubmitting = true;
			return async ({ update, result }) => {
				isSubmitting = false;
				if (result.type === 'success') {
					await update();
				} else {
					errorMessage = 'Save failed. Please try again.';
				}
			};
		}}
	>
		<input type="hidden" name="section_slug" value={sectionSlug} />
		<input type="hidden" name="form_data" value={serializedData} />
	</form>

	{#if isSubmitting}
		<div class="flex items-center gap-2 text-sm text-base-content/70">
			<span class="loading loading-spinner loading-sm"></span>
			Saving changes…
		</div>
	{/if}
</div>
