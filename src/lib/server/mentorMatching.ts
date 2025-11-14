/**
 * Mentor Matching Algorithm
 * Intelligently match mentors to review requests based on multiple factors
 */

import type { D1Database } from '@cloudflare/workers-types';

export interface MatchCriteria {
	sectionId?: number;
	journeyId?: number;
	clientUserId?: number;
	sectionType?: string;
	preferredMentorId?: number;
}

export interface MentorMatch {
	mentorUserId: number;
	mentorName: string;
	matchScore: number;
	matchReasons: string[];
	specializations: string[];
	averageRating: number;
	totalReviews: number;
	isAvailable: boolean;
	isPrimaryMatch: boolean;
}

/**
 * Find best mentor matches for a review request
 */
export async function findBestMentorMatches(
	db: D1Database,
	criteria: MatchCriteria,
	options: { limit?: number; minScore?: number } = {}
): Promise<MentorMatch[]> {
	const limit = options.limit || 5;
	const minScore = options.minScore || 0;

	// Step 1: Get all eligible mentors (approved, available, not blocked)
	const eligibleMentors = await getEligibleMentors(db, criteria);

	// Step 2: Calculate match score for each mentor
	const scoredMentors: MentorMatch[] = [];

	for (const mentor of eligibleMentors) {
		const score = await calculateMatchScore(db, mentor, criteria);

		if (score.totalScore >= minScore) {
			scoredMentors.push({
				mentorUserId: mentor.user_id,
				mentorName: mentor.username,
				matchScore: score.totalScore,
				matchReasons: score.reasons,
				specializations: mentor.specializations || [],
				averageRating: mentor.average_rating || 0,
				totalReviews: mentor.total_reviews_completed || 0,
				isAvailable: mentor.is_available === 1,
				isPrimaryMatch: false // Will be set for top match
			});
		}
	}

	// Step 3: Sort by score (descending) and return top matches
	scoredMentors.sort((a, b) => b.matchScore - a.matchScore);

	const topMatches = scoredMentors.slice(0, limit);

	// Mark the top match as primary
	if (topMatches.length > 0) {
		topMatches[0].isPrimaryMatch = true;
	}

	return topMatches;
}

/**
 * Get all mentors eligible for assignment
 */
async function getEligibleMentors(db: D1Database, criteria: MatchCriteria): Promise<any[]> {
	// Get blocked mentor IDs if client specified
	let blockedMentorIds: number[] = [];
	if (criteria.clientUserId) {
		const clientPrefs = await db
			.prepare('SELECT blocked_mentor_ids FROM client_mentor_preferences WHERE user_id = ?')
			.bind(criteria.clientUserId)
			.first<{ blocked_mentor_ids: string | null }>();

		if (clientPrefs?.blocked_mentor_ids) {
			try {
				blockedMentorIds = JSON.parse(clientPrefs.blocked_mentor_ids);
			} catch (e) {
				blockedMentorIds = [];
			}
		}
	}

	// Build query to get eligible mentors
	let query = `
		SELECT
			mp.user_id,
			u.username,
			mp.bio,
			mp.specialties,
			mp.average_rating,
			mp.total_reviews_completed,
			mp.is_available,
			mp.hourly_rate,
			GROUP_CONCAT(DISTINCT ms.name) as specializations,
			COUNT(DISTINCT ma.id) as availability_slots,
			COUNT(DISTINCT mbd.id) as active_blocks
		FROM mentor_profiles mp
		INNER JOIN users u ON mp.user_id = u.id
		LEFT JOIN mentor_specialization_map msm ON mp.user_id = msm.mentor_user_id
		LEFT JOIN mentor_specializations ms ON msm.specialization_id = ms.id AND ms.is_active = 1
		LEFT JOIN mentor_availability ma ON mp.user_id = ma.mentor_user_id AND ma.is_active = 1
		LEFT JOIN mentor_blocked_dates mbd ON mp.user_id = mbd.mentor_user_id
			AND mbd.is_active = 1
			AND DATE('now') BETWEEN mbd.start_date AND mbd.end_date
		WHERE mp.approval_status = 'approved'
			AND mp.is_available = 1
	`;

	const params: any[] = [];

	// Exclude blocked mentors
	if (blockedMentorIds.length > 0) {
		query += ` AND mp.user_id NOT IN (${blockedMentorIds.map(() => '?').join(',')})`;
		params.push(...blockedMentorIds);
	}

	query += `
		GROUP BY mp.user_id, u.username, mp.bio, mp.specialties, mp.average_rating,
		         mp.total_reviews_completed, mp.is_available, mp.hourly_rate
		HAVING active_blocks = 0
	`;

	const result = await db.prepare(query).bind(...params).all();

	return result.results || [];
}

