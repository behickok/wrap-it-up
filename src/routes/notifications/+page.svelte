<script lang="ts">
	/**
	 * Notifications Center UI
	 * Phase 9: Display and manage notifications
	 */

	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	let { data }: { data: PageData } = $props();

	// Notification type labels and icons
	const typeLabels: Record<string, { label: string; icon: string; color: string }> = {
		review_claimed: { label: 'Review Claimed', icon: '👀', color: 'primary' },
		review_completed: { label: 'Review Complete', icon: '✅', color: 'success' },
		review_changes_requested: { label: 'Changes Requested', icon: '📝', color: 'warning' },
		review_available: { label: 'Review Available', icon: '📋', color: 'info' },
		mentor_approved: { label: 'Mentor Approved', icon: '👏', color: 'success' },
		mentor_rejected: { label: 'Application Update', icon: '📧', color: 'neutral' },
		journey_enrolled: { label: 'Journey Enrolled', icon: '🚀', color: 'primary' },
		milestone_achieved: { label: 'Milestone Achieved', icon: '🏆', color: 'accent' },
		new_message: { label: 'New Message', icon: '💬', color: 'info' }
	};

	// Format relative time
	function formatRelativeTime(dateStr: string): string {
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMins / 60);
		const diffDays = Math.floor(diffHours / 24);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
		if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
		if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
		return date.toLocaleDateString();
	}
</script>

<div class="container mx-auto p-6 max-w-5xl">
	<div class="mb-8">
		<div class="flex items-center justify-between mb-4">
			<div>
				<h1 class="text-3xl font-bold">Notifications</h1>
				{#if data.unreadCount > 0}
					<p class="text-base-content/70">
						You have <span class="font-semibold text-primary">{data.unreadCount}</span> unread
						notification{data.unreadCount !== 1 ? 's' : ''}
					</p>
				{:else}
					<p class="text-base-content/70">You're all caught up!</p>
				{/if}
			</div>

			<div class="flex gap-2">
				{#if data.unreadCount > 0}
					<form method="POST" action="?/markAllRead" use:enhance>
						<button type="submit" class="btn btn-outline btn-sm">
							<span class="text-xs">✓</span>
							Mark All Read
						</button>
					</form>
				{/if}

				<form method="POST" action="?/deleteRead" use:enhance>
					<button type="submit" class="btn btn-outline btn-sm btn-error">
						<span class="text-xs">🗑️</span>
						Clear Read
					</button>
				</form>

				<a href="/settings/notifications" class="btn btn-outline btn-sm">
					<span class="text-xs">⚙️</span>
					Settings
				</a>
			</div>
		</div>
	</div>

	<!-- Filter Tabs -->
	<div class="tabs tabs-boxed mb-6">
		<a
			href="/notifications?filter=all"
			class="tab {data.currentFilter === 'all' ? 'tab-active' : ''}"
		>
			All
			{#if data.unreadCount > 0}
				<span class="badge badge-sm ml-2">{data.unreadCount}</span>
			{/if}
		</a>

		<a
			href="/notifications?filter=unread"
			class="tab {data.currentFilter === 'unread' ? 'tab-active' : ''}"
		>
			Unread
			{#if data.unreadCount > 0}
				<span class="badge badge-primary badge-sm ml-2">{data.unreadCount}</span>
			{/if}
		</a>

		<a
			href="/notifications?filter=review_claimed"
			class="tab {data.currentFilter === 'review_claimed' ? 'tab-active' : ''}"
		>
			Reviews
			{#if data.countsByType.review_claimed || data.countsByType.review_completed || data.countsByType.review_changes_requested}
				<span class="badge badge-sm ml-2">
					{(data.countsByType.review_claimed || 0) +
						(data.countsByType.review_completed || 0) +
						(data.countsByType.review_changes_requested || 0)}
				</span>
			{/if}
		</a>

		<a
			href="/notifications?filter=new_message"
			class="tab {data.currentFilter === 'new_message' ? 'tab-active' : ''}"
		>
			Messages
			{#if data.countsByType.new_message}
				<span class="badge badge-sm ml-2">{data.countsByType.new_message}</span>
			{/if}
		</a>

		<a
			href="/notifications?filter=milestone_achieved"
			class="tab {data.currentFilter === 'milestone_achieved' ? 'tab-active' : ''}"
		>
			Milestones
			{#if data.countsByType.milestone_achieved}
				<span class="badge badge-sm ml-2">{data.countsByType.milestone_achieved}</span>
			{/if}
		</a>
	</div>

	<!-- Notifications List -->
	{#if data.notifications.length === 0}
		<div class="alert alert-info">
			<span>
				{#if data.currentFilter === 'unread'}
					No unread notifications. You're all caught up!
				{:else if data.currentFilter === 'all'}
					No notifications yet. We'll notify you about important updates here.
				{:else}
					No {data.currentFilter.replace('_', ' ')} notifications.
				{/if}
			</span>
		</div>
	{:else}
		<div class="space-y-2">
			{#each data.notifications as notification (notification.id)}
				{@const typeInfo = typeLabels[notification.type] || {
					label: notification.type,
					icon: '📢',
					color: 'neutral'
				}}

				<div
					class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow {!notification.read
						? 'border-l-4 border-primary bg-primary/5'
						: ''}"
				>
					<div class="card-body p-4">
						<div class="flex items-start gap-4">
							<!-- Icon -->
							<div class="text-3xl">{typeInfo.icon}</div>

							<!-- Content -->
							<div class="flex-1 min-w-0">
								<div class="flex items-start justify-between gap-4 mb-2">
									<div class="flex-1 min-w-0">
										<h3 class="font-semibold text-lg {!notification.read ? 'text-primary' : ''}">
											{notification.title}
										</h3>
										<p class="text-sm text-base-content/60">
											{notification.created_at
												? formatRelativeTime(notification.created_at)
												: 'Just now'}
										</p>
									</div>

									<!-- Actions -->
									<div class="flex gap-2">
										{#if !notification.read}
											<form method="POST" action="?/markRead" use:enhance>
												<input type="hidden" name="notificationId" value={notification.id} />
												<button
													type="submit"
													class="btn btn-ghost btn-xs"
													title="Mark as read"
												>
													✓
												</button>
											</form>
										{/if}

										<form method="POST" action="?/delete" use:enhance>
											<input type="hidden" name="notificationId" value={notification.id} />
											<button
												type="submit"
												class="btn btn-ghost btn-xs text-error"
												title="Delete"
											>
												×
											</button>
										</form>
									</div>
								</div>

								{#if notification.message}
									<p class="text-base-content/80 mb-3">{notification.message}</p>
								{/if}

								{#if notification.link}
									<div>
										<form method="POST" action="?/click" use:enhance>
											<input type="hidden" name="notificationId" value={notification.id} />
											<a
												href={notification.link}
												class="btn btn-primary btn-sm"
												onclick={(e) => {
													e.currentTarget.closest('form')?.requestSubmit();
												}}
											>
												View Details →
											</a>
										</form>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Pagination -->
		{#if data.notifications.length === 50}
			<div class="flex justify-center mt-6">
				<div class="join">
					{#if data.currentPage > 1}
						<a
							href="/notifications?filter={data.currentFilter}&page={data.currentPage - 1}"
							class="join-item btn"
						>
							«
						</a>
					{/if}
					<button class="join-item btn btn-active">Page {data.currentPage}</button>
					<a
						href="/notifications?filter={data.currentFilter}&page={data.currentPage + 1}"
						class="join-item btn"
					>
						»
					</a>
				</div>
			</div>
		{/if}
	{/if}
</div>
