import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUserWithRoles, hasPermission } from '$lib/server/permissions';
import {
	getPlatformOverviewStats,
	getDailyActiveUsers,
	getEnrollmentFunnel,
	getTopPerformingJourneys
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

	// Check if user has admin permissions
	if (!hasPermission(userWithRoles, 'analytics.view_all')) {
		throw redirect(302, '/');
	}

	// Get date range from query params (default to last 30 days)
	const days = parseInt(url.searchParams.get('days') || '30');
	const endDate = new Date().toISOString().split('T')[0];
	const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
		.toISOString()
		.split('T')[0];

	// Get platform overview statistics
	const platformStats = await getPlatformOverviewStats(db);

	// Get daily active users trend
	const dauTrend = await getDailyActiveUsers(db, { days });

	// Get enrollment funnel
	const enrollmentFunnel = await getEnrollmentFunnel(db, {
		startDate,
		endDate
	});

	// Get top performing journeys by different metrics
	const topJourneysByEnrollments = await getTopPerformingJourneys(db, {
		limit: 10,
		orderBy: 'enrollments'
	});

	const topJourneysByCompletions = await getTopPerformingJourneys(db, {
		limit: 10,
		orderBy: 'completions'
	});

	const topJourneysByRating = await getTopPerformingJourneys(db, {
		limit: 10,
		orderBy: 'rating'
	});

	// Get top mentors by performance
	const topMentorsResult = await db
		.prepare(
			`
			SELECT
				mp.*,
				u.username,
				u.email,
				COUNT(DISTINCT jm.journey_id) as assigned_journeys
			FROM mentor_profiles mp
			JOIN users u ON mp.user_id = u.id
			LEFT JOIN journey_mentors jm ON mp.user_id = jm.mentor_user_id AND jm.status = 'active'
			WHERE mp.is_active = 1
			GROUP BY mp.id, u.username, u.email
			ORDER BY mp.average_rating DESC, mp.completed_reviews DESC
			LIMIT 10
		`
		)
		.all();

	const topMentors = topMentorsResult.results || [];

	// Get recent activity
	const recentEnrollmentsResult = await db
		.prepare(
			`
			SELECT
				uj.created_at,
				u.username,
				j.name as journey_name,
				st.name as tier_name
			FROM user_journeys uj
			JOIN users u ON uj.user_id = u.id
			JOIN journeys j ON uj.journey_id = j.id
			JOIN service_tiers st ON uj.tier_id = st.id
			ORDER BY uj.created_at DESC
			LIMIT 20
		`
		)
		.all();

	const recentEnrollments = recentEnrollmentsResult.results || [];

	// Get system metrics
	const systemMetricsResult = await db
		.prepare(
			`
			SELECT
				(SELECT COUNT(*) FROM analytics_events) as total_events,
				(SELECT COUNT(*) FROM analytics_events WHERE created_at >= date('now', '-7 days')) as events_7d,
				(SELECT COUNT(*) FROM section_reviews) as total_reviews,
				(SELECT COUNT(*) FROM section_reviews WHERE status = 'in_review') as reviews_in_progress,
				(SELECT COUNT(*) FROM mentor_applications WHERE status = 'pending') as pending_applications
		`
		)
		.first();

	const systemMetrics = systemMetricsResult || {};

	return {
		user: userWithRoles,
		platformStats,
		dauTrend,
		enrollmentFunnel,
		topJourneysByEnrollments,
		topJourneysByCompletions,
		topJourneysByRating,
		topMentors,
		recentEnrollments,
		systemMetrics,
		dateRange: {
			startDate,
			endDate,
			days
		}
	};
};
