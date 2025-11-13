import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { MentorApplicationWithUser, JourneyMentorWithDetails } from '$lib/types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	// Require authentication
	if (!locals.user) {
		throw redirect(302, '/login?redirect=/creator/mentors');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	try {
		// Check if user is a creator
		const isCreator = await db
			.prepare('SELECT id FROM journey_creators WHERE creator_user_id = ? LIMIT 1')
			.bind(locals.user.id)
			.first();

		if (!isCreator) {
			throw error(403, 'Only journey creators can access this page');
		}

		// Get pending mentor applications
		const pendingApplicationsResult = await db
			.prepare(
				`
			SELECT ma.*, u.username, u.email
			FROM mentor_applications ma
			JOIN users u ON ma.user_id = u.id
			WHERE ma.status = 'pending'
			ORDER BY ma.applied_at DESC
		`
			)
			.all<MentorApplicationWithUser>();

		const pendingApplications = pendingApplicationsResult.results || [];

		// Get creator's journeys for mentor assignment
		const journeysResult = await db
			.prepare(
				`
			SELECT j.id, j.name, j.slug
			FROM journeys j
			JOIN journey_creators jc ON j.id = jc.journey_id
			WHERE jc.creator_user_id = ? AND j.is_active = 1
			ORDER BY j.name
		`
			)
			.bind(locals.user.id)
			.all<{ id: number; name: string; slug: string }>();

		const creatorJourneys = journeysResult.results || [];

		// Get assigned mentors for creator's journeys
		const assignedMentorsResult = await db
			.prepare(
				`
			SELECT * FROM v_active_journey_mentors
			WHERE journey_id IN (
				SELECT j.id FROM journeys j
				JOIN journey_creators jc ON j.id = jc.journey_id
				WHERE jc.creator_user_id = ?
			)
			ORDER BY journey_name, mentor_username
		`
			)
			.bind(locals.user.id)
			.all<JourneyMentorWithDetails>();

		const assignedMentors = assignedMentorsResult.results || [];

		// Get all approved mentor profiles for assignment
		const availableMentorsResult = await db
			.prepare(
				`
			SELECT mp.*, u.username, u.email
			FROM mentor_profiles mp
			JOIN users u ON mp.user_id = u.id
			WHERE mp.is_active = 1
			ORDER BY mp.average_rating DESC, u.username
		`
			)
			.all();

		const availableMentors = availableMentorsResult.results || [];

		return {
			pendingApplications,
			creatorJourneys,
			assignedMentors,
			availableMentors
		};
	} catch (err) {
		console.error('Error loading creator mentors page:', err);
		throw error(500, 'Failed to load mentor management');
	}
};

