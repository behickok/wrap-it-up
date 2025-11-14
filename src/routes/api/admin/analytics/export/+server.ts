import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserWithRoles, hasPermission } from '$lib/server/permissions';
import {
	getPlatformOverviewStats,
	getDailyActiveUsers,
	getTopPerformingJourneys
} from '$lib/server/analytics';

export const GET: RequestHandler = async ({ locals, platform, url }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	// Check if user has admin permissions
	const userWithRoles = await getUserWithRoles(db, locals.user.id);
	if (!userWithRoles || !hasPermission(userWithRoles, 'analytics.view_all')) {
		throw error(403, 'Insufficient permissions');
	}

	// Get date range from query params
	const days = parseInt(url.searchParams.get('days') || '30');

	// Get platform overview stats
	const platformStats = await getPlatformOverviewStats(db);
	if (!platformStats) {
		throw error(500, 'Failed to load platform stats');
	}

	const completionRate =
		platformStats.total_enrollments > 0
			? (platformStats.completed_enrollments / platformStats.total_enrollments) * 100
			: 0;
	const averageRating = platformStats.average_rating ?? 0;

	// Get daily active users
	const dauTrend = await getDailyActiveUsers(db, { days });

	// Get top journeys
	const topJourneys = await getTopPerformingJourneys(db, {
		limit: 20,
		orderBy: 'enrollments'
	});

	// Build comprehensive CSV with multiple sections

	// Section 1: Platform Overview
	const overviewSection = [
		['PLATFORM OVERVIEW'],
		['Metric', 'Value'],
		['Total Users', platformStats.total_users],
		['New Users (30d)', platformStats.new_users_30d],
		['Active Journeys', platformStats.active_journeys],
		['Total Journeys', platformStats.total_journeys],
		['Active Mentors', platformStats.active_mentors],
		['Total Mentors', platformStats.total_mentors],
		['Total Enrollments', platformStats.total_enrollments],
		['Completion Rate (%)', completionRate.toFixed(2)],
		['Average Rating', averageRating.toFixed(2)],
		[]
	];

	// Section 2: Daily Active Users
	const dauSection = [
		['DAILY ACTIVE USERS'],
		['Date', 'Active Users'],
		...dauTrend.map((d: any) => [d.date, d.active_users])
	];

	if (dauTrend.length > 0) {
		dauSection.push([]);
	}

	// Section 3: Top Performing Journeys
	const journeysSection = [
		['TOP PERFORMING JOURNEYS'],
		[
			'Journey Name',
			'Enrollments',
			'Completions',
			'Active',
			'Completion Rate (%)',
			'Average Rating'
		],
		...topJourneys.map((j: any) => [
			j.name,
			j.total_enrollments || 0,
			j.total_completions || 0,
			j.active_enrollments || 0,
			j.completion_rate ? j.completion_rate.toFixed(2) : '0.00',
			j.average_rating ? j.average_rating.toFixed(2) : 'N/A'
		])
	];

	// Combine all sections
	const allRows = [...overviewSection, ...dauSection, ...journeysSection];

	// Build CSV content
	const csvContent = allRows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

	// Return CSV file
	return new Response(csvContent, {
		headers: {
			'Content-Type': 'text/csv',
			'Content-Disposition': `attachment; filename="platform-analytics-${new Date().toISOString().split('T')[0]}.csv"`
		}
	});
};
