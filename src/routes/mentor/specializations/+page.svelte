<script lang="ts">
	/**
	 * Mentor Specializations Page
	 * Manage expertise areas and proficiency levels
	 */

	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Proficiency levels
	const PROFICIENCY_LEVELS = [
		{ value: 1, label: 'Beginner', description: 'Learning and gaining experience', icon: '🌱' },
		{ value: 2, label: 'Intermediate', description: 'Comfortable with basics', icon: '📚' },
		{ value: 3, label: 'Proficient', description: 'Confident and experienced', icon: '⭐' },
		{ value: 4, label: 'Advanced', description: 'Deep expertise', icon: '🏆' },
		{ value: 5, label: 'Expert', description: 'Recognized authority', icon: '👑' }
	];

	// UI state
	let isAdding = $state(false);
	let editingSpec = $state<any>(null);

	// Form state
	let specForm = $state({
		specialization_id: 0,
		proficiency_level: 3,
		years_experience: 0,
		is_primary: false
	});

	// Get available specializations (not already added)
	const availableSpecializations = $derived(() => {
		const mentorSpecIds = new Set(
			data.mentorSpecializations.map((ms: any) => ms.specialization_id)
		);
		return data.specializations.filter((s: any) => !mentorSpecIds.has(s.id));
	});

	// Get proficiency info
	function getProficiencyInfo(level: number) {
		return PROFICIENCY_LEVELS.find((p) => p.value === level) || PROFICIENCY_LEVELS[2];
	}

	// Start adding new specialization
	function startAdd() {
		isAdding = true;
		editingSpec = null;
		specForm = {
			specialization_id: availableSpecializations()[0]?.id || 0,
			proficiency_level: 3,
			years_experience: 0,
			is_primary: data.mentorSpecializations.length === 0 // First one is primary by default
		};
	}

	// Start editing specialization
	function startEdit(spec: any) {
		isAdding = false;
		editingSpec = spec;
		specForm = {
			specialization_id: spec.specialization_id,
			proficiency_level: spec.proficiency_level,
			years_experience: spec.years_experience || 0,
			is_primary: spec.is_primary === 1
		};
	}

	// Cancel editing
	function cancelEdit() {
		isAdding = false;
		editingSpec = null;
	}
</script>

