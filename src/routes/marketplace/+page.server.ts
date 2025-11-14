import type { PageServerLoad } from './$types';
import type { Journey, JourneyCreator, Category, JourneyPricing } from '$lib/types';

export const load: PageServerLoad = async ({ url, platform }) => {
	const db = platform?.env?.DB;
	if (!db) {
		throw new Error('Database not available');
	}

	// Get filter parameters
	const categoryFilter = url.searchParams.get('category');
	const searchQuery = url.searchParams.get('q');

	// Build query for published journeys
	let query = `
		SELECT
			j.*,
			jc.creator_user_id,
			jc.is_featured,
			jc.use_count,
			u.username as creator_username,
			u.email as creator_email
		FROM journeys j
		JOIN journey_creators jc ON j.id = jc.journey_id
		JOIN users u ON jc.creator_user_id = u.id
		WHERE j.is_active = 1 AND jc.is_published = 1
	`;

	const params: any[] = [];

	// Add search filter
	if (searchQuery) {
		query += ` AND (j.name LIKE ? OR j.description LIKE ?)`;
		params.push(`%${searchQuery}%`, `%${searchQuery}%`);
	}

	// Add category filter
	if (categoryFilter) {
		query += ` AND j.id IN (
			SELECT journey_id FROM journey_categories jcat
			JOIN categories c ON jcat.category_id = c.id
			WHERE c.name = ?
		)`;
		params.push(categoryFilter);
	}

	query += ` ORDER BY jc.is_featured DESC, jc.use_count DESC, j.created_at DESC`;

	const journeysResult = await db
		.prepare(query)
		.bind(...params)
		.all<
			Journey & {
				creator_user_id: number;
				is_featured: boolean;
				use_count: number;
				creator_username: string;
				creator_email: string;
			}
		>();

	const journeys =
		(journeysResult.results ||
			[]) as (Journey & {
			creator_user_id: number;
			is_featured: boolean;
			use_count: number;
			creator_username: string;
			creator_email: string;
		})[];

	// Fetch pricing for all journeys
	const journeyIds = journeys.map((j) => j.id);
	let pricingMap: Record<number, JourneyPricing[]> = {};

	if (journeyIds.length > 0) {
		const pricingResult = await db
			.prepare(
				`
			SELECT * FROM journey_pricing
			WHERE journey_id IN (${journeyIds.map(() => '?').join(',')})
			AND is_active = 1
			ORDER BY tier_id
		`
			)
			.bind(...journeyIds)
			.all<JourneyPricing>();

		const allPricing = pricingResult.results || [];

		// Group by journey_id
		for (const pricing of allPricing) {
			if (!pricingMap[pricing.journey_id]) {
				pricingMap[pricing.journey_id] = [];
			}
			pricingMap[pricing.journey_id].push(pricing);
		}
	}

	// Fetch categories for each journey
	let categoriesMap: Record<number, Category[]> = {};

	if (journeyIds.length > 0) {
		const categoriesResult = await db
			.prepare(
				`
			SELECT jc.journey_id, c.*
			FROM journey_categories jc
			JOIN categories c ON jc.category_id = c.id
			WHERE jc.journey_id IN (${journeyIds.map(() => '?').join(',')})
			ORDER BY jc.display_order
		`
			)
			.bind(...journeyIds)
			.all<Category & { journey_id: number }>();

		const allCategories = categoriesResult.results || [];

		for (const cat of allCategories) {
			const journeyId = cat.journey_id;
			if (!categoriesMap[journeyId]) {
				categoriesMap[journeyId] = [];
			}
			categoriesMap[journeyId].push(cat);
		}
	}

	// Fetch all unique categories for filter
	const allCategoriesResult = await db
		.prepare(
			`
		SELECT DISTINCT c.*
		FROM categories c
		JOIN journey_categories jc ON c.id = jc.category_id
		JOIN journeys j ON jc.journey_id = j.id
		JOIN journey_creators jcr ON j.id = jcr.journey_id
		WHERE j.is_active = 1 AND jcr.is_published = 1
		ORDER BY c.name
	`
		)
		.all<Category>();

	const allCategories = allCategoriesResult.results || [];

	// Combine data
	const journeysWithData = journeys.map((journey) => ({
		...journey,
		pricing: pricingMap[journey.id] || [],
		categories: categoriesMap[journey.id] || []
	}));

	return {
		journeys: journeysWithData,
		allCategories,
		filters: {
			category: categoryFilter,
			search: searchQuery
		}
	};
};
