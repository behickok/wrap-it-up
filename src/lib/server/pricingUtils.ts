/**
 * Pricing and revenue calculation utilities
 * Handles platform fee calculations, transaction creation, and revenue tracking
 */

import type {
	PricingBreakdown,
	Transaction,
	UserSubscription,
	JourneyPricing,
	BillingCycle
} from '$lib/types';
import type { D1Database } from '@cloudflare/workers-types';

/**
 * Calculate pricing breakdown with platform fee
 */
export function calculatePricing(
	basePrice: number,
	platformFeePercentage: number = 15
): PricingBreakdown {
	const platformFee = Math.round(basePrice * (platformFeePercentage / 100) * 100) / 100;
	const creatorReceives = Math.round((basePrice - platformFee) * 100) / 100;

	return {
		basePrice,
		platformFee,
		platformFeePercentage,
		creatorReceives,
		clientPays: basePrice
	};
}

/**
 * Get revenue setting value
 */
export async function getRevenueSetting(
	db: D1Database,
	key: string,
	defaultValue: string = ''
): Promise<string> {
	const result = await db
		.prepare('SELECT setting_value FROM revenue_settings WHERE setting_key = ?')
		.bind(key)
		.first<{ setting_value: string }>();

	return result?.setting_value || defaultValue;
}

/**
 * Get platform fee percentage
 */
export async function getPlatformFeePercentage(db: D1Database): Promise<number> {
	const value = await getRevenueSetting(db, 'platform_fee_percentage', '15.0');
	return parseFloat(value);
}

/**
 * Get minimum payout amount
 */
export async function getMinimumPayoutAmount(db: D1Database): Promise<number> {
	const value = await getRevenueSetting(db, 'minimum_payout_amount', '100.00');
	return parseFloat(value);
}

/**
 * Create or update journey pricing
 */
export async function saveJourneyPricing(
	db: D1Database,
	journeyId: number,
	tierId: number,
	monthlyPrice: number,
	annualPrice: number,
	platformFeePercentage?: number
): Promise<void> {
	const feePercent =
		platformFeePercentage !== undefined
			? platformFeePercentage
			: await getPlatformFeePercentage(db);

	await db
		.prepare(
			`
		INSERT INTO journey_pricing (
			journey_id, tier_id,
			base_price_monthly, base_price_annual,
			platform_fee_percentage
		)
		VALUES (?, ?, ?, ?, ?)
		ON CONFLICT(journey_id, tier_id) DO UPDATE SET
			base_price_monthly = excluded.base_price_monthly,
			base_price_annual = excluded.base_price_annual,
			platform_fee_percentage = excluded.platform_fee_percentage,
			updated_at = CURRENT_TIMESTAMP
	`
		)
		.bind(journeyId, tierId, monthlyPrice, annualPrice, feePercent)
		.run();
}

/**
 * Get journey pricing for a specific tier
 */
export async function getJourneyPricing(
	db: D1Database,
	journeyId: number,
	tierId: number
): Promise<JourneyPricing | null> {
	return await db
		.prepare(
			`
		SELECT * FROM journey_pricing
		WHERE journey_id = ? AND tier_id = ? AND is_active = 1
	`
		)
		.bind(journeyId, tierId)
		.first<JourneyPricing>();
}

/**
 * Get all pricing for a journey
 */
export async function getAllJourneyPricing(
	db: D1Database,
	journeyId: number
): Promise<JourneyPricing[]> {
	const result = await db
		.prepare(
			`
		SELECT * FROM journey_pricing
		WHERE journey_id = ? AND is_active = 1
		ORDER BY tier_id
	`
		)
		.bind(journeyId)
		.all<JourneyPricing>();

	return result.results || [];
}

/**
 * Create a subscription transaction
 */
