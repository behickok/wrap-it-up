<script lang="ts">
	import { enhance } from '$app/forms';
	import type { LegalDocument } from '$lib/types';
	import FormField from './FormField.svelte';

	let { documents = [], userId }: { documents?: LegalDocument[]; userId: number } = $props();

	let isDialogOpen = $state(false);
	let isEditing = $state(false);
	let currentDocument = $state<Partial<LegalDocument>>({
		document_type: '',
		location: '',
		attorney_name: '',
		attorney_contact: '',
		notes: ''
	});

	const documentTypes = [
		'Will',
		'Trust',
		'Power of Attorney',
		'Healthcare Directive',
		'Living Will',
		'Deed',
		'Birth Certificate',
		'Marriage Certificate',
		'Divorce Decree',
		'Other'
	];

	function openAddDialog() {
		isEditing = false;
		currentDocument = {
			document_type: '',
			location: '',
			attorney_name: '',
			attorney_contact: '',
			notes: ''
		};
		isDialogOpen = true;
	}

	function openEditDialog(document: LegalDocument) {
		isEditing = true;
		currentDocument = { ...document };
		isDialogOpen = true;
	}

	function closeDialog() {
		isDialogOpen = false;
		currentDocument = {
			document_type: '',
			location: '',
			attorney_name: '',
			attorney_contact: '',
			notes: ''
		};
	}

	function getDocumentIcon(type: string): string {
		const icons: Record<string, string> = {
			'Will': '📜',
			'Trust': '🏛️',
			'Power of Attorney': '⚖️',
			'Healthcare Directive': '🏥',
			'Living Will': '💚',
			'Deed': '🏠',
			'Birth Certificate': '👶',
			'Marriage Certificate': '💍',
			'Divorce Decree': '📋',
			'Other': '📄'
		};
		return icons[type] || '📄';
	}
</script>

<div class="space-y-6">
	<div class="flex justify-between items-center">
		<div>
			<h2 class="text-2xl font-semibold" style="color: var(--color-foreground);">Legal Documents</h2>
			<p class="mt-2" style="color: var(--color-muted-foreground);">
				Track important legal documents like wills, trusts, power of attorney, etc.
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
				<p class="text-lg font-medium mb-2" style="color: var(--color-foreground);">No legal documents yet</p>
				<p class="text-sm mb-4" style="color: var(--color-muted-foreground);">
					Start tracking your important legal documents and their locations.
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
								<h3 class="card-title text-lg">{document.document_type}</h3>
							</div>
						</div>
						<div class="space-y-2 text-sm">
							{#if document.location}
								<div>
									<span class="font-medium" style="color: var(--color-muted-foreground);">Location:</span>
									<p class="break-words text-xs" style="color: var(--color-foreground);">{document.location}</p>
								</div>
							{/if}
							{#if document.attorney_name}
								<div>
									<span class="font-medium" style="color: var(--color-muted-foreground);">Attorney:</span>
									<p style="color: var(--color-foreground);">{document.attorney_name}</p>
									{#if document.attorney_contact}
										<p class="text-xs" style="color: var(--color-muted-foreground);">{document.attorney_contact}</p>
									{/if}
								</div>
							{/if}
							{#if document.notes}
								<div>
									<span class="font-medium" style="color: var(--color-muted-foreground);">Notes:</span>
									<p class="text-xs" style="color: var(--color-foreground);">{document.notes}</p>
								</div>
							{/if}
						</div>
						<div class="card-actions justify-end mt-4 gap-2">
							<button class="btn btn-sm btn-outline" onclick={() => openEditDialog(document)}>
								Edit
							</button>
							<form method="POST" action="?/deleteLegalDocument" use:enhance>
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
		<h3 class="font-bold text-lg">{isEditing ? 'Edit Legal Document' : 'Add New Legal Document'}</h3>
		<p class="py-2" style="color: var(--color-muted-foreground);">
			{isEditing ? 'Update your document information' : 'Add a new legal document to your records'}
		</p>

		<form
			method="POST"
			action={isEditing ? '?/updateLegalDocument' : '?/addLegalDocument'}
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

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
				<FormField
					label="Document Type"
					name="document_type"
					type="select"
					bind:value={currentDocument.document_type}
					options={documentTypes}
					required
				/>
				<FormField
					label="Location"
					name="location"
					type="textarea"
					bind:value={currentDocument.location}
					placeholder="Where the document is stored"
					rows={2}
				/>
				<FormField
					label="Attorney Name"
					name="attorney_name"
					bind:value={currentDocument.attorney_name}
					placeholder="Legal representative's name"
				/>
				<FormField
					label="Attorney Contact"
					name="attorney_contact"
					bind:value={currentDocument.attorney_contact}
					placeholder="Phone or email"
				/>
				<div class="md:col-span-2">
					<FormField
						label="Notes"
						name="notes"
						type="textarea"
						bind:value={currentDocument.notes}
						placeholder="Additional details or instructions"
						rows={3}
					/>
				</div>
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
