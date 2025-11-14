import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { SectionReviewWithContext, ReviewComment, SectionField } from '$lib/types';
import { AnalyticsEvents } from '$lib/server/analytics';

export const load: PageServerLoad = async ({ locals, platform, params }) => {
	// Require authentication
	if (!locals.user) {
		throw redirect(302, '/login?redirect=/mentor/reviews/' + params.reviewId);
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	const reviewId = parseInt(params.reviewId);
	if (isNaN(reviewId)) {
		throw error(400, 'Invalid review ID');
	}

	try {
		// Check if user has a mentor profile
		const mentorProfile = await db
			.prepare('SELECT * FROM mentor_profiles WHERE user_id = ? AND is_active = 1')
			.bind(locals.user.id)
			.first();

		if (!mentorProfile) {
			throw redirect(302, '/mentor/apply');
		}

		// Get review with full context
		const review = await db
			.prepare(
				`
			SELECT 
				sr.*,
				uj.user_id as client_user_id,
				uj.journey_id,
				u.username as client_username,
				s.name as section_name,
				s.slug as section_slug,
				j.name as journey_name,
				j.slug as journey_slug
			FROM section_reviews sr
			JOIN user_journeys uj ON sr.user_journey_id = uj.id
			JOIN users u ON uj.user_id = u.id
			JOIN sections s ON sr.section_id = s.id
			JOIN journeys j ON uj.journey_id = j.id
			WHERE sr.id = ?
		`
			)
			.bind(reviewId)
			.first<SectionReviewWithContext>();

		if (!review) {
			throw error(404, 'Review not found');
		}

		// Check if mentor is assigned to this journey
		const mentorAssignment = await db
			.prepare(
				`
			SELECT id FROM journey_mentors
			WHERE journey_id = ? AND mentor_user_id = ? AND status = 'active'
		`
			)
			.bind(review.journey_id, locals.user.id)
			.first();

		if (!mentorAssignment) {
			throw error(403, 'You are not assigned as a mentor for this journey');
		}

		// Get section fields
		const fieldsResult = await db
			.prepare(
				`
			SELECT * FROM section_fields
			WHERE section_id = ?
			ORDER BY display_order ASC
		`
			)
			.bind(review.section_id)
			.all<SectionField>();

		const fields = fieldsResult.results || [];

		// Get client's section data
		const sectionDataResult = await db
			.prepare(
				`
			SELECT field_id, field_value
			FROM user_section_data
			WHERE user_journey_id = ? AND section_id = ?
		`
			)
			.bind(review.user_journey_id, review.section_id)
			.all<{ field_id: number; field_value: string }>();

		const sectionDataMap = new Map<number, string>();
		(sectionDataResult.results || []).forEach((data: { field_id: number; field_value: string }) => {
			sectionDataMap.set(data.field_id, data.field_value);
		});

		// Get review comments
		const commentsResult = await db
			.prepare(
				`
			SELECT rc.*, u.username as author_username
			FROM review_comments rc
			JOIN users u ON rc.author_user_id = u.id
			WHERE rc.section_review_id = ?
			ORDER BY rc.created_at ASC
		`
			)
			.bind(reviewId)
			.all<ReviewComment & { author_username: string }>();

		const comments = commentsResult.results || [];

		return {
			review,
			fields,
			sectionData: sectionDataMap,
			comments,
			mentorProfile
		};
	} catch (err: any) {
		if (err.status) throw err; // Allow redirects and errors
		console.error('Error loading review:', err);
		throw error(500, 'Failed to load review');
	}
};

export const actions: Actions = {
	claimReview: async ({ locals, platform, params }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const reviewId = parseInt(params.reviewId);

		try {
			// Check review status
			const review = await db
				.prepare('SELECT status, user_journey_id, section_id FROM section_reviews WHERE id = ?')
				.bind(reviewId)
				.first<{ status: string; user_journey_id: number; section_id: number }>();

			if (!review) {
				return fail(404, { error: 'Review not found' });
			}

			if (review.status !== 'requested') {
				return fail(400, { error: 'Review has already been claimed or completed' });
			}

			// Get journey_id from user_journey
			const userJourney = await db
				.prepare('SELECT journey_id FROM user_journeys WHERE id = ?')
				.bind(review.user_journey_id)
				.first<{ journey_id: number }>();

			// Claim the review
			await db
				.prepare(
					`
				UPDATE section_reviews
				SET status = 'in_review',
				    mentor_user_id = ?,
				    claimed_at = CURRENT_TIMESTAMP
				WHERE id = ? AND status = 'requested'
			`
				)
				.bind(locals.user.id, reviewId)
				.run();

			// Track review claim event
			if (userJourney) {
				await AnalyticsEvents.reviewClaim(db, {
					userId: locals.user.id,
					journeyId: userJourney.journey_id,
					sectionId: review.section_id,
					metadata: { reviewId }
				}).catch((err) => console.error('Failed to track review claim:', err));
			}

			return { success: true, message: 'Review claimed successfully!' };
		} catch (err) {
			console.error('Error claiming review:', err);
			return fail(500, { error: 'Failed to claim review' });
		}
	},

	addComment: async ({ request, locals, platform, params }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const reviewId = parseInt(params.reviewId);
		const formData = await request.formData();
		const commentText = (formData.get('comment_text') as string)?.trim();
		const fieldId = formData.get('field_id') ? parseInt(formData.get('field_id') as string) : null;
		const commentType = (formData.get('comment_type') as string) || 'feedback';

		if (!commentText || commentText.length === 0) {
			return fail(400, { error: 'Comment text is required' });
		}

		try {
			// Verify mentor owns this review
			const review = await db
				.prepare('SELECT mentor_user_id FROM section_reviews WHERE id = ?')
				.bind(reviewId)
				.first<{ mentor_user_id: number | null }>();

			if (!review || review.mentor_user_id !== locals.user.id) {
				return fail(403, { error: 'Unauthorized to comment on this review' });
			}

			// Add comment
			await db
				.prepare(
					`
				INSERT INTO review_comments (
					section_review_id, field_id, comment_text, comment_type,
					author_user_id, author_role
				)
				VALUES (?, ?, ?, ?, ?, 'mentor')
			`
				)
				.bind(reviewId, fieldId, commentText, commentType, locals.user.id)
				.run();

			return { success: true, message: 'Comment added!' };
		} catch (err) {
			console.error('Error adding comment:', err);
			return fail(500, { error: 'Failed to add comment' });
		}
	},

	completeReview: async ({ request, locals, platform, params }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const reviewId = parseInt(params.reviewId);
		const formData = await request.formData();
		const action = formData.get('action') as string; // 'approve' or 'request_changes'
		const feedback = (formData.get('feedback') as string)?.trim();
		const overallRating = formData.get('overall_rating')
			? parseInt(formData.get('overall_rating') as string)
			: null;

		if (!feedback || feedback.length < 50) {
			return fail(400, { error: 'Feedback must be at least 50 characters' });
		}

		if (action !== 'approve' && action !== 'request_changes') {
			return fail(400, { error: 'Invalid action' });
		}

		const status = action === 'approve' ? 'approved' : 'changes_requested';

		try {
			// Get review to calculate turnaround time
			const review = await db
				.prepare('SELECT claimed_at, mentor_user_id, user_journey_id, section_id FROM section_reviews WHERE id = ?')
				.bind(reviewId)
				.first<{ claimed_at: string; mentor_user_id: number | null; user_journey_id: number; section_id: number }>();

			if (!review || review.mentor_user_id !== locals.user.id) {
				return fail(403, { error: 'Unauthorized to complete this review' });
			}

			// Calculate turnaround time in hours
			const claimedAt = new Date(review.claimed_at);
			const now = new Date();
			const turnaroundHours = (now.getTime() - claimedAt.getTime()) / (1000 * 60 * 60);

			// Get journey_id from user_journey
			const userJourney = await db
				.prepare('SELECT journey_id FROM user_journeys WHERE id = ?')
				.bind(review.user_journey_id)
				.first<{ journey_id: number }>();

			// Complete the review
			await db
				.prepare(
					`
				UPDATE section_reviews
				SET status = ?,
				    mentor_feedback = ?,
				    overall_rating = ?,
				    reviewed_at = CURRENT_TIMESTAMP,
				    turnaround_hours = ?
				WHERE id = ? AND mentor_user_id = ?
			`
				)
				.bind(status, feedback, overallRating, turnaroundHours, reviewId, locals.user.id)
				.run();

			// Update mentor stats
			await db
				.prepare(
					`
				UPDATE mentor_profiles
				SET completed_reviews = completed_reviews + 1,
				    total_reviews = total_reviews + 1
				WHERE user_id = ?
			`
				)
				.bind(locals.user.id)
				.run();

			// Recalculate average turnaround and rating
			const stats = await db
				.prepare(
					`
				SELECT
					AVG(turnaround_hours) as avg_turnaround,
					AVG(overall_rating) as avg_rating
				FROM section_reviews
				WHERE mentor_user_id = ? AND status IN ('approved', 'changes_requested')
				AND turnaround_hours IS NOT NULL
			`
				)
				.bind(locals.user.id)
				.first<{ avg_turnaround: number; avg_rating: number }>();

			if (stats) {
				await db
					.prepare(
						`
					UPDATE mentor_profiles
					SET average_turnaround_hours = ?,
					    average_rating = ?
					WHERE user_id = ?
				`
					)
					.bind(stats.avg_turnaround || 0, stats.avg_rating || 0, locals.user.id)
					.run();
			}

			// Track review completion event
			if (userJourney) {
				await AnalyticsEvents.reviewComplete(db, {
					userId: locals.user.id,
					journeyId: userJourney.journey_id,
					sectionId: review.section_id,
					metadata: { reviewId, turnaroundHours }
				}).catch((err) => console.error('Failed to track review completion:', err));
			}

			throw redirect(303, '/mentor/dashboard');
		} catch (err: any) {
			if (err.status === 303) throw err; // Allow redirect
			console.error('Error completing review:', err);
			return fail(500, { error: 'Failed to complete review' });
		}
	}
};
