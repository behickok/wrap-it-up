import Database from 'better-sqlite3';
import { webcrypto } from 'node:crypto';
import { describe, expect, it, beforeAll } from 'vitest';

import { GET, POST } from '../src/routes/api/user/profile/+server';
import { hashPassword } from '../src/lib/auth';

type SqliteInstance = InstanceType<typeof Database>;
type D1Like = ReturnType<typeof wrapSqliteAsD1>;

function wrapSqliteAsD1(db: SqliteInstance) {
	return {
		prepare(query: string) {
			const statement = db.prepare(query);

			const withParams = (params: any[]) => ({
				first: async () => statement.get(...params) ?? null,
				all: async () => ({ results: statement.all(...params) }),
				run: async () => {
					const result = statement.run(...params);
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
				bind: (...params: any[]) => withParams(params),
				first: async () => statement.get() ?? null,
				all: async () => ({ results: statement.all() }),
				run: async () => {
					const result = statement.run();
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

function createDatabase() {
	const sqlite = new Database(':memory:');
	sqlite.exec(`
		CREATE TABLE users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			email TEXT NOT NULL UNIQUE,
			username TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			is_active BOOLEAN DEFAULT 1,
			last_login TEXT,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			updated_at TEXT DEFAULT CURRENT_TIMESTAMP
		);
	`);

	return { sqlite, d1: wrapSqliteAsD1(sqlite) };
}

async function seedUser(db: SqliteInstance, overrides: Partial<Record<string, any>> = {}) {
	const defaults = {
		email: 'participant@example.com',
		username: 'participant',
		password_hash: await hashPassword('User123!'),
		last_login: '2024-01-01T00:00:00.000Z'
	};

	const payload = { ...defaults, ...overrides };

	const result = db
		.prepare(
			`INSERT INTO users (email, username, password_hash, last_login, created_at, updated_at)
			 VALUES (@email, @username, @password_hash, @last_login, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
		)
		.run(payload);

	return Number(result.lastInsertRowid);
}

describe('user profile API', () => {
	beforeAll(() => {
		if (!globalThis.crypto?.subtle) {
			globalThis.crypto = webcrypto as unknown as Crypto;
		}
	});

	it('returns the authenticated user profile with join and activity metadata', async () => {
		const { sqlite, d1 } = createDatabase();
		try {
			const userId = await seedUser(sqlite);

			const response = await GET({
				locals: { user: { id: userId } },
				platform: { env: { DB: d1 } }
			} as any);

			expect(response.status).toBe(200);
			const body = await response.json();

			expect(body.user.username).toBe('participant');
			expect(body.user.email).toBe('participant@example.com');
			expect(typeof body.user.created_at).toBe('string');
			expect(body.user.last_login).toBe('2024-01-01T00:00:00.000Z');
		} finally {
			sqlite.close();
		}
	});

	it('returns 404 when the session references a non-existent user', async () => {
		const { sqlite, d1 } = createDatabase();
		try {
			const response = await GET({
				locals: { user: { id: 999 } },
				platform: { env: { DB: d1 } }
			} as any);

			expect(response.status).toBe(404);
			expect(await response.json()).toEqual({ error: 'Session not found' });
		} finally {
			sqlite.close();
		}
	});

	it('updates the username and email for the authenticated user', async () => {
		const { sqlite, d1 } = createDatabase();
		try {
			const userId = await seedUser(sqlite);

			const response = await POST({
				locals: {
					user: {
						id: userId,
						email: 'participant@example.com',
						username: 'participant'
					}
				},
				platform: { env: { DB: d1 } },
				request: new Request('https://wrap-it-up.test/api/user/profile', {
					method: 'POST',
					body: JSON.stringify({
						email: 'participant+updated@example.com',
						username: 'participant_updated'
					}),
					headers: { 'content-type': 'application/json' }
				})
			} as any);

			expect(response.status).toBe(200);
			const body = await response.json();

			expect(body.success).toBe(true);
			expect(body.user.username).toBe('participant_updated');
			expect(body.user.email).toBe('participant+updated@example.com');

			const record = sqlite.prepare('SELECT username, email FROM users WHERE id = ?').get(userId);
			expect(record).toEqual({
				username: 'participant_updated',
				email: 'participant+updated@example.com'
			});
		} finally {
			sqlite.close();
		}
	});
});
