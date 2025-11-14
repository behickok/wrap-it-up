/**
 * Notifications Center
 * Phase 9: View and manage user notifications
 */

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	getUserNotifications,
	getUnreadCount,
	markAsRead,
	markAllAsRead,
	deleteNotification,
	deleteReadNotifications,
	logNotificationClick
} from '$lib/server/notifications';

export const load: PageServerLoad = async ({ locals, platform, url }) => {
	// Require authentication
	if (!locals.user) {
		throw redirect(302, '/auth/login');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw new Error('Database not available');
	}

	// Get filter from query params
	const filter = url.searchParams.get('filter') || 'all'; // 'all', 'unread', or specific type
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 50;
	const offset = (page - 1) * limit;

	// Get notifications based on filter
	const notifications = await getUserNotifications(db, locals.user.id, {
		unreadOnly: filter === 'unread',
		type: filter !== 'all' && filter !== 'unread' ? (filter as any) : undefined,
		limit,
		offset
	});

	// Get unread count
	const unreadCount = await getUnreadCount(db, locals.user.id);

	// Get count by type for filter badges
	const typeCounts = await db
		.prepare(
			`SELECT type, COUNT(*) as count
			FROM in_app_notifications
			WHERE user_id = ? AND read = 0
			GROUP BY type`
		)
		.bind(locals.user.id)
		.all();

	const countsByType: Record<string, number> = {};
	for (const row of typeCounts.results || []) {
		const r = row as any;
		countsByType[r.type] = r.count;
	}

	return {
		notifications,
		unreadCount,
		countsByType,
		currentFilter: filter,
		currentPage: page
	};
};

export const actions: Actions = {
	// Mark notification as read
	markRead: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return { success: false, error: 'Not authenticated' };
		}

		const db = platform?.env?.DB;
		if (!db) {
			return { success: false, error: 'Database not available' };
		}

		const formData = await request.formData();
		const notificationId = parseInt(formData.get('notificationId') as string);

		const success = await markAsRead(db, notificationId, locals.user.id);

		return { success };
	},

	// Mark all as read
	markAllRead: async ({ locals, platform }) => {
		if (!locals.user) {
			return { success: false, error: 'Not authenticated' };
		}

		const db = platform?.env?.DB;
		if (!db) {
			return { success: false, error: 'Database not available' };
		}

		const count = await markAllAsRead(db, locals.user.id);

		return { success: true, count };
	},

	// Delete notification
	delete: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return { success: false, error: 'Not authenticated' };
		}

		const db = platform?.env?.DB;
		if (!db) {
			return { success: false, error: 'Database not available' };
		}

		const formData = await request.formData();
		const notificationId = parseInt(formData.get('notificationId') as string);

		const success = await deleteNotification(db, notificationId, locals.user.id);

		return { success };
	},

	// Delete all read notifications
	deleteRead: async ({ locals, platform }) => {
		if (!locals.user) {
			return { success: false, error: 'Not authenticated' };
		}

		const db = platform?.env?.DB;
		if (!db) {
			return { success: false, error: 'Database not available' };
		}

		const count = await deleteReadNotifications(db, locals.user.id);

		return { success: true, count };
	},

	// Log notification click (for analytics)
	click: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return { success: false };
		}

		const db = platform?.env?.DB;
		if (!db) {
			return { success: false };
		}

		const formData = await request.formData();
		const notificationId = parseInt(formData.get('notificationId') as string);

		await logNotificationClick(db, notificationId, locals.user.id);

		return { success: true };
	}
};
