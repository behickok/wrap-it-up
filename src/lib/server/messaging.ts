/**
 * Messaging System
 * Phase 9: Direct messaging between users (mentor-client communication)
 */

import type { D1Database } from '@cloudflare/workers-types';

// ============================================================================
// Types
// ============================================================================

export interface MessageThread {
	id: number;
	section_review_id?: number;
	journey_id?: number;
	participant1_user_id: number;
	participant2_user_id: number;
	subject?: string;
	last_message_at?: string;
	last_message_preview?: string;
	is_archived: boolean;
	created_at: string;
	updated_at: string;
}

export interface Message {
	id: number;
	thread_id: number;
	sender_user_id: number;
	recipient_user_id: number;
	message_text: string;
	read: boolean;
	created_at: string;
	read_at?: string;
	edited_at?: string;
	deleted: boolean;
}

export interface MessageThreadSummary extends MessageThread {
	participant1_username: string;
	participant2_username: string;
	message_count: number;
	participant1_unread: number;
	participant2_unread: number;
}

// ============================================================================
// Thread Management
// ============================================================================

/**
 * Create or get existing message thread between two users
 */
export async function getOrCreateThread(
	db: D1Database,
	participant1Id: number,
	participant2Id: number,
	options: {
		reviewId?: number;
		journeyId?: number;
		subject?: string;
	} = {}
): Promise<number> {
	// Normalize participants (lower ID first)
	const [p1, p2] = participant1Id < participant2Id
		? [participant1Id, participant2Id]
		: [participant2Id, participant1Id];

	// Check for existing thread
	let query = `
		SELECT id FROM message_threads
		WHERE participant1_user_id = ? AND participant2_user_id = ?
	`;
	const bindings: any[] = [p1, p2];

	if (options.reviewId) {
		query += ' AND section_review_id = ?';
		bindings.push(options.reviewId);
	} else {
		query += ' AND section_review_id IS NULL';
	}

	const existing = await db.prepare(query).bind(...bindings).first<{ id: number }>();

	if (existing) {
		return existing.id;
	}

	// Create new thread
	const result = await db
		.prepare(
			`INSERT INTO message_threads (
				participant1_user_id,
				participant2_user_id,
				section_review_id,
				journey_id,
				subject
			) VALUES (?, ?, ?, ?, ?)`
		)
		.bind(p1, p2, options.reviewId ?? null, options.journeyId ?? null, options.subject ?? null)
		.run();

	return result.meta.last_row_id || 0;
}

/**
 * Get thread by ID
 */
export async function getThread(db: D1Database, threadId: number): Promise<MessageThread | null> {
	const result = await db
		.prepare('SELECT * FROM message_threads WHERE id = ?')
		.bind(threadId)
		.first<MessageThread>();

	return result || null;
}

/**
 * Get thread summary with participant info
 */
export async function getThreadSummary(
	db: D1Database,
	threadId: number
): Promise<MessageThreadSummary | null> {
	const result = await db
		.prepare('SELECT * FROM message_thread_summary WHERE id = ?')
		.bind(threadId)
		.first<MessageThreadSummary>();

	return result || null;
}

/**
 * Get all threads for a user
 */
export async function getUserThreads(
	db: D1Database,
	userId: number,
	options: {
		includeArchived?: boolean;
		limit?: number;
		offset?: number;
	} = {}
): Promise<MessageThreadSummary[]> {
	const { includeArchived = false, limit = 50, offset = 0 } = options;

	let query = `
		SELECT * FROM message_thread_summary
		WHERE (participant1_user_id = ? OR participant2_user_id = ?)
	`;
	const bindings: any[] = [userId, userId];

	if (!includeArchived) {
		query += ' AND is_archived = 0';
	}

	query += ' ORDER BY last_message_at DESC NULLS LAST, created_at DESC LIMIT ? OFFSET ?';
	bindings.push(limit, offset);

	const result = await db.prepare(query).bind(...bindings).all<MessageThreadSummary>();

	return result.results ?? [];
}

/**
 * Archive thread
 */
export async function archiveThread(
	db: D1Database,
	threadId: number,
	userId: number
): Promise<boolean> {
	// Verify user is participant
	const thread = await getThread(db, threadId);
	if (
		!thread ||
		(thread.participant1_user_id !== userId && thread.participant2_user_id !== userId)
	) {
		return false;
	}

	const result = await db
		.prepare('UPDATE message_threads SET is_archived = 1 WHERE id = ?')
		.bind(threadId)
		.run();

	return (result.meta.changes || 0) > 0;
}

