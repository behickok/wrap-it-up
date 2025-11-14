/**
 * User Progress Dashboard
 * Visualize learning progress, milestones, and achievements
 */

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	// Get user's journey progress summary
	const journeyProgress = await db
		.prepare(
			`SELECT * FROM user_journey_progress_summary
			WHERE user_id = ?
			ORDER BY
				CASE WHEN status = 'in_progress' THEN 1
				     WHEN status = 'not_started' THEN 2
				     WHEN status = 'completed' THEN 3
				END,
				enrolled_at DESC`
		)
		.bind(locals.user.id)
		.all();

	// Get activity streak
	const activityStreak = await db
		.prepare(
			`SELECT * FROM user_activity_streaks
			WHERE user_id = ?`
		)
		.bind(locals.user.id)
		.first();

	// Get recent milestones
	const milestones = await db
		.prepare(
			`SELECT * FROM user_milestones
			WHERE user_id = ?
			ORDER BY achieved_at DESC
			LIMIT 20`
		)
		.bind(locals.user.id)
		.all();

	// Get activity summary
	const activitySummary = await db
		.prepare(
			`SELECT * FROM user_activity_summary
			WHERE user_id = ?`
		)
		.bind(locals.user.id)
		.first();

	// Get recent activity timeline (last 30 days)
	const recentActivity = await db
		.prepare(
			`SELECT
				DATE(created_at) as activity_date,
				COUNT(*) as event_count
			FROM analytics_events
			WHERE user_id = ? AND created_at >= DATE('now', '-30 days')
			GROUP BY DATE(created_at)
			ORDER BY activity_date ASC`
		)
		.bind(locals.user.id)
		.all();

	// Get certificates
	const certificates = await db
		.prepare(
			`SELECT jc.*, j.name as journey_name, j.slug as journey_slug
			FROM journey_certificates jc
			INNER JOIN journeys j ON jc.journey_id = j.id
			WHERE jc.user_id = ?
			ORDER BY jc.issue_date DESC`
		)
		.bind(locals.user.id)
		.all();

	// Calculate overall statistics
	const totalJourneys = journeyProgress.results?.length || 0;
	const completedJourneys =
		journeyProgress.results?.filter((j: any) => j.status === 'completed').length || 0;
	const inProgressJourneys =
		journeyProgress.results?.filter((j: any) => j.status === 'in_progress').length || 0;

	const totalSections = journeyProgress.results?.reduce(
		(sum: number, j: any) => sum + (j.total_sections || 0),
		0
	);
	const completedSections = journeyProgress.results?.reduce(
		(sum: number, j: any) => sum + (j.completed_sections || 0),
		0
	);

	const overallCompletion =
		totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;

	return {
		user: locals.user,
		journeyProgress: journeyProgress.results || [],
		activityStreak: activityStreak || {
			current_streak: 0,
			longest_streak: 0,
			total_active_days: 0,
			last_activity_date: null
		},
		milestones: milestones.results || [],
		activitySummary: activitySummary || {
			total_active_days: 0,
			total_journeys_enrolled: 0,
			total_journeys_completed: 0,
			total_milestones: 0
		},
		recentActivity: recentActivity.results || [],
		certificates: certificates.results || [],
		stats: {
			totalJourneys,
			completedJourneys,
			inProgressJourneys,
			totalSections,
			completedSections,
			overallCompletion
		}
	};
};
