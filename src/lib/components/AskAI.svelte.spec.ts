import { page } from '@vitest/browser/context';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

import AskAI from './AskAI.svelte';

const originalFetch = globalThis.fetch;
let fetchMock: ReturnType<typeof vi.fn>;

describe('AskAI', () => {
beforeEach(() => {
	fetchMock = vi.fn(async () => ({
		ok: true,
		json: async () => ({ success: true, answer: 'Here is your guidance.' })
	}));
	globalThis.fetch = fetchMock as any;
});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		vi.resetAllMocks();
	});

	it('opens the modal when the CTA is clicked', async () => {
		render(AskAI, { props: { sectionName: 'Contacts' } });

		await page.getByRole('button', { name: 'Ask AI for Help' }).click();

		const textarea = page.getByPlaceholder(
			'Example: What kind of information should I include about my pets?'
		);
		await expect.element(textarea).toBeVisible();
	});

	it('submits the user question and renders the AI response', async () => {
		render(AskAI, { props: { sectionName: 'Contacts' } });

		await page.getByRole('button', { name: 'Ask AI for Help' }).click();
		await page
			.getByPlaceholder('Example: What kind of information should I include about my pets?')
			.fill('What should I include?');
		await page.getByRole('button', { name: 'Get Answer' }).click();

		await expect.poll(() => fetchMock.mock.calls.length).toBe(1);
		await expect.element(page.getByText('AI Response:')).toBeInTheDocument();
		await expect.element(page.getByText('Here is your guidance.')).toBeVisible();
	});
});
