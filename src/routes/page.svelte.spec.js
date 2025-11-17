import { page } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';

import Page from './+page.svelte';

function createPageData(overrides = {}) {
	const base = {
		user: {
			id: 1,
			email: 'test@example.com',
			username: 'tester',
			is_active: true,
			last_login: null,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		},
		userId: 1,
		userJourneys: [],
		isMentor: false,
		isCreator: false,
		readinessScore: { total_score: 0, sections: {} },
		sectionData: {},
		featuredJourneys: [],
		enrolledJourneys: [],
		availableJourneys: []
	};

	return { ...base, ...overrides };
}

describe('/+page.svelte', () => {
	it('shows the onboarding prompt when an authenticated user has no journeys', async () => {
		render(Page, { props: { data: createPageData() } });

		const heading = page.getByRole('heading', { level: 1, name: 'Let’s start your first journey' });
		await expect.element(heading).toBeVisible();
	});

	it('lists available journeys for authenticated users who are not enrolled yet', async () => {
		const data = createPageData({
			availableJourneys: [
				{
					id: 10,
					slug: 'care',
					name: 'Care Planning',
					description: 'Coordinate long-term care preferences.',
					icon: '🧑‍⚕️'
				}
			]
		});

		render(Page, { props: { data } });

		await expect.element(page.getByRole('heading', { level: 2, name: 'Care Planning' })).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: 'View details' }))
			.toHaveAttribute('href', '/journeys/care');
	});

	it('renders enrolled journey cards for users with active journeys', async () => {
		const data = createPageData({
			enrolledJourneys: [
				{
					id: 1,
					user_id: 1,
					journey_id: 20,
					tier_id: 1,
					status: 'active',
					started_at: '2024-01-01T00:00:00.000Z',
					completed_at: null,
					created_at: '2024-01-01T00:00:00.000Z',
					updated_at: '2024-01-01T00:00:00.000Z',
					journey_name: 'Care Planning',
					journey_slug: 'care',
					journey_icon: '🧑‍⚕️',
					journey_description: 'Coordinate long-term care preferences.',
					tier_name: 'Guided',
					tier_slug: 'guided'
				}
			],
			availableJourneys: []
		});

		render(Page, { props: { data } });

		await expect.element(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: 'Open dashboard' }))
			.toHaveAttribute('href', '/journeys/care/dashboard');
	});
});
