import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserWithRoles, hasPermission } from '$lib/server/permissions';
import { exportJourneyAnalyticsCSV, getCreatorJourneyAnalytics } from '$lib/server/analytics';

export const GET: RequestHandler = async ({ locals, platform, url }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	// Check permissions
	const userWithRoles = await getUserWithRoles(db, locals.user.id);
	if (!userWithRoles || !hasPermission(userWithRoles, 'journey.create')) {
		throw error(403, 'Forbidden');
	}

	// Get date range from query params
	const days = parseInt(url.searchParams.get('days') || '30');
	const endDate = new Date().toISOString().split('T')[0];
	const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
		.toISOString()
		.split('T')[0];

	// Get all creator's journeys
	const journeysResult = await db
		.prepare(
			`
			SELECT j.*
			FROM journeys j
			JOIN journey_creators jc ON j.id = jc.journey_id
			WHERE jc.creator_user_id = ?
			ORDER BY j.created_at DESC
		`
		)
		.bind(locals.user.id)
		.all();

	const journeys = journeysResult.results || [];

	// Get analytics for all journeys
	const journeyAnalytics = await getCreatorJourneyAnalytics(db, {
		creatorUserId: locals.user.id,
		startDate,
		endDate
	});

	// Convert to CSV format
	const csvHeaders = [
		'Journey ID',
		'Journey Name',
		'Journey Slug',
		'Total Enrollments',
		'Active Users',
		'Completed Users',
		'Total Reviews',
		'Avg Review Rating',
		'Total Mentor Payments'
	];

	const csvRows = journeyAnalytics.map((j: any) => [
		j.journey_id,
		j.journey_name,
		j.journey_slug,
		j.total_enrollments || 0,
		j.active_users || 0,
		j.completed_users || 0,
		j.total_reviews || 0,
		j.avg_review_rating ? j.avg_review_rating.toFixed(2) : '0.00',
		j.total_mentor_payments ? j.total_mentor_payments.toFixed(2) : '0.00'
	]);

	// Build CSV content
	const csvContent = [
		csvHeaders.join(','),
		...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(','))
	].join('\n');

	// Return CSV file
	return new Response(csvContent, {
		headers: {
			'Content-Type': 'text/csv',
			'Content-Disposition': `attachment; filename="journey-analytics-${new Date().toISOString().split('T')[0]}.csv"`
		}
	});
};
