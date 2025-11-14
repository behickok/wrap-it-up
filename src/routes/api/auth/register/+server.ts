import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	hashPassword,
	isValidEmail,
	isValidPassword,
	isValidUsername,
	getUserByEmail,
	getUserByUsername,
	createSession
} from '$lib/auth';
import { AnalyticsEvents } from '$lib/server/analytics';

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
	const db = platform?.env?.DB;

	if (!db) {
		return json({ success: false, error: 'Database not available' }, { status: 500 });
	}

	try {
		const { email, username, password } = await request.json();

		// Validate input
		if (!email || !username || !password) {
			return json(
				{ success: false, error: 'Email, username, and password are required' },
				{ status: 400 }
			);
		}

		// Validate email format
		if (!isValidEmail(email)) {
			return json({ success: false, error: 'Invalid email format' }, { status: 400 });
		}

		// Validate username format
		if (!isValidUsername(username)) {
			return json(
				{
					success: false,
					error: 'Username must be 3-20 characters, alphanumeric and underscores only'
				},
				{ status: 400 }
			);
		}

		// Validate password strength
		if (!isValidPassword(password)) {
			return json(
				{
					success: false,
					error:
						'Password must be at least 8 characters with uppercase, lowercase, and number'
				},
				{ status: 400 }
			);
		}

		// Check if email already exists
		const existingEmailUser = await getUserByEmail(db, email);
		if (existingEmailUser) {
			return json({ success: false, error: 'Email already registered' }, { status: 409 });
		}

		// Check if username already exists
		const existingUsernameUser = await getUserByUsername(db, username);
		if (existingUsernameUser) {
			return json({ success: false, error: 'Username already taken' }, { status: 409 });
		}

		// Hash password
		const passwordHash = await hashPassword(password);

		// Create user
		const now = new Date().toISOString();
		const result = await db
			.prepare(
				'INSERT INTO users (email, username, password_hash, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)'
			)
			.bind(email, username, passwordHash, now, now)
			.run();

		if (!result.success) {
			return json({ success: false, error: 'Failed to create user' }, { status: 500 });
		}

		// Get the created user's ID
		const userId = result.meta.last_row_id;

		// Create session
		const session = createSession(userId);

		// Save session to database
		await db
			.prepare('INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
			.bind(session.id, session.user_id, session.expires_at, session.created_at)
			.run();

		// Set session cookie (7 days)
		cookies.set('session_id', session.id, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7 // 7 days
		});

		// Track registration event
		await AnalyticsEvents.register(db, {
			userId: userId
		}).catch((err) => console.error('Failed to track registration:', err));

		return json({
			success: true,
			user: {
				id: userId,
				email,
				username,
				is_active: true,
				last_login: null,
				created_at: now,
				updated_at: now
			}
		});
	} catch (error) {
		console.error('Registration error:', error);
		return json({ success: false, error: 'Registration failed' }, { status: 500 });
	}
};
