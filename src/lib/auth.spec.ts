import { webcrypto } from 'node:crypto';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
	createSession,
	generateSessionId,
	getUserByEmail,
	getUserById,
	getUserByUsername,
	hashPassword,
	isSessionValid,
	isValidEmail,
	isValidPassword,
	isValidUsername,
	verifyPassword,
	cleanupExpiredSessions
} from './auth';

type MockDb = ReturnType<typeof createDb>;

function createDb(result: any) {
	return {
		prepare: vi.fn(() => ({
			bind: vi.fn(() => ({
				first: vi.fn(async () => result)
			}))
		}))
	};
}

beforeAll(() => {
	if (!globalThis.crypto?.subtle) {
		globalThis.crypto = webcrypto as unknown as Crypto;
	}

	if (!globalThis.atob) {
		globalThis.atob = (data: string) => Buffer.from(data, 'base64').toString('binary');
	}

	if (!globalThis.btoa) {
		globalThis.btoa = (data: string) => Buffer.from(data, 'binary').toString('base64');
	}
});

describe('password hashing', () => {
	it('hashes and verifies passwords using PBKDF2', async () => {
		const hash = await hashPassword('Secret123!');

		expect(hash).toContain(':');
		expect(await verifyPassword('Secret123!', hash)).toBe(true);
		expect(await verifyPassword('WrongPass', hash)).toBe(false);
	});

	it('fails gracefully when the stored hash is malformed', async () => {
		await expect(verifyPassword('anything', 'bad-format')).resolves.toBe(false);
	});
});

describe('session helpers', () => {
	it('generates URL-safe session IDs', () => {
		const spy = vi
			.spyOn(globalThis.crypto, 'getRandomValues')
			.mockImplementation(<T extends ArrayBufferView>(array: T) => {
				const view = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
				view.set(Uint8Array.from({ length: view.length }, (_, index) => index));
				return array;
			});

		const id = generateSessionId();

		expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
		expect(id).not.toContain('+');
		expect(id).not.toContain('/');

		spy.mockRestore();
	});

	it('creates sessions that expire after the requested window', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
		const sessionSpy = vi
			.spyOn(globalThis.crypto, 'getRandomValues')
			.mockImplementation(<T extends ArrayBufferView>(array: T) => {
				const view = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
				view.set(new TextEncoder().encode('wrap-it-up'.repeat(4).slice(0, view.length)));
				return array;
			});

		const session = createSession(42, 3);

		expect(session.user_id).toBe(42);
		expect(session.created_at).toBe('2024-01-01T00:00:00.000Z');
		expect(session.expires_at).toBe('2024-01-04T00:00:00.000Z');
		expect(typeof session.id).toBe('string');

		sessionSpy.mockRestore();
		vi.useRealTimers();
	});

	it('detects expired sessions', () => {
		const futureSession = {
			id: 'future',
			user_id: 1,
			created_at: new Date().toISOString(),
			expires_at: new Date(Date.now() + 60_000).toISOString()
		};

		const pastSession = {
			...futureSession,
			id: 'past',
			expires_at: new Date(Date.now() - 60_000).toISOString()
		};

		expect(isSessionValid(futureSession)).toBe(true);
		expect(isSessionValid(pastSession)).toBe(false);
	});

	it('cleans up expired sessions in the database', async () => {
		const executions: { sql: string; params: any[] }[] = [];

		const db = {
			prepare: (sql: string) => ({
				bind: (...params: any[]) => ({
					run: vi.fn(async () => {
						executions.push({ sql, params });
					})
				})
			})
		};

		await cleanupExpiredSessions(db as any);

		expect(executions).toHaveLength(1);
		expect(executions[0].sql).toContain('DELETE FROM sessions');
		expect(Number.isNaN(new Date(executions[0].params[0]).valueOf())).toBe(false);
	});
});

describe('input validation', () => {
	it('validates email addresses', () => {
		expect(isValidEmail('casey@example.com')).toBe(true);
		expect(isValidEmail('bad-email')).toBe(false);
	});

	it('validates password strength rules', () => {
		expect(isValidPassword('Strong123')).toBe(true);
		expect(isValidPassword('short')).toBe(false);
		expect(isValidPassword('nocaps123')).toBe(false);
		expect(isValidPassword('NOLOWER123')).toBe(false);
		expect(isValidPassword('NoDigits!!')).toBe(false);
	});

	it('validates username format', () => {
		expect(isValidUsername('wrap_it_up')).toBe(true);
		expect(isValidUsername('no')).toBe(false);
		expect(isValidUsername('bad-chars!')).toBe(false);
	});
});

describe('database lookups', () => {
	it('returns the user by email and falls back to null', async () => {
		const dbWithUser: MockDb = createDb({ id: 1, email: 'casey@example.com' });
		const dbWithoutUser: MockDb = createDb(null);

		await expect(getUserByEmail(dbWithUser as any, 'casey@example.com')).resolves.toEqual({
			id: 1,
			email: 'casey@example.com'
		});
		await expect(getUserByEmail(dbWithoutUser as any, 'missing@example.com')).resolves.toBeNull();
		expect(dbWithUser.prepare).toHaveBeenCalledWith(expect.stringContaining('FROM users WHERE email = ?'));
	});

	it('returns the user by username and by id', async () => {
		const db: MockDb = createDb({ id: 2, username: 'casey' });

		await expect(getUserByUsername(db as any, 'casey')).resolves.toEqual({ id: 2, username: 'casey' });
		await expect(getUserById(db as any, 2)).resolves.toEqual({ id: 2, username: 'casey' });
		expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE username = ? AND is_active = 1'));
		expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE id = ? AND is_active = 1'));
	});
});
