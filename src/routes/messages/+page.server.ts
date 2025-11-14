/**
 * Messages Inbox
 * Phase 9: List all message threads for user
 */

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUserThreads, getUnreadMessageCount } from '$lib/server/messaging';

export const load: PageServerLoad = async ({ locals, platform, url }) => {
	// Require authentication
	if (!locals.user) {
		throw redirect(302, '/auth/login');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw new Error('Database not available');
	}

	const includeArchived = url.searchParams.get('archived') === 'true';
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 50;
	const offset = (page - 1) * limit;

	// Get threads
	const threads = await getUserThreads(db, locals.user.id, {
		includeArchived,
		limit,
		offset
	});

	// Get unread message count
	const unreadCount = await getUnreadMessageCount(db, locals.user.id);

	// For each thread, determine who the "other" participant is
	const threadsWithOther = threads.map((thread) => {
		const isParticipant1 = thread.participant1_user_id === locals.user!.id;
		return {
			...thread,
			otherUserId: isParticipant1 ? thread.participant2_user_id : thread.participant1_user_id,
			otherUsername: isParticipant1 ? thread.participant2_username : thread.participant1_username,
			myUnreadCount: isParticipant1 ? thread.participant1_unread : thread.participant2_unread
		};
	});

	return {
		threads: threadsWithOther,
		unreadCount,
		includeArchived,
		currentPage: page
	};
};
