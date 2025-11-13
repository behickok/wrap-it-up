import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { Journey, JourneyCreator } from '$lib/types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw new Error('Database not available');
	}

	// Fetch all journeys
	const journeysResult = await db
		.prepare(
			`
			SELECT
				j.*,
				jc.is_published,
				jc.is_featured,
				jc.use_count,
				jc.creator_user_id
			FROM journeys j
			LEFT JOIN journey_creators jc ON j.id = jc.journey_id
			ORDER BY j.created_at DESC
		`
		)
		.all<Journey & Partial<JourneyCreator>>();

	const journeys = journeysResult.results || [];

	return {
		journeys,
		user: locals.user
	};
};

export const actions: Actions = {
	createJourney: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return { success: false, error: 'Not authenticated' };
		}

		const db = platform?.env?.DB;
		if (!db) {
			return { success: false, error: 'Database not available' };
		}

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const slug = formData.get('slug') as string;
		const description = formData.get('description') as string;
		const icon = formData.get('icon') as string;

		try {
			// Create journey
			const result = await db
				.prepare(
					`
					INSERT INTO journeys (slug, name, description, icon, is_active)
					VALUES (?, ?, ?, ?, 0)
					RETURNING id
				`
				)
				.bind(slug, name, description, icon)
				.first<{ id: number }>();

			if (!result) {
				return { success: false, error: 'Failed to create journey' };
			}

			// Create journey creator entry
			await db
				.prepare(
					`
					INSERT INTO journey_creators (journey_id, creator_user_id, is_published, is_featured)
					VALUES (?, ?, 0, 0)
				`
				)
				.bind(result.id, locals.user.id)
				.run();

			// Redirect to edit page
			throw redirect(303, `/admin/journeys/${result.id}/edit`);
		} catch (error) {
			if (error instanceof Response) {
				throw error;
			}
			console.error('Error creating journey:', error);
			return { success: false, error: 'Failed to create journey' };
		}
	},

	deleteJourney: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return { success: false, error: 'Not authenticated' };
		}

		const db = platform?.env?.DB;
		if (!db) {
			return { success: false, error: 'Database not available' };
		}

		const formData = await request.formData();
		const journeyId = parseInt(formData.get('journey_id') as string);

		try {
			// Check if user is the creator
			const creator = await db
				.prepare(
					`
					SELECT creator_user_id FROM journey_creators
					WHERE journey_id = ?
				`
				)
				.bind(journeyId)
				.first<{ creator_user_id: number }>();

			if (!creator || creator.creator_user_id !== locals.user.id) {
				return { success: false, error: 'Not authorized to delete this journey' };
			}

			// Delete journey (cascade will handle related records)
			await db
				.prepare('DELETE FROM journeys WHERE id = ?')
				.bind(journeyId)
				.run();

			return { success: true };
		} catch (error) {
			console.error('Error deleting journey:', error);
			return { success: false, error: 'Failed to delete journey' };
		}
	},

	publishJourney: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return { success: false, error: 'Not authenticated' };
		}

		const db = platform?.env?.DB;
		if (!db) {
			return { success: false, error: 'Database not available' };
		}

		const formData = await request.formData();
		const journeyId = parseInt(formData.get('journey_id') as string);
		const publish = formData.get('publish') === 'true';

		try {
			// Check if user is the creator
			const creator = await db
				.prepare(
					`
					SELECT creator_user_id FROM journey_creators
					WHERE journey_id = ?
				`
				)
				.bind(journeyId)
				.first<{ creator_user_id: number }>();

			if (!creator || creator.creator_user_id !== locals.user.id) {
				return { success: false, error: 'Not authorized' };
			}

			// Update published status and journey active status
			await db
				.prepare(
					`
					UPDATE journey_creators
					SET is_published = ?, updated_at = CURRENT_TIMESTAMP
					WHERE journey_id = ?
				`
				)
				.bind(publish ? 1 : 0, journeyId)
				.run();

			await db
				.prepare(
					`
					UPDATE journeys
					SET is_active = ?, updated_at = CURRENT_TIMESTAMP
					WHERE id = ?
				`
				)
				.bind(publish ? 1 : 0, journeyId)
				.run();

			return { success: true };
		} catch (error) {
			console.error('Error publishing journey:', error);
			return { success: false, error: 'Failed to publish journey' };
		}
	}
};
