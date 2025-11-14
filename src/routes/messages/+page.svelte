<script lang="ts">
	/**
	 * Messages Inbox UI
	 * Phase 9: Display message threads
	 */

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Format relative time
	function formatRelativeTime(dateStr: string | null | undefined): string {
		if (!dateStr) return 'No messages yet';

		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMins / 60);
		const diffDays = Math.floor(diffHours / 24);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		return date.toLocaleDateString();
	}
</script>

<div class="container mx-auto p-6 max-w-5xl">
	<div class="mb-8">
		<div class="flex items-center justify-between mb-4">
			<div>
				<h1 class="text-3xl font-bold mb-2">Messages</h1>
				{#if data.unreadCount > 0}
					<p class="text-base-content/70">
						You have <span class="font-semibold text-primary">{data.unreadCount}</span> unread message{data
							.unreadCount !== 1
							? 's'
							: ''}
					</p>
				{:else}
					<p class="text-base-content/70">No new messages</p>
				{/if}
			</div>

			<div class="flex gap-2">
				<a
					href="/messages?archived={!data.includeArchived}"
					class="btn btn-outline btn-sm"
				>
					{data.includeArchived ? 'Hide' : 'Show'} Archived
				</a>
			</div>
		</div>
	</div>

	<!-- Threads List -->
	{#if data.threads.length === 0}
		<div class="alert alert-info">
			<div class="flex flex-col gap-2">
				<span>
					{#if data.includeArchived}
						No archived conversations.
					{:else}
						No messages yet. Start a conversation with a mentor or client to get started!
					{/if}
				</span>
			</div>
		</div>
	{:else}
		<div class="space-y-2">
			{#each data.threads as thread (thread.id)}
				<a
					href="/messages/{thread.id}"
					class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow block {thread.myUnreadCount >
					0
						? 'border-l-4 border-primary bg-primary/5'
						: ''}"
				>
					<div class="card-body p-4">
						<div class="flex items-center gap-4">
							<!-- Avatar placeholder -->
							<div class="avatar placeholder">
								<div
									class="bg-neutral text-neutral-content rounded-full w-12 h-12 {thread.myUnreadCount >
									0
										? 'ring ring-primary ring-offset-base-100 ring-offset-2'
										: ''}"
								>
									<span class="text-xl">{thread.otherUsername.charAt(0).toUpperCase()}</span>
								</div>
							</div>

							<!-- Thread Info -->
							<div class="flex-1 min-w-0">
								<div class="flex items-start justify-between gap-4 mb-1">
									<h3
										class="font-semibold text-lg {thread.myUnreadCount > 0 ? 'text-primary' : ''}"
									>
										{thread.otherUsername}
									</h3>

									<div class="flex items-center gap-2">
										{#if thread.myUnreadCount > 0}
											<span class="badge badge-primary badge-sm">{thread.myUnreadCount}</span>
										{/if}
										<span class="text-sm text-base-content/60">
											{formatRelativeTime(thread.last_message_at)}
										</span>
									</div>
								</div>

								{#if thread.subject}
									<p class="text-sm text-base-content/70 mb-1">
										<span class="font-medium">Subject:</span>
										{thread.subject}
									</p>
								{/if}

								{#if thread.last_message_preview}
									<p class="text-sm text-base-content/70 truncate">
										{thread.last_message_preview}
									</p>
								{/if}

								<div class="flex items-center gap-2 mt-2 text-xs text-base-content/50">
									<span>{thread.message_count} message{thread.message_count !== 1 ? 's' : ''}</span>
									{#if thread.is_archived}
										<span class="badge badge-sm badge-ghost">Archived</span>
									{/if}
								</div>
							</div>
						</div>
					</div>
				</a>
			{/each}
		</div>

		<!-- Pagination -->
		{#if data.threads.length === 50}
			<div class="flex justify-center mt-6">
				<div class="join">
					{#if data.currentPage > 1}
						<a
							href="/messages?archived={data.includeArchived}&page={data.currentPage - 1}"
							class="join-item btn"
						>
							«
						</a>
					{/if}
					<button class="join-item btn btn-active">Page {data.currentPage}</button>
					<a
						href="/messages?archived={data.includeArchived}&page={data.currentPage + 1}"
						class="join-item btn"
					>
						»
					</a>
				</div>
			</div>
		{/if}
	{/if}
</div>
