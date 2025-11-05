import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteSession } from '$lib/auth';

export const POST: RequestHandler = async ({ platform, cookies, locals }) => {
	const db = platform?.env?.DB;

	if (!db) {
		return json({ success: false, error: 'Database not available' }, { status: 500 });
	}

	try {
		const sessionId = locals.sessionId;

		if (sessionId) {
			// Delete session from database
			await deleteSession(db, sessionId);
		}

		// Clear session cookie
		cookies.delete('session_id', { path: '/' });

		return json({ success: true });
	} catch (error) {
		console.error('Logout error:', error);
		return json({ success: false, error: 'Logout failed' }, { status: 500 });
	}
};
