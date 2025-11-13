import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUserWithRoles } from '$lib/server/permissions';
import {
	getMentorPerformanceStats,
	getMentorRatingsBreakdown,
	getMentorEarningsSummary,
	getMentorActivityTimeline
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

	// Check if user is a mentor
	const mentorProfile = await db
		.prepare(
			`
			SELECT * FROM mentor_profiles
			WHERE user_id = ? AND is_active = 1
		`
		)
		.bind(locals.user.id)
		.first();

	if (!mentorProfile) {
		throw redirect(302, '/mentor/apply');
	}

	// Get date range from query params (default to last 30 days)
	const days = parseInt(url.searchParams.get('days') || '30');
	const endDate = new Date().toISOString().split('T')[0];
	const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
		.toISOString()
		.split('T')[0];

	// Get mentor performance stats
	const performanceStats = await getMentorPerformanceStats(db, {
		mentorUserId: locals.user.id,
		startDate,
		endDate
	});

	// Get ratings breakdown
	const ratingsBreakdown = await getMentorRatingsBreakdown(db, {
		mentorUserId: locals.user.id
	});

	// Get earnings summary
	const earningsSummary = await getMentorEarningsSummary(db, {
		mentorUserId: locals.user.id,
		startDate,
		endDate
	});

	// Get activity timeline
	const activityTimeline = await getMentorActivityTimeline(db, {
		mentorUserId: locals.user.id,
		days
	});

	// Get journey assignments
	const assignmentsResult = await db
		.prepare(
			`
			SELECT
				jm.*,
				j.name as journey_name,
				j.slug as journey_slug,
				j.icon as journey_icon
			FROM journey_mentors jm
			JOIN journeys j ON jm.journey_id = j.id
			WHERE jm.mentor_user_id = ? AND jm.status = 'active'
			ORDER BY jm.assigned_at DESC
		`
		)
		.bind(locals.user.id)
		.all();

	const assignments = assignmentsResult.results || [];

	// Get recent reviews
	const recentReviewsResult = await db
		.prepare(
			`
			SELECT
				sr.*,
				s.name as section_name,
				j.name as journey_name,
				u.username as client_username
			FROM section_reviews sr
			JOIN sections s ON sr.section_id = s.id
			JOIN user_journeys uj ON sr.user_journey_id = uj.id
			JOIN journeys j ON uj.journey_id = j.id
			JOIN users u ON uj.user_id = u.id
			WHERE sr.mentor_user_id = ?
			ORDER BY sr.requested_at DESC
			LIMIT 10
		`
		)
		.bind(locals.user.id)
		.all();

	const recentReviews = recentReviewsResult.results || [];

	return {
		user: userWithRoles,
		mentorProfile,
		performanceStats,
		ratingsBreakdown,
		earningsSummary,
		activityTimeline,
		assignments,
		recentReviews,
		dateRange: {
			startDate,
			endDate,
			days
		}
	};
};
