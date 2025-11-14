import { page } from '@vitest/browser/context';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

import JourneyTabs from './JourneyTabs.svelte';

describe('JourneyTabs', () => {
	it('marks the active category tab as selected', async () => {
		render(JourneyTabs, { target: document.body, props: { activeCategory: 'plan' } });

		const planTab = page.getByRole('tab', { name: /Plan Legal & Financial Foundation/ });
		const legacyTab = page.getByRole('tab', { name: /Legacy End-of-Life Planning/ });

		await expect.element(planTab).toHaveAttribute('aria-selected', 'true');
		await expect.element(legacyTab).toHaveAttribute('aria-selected', 'false');
	});

	it('invokes onCategoryChange when another tab is clicked', async () => {
		const onCategoryChange = vi.fn();
		render(JourneyTabs, {
			target: document.body,
			props: { activeCategory: 'plan', onCategoryChange }
		});

		await page.getByRole('tab', { name: /Legacy End-of-Life Planning/ }).click();

		await expect.poll(() => onCategoryChange.mock.calls.length).toBe(1);
		expect(onCategoryChange).toHaveBeenCalledWith('legacy');
		const legacyTab = page.getByRole('tab', { name: /Legacy End-of-Life Planning/ });
		await expect.element(legacyTab).toHaveAttribute('aria-selected', 'true');
	});
});
