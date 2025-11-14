<script lang="ts">
	/**
	 * Mentor Training Modules Page
	 * Complete training to become a better mentor
	 */

	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// UI state
	let activeModule = $state<any>(null);
	let showNotes = $state<Record<number, boolean>>({});

	// Open module
	function openModule(module: any) {
		activeModule = module;

		// Auto-mark as started if not already
		if (!module.progress?.started_at && !module.progress?.completed_at) {
			// Submit start form silently
			const form = document.getElementById(`start-form-${module.id}`) as HTMLFormElement;
			if (form) {
				form.requestSubmit();
			}
		}
	}

	// Close module
	function closeModule() {
		activeModule = null;
	}

	// Format duration
	function formatDuration(minutes: number): string {
		if (minutes < 60) {
			return `${minutes} min`;
		}
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	}

	// Format date
	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
	}

	// Get status badge
	function getStatusBadge(module: any) {
		if (module.progress?.completed_at) {
			return { label: 'Completed', class: 'badge-success' };
		}
		if (module.progress?.started_at) {
			return { label: 'In Progress', class: 'badge-warning' };
		}
		return { label: 'Not Started', class: 'badge-ghost' };
	}
</script>

<svelte:head>
	<title>Mentor Training - Mentor Dashboard</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-2">Mentor Training</h1>
		<p class="text-base-content/70">
			Complete these training modules to improve your mentoring skills
		</p>
	</div>

	<!-- Success Messages -->
	{#if form?.success}
		<div class="alert alert-success mb-6">
			<span>{form.message}</span>
		</div>
	{/if}

	<!-- Progress Overview -->
	<div class="card bg-base-100 shadow mb-6">
		<div class="card-body">
			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<!-- Overall Progress -->
				<div class="stat">
					<div class="stat-title">Overall Progress</div>
					<div class="stat-value text-primary">{data.stats.completionPercentage}%</div>
					<div class="stat-desc">
						{data.stats.completedModules} of {data.stats.totalModules} modules
					</div>
				</div>

				<!-- Required Progress -->
				<div class="stat">
					<div class="stat-title">Required Training</div>
					<div class="stat-value text-secondary">
						{data.stats.requiredCompletionPercentage}%
					</div>
					<div class="stat-desc">
						{data.stats.completedRequired} of {data.stats.requiredModules} required
					</div>
				</div>

				<!-- Completion Status -->
				<div class="stat">
					<div class="stat-title">Status</div>
					<div class="stat-value text-sm">
						{#if data.stats.requiredCompletionPercentage === 100}
							<span class="text-success">✅ Complete</span>
						{:else}
							<span class="text-warning">📚 In Progress</span>
						{/if}
					</div>
					<div class="stat-desc">
						{#if data.stats.requiredCompletionPercentage === 100}
							All required modules done!
						{:else}
							Keep learning!
						{/if}
					</div>
				</div>

				<!-- Progress Bar -->
				<div class="stat">
					<div class="stat-title">Progress</div>
					<progress
						class="progress progress-primary w-full"
						value={data.stats.completionPercentage}
						max="100"
					></progress>
					<div class="stat-desc mt-1">
						Required:
						<progress
							class="progress progress-secondary w-20 inline-block"
							value={data.stats.requiredCompletionPercentage}
							max="100"
						></progress>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Training Modules List -->
	<div class="grid grid-cols-1 gap-4">
		{#each data.modules as module, index}
			{@const status = getStatusBadge(module)}
			<div class="card bg-base-100 shadow hover:shadow-lg transition-shadow">
				<div class="card-body">
					<div class="flex items-start justify-between gap-4">
						<div class="flex-1">
							<div class="flex items-center gap-3 mb-3">
								<div class="badge badge-lg badge-neutral">{index + 1}</div>
								<h2 class="card-title">{module.title}</h2>
								<span class="badge {status.class}">{status.label}</span>
								{#if module.is_required}
									<span class="badge badge-error badge-outline">Required</span>
								{/if}
							</div>

							{#if module.description}
								<p class="text-base-content/70 mb-3">{module.description}</p>
							{/if}

							<div class="flex items-center gap-4 text-sm text-base-content/60">
								{#if module.duration_minutes}
									<span>⏱️ {formatDuration(module.duration_minutes)}</span>
								{/if}
								{#if module.progress?.completed_at}
									<span>✅ Completed {formatDate(module.progress.completed_at)}</span>
								{:else if module.progress?.started_at}
									<span>📖 Started {formatDate(module.progress.started_at)}</span>
								{/if}
							</div>

							<!-- Notes (if module started) -->
							{#if module.progress && showNotes[module.id]}
								<div class="mt-4">
									<form method="POST" action="?/saveNotes" use:enhance>
										<input type="hidden" name="module_id" value={module.id} />
										<div class="form-control">
											<label class="label" for="notes-{module.id}">
												<span class="label-text text-sm">Your Notes</span>
											</label>
											<textarea
												id="notes-{module.id}"
												name="notes"
												class="textarea textarea-bordered textarea-sm"
												rows="3"
												placeholder="Add your notes or key takeaways..."
												value={module.progress.notes || ''}
											></textarea>
										</div>
										<button type="submit" class="btn btn-xs btn-ghost mt-2">
											Save Notes
										</button>
									</form>
								</div>
							{/if}
						</div>

						<div class="flex flex-col gap-2">
							<button class="btn btn-primary" onclick={() => openModule(module)}>
								{module.progress?.completed_at ? 'Review' : 'Start'}
							</button>

							{#if module.progress}
								<button
									class="btn btn-sm btn-ghost"
									onclick={() => {
										showNotes[module.id] = !showNotes[module.id];
									}}
								>
									{showNotes[module.id] ? 'Hide' : 'Notes'}
								</button>
							{/if}

							<!-- Hidden form to mark as started -->
							<form
								id="start-form-{module.id}"
								method="POST"
								action="?/startModule"
								use:enhance
								class="hidden"
							>
								<input type="hidden" name="module_id" value={module.id} />
							</form>
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>

<!-- Module Content Modal -->
{#if activeModule}
	{@const status = getStatusBadge(activeModule)}
	<div class="modal modal-open">
		<div class="modal-box max-w-4xl max-h-[90vh] flex flex-col">
			<!-- Header -->
			<div class="flex items-start justify-between mb-4 pb-4 border-b">
				<div>
					<h3 class="font-bold text-2xl mb-2">{activeModule.title}</h3>
					{#if activeModule.description}
						<p class="text-base-content/70">{activeModule.description}</p>
					{/if}
					<div class="flex items-center gap-2 mt-2">
						<span class="badge {status.class}">{status.label}</span>
						{#if activeModule.is_required}
							<span class="badge badge-error badge-outline">Required</span>
						{/if}
						{#if activeModule.duration_minutes}
							<span class="badge badge-ghost">
								⏱️ {formatDuration(activeModule.duration_minutes)}
							</span>
						{/if}
					</div>
				</div>
				<button class="btn btn-sm btn-circle btn-ghost" onclick={closeModule}>✕</button>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto mb-4 prose max-w-none">
				{@html activeModule.content.replace(/\n/g, '<br>')}
			</div>

			<!-- Video (if available) -->
			{#if activeModule.video_url}
				<div class="mb-4">
					<h4 class="font-semibold mb-2">Video</h4>
					<div class="aspect-video bg-base-200 rounded flex items-center justify-center">
						<p class="text-base-content/50">Video: {activeModule.video_url}</p>
						<!-- In production, embed YouTube/Vimeo video here -->
					</div>
				</div>
			{/if}

			<!-- Actions -->
			<div class="modal-action pt-4 border-t">
				<button class="btn btn-ghost" onclick={closeModule}>Close</button>

				{#if !activeModule.progress?.completed_at}
					<form method="POST" action="?/completeModule" use:enhance>
						<input type="hidden" name="module_id" value={activeModule.id} />
						<button type="submit" class="btn btn-success">
							✅ Mark as Complete
						</button>
					</form>
				{:else}
					<div class="badge badge-success badge-lg">✅ Completed</div>
				{/if}
			</div>
		</div>
		<button
			type="button"
			class="modal-backdrop"
			aria-label="Close training module"
			onclick={closeModule}
		></button>
	</div>
{/if}
