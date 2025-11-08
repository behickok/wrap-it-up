import { expect, test } from '@playwright/test';

test('redirects unauthenticated visitors to the login experience', async ({ page }) => {
	await page.goto('/');
	await page.waitForURL('**/login');

	await expect(page.getByRole('heading', { level: 2, name: 'Welcome Back' })).toBeVisible();
	await expect(page.getByLabel('Email or Username')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Sign In' })).toBeEnabled();
});
