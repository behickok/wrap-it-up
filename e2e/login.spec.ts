import { expect, test } from '@playwright/test';
import { loginWithCredentials, PARTICIPANT_CREDENTIALS } from './helpers/auth';

test('redirects to the dashboard after login and persists session across reloads', async ({ page }) => {
	await loginWithCredentials(page);

	await expect(
		page.getByRole('heading', {
			level: 1,
			name: 'Welcome back, participant@example.com'
		})
	).toBeVisible();

	// Session should persist across navigation
	await page.getByRole('link', { name: '📚 Journeys' }).click();
	await expect(page).toHaveURL(/\/journeys$/);
	await expect(page.getByText('Signed in as')).toBeVisible();

	await page.goto('/');

	await page.reload();
	await expect(
		page.getByRole('heading', {
			level: 1,
			name: 'Welcome back, participant@example.com'
		})
	).toBeVisible();

	await page.getByRole('button', { name: 'Logout' }).click();
	await expect(page).toHaveURL(/\/login$/);
	await expect(page.getByRole('heading', { level: 2, name: 'Welcome Back' })).toBeVisible();

	// Log in again (ensuring credentials continue to work)
	await loginWithCredentials(page);
	await expect(
		page.getByRole('heading', { level: 1, name: 'Welcome back, participant@example.com' })
	).toBeVisible();
});