/**
 * Unarchive thread
 */
export async function unarchiveThread(
	db: D1Database,
	threadId: number,
	userId: number
): Promise<boolean> {
	const thread = await getThread(db, threadId);
	if (
		!thread ||
		(thread.participant1_user_id !== userId && thread.participant2_user_id !== userId)
	) {
		return false;
	}

	const result = await db
		.prepare('UPDATE message_threads SET is_archived = 0 WHERE id = ?')
		.bind(threadId)
		.run();

	return (result.meta.changes || 0) > 0;
}

// ============================================================================
// Message Management
// ============================================================================

/**
 * Send a message
 */
export async function sendMessage(
	db: D1Database,
	options: {
		threadId: number;
		senderId: number;
		recipientId: number;
		messageText: string;
	}
): Promise<number> {
	const { threadId, senderId, recipientId, messageText } = options;

	// Verify thread exists and sender is a participant
	const thread = await getThread(db, threadId);
	if (
		!thread ||
		(thread.participant1_user_id !== senderId && thread.participant2_user_id !== senderId)
	) {
		throw new Error('Invalid thread or unauthorized');
	}

	// Create message
	const result = await db
		.prepare(
			`INSERT INTO messages (thread_id, sender_user_id, recipient_user_id, message_text)
			VALUES (?, ?, ?, ?)`
		)
		.bind(threadId, senderId, recipientId, messageText)
		.run();

	const messageId = result.meta.last_row_id || 0;

	// Create read receipt for sender (they've already "read" their own message)
	await db
		.prepare('INSERT INTO message_read_receipts (message_id, reader_user_id) VALUES (?, ?)')
		.bind(messageId, senderId)
		.run();

	return messageId;
}

/**
 * Get messages in a thread
 */
export async function getThreadMessages(
	db: D1Database,
	threadId: number,
	userId: number,
	options: {
		limit?: number;
		offset?: number;
		beforeMessageId?: number;
	} = {}
): Promise<Message[]> {
	const { limit = 50, offset = 0, beforeMessageId } = options;

	// Verify user is participant
	const thread = await getThread(db, threadId);
	if (
		!thread ||
		(thread.participant1_user_id !== userId && thread.participant2_user_id !== userId)
	) {
		return [];
	}

	let query = `
		SELECT * FROM messages
		WHERE thread_id = ? AND deleted = 0
	`;
	const bindings: any[] = [threadId];

	if (beforeMessageId) {
		query += ' AND id < ?';
		bindings.push(beforeMessageId);
	}

	query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
	bindings.push(limit, offset);

	const result = await db.prepare(query).bind(...bindings).all<Message>();

	// Return in ascending order (oldest first)
	return (result.results ?? []).reverse();
}

/**
 * Get message by ID
 */
