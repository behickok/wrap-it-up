<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Document } from '$lib/types';
	import FormField from './FormField.svelte';

	let { documents = [], userId }: { documents?: Document[]; userId: number } = $props();

	let isDialogOpen = $state(false);
	let isEditing = $state(false);
	let currentDocument = $state<Partial<Document>>({
		document_type: '',
		file_path: ''
	});

	const documentTypes = [
		{ value: 'will', label: 'Will' },
		{ value: 'trust', label: 'Trust' },
		{ value: 'power_of_attorney', label: 'Power of Attorney' },
		{ value: 'healthcare_directive', label: 'Healthcare Directive' },
		{ value: 'birth_certificate', label: 'Birth Certificate' },
		{ value: 'marriage_certificate', label: 'Marriage Certificate' },
		{ value: 'passport', label: 'Passport' },
		{ value: 'drivers_license', label: "Driver's License" },
		{ value: 'social_security', label: 'Social Security Card' },
		{ value: 'deed', label: 'Property Deed' },
		{ value: 'title', label: 'Vehicle Title' },
		{ value: 'insurance_policy', label: 'Insurance Policy' },
		{ value: 'tax_return', label: 'Tax Return' },
		{ value: 'other', label: 'Other' }
	];

	function openAddDialog() {
		isEditing = false;
		currentDocument = {
			document_type: '',
			file_path: ''
		};
		isDialogOpen = true;
	}

	function openEditDialog(document: Document) {
		isEditing = true;
		currentDocument = { ...document };
		isDialogOpen = true;
	}

	function closeDialog() {
		isDialogOpen = false;
		currentDocument = {
			document_type: '',
			file_path: ''
		};
	}

	function getDocumentTypeLabel(type: string): string {
		const docType = documentTypes.find(dt => dt.value === type);
		return docType?.label || type;
	}

	function getDocumentIcon(type: string): string {
		const icons: Record<string, string> = {
			will: '📜',
			trust: '🏛️',
			power_of_attorney: '⚖️',
			healthcare_directive: '🏥',
			birth_certificate: '👶',
			marriage_certificate: '💍',
			passport: '🛂',
			drivers_license: '🚗',
			social_security: '🆔',
			deed: '🏠',
			title: '🚙',
			insurance_policy: '🛡️',
			tax_return: '📊',
			other: '📄'
		};
		return icons[type] || '📄';
	}
</script>

<div class="space-y-6">
	<div class="flex justify-between items-center">
		<div>
			<h2 class="text-2xl font-semibold" style="color: var(--color-foreground);">Important Documents</h2>
			<p class="mt-2" style="color: var(--color-muted-foreground);">
				Track the location of your important documents and files.
			</p>
		</div>
		<button class="btn" style="background-color: var(--color-primary); color: var(--color-primary-foreground);" onclick={openAddDialog}>Add Document</button>
	</div>

	{#if documents.length === 0}
		<div class="card shadow-xl border-2 border-dashed" style="background-color: var(--color-card);">
			<div class="card-body flex flex-col items-center justify-center py-12">
				<svg
					class="w-16 h-16 mb-4"
					style="color: var(--color-muted-foreground);"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
				<p class="text-lg font-medium mb-2" style="color: var(--color-foreground);">No documents yet</p>
				<p class="text-sm mb-4" style="color: var(--color-muted-foreground);">
					Start tracking the location of your important documents.
				</p>
				<button class="btn" style="background-color: var(--color-primary); color: var(--color-primary-foreground);" onclick={openAddDialog}>Add Your First Document</button>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each documents as document (document.id)}
				<div class="card shadow-xl" style="background-color: var(--color-card);">
					<div class="card-body">
						<div class="flex items-start mb-4">
							<div class="text-3xl mr-3">
								{getDocumentIcon(document.document_type)}
							</div>
							<div class="flex-1">
								<h3 class="card-title text-lg">{getDocumentTypeLabel(document.document_type)}</h3>
							</div>
						</div>
						<div class="space-y-2 text-sm">
							<div>
								<span class="font-medium" style="color: var(--color-muted-foreground);">Location:</span>
								<p class="break-words" style="color: var(--color-foreground);">{document.file_path || 'Not specified'}</p>
							</div>
							{#if document.uploaded_at}
								<div>
									<span class="font-medium" style="color: var(--color-muted-foreground);">Added:</span>
									<p style="color: var(--color-foreground);">{new Date(document.uploaded_at).toLocaleDateString()}</p>
								</div>
							{/if}
						</div>
						<div class="card-actions justify-end mt-4 gap-2">
							<button class="btn btn-sm btn-outline" onclick={() => openEditDialog(document)}>
								Edit
							</button>
							<form method="POST" action="?/deleteDocument" use:enhance>
								<input type="hidden" name="id" value={document.id} />
								<button class="btn btn-sm" style="background-color: var(--color-destructive); color: var(--color-destructive-foreground);" type="submit">Delete</button>
							</form>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<dialog class="modal" class:modal-open={isDialogOpen}>
	<div class="modal-box max-w-2xl">
		<h3 class="font-bold text-lg">{isEditing ? 'Edit Document' : 'Add New Document'}</h3>
		<p class="py-2" style="color: var(--color-muted-foreground);">
			{isEditing ? 'Update your document information' : 'Add a new document to track its location'}
		</p>

		<form
			method="POST"
			action={isEditing ? '?/updateDocument' : '?/addDocument'}
			use:enhance={() => {
				return async ({ result, update }) => {
					await update();
					if (result.type === 'success') {
						closeDialog();
					}
				};
			}}
		>
			{#if isEditing && currentDocument.id}
				<input type="hidden" name="id" value={currentDocument.id} />
			{/if}

			<div class="grid grid-cols-1 gap-4 mt-4">
				<FormField
					label="Document Type"
					name="document_type"
					type="select"
					bind:value={currentDocument.document_type}
					options={documentTypes}
					required
				/>
				<FormField
					label="Document Location"
					name="file_path"
					type="textarea"
					bind:value={currentDocument.file_path}
					placeholder="Where is this document stored? (e.g., Safe deposit box at First National Bank, Filing cabinet in home office, Cloud storage folder)"
					rows={3}
					required
				/>
			</div>

			<div class="modal-action">
				<button type="button" class="btn btn-outline" onclick={closeDialog}>Cancel</button>
				<button type="submit" class="btn" style="background-color: var(--color-primary); color: var(--color-primary-foreground);">{isEditing ? 'Update' : 'Add'} Document</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={closeDialog}>close</button>
	</form>
</dialog>
