<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Credential, CredentialCategory } from '$lib/types';
	import FormField from './FormField.svelte';
	import Button from './ui/button/button.svelte';
	import Card from './ui/card/card.svelte';
	import * as Dialog from './ui/dialog';

	let { credentials = [], userId }: { credentials?: Credential[]; userId: number } = $props();

	let isDialogOpen = $state(false);
	let isEditing = $state(false);
	let currentCredential = $state<Partial<Credential>>({
		site_name: '',
		web_address: '',
		username: '',
		password: '',
		category: 'other',
		other_info: ''
	});

	const categoryOptions = [
		{ value: 'email', label: 'Email' },
		{ value: 'banking', label: 'Banking / Financial' },
		{ value: 'social', label: 'Social Media' },
		{ value: 'utilities', label: 'Utilities' },
		{ value: 'government', label: 'Government' },
		{ value: 'other', label: 'Other' }
	];

	function openAddDialog() {
		isEditing = false;
		currentCredential = {
			site_name: '',
			web_address: '',
			username: '',
			password: '',
			category: 'other',
			other_info: ''
		};
		isDialogOpen = true;
	}

	function openEditDialog(credential: Credential) {
		isEditing = true;
		currentCredential = { ...credential };
		isDialogOpen = true;
	}

	function closeDialog() {
		isDialogOpen = false;
		currentCredential = {
			site_name: '',
			web_address: '',
			username: '',
			password: '',
			category: 'other',
			other_info: ''
		};
	}

	function getCategoryLabel(category: CredentialCategory): string {
		const option = categoryOptions.find(opt => opt.value === category);
		return option?.label || category;
	}

	function getCategoryBadgeColor(category: CredentialCategory): string {
		const colors: Record<CredentialCategory, string> = {
			email: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
			banking: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
			social: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
			utilities: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
			government: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
			other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
		};
		return colors[category] || colors.other;
	}
</script>

<div class="space-y-6">
	<div class="flex justify-between items-center">
		<div>
			<h2 class="text-2xl font-semibold text-foreground">Usernames & Passwords</h2>
			<p class="text-muted-foreground mt-2">
				Store your important login credentials securely. Organize them by category for easy access.
			</p>
		</div>
                <Button onclick={openAddDialog}>Add Credential</Button>
	</div>

	{#if credentials.length === 0}
		<Card.Root class="border-dashed">
			<Card.Content class="flex flex-col items-center justify-center py-12">
				<svg
					class="w-16 h-16 text-muted-foreground mb-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
					/>
				</svg>
				<p class="text-lg font-medium text-foreground mb-2">No credentials yet</p>
				<p class="text-sm text-muted-foreground mb-4">
					Start adding your important login credentials to keep them organized.
				</p>
                                <Button onclick={openAddDialog}>Add Your First Credential</Button>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each credentials as credential (credential.id)}
				<Card.Root>
					<Card.Header>
						<div class="flex justify-between items-start">
							<div class="flex-1">
								<Card.Title class="text-lg">{credential.site_name}</Card.Title>
								<Card.Description class="mt-1">
									{#if credential.web_address}
										<a
											href={credential.web_address}
											target="_blank"
											rel="noopener noreferrer"
											class="text-blue-600 hover:underline text-sm"
										>
											{credential.web_address}
										</a>
									{/if}
								</Card.Description>
							</div>
							<span class="text-xs px-2 py-1 rounded-full {getCategoryBadgeColor(credential.category)}">
								{getCategoryLabel(credential.category)}
							</span>
						</div>
					</Card.Header>
					<Card.Content>
						<div class="space-y-2 text-sm">
							<div>
								<span class="font-medium text-muted-foreground">Username:</span>
								<p class="text-foreground break-all">{credential.username || 'Not set'}</p>
							</div>
							<div>
								<span class="font-medium text-muted-foreground">Password:</span>
								<p class="text-foreground font-mono">{'•'.repeat(Math.min(credential.password?.length || 0, 12))}</p>
							</div>
							{#if credential.other_info}
								<div>
									<span class="font-medium text-muted-foreground">Notes:</span>
									<p class="text-foreground text-xs line-clamp-2">{credential.other_info}</p>
								</div>
							{/if}
						</div>
					</Card.Content>
					<Card.Footer class="flex gap-2">
                                                <Button variant="outline" size="sm" onclick={() => openEditDialog(credential)}>
							Edit
						</Button>
						<form method="POST" action="?/deleteCredential" use:enhance>
							<input type="hidden" name="id" value={credential.id} />
							<Button variant="destructive" size="sm" type="submit">Delete</Button>
						</form>
					</Card.Footer>
				</Card.Root>
			{/each}
		</div>
	{/if}
</div>

<Dialog.Root bind:open={isDialogOpen}>
	<Dialog.Content class="max-w-2xl max-h-[90vh] overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>{isEditing ? 'Edit Credential' : 'Add New Credential'}</Dialog.Title>
			<Dialog.Description>
				{isEditing ? 'Update your credential information' : 'Add a new login credential to your collection'}
			</Dialog.Description>
		</Dialog.Header>

		<form
			method="POST"
			action={isEditing ? '?/updateCredential' : '?/addCredential'}
			use:enhance={() => {
				return async ({ result, update }) => {
					await update();
					if (result.type === 'success') {
						closeDialog();
					}
				};
			}}
		>
			{#if isEditing && currentCredential.id}
				<input type="hidden" name="id" value={currentCredential.id} />
			{/if}

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<FormField
					label="Site Name"
					name="site_name"
					bind:value={currentCredential.site_name}
					placeholder="e.g., Gmail, Bank of America"
					required
				/>
				<FormField
					label="Category"
					name="category"
					type="select"
					bind:value={currentCredential.category}
					options={categoryOptions}
					required
				/>
				<FormField
					label="Web Address"
					name="web_address"
					type="url"
					bind:value={currentCredential.web_address}
					placeholder="https://example.com"
				/>
				<FormField
					label="Username"
					name="username"
					bind:value={currentCredential.username}
					placeholder="Your username or email"
					required
				/>
				<div class="md:col-span-2">
					<FormField
						label="Password"
						name="password"
						type="password"
						bind:value={currentCredential.password}
						placeholder="Your password"
						required
					/>
				</div>
				<div class="md:col-span-2">
					<FormField
						label="Additional Information"
						name="other_info"
						type="textarea"
						bind:value={currentCredential.other_info}
						placeholder="Security questions, recovery codes, 2FA info, notes..."
						rows={3}
					/>
				</div>
			</div>

			<Dialog.Footer class="mt-6">
                                <Button type="button" variant="outline" onclick={closeDialog}>Cancel</Button>
				<Button type="submit">{isEditing ? 'Update' : 'Add'} Credential</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
