import { page } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';

import JourneyVisual from './JourneyVisual.svelte';

describe('JourneyVisual', () => {
	it('highlights the plan label when plan is active', async () => {
		render(JourneyVisual, { target: document.body, props: { activeCategory: 'plan' } });

		const planLabel = page.getByText(/^Plan$/);
		const legacyLabel = page.getByText(/^Legacy$/);

		await expect.element(planLabel).toHaveAttribute('style', expect.stringContaining('opacity: 1'));
		await expect
			.element(legacyLabel)
			.toHaveAttribute('style', expect.stringContaining('opacity: 0.5'));
	});

	it('highlights the legacy label when legacy is active', async () => {
		render(JourneyVisual, { target: document.body, props: { activeCategory: 'legacy' } });

		const planLabel = page.getByText(/^Plan$/);
		const legacyLabel = page.getByText(/^Legacy$/);

		await expect
			.element(planLabel)
			.toHaveAttribute('style', expect.stringContaining('opacity: 0.5'));
		await expect.element(legacyLabel).toHaveAttribute('style', expect.stringContaining('opacity: 1'));
	});
});
