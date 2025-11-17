import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Journey } from '$lib/types';

type JourneyWithPublishStatus = Journey & { is_published: number | boolean };

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
		// Fetch all active journeys with publish status
		const journeysResult = await db
			.prepare(
				`
				SELECT
					j.*,
					COALESCE(jc.is_published, 0) as is_published
				FROM journeys j
				LEFT JOIN journey_creators jc ON j.id = jc.journey_id
				WHERE j.is_active = 1
				ORDER BY j.id
			`
			)
			.all<JourneyWithPublishStatus>();

		const journeys = (journeysResult.results || []).map((journey) => ({
			...journey,
			is_published: Boolean(journey.is_published)
		}));

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
