import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUserWithRoles, hasPermission } from '$lib/server/permissions';
import type { Journey, JourneyCreator, JourneyAnalytics } from '$lib/types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw new Error('Database not available');
	}

	// Load user with roles
	const userWithRoles = await getUserWithRoles(db, locals.user.id);
	if (!userWithRoles) {
		throw redirect(302, '/login');
	}

	// Check if user has creator permissions
	if (!hasPermission(userWithRoles, 'journey.create')) {
		throw redirect(302, '/');
	}

	// Fetch creator's journeys
	const journeysResult = await db
		.prepare(
			`
			SELECT
				j.*,
				jc.is_published,
				jc.is_featured,
				jc.use_count,
				jc.created_at as creator_created_at
			FROM journeys j
			JOIN journey_creators jc ON j.id = jc.journey_id
			WHERE jc.creator_user_id = ?
			ORDER BY j.created_at DESC
		`
		)
		.bind(locals.user.id)
		.all<Journey & JourneyCreator>();

	const journeys = (journeysResult.results || []) as (Journey & JourneyCreator)[];

	// Fetch latest analytics for each journey (last 30 days)
	const analyticsPromises = journeys.map(async (journey) => {
		const analytics = await db
			.prepare(
				`
				SELECT *
				FROM journey_analytics
				WHERE journey_id = ?
				  AND metric_date >= date('now', '-30 days')
				ORDER BY metric_date DESC
			`
			)
			.bind(journey.id)
			.all<JourneyAnalytics>();

		return {
			journey_id: journey.id,
			recent: analytics.results || []
		};
	});

	const analyticsData = await Promise.all(analyticsPromises);
	const analyticsMap = new Map<number, JourneyAnalytics[]>(
		analyticsData.map((a) => [a.journey_id, a.recent])
	);

	// Calculate summary statistics
	const totalUsers = journeys.reduce((sum, j) => sum + (j.use_count || 0), 0);
	const totalJourneys = journeys.length;
	const publishedJourneys = journeys.filter((j) => j.is_published).length;
	const featuredJourneys = journeys.filter((j) => j.is_featured).length;

	// Calculate average completion rate across all journeys
	let totalCompletionSum = 0;
	let totalScoreSum = 0;
	let analyticsCount = 0;

	analyticsMap.forEach((analytics) => {
		analytics.forEach((day) => {
			totalCompletionSum += day.avg_completion_percentage;
			totalScoreSum += day.avg_score;
			analyticsCount++;
		});
	});

	const avgCompletion = analyticsCount > 0 ? totalCompletionSum / analyticsCount : 0;
	const avgScore = analyticsCount > 0 ? totalScoreSum / analyticsCount : 0;

	return {
		user: userWithRoles,
		journeys,
		analytics: analyticsMap,
		summary: {
			totalUsers,
			totalJourneys,
			publishedJourneys,
			featuredJourneys,
			avgCompletion: Math.round(avgCompletion),
			avgScore: Math.round(avgScore)
		}
	};
};
