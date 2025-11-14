import type { PageServerLoad } from './$types';
import type { Transaction, RevenueSummary, Journey, JourneyCreator } from '$lib/types';
import { getCreatorRevenueSummary } from '$lib/server/pricingUtils';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ platform, locals }) => {
	const db = platform?.env?.DB;
	if (!db) {
		throw new Error('Database not available');
	}

	// Check if user is logged in
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const userId = locals.user.id;

	// Get creator's journeys
	type CreatorJourney = Journey & Pick<JourneyCreator, 'is_published' | 'is_featured' | 'use_count'>;

	const journeysResult = await db
		.prepare(
			`
		SELECT j.*, jc.is_published, jc.is_featured, jc.use_count
		FROM journeys j
		JOIN journey_creators jc ON j.id = jc.journey_id
		WHERE jc.creator_user_id = ? AND j.is_active = 1
		ORDER BY j.created_at DESC
		`
		)
		.bind(userId)
		.all<CreatorJourney>();

	const journeys = (journeysResult.results || []) as CreatorJourney[];
	const journeyIds = journeys.map((journey) => journey.id);

	// Get revenue summary
	const revenueSummary = await getCreatorRevenueSummary(db, userId);

	// Get revenue by journey
	let revenueByJourney: {
		journey_id: number;
		journey_name: string;
		total_revenue: number;
		subscription_revenue: number;
		transaction_count: number;
		active_subscribers: number;
	}[] = [];

	if (journeyIds.length > 0) {
		const revenueByJourneyResult = await db
			.prepare(
				`
			SELECT
				j.id as journey_id,
				j.name as journey_name,
				COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.creator_amount ELSE 0 END), 0) as total_revenue,
				COALESCE(SUM(CASE WHEN t.transaction_type = 'subscription' AND t.status = 'completed' THEN t.creator_amount ELSE 0 END), 0) as subscription_revenue,
				COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as transaction_count,
				(
					SELECT COUNT(DISTINCT us.id)
					FROM user_subscriptions us
					JOIN user_journeys uj ON us.user_journey_id = uj.id
					WHERE uj.journey_id = j.id AND us.status = 'active'
				) as active_subscribers
			FROM journeys j
			LEFT JOIN transactions t ON j.id = t.journey_id
			WHERE j.id IN (${journeyIds.map(() => '?').join(',')})
			GROUP BY j.id, j.name
			ORDER BY total_revenue DESC
		`
			)
			.bind(...journeyIds)
			.all<{
				journey_id: number;
				journey_name: string;
				total_revenue: number;
				subscription_revenue: number;
				transaction_count: number;
				active_subscribers: number;
			}>();

		revenueByJourney = revenueByJourneyResult.results || [];
	}

	// Get recent transactions for creator's journeys
	let recentTransactions: (Transaction & {
		journey_name: string;
		journey_slug: string;
		username: string;
	})[] = [];

	if (journeyIds.length > 0) {
		const transactionsResult = await db
			.prepare(
				`
			SELECT
				t.*,
				j.name as journey_name,
				j.slug as journey_slug,
				u.username
			FROM transactions t
			JOIN journeys j ON t.journey_id = j.id
			JOIN users u ON t.user_id = u.id
			WHERE t.journey_id IN (${journeyIds.map(() => '?').join(',')})
			  AND t.status = 'completed'
			ORDER BY t.completed_at DESC
			LIMIT 50
		`
			)
			.bind(...journeyIds)
			.all<
				Transaction & {
					journey_name: string;
					journey_slug: string;
					username: string;
				}
			>();

		recentTransactions = transactionsResult.results || [];
	}

	// Get monthly revenue trend (last 6 months)
	let monthlyRevenue: { month: string; revenue: number; transaction_count: number }[] = [];

	if (journeyIds.length > 0) {
		const monthlyRevenueResult = await db
			.prepare(
				`
			SELECT
				strftime('%Y-%m', transaction_date) as month,
				COALESCE(SUM(creator_amount), 0) as revenue,
				COUNT(*) as transaction_count
			FROM transactions
			WHERE journey_id IN (${journeyIds.map(() => '?').join(',')})
			  AND status = 'completed'
			  AND transaction_date >= date('now', '-6 months')
			GROUP BY strftime('%Y-%m', transaction_date)
			ORDER BY month DESC
		`
			)
			.bind(...journeyIds)
			.all<{ month: string; revenue: number; transaction_count: number }>();

		monthlyRevenue = monthlyRevenueResult.results || [];
	}

	// Get revenue by transaction type
	let revenueByType: {
		transaction_type: string;
		revenue: number;
		count: number;
	}[] = [];

	if (journeyIds.length > 0) {
		const revenueByTypeResult = await db
			.prepare(
				`
			SELECT
				transaction_type,
				COALESCE(SUM(creator_amount), 0) as revenue,
				COUNT(*) as count
			FROM transactions
			WHERE journey_id IN (${journeyIds.map(() => '?').join(',')})
			  AND status = 'completed'
			GROUP BY transaction_type
			ORDER BY revenue DESC
		`
			)
			.bind(...journeyIds)
			.all<{
				transaction_type: string;
				revenue: number;
				count: number;
			}>();

		revenueByType = revenueByTypeResult.results || [];
	}

	return {
		journeys,
		revenueSummary,
		revenueByJourney,
		recentTransactions,
		monthlyRevenue,
		revenueByType
	};
};
