/**
 * Mentor Availability Management
 * Allows mentors to set weekly schedules and blocked dates
 */

import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	// Verify user is an approved mentor
	const mentor = await db
		.prepare('SELECT * FROM mentor_profiles WHERE user_id = ? AND approval_status = ?')
		.bind(locals.user.id, 'approved')
		.first();

	if (!mentor) {
		throw error(403, 'Only approved mentors can access this page');
	}

	// Load weekly availability
	const availability = await db
		.prepare(
			`SELECT * FROM mentor_availability
			WHERE mentor_user_id = ? AND is_active = 1
			ORDER BY day_of_week, start_time`
		)
		.bind(locals.user.id)
		.all();

	// Load blocked dates (current and future only)
	const blockedDates = await db
		.prepare(
			`SELECT * FROM mentor_blocked_dates
			WHERE mentor_user_id = ? AND is_active = 1 AND end_date >= DATE('now')
			ORDER BY start_date`
		)
		.bind(locals.user.id)
		.all();

	return {
		user: locals.user,
		mentor,
		availability: availability.results || [],
		blockedDates: blockedDates.results || []
	};
};

export const actions: Actions = {
	// Add or update availability slot
	addAvailability: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const dayOfWeek = parseInt(formData.get('day_of_week') as string);
		const startTime = formData.get('start_time') as string;
		const endTime = formData.get('end_time') as string;
		const timezone = formData.get('timezone') as string;

		// Validate inputs
		if (
			isNaN(dayOfWeek) ||
			dayOfWeek < 0 ||
			dayOfWeek > 6 ||
			!startTime ||
			!endTime ||
			!timezone
		) {
			return fail(400, { error: 'Invalid availability data' });
		}

		if (startTime >= endTime) {
			return fail(400, { error: 'End time must be after start time' });
		}

		try {
			await db
				.prepare(
					`INSERT INTO mentor_availability (mentor_user_id, day_of_week, start_time, end_time, timezone)
					VALUES (?, ?, ?, ?, ?)`
				)
				.bind(locals.user.id, dayOfWeek, startTime, endTime, timezone)
				.run();

			return { success: true, message: 'Availability added successfully' };
		} catch (err) {
			console.error('Failed to add availability:', err);
			return fail(500, { error: 'Failed to add availability' });
		}
	},

	// Remove availability slot
	removeAvailability: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const availabilityId = parseInt(formData.get('availability_id') as string);

		if (isNaN(availabilityId)) {
			return fail(400, { error: 'Invalid availability ID' });
		}

		try {
			// Soft delete by setting is_active = 0
			await db
				.prepare(
					`UPDATE mentor_availability
					SET is_active = 0
					WHERE id = ? AND mentor_user_id = ?`
				)
				.bind(availabilityId, locals.user.id)
				.run();

			return { success: true, message: 'Availability removed successfully' };
		} catch (err) {
			console.error('Failed to remove availability:', err);
			return fail(500, { error: 'Failed to remove availability' });
		}
	},

	// Add blocked date range
	addBlockedDate: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const startDate = formData.get('start_date') as string;
		const endDate = formData.get('end_date') as string;
		const reason = formData.get('reason') as string;

		// Validate inputs
		if (!startDate || !endDate) {
			return fail(400, { error: 'Start and end dates are required' });
		}

		if (startDate > endDate) {
			return fail(400, { error: 'End date must be after start date' });
		}

		try {
			await db
				.prepare(
					`INSERT INTO mentor_blocked_dates (mentor_user_id, start_date, end_date, reason)
					VALUES (?, ?, ?, ?)`
				)
				.bind(locals.user.id, startDate, endDate, reason || null)
				.run();

			return { success: true, message: 'Blocked dates added successfully' };
		} catch (err) {
			console.error('Failed to add blocked dates:', err);
			return fail(500, { error: 'Failed to add blocked dates' });
		}
	},

	// Remove blocked date range
	removeBlockedDate: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const blockedDateId = parseInt(formData.get('blocked_date_id') as string);

		if (isNaN(blockedDateId)) {
			return fail(400, { error: 'Invalid blocked date ID' });
		}

		try {
			// Soft delete by setting is_active = 0
			await db
				.prepare(
					`UPDATE mentor_blocked_dates
					SET is_active = 0
					WHERE id = ? AND mentor_user_id = ?`
				)
				.bind(blockedDateId, locals.user.id)
				.run();

			return { success: true, message: 'Blocked dates removed successfully' };
		} catch (err) {
			console.error('Failed to remove blocked dates:', err);
			return fail(500, { error: 'Failed to remove blocked dates' });
		}
	}
};