export const actions: Actions = {
	approveApplication: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const applicationId = parseInt(formData.get('application_id') as string);
		const notes = formData.get('notes') as string;

		try {
			// Get application
			const application = await db
				.prepare('SELECT * FROM mentor_applications WHERE id = ?')
				.bind(applicationId)
				.first<any>();

			if (!application) {
				return fail(404, { error: 'Application not found' });
			}

			if (application.status !== 'pending') {
				return fail(400, { error: 'Application has already been reviewed' });
			}

			// Update application status
			await db
				.prepare(
					`
				UPDATE mentor_applications
				SET status = 'approved',
				    reviewed_at = CURRENT_TIMESTAMP,
				    reviewed_by = ?,
				    notes = ?
				WHERE id = ?
			`
				)
				.bind(locals.user.id, notes || null, applicationId)
				.run();

			// Create mentor profile
			await db
				.prepare(
					`
				INSERT INTO mentor_profiles (
					user_id, bio, expertise, experience_years, education,
					certifications, availability_hours, is_active
				)
				VALUES (?, ?, ?, ?, ?, ?, ?, 1)
			`
				)
				.bind(
					application.user_id,
					application.bio,
					application.expertise,
					application.experience_years || 0,
					application.education,
					application.certifications,
					application.availability_hours || 10
				)
				.run();

			return { success: true, action: 'approve' };
		} catch (err) {
			console.error('Error approving application:', err);
			return fail(500, { error: 'Failed to approve application' });
		}
	},

	rejectApplication: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const applicationId = parseInt(formData.get('application_id') as string);
		const rejectionReason = formData.get('rejection_reason') as string;
		const notes = formData.get('notes') as string;

		if (!rejectionReason || rejectionReason.trim().length === 0) {
			return fail(400, { error: 'Rejection reason is required' });
		}

		try {
			// Get application
			const application = await db
				.prepare('SELECT status FROM mentor_applications WHERE id = ?')
				.bind(applicationId)
				.first<{ status: string }>();

			if (!application) {
				return fail(404, { error: 'Application not found' });
			}

			if (application.status !== 'pending') {
				return fail(400, { error: 'Application has already been reviewed' });
			}

			// Update application status
			await db
				.prepare(
					`
				UPDATE mentor_applications
				SET status = 'rejected',
				    reviewed_at = CURRENT_TIMESTAMP,
				    reviewed_by = ?,
				    rejection_reason = ?,
				    notes = ?
				WHERE id = ?
			`
				)
				.bind(locals.user.id, rejectionReason, notes || null, applicationId)
				.run();

			return { success: true, action: 'reject' };
		} catch (err) {
			console.error('Error rejecting application:', err);
			return fail(500, { error: 'Failed to reject application' });
		}
	},

	assignMentor: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const journeyId = parseInt(formData.get('journey_id') as string);
		const mentorUserId = parseInt(formData.get('mentor_user_id') as string);
		const reviewRate = parseFloat(formData.get('review_rate') as string);
		const revenueShare = parseFloat(formData.get('revenue_share') as string) || 10;
		const maxReviewsPerWeek = parseInt(formData.get('max_reviews_per_week') as string) || 10;

		// Validation
		if (!journeyId || !mentorUserId) {
			return fail(400, { error: 'Journey and mentor are required' });
		}

		if (isNaN(reviewRate) || reviewRate < 0) {
			return fail(400, { error: 'Valid review rate is required' });
		}

		try {
			// Verify creator owns this journey
			const journey = await db
				.prepare(
					`
				SELECT id FROM journeys j
				JOIN journey_creators jc ON j.id = jc.journey_id
				WHERE j.id = ? AND jc.creator_user_id = ?
			`
				)
				.bind(journeyId, locals.user.id)
				.first();

			if (!journey) {
				return fail(403, { error: 'You do not own this journey' });
			}

			// Check if mentor is already assigned
			const existing = await db
				.prepare(
					'SELECT id FROM journey_mentors WHERE journey_id = ? AND mentor_user_id = ?'
				)
				.bind(journeyId, mentorUserId)
				.first();

			if (existing) {
				return fail(400, { error: 'Mentor is already assigned to this journey' });
			}

			// Assign mentor
			await db
				.prepare(
					`
				INSERT INTO journey_mentors (
					journey_id, mentor_user_id, creator_user_id,
					review_rate, revenue_share_percentage, max_reviews_per_week,
					status
				)
				VALUES (?, ?, ?, ?, ?, ?, 'active')
			`
				)
				.bind(
					journeyId,
					mentorUserId,
					locals.user.id,
					reviewRate,
					revenueShare,
					maxReviewsPerWeek
				)
				.run();

			return { success: true, action: 'assign' };
		} catch (err) {
			console.error('Error assigning mentor:', err);
			return fail(500, { error: 'Failed to assign mentor' });
		}
	},

	removeMentor: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const assignmentId = parseInt(formData.get('assignment_id') as string);

		try {
			// Verify creator owns this journey
			const assignment = await db
				.prepare(
					`
				SELECT jm.* FROM journey_mentors jm
				JOIN journey_creators jc ON jm.journey_id = jc.journey_id
				WHERE jm.id = ? AND jc.creator_user_id = ?
			`
				)
				.bind(assignmentId, locals.user.id)
				.first();

			if (!assignment) {
				return fail(403, { error: 'Assignment not found or unauthorized' });
			}

			// Update status to removed
			await db
				.prepare(
					`
				UPDATE journey_mentors
				SET status = 'removed', updated_at = CURRENT_TIMESTAMP
				WHERE id = ?
			`
				)
				.bind(assignmentId)
				.run();

			return { success: true, action: 'remove' };
		} catch (err) {
			console.error('Error removing mentor:', err);
			return fail(500, { error: 'Failed to remove mentor' });
		}
	}
};
