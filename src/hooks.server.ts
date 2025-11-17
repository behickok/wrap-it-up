import type { Handle } from '@sveltejs/kit';
import { getSession, getUserById, isSessionValid, cleanupExpiredSessions } from '$lib/auth';

/**
 * SvelteKit hook that runs on every request
 * Handles session authentication and populates event.locals
 */
export const handle: Handle = async ({ event, resolve }) => {
	const db = event.platform?.env?.DB;

	// Initialize locals
	event.locals.user = null;
	event.locals.sessionId = null;

	if (!db) {
		console.error('Database not available in platform.env');
		return resolve(event);
	}

	// Get session ID from cookie
	const sessionId = event.cookies.get('session_id');

	if (sessionId) {
		try {
			// Get session from database
			const session = await getSession(db, sessionId);

			if (session && isSessionValid(session)) {
				// Session is valid, get user
				const user = await getUserById(db, session.user_id);

				if (user) {
					event.locals.user = user;
					event.locals.sessionId = sessionId;
				} else {
					// User not found or inactive, clear cookie
					event.cookies.delete('session_id', { path: '/' });
				}
			} else {
				// Session invalid or expired, clear cookie
				event.cookies.delete('session_id', { path: '/' });
			}
		} catch (error) {
			console.error('Session validation error:', error);
			event.cookies.delete('session_id', { path: '/' });
		}
	}

	// Cleanup expired sessions periodically (10% chance per request)
	if (Math.random() < 0.1) {
		event.platform?.context?.waitUntil(cleanupExpiredSessions(db));
	}

	return resolve(event);
};
