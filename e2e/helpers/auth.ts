import { expect, type Page } from '@playwright/test';

export const PARTICIPANT_CREDENTIALS = {
	email: 'participant@example.com',
	password: 'User123!'
};

export async function loginWithCredentials(
	page: Page,
	credentials: { email: string; password: string } = PARTICIPANT_CREDENTIALS
) {
	await page.goto('/login');
	await page.getByLabel('Email or Username').fill(credentials.email);
	await page.getByLabel('Password').fill(credentials.password);
	await page.getByRole('button', { name: 'Sign In' }).click();
	await expect(page).toHaveURL(/http:\/\/localhost:8788\/?$/);
}
