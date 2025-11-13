import { redirect, fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSectionDataBySlugs } from '$lib/server/genericSectionData';
import {
	loadLegacySectionData,
	LEGACY_SECTION_SLUGS,
	type LegacySectionSlug
} from '$lib/server/legacySectionLoaders';

export const load: PageServerLoad = async ({ platform, locals, params }) => {
	const userId = locals.user?.id;
	const reviewId = Number(params.reviewId);

	if (!userId) {
		throw redirect(303, '/login');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw new Error('Database not available');
	}

	// Check if user is a mentor
	const mentor = await db
		.prepare('SELECT * FROM mentors WHERE user_id = ?')
		.bind(userId)
		.first();

	if (!mentor) {
		throw redirect(303, '/');
	}

	// Get review details
	const review = await db
		.prepare(
			`SELECT
				mr.id,
				mr.user_journey_id,
				mr.section_id,
				mr.mentor_id,
				mr.status,
				mr.submitted_at,
				mr.notes,
				mr.feedback,
				mr.completed_at,
				s.name as section_name,
				s.slug as section_slug,
				s.description as section_description,
				j.name as journey_name,
				j.slug as journey_slug,
				j.icon as journey_icon,
				uj.user_id as review_user_id,
				u.email as user_email,
				pi.legal_name as user_name,
				st.slug as tier_slug
			FROM mentor_reviews mr
			JOIN user_journeys uj ON mr.user_journey_id = uj.id
			JOIN journeys j ON uj.journey_id = j.id
			JOIN sections s ON mr.section_id = s.id
			JOIN users u ON uj.user_id = u.id
			JOIN service_tiers st ON uj.tier_id = st.id
			WHERE mr.id = ?
				AND (mr.mentor_id = ? OR mr.mentor_id IS NULL OR mr.status = 'pending')`
		)
		.bind(reviewId, mentor.id)
		.first();

	if (!review) {
		throw redirect(303, '/mentor/dashboard');
	}

	// Load user's section data based on section slug
	const reviewUserId = (review as any).review_user_id;
	const sectionSlug = (review as any).section_slug;

	const personalSlug: LegacySectionSlug = 'personal';
	const isLegacySlug = (slug: string): slug is LegacySectionSlug =>
		LEGACY_SECTION_SLUGS.includes(slug as LegacySectionSlug);

	const personalMap = await getSectionDataBySlugs(db, reviewUserId, [personalSlug]);
	const personalRecord = personalMap[personalSlug];
	const personalData = personalRecord ? personalRecord.data : await loadLegacySectionData(db, reviewUserId, personalSlug);
	const userName = typeof personalData?.legal_name === 'string' ? personalData.legal_name : (review as any).user_email;
	(review as any).user_name = userName;

	let sectionData: any = null;
	if (isLegacySlug(sectionSlug)) {
		const genericMap = await getSectionDataBySlugs(db, reviewUserId, [sectionSlug]);
		const record = genericMap[sectionSlug];
		sectionData = record ? record.data : await loadLegacySectionData(db, reviewUserId, sectionSlug);
	} else {
		sectionData = null;
	}

	return {
		mentor,
		review,
		sectionData
	};
};

export const actions: Actions = {
	submitFeedback: async ({ request, platform, locals, params }) => {
		const userId = locals.user?.id;
		const reviewId = Number(params.reviewId);

		if (!userId) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		// Check if user is a mentor
		const mentor = await db
			.prepare('SELECT * FROM mentors WHERE user_id = ?')
			.bind(userId)
			.first();

		if (!mentor) {
			return fail(403, { error: 'Not authorized as mentor' });
		}

		const formData = await request.formData();
		const feedback = formData.get('feedback') as string;

		if (!feedback || feedback.trim().length === 0) {
			return fail(400, { error: 'Feedback is required' });
		}

		// Update review with feedback and mark as completed
		await db
			.prepare(
				`UPDATE mentor_reviews
				SET feedback = ?, status = 'completed', completed_at = datetime('now')
				WHERE id = ? AND mentor_id = ?`
			)
			.bind(feedback, reviewId, mentor.id)
			.run();

		throw redirect(303, '/mentor/dashboard');
	},

	requestChanges: async ({ request, platform, locals, params }) => {
		const userId = locals.user?.id;
		const reviewId = Number(params.reviewId);

		if (!userId) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		// Check if user is a mentor
		const mentor = await db
			.prepare('SELECT * FROM mentors WHERE user_id = ?')
			.bind(userId)
			.first();

		if (!mentor) {
			return fail(403, { error: 'Not authorized as mentor' });
		}

		const formData = await request.formData();
		const feedback = formData.get('feedback') as string;

		if (!feedback || feedback.trim().length === 0) {
			return fail(400, { error: 'Feedback is required when requesting changes' });
		}

		// Update review with feedback but keep in_review status
		await db
			.prepare(
				`UPDATE mentor_reviews
				SET feedback = ?
				WHERE id = ? AND mentor_id = ?`
			)
			.bind(feedback, reviewId, mentor.id)
			.run();

		return { success: true, message: 'Feedback saved. User can still update their section.' };
	}
};
