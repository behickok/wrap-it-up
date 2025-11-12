import type { PageServerLoad } from './$types';
import type { Journey } from '$lib/types';

type EnrolledJourneyRow = {
	id: number;
	user_id: number;
	journey_id: number;
	tier_id: number;
	status: string;
	started_at: string;
	completed_at: string | null;
	created_at: string;
	updated_at: string;
	journey_name: string;
	journey_slug: string;
	journey_icon: string | null;
	journey_description: string | null;
	tier_name: string;
	tier_slug: string;
};

export const load: PageServerLoad = async ({ locals, platform }) => {
	const user = locals.user ?? null;
	const db = platform?.env?.DB;

	if (!db) {
		return {
			user,
			featuredJourneys: [],
			enrolledJourneys: [],
			availableJourneys: []
		};
	}

	try {
		const journeysResult = await db
			.prepare('SELECT * FROM journeys WHERE is_active = 1 ORDER BY name')
			.all();

		const journeys = (journeysResult.results || []) as Journey[];

		let enrolledJourneys: EnrolledJourneyRow[] = [];

		if (user) {
			const userJourneysResult = await db
				.prepare(
					`SELECT uj.*, 
					        j.name as journey_name,
					        j.slug as journey_slug,
					        j.icon as journey_icon,
					        j.description as journey_description,
					        st.name as tier_name,
					        st.slug as tier_slug
					 FROM user_journeys uj
					 JOIN journeys j ON uj.journey_id = j.id
					 JOIN service_tiers st ON uj.tier_id = st.id
					 WHERE uj.user_id = ? AND uj.status = 'active'
					 ORDER BY uj.started_at DESC`
				)
				.bind(user.id)
				.all();

			enrolledJourneys = (userJourneysResult.results || []) as EnrolledJourneyRow[];
		}

		const subscribedJourneyIds = new Set(enrolledJourneys.map((ej) => ej.journey_id));
		const availableJourneys = journeys.filter((journey) => !subscribedJourneyIds.has(journey.id));
		const featuredJourneys = journeys.slice(0, 3);

		return {
			user,
			featuredJourneys,
			enrolledJourneys,
			availableJourneys
		};
	} catch (error) {
		console.error('Error loading home page:', error);
		return {
			user,
			featuredJourneys: [],
			enrolledJourneys: [],
			availableJourneys: []
		};
	}
};
