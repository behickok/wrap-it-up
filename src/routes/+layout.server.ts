import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { calculateReadinessScore } from '$lib/readinessScore';

export const load: LayoutServerLoad = async ({ platform, locals, url }) => {
	// Allow access to auth pages without authentication
	const publicPaths = ['/login', '/register'];
	const isPublicPath = publicPaths.some(path => url.pathname === path);

	if (!locals.user && !isPublicPath) {
		throw redirect(302, '/login');
	}

	// Return minimal data for public pages
	if (isPublicPath) {
		return {
			readinessScore: {
				total_score: 0,
				sections: {}
			},
			user: null,
			userJourneys: []
		};
	}

	try {
		const userId = locals.user!.id;
		const db = platform?.env?.DB;

		if (!db) {
			return {
				readinessScore: {
					total_score: 0,
					sections: {}
				},
				user: locals.user,
				userJourneys: []
			};
		}

		// Fetch section score data
		const { results } = await db.prepare(`
			SELECT section_name, score, last_updated
			FROM section_completion
			WHERE user_id = ?
		`).bind(userId).all();

		const readinessScore = calculateReadinessScore(results as any[]);

		// Fetch user's active journeys
		const userJourneysResult = await db.prepare(`
			SELECT uj.id, uj.journey_id, uj.status,
				   j.name as journey_name, j.slug as journey_slug, j.icon as journey_icon,
				   st.name as tier_name, st.slug as tier_slug
			FROM user_journeys uj
			JOIN journeys j ON uj.journey_id = j.id
			JOIN service_tiers st ON uj.tier_id = st.id
			WHERE uj.user_id = ? AND uj.status = 'active'
			ORDER BY uj.started_at DESC
		`).bind(userId).all();

		return {
			readinessScore,
			user: locals.user,
			userJourneys: userJourneysResult.results || []
		};
	} catch (error) {
		console.error('Error loading layout data:', error);
		return {
			readinessScore: {
				total_score: 0,
				sections: {}
			},
			user: locals.user,
			userJourneys: []
		};
	}
};
