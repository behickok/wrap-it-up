/**
 * Mentor Training Modules
 * View training content and track completion
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

	// Verify user is a mentor (approved or pending)
	const mentor = await db
		.prepare('SELECT * FROM mentor_profiles WHERE user_id = ?')
		.bind(locals.user.id)
		.first();

	if (!mentor) {
		throw error(403, 'Only mentors can access training modules');
	}

	// Load all active training modules
	const modules = await db
		.prepare(
			`SELECT * FROM mentor_training_modules
			WHERE is_active = 1
			ORDER BY order_index, id`
		)
		.all();

	// Load user's progress for each module
	const progress = await db
		.prepare(
			`SELECT * FROM mentor_training_progress
			WHERE mentor_user_id = ?`
		)
		.bind(locals.user.id)
		.all();

	// Create progress map
	const progressMap: Record<number, any> = {};
	(progress.results || []).forEach((p: any) => {
		progressMap[p.module_id] = p;
	});

	// Combine modules with progress
	const modulesWithProgress = (modules.results || []).map((module: any) => ({
		...module,
		progress: progressMap[module.id] || null
	}));

	// Calculate stats
	const totalModules = modulesWithProgress.length;
	const requiredModules = modulesWithProgress.filter((m: any) => m.is_required).length;
	const completedModules = modulesWithProgress.filter(
		(m: any) => m.progress?.completed_at
	).length;
	const completedRequired = modulesWithProgress.filter(
		(m: any) => m.is_required && m.progress?.completed_at
	).length;

	return {
		user: locals.user,
		mentor,
		modules: modulesWithProgress,
		stats: {
			totalModules,
			requiredModules,
			completedModules,
			completedRequired,
			completionPercentage:
				totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0,
			requiredCompletionPercentage:
				requiredModules > 0 ? Math.round((completedRequired / requiredModules) * 100) : 0
		}
	};
};

export const actions: Actions = {
	// Mark module as started
	startModule: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const moduleId = parseInt(formData.get('module_id') as string);

		if (isNaN(moduleId)) {
			return fail(400, { error: 'Invalid module ID' });
		}

		try {
			// Insert or update progress
			await db
				.prepare(
					`INSERT INTO mentor_training_progress (mentor_user_id, module_id, started_at)
					VALUES (?, ?, CURRENT_TIMESTAMP)
					ON CONFLICT(mentor_user_id, module_id)
					DO UPDATE SET started_at = CURRENT_TIMESTAMP WHERE started_at IS NULL`
				)
				.bind(locals.user.id, moduleId)
				.run();

			return { success: true, message: 'Module started' };
		} catch (err) {
			console.error('Failed to start module:', err);
			return fail(500, { error: 'Failed to start module' });
		}
	},

	// Mark module as completed
	completeModule: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const moduleId = parseInt(formData.get('module_id') as string);
		const notes = formData.get('notes') as string;

		if (isNaN(moduleId)) {
			return fail(400, { error: 'Invalid module ID' });
		}

		try {
			// Insert or update progress with completion
			await db
				.prepare(
					`INSERT INTO mentor_training_progress (mentor_user_id, module_id, started_at, completed_at, notes)
					VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)
					ON CONFLICT(mentor_user_id, module_id)
					DO UPDATE SET completed_at = CURRENT_TIMESTAMP, notes = ?`
				)
				.bind(locals.user.id, moduleId, notes || null, notes || null)
				.run();

			return { success: true, message: 'Module completed! 🎉' };
		} catch (err) {
			console.error('Failed to complete module:', err);
			return fail(500, { error: 'Failed to complete module' });
		}
	},

	// Save notes for module
	saveNotes: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const moduleId = parseInt(formData.get('module_id') as string);
		const notes = formData.get('notes') as string;

		if (isNaN(moduleId)) {
			return fail(400, { error: 'Invalid module ID' });
		}

		try {
			await db
				.prepare(
					`UPDATE mentor_training_progress
					SET notes = ?
					WHERE mentor_user_id = ? AND module_id = ?`
				)
				.bind(notes || null, locals.user.id, moduleId)
				.run();

			return { success: true, message: 'Notes saved' };
		} catch (err) {
			console.error('Failed to save notes:', err);
			return fail(500, { error: 'Failed to save notes' });
		}
	}
};
