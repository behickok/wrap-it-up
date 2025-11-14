<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let showCreateModal = $state(false);
	let newJourney = $state({
		name: '',
		slug: '',
		description: '',
		icon: '🎯'
	});

	// Auto-generate slug from name
	function updateSlug() {
		newJourney.slug = newJourney.name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '');
	}

	function openCreateModal() {
		showCreateModal = true;
		newJourney = { name: '', slug: '', description: '', icon: '🎯' };
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="flex justify-between items-center mb-8">
		<div>
			<h1 class="text-4xl font-bold">Journey Builder</h1>
			<p class="text-base-content/70 mt-2">
				Create and manage journeys for your users
			</p>
		</div>
		<button class="btn btn-primary" onclick={openCreateModal}>
			+ Create New Journey
		</button>
	</div>

	<!-- Journeys List -->
	<div class="grid gap-6">
		{#each data.journeys as journey}
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<div class="flex justify-between items-start">
						<div class="flex gap-4 items-start">
							<div class="text-4xl">{journey.icon || '🎯'}</div>
							<div>
								<h2 class="card-title">
									{journey.name}
									{#if journey.is_published}
										<div class="badge badge-success">Published</div>
									{:else}
										<div class="badge badge-warning">Draft</div>
									{/if}
									{#if journey.is_featured}
										<div class="badge badge-info">Featured</div>
									{/if}
								</h2>
								<p class="text-sm text-base-content/70 mt-1">
									{journey.description || 'No description'}
								</p>
								<div class="flex gap-4 mt-2 text-sm text-base-content/60">
									<span>Slug: <code class="bg-base-200 px-2 py-1 rounded">{journey.slug}</code></span>
									{#if journey.use_count}
										<span>{journey.use_count} users</span>
									{/if}
								</div>
							</div>
						</div>

						<div class="flex gap-2">
							<a href="/admin/journeys/{journey.id}/edit" class="btn btn-sm btn-primary">
								Edit Journey
							</a>

							<form
								method="POST"
								action="?/publishJourney"
								use:enhance
							>
								<input type="hidden" name="journey_id" value={journey.id} />
								<input type="hidden" name="publish" value={journey.is_published ? 'false' : 'true'} />
								<button
									type="submit"
									class="btn btn-sm"
									class:btn-success={!journey.is_published}
									class:btn-warning={journey.is_published}
								>
									{journey.is_published ? 'Unpublish' : 'Publish'}
								</button>
							</form>

							{#if journey.creator_user_id === data.user.id}
								<form
									method="POST"
									action="?/deleteJourney"
									use:enhance
									onsubmit={(e) => {
										if (!confirm('Are you sure you want to delete this journey? This cannot be undone.')) {
											e.preventDefault();
										}
									}}
								>
									<input type="hidden" name="journey_id" value={journey.id} />
									<button type="submit" class="btn btn-sm btn-error">
										Delete
									</button>
								</form>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{:else}
			<div class="text-center py-12">
				<p class="text-xl text-base-content/70 mb-4">No journeys yet</p>
				<button class="btn btn-primary" onclick={openCreateModal}>
					Create Your First Journey
				</button>
			</div>
		{/each}
	</div>
</div>

<!-- Create Journey Modal -->
{#if showCreateModal}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg mb-4">Create New Journey</h3>

			<form method="POST" action="?/createJourney" use:enhance>
				<div class="form-control mb-4">
					<label class="label" for="name">
						<span class="label-text">Journey Name *</span>
					</label>
					<input
						id="name"
						name="name"
						type="text"
						bind:value={newJourney.name}
						oninput={updateSlug}
						placeholder="e.g., Having a Baby"
						required
						class="input input-bordered w-full"
					/>
				</div>

				<div class="form-control mb-4">
					<label class="label" for="slug">
						<span class="label-text">URL Slug *</span>
					</label>
					<input
						id="slug"
						name="slug"
						type="text"
						bind:value={newJourney.slug}
						placeholder="e.g., baby"
						required
						pattern="[a-z0-9-]+"
						class="input input-bordered w-full"
					/>
					<div class="label">
						<span class="label-text-alt">Use lowercase letters, numbers, and hyphens only</span>
					</div>
				</div>

				<div class="form-control mb-4">
					<label class="label" for="description">
						<span class="label-text">Description</span>
					</label>
					<textarea
						id="description"
						name="description"
						bind:value={newJourney.description}
						placeholder="Brief description of this journey..."
						rows="3"
						class="textarea textarea-bordered w-full"
					></textarea>
				</div>

				<div class="form-control mb-6">
					<label class="label" for="icon">
						<span class="label-text">Icon (emoji)</span>
					</label>
					<input
						id="icon"
						name="icon"
						type="text"
						bind:value={newJourney.icon}
						placeholder="🎯"
						maxlength="4"
						class="input input-bordered w-full"
					/>
				</div>

				<div class="modal-action">
					<button
						type="button"
						class="btn"
						onclick={() => (showCreateModal = false)}
					>
						Cancel
					</button>
					<button type="submit" class="btn btn-primary">
						Create Journey
					</button>
				</div>
			</form>
		</div>
		<div
			class="modal-backdrop"
			role="button"
			tabindex="0"
			onclick={() => (showCreateModal = false)}
			onkeydown={(event) => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					showCreateModal = false;
				}
			}}
			aria-label="Close create journey modal"
		></div>
	</div>
{/if}

<style>
	.modal-backdrop {
		background-color: rgba(0, 0, 0, 0.5);
	}
</style>
