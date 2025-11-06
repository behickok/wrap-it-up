<script lang="ts">
	import { enhance } from '$app/forms';
	import type { KeyContact } from '$lib/types';
	import FormField from './FormField.svelte';

	let { contacts = [], userId }: { contacts?: KeyContact[]; userId: number } = $props();

	let isDialogOpen = $state(false);
	let isEditing = $state(false);
	let currentContact = $state<Partial<KeyContact>>({
		relationship: '',
		name: '',
		phone: '',
		address: '',
		email: '',
		date_of_birth: ''
	});

	function openAddDialog() {
		isEditing = false;
		currentContact = {
			relationship: '',
			name: '',
			phone: '',
			address: '',
			email: '',
			date_of_birth: ''
		};
		isDialogOpen = true;
	}

	function openEditDialog(contact: KeyContact) {
		isEditing = true;
		currentContact = { ...contact };
		isDialogOpen = true;
	}

	function closeDialog() {
		isDialogOpen = false;
		currentContact = {
			relationship: '',
			name: '',
			phone: '',
			address: '',
			email: '',
			date_of_birth: ''
		};
	}
</script>

<div class="space-y-6">
	<div class="flex justify-between items-center">
		<div>
			<h2 class="text-2xl font-semibold" style="color: var(--color-foreground);">Key Contacts</h2>
			<p class="mt-2" style="color: var(--color-muted-foreground);">
				Keep track of important people in your life and their contact information.
			</p>
		</div>
		<button class="btn" style="background-color: var(--color-primary); color: var(--color-primary-foreground);" onclick={openAddDialog}>Add Contact</button>
	</div>

	{#if contacts.length === 0}
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
						d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
					/>
				</svg>
				<p class="text-lg font-medium mb-2" style="color: var(--color-foreground);">No contacts yet</p>
				<p class="text-sm mb-4" style="color: var(--color-muted-foreground);">
					Start adding important people to your contact list.
				</p>
				<button class="btn" style="background-color: var(--color-primary); color: var(--color-primary-foreground);" onclick={openAddDialog}>Add Your First Contact</button>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each contacts as contact (contact.id)}
				<div class="card shadow-xl" style="background-color: var(--color-card);">
					<div class="card-body">
						<div class="flex justify-between items-start mb-4">
							<div class="flex-1">
								<h3 class="card-title text-lg">{contact.name}</h3>
								{#if contact.relationship}
									<span class="text-sm" style="color: var(--color-muted-foreground);">
										{contact.relationship}
									</span>
								{/if}
							</div>
						</div>
						<div class="space-y-2 text-sm">
							{#if contact.phone}
								<div>
									<span class="font-medium" style="color: var(--color-muted-foreground);">Phone:</span>
									<p style="color: var(--color-foreground);">{contact.phone}</p>
								</div>
							{/if}
							{#if contact.email}
								<div>
									<span class="font-medium" style="color: var(--color-muted-foreground);">Email:</span>
									<p class="break-all" style="color: var(--color-foreground);">{contact.email}</p>
								</div>
							{/if}
							{#if contact.address}
								<div>
									<span class="font-medium" style="color: var(--color-muted-foreground);">Address:</span>
									<p class="text-xs" style="color: var(--color-foreground);">{contact.address}</p>
								</div>
							{/if}
							{#if contact.date_of_birth}
								<div>
									<span class="font-medium" style="color: var(--color-muted-foreground);">Birthday:</span>
									<p style="color: var(--color-foreground);">{contact.date_of_birth}</p>
								</div>
							{/if}
						</div>
						<div class="card-actions justify-end mt-4 gap-2">
							<button class="btn btn-sm btn-outline" onclick={() => openEditDialog(contact)}>
								Edit
							</button>
							<form method="POST" action="?/deleteContact" use:enhance>
								<input type="hidden" name="id" value={contact.id} />
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
		<h3 class="font-bold text-lg">{isEditing ? 'Edit Contact' : 'Add New Contact'}</h3>
		<p class="py-2" style="color: var(--color-muted-foreground);">
			{isEditing ? 'Update your contact information' : 'Add a new contact to your list'}
		</p>

		<form
			method="POST"
			action={isEditing ? '?/updateContact' : '?/addContact'}
			use:enhance={() => {
				return async ({ result, update }) => {
					await update();
					if (result.type === 'success') {
						closeDialog();
					}
				};
			}}
		>
			{#if isEditing && currentContact.id}
				<input type="hidden" name="id" value={currentContact.id} />
			{/if}

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
				<FormField
					label="Name"
					name="name"
					bind:value={currentContact.name}
					placeholder="Full name"
					required
				/>
				<FormField
					label="Relationship"
					name="relationship"
					bind:value={currentContact.relationship}
					placeholder="e.g., Brother, Attorney, Friend"
					required
				/>
				<FormField
					label="Phone"
					name="phone"
					type="tel"
					bind:value={currentContact.phone}
					placeholder="(555) 123-4567"
				/>
				<FormField
					label="Email"
					name="email"
					type="email"
					bind:value={currentContact.email}
					placeholder="email@example.com"
				/>
				<div class="md:col-span-2">
					<FormField
						label="Address"
						name="address"
						type="textarea"
						bind:value={currentContact.address}
						placeholder="Street address, city, state, zip"
						rows={2}
					/>
				</div>
				<FormField
					label="Date of Birth"
					name="date_of_birth"
					type="date"
					bind:value={currentContact.date_of_birth}
				/>
			</div>

			<div class="modal-action">
				<button type="button" class="btn btn-outline" onclick={closeDialog}>Cancel</button>
				<button type="submit" class="btn" style="background-color: var(--color-primary); color: var(--color-primary-foreground);">{isEditing ? 'Update' : 'Add'} Contact</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={closeDialog}>close</button>
	</form>
</dialog>