<svelte:head>
	<title>Specializations - Mentor Dashboard</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-2">My Specializations</h1>
		<p class="text-base-content/70">
			Define your areas of expertise to match with the right learners
		</p>
	</div>

	<!-- Success/Error Messages -->
	{#if form?.success}
		<div class="alert alert-success mb-6">
			<span>{form.message}</span>
		</div>
	{/if}

	{#if form?.error}
		<div class="alert alert-error mb-6">
			<span>{form.error}</span>
		</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Main Content -->
		<div class="lg:col-span-2">
			<!-- Add/Edit Form -->
			{#if isAdding || editingSpec}
				<div class="card bg-base-100 shadow mb-6">
					<div class="card-body">
						<div class="flex items-center justify-between mb-4">
							<h2 class="card-title">
								{editingSpec ? 'Edit Specialization' : 'Add Specialization'}
							</h2>
							<button class="btn btn-sm btn-ghost" onclick={cancelEdit}> Cancel </button>
						</div>

						<form
							method="POST"
							action={editingSpec ? '?/updateSpecialization' : '?/addSpecialization'}
							use:enhance
						>
							<div class="space-y-4">
								<!-- Specialization Selection (only when adding) -->
								{#if isAdding}
									<div class="form-control">
										<label class="label" for="specialization_id">
											<span class="label-text">Specialization</span>
										</label>
										<select
											id="specialization_id"
											name="specialization_id"
											class="select select-bordered"
											bind:value={specForm.specialization_id}
											required
										>
											{#each availableSpecializations() as spec}
												<option value={spec.id}>
													{spec.icon} {spec.name}
												</option>
											{/each}
										</select>
									</div>
								{:else}
									<input type="hidden" name="specialization_id" value={specForm.specialization_id} />
									<div class="alert">
										<span>
											Editing: <strong>{editingSpec.icon} {editingSpec.name}</strong>
										</span>
									</div>
								{/if}

								<!-- Proficiency Level -->
								<div class="form-control">
									<label class="label" for="proficiency_level">
										<span class="label-text">Proficiency Level</span>
									</label>
									<div class="space-y-2">
										{#each PROFICIENCY_LEVELS as level}
											<label
												class="label cursor-pointer justify-start gap-4 p-3 rounded-lg {specForm.proficiency_level ===
												level.value
													? 'bg-primary/10 border-2 border-primary'
													: 'bg-base-200'}"
											>
												<input
													type="radio"
													name="proficiency_level"
													class="radio radio-primary"
													value={level.value}
													bind:group={specForm.proficiency_level}
													required
												/>
												<div class="flex-1">
													<div class="font-medium">
														{level.icon} {level.label}
													</div>
													<div class="text-sm text-base-content/60">
														{level.description}
													</div>
												</div>
											</label>
										{/each}
									</div>
								</div>

								<!-- Years of Experience -->
								<div class="form-control">
									<label class="label" for="years_experience">
										<span class="label-text">Years of Experience</span>
									</label>
									<input
										id="years_experience"
										type="number"
										name="years_experience"
										class="input input-bordered"
										min="0"
										max="50"
										bind:value={specForm.years_experience}
										aria-describedby="years-experience-help"
									/>
									<div class="label">
										<span id="years-experience-help" class="label-text-alt">
											How many years have you worked in this area?
										</span>
									</div>
								</div>

								<!-- Primary Specialization -->
								<div class="form-control">
									<label class="label cursor-pointer justify-start gap-4">
										<input
											type="checkbox"
											name="is_primary"
											class="checkbox checkbox-primary"
											bind:checked={specForm.is_primary}
											value="true"
										/>
										<div>
											<span class="label-text font-medium">Primary Specialization</span>
											<div class="label-text-alt text-base-content/60">
												Your main area of expertise (shown prominently in your profile)
											</div>
										</div>
									</label>
								</div>
							</div>

							<div class="card-actions justify-end mt-6">
								<button type="submit" class="btn btn-primary">
									{editingSpec ? 'Update' : 'Add'} Specialization
								</button>
							</div>
						</form>
					</div>
				</div>
			{:else if availableSpecializations().length > 0}
				<!-- Add Button -->
				<button class="btn btn-primary btn-lg w-full mb-6" onclick={startAdd}>
					+ Add Specialization
				</button>
			{/if}

			<!-- Current Specializations -->
			<div class="card bg-base-100 shadow">
				<div class="card-body">
					<h2 class="card-title mb-4">
						Current Specializations ({data.mentorSpecializations.length})
					</h2>

					{#if data.mentorSpecializations.length > 0}
						<div class="space-y-4">
							{#each data.mentorSpecializations as spec}
								{@const profInfo = getProficiencyInfo(spec.proficiency_level)}
								<div
									class="card bg-base-200 hover:shadow-md transition-shadow {spec.is_primary
										? 'border-2 border-primary'
										: ''}"
								>
									<div class="card-body p-4">
										<div class="flex items-start justify-between gap-4">
											<div class="flex-1">
												<!-- Header -->
												<div class="flex items-center gap-3 mb-3">
													<span class="text-3xl">{spec.icon}</span>
													<div class="flex-1">
														<h3 class="font-bold text-lg">{spec.name}</h3>
														{#if spec.is_primary}
															<span class="badge badge-primary badge-sm">Primary</span>
														{/if}
													</div>
												</div>

												<!-- Proficiency -->
												<div class="flex items-center gap-2 mb-2">
													<span class="text-sm font-medium text-base-content/70">
														Proficiency:
													</span>
													<div class="badge badge-lg gap-2">
														{profInfo.icon} {profInfo.label}
													</div>
												</div>

												<!-- Experience -->
												{#if spec.years_experience > 0}
													<div class="text-sm text-base-content/60">
														{spec.years_experience} year{spec.years_experience === 1
															? ''
															: 's'} of experience
													</div>
												{/if}

												<!-- Proficiency Bar -->
												<div class="mt-3">
													<progress
														class="progress progress-primary w-full"
														value={spec.proficiency_level}
														max="5"
													></progress>
												</div>
											</div>

											<!-- Actions -->
											<details class="dropdown dropdown-end">
												<summary class="btn btn-ghost btn-sm btn-circle" aria-haspopup="menu">
													⋮
												</summary>
												<ul
													class="dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-40"
													role="menu"
												>
													<li>
														<button onclick={() => startEdit(spec)}> ✏️ Edit </button>
													</li>
													<li>
														<form method="POST" action="?/removeSpecialization" use:enhance>
															<input
																type="hidden"
																name="specialization_id"
																value={spec.specialization_id}
															/>
															<button
																type="submit"
																class="text-error"
																onclick={(e) => {
																	if (!confirm('Remove this specialization?')) e.preventDefault();
																}}
															>
																	🗑️ Remove
																</button>
														</form>
													</li>
												</ul>
											</details>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="text-center py-12 text-base-content/50">
							<p class="text-lg mb-2">No specializations yet</p>
							<p class="text-sm">Add your first specialization to get started!</p>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Sidebar -->
		<div class="lg:col-span-1 space-y-6">
			<!-- Stats -->
			<div class="card bg-base-100 shadow">
				<div class="card-body">
					<h3 class="font-semibold mb-3">Your Expertise</h3>
					<div class="stats stats-vertical shadow-sm">
						<div class="stat p-4">
							<div class="stat-title text-xs">Total Specializations</div>
							<div class="stat-value text-2xl">{data.mentorSpecializations.length}</div>
						</div>
						<div class="stat p-4">
							<div class="stat-title text-xs">Average Proficiency</div>
							<div class="stat-value text-2xl">
								{data.mentorSpecializations.length > 0
									? (
											data.mentorSpecializations.reduce(
												(sum: number, s: any) => sum + s.proficiency_level,
												0
											) / data.mentorSpecializations.length
										).toFixed(1)
									: '0.0'}
							</div>
							<div class="stat-desc text-xs">out of 5.0</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Available Specializations -->
			{#if availableSpecializations().length > 0}
				<div class="card bg-base-100 shadow">
					<div class="card-body">
						<h3 class="font-semibold mb-3">Available Specializations</h3>
						<p class="text-sm text-base-content/70 mb-3">
							{availableSpecializations().length} more specialization{availableSpecializations()
								.length === 1
								? ''
								: 's'} available
						</p>

						<div class="space-y-2 max-h-64 overflow-y-auto">
							{#each availableSpecializations().slice(0, 5) as spec}
								<div
									class="p-2 rounded-lg bg-base-200 flex items-center gap-2"
									style="border-left: 3px solid {spec.color}"
								>
									<span class="text-xl">{spec.icon}</span>
									<div class="flex-1 min-w-0">
										<div class="text-sm font-medium truncate">{spec.name}</div>
										{#if spec.description}
											<div class="text-xs text-base-content/60 truncate">
												{spec.description}
											</div>
										{/if}
									</div>
								</div>
							{/each}
						</div>

						{#if !isAdding && !editingSpec && availableSpecializations().length > 0}
							<button class="btn btn-sm btn-primary w-full mt-3" onclick={startAdd}>
								Add Specialization
							</button>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Help Card -->
			<div class="card bg-info/10">
				<div class="card-body p-4">
					<h4 class="font-semibold text-sm mb-2">💡 Specialization Tips</h4>
					<ul class="text-xs space-y-2 text-base-content/70">
						<li>• Set your strongest area as primary</li>
						<li>• Be honest about proficiency levels</li>
						<li>• Update as you gain experience</li>
						<li>• 3-5 specializations is ideal</li>
						<li>• Helps match you with right learners</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</div>
