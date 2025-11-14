import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserWithRoles } from '$lib/server/permissions';
import { getMentorActivityTimeline } from '$lib/server/analytics';

export const GET: RequestHandler = async ({ locals, platform, url }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	// Check if user is a mentor
	const mentorProfile = await db
		.prepare(
			`
			SELECT * FROM mentor_profiles
			WHERE user_id = ? AND is_active = 1
		`
		)
		.bind(locals.user.id)
		.first();

	if (!mentorProfile) {
		throw error(403, 'Not a mentor');
	}

	// Get date range from query params
	const days = parseInt(url.searchParams.get('days') || '90');

	// Get activity timeline
	const activityTimeline = await getMentorActivityTimeline(db, {
		mentorUserId: locals.user.id,
		days
	});

	// Convert to CSV format
	const csvHeaders = [
		'Date',
		'Reviews Received',
		'Reviews Claimed',
		'Reviews Completed',
		'Avg Turnaround Hours'
	];

	const csvRows = activityTimeline.map((d: any) => [
		d.date,
		d.reviews_received || 0,
		d.reviews_claimed || 0,
		d.reviews_completed || 0,
		d.avg_turnaround_hours ? d.avg_turnaround_hours.toFixed(2) : '0.00'
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
			'Content-Disposition': `attachment; filename="mentor-analytics-${new Date().toISOString().split('T')[0]}.csv"`
		}
	});
};
