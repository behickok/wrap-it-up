import { expect, test } from '@playwright/test';
import { loginWithCredentials } from './helpers/auth';

test('redirects unauthenticated visitors to login and supports signing in', async ({ page }) => {
	await page.goto('/');
	await page.waitForURL('**/login');

	await expect(page.getByRole('heading', { level: 2, name: 'Welcome Back' })).toBeVisible();
	await expect(page.getByLabel('Email or Username')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Sign In' })).toBeEnabled();

	await loginWithCredentials(page);

	await expect(
		page.getByRole('heading', { level: 1, name: 'Welcome back, participant@example.com' })
	).toBeVisible();
});
