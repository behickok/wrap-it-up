<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Credential, CredentialCategory } from '$lib/types';
	import FormField from './FormField.svelte';

	let credentials: Credential[] = [];
	let userId = 0;

	const props = $props<{ credentials?: Credential[]; userId: number }>();
	const propsCredentials = $derived(props.credentials);
	const propsUserId = $derived(props.userId);

	$effect(() => {
		credentials = (propsCredentials ?? []).slice();
		userId = propsUserId;
	});

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
			<h2 class="text-2xl font-semibold" style="color: var(--color-foreground);">Usernames & Passwords</h2>
			<p class="mt-2" style="color: var(--color-muted-foreground);">
				Store your important login credentials securely. Organize them by category for easy access.
			</p>
		</div>
		<button class="btn" style="background-color: var(--color-primary); color: var(--color-primary-foreground);" onclick={openAddDialog}>Add Credential</button>
	</div>

	{#if credentials.length === 0}
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
						d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
					/>
				</svg>
				<p class="text-lg font-medium mb-2" style="color: var(--color-foreground);">No credentials yet</p>
				<p class="text-sm mb-4" style="color: var(--color-muted-foreground);">
					Start adding your important login credentials to keep them organized.
				</p>
				<button class="btn" style="background-color: var(--color-primary); color: var(--color-primary-foreground);" onclick={openAddDialog}>Add Your First Credential</button>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each credentials as credential (credential.id)}
				<div class="card shadow-xl" style="background-color: var(--color-card);">
					<div class="card-body">
						<div class="flex justify-between items-start mb-4">
							<div class="flex-1">
								<h3 class="card-title text-lg">{credential.site_name}</h3>
								{#if credential.web_address}
									<a
										href={credential.web_address}
										target="_blank"
										rel="noopener noreferrer"
										class="text-sm hover:underline"
										style="color: var(--color-primary);"
									>
										{credential.web_address}
									</a>
								{/if}
							</div>
							<span class="badge text-xs {getCategoryBadgeColor(credential.category)}">
								{getCategoryLabel(credential.category)}
							</span>
						</div>
						<div class="space-y-2 text-sm">
							<div>
								<span class="font-medium" style="color: var(--color-muted-foreground);">Username:</span>
								<p class="break-all" style="color: var(--color-foreground);">{credential.username || 'Not set'}</p>
							</div>
							<div>
								<span class="font-medium" style="color: var(--color-muted-foreground);">Password:</span>
								<p class="font-mono" style="color: var(--color-foreground);">{'•'.repeat(Math.min(credential.password?.length || 0, 12))}</p>
							</div>
							{#if credential.other_info}
								<div>
									<span class="font-medium" style="color: var(--color-muted-foreground);">Notes:</span>
									<p class="text-xs line-clamp-2" style="color: var(--color-foreground);">{credential.other_info}</p>
								</div>
							{/if}
						</div>
						<div class="card-actions justify-end mt-4 gap-2">
							<button class="btn btn-sm btn-outline" onclick={() => openEditDialog(credential)}>
								Edit
							</button>
							<form method="POST" action="?/deleteCredential" use:enhance>
								<input type="hidden" name="id" value={credential.id} />
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
		<h3 class="font-bold text-lg">{isEditing ? 'Edit Credential' : 'Add New Credential'}</h3>
		<p class="py-2" style="color: var(--color-muted-foreground);">
			{isEditing ? 'Update your credential information' : 'Add a new login credential to your collection'}
		</p>

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

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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

			<div class="modal-action">
				<button type="button" class="btn btn-outline" onclick={closeDialog}>Cancel</button>
				<button type="submit" class="btn" style="background-color: var(--color-primary); color: var(--color-primary-foreground);">{isEditing ? 'Update' : 'Add'} Credential</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={closeDialog}>close</button>
	</form>
</dialog>
