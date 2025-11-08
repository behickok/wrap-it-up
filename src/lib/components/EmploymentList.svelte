<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Employment } from '$lib/types';
	import FormField from './FormField.svelte';

	let { jobs = [], userId }: { jobs?: Employment[]; userId: number } = $props();

	let isDialogOpen = $state(false);
	let isEditing = $state(false);
type EmploymentFormState = Partial<Employment> & { is_current?: string };

let currentJob = $state<EmploymentFormState>({
	employer_name: '',
	position: '',
	hire_date: '',
	is_current: 'true',
	address: '',
	phone: '',
	supervisor: '',
	supervisor_contact: ''
});

function openAddDialog() {
	isEditing = false;
	currentJob = {
		employer_name: '',
		position: '',
		hire_date: '',
		is_current: 'true',
		address: '',
		phone: '',
		supervisor: '',
		supervisor_contact: ''
	};
		isDialogOpen = true;
	}

function openEditDialog(job: Employment) {
	isEditing = true;
	currentJob = {
		...job,
		is_current: job.is_current ? 'true' : 'false'
	};
	isDialogOpen = true;
}

function closeDialog() {
	isDialogOpen = false;
	currentJob = {
		employer_name: '',
		position: '',
		hire_date: '',
		is_current: 'true',
		address: '',
		phone: '',
		supervisor: '',
			supervisor_contact: ''
		};
	}

function formatDate(value?: string | null) {
	if (!value) return 'Start date not set';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleDateString();
}

function jobIsCurrent(job: Employment | EmploymentFormState | undefined): boolean {
	if (!job) return false;
	const value = job.is_current;
	return value === true || value === 1 || value === 'true';
}
</script>

<div class="space-y-6">
	<div class="flex justify-between items-center">
		<div>
			<h2 class="text-2xl font-semibold" style="color: var(--color-foreground);">Employment History</h2>
			<p class="mt-2" style="color: var(--color-muted-foreground);">
				Keep track of current and past employers, roles, and key contacts.
			</p>
		</div>
		<button class="btn" style="background-color: var(--color-primary); color: var(--color-primary-foreground);" onclick={openAddDialog}>
			Add Employer
		</button>
	</div>

	{#if jobs.length === 0}
		<div class="card shadow-xl border-2 border-dashed" style="background-color: var(--color-card);">
			<div class="card-body flex flex-col items-center justify-center py-12 text-center">
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
						d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
					/>
				</svg>
				<p class="text-lg font-medium mb-2" style="color: var(--color-foreground);">No employment records</p>
				<p class="text-sm mb-4" style="color: var(--color-muted-foreground);">
					Add your first employer to document your work history.
				</p>
				<button class="btn" style="background-color: var(--color-primary); color: var(--color-primary-foreground);" onclick={openAddDialog}>
					Add Employer
				</button>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each jobs as job (job.id)}
				{@const current = jobIsCurrent(job)}
				<div class="card shadow-xl h-full" style="background-color: var(--color-card);">
					<div class="card-body flex flex-col">
						<div class="flex justify-between items-start mb-3">
							<div>
								<h3 class="card-title text-lg">{job.employer_name || 'Employer'}</h3>
								<p class="text-sm" style="color: var(--color-muted-foreground);">
									{job.position || 'Role not specified'}
								</p>
							</div>
							<span
								class="badge"
								style="background-color: {current ? 'var(--color-success)' : 'var(--color-muted)'}; color: white;"
							>
								{current ? 'Current' : 'Former'}
							</span>
						</div>

						<div class="space-y-2 text-sm flex-1">
							<div>
								<span class="font-medium" style="color: var(--color-muted-foreground);">Start Date</span>
								<p style="color: var(--color-foreground);">{formatDate(job.hire_date)}</p>
							</div>
							{#if job.address}
								<div>
									<span class="font-medium" style="color: var(--color-muted-foreground);">Address</span>
									<p class="text-xs" style="color: var(--color-foreground);">{job.address}</p>
								</div>
							{/if}
							{#if job.phone}
								<div>
									<span class="font-medium" style="color: var(--color-muted-foreground);">Phone</span>
									<p style="color: var(--color-foreground);">{job.phone}</p>
								</div>
							{/if}
							{#if job.supervisor}
								<div>
									<span class="font-medium" style="color: var(--color-muted-foreground);">Supervisor</span>
									<p style="color: var(--color-foreground);">
										{job.supervisor}{job.supervisor_contact ? ` • ${job.supervisor_contact}` : ''}
									</p>
								</div>
							{/if}
						</div>

						<div class="card-actions justify-end mt-4 gap-2">
							<button class="btn btn-sm btn-outline" onclick={() => openEditDialog(job)}>
								Edit
							</button>
							<form method="POST" action="?/deleteEmployment" use:enhance>
								<input type="hidden" name="id" value={job.id} />
								<button type="submit" class="btn btn-sm" style="background-color: var(--color-destructive); color: var(--color-destructive-foreground);">
									Delete
								</button>
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
		<h3 class="font-bold text-lg">{isEditing ? 'Edit Employment' : 'Add Employment'}</h3>
		<p class="py-2" style="color: var(--color-muted-foreground);">
			{isEditing ? 'Update employer details' : 'Document a new employer'}
		</p>

		<form
			method="POST"
			action={isEditing ? '?/updateEmployment' : '?/addEmployment'}
			use:enhance={() => {
				return async ({ result, update }) => {
					await update();
					if (result.type === 'success') {
						closeDialog();
					}
				};
			}}
		>
			{#if isEditing && currentJob.id}
				<input type="hidden" name="id" value={currentJob.id} />
			{/if}

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
				<FormField
					label="Employer Name"
					name="employer_name"
					bind:value={currentJob.employer_name}
					required
				/>
				<FormField
					label="Position / Title"
					name="position"
					bind:value={currentJob.position}
					required
				/>
				<FormField
					label="Hire Date"
					name="hire_date"
					type="date"
					bind:value={currentJob.hire_date}
				/>
				<FormField
					label="Currently Employed?"
					name="is_current"
					type="select"
					options={[
						{ label: 'Yes', value: 'true' },
						{ label: 'No', value: 'false' }
					]}
					bind:value={currentJob.is_current}
				/>
				<div class="md:col-span-2">
					<FormField
						label="Address"
						name="address"
						type="textarea"
						bind:value={currentJob.address}
						rows={2}
					/>
				</div>
				<FormField
					label="Phone"
					name="phone"
					type="tel"
					bind:value={currentJob.phone}
				/>
				<FormField
					label="Supervisor Name"
					name="supervisor"
					bind:value={currentJob.supervisor}
				/>
				<FormField
					label="Supervisor Contact"
					name="supervisor_contact"
					bind:value={currentJob.supervisor_contact}
				/>
			</div>

			<div class="modal-action">
				<button type="button" class="btn btn-outline" onclick={closeDialog}>Cancel</button>
				<button type="submit" class="btn" style="background-color: var(--color-primary); color: var(--color-primary-foreground);">
					{isEditing ? 'Update' : 'Add'} Employment
				</button>
			</div>
		</form>
	</div>

	<form method="dialog" class="modal-backdrop">
		<button onclick={closeDialog}>close</button>
	</form>
</dialog>
