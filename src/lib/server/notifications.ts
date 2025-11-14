/**
 * Notification System
 * Phase 9: In-app notification utilities and management
 */

import type { D1Database } from '@cloudflare/workers-types';

// ============================================================================
// Types
// ============================================================================

export type NotificationType =
	| 'review_claimed'
	| 'review_completed'
	| 'review_changes_requested'
	| 'review_available'
	| 'mentor_approved'
	| 'mentor_rejected'
	| 'journey_enrolled'
	| 'milestone_achieved'
	| 'new_message';

export interface Notification {
	id?: number;
	user_id: number;
	type: NotificationType;
	title: string;
	message?: string;
	link?: string;
	read?: boolean;
	created_at?: string;
	read_at?: string;
	metadata?: Record<string, any>;
}

export interface NotificationPreferences {
	user_id: number;
	in_app_reviews: boolean;
	in_app_messages: boolean;
	in_app_platform: boolean;
	in_app_milestones: boolean;
	browser_notifications: boolean;
	browser_reviews: boolean;
	browser_messages: boolean;
	group_similar: boolean;
	quiet_hours_enabled: boolean;
	quiet_hours_start?: string;
	quiet_hours_end?: string;
}

export interface CreateNotificationOptions {
	userId: number;
	type: NotificationType;
	title?: string; // Optional if using template
	message?: string; // Optional if using template
	link?: string;
	metadata?: Record<string, any>;
	priority?: number;
	useTemplate?: boolean; // Default true
}

// ============================================================================
// Notification Creation
// ============================================================================

/**
 * Create a new notification for a user
 */
export async function createNotification(
	db: D1Database,
	options: CreateNotificationOptions
): Promise<number> {
	const {
		userId,
		type,
		title,
		message,
		link,
		metadata,
		priority = 5,
		useTemplate = true
	} = options;

	// Check user preferences
	const prefs = await getUserNotificationPreferences(db, userId);
	if (!shouldSendNotification(prefs, type)) {
		console.log(`[Notifications] Skipping notification for user ${userId} (preferences)`);
		return 0;
	}

	// Check quiet hours
	if (isQuietHours(prefs)) {
		console.log(`[Notifications] Deferring notification for user ${userId} (quiet hours)`);
		// Queue for later
		await queueNotification(db, {
			userId,
			type,
			title,
			message,
			link,
			metadata,
			priority
		});
		return 0;
	}

	let finalTitle = title;
	let finalMessage = message;
	let finalLink = link;

	// Use template if requested and no title provided
	if (useTemplate && !title) {
		const template = await getNotificationTemplate(db, type);
		if (template) {
			finalTitle = replacePlaceholders(template.title_template, metadata || {});
			finalMessage = template.message_template
				? replacePlaceholders(template.message_template, metadata || {})
				: undefined;
			finalLink = template.link_template
				? replacePlaceholders(template.link_template, metadata || {})
				: link;
		}
	}

	// Create notification
	const result = await db
		.prepare(
			`INSERT INTO in_app_notifications (user_id, type, title, message, link, metadata)
			VALUES (?, ?, ?, ?, ?, ?)`
		)
		.bind(
			userId,
			type,
			finalTitle || 'Notification',
			finalMessage ?? null,
			finalLink ?? null,
			metadata ? JSON.stringify(metadata) : null
		)
		.run();

	const notificationId = result.meta.last_row_id || 0;

	// Log analytics
	await logNotificationAction(db, notificationId, userId, 'created');

	return notificationId;
}

/**
 * Create notifications for multiple users (batch)
 */
export async function createNotificationsBatch(
	db: D1Database,
	userIds: number[],
	options: Omit<CreateNotificationOptions, 'userId'>
): Promise<number[]> {
	const notificationIds: number[] = [];

	for (const userId of userIds) {
		const id = await createNotification(db, { ...options, userId });
		if (id > 0) {
			notificationIds.push(id);
		}
	}

	return notificationIds;
}

/**
 * Queue notification for later delivery (quiet hours, rate limiting)
 */
async function queueNotification(
	db: D1Database,
	options: {
		userId: number;
		type: NotificationType;
		title?: string;
		message?: string;
		link?: string;
		metadata?: Record<string, any>;
		priority?: number;
	}
): Promise<void> {
	const payload = {
		type: options.type,
		title: options.title,
		message: options.message,
		link: options.link,
		metadata: options.metadata
	};

	await db
		.prepare(
			`INSERT INTO notification_queue (user_id, notification_type, payload, priority)
			VALUES (?, ?, ?, ?)`
		)
		.bind(options.userId, options.type, JSON.stringify(payload), options.priority ?? 5)
		.run();
}

