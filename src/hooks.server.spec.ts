import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

vi.mock('$lib/auth', () => ({
	getSession: vi.fn(),
	getUserById: vi.fn(),
	isSessionValid: vi.fn(),
	cleanupExpiredSessions: vi.fn()
}));

import { handle } from './hooks.server';
import { getSession } from '$lib/auth';

const mockedGetSession = vi.mocked(getSession);

describe('hooks.server handle', () => {
	beforeEach(() => {
		vi.spyOn(Math, 'random').mockReturnValue(1); // Avoid cleanup branch
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('clears the session cookie when no matching session is found', async () => {
		mockedGetSession.mockResolvedValue(null);

		const cookies = {
			get: vi.fn(() => 'session-token'),
			delete: vi.fn()
		};

		const locals = { user: null, sessionId: null };

		const event = {
			locals,
			request: new Request('https://wrap-it-up.test'),
			url: new URL('https://wrap-it-up.test'),
			route: { id: null },
			cookies,
			platform: {
				env: { DB: {} },
				context: { waitUntil: vi.fn() }
			}
		};

		const resolve = vi.fn(async () => new Response('ok'));

		const response = await handle({ event: event as any, resolve });

		expect(response.status).toBe(200);
		expect(cookies.delete).toHaveBeenCalledWith('session_id', { path: '/' });
		expect(locals.user).toBeNull();
		expect(locals.sessionId).toBeNull();
	});
});
