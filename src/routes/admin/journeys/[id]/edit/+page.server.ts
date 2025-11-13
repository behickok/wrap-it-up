import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type {
	Journey,
	Category,
	Section,
	JourneyCategoryMapping,
	JourneySection,
	FieldType,
	SectionField
} from '$lib/types';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw new Error('Database not available');
	}

	const journeyId = parseInt(params.id);
	if (isNaN(journeyId)) {
		throw error(400, 'Invalid journey ID');
	}

	// Fetch journey details
	const journey = await db
		.prepare('SELECT * FROM journeys WHERE id = ?')
		.bind(journeyId)
		.first<Journey>();

	if (!journey) {
		throw error(404, 'Journey not found');
	}

	// Check if user is the creator
	const creator = await db
		.prepare('SELECT creator_user_id FROM journey_creators WHERE journey_id = ?')
		.bind(journeyId)
		.first<{ creator_user_id: number }>();

	if (!creator || creator.creator_user_id !== locals.user.id) {
		throw error(403, 'Not authorized to edit this journey');
	}

	// Fetch all available categories
	const allCategoriesResult = await db
		.prepare('SELECT * FROM categories ORDER BY name')
		.all<Category>();
	const allCategories = allCategoriesResult.results || [];

	// Fetch journey categories (assigned categories)
	const journeyCategoriesResult = await db
		.prepare(
			`
			SELECT jc.*, c.name, c.description, c.icon
			FROM journey_categories jc
			JOIN categories c ON jc.category_id = c.id
			WHERE jc.journey_id = ?
			ORDER BY jc.display_order
		`
		)
		.bind(journeyId)
		.all<JourneyCategoryMapping & Category>();
	const journeyCategories = journeyCategoriesResult.results || [];

	// Fetch sections for this journey with their category assignments
	const sectionsResult = await db
		.prepare(
			`
			SELECT js.*, s.slug, s.name, s.description, s.scoring_type, s.weight, c.name as category_name
			FROM journey_sections js
			JOIN sections s ON js.section_id = s.id
			JOIN categories c ON js.category_id = c.id
			WHERE js.journey_id = ?
			ORDER BY js.category_id, js.display_order
		`
		)
		.bind(journeyId)
		.all<JourneySection & Section & { category_name: string }>();
	const sections = sectionsResult.results || [];

	// Fetch fields for each section
	const sectionIds = sections.map((s) => s.section_id);
	const fieldsResult =
		sectionIds.length > 0
			? await db
					.prepare(
						`
					SELECT sf.*, ft.type_name, ft.display_name, ft.icon
					FROM section_fields sf
					JOIN field_types ft ON sf.field_type_id = ft.id
					WHERE sf.section_id IN (${sectionIds.map(() => '?').join(',')})
					ORDER BY sf.section_id, sf.display_order
				`
					)
					.bind(...sectionIds)
					.all<SectionField & { type_name: string; display_name: string; icon: string | null }>()
			: { results: [] };
	const fields = fieldsResult.results || [];

	// Fetch all field types for the field editor
	const fieldTypesResult = await db
		.prepare('SELECT * FROM field_types WHERE is_active = 1 ORDER BY display_name')
		.all<FieldType>();
	const fieldTypes = fieldTypesResult.results || [];

	return {
		journey,
		allCategories,
		journeyCategories,
		sections,
		fields,
		fieldTypes
	};
};

