import type { LayoutServerLoad } from './$types';
import { calculateReadinessScore } from '$lib/readinessScore';

export const load: LayoutServerLoad = async ({ platform }) => {
	try {
		// For now, we'll use a default user_id of 1
		// In a production app, this would come from authentication
		const userId = 1;

		const db = platform?.env?.DB;

		if (!db) {
			return {
				readinessScore: {
					total_score: 0,
					sections: {}
				}
			};
		}

		// Initialize user if not exists
		await db.prepare(`
			INSERT OR IGNORE INTO users (id) VALUES (?)
		`).bind(userId).run();

		// Fetch section completion data
		const { results } = await db.prepare(`
			SELECT section_name, completion_percentage, last_updated
			FROM section_completion
			WHERE user_id = ?
		`).bind(userId).all();

		const readinessScore = calculateReadinessScore(results as any[]);

		return {
			readinessScore,
			userId
		};
	} catch (error) {
		console.error('Error loading layout data:', error);
		return {
			readinessScore: {
				total_score: 0,
				sections: {}
			},
			userId: 1
		};
	}
};
