import { redirect, fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

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
			LEFT JOIN personal_info pi ON pi.user_id = u.id AND pi.person_type = 'self'
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

	let sectionData: any = null;

	// Fetch section-specific data
	switch (sectionSlug) {
		case 'credentials':
			const credentialsResult = await db
				.prepare('SELECT * FROM credentials WHERE user_id = ?')
				.bind(reviewUserId)
				.all();
			sectionData = credentialsResult.results || [];
			break;

		case 'contacts':
			const contactsResult = await db
				.prepare('SELECT * FROM key_contacts WHERE user_id = ?')
				.bind(reviewUserId)
				.all();
			sectionData = contactsResult.results || [];
			break;

		case 'legal':
			const legalResult = await db
				.prepare('SELECT * FROM legal_documents WHERE user_id = ?')
				.bind(reviewUserId)
				.all();
			sectionData = legalResult.results || [];
			break;

		case 'financial':
			const financialResult = await db
				.prepare('SELECT * FROM bank_accounts WHERE user_id = ?')
				.bind(reviewUserId)
				.all();
			sectionData = financialResult.results || [];
			break;

		case 'insurance':
			const insuranceResult = await db
				.prepare('SELECT * FROM insurance WHERE user_id = ?')
				.bind(reviewUserId)
				.all();
			sectionData = insuranceResult.results || [];
			break;

		case 'employment':
			const employmentResult = await db
				.prepare('SELECT * FROM employment WHERE user_id = ?')
				.bind(reviewUserId)
				.all();
			sectionData = employmentResult.results || [];
			break;

		case 'physicians':
			const physiciansResult = await db
				.prepare('SELECT * FROM physicians WHERE user_id = ?')
				.bind(reviewUserId)
				.all();
			sectionData = physiciansResult.results || [];
			break;

		case 'vehicles':
			const vehiclesResult = await db
				.prepare('SELECT * FROM vehicles WHERE user_id = ?')
				.bind(reviewUserId)
				.all();
			sectionData = vehiclesResult.results || [];
			break;

		case 'pets':
			const petsResult = await db
				.prepare('SELECT * FROM pets WHERE user_id = ?')
				.bind(reviewUserId)
				.all();
			sectionData = petsResult.results || [];
			break;

		case 'personal':
			sectionData = await db
				.prepare('SELECT * FROM personal_info WHERE user_id = ? AND person_type = ?')
				.bind(reviewUserId, 'self')
				.first();
			break;

		case 'medical':
			sectionData = await db
				.prepare('SELECT * FROM medical_info WHERE user_id = ?')
				.bind(reviewUserId)
				.first();
			break;

		case 'residence':
			sectionData = await db
				.prepare('SELECT * FROM primary_residence WHERE user_id = ?')
				.bind(reviewUserId)
				.first();
			break;

		case 'family':
			const familyMembersResult = await db
				.prepare(
					`SELECT fm.id, fm.user_id, fm.relationship, fm.personal_info_id,
						pi.legal_name, pi.date_of_birth, pi.mobile_phone, pi.email, pi.address, pi.occupation
					FROM family_members fm
					LEFT JOIN personal_info pi ON pi.id = fm.personal_info_id
					WHERE fm.user_id = ?`
				)
				.bind(reviewUserId)
				.all();
			const familyHistoryResult = await db
				.prepare('SELECT * FROM family_history WHERE user_id = ?')
				.bind(reviewUserId)
				.first();
			sectionData = {
				members: familyMembersResult.results || [],
				history: familyHistoryResult || {}
			};
			break;

		case 'final-days':
			sectionData = await db
				.prepare('SELECT * FROM final_days WHERE user_id = ?')
				.bind(reviewUserId)
				.first();
			break;

		case 'after-death':
			sectionData = await db
				.prepare('SELECT * FROM after_death WHERE user_id = ?')
				.bind(reviewUserId)
				.first();
			break;

		case 'funeral':
			sectionData = await db
				.prepare('SELECT * FROM funeral WHERE user_id = ?')
				.bind(reviewUserId)
				.first();
			break;

		case 'obituary':
			sectionData = await db
				.prepare('SELECT * FROM obituary WHERE user_id = ?')
				.bind(reviewUserId)
				.first();
			break;

		case 'conclusion':
			sectionData = await db
				.prepare('SELECT * FROM conclusion WHERE user_id = ?')
				.bind(reviewUserId)
				.first();
			break;

		default:
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