/**
 * Calculate match score for a mentor
 */
async function calculateMatchScore(
	db: D1Database,
	mentor: any,
	criteria: MatchCriteria
): Promise<{ totalScore: number; reasons: string[] }> {
	let score = 0;
	const reasons: string[] = [];

	// Base score: All eligible mentors start at 50
	score += 50;

	// 1. Preferred Mentor Match (highest priority) +50
	if (criteria.preferredMentorId && mentor.user_id === criteria.preferredMentorId) {
		score += 50;
		reasons.push('Your preferred mentor');
		return { totalScore: 100, reasons }; // Return immediately for preferred mentor
	}

	// 2. Specialization Match +30
	if (criteria.sectionType && mentor.specializations) {
		const mentorSpecs = mentor.specializations.toLowerCase();
		const sectionType = criteria.sectionType.toLowerCase();

		// Direct match
		if (mentorSpecs.includes(sectionType)) {
			score += 30;
			reasons.push(`Specializes in ${criteria.sectionType}`);
		}
		// Related specializations (you can expand this mapping)
		else if (
			(sectionType.includes('tech') && mentorSpecs.includes('technical')) ||
			(sectionType.includes('career') && mentorSpecs.includes('career')) ||
			(sectionType.includes('creative') && mentorSpecs.includes('creative'))
		) {
			score += 20;
			reasons.push('Related expertise');
		}
	}

	// 3. Rating Score +0 to +20
	if (mentor.average_rating && mentor.average_rating > 0) {
		const ratingScore = Math.round((mentor.average_rating / 5) * 20);
		score += ratingScore;
		if (mentor.average_rating >= 4.5) {
			reasons.push(`Highly rated (${mentor.average_rating.toFixed(1)}⭐)`);
		}
	}

	// 4. Experience Score +0 to +15
	if (mentor.total_reviews_completed && mentor.total_reviews_completed > 0) {
		const experienceScore = Math.min(Math.floor(mentor.total_reviews_completed / 10) * 3, 15);
		score += experienceScore;
		if (mentor.total_reviews_completed >= 20) {
			reasons.push(`Experienced (${mentor.total_reviews_completed} reviews)`);
		}
	}

	// 5. Availability +10
	if (mentor.availability_slots && mentor.availability_slots > 0) {
		score += 10;
		reasons.push('Has availability set');
	}

	// 6. No Current Blocks +5
	if (!mentor.active_blocks || mentor.active_blocks === 0) {
		score += 5;
	}

	// 7. Past Success with Client +25
	if (criteria.clientUserId) {
		const pastMatches = await db
			.prepare(
				`SELECT AVG(client_rating) as avg_rating, COUNT(*) as match_count
				FROM mentor_match_history
				WHERE mentor_user_id = ? AND client_user_id = ? AND client_rating >= 4`
			)
			.bind(mentor.user_id, criteria.clientUserId)
			.first<{ avg_rating: number | null; match_count: number | null }>();

		if (pastMatches && (pastMatches.match_count ?? 0) > 0) {
			score += 25;
			reasons.push('Successfully worked together before');
		}
	}

	// 8. Journey-specific Experience +10
	if (criteria.journeyId) {
		const journeyExperience = await db
			.prepare(
				`SELECT COUNT(*) as review_count
				FROM section_reviews sr
				INNER JOIN user_journey_progress ujp ON sr.user_journey_id = ujp.id
				WHERE sr.mentor_user_id = ? AND ujp.journey_id = ? AND sr.status = 'completed'`
			)
			.bind(mentor.user_id, criteria.journeyId)
			.first<{ review_count: number | null }>();

		if (journeyExperience && (journeyExperience.review_count ?? 0) > 0) {
			score += 10;
			reasons.push('Experience with this journey');
		}
	}

	// Ensure reasons list isn't empty
	if (reasons.length === 0) {
		reasons.push('Available mentor');
	}

	return { totalScore: Math.min(score, 100), reasons };
}

