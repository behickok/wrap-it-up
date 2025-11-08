import { describe, expect, it } from 'vitest';

import { cn } from './utils';

describe('cn', () => {
	it('merges conditional class names similarly to tailwind-merge', () => {
		expect(
			cn(
				'btn',
				'btn-primary',
				false && 'hidden',
				{ 'btn-disabled': false, 'btn-wide': true },
				['mx-4', undefined]
			)
		).toBe('btn btn-primary btn-wide mx-4');
	});
});
