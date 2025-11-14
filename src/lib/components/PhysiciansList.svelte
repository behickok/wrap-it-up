<script lang="ts">
	type PhysicianEntry = {
		id?: number;
		name?: string;
		specialty?: string;
		phone?: string;
		address?: string;
	};

let { physicians = [] as PhysicianEntry[] } = $props();

const hasPhysicians = $derived(Array.isArray(physicians) && physicians.length > 0);
</script>

<div class="space-y-6">
	<div class="flex flex-col gap-2">
		<h4 class="text-2xl font-semibold" style="color: var(--color-foreground);">
			Physician Directory
		</h4>
		<p class="text-sm" style="color: var(--color-muted-foreground);">
			Reference your medical providers quickly when coordinating care or appointments.
		</p>
	</div>

	{#if !hasPhysicians}
		<div class="card shadow-xl border-2 border-dashed" style="background-color: var(--color-card);">
			<div class="card-body items-center text-center gap-2">
				<p class="text-lg font-medium" style="color: var(--color-foreground);">No physicians saved yet</p>
				<p class="text-sm" style="color: var(--color-muted-foreground);">
					Add physicians through the data entry form to see them listed here.
				</p>
			</div>
		</div>
	{:else}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each physicians as physician (physician.id ?? `${physician.name ?? 'physician'}-${physician.phone ?? 'n/a'}`)}
				<div class="card shadow-xl h-full" style="background-color: var(--color-card);">
					<div class="card-body space-y-3">
						<div>
							<h5 class="card-title text-lg">
								{physician.name || 'Unnamed physician'}
							</h5>
							{#if physician.specialty}
								<p class="text-sm" style="color: var(--color-muted-foreground);">
									{physician.specialty}
								</p>
							{/if}
						</div>

						<div class="space-y-2 text-sm">
							{#if physician.phone}
								<div>
									<p class="font-medium" style="color: var(--color-muted-foreground);">
										Phone
									</p>
									<p style="color: var(--color-foreground);">{physician.phone}</p>
								</div>
							{/if}
							{#if physician.address}
								<div>
									<p class="font-medium" style="color: var(--color-muted-foreground);">
										Address
									</p>
									<p style="color: var(--color-foreground);">{physician.address}</p>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
