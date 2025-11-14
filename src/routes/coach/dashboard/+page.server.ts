import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getUserWithRoles, hasPermission, logCoachAccess } from '$lib/server/permissions';
import type { CoachClientWithDetails } from '$lib/types';

type CoachClientRow = CoachClientWithDetails & {
	client_username: string;
	client_email: string;
	journey_name: string | null;
	journey_slug: string | null;
};

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw new Error('Database not available');
	}

	// Load user with roles
	const userWithRoles = await getUserWithRoles(db, locals.user.id);
	if (!userWithRoles) {
		throw redirect(302, '/login');
	}

	// Check if user has coach permissions
	if (!hasPermission(userWithRoles, 'coach.access_client_data')) {
		throw redirect(302, '/');
	}

	// Get or create coach profile
	let coach = await db
		.prepare('SELECT * FROM coaches WHERE user_id = ?')
		.bind(locals.user.id)
		.first<any>();

	if (!coach) {
		// Create coach profile
		await db
			.prepare(
				`
				INSERT INTO coaches (user_id, display_name, is_available)
				VALUES (?, ?, 1)
			`
			)
			.bind(locals.user.id, locals.user.username)
			.run();

		coach = await db
			.prepare('SELECT * FROM coaches WHERE user_id = ?')
			.bind(locals.user.id)
			.first<any>();
	}

	// Fetch coach's clients
	const clientsResult = await db
		.prepare(
			`
			SELECT
				cc.*,
				u.id as client_id,
				u.username as client_username,
				u.email as client_email,
				j.id as journey_id,
				j.name as journey_name,
				j.slug as journey_slug
			FROM coach_clients cc
			JOIN users u ON cc.client_user_id = u.id
			LEFT JOIN journeys j ON cc.journey_id = j.id
			WHERE cc.coach_id = ?
			ORDER BY
				CASE cc.status
					WHEN 'active' THEN 1
					WHEN 'pending' THEN 2
					WHEN 'paused' THEN 3
					WHEN 'ended' THEN 4
				END,
				cc.created_at DESC
		`
		)
		.bind(coach.id)
		.all<CoachClientRow>();

	const clients: CoachClientRow[] = clientsResult.results || [];

	// Calculate summary stats
	const activeClients = clients.filter((c) => c.status === 'active').length;
	const pendingRequests = clients.filter((c) => c.status === 'pending').length;
	const totalClients = clients.length;

	return {
		user: userWithRoles,
		coach,
		clients,
		summary: {
			activeClients,
			pendingRequests,
			totalClients
		}
	};
};

export const actions: Actions = {
	acceptClient: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return { success: false, error: 'Not authenticated' };
		}

		const db = platform?.env?.DB;
		if (!db) {
			return { success: false, error: 'Database not available' };
		}

		const formData = await request.formData();
		const relationshipId = parseInt(formData.get('relationship_id') as string);

		try {
			// Verify this is the coach's client
			const coach = await db
				.prepare('SELECT id FROM coaches WHERE user_id = ?')
				.bind(locals.user.id)
				.first<{ id: number }>();

			if (!coach) {
				return { success: false, error: 'Coach profile not found' };
			}

			const relationship = await db
				.prepare('SELECT * FROM coach_clients WHERE id = ? AND coach_id = ?')
				.bind(relationshipId, coach.id)
				.first<any>();

			if (!relationship) {
				return { success: false, error: 'Relationship not found' };
			}

			// Update status to active
			await db
				.prepare(
					`
					UPDATE coach_clients
					SET status = 'active', updated_at = CURRENT_TIMESTAMP
					WHERE id = ?
				`
				)
				.bind(relationshipId)
				.run();

			return { success: true };
		} catch (error) {
			console.error('Error accepting client:', error);
			return { success: false, error: 'Failed to accept client' };
		}
	},

	rejectClient: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return { success: false, error: 'Not authenticated' };
		}

		const db = platform?.env?.DB;
		if (!db) {
			return { success: false, error: 'Database not available' };
		}

		const formData = await request.formData();
		const relationshipId = parseInt(formData.get('relationship_id') as string);

		try {
			const coach = await db
				.prepare('SELECT id FROM coaches WHERE user_id = ?')
				.bind(locals.user.id)
				.first<{ id: number }>();

			if (!coach) {
				return { success: false, error: 'Coach profile not found' };
			}

			// Delete the relationship
			await db
				.prepare('DELETE FROM coach_clients WHERE id = ? AND coach_id = ?')
				.bind(relationshipId, coach.id)
				.run();

			return { success: true };
		} catch (error) {
			console.error('Error rejecting client:', error);
			return { success: false, error: 'Failed to reject client' };
		}
	},

	pauseClient: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return { success: false, error: 'Not authenticated' };
		}

		const db = platform?.env?.DB;
		if (!db) {
			return { success: false, error: 'Database not available' };
		}

		const formData = await request.formData();
		const relationshipId = parseInt(formData.get('relationship_id') as string);

		try {
			const coach = await db
				.prepare('SELECT id FROM coaches WHERE user_id = ?')
				.bind(locals.user.id)
				.first<{ id: number }>();

			if (!coach) {
				return { success: false, error: 'Coach profile not found' };
			}

			await db
				.prepare(
					`
					UPDATE coach_clients
					SET status = 'paused', updated_at = CURRENT_TIMESTAMP
					WHERE id = ? AND coach_id = ?
				`
				)
				.bind(relationshipId, coach.id)
				.run();

			return { success: true };
		} catch (error) {
			console.error('Error pausing client:', error);
			return { success: false, error: 'Failed to pause client' };
		}
	},

	updateNotes: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return { success: false, error: 'Not authenticated' };
		}

		const db = platform?.env?.DB;
		if (!db) {
			return { success: false, error: 'Database not available' };
		}

		const formData = await request.formData();
		const relationshipId = parseInt(formData.get('relationship_id') as string);
		const notes = formData.get('notes') as string;

		try {
			const coach = await db
				.prepare('SELECT id FROM coaches WHERE user_id = ?')
				.bind(locals.user.id)
				.first<{ id: number }>();

			if (!coach) {
				return { success: false, error: 'Coach profile not found' };
			}

			await db
				.prepare(
					`
					UPDATE coach_clients
					SET notes = ?, updated_at = CURRENT_TIMESTAMP
					WHERE id = ? AND coach_id = ?
				`
				)
				.bind(notes, relationshipId, coach.id)
				.run();

			return { success: true };
		} catch (error) {
			console.error('Error updating notes:', error);
			return { success: false, error: 'Failed to update notes' };
		}
	}
};
