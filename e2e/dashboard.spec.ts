import { expect, test } from '@playwright/test';

test('authenticated dashboard interactions', async ({ page }) => {
	await page.context().addCookies([
		{
			name: 'playwright-bypass',
			value: '1',
			domain: '127.0.0.1',
			path: '/'
		},
		{
			name: 'playwright-bypass',
			value: '1',
			domain: 'localhost',
			path: '/'
		}
	]);

	await page.route('**/api/ask-ai', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				success: true,
				answer: 'Focus on the details that will help your loved ones the most.'
			})
		});
	});

	await page.goto('/');

	await expect(page.getByRole('heading', { level: 2, name: 'Your End-of-Life Planning Document' })).toBeVisible();
	const legacyTab = page.getByRole('tab', { name: /Legacy End-of-Life Planning/ });
	await legacyTab.click();
	await expect(page.getByRole('button', { name: 'Final Days Preferences' })).toBeVisible();

	const askAiButton = page.getByRole('button', { name: 'Ask AI for Help' }).first();
	await askAiButton.click();

	const modal = page.getByRole('dialog', { name: 'Ask AI for Help' });
	await expect(modal).toBeVisible();

	await modal
		.getByPlaceholder('Example: What kind of information should I include about my pets?')
		.fill('What should I include in this section?');
	await modal.getByRole('button', { name: 'Get Answer' }).click();

	await expect(page.getByText('AI Response:')).toBeVisible();
	await expect(
		page.getByText('Focus on the details that will help your loved ones the most.')
	).toBeVisible();
	await modal.locator('button.btn-outline', { hasText: 'Close' }).click();

	await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
	const scrollTopButton = page.getByRole('button', { name: 'Scroll to top' });
	await expect(scrollTopButton).toBeVisible();
	await scrollTopButton.click();
	await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0);
});