// ============================================================================
// Notification Retrieval
// ============================================================================

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
	db: D1Database,
	userId: number,
	options: {
		unreadOnly?: boolean;
		limit?: number;
		offset?: number;
		type?: NotificationType;
	} = {}
): Promise<Notification[]> {
	const { unreadOnly = false, limit = 50, offset = 0, type } = options;

	let query = `
		SELECT * FROM in_app_notifications
		WHERE user_id = ?
	`;
	const bindings: any[] = [userId];

	if (unreadOnly) {
		query += ' AND read = 0';
	}

	if (type) {
		query += ' AND type = ?';
		bindings.push(type);
	}

	query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
	bindings.push(limit, offset);

	const result = await db.prepare(query).bind(...bindings).all();

	return (result.results || []).map((n: any) => ({
		...n,
		metadata: n.metadata ? JSON.parse(n.metadata) : undefined
	}));
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(db: D1Database, userId: number): Promise<number> {
	const result = await db
		.prepare('SELECT unread_count FROM user_unread_notifications WHERE user_id = ?')
		.bind(userId)
		.first<{ unread_count: number }>();

	return result?.unread_count || 0;
}

/**
 * Get notification by ID
 */
export async function getNotification(
	db: D1Database,
	notificationId: number
): Promise<Notification | null> {
	const result = await db
		.prepare('SELECT * FROM in_app_notifications WHERE id = ?')
		.bind(notificationId)
		.first<any>();

	if (!result) return null;

	return {
		...result,
		metadata: result.metadata ? JSON.parse(result.metadata) : undefined
	};
}

// ============================================================================
// Notification Actions
// ============================================================================

/**
 * Mark notification as read
 */
export async function markAsRead(
	db: D1Database,
	notificationId: number,
	userId: number
): Promise<boolean> {
	const result = await db
		.prepare(
			`UPDATE in_app_notifications
			SET read = 1, read_at = CURRENT_TIMESTAMP
			WHERE id = ? AND user_id = ?`
		)
		.bind(notificationId, userId)
		.run();

	if (result.meta.changes && result.meta.changes > 0) {
		await logNotificationAction(db, notificationId, userId, 'read');
		return true;
	}

	return false;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(db: D1Database, userId: number): Promise<number> {
	const result = await db
		.prepare(
			`UPDATE in_app_notifications
			SET read = 1, read_at = CURRENT_TIMESTAMP
			WHERE user_id = ? AND read = 0`
		)
		.bind(userId)
		.run();

	return result.meta.changes || 0;
}

/**
 * Delete notification
 */
export async function deleteNotification(
	db: D1Database,
	notificationId: number,
	userId: number
): Promise<boolean> {
	const result = await db
		.prepare('DELETE FROM in_app_notifications WHERE id = ? AND user_id = ?')
		.bind(notificationId, userId)
		.run();

	if (result.meta.changes && result.meta.changes > 0) {
		await logNotificationAction(db, notificationId, userId, 'dismissed');
		return true;
	}

	return false;
}

/**
 * Delete all read notifications for a user
 */
export async function deleteReadNotifications(db: D1Database, userId: number): Promise<number> {
	const result = await db
		.prepare('DELETE FROM in_app_notifications WHERE user_id = ? AND read = 1')
		.bind(userId)
		.run();

	return result.meta.changes || 0;
}

// ============================================================================
// Notification Preferences
// ============================================================================

/**
 * Get user notification preferences
 */
export async function getUserNotificationPreferences(
	db: D1Database,
	userId: number
): Promise<NotificationPreferences> {
	const result = await db
		.prepare('SELECT * FROM notification_preferences WHERE user_id = ?')
		.bind(userId)
		.first<NotificationPreferences>();

	// Return defaults if not found
	if (!result) {
		return {
			user_id: userId,
			in_app_reviews: true,
			in_app_messages: true,
			in_app_platform: true,
			in_app_milestones: true,
			browser_notifications: false,
			browser_reviews: false,
			browser_messages: false,
			group_similar: true,
			quiet_hours_enabled: false
		};
	}

	return result;
}

/**
 * Update user notification preferences
 */
export async function updateNotificationPreferences(
	db: D1Database,
	userId: number,
	preferences: Partial<NotificationPreferences>
): Promise<void> {
	const fields = Object.keys(preferences).filter((k) => k !== 'user_id');
	const setClause = fields.map((f) => `${f} = ?`).join(', ');
	const values = fields.map((f) => preferences[f as keyof NotificationPreferences]);

	await db
		.prepare(
			`INSERT INTO notification_preferences (user_id)
			VALUES (?)
			ON CONFLICT(user_id) DO UPDATE SET ${setClause}`
		)
		.bind(userId, ...values)
		.run();
}

// ============================================================================
// Notification Templates
// ============================================================================

/**
 * Get notification template by type
 */
async function getNotificationTemplate(
	db: D1Database,
	type: NotificationType
): Promise<any | null> {
	const result = await db
		.prepare('SELECT * FROM notification_templates WHERE type = ? AND is_active = 1')
		.bind(type)
		.first();

	return result || null;
}

/**
 * Replace placeholders in template string
 */
function replacePlaceholders(template: string, data: Record<string, any>): string {
	return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
		return data[key] !== undefined ? String(data[key]) : match;
	});
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if notification should be sent based on preferences
 */
function shouldSendNotification(
	prefs: NotificationPreferences,
	type: NotificationType
): boolean {
	// Map notification types to preference flags
	const typeToPreference: Record<NotificationType, keyof NotificationPreferences> = {
		review_claimed: 'in_app_reviews',
		review_completed: 'in_app_reviews',
		review_changes_requested: 'in_app_reviews',
		review_available: 'in_app_reviews',
		mentor_approved: 'in_app_platform',
		mentor_rejected: 'in_app_platform',
		journey_enrolled: 'in_app_platform',
		milestone_achieved: 'in_app_milestones',
		new_message: 'in_app_messages'
	};

	const prefKey = typeToPreference[type];
	return prefKey ? Boolean(prefs[prefKey]) : true;
}

/**
 * Check if currently in quiet hours
 */
function isQuietHours(prefs: NotificationPreferences): boolean {
	if (!prefs.quiet_hours_enabled || !prefs.quiet_hours_start || !prefs.quiet_hours_end) {
		return false;
	}

	const now = new Date();
	const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

	// Simple time comparison (assumes same day)
	return currentTime >= prefs.quiet_hours_start && currentTime <= prefs.quiet_hours_end;
}

/**
 * Log notification action for analytics
 */
async function logNotificationAction(
	db: D1Database,
	notificationId: number,
	userId: number,
	action: 'created' | 'read' | 'clicked' | 'dismissed'
): Promise<void> {
	await db
		.prepare(
			`INSERT INTO notification_analytics (notification_id, user_id, action)
			VALUES (?, ?, ?)`
		)
		.bind(notificationId, userId, action)
		.run();
}

/**
 * Log notification click (called from client)
 */
export async function logNotificationClick(
	db: D1Database,
	notificationId: number,
	userId: number
): Promise<void> {
	// Mark as read and log click
	await markAsRead(db, notificationId, userId);
	await logNotificationAction(db, notificationId, userId, 'clicked');
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Process notification queue (for cron job)
 */
export async function processNotificationQueue(db: D1Database, limit: number = 100): Promise<number> {
	// Get pending notifications
	const pending = await db
		.prepare(
			`SELECT * FROM notification_queue
			WHERE status = 'pending'
				AND scheduled_at <= CURRENT_TIMESTAMP
			ORDER BY priority ASC, scheduled_at ASC
			LIMIT ?`
		)
		.bind(limit)
		.all();

	let processed = 0;

	for (const item of pending.results || []) {
		try {
			const payload = JSON.parse((item as any).payload);

			await createNotification(db, {
				userId: (item as any).user_id,
				type: payload.type,
				title: payload.title,
				message: payload.message,
				link: payload.link,
				metadata: payload.metadata,
				useTemplate: !payload.title // Use template if no title provided
			});

			// Mark as sent
			await db
				.prepare(
					`UPDATE notification_queue
					SET status = 'sent', sent_at = CURRENT_TIMESTAMP
					WHERE id = ?`
				)
				.bind((item as any).id)
				.run();

			processed++;
		} catch (error) {
			// Mark as failed
			await db
				.prepare(
					`UPDATE notification_queue
					SET status = 'failed', error_message = ?
					WHERE id = ?`
				)
				.bind(error instanceof Error ? error.message : 'Unknown error', (item as any).id)
				.run();
		}
	}

	return processed;
}

/**
 * Clean up old notifications (older than N days)
 */
export async function cleanupOldNotifications(db: D1Database, daysToKeep: number = 90): Promise<number> {
	const result = await db
		.prepare(
			`DELETE FROM in_app_notifications
			WHERE created_at < datetime('now', '-' || ? || ' days')
				AND read = 1`
		)
		.bind(daysToKeep)
		.run();

	return result.meta.changes || 0;
}
