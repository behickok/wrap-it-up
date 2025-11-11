import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { Journey, ServiceTier, Category, Section } from '$lib/types';

export const load: PageServerLoad = async ({ locals, platform, params }) => {
	// Check authentication
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	const { slug } = params;

	try {
		// Fetch journey by slug
		const journeyResult = await db
			.prepare('SELECT * FROM journeys WHERE slug = ? AND is_active = 1')
			.bind(slug)
			.first();

		if (!journeyResult) {
			throw error(404, 'Journey not found');
		}

		const journey = journeyResult as Journey;

		// Check if user is already subscribed to this journey
		const subscriptionResult = await db
			.prepare(
				`SELECT uj.*, st.name as tier_name, st.slug as tier_slug
				 FROM user_journeys uj
				 JOIN service_tiers st ON uj.tier_id = st.id
				 WHERE uj.user_id = ? AND uj.journey_id = ? AND uj.status = 'active'`
			)
			.bind(locals.user.id, journey.id)
			.first();

		const existingSubscription = subscriptionResult || null;

		// Fetch all service tiers
		const tiersResult = await db
			.prepare('SELECT * FROM service_tiers WHERE is_active = 1 ORDER BY display_order')
			.all();

		const tiers = (tiersResult.results || []) as ServiceTier[];

		// Parse features JSON for each tier
		const parsedTiers = tiers.map((tier) => ({
			...tier,
			features: tier.features_json ? JSON.parse(tier.features_json) : []
		}));

		// Fetch journey categories and sections
		const categoriesResult = await db
			.prepare(
				`SELECT c.*, jc.display_order
				 FROM categories c
				 JOIN journey_categories jc ON c.id = jc.category_id
				 WHERE jc.journey_id = ?
				 ORDER BY jc.display_order`
			)
			.bind(journey.id)
			.all();

		const categories = categoriesResult.results || [];

		// Fetch sections for this journey
		const sectionsResult = await db
			.prepare(
				`SELECT s.*, js.is_required, js.weight_override, js.category_id, js.display_order
				 FROM sections s
				 JOIN journey_sections js ON s.id = js.section_id
				 WHERE js.journey_id = ?
				 ORDER BY js.category_id, js.display_order`
			)
			.bind(journey.id)
			.all();

		const sections = sectionsResult.results || [];

		// Group sections by category
		const sectionsByCategory: Record<number, any[]> = {};
		for (const section of sections) {
			const categoryId = (section as any).category_id;
			if (!sectionsByCategory[categoryId]) {
				sectionsByCategory[categoryId] = [];
			}
			sectionsByCategory[categoryId].push(section);
		}

		return {
			journey,
			tiers: parsedTiers,
			categories,
			sections,
			sectionsByCategory,
			existingSubscription,
			isSubscribed: !!existingSubscription
		};
	} catch (err) {
		console.error('Error loading journey details:', err);
		throw error(500, 'Failed to load journey details');
	}
};

export const actions: Actions = {
	subscribe: async ({ locals, platform, params, request }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { message: 'Database not available' });
		}

		const formData = await request.formData();
		const tierId = Number(formData.get('tier_id'));

		if (!tierId) {
			return fail(400, { message: 'Tier ID is required' });
		}

		try {
			// Get journey
			const journeyResult = await db
				.prepare('SELECT id FROM journeys WHERE slug = ?')
				.bind(params.slug)
				.first();

			if (!journeyResult) {
				return fail(404, { message: 'Journey not found' });
			}

			const journey = journeyResult as { id: number };

			// Check if already subscribed
			const existingResult = await db
				.prepare(
					'SELECT id FROM user_journeys WHERE user_id = ? AND journey_id = ? AND status = ?'
				)
				.bind(locals.user.id, journey.id, 'active')
				.first();

			if (existingResult) {
				return fail(400, { message: 'Already subscribed to this journey' });
			}

			// Create subscription
			await db
				.prepare(
					`INSERT INTO user_journeys (user_id, journey_id, tier_id, status, started_at)
					 VALUES (?, ?, ?, 'active', datetime('now'))`
				)
				.bind(locals.user.id, journey.id, tierId)
				.run();

			// Redirect to journey dashboard
			throw redirect(303, `/journeys/${params.slug}/dashboard`);
		} catch (err) {
			if (err instanceof Response) throw err; // Re-throw redirects
			console.error('Error subscribing to journey:', err);
			return fail(500, { message: 'Failed to subscribe to journey' });
		}
	}
};
