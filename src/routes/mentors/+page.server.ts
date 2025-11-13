/**
 * Mentor Discovery Page
 * Browse and discover mentors
 */

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, url }) => {
	const db = platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	// Get filter parameters
	const specializationFilter = url.searchParams.get('specialization');
	const sortBy = url.searchParams.get('sort') || 'rating'; // rating, reviews, name
	const minRating = parseFloat(url.searchParams.get('min_rating') || '0');

	// Load all specializations for filter
	const specializations = await db
		.prepare('SELECT * FROM mentor_specializations WHERE is_active = 1 ORDER BY name')
		.all();

	// Build mentor query with filters
	let mentorQuery = `
		SELECT
			mp.user_id,
			u.username,
			u.email,
			mp.bio,
			mp.specialties,
			mp.average_rating,
			mp.total_reviews_completed,
			mp.created_at,
			GROUP_CONCAT(DISTINCT ms.name) as specialization_names,
			GROUP_CONCAT(DISTINCT ms.icon) as specialization_icons,
			GROUP_CONCAT(DISTINCT ms.color) as specialization_colors,
			MAX(CASE WHEN msm.is_primary = 1 THEN ms.name END) as primary_specialization,
			MAX(CASE WHEN msm.is_primary = 1 THEN ms.icon END) as primary_icon
		FROM mentor_profiles mp
		INNER JOIN users u ON mp.user_id = u.id
		LEFT JOIN mentor_specialization_map msm ON mp.user_id = msm.mentor_user_id
		LEFT JOIN mentor_specializations ms ON msm.specialization_id = ms.id AND ms.is_active = 1
		WHERE mp.approval_status = 'approved' AND mp.is_available = 1
	`;

	const params: any[] = [];

	// Filter by specialization
	if (specializationFilter) {
		mentorQuery += ` AND EXISTS (
			SELECT 1 FROM mentor_specialization_map msm2
			INNER JOIN mentor_specializations ms2 ON msm2.specialization_id = ms2.id
			WHERE msm2.mentor_user_id = mp.user_id AND ms2.slug = ?
		)`;
		params.push(specializationFilter);
	}

	mentorQuery += `
		GROUP BY mp.user_id, u.username, u.email, mp.bio, mp.specialties,
		         mp.average_rating, mp.total_reviews_completed, mp.created_at
	`;

	// Filter by minimum rating
	if (minRating > 0) {
		mentorQuery += ` HAVING mp.average_rating >= ?`;
		params.push(minRating);
	}

	// Sort
	switch (sortBy) {
		case 'reviews':
			mentorQuery += ` ORDER BY mp.total_reviews_completed DESC, mp.average_rating DESC`;
			break;
		case 'name':
			mentorQuery += ` ORDER BY u.username ASC`;
			break;
		case 'rating':
		default:
			mentorQuery += ` ORDER BY mp.average_rating DESC, mp.total_reviews_completed DESC`;
			break;
	}

	const mentors = await db.prepare(mentorQuery).bind(...params).all();

	// Process mentors to format specializations
	const processedMentors = (mentors.results || []).map((mentor: any) => ({
		...mentor,
		specializations: mentor.specialization_names
			? mentor.specialization_names.split(',').map((name: string, idx: number) => ({
					name,
					icon: mentor.specialization_icons?.split(',')[idx] || '📚',
					color: mentor.specialization_colors?.split(',')[idx] || '#666666'
				}))
			: []
	}));

	// Get statistics
	const stats = await db
		.prepare(
			`SELECT
				COUNT(*) as total_mentors,
				AVG(average_rating) as avg_rating,
				SUM(total_reviews_completed) as total_reviews
			FROM mentor_profiles
			WHERE approval_status = 'approved' AND is_available = 1`
		)
		.first();

	return {
		mentors: processedMentors,
		specializations: specializations.results || [],
		filters: {
			specialization: specializationFilter,
			sortBy,
			minRating
		},
		stats: stats || { total_mentors: 0, avg_rating: 0, total_reviews: 0 }
	};
};