/**
 * Record a successful match for learning
 */
export async function recordMatch(
	db: D1Database,
	data: {
		reviewId: number;
		mentorUserId: number;
		clientUserId: number;
		journeyId: number;
		sectionId: number;
		matchScore?: number;
		matchReasons?: string[];
	}
): Promise<void> {
	try {
		await db
			.prepare(
				`INSERT INTO mentor_match_history (
					review_id, mentor_user_id, client_user_id, journey_id, section_id,
					match_score, match_reasons
				) VALUES (?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(
				data.reviewId,
				data.mentorUserId,
				data.clientUserId,
				data.journeyId,
				data.sectionId,
				data.matchScore || null,
				data.matchReasons ? JSON.stringify(data.matchReasons) : null
			)
			.run();
	} catch (err) {
		console.error('Failed to record match history:', err);
		// Don't throw - this is optional tracking
	}
}

/**
 * Update match history with final rating
 */
export async function updateMatchRating(
	db: D1Database,
	reviewId: number,
	clientRating: number,
	wouldWorkAgain: boolean
): Promise<void> {
	try {
		await db
			.prepare(
				`UPDATE mentor_match_history
				SET client_rating = ?, would_work_again = ?
				WHERE review_id = ?`
			)
			.bind(clientRating, wouldWorkAgain ? 1 : 0, reviewId)
			.run();
	} catch (err) {
		console.error('Failed to update match rating:', err);
	}
}

/**
 * Check if mentor is available (has availability and not blocked)
 */
export async function isMentorAvailable(db: D1Database, mentorUserId: number): Promise<boolean> {
	// Check for active blocked dates
	const blocked = await db
		.prepare(
			`SELECT COUNT(*) as count FROM mentor_blocked_dates
			WHERE mentor_user_id = ? AND is_active = 1
			AND DATE('now') BETWEEN start_date AND end_date`
		)
		.bind(mentorUserId)
		.first<{ count: number }>();

	if (blocked && blocked.count > 0) {
		return false;
	}

	// Check if mentor has any availability set
	const availability = await db
		.prepare(
			`SELECT COUNT(*) as count FROM mentor_availability
			WHERE mentor_user_id = ? AND is_active = 1`
		)
		.bind(mentorUserId)
		.first<{ count: number }>();

	return (availability?.count ?? 0) > 0;
}

/**
 * Get client's mentor preferences
 */
export async function getClientPreferences(
	db: D1Database,
	clientUserId: number
): Promise<{
	preferredMentorId?: number;
	blockedMentorIds: number[];
	preferredSpecializations: number[];
} | null> {
	const prefs = await db
		.prepare('SELECT * FROM client_mentor_preferences WHERE user_id = ?')
		.bind(clientUserId)
		.first<{
			preferred_mentor_id: number | null;
			blocked_mentor_ids: string | null;
			preferred_specializations: string | null;
		}>();

	if (!prefs) {
		return null;
	}

	let blockedMentorIds: number[] = [];
	let preferredSpecializations: number[] = [];

	try {
		if (prefs.blocked_mentor_ids) {
			blockedMentorIds = JSON.parse(prefs.blocked_mentor_ids);
		}
		if (prefs.preferred_specializations) {
			preferredSpecializations = JSON.parse(prefs.preferred_specializations);
		}
	} catch (e) {
		console.error('Failed to parse preferences:', e);
	}

	return {
		preferredMentorId: prefs.preferred_mentor_id || undefined,
		blockedMentorIds,
		preferredSpecializations
	};
}
