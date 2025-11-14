/**
 * Analytics Service
 * Phase 5: Analytics & Insights Dashboard
 *
 * Provides event tracking and analytics querying functionality
 * Uses only D1 database - no external analytics services
 */

import type { D1Database } from '@cloudflare/workers-types';
import type { AnalyticsEventType, AnalyticsEventMetadata } from '$lib/types';

type EnrollmentFunnelRow = {
	views: number | null;
	enrollments: number | null;
	started_sections: number | null;
	completed_sections: number | null;
	journey_completions: number | null;
};

type MentorPerformanceStatsRow = {
	total_reviews: number | null;
	completed_reviews: number | null;
	in_progress_reviews: number | null;
	pending_reviews: number | null;
	avg_turnaround_hours: number | null;
	avg_response_hours: number | null;
};

type MentorRatingsBreakdownRow = {
	total_ratings: number | null;
	avg_overall_rating: number | null;
	avg_helpfulness_rating: number | null;
	avg_timeliness_rating: number | null;
	avg_communication_rating: number | null;
	recommend_percentage: number | null;
	five_star_count: number | null;
	four_star_count: number | null;
	three_star_count: number | null;
	two_star_count: number | null;
	one_star_count: number | null;
};

type MentorEarningsSummaryRow = {
	total_earnings: number | null;
	review_earnings: number | null;
	revenue_share_earnings: number | null;
	bonus_earnings: number | null;
	pending_amount: number | null;
	paid_out_amount: number | null;
	total_transactions: number | null;
};

type PlatformOverviewStatsRow = {
	total_users: number;
	new_users_7d: number;
	new_users_30d: number;
	active_journeys: number;
	total_journeys: number;
	active_journey_users: number;
	total_enrollments: number;
	completed_enrollments: number;
	active_mentors: number;
	total_mentors: number;
	pending_mentor_applications: number;
	pending_reviews: number;
	total_mentor_earnings: number | null;
	reviews_completed_7d: number;
	average_rating: number | null;
};

type CreatorJourneyAnalyticsRow = {
	journey_id: number;
	journey_name: string;
	journey_slug: string;
	total_enrollments: number | null;
	active_users: number | null;
	completed_users: number | null;
	total_reviews: number | null;
	avg_review_rating: number | null;
	total_mentor_payments: number | null;
};

type JourneyEngagementTrendRow = {
	date: string;
	views: number | null;
	enrollments: number | null;
	active_users: number | null;
};

type SectionCompletionRateRow = {
	section_id: number;
	section_name: string;
	section_slug: string;
	total_attempts: number | null;
	completions: number | null;
	completion_rate: number | null;
	avg_score: number | null;
};

// ============================================================================
// EVENT TRACKING
// ============================================================================

/**
 * Track an analytics event
 */
