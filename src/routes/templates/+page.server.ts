/**
 * Journey Template Library
 * Browse and discover journey templates
 */

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, url }) => {
	const db = platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	// Get filter parameters
	const category = url.searchParams.get('category');
	const sortBy = url.searchParams.get('sort') || 'downloads'; // downloads, rating, recent
	const searchQuery = url.searchParams.get('q');

	// Build query
	let query = `
		SELECT
			jt.*,
			u.username as creator_name,
			j.name as journey_name,
			j.description as journey_description,
			COUNT(DISTINCT s.id) as section_count
		FROM journey_templates jt
		INNER JOIN users u ON jt.creator_user_id = u.id
		INNER JOIN journeys j ON jt.source_journey_id = j.id
		LEFT JOIN sections s ON j.id = s.journey_id AND s.is_active = 1
		WHERE jt.is_public = 1
	`;

	const params: any[] = [];

	// Category filter
	if (category) {
		query += ` AND jt.category = ?`;
		params.push(category);
	}

	// Search filter
	if (searchQuery) {
		query += ` AND (jt.name LIKE ? OR jt.description LIKE ? OR j.name LIKE ?)`;
		const searchPattern = `%${searchQuery}%`;
		params.push(searchPattern, searchPattern, searchPattern);
	}

	query += `
		GROUP BY jt.id, u.username, j.name, j.description
	`;

	// Sort
	switch (sortBy) {
		case 'rating':
			query += ` ORDER BY jt.rating DESC, jt.rating_count DESC`;
			break;
		case 'recent':
			query += ` ORDER BY jt.created_at DESC`;
			break;
		case 'downloads':
		default:
			query += ` ORDER BY jt.downloads DESC, jt.rating DESC`;
			break;
	}

	const templates = await db.prepare(query).bind(...params).all();

	// Get featured templates
	const featuredTemplates = await db
		.prepare(
			`SELECT
				jt.*,
				u.username as creator_name,
				j.name as journey_name,
				COUNT(DISTINCT s.id) as section_count
			FROM journey_templates jt
			INNER JOIN users u ON jt.creator_user_id = u.id
			INNER JOIN journeys j ON jt.source_journey_id = j.id
			LEFT JOIN sections s ON j.id = s.journey_id AND s.is_active = 1
			WHERE jt.is_featured = 1 AND jt.is_public = 1
			GROUP BY jt.id, u.username, j.name
			ORDER BY jt.downloads DESC
			LIMIT 3`
		)
		.all();

	// Get category counts
	const categoryCounts = await db
		.prepare(
			`SELECT category, COUNT(*) as count
			FROM journey_templates
			WHERE is_public = 1
			GROUP BY category`
		)
		.all();

	return {
		templates: templates.results || [],
		featuredTemplates: featuredTemplates.results || [],
		categoryCounts: categoryCounts.results || [],
		filters: {
			category,
			sortBy,
			searchQuery
		}
	};
};
