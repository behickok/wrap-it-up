import { describe, expect, it, vi } from 'vitest';

import { POST } from './+server';

describe('POST /api/auth/logout', () => {
	it('returns 500 when the database binding is unavailable', async () => {
		const response = await POST({
			platform: { env: {} },
			cookies: {
				delete: vi.fn()
			}
		} as any);

		expect(response.status).toBe(500);
		const body = await response.json();
		expect(body.error).toBe('Database not available');
	});

	it('deletes the current session and clears the cookie', async () => {
		let deletedSessionId: string | null = null;
		const db = {
			prepare: vi.fn((sql: string) => ({
				bind: vi.fn((sessionId: string) => ({
					run: vi.fn(async () => {
						expect(sql).toContain('DELETE FROM sessions');
						deletedSessionId = sessionId;
					})
				}))
			}))
		};

		const cookies = {
			delete: vi.fn()
		};

		const response = await POST({
			platform: { env: { DB: db } },
			cookies,
			locals: { sessionId: 'session-123' }
		} as any);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ success: true });
		expect(deletedSessionId).toBe('session-123');
		expect(cookies.delete).toHaveBeenCalledWith('session_id', { path: '/' });
	});
});
