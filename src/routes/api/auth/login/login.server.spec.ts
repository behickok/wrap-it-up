import { describe, expect, it, beforeAll } from 'vitest';

import { POST } from './+server';
import { hashPassword } from '$lib/auth';

type MockStatement = {
	first?: () => Promise<any>;
	run?: () => Promise<void>;
};

type StatementFactory = () => MockStatement;

function createDb(factories: Record<string, StatementFactory>) {
	return {
		prepare: (query: string) => {
			const key = Object.keys(factories).find((matcher) => query.includes(matcher));
			const factory = key ? factories[key] : () => ({
				first: async () => null,
				run: async () => undefined
			});

			return {
				bind: () => {
					const statement = factory();
					return {
						first: statement.first ?? (async () => null),
						run: statement.run ?? (async () => undefined)
					};
				}
			};
		}
	};
}

const mockCookies = () => {
	const values: Record<string, any> = {};
	return {
		set: (name: string, value: string, options: any) => {
			values[name] = { value, options };
		},
		getAll: () => values
	};
};

describe('POST /api/auth/login', () => {
	let passwordHash: string;

	beforeAll(async () => {
		passwordHash = await hashPassword('Secret123!');
	});

	it('fails when the database binding is unavailable', async () => {
		const response = await POST({
			request: new Request('http://localhost', {
				method: 'POST',
				body: JSON.stringify({ emailOrUsername: 'casey', password: 'Secret123!' })
			}),
			platform: { env: {} },
			cookies: mockCookies()
		} as any);

		expect(response.status).toBe(500);
		const body = await response.json();
		expect(body.error).toBe('Database not available');
	});

	it('returns 401 when the user is not found or password is invalid', async () => {
		const db = createDb({
			users: () => ({
				first: async () => null
			})
		});

		const response = await POST({
			request: new Request('http://localhost', {
				method: 'POST',
				body: JSON.stringify({ emailOrUsername: 'missing', password: 'bad' })
			}),
			platform: { env: { DB: db } },
			cookies: mockCookies()
		} as any);

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ success: false, error: 'Invalid credentials' });
	});

	it('creates a session and sets the cookie for valid credentials', async () => {
		const cookies = mockCookies();
		const userRecord = {
			id: 1,
			email: 'casey@example.com',
			username: 'casey',
			password_hash: passwordHash,
			is_active: 1,
			last_login: null,
			created_at: '2024-01-01T00:00:00.000Z',
			updated_at: '2024-01-01T00:00:00.000Z'
		};

		const db = createDb({
			users: () => ({
				first: async () => userRecord
			}),
			'UPDATE users': () => ({
				run: async () => undefined
			}),
			'INSERT INTO sessions': () => ({
				run: async () => undefined
			})
		});

		const response = await POST({
			request: new Request('http://localhost', {
				method: 'POST',
				body: JSON.stringify({ emailOrUsername: 'casey', password: 'Secret123!' })
			}),
			platform: { env: { DB: db } },
			cookies
		} as any);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.success).toBe(true);
		expect(body.user.username).toBe('casey');
		expect(cookies.getAll().session_id.value).toBeDefined();
	});
});
