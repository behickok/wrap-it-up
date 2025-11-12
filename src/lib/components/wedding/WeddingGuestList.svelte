<script lang="ts">
	import { enhance } from '$app/forms';
	import FormField from '$lib/components/FormField.svelte';
	import type { WeddingGuest } from '$lib/types';

	let { guests = [] }: { guests?: WeddingGuest[] } = $props();
	let newGuest = $state({
		guest_name: '',
		relationship: '',
		party_size: '1',
		email: '',
		phone: '',
		address: '',
		invitation_sent: false,
		rsvp_status: '',
		meal_preference: '',
		notes: ''
	});
</script>

<div class="space-y-8">
	<div>
		<h3 class="text-2xl font-semibold mb-2">Guest list & RSVP tracker</h3>
		<p class="text-base-content/70">
			Log every household, monitor RSVP status, and note dietary needs before sending final counts to vendors.
		</p>
	</div>

	<div class="card bg-base-100 shadow-lg border border-base-200">
		<div class="card-body">
			<h4 class="card-title">Add guest</h4>
			<form
				method="POST"
				action="?/saveWeddingGuest"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						newGuest = {
							guest_name: '',
							relationship: '',
							party_size: '1',
							email: '',
							phone: '',
							address: '',
							invitation_sent: false,
							rsvp_status: '',
							meal_preference: '',
							notes: ''
						};
					};
				}}
				class="grid grid-cols-1 md:grid-cols-2 gap-4"
			>
				<FormField label="Name" name="guest_name" bind:value={newGuest.guest_name} required />
				<FormField label="Relationship" name="relationship" bind:value={newGuest.relationship} />
				<FormField label="Party size" name="party_size" type="number" bind:value={newGuest.party_size} />
				<FormField label="Email" name="email" type="email" bind:value={newGuest.email} />
				<FormField label="Phone" name="phone" type="tel" bind:value={newGuest.phone} />
				<FormField label="Address" name="address" type="textarea" bind:value={newGuest.address} />
				<FormField label="RSVP status" name="rsvp_status" bind:value={newGuest.rsvp_status} placeholder="Pending, accepted, declined…" />
				<FormField label="Meal preference" name="meal_preference" bind:value={newGuest.meal_preference} />

				<label class="flex items-center gap-2 text-sm">
					<input type="checkbox" name="invitation_sent" value="1" checked={newGuest.invitation_sent} />
					<span>Invitation sent</span>
				</label>

				<FormField label="Notes" name="notes" type="textarea" bind:value={newGuest.notes} />

				<div class="md:col-span-2">
					<button class="btn btn-primary" type="submit">Save guest</button>
				</div>
			</form>
		</div>
	</div>

	{#if guests.length === 0}
		<div class="alert alert-info">No guests added yet.</div>
	{:else}
		<div class="grid gap-4">
			{#each guests as guest (guest.id)}
				<div class="card bg-base-100 shadow border border-base-200">
					<div class="card-body space-y-3">
						<div class="flex items-start justify-between gap-4">
							<div>
								<h4 class="text-xl font-semibold">{guest.guest_name}</h4>
								<p class="text-sm text-base-content/60">{guest.relationship || 'Guest'}</p>
							</div>
							<div class="text-right">
								<span class="badge badge-outline mb-1">{guest.rsvp_status || 'Awaiting RSVP'}</span>
								<p class="text-xs text-base-content/60">Party of {guest.party_size || 1}</p>
							</div>
						</div>

						{#if guest.meal_preference}
							<p class="text-sm"><strong>Meal:</strong> {guest.meal_preference}</p>
						{/if}

						{#if guest.notes}
							<p class="text-sm text-base-content/70">{guest.notes}</p>
						{/if}

						<details class="bg-base-200/50 rounded-lg px-4 py-3">
							<summary class="cursor-pointer font-semibold">Update guest</summary>
							<div class="mt-4 space-y-3">
								<form method="POST" action="?/saveWeddingGuest" use:enhance class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<input type="hidden" name="id" value={guest.id} />
									<FormField label="Name" name="guest_name" value={guest.guest_name} />
									<FormField label="Relationship" name="relationship" value={guest.relationship} />
									<FormField label="Party size" name="party_size" type="number" value={guest.party_size} />
									<FormField label="Email" name="email" type="email" value={guest.email} />
									<FormField label="Phone" name="phone" type="tel" value={guest.phone} />
									<FormField label="Address" name="address" type="textarea" value={guest.address} />
									<FormField label="RSVP status" name="rsvp_status" value={guest.rsvp_status} />
									<FormField label="Meal preference" name="meal_preference" value={guest.meal_preference} />
									<label class="flex items-center gap-2 text-sm">
										<input type="checkbox" name="invitation_sent" value="1" checked={Boolean(guest.invitation_sent)} />
										<span>Invitation sent</span>
									</label>
									<FormField label="Notes" name="notes" type="textarea" value={guest.notes} />
									<div class="md:col-span-2">
										<button class="btn btn-primary btn-sm" type="submit">Update</button>
									</div>
								</form>
								<form method="POST" action="?/deleteWeddingGuest" use:enhance class="flex justify-end">
									<input type="hidden" name="id" value={guest.id} />
									<button class="btn btn-error btn-sm" type="submit">Delete guest</button>
								</form>
							</div>
						</details>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
