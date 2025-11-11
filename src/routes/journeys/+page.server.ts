import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Journey, UserJourney } from '$lib/types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	// Check authentication
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw new Error('Database not available');
	}

	try {
		// Fetch all active journeys
		const journeysResult = await db
			.prepare('SELECT * FROM journeys WHERE is_active = 1 ORDER BY id')
			.all();

		const journeys = (journeysResult.results || []) as Journey[];

		// Fetch user's current journeys
		const userJourneysResult = await db
			.prepare(
				`SELECT uj.*, j.name as journey_name, j.slug as journey_slug, j.icon as journey_icon
				 FROM user_journeys uj
				 JOIN journeys j ON uj.journey_id = j.id
				 WHERE uj.user_id = ? AND uj.status = 'active'`
			)
			.bind(locals.user.id)
			.all();

		const userJourneys = userJourneysResult.results || [];

		// Create a map of journey IDs that user is already subscribed to
		const subscribedJourneyIds = new Set(
			userJourneys.map((uj: any) => uj.journey_id)
		);

		return {
			journeys,
			userJourneys,
			subscribedJourneyIds: Array.from(subscribedJourneyIds)
		};
	} catch (error) {
		console.error('Error loading journeys:', error);
		throw new Error('Failed to load journeys');
	}
};
