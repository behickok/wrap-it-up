import { expect, test } from '@playwright/test';
import { loginWithCredentials } from './helpers/auth';

test('dashboard surfaces enrolled journeys for authenticated users', async ({ page }) => {
	await loginWithCredentials(page);

	await expect(
		page.getByRole('heading', { level: 1, name: 'Welcome back, participant@example.com' })
	).toBeVisible();

	// Wedding journey card
	const weddingCard = page.getByRole('heading', { level: 2, name: 'Wedding Journey' });
	await expect(weddingCard).toBeVisible();
	await expect(page.getByRole('link', { name: 'Open dashboard', exact: false }).first()).toBeVisible();

	// Care journey card
	await expect(page.getByRole('heading', { level: 2, name: 'Care Journey' })).toBeVisible();

	// Journey links should be actionable
	await expect(page.getByRole('link', { name: 'Browse full library' })).toBeVisible();
});
