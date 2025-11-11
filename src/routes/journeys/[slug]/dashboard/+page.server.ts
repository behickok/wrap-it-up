import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform, params }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	const { slug } = params;

	try {
		// Get journey
		const journeyResult = await db
			.prepare('SELECT * FROM journeys WHERE slug = ?')
			.bind(slug)
			.first();

		if (!journeyResult) {
			throw error(404, 'Journey not found');
		}

		const journey = journeyResult as any;

		// Check subscription
		const subscriptionResult = await db
			.prepare(
				`SELECT uj.*, st.name as tier_name, st.slug as tier_slug
				 FROM user_journeys uj
				 JOIN service_tiers st ON uj.tier_id = st.id
				 WHERE uj.user_id = ? AND uj.journey_id = ? AND uj.status = 'active'`
			)
			.bind(locals.user.id, journey.id)
			.first();

		if (!subscriptionResult) {
			// Not subscribed, redirect to journey detail page
			throw redirect(303, `/journeys/${slug}`);
		}

		const subscription = subscriptionResult as any;

		// Get journey progress
		const progressResult = await db
			.prepare(
				`SELECT COUNT(*) as completed,
				 (SELECT COUNT(*) FROM journey_sections WHERE journey_id = ?) as total
				 FROM user_journey_progress
				 WHERE user_journey_id = ? AND is_completed = 1`
			)
			.bind(journey.id, subscription.id)
			.first();

		const progress = progressResult as any;
		const completionPercentage = progress.total > 0
			? Math.round((progress.completed / progress.total) * 100)
			: 0;

		return {
			journey,
			subscription,
			completionPercentage,
			sectionsCompleted: progress.completed || 0,
			sectionsTotal: progress.total || 0
		};
	} catch (err) {
		if (err instanceof Response) throw err;
		console.error('Error loading journey dashboard:', err);
		throw error(500, 'Failed to load dashboard');
	}
};
