import type { PageServerLoad, Actions } from './$types';
import type { Transaction, TransactionType, TransactionStatus } from '$lib/types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, platform, locals }) => {
	const db = platform?.env?.DB;
	if (!db) {
		throw new Error('Database not available');
	}

	// Check if user is admin
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/');
	}

	// Get filter parameters
	const typeFilter = url.searchParams.get('type');
	const statusFilter = url.searchParams.get('status');
	const searchQuery = url.searchParams.get('q');
	const startDate = url.searchParams.get('start_date');
	const endDate = url.searchParams.get('end_date');

	// Build query
	let query = `
		SELECT
			t.*,
			u.username,
			u.email,
			j.name as journey_name,
			j.slug as journey_slug
		FROM transactions t
		JOIN users u ON t.user_id = u.id
		JOIN journeys j ON t.journey_id = j.id
		WHERE 1=1
	`;

	const params: any[] = [];

	// Add type filter
	if (typeFilter) {
		query += ` AND t.transaction_type = ?`;
		params.push(typeFilter);
	}

	// Add status filter
	if (statusFilter) {
		query += ` AND t.status = ?`;
		params.push(statusFilter);
	}

	// Add search filter (user or journey)
	if (searchQuery) {
		query += ` AND (u.username LIKE ? OR u.email LIKE ? OR j.name LIKE ?)`;
		params.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
	}

	// Add date filters
	if (startDate) {
		query += ` AND t.transaction_date >= ?`;
		params.push(startDate);
	}

	if (endDate) {
		query += ` AND t.transaction_date <= ?`;
		params.push(endDate);
	}

	query += ` ORDER BY t.created_at DESC LIMIT 200`;

	const transactionsResult = await db
		.prepare(query)
		.bind(...params)
		.all<
			Transaction & {
				username: string;
				email: string;
				journey_name: string;
				journey_slug: string;
			}
		>();

	const transactions = transactionsResult.results || [];

	// Get summary stats
	const summaryResult = await db
		.prepare(
			`
		SELECT
			COUNT(*) as total_count,
			COALESCE(SUM(amount), 0) as total_amount,
			COALESCE(SUM(platform_fee), 0) as total_platform_fee,
			COALESCE(SUM(creator_amount), 0) as total_creator_amount,
			COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
			COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
			COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
		FROM transactions
	`
		)
		.first<{
			total_count: number;
			total_amount: number;
			total_platform_fee: number;
			total_creator_amount: number;
			pending_count: number;
			completed_count: number;
			failed_count: number;
		}>();

	const summary = summaryResult || {
		total_count: 0,
		total_amount: 0,
		total_platform_fee: 0,
		total_creator_amount: 0,
		pending_count: 0,
		completed_count: 0,
		failed_count: 0
	};

	// Get revenue by type
	const revenueByTypeResult = await db
		.prepare(
			`
		SELECT
			transaction_type,
			COUNT(*) as count,
			COALESCE(SUM(amount), 0) as total_amount,
			COALESCE(SUM(platform_fee), 0) as platform_fee,
			COALESCE(SUM(creator_amount), 0) as creator_amount
		FROM transactions
		WHERE status = 'completed'
		GROUP BY transaction_type
	`
		)
		.all<{
			transaction_type: TransactionType;
			count: number;
			total_amount: number;
			platform_fee: number;
			creator_amount: number;
		}>();

	const revenueByType = revenueByTypeResult.results || [];

	return {
		transactions,
		summary,
		revenueByType,
		filters: {
			type: typeFilter,
			status: statusFilter,
			search: searchQuery,
			startDate,
			endDate
		}
	};
};

export const actions: Actions = {
	updateTransactionStatus: async ({ request, locals, platform }) => {
		const db = platform?.env?.DB;
		if (!db) {
			throw new Error('Database not available');
		}

		// Check if user is admin
		if (!locals.user || locals.user.role !== 'admin') {
			return { success: false, error: 'Unauthorized' };
		}

		const formData = await request.formData();
		const transactionId = parseInt(formData.get('transaction_id') as string);
		const newStatus = formData.get('status') as TransactionStatus;
		const notes = formData.get('notes') as string;

		try {
			await db
				.prepare(
					`
				UPDATE transactions
				SET status = ?,
				    completed_at = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END,
				    notes = COALESCE(?, notes),
				    updated_at = CURRENT_TIMESTAMP
				WHERE id = ?
			`
				)
				.bind(newStatus, newStatus, notes || null, transactionId)
				.run();

			return { success: true };
		} catch (error) {
			console.error('Error updating transaction:', error);
			return { success: false, error: 'Failed to update transaction status' };
		}
	},

	createManualTransaction: async ({ request, locals, platform }) => {
		const db = platform?.env?.DB;
		if (!db) {
			throw new Error('Database not available');
		}

		// Check if user is admin
		if (!locals.user || locals.user.role !== 'admin') {
			return { success: false, error: 'Unauthorized' };
		}

		const formData = await request.formData();
		const transactionType = formData.get('transaction_type') as TransactionType;
		const userId = parseInt(formData.get('user_id') as string);
		const journeyId = parseInt(formData.get('journey_id') as string);
		const amount = parseFloat(formData.get('amount') as string);
		const description = formData.get('description') as string;
		const notes = formData.get('notes') as string;

		try {
			// Calculate platform fee (15%)
			const platformFeePercentage = 15;
			const platformFee = Math.round(amount * (platformFeePercentage / 100) * 100) / 100;
			const creatorAmount = Math.round((amount - platformFee) * 100) / 100;

			await db
				.prepare(
					`
				INSERT INTO transactions (
					transaction_type,
					user_id,
					journey_id,
					amount,
					platform_fee,
					creator_amount,
					status,
					payment_method,
					description,
					notes,
					transaction_date
				)
				VALUES (?, ?, ?, ?, ?, ?, 'pending', 'manual', ?, ?, CURRENT_DATE)
			`
				)
				.bind(
					transactionType,
					userId,
					journeyId,
					amount,
					platformFee,
					creatorAmount,
					description,
					notes || null
				)
				.run();

			return { success: true };
		} catch (error) {
			console.error('Error creating transaction:', error);
			return { success: false, error: 'Failed to create transaction' };
		}
	}
};
