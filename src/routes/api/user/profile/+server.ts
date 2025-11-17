import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserById, isValidEmail, isValidUsername } from '$lib/auth';

export const GET: RequestHandler = async ({ locals, platform }) => {
	const currentUser = locals.user;
	const db = platform?.env?.DB;

	if (!currentUser) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (!db) {
		return json({ error: 'Database not available' }, { status: 500 });
	}

	const record = await getUserById(db, currentUser.id);

	if (!record) {
		return json({ error: 'Session not found' }, { status: 404 });
	}

	return json({
		user: {
			id: record.id,
			username: record.username,
			email: record.email,
			created_at: record.created_at,
			updated_at: record.updated_at,
			last_login: record.last_login
		}
	});
};

type UpdatePayload = {
	username?: string;
	email?: string;
};

export const POST: RequestHandler = async ({ locals, platform, request }) => {
	const db = platform?.env?.DB;
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (!db) {
		return json({ error: 'Database not available' }, { status: 500 });
	}

	const payload = (await request.json()) as UpdatePayload;
	const fieldsToUpdate: UpdatePayload = {};

	if (typeof payload.username === 'string' && payload.username.trim() !== user.username) {
		const nextUsername = payload.username.trim();
		if (!isValidUsername(nextUsername)) {
			return json(
				{ error: 'Username must be 3-20 characters and can only contain letters, numbers, or underscores' },
				{ status: 400 }
			);
		}
		fieldsToUpdate.username = nextUsername;
	}

	if (typeof payload.email === 'string' && payload.email.trim().toLowerCase() !== user.email.toLowerCase()) {
		const nextEmail = payload.email.trim();
		if (!isValidEmail(nextEmail)) {
			return json({ error: 'Invalid email format' }, { status: 400 });
		}
		fieldsToUpdate.email = nextEmail;
	}

	if (!fieldsToUpdate.username && !fieldsToUpdate.email) {
		return json({ error: 'No changes submitted' }, { status: 400 });
	}

	const existing = await getUserById(db, user.id);

	if (!existing) {
		return json({ error: 'User not found' }, { status: 404 });
	}

	if (fieldsToUpdate.email) {
		const duplicateEmail = await db
			.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?')
			.bind(fieldsToUpdate.email, user.id)
			.first();

		if (duplicateEmail) {
			return json({ error: 'Email already in use' }, { status: 409 });
		}
	}

	if (fieldsToUpdate.username) {
		const duplicateUsername = await db
			.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != ?')
			.bind(fieldsToUpdate.username, user.id)
			.first();

		if (duplicateUsername) {
			return json({ error: 'Username already taken' }, { status: 409 });
		}
	}

	const now = new Date().toISOString();
	const nextEmail = fieldsToUpdate.email ?? existing.email;
	const nextUsername = fieldsToUpdate.username ?? existing.username;

	await db
		.prepare('UPDATE users SET email = ?, username = ?, updated_at = ? WHERE id = ?')
		.bind(nextEmail, nextUsername, now, user.id)
		.run();

	const updatedUser = {
		...existing,
		email: nextEmail,
		username: nextUsername,
		updated_at: now
	};

	locals.user = updatedUser as any;

	return json({
		success: true,
		user: {
			id: updatedUser.id,
			username: updatedUser.username,
			email: updatedUser.email,
			last_login: updatedUser.last_login,
			created_at: updatedUser.created_at,
			updated_at: updatedUser.updated_at
		}
	});
};
