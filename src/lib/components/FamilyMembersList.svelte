<script lang="ts">
	import type { FamilyMember } from '$lib/types';

	let { members = [] as FamilyMember[] } = $props();

	const hasMembers = $derived(Array.isArray(members) && members.length > 0);

	function formatDate(date?: string | null) {
		if (!date) return null;
		try {
			return new Date(date).toLocaleDateString();
		} catch {
			return date;
		}
	}
</script>

<div class="space-y-6 mt-10">
	<div class="flex flex-col gap-2">
		<h4 class="text-2xl font-semibold" style="color: var(--color-foreground);">Family Directory</h4>
		<p class="text-sm" style="color: var(--color-muted-foreground);">
			A quick reference of the loved ones connected to your plan.
		</p>
	</div>

	{#if !hasMembers}
		<div class="card shadow-xl border-2 border-dashed" style="background-color: var(--color-card);">
			<div class="card-body items-center text-center gap-2">
				<p class="text-lg font-medium" style="color: var(--color-foreground);">No family members listed yet</p>
				<p class="text-sm" style="color: var(--color-muted-foreground);">
					Add family member records to the database to see them here.
				</p>
			</div>
		</div>
	{:else}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each members as member (member.id ?? `${member.relationship}-${member.legal_name ?? ''}`)}
				<div class="card shadow-xl h-full" style="background-color: var(--color-card);">
					<div class="card-body space-y-3">
						<div class="flex items-start justify-between gap-3">
							<div>
								<h5 class="card-title text-lg">{member.legal_name || 'Unnamed Family Member'}</h5>
								<p class="text-sm capitalize" style="color: var(--color-muted-foreground);">
									{member.relationship || 'Relationship unknown'}
								</p>
							</div>
							{#if member.date_of_birth}
								<span class="text-xs px-2 py-1 rounded-full" style="background-color: var(--color-muted); color: var(--color-muted-foreground);">
									DOB: {formatDate(member.date_of_birth)}
								</span>
							{/if}
						</div>

						<div class="space-y-2 text-sm">
							{#if member.address}
								<div>
									<p class="font-medium" style="color: var(--color-muted-foreground);">Address</p>
									<p style="color: var(--color-foreground);">{member.address}</p>
								</div>
							{/if}
							{#if member.mobile_phone}
								<div>
									<p class="font-medium" style="color: var(--color-muted-foreground);">Phone</p>
									<p style="color: var(--color-foreground);">{member.mobile_phone}</p>
								</div>
							{/if}
							{#if member.email}
								<div>
									<p class="font-medium" style="color: var(--color-muted-foreground);">Email</p>
									<p style="color: var(--color-foreground);">{member.email}</p>
								</div>
							{/if}
							{#if member.occupation}
								<div>
									<p class="font-medium" style="color: var(--color-muted-foreground);">Occupation</p>
									<p style="color: var(--color-foreground);">{member.occupation}</p>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
