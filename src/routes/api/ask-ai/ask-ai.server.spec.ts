import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './+server';

const originalFetch = globalThis.fetch;

describe('POST /api/ask-ai', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it('validates required fields', async () => {
		const response = await POST({
			request: new Request('http://localhost', {
				method: 'POST',
				body: JSON.stringify({ section: 'Personal' })
			}),
			platform: { env: {} }
		} as any);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			success: false,
			error: 'Missing required fields'
		});
	});

	it('returns a fallback answer when no API key is configured', async () => {
		const response = await POST({
			request: new Request('http://localhost', {
				method: 'POST',
				body: JSON.stringify({ section: 'Personal', question: 'What should I include?' })
			}),
			platform: { env: {} }
		} as any);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.success).toBe(true);
		expect(body.answer).toContain('AI assistance is not configured');
	});

	it('proxies the request to OpenAI when an API key exists', async () => {
		const fetchMock = vi.fn(async () => ({
			ok: true,
			json: async () => ({
				choices: [{ message: { content: 'Here is your personalized guidance.' } }]
			})
		}));
		globalThis.fetch = fetchMock as any;

		const response = await POST({
			request: new Request('http://localhost', {
				method: 'POST',
				body: JSON.stringify({ section: 'Pets', question: 'How should I document medical info?' })
			}),
			platform: { env: { OPENAI_API_KEY: 'test-key' } }
		} as any);

		expect(fetchMock).toHaveBeenCalled();
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			success: true,
			answer: 'Here is your personalized guidance.'
		});
	});

	it('handles upstream errors gracefully', async () => {
		globalThis.fetch = vi.fn(async () => ({
			ok: false,
			json: async () => ({})
		})) as any;

		const response = await POST({
			request: new Request('http://localhost', {
				method: 'POST',
				body: JSON.stringify({ section: 'Legal', question: 'Need help' })
			}),
			platform: { env: { OPENAI_API_KEY: 'test-key' } }
		} as any);

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({
			success: false,
			error: 'An error occurred while processing your request'
		});
	});
});
