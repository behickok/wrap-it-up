import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { SectionReviewWithContext, MentorProfile } from '$lib/types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	// Require authentication
	if (!locals.user) {
		throw redirect(302, '/login?redirect=/mentor/dashboard');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	try {
		// Check if user has a mentor profile
		const mentorProfile = await db
			.prepare('SELECT * FROM mentor_profiles WHERE user_id = ? AND is_active = 1')
			.bind(locals.user.id)
			.first<MentorProfile>();

		if (!mentorProfile) {
			throw redirect(302, '/mentor/apply');
		}

		// Get assigned journeys
		const assignedJourneysResult = await db
			.prepare(
				`
			SELECT jm.*, j.name as journey_name, j.slug as journey_slug
			FROM journey_mentors jm
			JOIN journeys j ON jm.journey_id = j.id
			WHERE jm.mentor_user_id = ? AND jm.status = 'active'
			ORDER BY j.name
		`
			)
			.bind(locals.user.id)
			.all();

		const assignedJourneys = assignedJourneysResult.results || [];

		// Get pending reviews (requested, not yet claimed by this mentor)
		const pendingReviewsResult = await db
			.prepare(
				`
			SELECT * FROM v_pending_reviews
			WHERE journey_id IN (
				SELECT journey_id FROM journey_mentors
				WHERE mentor_user_id = ? AND status = 'active'
			) AND (mentor_user_id IS NULL OR mentor_user_id = ?)
			AND status = 'requested'
			ORDER BY requested_at ASC
		`
			)
			.bind(locals.user.id, locals.user.id)
			.all<SectionReviewWithContext>();

		const pendingReviews = pendingReviewsResult.results || [];

		// Get in-progress reviews (claimed by this mentor)
		const inProgressReviewsResult = await db
			.prepare(
				`
			SELECT * FROM v_pending_reviews
			WHERE mentor_user_id = ? AND status = 'in_review'
			ORDER BY claimed_at ASC
		`
			)
			.bind(locals.user.id)
			.all<SectionReviewWithContext>();

		const inProgressReviews = inProgressReviewsResult.results || [];

		// Get completed reviews (last 20)
		const completedReviewsResult = await db
			.prepare(
				`
			SELECT
				sr.*,
				uj.user_id as client_user_id,
				u.username as client_username,
				s.name as section_name,
				j.name as journey_name
			FROM section_reviews sr
			JOIN user_journeys uj ON sr.user_journey_id = uj.id
			JOIN users u ON uj.user_id = u.id
			JOIN sections s ON sr.section_id = s.id
			JOIN journeys j ON uj.journey_id = j.id
			WHERE sr.mentor_user_id = ? AND sr.status IN ('approved', 'changes_requested')
			ORDER BY sr.reviewed_at DESC
			LIMIT 20
		`
			)
			.bind(locals.user.id)
			.all<SectionReviewWithContext>();

		const completedReviews = completedReviewsResult.results || [];

		// Get mentor stats
		const stats = {
			total_reviews: mentorProfile.total_reviews,
			completed_reviews: mentorProfile.completed_reviews,
			average_rating: mentorProfile.average_rating,
			average_turnaround_hours: mentorProfile.average_turnaround_hours,
			total_earnings: mentorProfile.total_earnings,
			pending_count: pendingReviews.length,
			in_progress_count: inProgressReviews.length
		};

		return {
			mentorProfile,
			assignedJourneys,
			pendingReviews,
			inProgressReviews,
			completedReviews,
			stats
		};
	} catch (err: any) {
		if (err.status === 302) throw err; // Allow redirects
		console.error('Error loading mentor dashboard:', err);
		throw error(500, 'Failed to load dashboard');
	}
};