export async function trackEvent(
	db: D1Database,
	params: {
		eventType: string;
		eventCategory?: string;
		userId?: number;
		journeyId?: number;
		sectionId?: number;
		sessionId?: string;
		metadata?: Record<string, any>;
		pageUrl?: string;
		referrerUrl?: string;
		userAgent?: string;
	}
): Promise<void> {
	const {
		eventType,
		eventCategory,
		userId,
		journeyId,
		sectionId,
		sessionId,
		metadata,
		pageUrl,
		referrerUrl,
		userAgent
	} = params;

	try {
		await db
			.prepare(
				`INSERT INTO analytics_events (
					event_type, event_category, user_id, journey_id, section_id,
					session_id, metadata, page_url, referrer_url, user_agent
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(
				eventType,
				eventCategory || null,
				userId || null,
				journeyId || null,
				sectionId || null,
				sessionId || null,
				metadata ? JSON.stringify(metadata) : null,
				pageUrl || null,
				referrerUrl || null,
				userAgent || null
			)
			.run();
	} catch (error) {
		console.error('Failed to track analytics event:', error);
		// Don't throw - analytics failures shouldn't break user experience
	}
}

/**
 * Common event tracking shortcuts
 */
export const AnalyticsEvents = {
	// Page views
	async pageView(
		db: D1Database,
		params: {
			userId?: number;
			pageUrl: string;
			referrerUrl?: string;
			sessionId: string;
			userAgent?: string;
		}
	) {
		await trackEvent(db, {
			eventType: 'page_view',
			eventCategory: 'user_action',
			...params
		});
	},

	// Journey events
	async journeyView(
		db: D1Database,
		params: { userId?: number; journeyId: number; sessionId: string }
	) {
		await trackEvent(db, {
			eventType: 'journey_view',
			eventCategory: 'user_action',
			...params
		});
	},

	async journeyEnrollment(db: D1Database, params: { userId: number; journeyId: number }) {
		await trackEvent(db, {
			eventType: 'enrollment',
			eventCategory: 'user_action',
			...params
		});
	},

	async journeyCompletion(db: D1Database, params: { userId: number; journeyId: number }) {
		await trackEvent(db, {
			eventType: 'journey_complete',
			eventCategory: 'user_action',
			...params
		});
	},

	// Section events
	async sectionStart(
		db: D1Database,
		params: { userId: number; journeyId: number; sectionId: number }
	) {
		await trackEvent(db, {
			eventType: 'section_start',
			eventCategory: 'user_action',
			...params
		});
	},

	async sectionComplete(
		db: D1Database,
		params: { userId: number; journeyId: number; sectionId: number }
	) {
		await trackEvent(db, {
			eventType: 'section_complete',
			eventCategory: 'user_action',
			...params
		});
	},

	// Review events
	async reviewRequest(
		db: D1Database,
		params: {
			userId: number;
			journeyId: number;
			sectionId: number;
			metadata?: { reviewId: number };
		}
	) {
		await trackEvent(db, {
			eventType: 'review_request',
			eventCategory: 'mentor_activity',
			...params
		});
	},

	async reviewClaim(
		db: D1Database,
		params: {
			userId: number;
			journeyId: number;
			sectionId: number;
			metadata: { reviewId: number };
		}
	) {
		await trackEvent(db, {
			eventType: 'review_claim',
			eventCategory: 'mentor_activity',
			...params
		});
	},

	async reviewComplete(
		db: D1Database,
		params: {
			userId: number;
			journeyId: number;
			sectionId: number;
			metadata: { reviewId: number; turnaroundHours: number };
		}
	) {
		await trackEvent(db, {
			eventType: 'review_complete',
			eventCategory: 'mentor_activity',
			...params
		});
	},

	// Mentor events
	async mentorApplication(db: D1Database, params: { userId: number }) {
		await trackEvent(db, {
			eventType: 'mentor_application',
			eventCategory: 'mentor_activity',
			...params
		});
	},

	async mentorApproval(
		db: D1Database,
		params: { userId: number; metadata: { approved: boolean } }
	) {
		await trackEvent(db, {
			eventType: 'mentor_approval',
			eventCategory: 'mentor_activity',
			...params
		});
	},

	// Auth events
	async login(db: D1Database, params: { userId: number }) {
		await trackEvent(db, {
			eventType: 'login',
			eventCategory: 'user_action',
			...params
		});
	},

	async register(db: D1Database, params: { userId: number }) {
		await trackEvent(db, {
			eventType: 'register',
			eventCategory: 'user_action',
			...params
		});
	}
};

// ============================================================================
// ANALYTICS QUERIES - Creator Dashboard
// ============================================================================

/**
 * Get journey analytics for creator dashboard
 */
export async function getCreatorJourneyAnalytics(
	db: D1Database,
	params: {
		creatorUserId: number;
		startDate?: string;
		endDate?: string;
	}
) {
	const { creatorUserId, startDate, endDate } = params;

	// Get creator's journeys (TODO: Implement journey ownership table)
	// For now, we'll fetch all journeys and filter by creator_user_id in journey_mentors
	const stmt = db.prepare(`
		SELECT
			j.id as journey_id,
			j.name as journey_name,
			j.slug as journey_slug,
			COUNT(DISTINCT uj.user_id) as total_enrollments,
			COUNT(DISTINCT CASE WHEN uj.status = 'active' THEN uj.user_id END) as active_users,
			COUNT(DISTINCT CASE WHEN uj.status = 'completed' THEN uj.user_id END) as completed_users,
			COUNT(DISTINCT sr.id) as total_reviews,
			AVG(mr.overall_rating) as avg_review_rating,
			SUM(mt.mentor_amount) as total_mentor_payments
		FROM journeys j
		LEFT JOIN user_journeys uj ON j.id = uj.journey_id
		LEFT JOIN section_reviews sr ON uj.id = sr.user_journey_id
		LEFT JOIN mentor_ratings mr ON sr.id = mr.section_review_id
		LEFT JOIN mentor_transactions mt ON j.id = mt.journey_id
		WHERE 1=1
		${startDate ? 'AND uj.created_at >= ?' : ''}
		${endDate ? 'AND uj.created_at <= ?' : ''}
		GROUP BY j.id, j.name, j.slug
		ORDER BY total_enrollments DESC
	`);

	const bindings = [];
	if (startDate) bindings.push(startDate);
	if (endDate) bindings.push(endDate);

	const result = await (bindings.length > 0 ? stmt.bind(...bindings) : stmt).all<CreatorJourneyAnalyticsRow>();
	return result.results || [];
}

/**
 * Get journey engagement trends
 */
export async function getJourneyEngagementTrends(
	db: D1Database,
	params: {
		journeyId: number;
		days?: number;
	}
) {
	const { journeyId, days = 30 } = params;

	const result = await db
		.prepare(
			`
		SELECT
			date(created_at) as date,
			COUNT(DISTINCT CASE WHEN event_type = 'journey_view' THEN session_id END) as views,
			COUNT(DISTINCT CASE WHEN event_type = 'enrollment' THEN user_id END) as enrollments,
			COUNT(DISTINCT CASE WHEN event_type = 'section_complete' THEN user_id END) as active_users
		FROM analytics_events
		WHERE journey_id = ?
		  AND created_at >= date('now', '-' || ? || ' days')
		GROUP BY date(created_at)
		ORDER BY date ASC
	`
		)
		.bind(journeyId, days)
		.all<JourneyEngagementTrendRow>();

	return result.results || [];
}

/**
 * Get section completion rates for a journey
 */
export async function getSectionCompletionRates(
	db: D1Database,
	params: {
		journeyId: number;
	}
) {
	const { journeyId } = params;

	const result = await db
		.prepare(
			`
		SELECT
			s.id as section_id,
			s.name as section_name,
			s.slug as section_slug,
			COUNT(DISTINCT ujp.user_journey_id) as total_attempts,
			COUNT(DISTINCT CASE WHEN ujp.is_completed = 1 THEN ujp.user_journey_id END) as completions,
			ROUND(COUNT(DISTINCT CASE WHEN ujp.is_completed = 1 THEN ujp.user_journey_id END) * 100.0 /
				NULLIF(COUNT(DISTINCT ujp.user_journey_id), 0), 2) as completion_rate,
			AVG(ujp.score) as avg_score
		FROM sections s
		JOIN journey_sections js ON s.id = js.section_id
		LEFT JOIN user_journey_progress ujp ON s.id = ujp.section_id
		LEFT JOIN user_journeys uj ON ujp.user_journey_id = uj.id
		WHERE js.journey_id = ?
		GROUP BY s.id, s.name, s.slug
		ORDER BY js.display_order ASC
	`
		)
		.bind(journeyId)
		.all<SectionCompletionRateRow>();

	return result.results || [];
}

// ============================================================================
// ANALYTICS QUERIES - Mentor Dashboard
// ============================================================================

/**
 * Get mentor performance statistics
 */
export async function getMentorPerformanceStats(
	db: D1Database,
	params: {
		mentorUserId: number;
		startDate?: string;
		endDate?: string;
	}
) {
	const { mentorUserId, startDate, endDate } = params;

	const result = await db
		.prepare(
			`
		SELECT
			COUNT(*) as total_reviews,
			COUNT(CASE WHEN status = 'approved' THEN 1 END) as completed_reviews,
			COUNT(CASE WHEN status = 'in_review' THEN 1 END) as in_progress_reviews,
			COUNT(CASE WHEN status = 'requested' THEN 1 END) as pending_reviews,
			AVG(turnaround_hours) as avg_turnaround_hours,
			AVG(CASE WHEN claimed_at IS NOT NULL
				THEN (julianday(claimed_at) - julianday(requested_at)) * 24
				END) as avg_response_hours
		FROM section_reviews
		WHERE mentor_user_id = ?
		${startDate ? 'AND requested_at >= ?' : ''}
		${endDate ? 'AND requested_at <= ?' : ''}
	`
		)
		.bind(mentorUserId, ...(startDate && endDate ? [startDate, endDate] : startDate ? [startDate] : endDate ? [endDate] : []))
		.first<MentorPerformanceStatsRow>();

	return result;
}

/**
 * Get mentor ratings breakdown
 */
export async function getMentorRatingsBreakdown(
	db: D1Database,
	params: {
		mentorUserId: number;
	}
) {
	const { mentorUserId } = params;

	const result = await db
		.prepare(
			`
		SELECT
			COUNT(*) as total_ratings,
			AVG(overall_rating) as avg_overall_rating,
			AVG(helpfulness_rating) as avg_helpfulness_rating,
			AVG(timeliness_rating) as avg_timeliness_rating,
			AVG(communication_rating) as avg_communication_rating,
			COUNT(CASE WHEN would_recommend = 1 THEN 1 END) * 100.0 / COUNT(*) as recommend_percentage,
			COUNT(CASE WHEN overall_rating = 5 THEN 1 END) as five_star_count,
			COUNT(CASE WHEN overall_rating = 4 THEN 1 END) as four_star_count,
			COUNT(CASE WHEN overall_rating = 3 THEN 1 END) as three_star_count,
			COUNT(CASE WHEN overall_rating = 2 THEN 1 END) as two_star_count,
			COUNT(CASE WHEN overall_rating = 1 THEN 1 END) as one_star_count
		FROM mentor_ratings
		WHERE mentor_user_id = ?
	`
		)
		.bind(mentorUserId)
		.first<MentorRatingsBreakdownRow>();

	return result;
}

/**
 * Get mentor earnings summary
 */
export async function getMentorEarningsSummary(
	db: D1Database,
	params: {
		mentorUserId: number;
		startDate?: string;
		endDate?: string;
	}
) {
	const { mentorUserId, startDate, endDate } = params;

	const result = await db
		.prepare(
			`
		SELECT
			SUM(mentor_amount) as total_earnings,
			SUM(CASE WHEN transaction_type = 'review_fee' THEN mentor_amount ELSE 0 END) as review_earnings,
			SUM(CASE WHEN transaction_type = 'revenue_share' THEN mentor_amount ELSE 0 END) as revenue_share_earnings,
			SUM(CASE WHEN transaction_type = 'bonus' THEN mentor_amount ELSE 0 END) as bonus_earnings,
			SUM(CASE WHEN status = 'pending' THEN mentor_amount ELSE 0 END) as pending_amount,
			SUM(CASE WHEN status = 'paid_out' THEN mentor_amount ELSE 0 END) as paid_out_amount,
			COUNT(*) as total_transactions
		FROM mentor_transactions
		WHERE mentor_user_id = ?
		${startDate ? 'AND transaction_date >= ?' : ''}
		${endDate ? 'AND transaction_date <= ?' : ''}
	`
		)
		.bind(mentorUserId, ...(startDate && endDate ? [startDate, endDate] : startDate ? [startDate] : endDate ? [endDate] : []))
		.first<MentorEarningsSummaryRow>();

	return result;
}

/**
 * Get mentor activity timeline
 */
export async function getMentorActivityTimeline(
	db: D1Database,
	params: {
		mentorUserId: number;
		days?: number;
	}
) {
	const { mentorUserId, days = 30 } = params;

	const result = await db
		.prepare(
			`
		SELECT
			date(requested_at) as date,
			COUNT(*) as reviews_received,
			COUNT(CASE WHEN claimed_at IS NOT NULL THEN 1 END) as reviews_claimed,
			COUNT(CASE WHEN reviewed_at IS NOT NULL THEN 1 END) as reviews_completed,
			AVG(turnaround_hours) as avg_turnaround_hours
		FROM section_reviews
		WHERE mentor_user_id = ?
		  AND requested_at >= date('now', '-' || ? || ' days')
		GROUP BY date(requested_at)
		ORDER BY date ASC
	`
		)
		.bind(mentorUserId, days)
		.all();

	return result.results;
}

// ============================================================================
// ANALYTICS QUERIES - Platform Admin Dashboard
// ============================================================================

/**
 * Get platform overview statistics
 */
export async function getPlatformOverviewStats(db: D1Database) {
	const result = await db
		.prepare(
			`
		SELECT
			(SELECT COUNT(*) FROM users) as total_users,
			(SELECT COUNT(*) FROM users WHERE created_at >= date('now', '-7 days')) as new_users_7d,
			(SELECT COUNT(*) FROM users WHERE created_at >= date('now', '-30 days')) as new_users_30d,
			(SELECT COUNT(*) FROM journeys WHERE is_active = 1) as active_journeys,
			(SELECT COUNT(*) FROM journeys) as total_journeys,
			(SELECT COUNT(DISTINCT user_id) FROM user_journeys WHERE status = 'active') as active_journey_users,
			(SELECT COUNT(*) FROM user_journeys) as total_enrollments,
			(SELECT COUNT(*) FROM user_journeys WHERE status = 'completed') as completed_enrollments,
			(SELECT COUNT(*) FROM mentor_profiles WHERE is_active = 1) as active_mentors,
			(SELECT COUNT(*) FROM mentor_profiles) as total_mentors,
			(SELECT COUNT(*) FROM mentor_applications WHERE status = 'pending') as pending_mentor_applications,
			(SELECT COUNT(*) FROM section_reviews WHERE status IN ('requested', 'in_review')) as pending_reviews,
			(SELECT SUM(total_earnings) FROM mentor_profiles) as total_mentor_earnings,
			(SELECT COUNT(*) FROM section_reviews WHERE reviewed_at >= date('now', '-7 days')) as reviews_completed_7d,
			(SELECT AVG(overall_rating) FROM mentor_ratings) as average_rating
	`
		)
		.first<PlatformOverviewStatsRow>();

	return result;
}

/**
 * Get daily active users (DAU)
 */
export async function getDailyActiveUsers(
	db: D1Database,
	params: {
		days?: number;
	}
) {
	const { days = 30 } = params;

	const result = await db
		.prepare(
			`
		SELECT
			date(created_at) as date,
			COUNT(DISTINCT user_id) as active_users
		FROM analytics_events
		WHERE created_at >= date('now', '-' || ? || ' days')
		  AND event_category = 'user_action'
		  AND user_id IS NOT NULL
		GROUP BY date(created_at)
		ORDER BY date ASC
	`
		)
		.bind(days)
		.all();

	return result.results;
}

/**
 * Get journey enrollment funnel
 */
export async function getEnrollmentFunnel(
	db: D1Database,
	params: {
		journeyId?: number;
		startDate?: string;
		endDate?: string;
	}
) {
	const { journeyId, startDate, endDate } = params;

	const conditions = [];
	const bindings = [];

	if (journeyId) {
		conditions.push('journey_id = ?');
		bindings.push(journeyId);
	}
	if (startDate) {
		conditions.push('created_at >= ?');
		bindings.push(startDate);
	}
	if (endDate) {
		conditions.push('created_at <= ?');
		bindings.push(endDate);
	}

	const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

	const result = await db
		.prepare(
			`
		SELECT
			COUNT(DISTINCT CASE WHEN event_type = 'journey_view' THEN session_id END) as views,
			COUNT(DISTINCT CASE WHEN event_type = 'enrollment' THEN user_id END) as enrollments,
			COUNT(DISTINCT CASE WHEN event_type = 'section_start' THEN user_id END) as started_sections,
			COUNT(DISTINCT CASE WHEN event_type = 'section_complete' THEN user_id END) as completed_sections,
			COUNT(DISTINCT CASE WHEN event_type = 'journey_complete' THEN user_id END) as journey_completions
		FROM analytics_events
		${whereClause}
	`
		)
		.bind(...bindings)
		.first<EnrollmentFunnelRow>();

	// Calculate conversion rates
	if (result) {
		const views = result.views ?? 0;
		const enrollments = result.enrollments ?? 0;
		const startedSections = result.started_sections ?? 0;
		const journeyCompletions = result.journey_completions ?? 0;
		return {
			views,
			enrollments,
			started_sections: startedSections,
			completed_sections: result.completed_sections ?? 0,
			journey_completions: journeyCompletions,
			view_to_enrollment_rate: views ? (enrollments / views) * 100 : 0,
			enrollment_to_active_rate: enrollments
				? (startedSections / enrollments) * 100
				: 0,
			active_to_completion_rate: startedSections
				? (journeyCompletions / startedSections) * 100
				: 0
		};
	}

	return result;
}

/**
 * Get top performing journeys
 */
export async function getTopPerformingJourneys(
	db: D1Database,
	params: {
		limit?: number;
		orderBy?: 'enrollments' | 'completions' | 'rating';
	}
) {
	const { limit = 10, orderBy = 'enrollments' } = params;

	const orderByClause =
		orderBy === 'enrollments'
			? 'total_enrollments DESC'
			: orderBy === 'completions'
				? 'completion_rate DESC'
				: 'avg_rating DESC';

	const result = await db
		.prepare(
			`
		SELECT
			j.id as journey_id,
			j.name as journey_name,
			j.slug as journey_slug,
			COUNT(DISTINCT uj.id) as total_enrollments,
			COUNT(DISTINCT CASE WHEN uj.status = 'completed' THEN uj.id END) as completions,
			ROUND(COUNT(DISTINCT CASE WHEN uj.status = 'completed' THEN uj.id END) * 100.0 /
				NULLIF(COUNT(DISTINCT uj.id), 0), 2) as completion_rate,
			AVG(mr.overall_rating) as avg_rating,
			COUNT(DISTINCT sr.id) as total_reviews
		FROM journeys j
		LEFT JOIN user_journeys uj ON j.id = uj.journey_id
		LEFT JOIN section_reviews sr ON uj.id = sr.user_journey_id
		LEFT JOIN mentor_ratings mr ON sr.id = mr.section_review_id
		WHERE j.is_active = 1
		GROUP BY j.id, j.name, j.slug
		ORDER BY ${orderByClause}
		LIMIT ?
	`
		)
		.bind(limit)
		.all();

	return result.results;
}

// ============================================================================
// DAILY STATS COMPUTATION
// ============================================================================

/**
 * Compute and store daily statistics
 * This should be run by a cron job daily
 */
export async function computeDailyStats(db: D1Database, date?: string) {
	const statDate = date || new Date().toISOString().split('T')[0];

	// Calculate all metrics for the day
	const stats = await db
		.prepare(
			`
		SELECT
			-- User metrics
			(SELECT COUNT(*) FROM users WHERE date(created_at) = ?) as new_users,
			(SELECT COUNT(DISTINCT user_id) FROM analytics_events
				WHERE date(created_at) = ? AND event_category = 'user_action') as active_users,

			-- Journey metrics
			(SELECT COUNT(*) FROM analytics_events
				WHERE date(created_at) = ? AND event_type = 'journey_view') as journey_views,
			(SELECT COUNT(*) FROM user_journeys WHERE date(created_at) = ?) as new_enrollments,
			(SELECT COUNT(*) FROM user_journeys
				WHERE date(completed_at) = ? AND status = 'completed') as completed_journeys,

			-- Section metrics
			(SELECT COUNT(*) FROM analytics_events
				WHERE date(created_at) = ? AND event_type = 'section_start') as sections_started,
			(SELECT COUNT(*) FROM analytics_events
				WHERE date(created_at) = ? AND event_type = 'section_complete') as sections_completed,

			-- Mentor metrics
			(SELECT COUNT(*) FROM section_reviews WHERE date(requested_at) = ?) as reviews_requested,
			(SELECT COUNT(*) FROM section_reviews WHERE date(claimed_at) = ?) as reviews_claimed,
			(SELECT COUNT(*) FROM section_reviews WHERE date(reviewed_at) = ?) as reviews_completed,
			(SELECT COUNT(*) FROM mentor_applications WHERE date(applied_at) = ?) as mentor_applications
	`
		)
		.bind(
			statDate,
			statDate,
			statDate,
			statDate,
			statDate,
			statDate,
			statDate,
			statDate,
			statDate,
			statDate,
			statDate
		)
		.first();

	// Insert or update daily stats
	await db
		.prepare(
			`
		INSERT INTO daily_stats (
			stat_date, new_users, active_users, journey_views, new_enrollments,
			completed_journeys, sections_started, sections_completed,
			reviews_requested, reviews_claimed, reviews_completed, mentor_applications
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(stat_date) DO UPDATE SET
			new_users = excluded.new_users,
			active_users = excluded.active_users,
			journey_views = excluded.journey_views,
			new_enrollments = excluded.new_enrollments,
			completed_journeys = excluded.completed_journeys,
			sections_started = excluded.sections_started,
			sections_completed = excluded.sections_completed,
			reviews_requested = excluded.reviews_requested,
			reviews_claimed = excluded.reviews_claimed,
			reviews_completed = excluded.reviews_completed,
			mentor_applications = excluded.mentor_applications,
			updated_at = CURRENT_TIMESTAMP
	`
		)
		.bind(
			statDate,
			stats?.new_users || 0,
			stats?.active_users || 0,
			stats?.journey_views || 0,
			stats?.new_enrollments || 0,
			stats?.completed_journeys || 0,
			stats?.sections_started || 0,
			stats?.sections_completed || 0,
			stats?.reviews_requested || 0,
			stats?.reviews_claimed || 0,
			stats?.reviews_completed || 0,
			stats?.mentor_applications || 0
		)
		.run();

	return stats;
}

/**
 * Get daily stats for a date range
 */
export async function getDailyStats(
	db: D1Database,
	params: {
		startDate: string;
		endDate: string;
	}
) {
	const { startDate, endDate } = params;

	const result = await db
		.prepare(
			`
		SELECT *
		FROM daily_stats
		WHERE stat_date BETWEEN ? AND ?
		ORDER BY stat_date ASC
	`
		)
		.bind(startDate, endDate)
		.all();

	return result.results;
}

// ============================================================================
// CSV EXPORT UTILITIES
// ============================================================================

/**
 * Convert analytics data to CSV format
 */
export function convertToCSV(data: any[], headers?: string[]): string {
	if (!data || data.length === 0) return '';

	// Use provided headers or extract from first row
	const csvHeaders = headers || Object.keys(data[0]);

	// Create CSV content
	const csvRows = [
		csvHeaders.join(','), // Header row
		...data.map((row) => csvHeaders.map((header) => JSON.stringify(row[header] ?? '')).join(','))
	];

	return csvRows.join('\n');
}

/**
 * Export journey analytics to CSV
 */
export async function exportJourneyAnalyticsCSV(
	db: D1Database,
	params: {
		journeyId: number;
		startDate?: string;
		endDate?: string;
	}
): Promise<string> {
	const trends = await getJourneyEngagementTrends(db, {
		journeyId: params.journeyId,
		days: 90
	});

	return convertToCSV(trends as any[]);
}

/**
 * Export mentor performance to CSV
 */
export async function exportMentorPerformanceCSV(
	db: D1Database,
	params: {
		mentorUserId: number;
	}
): Promise<string> {
	const timeline = await getMentorActivityTimeline(db, {
		mentorUserId: params.mentorUserId,
		days: 90
	});

	return convertToCSV(timeline as any[]);
}
