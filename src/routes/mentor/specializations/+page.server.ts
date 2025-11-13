/**
 * Mentor Specializations Management
 * Set and manage mentor expertise areas
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

	// Load all available specializations
	const specializations = await db
		.prepare('SELECT * FROM mentor_specializations WHERE is_active = 1 ORDER BY name')
		.all();

	// Load mentor's current specializations
	const mentorSpecs = await db
		.prepare(
			`SELECT msm.*, ms.name, ms.slug, ms.icon, ms.color
			FROM mentor_specialization_map msm
			INNER JOIN mentor_specializations ms ON msm.specialization_id = ms.id
			WHERE msm.mentor_user_id = ?
			ORDER BY msm.is_primary DESC, ms.name`
		)
		.bind(locals.user.id)
		.all();

	return {
		user: locals.user,
		mentor,
		specializations: specializations.results || [],
		mentorSpecializations: mentorSpecs.results || []
	};
};

export const actions: Actions = {
	// Add specialization to mentor
	addSpecialization: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const specializationId = parseInt(formData.get('specialization_id') as string);
		const proficiencyLevel = parseInt(formData.get('proficiency_level') as string);
		const yearsExperience = parseInt(formData.get('years_experience') as string) || 0;
		const isPrimary = formData.get('is_primary') === 'true';

		// Validate
		if (
			isNaN(specializationId) ||
			isNaN(proficiencyLevel) ||
			proficiencyLevel < 1 ||
			proficiencyLevel > 5
		) {
			return fail(400, { error: 'Invalid specialization data' });
		}

		try {
			// If setting as primary, unset other primary specializations
			if (isPrimary) {
				await db
					.prepare(
						`UPDATE mentor_specialization_map
						SET is_primary = 0
						WHERE mentor_user_id = ?`
					)
					.bind(locals.user.id)
					.run();
			}

			// Add specialization
			await db
				.prepare(
					`INSERT INTO mentor_specialization_map (mentor_user_id, specialization_id, proficiency_level, years_experience, is_primary)
					VALUES (?, ?, ?, ?, ?)`
				)
				.bind(locals.user.id, specializationId, proficiencyLevel, yearsExperience, isPrimary ? 1 : 0)
				.run();

			return { success: true, message: 'Specialization added successfully' };
		} catch (err: any) {
			if (err.message?.includes('UNIQUE')) {
				return fail(400, { error: 'You already have this specialization' });
			}
			console.error('Failed to add specialization:', err);
			return fail(500, { error: 'Failed to add specialization' });
		}
	},

	// Update specialization
	updateSpecialization: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const specializationId = parseInt(formData.get('specialization_id') as string);
		const proficiencyLevel = parseInt(formData.get('proficiency_level') as string);
		const yearsExperience = parseInt(formData.get('years_experience') as string) || 0;
		const isPrimary = formData.get('is_primary') === 'true';

		// Validate
		if (
			isNaN(specializationId) ||
			isNaN(proficiencyLevel) ||
			proficiencyLevel < 1 ||
			proficiencyLevel > 5
		) {
			return fail(400, { error: 'Invalid specialization data' });
		}

		try {
			// If setting as primary, unset other primary specializations
			if (isPrimary) {
				await db
					.prepare(
						`UPDATE mentor_specialization_map
						SET is_primary = 0
						WHERE mentor_user_id = ? AND specialization_id != ?`
					)
					.bind(locals.user.id, specializationId)
					.run();
			}

			// Update specialization
			await db
				.prepare(
					`UPDATE mentor_specialization_map
					SET proficiency_level = ?, years_experience = ?, is_primary = ?
					WHERE mentor_user_id = ? AND specialization_id = ?`
				)
				.bind(proficiencyLevel, yearsExperience, isPrimary ? 1 : 0, locals.user.id, specializationId)
				.run();

			return { success: true, message: 'Specialization updated successfully' };
		} catch (err) {
			console.error('Failed to update specialization:', err);
			return fail(500, { error: 'Failed to update specialization' });
		}
	},

	// Remove specialization
	removeSpecialization: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const specializationId = parseInt(formData.get('specialization_id') as string);

		if (isNaN(specializationId)) {
			return fail(400, { error: 'Invalid specialization ID' });
		}

		try {
			await db
				.prepare(
					`DELETE FROM mentor_specialization_map
					WHERE mentor_user_id = ? AND specialization_id = ?`
				)
				.bind(locals.user.id, specializationId)
				.run();

			return { success: true, message: 'Specialization removed successfully' };
		} catch (err) {
			console.error('Failed to remove specialization:', err);
			return fail(500, { error: 'Failed to remove specialization' });
		}
	}
};