export async function getMessage(db: D1Database, messageId: number): Promise<Message | null> {
	const result = await db
		.prepare('SELECT * FROM messages WHERE id = ? AND deleted = 0')
		.bind(messageId)
		.first<Message>();

	return result || null;
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(
	db: D1Database,
	messageId: number,
	userId: number
): Promise<boolean> {
	// Verify user is recipient
	const message = await getMessage(db, messageId);
	if (!message || message.recipient_user_id !== userId) {
		return false;
	}

	// Update message
	const result = await db
		.prepare(
			`UPDATE messages
			SET read = 1, read_at = CURRENT_TIMESTAMP
			WHERE id = ? AND recipient_user_id = ?`
		)
		.bind(messageId, userId)
		.run();

	if ((result.meta.changes || 0) > 0) {
		// Create read receipt
		await db
			.prepare(
				`INSERT OR IGNORE INTO message_read_receipts (message_id, reader_user_id)
				VALUES (?, ?)`
			)
			.bind(messageId, userId)
			.run();

		return true;
	}

	return false;
}

/**
 * Mark all messages in thread as read
 */
export async function markThreadAsRead(
	db: D1Database,
	threadId: number,
	userId: number
): Promise<number> {
	// Verify user is participant
	const thread = await getThread(db, threadId);
	if (
		!thread ||
		(thread.participant1_user_id !== userId && thread.participant2_user_id !== userId)
	) {
		return 0;
	}

	const result = await db
		.prepare(
			`UPDATE messages
			SET read = 1, read_at = CURRENT_TIMESTAMP
			WHERE thread_id = ?
				AND recipient_user_id = ?
				AND read = 0
				AND deleted = 0`
		)
		.bind(threadId, userId)
		.run();

	return result.meta.changes || 0;
}

/**
 * Edit message (soft edit - keeps history)
 */
export async function editMessage(
	db: D1Database,
	messageId: number,
	userId: number,
	newText: string
): Promise<boolean> {
	// Verify user is sender
	const message = await getMessage(db, messageId);
	if (!message || message.sender_user_id !== userId) {
		return false;
	}

	const result = await db
		.prepare(
			`UPDATE messages
			SET message_text = ?, edited_at = CURRENT_TIMESTAMP
			WHERE id = ?`
		)
		.bind(newText, messageId)
		.run();

	return (result.meta.changes || 0) > 0;
}

/**
 * Delete message (soft delete)
 */
export async function deleteMessage(
	db: D1Database,
	messageId: number,
	userId: number
): Promise<boolean> {
	// Verify user is sender
	const message = await getMessage(db, messageId);
	if (!message || message.sender_user_id !== userId) {
		return false;
	}

	const result = await db
		.prepare(
			`UPDATE messages
			SET deleted = 1, deleted_at = CURRENT_TIMESTAMP
			WHERE id = ?`
		)
		.bind(messageId)
		.run();

	return (result.meta.changes || 0) > 0;
}

// ============================================================================
// Unread Counts
// ============================================================================

/**
 * Get unread message count for user
 */
export async function getUnreadMessageCount(db: D1Database, userId: number): Promise<number> {
	const result = await db
		.prepare('SELECT unread_count FROM user_unread_messages WHERE user_id = ?')
		.bind(userId)
		.first<{ unread_count: number }>();

	return result?.unread_count || 0;
}

/**
 * Get unread count per thread for user
 */
export async function getUnreadCountsByThread(
	db: D1Database,
	userId: number
): Promise<Record<number, number>> {
	const result = await db
		.prepare(
			`SELECT thread_id, COUNT(*) as unread_count
			FROM messages
			WHERE recipient_user_id = ?
				AND read = 0
				AND deleted = 0
			GROUP BY thread_id`
		)
		.bind(userId)
		.all<{ thread_id: number; unread_count: number }>();

	const counts: Record<number, number> = {};
	for (const row of result.results || []) {
		counts[row.thread_id] = row.unread_count;
	}

	return counts;
}

// ============================================================================
// Search and Filter
// ============================================================================

/**
 * Search messages by text
 */
export async function searchMessages(
	db: D1Database,
	userId: number,
	searchQuery: string,
	options: {
		limit?: number;
		offset?: number;
	} = {}
): Promise<Message[]> {
	const { limit = 50, offset = 0 } = options;

	// Get threads where user is participant
	const result = await db
		.prepare(
			`SELECT m.* FROM messages m
			INNER JOIN message_threads mt ON m.thread_id = mt.id
			WHERE (mt.participant1_user_id = ? OR mt.participant2_user_id = ?)
				AND m.deleted = 0
				AND m.message_text LIKE ?
			ORDER BY m.created_at DESC
			LIMIT ? OFFSET ?`
		)
		.bind(userId, userId, `%${searchQuery}%`, limit, offset)
		.all<Message>();

	return result.results ?? [];
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Check if user can access thread
 */
export async function canAccessThread(
	db: D1Database,
	threadId: number,
	userId: number
): Promise<boolean> {
	const thread = await getThread(db, threadId);
	return (
		thread !== null &&
		(thread.participant1_user_id === userId || thread.participant2_user_id === userId)
	);
}

/**
 * Get other participant in thread
 */
export async function getOtherParticipant(
	db: D1Database,
	threadId: number,
	userId: number
): Promise<{ id: number; username: string; email: string } | null> {
	const thread = await getThread(db, threadId);
	if (!thread) return null;

	const otherUserId =
		thread.participant1_user_id === userId
			? thread.participant2_user_id
			: thread.participant1_user_id;

	const user = await db
		.prepare('SELECT id, username, email FROM users WHERE id = ?')
		.bind(otherUserId)
		.first<{ id: number; username: string; email: string }>();

	return user || null;
}

/**
 * Clean up old messages (older than N days) - Only if both participants deleted
 */
export async function cleanupOldMessages(db: D1Database, daysToKeep: number = 365): Promise<number> {
	// Hard delete messages that are deleted and older than retention period
	const result = await db
		.prepare(
			`DELETE FROM messages
			WHERE deleted = 1
				AND deleted_at < datetime('now', '-' || ? || ' days')`
		)
		.bind(daysToKeep)
		.run();

	return result.meta.changes || 0;
}
