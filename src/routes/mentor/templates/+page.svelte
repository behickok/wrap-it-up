<script lang="ts">
	/**
	 * Review Templates Management Page
	 * Create and manage reusable review feedback templates
	 */

	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Template categories
	const CATEGORIES = [
		{ value: 'positive', label: 'Positive Feedback', icon: '✅', color: 'success' },
		{ value: 'constructive', label: 'Constructive', icon: '💡', color: 'warning' },
		{ value: 'question', label: 'Questions', icon: '❓', color: 'info' },
		{ value: 'general', label: 'General', icon: '📝', color: 'neutral' }
	];

	// UI state
	let isCreating = $state(false);
	let editingTemplate = $state<any>(null);
	let selectedCategory = $state<string>('all');
	let viewingTemplate = $state<any>(null);

	// Form state for new/edit template
	let templateForm = $state({
		title: '',
		content: '',
		category: 'general',
		section_type: '',
		is_shared: false
	});

	// Filter templates by category
	const filteredTemplates = $derived(() => {
		if (selectedCategory === 'all') {
			return data.templates;
		}
		return data.templates.filter((t: any) => t.category === selectedCategory);
	});

	// Group templates by category
	const templatesByCategory = $derived(() => {
		const grouped: Record<string, any[]> = {};
		CATEGORIES.forEach((cat) => {
			grouped[cat.value] = [];
		});

		data.templates.forEach((template: any) => {
			if (grouped[template.category]) {
				grouped[template.category].push(template);
			}
		});

		return grouped;
	});

	// Get category info
	function getCategoryInfo(categoryValue: string) {
		return CATEGORIES.find((c) => c.value === categoryValue) || CATEGORIES[3];
	}

	// Start creating new template
	function startCreate() {
		isCreating = true;
		editingTemplate = null;
		templateForm = {
			title: '',
			content: '',
			category: 'general',
			section_type: '',
			is_shared: false
		};
	}

	// Start editing template
	function startEdit(template: any) {
		isCreating = false;
		editingTemplate = template;
		templateForm = {
			title: template.title,
			content: template.content,
			category: template.category,
			section_type: template.section_type || '',
			is_shared: template.is_shared === 1
		};
	}

	// Cancel editing
	function cancelEdit() {
		isCreating = false;
		editingTemplate = null;
	}

	// View template details
	function viewTemplate(template: any) {
		viewingTemplate = template;
	}

	// Copy template content to clipboard
	async function copyToClipboard(content: string) {
		try {
			await navigator.clipboard.writeText(content);
			alert('Template copied to clipboard!');
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}
</script>

<svelte:head>
	<title>Review Templates - Mentor Dashboard</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-2">Review Templates</h1>
		<p class="text-base-content/70">
			Create reusable feedback templates to speed up your review process
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
			<!-- Create/Edit Template Form -->
			{#if isCreating || editingTemplate}
				<div class="card bg-base-100 shadow mb-6">
					<div class="card-body">
						<div class="flex items-center justify-between mb-4">
							<h2 class="card-title">
								{editingTemplate ? 'Edit Template' : 'Create New Template'}
							</h2>
							<button class="btn btn-sm btn-ghost" onclick={cancelEdit}> Cancel </button>
						</div>

						<form
							method="POST"
							action={editingTemplate ? '?/updateTemplate' : '?/createTemplate'}
							use:enhance
						>
							{#if editingTemplate}
								<input type="hidden" name="template_id" value={editingTemplate.id} />
							{/if}

							<div class="space-y-4">
								<!-- Title -->
								<div class="form-control">
									<label class="label" for="title">
										<span class="label-text">Template Title</span>
										<span class="label-text-alt">{templateForm.title.length}/200</span>
									</label>
									<input
										id="title"
										type="text"
										name="title"
										class="input input-bordered"
										placeholder="e.g., Great analysis with minor suggestions"
										bind:value={templateForm.title}
										maxlength="200"
										required
									/>
								</div>

								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<!-- Category -->
									<div class="form-control">
										<label class="label" for="category">
											<span class="label-text">Category</span>
										</label>
										<select
											id="category"
											name="category"
											class="select select-bordered"
											bind:value={templateForm.category}
											required
										>
											{#each CATEGORIES as cat}
												<option value={cat.value}>
													{cat.icon} {cat.label}
												</option>
											{/each}
										</select>
									</div>

									<!-- Section Type (Optional) -->
									<div class="form-control">
										<label class="label" for="section_type">
											<span class="label-text">Section Type (Optional)</span>
										</label>
										<input
											id="section_type"
											type="text"
											name="section_type"
											class="input input-bordered"
											placeholder="e.g., text, file, url"
											bind:value={templateForm.section_type}
										/>
									</div>
								</div>

								<!-- Content -->
								<div class="form-control">
									<label class="label" for="content">
										<span class="label-text">Template Content</span>
										<span class="label-text-alt">{templateForm.content.length}/5000</span>
									</label>
									<textarea
										id="content"
										name="content"
										class="textarea textarea-bordered h-48"
										placeholder="Enter your feedback template here...

Example:
Great work on [specific aspect]! I can see you've put thought into [element].

To strengthen this further, consider:
1. [Suggestion 1]
2. [Suggestion 2]

Keep up the excellent progress!"
										bind:value={templateForm.content}
										maxlength="5000"
										required
									></textarea>
								</div>

								<!-- Share Option -->
								<div class="form-control">
									<label class="label cursor-pointer justify-start gap-4">
										<input
											type="checkbox"
											name="is_shared"
											class="checkbox checkbox-primary"
											bind:checked={templateForm.is_shared}
											value="true"
										/>
										<div>
											<span class="label-text font-medium">Share with other mentors</span>
											<div class="label-text-alt text-base-content/60">
												Make this template visible to other mentors as an example
											</div>
										</div>
									</label>
								</div>
							</div>

							<div class="card-actions justify-end mt-6">
								<button type="submit" class="btn btn-primary">
									{editingTemplate ? 'Update Template' : 'Create Template'}
								</button>
							</div>
						</form>
					</div>
				</div>
			{:else}
				<!-- Create Button -->
				<button class="btn btn-primary btn-lg w-full mb-6" onclick={startCreate}>
					+ Create New Template
				</button>
			{/if}

			<!-- Templates List -->
			<div class="card bg-base-100 shadow">
				<div class="card-body">
					<h2 class="card-title mb-4">My Templates ({data.templates.length})</h2>

					{#if data.templates.length > 0}
						<!-- Category Tabs -->
						<div class="tabs tabs-boxed mb-4">
							<button
								class="tab {selectedCategory === 'all' ? 'tab-active' : ''}"
								onclick={() => (selectedCategory = 'all')}
							>
								All ({data.templates.length})
							</button>
							{#each CATEGORIES as cat}
								{@const count = templatesByCategory()[cat.value].length}
								{#if count > 0}
									<button
										class="tab {selectedCategory === cat.value ? 'tab-active' : ''}"
										onclick={() => (selectedCategory = cat.value)}
									>
										{cat.icon} {cat.label} ({count})
									</button>
								{/if}
							{/each}
						</div>

						<!-- Templates Grid -->
						<div class="grid grid-cols-1 gap-4">
							{#each filteredTemplates() as template}
								{@const catInfo = getCategoryInfo(template.category)}
								<div class="card bg-base-200 hover:shadow-md transition-shadow">
									<div class="card-body p-4">
										<div class="flex items-start justify-between gap-4">
											<div class="flex-1 min-w-0">
												<div class="flex items-center gap-2 mb-2">
													<span class="badge badge-{catInfo.color} badge-sm">
														{catInfo.icon} {catInfo.label}
													</span>
													{#if template.is_shared}
														<span class="badge badge-outline badge-sm">Shared</span>
													{/if}
													{#if template.section_type}
														<span class="badge badge-ghost badge-sm">
															{template.section_type}
														</span>
													{/if}
												</div>

												<h3 class="font-semibold mb-2 truncate">{template.title}</h3>

												<p class="text-sm text-base-content/70 line-clamp-2">
													{template.content}
												</p>

												<div class="flex items-center gap-4 mt-3 text-xs text-base-content/50">
													<span>Used {template.usage_count || 0} times</span>
												</div>
											</div>

											<div class="dropdown dropdown-end">
												<button tabindex="0" class="btn btn-ghost btn-sm btn-circle">⋮</button>
												<ul
													tabindex="0"
													class="dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-52"
												>
													<li>
														<button onclick={() => viewTemplate(template)}> 👁️ View </button>
													</li>
													<li>
														<button onclick={() => copyToClipboard(template.content)}>
															📋 Copy
														</button>
													</li>
													<li>
														<button onclick={() => startEdit(template)}> ✏️ Edit </button>
													</li>
													<li>
														<form method="POST" action="?/deleteTemplate" use:enhance>
															<input type="hidden" name="template_id" value={template.id} />
															<button
																type="submit"
																class="text-error"
																onclick={(e) => {
																	if (!confirm('Delete this template?')) e.preventDefault();
																}}
															>
																🗑️ Delete
															</button>
														</form>
													</li>
												</ul>
											</div>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="text-center py-12 text-base-content/50">
							<p class="text-lg mb-2">No templates yet</p>
							<p class="text-sm">Create your first template to get started!</p>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Sidebar -->
		<div class="lg:col-span-1 space-y-6">
			<!-- Stats Card -->
			<div class="card bg-base-100 shadow">
				<div class="card-body">
					<h3 class="font-semibold mb-3">Template Stats</h3>
					<div class="stats stats-vertical shadow-sm">
						<div class="stat p-4">
							<div class="stat-title text-xs">Total Templates</div>
							<div class="stat-value text-2xl">{data.templates.length}</div>
						</div>
						<div class="stat p-4">
							<div class="stat-title text-xs">Shared Templates</div>
							<div class="stat-value text-2xl">
								{data.templates.filter((t: any) => t.is_shared).length}
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Shared Templates Library -->
			{#if data.sharedTemplates.length > 0}
				<div class="card bg-base-100 shadow">
					<div class="card-body">
						<h3 class="font-semibold mb-3">Community Templates</h3>
						<p class="text-sm text-base-content/70 mb-4">
							Templates shared by other mentors
						</p>

						<div class="space-y-3 max-h-96 overflow-y-auto">
							{#each data.sharedTemplates as template}
								{@const catInfo = getCategoryInfo(template.category)}
								<div class="card bg-base-200">
									<div class="card-body p-3">
										<div class="flex items-start justify-between gap-2">
											<div class="flex-1 min-w-0">
												<div class="badge badge-{catInfo.color} badge-xs mb-1">
													{catInfo.icon}
												</div>
												<h4 class="font-medium text-sm truncate mb-1">{template.title}</h4>
												<p class="text-xs text-base-content/60 mb-1">
													by {template.author_name}
												</p>
												<p class="text-xs text-base-content/50">
													Used {template.usage_count || 0}× by mentors
												</p>
											</div>

											<div class="flex flex-col gap-1">
												<button
													class="btn btn-xs btn-ghost"
													onclick={() => viewTemplate(template)}
												>
													👁️
												</button>
												<form method="POST" action="?/copyTemplate" use:enhance>
													<input type="hidden" name="source_template_id" value={template.id} />
													<button type="submit" class="btn btn-xs btn-primary"> Copy </button>
												</form>
											</div>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			<!-- Help Card -->
			<div class="card bg-info/10">
				<div class="card-body p-4">
					<h4 class="font-semibold text-sm mb-2">💡 Template Tips</h4>
					<ul class="text-xs space-y-2 text-base-content/70">
						<li>• Use [brackets] for placeholders</li>
						<li>• Keep feedback specific and actionable</li>
						<li>• Balance praise with suggestions</li>
						<li>• Share great templates with the community</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Template Preview Modal -->
{#if viewingTemplate}
	<div class="modal modal-open">
		<div class="modal-box max-w-2xl">
			<h3 class="font-bold text-lg mb-4">{viewingTemplate.title}</h3>

			<div class="flex items-center gap-2 mb-4">
				{@const catInfo = getCategoryInfo(viewingTemplate.category)}
				<span class="badge badge-{catInfo.color}">
					{catInfo.icon} {catInfo.label}
				</span>
				{#if viewingTemplate.section_type}
					<span class="badge badge-ghost">{viewingTemplate.section_type}</span>
				{/if}
				{#if viewingTemplate.author_name}
					<span class="text-sm text-base-content/60">by {viewingTemplate.author_name}</span>
				{/if}
			</div>

			<div class="bg-base-200 p-4 rounded-lg mb-4 whitespace-pre-wrap">
				{viewingTemplate.content}
			</div>

			<div class="modal-action">
				<button class="btn btn-ghost" onclick={() => (viewingTemplate = null)}> Close </button>
				<button class="btn btn-primary" onclick={() => copyToClipboard(viewingTemplate.content)}>
					Copy to Clipboard
				</button>
			</div>
		</div>
		<div class="modal-backdrop" onclick={() => (viewingTemplate = null)}></div>
	</div>
{/if}
