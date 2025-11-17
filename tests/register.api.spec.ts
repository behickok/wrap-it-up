import Database from 'better-sqlite3';
import { webcrypto } from 'node:crypto';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { verifyPassword } from '../src/lib/auth';
import { AnalyticsEvents } from '../src/lib/server/analytics';
import { POST as registerHandler } from '../src/routes/api/auth/register/+server';

type SqliteInstance = InstanceType<typeof Database>;
type D1Like = ReturnType<typeof wrapSqliteAsD1>;

const REGISTER_URL = 'https://wrap-it-up.test/api/auth/register';

beforeAll(() => {
	if (!globalThis.crypto?.subtle) {
		globalThis.crypto = webcrypto as unknown as Crypto;
	}
});

beforeEach(() => {
	vi.spyOn(AnalyticsEvents, 'register').mockResolvedValue();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('registration API', () => {
	it('registers a user with hashed password, active flag, session, and notification preferences', async () => {
		const { sqlite, d1 } = createDatabase();

		try {
			const payload = {
				email: 'casey@example.com',
				username: 'casey_creator',
				password: 'StrongPass123'
			};

			const result = await callRegister(d1, payload);

			expect(result.response.status).toBe(200);
			expect(result.body.success).toBe(true);
			expect(result.cookies.set).toHaveBeenCalledWith(
				'session_id',
				expect.any(String),
				expect.objectContaining({ maxAge: 60 * 60 * 24 * 7 })
			);

			const user = sqlite.prepare('SELECT * FROM users').get();
			expect(user.email).toBe(payload.email);
			expect(user.username).toBe(payload.username);
			expect(user.is_active).toBe(1);
			expect(user.password_hash).not.toBe(payload.password);
			expect(await verifyPassword(payload.password, user.password_hash)).toBe(true);

			const session = sqlite.prepare('SELECT * FROM sessions WHERE user_id = ?').get(user.id);
			expect(session).toBeTruthy();

			const prefs = sqlite
				.prepare('SELECT * FROM notification_preferences WHERE user_id = ?')
				.get(user.id);
			expect(prefs).toBeTruthy();
			expect(prefs.in_app_messages).toBe(1);
			expect(prefs.email_reviews).toBe(1);
		} finally {
			sqlite.close();
		}
	});

	it('rejects invalid email formats', async () => {
		const { sqlite, d1 } = createDatabase();

		try {
			const result = await callRegister(d1, {
				email: 'invalid-email',
				username: 'casey',
				password: 'StrongPass123'
			});

			expect(result.response.status).toBe(400);
			expect(result.body.error).toContain('Invalid email');
			expect(sqlite.prepare('SELECT COUNT(*) as count FROM users').get().count).toBe(0);
		} finally {
			sqlite.close();
		}
	});

	it('rejects usernames that do not meet formatting rules', async () => {
		const { sqlite, d1 } = createDatabase();

		try {
			const result = await callRegister(d1, {
				email: 'casey@example.com',
				username: 'bad name!',
				password: 'StrongPass123'
			});

			expect(result.response.status).toBe(400);
			expect(result.body.error).toContain('Username must be 3-20 characters');
		} finally {
			sqlite.close();
		}
	});

	it('rejects passwords that do not meet strength requirements', async () => {
		const { sqlite, d1 } = createDatabase();

		try {
			const result = await callRegister(d1, {
				email: 'casey@example.com',
				username: 'casey',
				password: 'weak'
			});

			expect(result.response.status).toBe(400);
			expect(result.body.error).toContain('Password must be at least 8 characters');
		} finally {
			sqlite.close();
		}
	});

	it('prevents duplicate emails', async () => {
		const { sqlite, d1 } = createDatabase();

		try {
			await callRegister(d1, {
				email: 'casey@example.com',
				username: 'casey',
				password: 'StrongPass123'
			});

			const second = await callRegister(d1, {
				email: 'casey@example.com',
				username: 'jordan',
				password: 'StrongPass123'
			});

			expect(second.response.status).toBe(409);
			expect(second.body.error).toContain('Email already registered');
		} finally {
			sqlite.close();
		}
	});

	it('prevents duplicate usernames', async () => {
		const { sqlite, d1 } = createDatabase();

		try {
			await callRegister(d1, {
				email: 'casey@example.com',
				username: 'casey',
				password: 'StrongPass123'
			});

			const second = await callRegister(d1, {
				email: 'jordan@example.com',
				username: 'casey',
				password: 'StrongPass123'
			});

			expect(second.response.status).toBe(409);
			expect(second.body.error).toContain('Username already taken');
		} finally {
			sqlite.close();
		}
	});
});

async function callRegister(
	db: D1Like,
	payload: { email: string; username: string; password: string }
) {
	const cookies = createCookieJar();
	const response = await registerHandler({
		request: new Request(REGISTER_URL, {
			method: 'POST',
			body: JSON.stringify(payload),
			headers: { 'content-type': 'application/json' }
		}),
		platform: { env: { DB: db } },
		cookies
	} as any);

	const body = await response.json();
	return { response, body, cookies };
}

function createCookieJar() {
	return {
		set: vi.fn()
	};
}

function createDatabase() {
	const sqlite = new Database(':memory:');

	sqlite.exec(`
		CREATE TABLE users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			email TEXT NOT NULL UNIQUE,
			username TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			is_active BOOLEAN DEFAULT 0,
			created_at TEXT,
			updated_at TEXT
		);

		CREATE TABLE sessions (
			id TEXT PRIMARY KEY,
			user_id INTEGER NOT NULL,
			expires_at TEXT NOT NULL,
			created_at TEXT NOT NULL
		);

		CREATE TABLE notification_preferences (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			in_app_reviews BOOLEAN DEFAULT 1,
			in_app_messages BOOLEAN DEFAULT 1,
			browser_notifications BOOLEAN DEFAULT 0,
			quiet_hours_enabled BOOLEAN DEFAULT 0,
			quiet_hours_start TEXT DEFAULT '22:00',
			quiet_hours_end TEXT DEFAULT '07:00',
			email_reviews BOOLEAN DEFAULT 1,
			email_sessions BOOLEAN DEFAULT 1,
			email_platform BOOLEAN DEFAULT 1,
			email_marketing BOOLEAN DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TRIGGER init_notification_prefs
		AFTER INSERT ON users
		FOR EACH ROW
		BEGIN
			INSERT INTO notification_preferences (user_id) VALUES (NEW.id);
		END;
	`);

	return { sqlite, d1: wrapSqliteAsD1(sqlite) };
}

function wrapSqliteAsD1(db: SqliteInstance) {
	return {
		prepare(statement: string) {
			const prepared = db.prepare(statement);

			const runWith = (params: any[]) => ({
				first: async () => prepared.get(...params) ?? null,
				all: async () => ({ results: prepared.all(...params) }),
				run: async () => {
					const result = prepared.run(...params);
					return {
						success: true,
						meta: {
							last_row_id: Number(result.lastInsertRowid ?? 0),
							changes: result.changes ?? 0
						}
					};
				}
			});

			return {
				bind: (...params: any[]) => runWith(params),
				first: async () => prepared.get() ?? null,
				all: async () => ({ results: prepared.all() }),
				run: async () => {
					const result = prepared.run();
					return {
						success: true,
						meta: {
							last_row_id: Number(result.lastInsertRowid ?? 0),
							changes: result.changes ?? 0
						}
					};
				}
			};
		}
	};
}