export async function createSubscriptionTransaction(
	db: D1Database,
	subscription: UserSubscription,
	journeyId: number,
	description?: string
): Promise<number> {
	const result = await db
		.prepare(
			`
		INSERT INTO transactions (
			transaction_type,
			user_id,
			user_journey_id,
			journey_id,
			subscription_id,
			amount,
			platform_fee,
			creator_amount,
			status,
			payment_method,
			description,
			transaction_date
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE)
		RETURNING id
	`
		)
		.bind(
			'subscription',
			(await db
				.prepare('SELECT user_id FROM user_journeys WHERE id = ?')
				.bind(subscription.user_journey_id)
				.first<{ user_id: number }>()
			)?.user_id || 0,
			subscription.user_journey_id,
			journeyId,
			subscription.id,
			subscription.price_amount,
			subscription.platform_fee,
			subscription.creator_amount,
			'pending',
			subscription.payment_method,
			description || `Subscription payment - ${subscription.billing_cycle}`,
			null
		)
		.first<{ id: number }>();

	return result?.id || 0;
}

/**
 * Mark transaction as completed
 */
export async function completeTransaction(
	db: D1Database,
	transactionId: number,
	notes?: string
): Promise<void> {
	await db
		.prepare(
			`
		UPDATE transactions
		SET status = 'completed',
		    completed_at = CURRENT_TIMESTAMP,
		    notes = COALESCE(?, notes),
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`
		)
		.bind(notes || null, transactionId)
		.run();
}

/**
 * Create a review transaction
 */
export async function createReviewTransaction(
	db: D1Database,
	userId: number,
	journeyId: number,
	mentorId: number,
	reviewRate: number,
	platformFeePercentage?: number
): Promise<number> {
	const feePercent =
		platformFeePercentage !== undefined
			? platformFeePercentage
			: await getPlatformFeePercentage(db);

	const breakdown = calculatePricing(reviewRate, feePercent);

	const result = await db
		.prepare(
			`
		INSERT INTO transactions (
			transaction_type,
			user_id,
			journey_id,
			mentor_id,
			amount,
			platform_fee,
			creator_amount,
			mentor_amount,
			status,
			payment_method,
			description,
			transaction_date
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE)
		RETURNING id
	`
		)
		.bind(
			'review',
			userId,
			journeyId,
			mentorId,
			reviewRate,
			breakdown.platformFee,
			0, // Creator doesn't get paid for reviews, mentor does
			breakdown.creatorReceives, // This goes to mentor
			'pending',
			'manual',
			'Mentor review payment'
		)
		.first<{ id: number }>();

	return result?.id || 0;
}

/**
 * Create a session transaction
 */
export async function createSessionTransaction(
	db: D1Database,
	userId: number,
	journeyId: number,
	coachId: number,
	sessionRate: number,
	platformFeePercentage?: number
): Promise<number> {
	const feePercent =
		platformFeePercentage !== undefined
			? platformFeePercentage
			: await getPlatformFeePercentage(db);

	const breakdown = calculatePricing(sessionRate, feePercent);

	const result = await db
		.prepare(
			`
		INSERT INTO transactions (
			transaction_type,
			user_id,
			journey_id,
			coach_id,
			amount,
			platform_fee,
			creator_amount,
			concierge_amount,
			status,
			payment_method,
			description,
			transaction_date
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE)
		RETURNING id
	`
		)
		.bind(
			'session',
			userId,
			journeyId,
			coachId,
			sessionRate,
			breakdown.platformFee,
			0, // Creator doesn't get paid for sessions, concierge does
			breakdown.creatorReceives, // This goes to concierge
			'pending',
			'manual',
			'Concierge session payment'
		)
		.first<{ id: number }>();

	return result?.id || 0;
}

/**
 * Calculate next billing date
 */
export function calculateNextBillingDate(
	startDate: Date,
	billingCycle: BillingCycle
): Date {
	const nextDate = new Date(startDate);

	if (billingCycle === 'monthly') {
		nextDate.setMonth(nextDate.getMonth() + 1);
	} else {
		nextDate.setFullYear(nextDate.getFullYear() + 1);
	}

	return nextDate;
}

/**
 * Create a user subscription (manual for now)
 */
