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
			user: null
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
				user: locals.user
			};
		}

		// Fetch section score data
		const { results } = await db.prepare(`
			SELECT section_name, score, last_updated
			FROM section_completion
			WHERE user_id = ?
		`).bind(userId).all();

		const readinessScore = calculateReadinessScore(results as any[]);

		return {
			readinessScore,
			user: locals.user
		};
	} catch (error) {
		console.error('Error loading layout data:', error);
		return {
			readinessScore: {
				total_score: 0,
				sections: {}
			},
			user: locals.user
		};
	}
};