export const actions: Actions = {
	// Update journey basic info
	updateJourney: async ({ request, params, locals, platform }) => {
		if (!locals.user) {
			return { success: false, error: 'Not authenticated' };
		}

		const db = platform?.env?.DB;
		if (!db) {
			return { success: false, error: 'Database not available' };
		}

		const journeyId = parseInt(params.id);
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const slug = formData.get('slug') as string;
		const description = formData.get('description') as string;
		const icon = formData.get('icon') as string;

		try {
			await db
				.prepare(
					`
					UPDATE journeys
					SET name = ?, slug = ?, description = ?, icon = ?, updated_at = CURRENT_TIMESTAMP
					WHERE id = ?
				`
				)
				.bind(name, slug, description, icon, journeyId)
				.run();

			return { success: true, action: 'updateJourney' };
		} catch (err) {
			console.error('Error updating journey:', err);
			return { success: false, error: 'Failed to update journey' };
		}
	},

	// Add category to journey
	addCategory: async ({ request, params, locals, platform }) => {
		if (!locals.user) {
			return { success: false, error: 'Not authenticated' };
		}

		const db = platform?.env?.DB;
		if (!db) {
			return { success: false, error: 'Database not available' };
		}

		const journeyId = parseInt(params.id);
		const formData = await request.formData();
		const categoryId = parseInt(formData.get('category_id') as string);
		const displayOrder = parseInt(formData.get('display_order') as string) || 0;

		try {
			await db
				.prepare(
					`
					INSERT INTO journey_categories (journey_id, category_id, display_order)
					VALUES (?, ?, ?)
				`
				)
				.bind(journeyId, categoryId, displayOrder)
				.run();

			return { success: true, action: 'addCategory' };
		} catch (err) {
			console.error('Error adding category:', err);
			return { success: false, error: 'Failed to add category' };
		}
	},

	// Remove category from journey
	removeCategory: async ({ request, params, locals, platform }) => {
		if (!locals.user) {
			return { success: false, error: 'Not authenticated' };
		}

		const db = platform?.env?.DB;
		if (!db) {
			return { success: false, error: 'Database not available' };
		}

		const journeyId = parseInt(params.id);
		const formData = await request.formData();
		const categoryId = parseInt(formData.get('category_id') as string);

		try {
			await db
				.prepare(
					`
					DELETE FROM journey_categories
					WHERE journey_id = ? AND category_id = ?
				`
				)
				.bind(journeyId, categoryId)
				.run();

			return { success: true, action: 'removeCategory' };
		} catch (err) {
			console.error('Error removing category:', err);
			return { success: false, error: 'Failed to remove category' };
		}
	},

	// Create new section
	createSection: async ({ request, params, locals, platform }) => {
		if (!locals.user) {
			return { success: false, error: 'Not authenticated' };
		}

		const db = platform?.env?.DB;
		if (!db) {
			return { success: false, error: 'Database not available' };
		}

		const journeyId = parseInt(params.id);
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const slug = formData.get('slug') as string;
		const description = formData.get('description') as string;
		const categoryId = parseInt(formData.get('category_id') as string);
		const weight = parseInt(formData.get('weight') as string) || 5;
		const scoringType = (formData.get('scoring_type') as string) || 'field_count';

		try {
			// Create section
			const sectionResult = await db
				.prepare(
					`
					INSERT INTO sections (slug, name, description, scoring_type, weight)
					VALUES (?, ?, ?, ?, ?)
					RETURNING id
				`
				)
				.bind(slug, name, description, scoringType, weight)
				.first<{ id: number }>();

			if (!sectionResult) {
				return { success: false, error: 'Failed to create section' };
			}

			// Get display order (max + 1)
			const displayOrderResult = await db
				.prepare(
					`
					SELECT COALESCE(MAX(display_order), 0) + 1 as next_order
					FROM journey_sections
					WHERE journey_id = ? AND category_id = ?
				`
				)
				.bind(journeyId, categoryId)
				.first<{ next_order: number }>();

			const displayOrder = displayOrderResult?.next_order || 1;

			// Link section to journey
			await db
				.prepare(
					`
					INSERT INTO journey_sections (journey_id, section_id, category_id, display_order)
					VALUES (?, ?, ?, ?)
				`
				)
				.bind(journeyId, sectionResult.id, categoryId, displayOrder)
				.run();

			return { success: true, action: 'createSection', sectionId: sectionResult.id };
		} catch (err) {
			console.error('Error creating section:', err);
			return { success: false, error: 'Failed to create section' };
		}
	},

	// Update section
	updateSection: async ({ request, params, locals, platform }) => {
		if (!locals.user) {
			return { success: false, error: 'Not authenticated' };
		}

		const db = platform?.env?.DB;
		if (!db) {
			return { success: false, error: 'Database not available' };
		}

		const formData = await request.formData();
		const sectionId = parseInt(formData.get('section_id') as string);
		const name = formData.get('name') as string;
		const slug = formData.get('slug') as string;
		const description = formData.get('description') as string;
		const weight = parseInt(formData.get('weight') as string) || 5;

		try {
			await db
				.prepare(
					`
					UPDATE sections
					SET name = ?, slug = ?, description = ?, weight = ?
					WHERE id = ?
				`
				)
				.bind(name, slug, description, weight, sectionId)
				.run();

			return { success: true, action: 'updateSection' };
		} catch (err) {
			console.error('Error updating section:', err);
			return { success: false, error: 'Failed to update section' };
		}
	},

	// Delete section
	deleteSection: async ({ request, params, locals, platform }) => {
		if (!locals.user) {
			return { success: false, error: 'Not authenticated' };
		}

		const db = platform?.env?.DB;
		if (!db) {
			return { success: false, error: 'Database not available' };
		}

		const formData = await request.formData();
		const sectionId = parseInt(formData.get('section_id') as string);

		try {
			await db.prepare('DELETE FROM sections WHERE id = ?').bind(sectionId).run();
			return { success: true, action: 'deleteSection' };
		} catch (err) {
			console.error('Error deleting section:', err);
			return { success: false, error: 'Failed to delete section' };
		}
	},

	// Create field
	createField: async ({ request, params, locals, platform }) => {
		if (!locals.user) {
			return { success: false, error: 'Not authenticated' };
		}

		const db = platform?.env?.DB;
		if (!db) {
			return { success: false, error: 'Database not available' };
		}

		const formData = await request.formData();
		const sectionId = parseInt(formData.get('section_id') as string);
		const fieldName = formData.get('field_name') as string;
		const fieldLabel = formData.get('field_label') as string;
		const fieldTypeId = parseInt(formData.get('field_type_id') as string);
		const isRequired = formData.get('is_required') === 'true';
		const importanceLevel = formData.get('importance_level') as string;
		const helpText = formData.get('help_text') as string;
		const placeholder = formData.get('placeholder') as string;
		const fieldConfig = formData.get('field_config') as string;

		try {
			// Get next display order
			const displayOrderResult = await db
				.prepare(
					`
					SELECT COALESCE(MAX(display_order), 0) + 1 as next_order
					FROM section_fields
					WHERE section_id = ?
				`
				)
				.bind(sectionId)
				.first<{ next_order: number }>();

			const displayOrder = displayOrderResult?.next_order || 1;

			await db
				.prepare(
					`
					INSERT INTO section_fields (
						section_id, field_name, field_label, field_type_id,
						is_required, importance_level, help_text, placeholder,
						field_config, display_order
					)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
				`
				)
				.bind(
					sectionId,
					fieldName,
					fieldLabel,
					fieldTypeId,
					isRequired ? 1 : 0,
					importanceLevel,
					helpText || null,
					placeholder || null,
					fieldConfig || null,
					displayOrder
				)
				.run();

			return { success: true, action: 'createField' };
		} catch (err) {
			console.error('Error creating field:', err);
			return { success: false, error: 'Failed to create field' };
		}
	},

	// Update field
	updateField: async ({ request, params, locals, platform }) => {
		if (!locals.user) {
			return { success: false, error: 'Not authenticated' };
		}

		const db = platform?.env?.DB;
		if (!db) {
			return { success: false, error: 'Database not available' };
		}

		const formData = await request.formData();
		const fieldId = parseInt(formData.get('field_id') as string);
		const fieldName = formData.get('field_name') as string;
		const fieldLabel = formData.get('field_label') as string;
		const fieldTypeId = parseInt(formData.get('field_type_id') as string);
		const isRequired = formData.get('is_required') === 'true';
		const importanceLevel = formData.get('importance_level') as string;
		const helpText = formData.get('help_text') as string;
		const placeholder = formData.get('placeholder') as string;
		const fieldConfig = formData.get('field_config') as string;

		try {
			await db
				.prepare(
					`
					UPDATE section_fields
					SET field_name = ?, field_label = ?, field_type_id = ?,
						is_required = ?, importance_level = ?, help_text = ?,
						placeholder = ?, field_config = ?, updated_at = CURRENT_TIMESTAMP
					WHERE id = ?
				`
				)
				.bind(
					fieldName,
					fieldLabel,
					fieldTypeId,
					isRequired ? 1 : 0,
					importanceLevel,
					helpText || null,
					placeholder || null,
					fieldConfig || null,
					fieldId
				)
				.run();

			return { success: true, action: 'updateField' };
		} catch (err) {
			console.error('Error updating field:', err);
			return { success: false, error: 'Failed to update field' };
		}
	},

	// Delete field
	deleteField: async ({ request, params, locals, platform }) => {
		if (!locals.user) {
			return { success: false, error: 'Not authenticated' };
		}

		const db = platform?.env?.DB;
		if (!db) {
			return { success: false, error: 'Database not available' };
		}

		const formData = await request.formData();
		const fieldId = parseInt(formData.get('field_id') as string);

		try {
			await db.prepare('DELETE FROM section_fields WHERE id = ?').bind(fieldId).run();
			return { success: true, action: 'deleteField' };
		} catch (err) {
			console.error('Error deleting field:', err);
			return { success: false, error: 'Failed to delete field' };
		}
	},

	// Reorder fields
	reorderFields: async ({ request, params, locals, platform }) => {
		if (!locals.user) {
			return { success: false, error: 'Not authenticated' };
		}

		const db = platform?.env?.DB;
		if (!db) {
			return { success: false, error: 'Database not available' };
		}

		const formData = await request.formData();
		const fieldIds = JSON.parse(formData.get('field_ids') as string) as number[];

		try {
			// Update display_order for each field
			for (let i = 0; i < fieldIds.length; i++) {
				await db
					.prepare('UPDATE section_fields SET display_order = ? WHERE id = ?')
					.bind(i + 1, fieldIds[i])
					.run();
			}

			return { success: true, action: 'reorderFields' };
		} catch (err) {
			console.error('Error reordering fields:', err);
			return { success: false, error: 'Failed to reorder fields' };
		}
	}
};