export async function createSubscription(
	db: D1Database,
	userJourneyId: number,
	tierId: number,
	billingCycle: BillingCycle,
	pricing: JourneyPricing,
	notes?: string
): Promise<number> {
	const priceAmount =
		billingCycle === 'monthly' ? pricing.base_price_monthly : pricing.base_price_annual;

	const platformFee =
		billingCycle === 'monthly' ? pricing.platform_fee_monthly : pricing.platform_fee_annual;

	const creatorAmount =
		billingCycle === 'monthly' ? pricing.creator_revenue_monthly : pricing.creator_revenue_annual;

	const now = new Date();
	const periodEnd = calculateNextBillingDate(now, billingCycle);

	const result = await db
		.prepare(
			`
		INSERT INTO user_subscriptions (
			user_journey_id,
			tier_id,
			billing_cycle,
			price_amount,
			platform_fee,
			creator_amount,
			current_period_start,
			current_period_end,
			payment_method,
			notes
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		RETURNING id
	`
		)
		.bind(
			userJourneyId,
			tierId,
			billingCycle,
			priceAmount,
			platformFee,
			creatorAmount,
			now.toISOString(),
			periodEnd.toISOString(),
			'manual',
			notes || null
		)
		.first<{ id: number }>();

	return result?.id || 0;
}

/**
 * Get revenue summary for a creator
 */
export async function getCreatorRevenueSummary(
	db: D1Database,
	creatorUserId: number
): Promise<{
	mtd_revenue: number;
	projected_monthly: number;
	all_time_revenue: number;
	active_subscriptions: number;
	pending_payout: number;
}> {
	// Get creator's journeys
	const journeys = await db
		.prepare(
			`
		SELECT id FROM journeys
		WHERE id IN (
			SELECT journey_id FROM journey_creators
			WHERE creator_user_id = ?
		)
	`
		)
		.bind(creatorUserId)
		.all<{ id: number }>();

	const journeyIds = (journeys.results || []).map((j) => j.id);

	if (journeyIds.length === 0) {
		return {
			mtd_revenue: 0,
			projected_monthly: 0,
			all_time_revenue: 0,
			active_subscriptions: 0,
			pending_payout: 0
		};
	}

	// MTD revenue (completed transactions this month)
	const mtdResult = await db
		.prepare(
			`
		SELECT COALESCE(SUM(creator_amount), 0) as mtd_revenue
		FROM transactions
		WHERE journey_id IN (${journeyIds.map(() => '?').join(',')})
		  AND status = 'completed'
		  AND strftime('%Y-%m', transaction_date) = strftime('%Y-%m', 'now')
	`
		)
		.bind(...journeyIds)
		.first<{ mtd_revenue: number }>();

	// Active subscriptions
	const subsResult = await db
		.prepare(
			`
		SELECT
			COUNT(*) as active_count,
			COALESCE(SUM(creator_amount), 0) as monthly_revenue
		FROM user_subscriptions us
		JOIN user_journeys uj ON us.user_journey_id = uj.id
		WHERE uj.journey_id IN (${journeyIds.map(() => '?').join(',')})
		  AND us.status = 'active'
		  AND us.billing_cycle = 'monthly'
	`
		)
		.bind(...journeyIds)
		.first<{ active_count: number; monthly_revenue: number }>();

	// All-time revenue
	const allTimeResult = await db
		.prepare(
			`
		SELECT COALESCE(SUM(creator_amount), 0) as all_time_revenue
		FROM transactions
		WHERE journey_id IN (${journeyIds.map(() => '?').join(',')})
		  AND status = 'completed'
	`
		)
		.bind(...journeyIds)
		.first<{ all_time_revenue: number }>();

	// Pending payout (completed but not paid out)
	const pendingResult = await db
		.prepare(
			`
		SELECT COALESCE(SUM(creator_amount), 0) as pending_payout
		FROM transactions
		WHERE journey_id IN (${journeyIds.map(() => '?').join(',')})
		  AND status = 'completed'
		  AND id NOT IN (
			  SELECT transaction_id FROM payout_transactions
			  WHERE payout_id IN (
				  SELECT id FROM payouts
				  WHERE user_id = ? AND status = 'completed'
			  )
		  )
	`
		)
		.bind(...journeyIds, creatorUserId)
		.first<{ pending_payout: number }>();

	return {
		mtd_revenue: mtdResult?.mtd_revenue || 0,
		projected_monthly: subsResult?.monthly_revenue || 0,
		all_time_revenue: allTimeResult?.all_time_revenue || 0,
		active_subscriptions: subsResult?.active_count || 0,
		pending_payout: pendingResult?.pending_payout || 0
	};
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency
	}).format(amount);
}
