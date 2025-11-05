import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyPassword, createSession } from '$lib/auth';

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
	const db = platform?.env?.DB;

	if (!db) {
		return json({ success: false, error: 'Database not available' }, { status: 500 });
	}

	try {
		const { emailOrUsername, password } = await request.json();

		// Validate input
		if (!emailOrUsername || !password) {
			return json(
				{ success: false, error: 'Email/username and password are required' },
				{ status: 400 }
			);
		}

		// Try to find user by email or username
		const user = await db
			.prepare(
				'SELECT * FROM users WHERE (email = ? OR username = ?) AND is_active = 1'
			)
			.bind(emailOrUsername, emailOrUsername)
			.first<{
				id: number;
				email: string;
				username: string;
				password_hash: string;
				is_active: number;
				last_login: string | null;
				created_at: string;
				updated_at: string;
			}>();

		if (!user) {
			return json({ success: false, error: 'Invalid credentials' }, { status: 401 });
		}

		// Verify password
		const isPasswordValid = await verifyPassword(password, user.password_hash);

		if (!isPasswordValid) {
			return json({ success: false, error: 'Invalid credentials' }, { status: 401 });
		}

		// Update last login
		const now = new Date().toISOString();
		await db
			.prepare('UPDATE users SET last_login = ?, updated_at = ? WHERE id = ?')
			.bind(now, now, user.id)
			.run();

		// Create session
		const session = createSession(user.id);

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

		return json({
			success: true,
			user: {
				id: user.id,
				email: user.email,
				username: user.username,
				is_active: user.is_active === 1,
				last_login: now,
				created_at: user.created_at,
				updated_at: now
			}
		});
	} catch (error) {
		console.error('Login error:', error);
		return json({ success: false, error: 'Login failed' }, { status: 500 });
	}
};
