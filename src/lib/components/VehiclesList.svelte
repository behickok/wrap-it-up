<script lang="ts">
	import type { Vehicle } from '$lib/types';

	let { vehicles = [] as Vehicle[] } = $props();

	function formatYear(year?: number | string | null) {
		if (year === null || year === undefined || year === '') return 'Year not specified';
		return String(year);
	}
</script>

<div class="space-y-6">
	<div class="flex flex-col gap-2">
		<h2 class="text-2xl font-semibold" style="color: var(--color-foreground);">Vehicles & Property</h2>
		<p class="text-sm" style="color: var(--color-muted-foreground);">
			Keep important vehicle details handy for registrations, insurance, and estate planning.
		</p>
	</div>

	{#if !vehicles || vehicles.length === 0}
		<div class="card shadow-xl border-2 border-dashed" style="background-color: var(--color-card);">
			<div class="card-body items-center text-center gap-2">
				<p class="text-lg font-medium" style="color: var(--color-foreground);">No vehicles on file</p>
				<p class="text-sm" style="color: var(--color-muted-foreground);">
					Add vehicle information from the data entry flow to see it listed here.
				</p>
			</div>
		</div>
	{:else}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each vehicles as vehicle (vehicle.id ?? `${vehicle.make ?? 'vehicle'}-${vehicle.vin ?? Math.random()}`)}
				<div class="card shadow-xl h-full" style="background-color: var(--color-card);">
					<div class="card-body space-y-4">
						<div class="flex items-start justify-between gap-3">
							<div>
								<h3 class="card-title text-lg">
									{vehicle.make || 'Vehicle'} {vehicle.model || ''}
								</h3>
								<p class="text-sm" style="color: var(--color-muted-foreground);">
									{formatYear(vehicle.year)}
								</p>
							</div>
							{#if vehicle.registration_dates}
								<span class="text-xs font-medium px-2 py-1 rounded-full" style="background-color: var(--color-muted); color: var(--color-muted-foreground);">
									{vehicle.registration_dates}
								</span>
							{/if}
						</div>

						<div class="space-y-3 text-sm">
							{#if vehicle.names_on_title}
								<div>
									<p class="font-medium" style="color: var(--color-muted-foreground);">Names on Title</p>
									<p style="color: var(--color-foreground);">{vehicle.names_on_title}</p>
								</div>
							{/if}
							{#if vehicle.vin}
								<div>
									<p class="font-medium" style="color: var(--color-muted-foreground);">VIN</p>
									<p style="color: var(--color-foreground);">{vehicle.vin}</p>
								</div>
							{/if}
							{#if vehicle.title_location}
								<div>
									<p class="font-medium" style="color: var(--color-muted-foreground);">Title Location</p>
									<p style="color: var(--color-foreground);">{vehicle.title_location}</p>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
