import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUserWithRoles, hasPermission } from '$lib/server/permissions';
import {
	getCreatorJourneyAnalytics,
	getJourneyEngagementTrends,
	getSectionCompletionRates,
	getDailyActiveUsers,
	getPlatformOverviewStats
} from '$lib/server/analytics';

export const load: PageServerLoad = async ({ locals, platform, url }) => {
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

	// Get date range from query params (default to last 30 days)
	const days = parseInt(url.searchParams.get('days') || '30');
	const endDate = new Date().toISOString().split('T')[0];
	const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
		.toISOString()
		.split('T')[0];

	// Fetch creator's journeys
	const journeysResult = await db
		.prepare(
			`
			SELECT j.*
			FROM journeys j
			JOIN journey_creators jc ON j.id = jc.journey_id
			WHERE jc.creator_user_id = ?
			ORDER BY j.created_at DESC
		`
		)
		.bind(locals.user.id)
		.all();

	const journeys = journeysResult.results || [];

	// Get analytics for creator's journeys
	const journeyAnalytics = await getCreatorJourneyAnalytics(db, {
		creatorUserId: locals.user.id,
		startDate,
		endDate
	});

	// Get engagement trends for each journey
	const engagementTrendsPromises = journeys.map(async (journey: any) => {
		const trends = await getJourneyEngagementTrends(db, {
			journeyId: journey.id,
			days
		});
		return {
			journey_id: journey.id,
			trends
		};
	});

	const engagementTrendsData = await Promise.all(engagementTrendsPromises);
	const engagementTrendsMap = new Map(
		engagementTrendsData.map((t) => [t.journey_id, t.trends])
	);

	// Get section completion rates for each journey
	const sectionStatsPromises = journeys.map(async (journey: any) => {
		const sections = await getSectionCompletionRates(db, {
			journeyId: journey.id
		});
		return {
			journey_id: journey.id,
			sections
		};
	});

	const sectionStatsData = await Promise.all(sectionStatsPromises);
	const sectionStatsMap = new Map(sectionStatsData.map((s) => [s.journey_id, s.sections]));

	// Calculate overall summary statistics
	const totalEnrollments = journeyAnalytics.reduce(
		(sum: number, j: any) => sum + (j.total_enrollments || 0),
		0
	);
	const totalActiveUsers = journeyAnalytics.reduce(
		(sum: number, j: any) => sum + (j.active_users || 0),
		0
	);
	const totalCompletedUsers = journeyAnalytics.reduce(
		(sum: number, j: any) => sum + (j.completed_users || 0),
		0
	);
	const totalReviews = journeyAnalytics.reduce(
		(sum: number, j: any) => sum + (j.total_reviews || 0),
		0
	);

	const avgRating =
		journeyAnalytics.reduce((sum: number, j: any) => sum + (j.avg_review_rating || 0), 0) /
		Math.max(journeyAnalytics.length, 1);

	const completionRate =
		totalEnrollments > 0 ? (totalCompletedUsers / totalEnrollments) * 100 : 0;

	// Get daily active users trend
	const dauTrend = await getDailyActiveUsers(db, { days });

	return {
		user: userWithRoles,
		journeys,
		journeyAnalytics,
		engagementTrends: engagementTrendsMap,
		sectionStats: sectionStatsMap,
		dauTrend,
		summary: {
			totalJourneys: journeys.length,
			totalEnrollments,
			totalActiveUsers,
			totalCompletedUsers,
			totalReviews,
			avgRating: avgRating.toFixed(1),
			completionRate: completionRate.toFixed(1)
		},
		dateRange: {
			startDate,
			endDate,
			days
		}
	};
};
