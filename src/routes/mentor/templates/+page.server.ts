/**
 * Review Templates Management
 * Allows mentors to create and manage reusable review templates
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

	// Load user's templates
	const templates = await db
		.prepare(
			`SELECT * FROM review_templates
			WHERE mentor_user_id = ?
			ORDER BY category, title`
		)
		.bind(locals.user.id)
		.all();

	// Load shared templates from other mentors
	const sharedTemplates = await db
		.prepare(
			`SELECT rt.*, u.username as author_name
			FROM review_templates rt
			INNER JOIN users u ON rt.mentor_user_id = u.id
			WHERE rt.is_shared = 1 AND rt.mentor_user_id != ?
			ORDER BY rt.usage_count DESC, rt.title
			LIMIT 20`
		)
		.bind(locals.user.id)
		.all();

	return {
		user: locals.user,
		mentor,
		templates: templates.results || [],
		sharedTemplates: sharedTemplates.results || []
	};
};

export const actions: Actions = {
	// Create new template
	createTemplate: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const title = formData.get('title') as string;
		const content = formData.get('content') as string;
		const category = formData.get('category') as string;
		const sectionType = formData.get('section_type') as string;
		const isShared = formData.get('is_shared') === 'true';

		// Validate
		if (!title || !content || !category) {
			return fail(400, { error: 'Title, content, and category are required' });
		}

		if (title.length > 200) {
			return fail(400, { error: 'Title must be 200 characters or less' });
		}

		if (content.length > 5000) {
			return fail(400, { error: 'Content must be 5000 characters or less' });
		}

		try {
			await db
				.prepare(
					`INSERT INTO review_templates (mentor_user_id, title, content, category, section_type, is_shared)
					VALUES (?, ?, ?, ?, ?, ?)`
				)
				.bind(
					locals.user.id,
					title,
					content,
					category,
					sectionType || null,
					isShared ? 1 : 0
				)
				.run();

			return { success: true, message: 'Template created successfully' };
		} catch (err) {
			console.error('Failed to create template:', err);
			return fail(500, { error: 'Failed to create template' });
		}
	},

	// Update template
	updateTemplate: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const templateId = parseInt(formData.get('template_id') as string);
		const title = formData.get('title') as string;
		const content = formData.get('content') as string;
		const category = formData.get('category') as string;
		const sectionType = formData.get('section_type') as string;
		const isShared = formData.get('is_shared') === 'true';

		// Validate
		if (isNaN(templateId) || !title || !content || !category) {
			return fail(400, { error: 'Invalid template data' });
		}

		try {
			await db
				.prepare(
					`UPDATE review_templates
					SET title = ?, content = ?, category = ?, section_type = ?, is_shared = ?
					WHERE id = ? AND mentor_user_id = ?`
				)
				.bind(title, content, category, sectionType || null, isShared ? 1 : 0, templateId, locals.user.id)
				.run();

			return { success: true, message: 'Template updated successfully' };
		} catch (err) {
			console.error('Failed to update template:', err);
			return fail(500, { error: 'Failed to update template' });
		}
	},

	// Delete template
	deleteTemplate: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const templateId = parseInt(formData.get('template_id') as string);

		if (isNaN(templateId)) {
			return fail(400, { error: 'Invalid template ID' });
		}

		try {
			await db
				.prepare(
					`DELETE FROM review_templates
					WHERE id = ? AND mentor_user_id = ?`
				)
				.bind(templateId, locals.user.id)
				.run();

			return { success: true, message: 'Template deleted successfully' };
		} catch (err) {
			console.error('Failed to delete template:', err);
			return fail(500, { error: 'Failed to delete template' });
		}
	},

	// Copy shared template to own templates
	copyTemplate: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const sourceTemplateId = parseInt(formData.get('source_template_id') as string);

		if (isNaN(sourceTemplateId)) {
			return fail(400, { error: 'Invalid template ID' });
		}

		try {
			// Get source template
			const sourceTemplate = await db
				.prepare('SELECT * FROM review_templates WHERE id = ? AND is_shared = 1')
				.bind(sourceTemplateId)
				.first();

			if (!sourceTemplate) {
				return fail(404, { error: 'Template not found or not shared' });
			}

			// Copy to user's templates
			await db
				.prepare(
					`INSERT INTO review_templates (mentor_user_id, title, content, category, section_type, is_shared)
					VALUES (?, ?, ?, ?, ?, 0)`
				)
				.bind(
					locals.user.id,
					sourceTemplate.title + ' (Copy)',
					sourceTemplate.content,
					sourceTemplate.category,
					sourceTemplate.section_type
				)
				.run();

			return { success: true, message: 'Template copied to your templates' };
		} catch (err) {
			console.error('Failed to copy template:', err);
			return fail(500, { error: 'Failed to copy template' });
		}
	}
};
