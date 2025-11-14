import { describe, expect, it, vi } from 'vitest';

import { load } from './+page.server';

function createStubDb(options: { journeys?: any[]; userJourneys?: any[] }) {
	const journeys = options.journeys ?? [];
	const userJourneys = options.userJourneys ?? [];

	return {
		prepare: vi.fn((query: string) => {
			if (query.includes('FROM journeys')) {
				return {
					all: vi.fn(async () => ({ results: journeys }))
				};
			}

			if (query.includes('FROM user_journeys')) {
				return {
					bind: vi.fn(() => ({
						all: vi.fn(async () => ({ results: userJourneys }))
					}))
				};
			}

			return {
				bind: vi.fn(() => ({
					all: vi.fn(async () => ({ results: [] })),
					first: vi.fn(async () => null),
					run: vi.fn(async () => undefined)
				})),
				all: vi.fn(async () => ({ results: [] }))
			};
		})
	};
}

describe('load', () => {
	it('returns marketing data when the database binding is missing', async () => {
		const result = (await load({
			locals: { user: null },
			platform: { env: {} }
		} as any)) as any;

		expect(result).toEqual({
			user: null,
			featuredJourneys: [],
			enrolledJourneys: [],
			availableJourneys: []
		});
	});

	it('separates enrolled and available journeys for authenticated users', async () => {
		const db = createStubDb({
			journeys: [
				{ id: 1, slug: 'care', name: 'Care Journey', icon: '💚', description: 'Care' },
				{ id: 2, slug: 'wedding', name: 'Wedding Journey', icon: '💍', description: 'Wedding' }
			],
			userJourneys: [
				{
					id: 10,
					user_id: 1,
					journey_id: 1,
					tier_id: 1,
					status: 'active',
					started_at: '2025-01-01T00:00:00Z',
					completed_at: null,
					created_at: '2025-01-01T00:00:00Z',
					updated_at: '2025-01-01T00:00:00Z',
					journey_name: 'Care Journey',
					journey_slug: 'care',
					journey_icon: '💚',
					journey_description: 'Care',
					tier_name: 'Essentials',
					tier_slug: 'essentials'
				}
			]
		});

		const result = (await load({
			locals: { user: { id: 1, email: 'casey@example.com' } },
			platform: { env: { DB: db } }
		} as any)) as any;

		expect(result.user?.email).toBe('casey@example.com');
		expect(result.enrolledJourneys).toHaveLength(1);
		expect(result.availableJourneys).toHaveLength(1);
		expect(result.availableJourneys[0].slug).toBe('wedding');
		expect(result.featuredJourneys).toHaveLength(2);
	});
});
