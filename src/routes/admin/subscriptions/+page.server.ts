import type { PageServerLoad, Actions } from './$types';
import type {
	UserSubscription,
	UserJourney,
	Journey,
	ServiceTier,
	JourneyPricing,
	BillingCycle
} from '$lib/types';
import {
	createSubscription,
	createSubscriptionTransaction,
	getJourneyPricing
} from '$lib/server/pricingUtils';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ platform, locals }) => {
	const db = platform?.env?.DB;
	if (!db) {
		throw new Error('Database not available');
	}

	// Check if user is admin
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/');
	}

	// Fetch all active subscriptions with user and journey info
	const subscriptionsResult = await db
		.prepare(
			`
		SELECT
			us.*,
			uj.user_id,
			uj.journey_id,
			uj.status as journey_status,
			u.username,
			u.email,
			j.name as journey_name,
			j.slug as journey_slug,
			st.name as tier_name
		FROM user_subscriptions us
		JOIN user_journeys uj ON us.user_journey_id = uj.id
		JOIN users u ON uj.user_id = u.id
		JOIN journeys j ON uj.journey_id = j.id
		JOIN service_tiers st ON us.tier_id = st.id
		ORDER BY us.created_at DESC
		LIMIT 100
	`
		)
		.all<
			UserSubscription & {
				user_id: number;
				journey_id: number;
				journey_status: string;
				username: string;
				email: string;
				journey_name: string;
				journey_slug: string;
				tier_name: string;
			}
		>();

	const subscriptions = subscriptionsResult.results || [];

	// Fetch all users for the form
	const usersResult = await db
		.prepare('SELECT id, username, email FROM users ORDER BY username')
		.all<{ id: number; username: string; email: string }>();

	const users = usersResult.results || [];

	// Fetch all published journeys
	const journeysResult = await db
		.prepare(
			`
		SELECT j.id, j.name, j.slug
		FROM journeys j
		JOIN journey_creators jc ON j.id = jc.journey_id
		WHERE j.is_active = 1 AND jc.is_published = 1
		ORDER BY j.name
	`
		)
		.all<{ id: number; name: string; slug: string }>();

	const journeys = journeysResult.results || [];

	// Fetch all service tiers
	const tiersResult = await db
		.prepare('SELECT * FROM service_tiers WHERE is_active = 1 ORDER BY display_order')
		.all<ServiceTier>();

	const tiers = tiersResult.results || [];

	return {
		subscriptions,
		users,
		journeys,
		tiers
	};
};

export const actions: Actions = {
	createSubscription: async ({ request, locals, platform }) => {
		const db = platform?.env?.DB;
		if (!db) {
			throw new Error('Database not available');
		}

		// Check if user is admin
		if (!locals.user || locals.user.role !== 'admin') {
			return { success: false, error: 'Unauthorized' };
		}

		const formData = await request.formData();
		const userId = parseInt(formData.get('user_id') as string);
		const journeyId = parseInt(formData.get('journey_id') as string);
		const tierId = parseInt(formData.get('tier_id') as string);
		const billingCycle = formData.get('billing_cycle') as BillingCycle;
		const notes = formData.get('notes') as string;

		try {
			// Check if user already has an active journey
			const existingUserJourney = await db
				.prepare(
					`
				SELECT * FROM user_journeys
				WHERE user_id = ? AND journey_id = ? AND status = 'active'
			`
				)
				.bind(userId, journeyId)
				.first<UserJourney>();

			let userJourneyId: number;

			if (existingUserJourney) {
				// User already has this journey active
				userJourneyId = existingUserJourney.id;

				// Check if they already have an active subscription
				const existingSubscription = await db
					.prepare(
						`
					SELECT * FROM user_subscriptions
					WHERE user_journey_id = ? AND status = 'active'
				`
					)
					.bind(userJourneyId)
					.first<UserSubscription>();

				if (existingSubscription) {
					return {
						success: false,
						error: 'User already has an active subscription for this journey'
					};
				}
			} else {
				// Create new user_journey
				const userJourneyResult = await db
					.prepare(
						`
					INSERT INTO user_journeys (user_id, journey_id, status)
					VALUES (?, ?, 'active')
					RETURNING id
				`
					)
					.bind(userId, journeyId)
					.first<{ id: number }>();

				userJourneyId = userJourneyResult?.id || 0;
			}

			// Get pricing for this tier
			const pricing = await getJourneyPricing(db, journeyId, tierId);

			if (!pricing) {
				return {
					success: false,
					error: 'Pricing not configured for this journey and tier combination'
				};
			}

			// Create subscription
			const subscriptionId = await createSubscription(
				db,
				userJourneyId,
				tierId,
				billingCycle,
				pricing,
				notes
			);

			// Create initial transaction
			const subscription = await db
				.prepare('SELECT * FROM user_subscriptions WHERE id = ?')
				.bind(subscriptionId)
				.first<UserSubscription>();

			if (subscription) {
				const transactionId = await createSubscriptionTransaction(
					db,
					subscription,
					journeyId,
					`Initial ${billingCycle} subscription payment`
				);

				// For manual payments, mark transaction as completed immediately
				await db
					.prepare(
						`
					UPDATE transactions
					SET status = 'completed', completed_at = CURRENT_TIMESTAMP
					WHERE id = ?
				`
					)
					.bind(transactionId)
					.run();
			}

			return { success: true, subscriptionId };
		} catch (error) {
			console.error('Error creating subscription:', error);
			return { success: false, error: 'Failed to create subscription' };
		}
	},

	updateSubscriptionStatus: async ({ request, locals, platform }) => {
		const db = platform?.env?.DB;
		if (!db) {
			throw new Error('Database not available');
		}

		// Check if user is admin
		if (!locals.user || locals.user.role !== 'admin') {
			return { success: false, error: 'Unauthorized' };
		}

		const formData = await request.formData();
		const subscriptionId = parseInt(formData.get('subscription_id') as string);
		const newStatus = formData.get('status') as string;
		const notes = formData.get('notes') as string;

		try {
			await db
				.prepare(
					`
				UPDATE user_subscriptions
				SET status = ?,
				    cancelled_at = CASE WHEN ? IN ('cancelled', 'expired') THEN CURRENT_TIMESTAMP ELSE cancelled_at END,
				    notes = COALESCE(?, notes),
				    updated_at = CURRENT_TIMESTAMP
				WHERE id = ?
			`
				)
				.bind(newStatus, newStatus, notes || null, subscriptionId)
				.run();

			return { success: true };
		} catch (error) {
			console.error('Error updating subscription:', error);
			return { success: false, error: 'Failed to update subscription status' };
		}
	},

	getPricingForJourney: async ({ request, platform }) => {
		const db = platform?.env?.DB;
		if (!db) {
			throw new Error('Database not available');
		}

		const formData = await request.formData();
		const journeyId = parseInt(formData.get('journey_id') as string);
		const tierId = parseInt(formData.get('tier_id') as string);

		const pricing = await getJourneyPricing(db, journeyId, tierId);

		return { success: true, pricing };
	}
};
