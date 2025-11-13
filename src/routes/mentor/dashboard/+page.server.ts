import { redirect, fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSectionDataBySlugs } from '$lib/server/genericSectionData';
import { loadLegacySectionData } from '$lib/server/legacySectionLoaders';
import type { LegacySectionSlug } from '$lib/server/legacySectionLoaders';

export const load: PageServerLoad = async ({ platform, locals }) => {
	const userId = locals.user?.id;

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

	// Get all reviews assigned to this mentor (pending and in_review)
	const reviewsResult = await db
		.prepare(
			`SELECT
				mr.id,
				mr.user_journey_id,
				mr.section_id,
				mr.status,
				mr.submitted_at,
				mr.notes,
				s.name as section_name,
				s.slug as section_slug,
				j.name as journey_name,
				j.slug as journey_slug,
				j.icon as journey_icon,
				u.email as user_email,
				uj.user_id as review_user_id
			FROM mentor_reviews mr
			JOIN user_journeys uj ON mr.user_journey_id = uj.id
			JOIN journeys j ON uj.journey_id = j.id
			JOIN sections s ON mr.section_id = s.id
			JOIN users u ON uj.user_id = u.id
			WHERE (mr.mentor_id = ? OR mr.mentor_id IS NULL)
				AND mr.status IN ('pending', 'in_review')
			ORDER BY
				CASE mr.status
					WHEN 'in_review' THEN 1
					WHEN 'pending' THEN 2
				END,
				mr.submitted_at ASC`
		)
		.bind(mentor.id)
		.all();

	// Get completed reviews for stats
	const completedCountResult = await db
		.prepare(
			`SELECT COUNT(*) as count
			FROM mentor_reviews
			WHERE mentor_id = ? AND status = 'completed'`
		)
		.bind(mentor.id)
		.first();

	const reviews = reviewsResult.results || [];

	const userIds = Array.from(
		new Set(
			reviews
				.map((review: any) => review.review_user_id)
				.filter((id): id is number => typeof id === 'number')
		)
	);

	const personalSlug: LegacySectionSlug = 'personal';
	const userNameMap = new Map<number, string>();

	await Promise.all(
		userIds.map(async (id) => {
			const genericMap = await getSectionDataBySlugs(db, id, [personalSlug]);
			const personalRecord = genericMap[personalSlug];
			const data = personalRecord ? personalRecord.data : await loadLegacySectionData(db, id, personalSlug);
			const name = typeof data?.legal_name === 'string' ? data.legal_name : null;
			userNameMap.set(id, name || '');
		})
	);

	const decoratedReviews = reviews.map((review: any) => ({
		...review,
		user_name: userNameMap.get(review.review_user_id) || review.user_email
	}));

	return {
		mentor,
		reviews: decoratedReviews,
		completedCount: (completedCountResult as any)?.count || 0
	};
};

export const actions: Actions = {
	claimReview: async ({ request, platform, locals }) => {
		const userId = locals.user?.id;
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
		const reviewId = Number(formData.get('review_id'));

		// Update review to assign mentor and change status to in_review
		await db
			.prepare(
				`UPDATE mentor_reviews
				SET mentor_id = ?, status = 'in_review'
				WHERE id = ? AND status = 'pending'`
			)
			.bind(mentor.id, reviewId)
			.run();

		return { success: true };
	}
};
