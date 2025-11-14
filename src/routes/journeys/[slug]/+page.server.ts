import { error, redirect, fail, isRedirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { Journey, ServiceTier, Category, JourneyPricing, UserJourney } from '$lib/types';
import { AnalyticsEvents } from '$lib/server/analytics';

export const load: PageServerLoad = async ({ locals, platform, params }) => {
	const db = platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	const { slug } = params;

	try {
		// Fetch published journey with creator info
		const journeyResult = await db
			.prepare(
				`
			SELECT j.*, jc.creator_user_id, jc.is_featured, jc.use_count,
				   u.username as creator_username
			FROM journeys j
			JOIN journey_creators jc ON j.id = jc.journey_id
			JOIN users u ON jc.creator_user_id = u.id
			WHERE j.slug = ? AND j.is_active = 1 AND jc.is_published = 1
		`
			)
			.bind(slug)
			.first();

		if (!journeyResult) {
			throw error(404, 'Journey not found');
		}

		const journey = journeyResult as Journey & {
			creator_user_id: number;
			is_featured: boolean;
			use_count: number;
			creator_username: string;
		};

		// Check if user is subscribed (if logged in)
		let userSubscription: UserJourney | null = null;
		if (locals.user) {
			const subscriptionResult = await db
				.prepare(
					`
				SELECT uj.*, st.name as tier_name, st.slug as tier_slug
				FROM user_journeys uj
				JOIN service_tiers st ON uj.tier_id = st.id
				WHERE uj.user_id = ? AND uj.journey_id = ? AND uj.status = 'active'
			`
				)
				.bind(locals.user.id, journey.id)
				.first<UserJourney & { tier_name: string; tier_slug: string }>();

			userSubscription = subscriptionResult || null;
		}

		// Fetch categories for this journey
		const categoriesResult = await db
			.prepare(
				`
			SELECT c.*, jc.display_order
			FROM categories c
			JOIN journey_categories jc ON c.id = jc.category_id
			WHERE jc.journey_id = ?
			ORDER BY jc.display_order
		`
			)
			.bind(journey.id)
			.all<Category & { display_order: number }>();

		const categories = categoriesResult.results || [];

		// Fetch sections with category info
		const sectionsResult = await db
			.prepare(
				`
			SELECT s.*, js.category_id, js.display_order, js.is_required, js.weight_override
			FROM sections s
			JOIN journey_sections js ON s.id = js.section_id
			WHERE js.journey_id = ?
			ORDER BY js.category_id, js.display_order
		`
			)
			.bind(journey.id)
			.all();

		const sections = sectionsResult.results || [];

		// Fetch pricing with service tier details
		const pricingResult = await db
			.prepare(
				`
			SELECT jp.*, st.name as tier_name, st.slug as tier_slug, st.features_json, st.description as tier_description
			FROM journey_pricing jp
			JOIN service_tiers st ON jp.tier_id = st.id
			WHERE jp.journey_id = ? AND jp.is_active = 1
			ORDER BY st.display_order
		`
			)
			.bind(journey.id)
			.all<
				JourneyPricing & {
					tier_name: string;
					tier_slug: string;
					features_json: string | null;
					tier_description: string | null;
				}
			>();

		const pricing =
			(pricingResult.results ||
				[]) as (JourneyPricing & {
				tier_name: string;
				tier_slug: string;
				features_json: string | null;
				tier_description: string | null;
			})[];

		// Parse features JSON
		const pricingWithFeatures = pricing.map((p) => {
			let features: string[] = [];
			if (p.features_json) {
				try {
					const parsed = JSON.parse(p.features_json);
					features = Array.isArray(parsed) ? parsed : [];
				} catch {
					features = [];
				}
			}

			return {
				...p,
				features
			};
		});

		// Track journey view event
		await AnalyticsEvents.journeyView(db, {
			userId: locals.user?.id,
			journeyId: journey.id,
			sessionId: locals.sessionId || 'anonymous'
		}).catch((err) => console.error('Failed to track journey view:', err));

		return {
			journey,
			categories,
			sections,
			pricing: pricingWithFeatures,
			userSubscription,
			isAuthenticated: !!locals.user
		};
	} catch (err) {
		console.error('Error loading journey:', err);
		throw error(500, 'Failed to load journey');
	}
};

export const actions: Actions = {
	enroll: async ({ locals, platform, params, request }) => {
		// Must be authenticated to enroll
		if (!locals.user) {
			return fail(401, { error: 'Please log in to enroll in this journey' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const tierId = Number(formData.get('tier_id'));

		if (!tierId) {
			return fail(400, { error: 'Please select a subscription tier' });
		}

		try {
			// Get journey by slug
			const journeyResult = await db
				.prepare(
					`
				SELECT j.id, j.name
				FROM journeys j
				JOIN journey_creators jc ON j.id = jc.journey_id
				WHERE j.slug = ? AND j.is_active = 1 AND jc.is_published = 1
			`
				)
				.bind(params.slug)
				.first<{ id: number; name: string }>();

			if (!journeyResult) {
				return fail(404, { error: 'Journey not found' });
			}

			const journey = journeyResult;

			// Check if user already has an active subscription
			const existingSubscription = await db
				.prepare(
					`
				SELECT id FROM user_journeys
				WHERE user_id = ? AND journey_id = ? AND status = 'active'
			`
				)
				.bind(locals.user.id, journey.id)
				.first();

			if (existingSubscription) {
				// Already enrolled, redirect to dashboard
				throw redirect(303, `/journeys/${params.slug}/dashboard`);
			}

			// Check if pricing exists for this tier
			const pricingResult = await db
				.prepare(
					`
				SELECT id, base_price_monthly
				FROM journey_pricing
				WHERE journey_id = ? AND tier_id = ? AND is_active = 1
			`
				)
				.bind(journey.id, tierId)
				.first<{ id: number; base_price_monthly: number }>();

			if (!pricingResult) {
				return fail(400, { error: 'Pricing not available for selected tier' });
			}

			// For now, this is a placeholder for free enrollment
			// In Phase 6, this will integrate with Stripe payment flow
			// Currently, users can enroll for free (manual payment tracking via admin)

			// Create user_journey record
			const userJourneyResult = await db
				.prepare(
					`
				INSERT INTO user_journeys (user_id, journey_id, tier_id, status, started_at)
				VALUES (?, ?, ?, 'active', CURRENT_TIMESTAMP)
				RETURNING id
			`
				)
				.bind(locals.user.id, journey.id, tierId)
				.first<{ id: number }>();

			if (!userJourneyResult) {
				return fail(500, { error: 'Failed to create enrollment' });
			}

			// Track enrollment event
			await AnalyticsEvents.journeyEnrollment(db, {
				userId: locals.user.id,
				journeyId: journey.id
			}).catch((err) => console.error('Failed to track enrollment:', err));

			// Note: In Phase 6 with Stripe, we'll create subscription and transaction records here
			// For now, admin must manually create subscriptions via /admin/subscriptions

			// Redirect to journey dashboard
			throw redirect(303, `/journeys/${params.slug}/dashboard`);
		} catch (err) {
			if (isRedirect(err)) throw err;
			console.error('Error enrolling in journey:', err);
			return fail(500, { error: 'Failed to enroll in journey' });
		}
	}
};
