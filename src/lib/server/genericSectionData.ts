/**
 * Server-side utilities for working with generic section data
 */

import type {
	SectionField,
	ParsedSectionField,
	SectionData,
	ParsedSectionData,
	FieldType
} from '$lib/types';
import { calculateGenericSectionScore, countCompletedFields } from '$lib/genericScoring';

/**
 * Fetch all fields for a section
 */
export async function getSectionFields(
	db: D1Database,
	sectionId: number
): Promise<ParsedSectionField[]> {
	const result = await db
		.prepare(
			`
			SELECT
				sf.*,
				ft.id as field_type_id,
				ft.type_name as field_type_name,
				ft.display_name as field_type_display_name,
				ft.validation_schema as field_type_validation_schema,
				ft.default_config as field_type_default_config,
				ft.icon as field_type_icon,
				ft.is_active as field_type_is_active,
				ft.created_at as field_type_created_at
			FROM section_fields sf
			JOIN field_types ft ON sf.field_type_id = ft.id
			WHERE sf.section_id = ?
			ORDER BY sf.display_order ASC
		`
		)
		.bind(sectionId)
		.all<SectionField & { [key: string]: any }>();

	if (!result.results) return [];

	return result.results.map((row) => {
		const field: ParsedSectionField = {
			id: row.id,
			section_id: row.section_id,
			field_name: row.field_name,
			field_label: row.field_label,
			field_type_id: row.field_type_id,
			is_required: Boolean(row.is_required),
			importance_level: row.importance_level,
			help_text: row.help_text,
			placeholder: row.placeholder,
			default_value: row.default_value,
			display_order: row.display_order,
			created_at: row.created_at,
			updated_at: row.updated_at,
			field_type: {
				id: row.field_type_id,
				type_name: row.field_type_name,
				display_name: row.field_type_display_name,
				validation_schema: row.field_type_validation_schema,
				default_config: row.field_type_default_config,
				icon: row.field_type_icon,
				is_active: Boolean(row.field_type_is_active),
				created_at: row.field_type_created_at
			},
			field_config: row.field_config ? JSON.parse(row.field_config) : null,
			conditional_logic: row.conditional_logic ? JSON.parse(row.conditional_logic) : null
		};
		return field;
	});
}

/**
 * Fetch section data for a user
 */
export async function getSectionData(
	db: D1Database,
	userId: number,
	sectionId: number
): Promise<ParsedSectionData | null> {
	const result = await db
		.prepare(
			`
			SELECT * FROM section_data
			WHERE user_id = ? AND section_id = ?
		`
		)
		.bind(userId, sectionId)
		.first<SectionData>();

	if (!result) return null;

	return {
		...result,
		data: result.data ? JSON.parse(result.data) : {}
	};
}

/**
 * Save section data for a user
 */
export async function saveSectionData(
	db: D1Database,
	userId: number,
	sectionId: number,
	data: Record<string, any>,
	fields: ParsedSectionField[]
): Promise<void> {
	// Calculate completion stats
	const { completed, total } = countCompletedFields(fields, data);

	// Check if record exists
	const existing = await getSectionData(db, userId, sectionId);

	if (existing) {
		// Update existing record
		await db
			.prepare(
				`
				UPDATE section_data
				SET data = ?,
				    completed_fields = ?,
				    total_fields = ?,
				    updated_at = CURRENT_TIMESTAMP
				WHERE user_id = ? AND section_id = ?
			`
			)
			.bind(JSON.stringify(data), completed, total, userId, sectionId)
			.run();
	} else {
		// Insert new record
		await db
			.prepare(
				`
				INSERT INTO section_data (user_id, section_id, data, completed_fields, total_fields)
				VALUES (?, ?, ?, ?, ?)
			`
			)
			.bind(userId, sectionId, JSON.stringify(data), completed, total)
			.run();
	}

	// Update progress in user_journey_progress table
	await updateSectionProgress(db, userId, sectionId, fields, data);
}

/**
 * Update section progress in user_journey_progress
 */
async function updateSectionProgress(
	db: D1Database,
	userId: number,
	sectionId: number,
	fields: ParsedSectionField[],
	data: Record<string, any>
): Promise<void> {
	// Calculate score
	const score = calculateGenericSectionScore(fields, data);
	const isCompleted = score >= 80; // Consider 80%+ as completed

	// Find user_journey_id for this section
	const userJourney = await db
		.prepare(
			`
			SELECT uj.id
			FROM user_journeys uj
			JOIN journey_sections js ON uj.journey_id = js.journey_id
			WHERE uj.user_id = ? AND js.section_id = ?
			LIMIT 1
		`
		)
		.bind(userId, sectionId)
		.first<{ id: number }>();

	if (!userJourney) return;

	// Update or insert progress
	const existing = await db
		.prepare(
			`
			SELECT id FROM user_journey_progress
			WHERE user_journey_id = ? AND section_id = ?
		`
		)
		.bind(userJourney.id, sectionId)
		.first<{ id: number }>();

	if (existing) {
		await db
			.prepare(
				`
				UPDATE user_journey_progress
				SET score = ?,
				    is_completed = ?,
				    last_updated = CURRENT_TIMESTAMP
				WHERE user_journey_id = ? AND section_id = ?
			`
			)
			.bind(score, isCompleted ? 1 : 0, userJourney.id, sectionId)
			.run();
	} else {
		await db
			.prepare(
				`
				INSERT INTO user_journey_progress (user_journey_id, section_id, score, is_completed)
				VALUES (?, ?, ?, ?)
			`
			)
			.bind(userJourney.id, sectionId, score, isCompleted ? 1 : 0)
			.run();
	}
}

/**
 * Get section with its fields and user data
 */
export async function getSectionWithData(
	db: D1Database,
	userId: number,
	sectionId: number
): Promise<{
	fields: ParsedSectionField[];
	data: Record<string, any>;
	score: number;
	completedFields: number;
	totalFields: number;
}> {
	const fields = await getSectionFields(db, sectionId);
	const sectionData = await getSectionData(db, userId, sectionId);

	const data = sectionData?.data || {};
	const score = calculateGenericSectionScore(fields, data);
	const { completed, total } = countCompletedFields(fields, data);

	return {
		fields,
		data,
		score,
		completedFields: completed,
		totalFields: total
	};
}

/**
 * Delete section data for a user
 */
export async function deleteSectionData(
	db: D1Database,
	userId: number,
	sectionId: number
): Promise<void> {
	await db
		.prepare(
			`
			DELETE FROM section_data
			WHERE user_id = ? AND section_id = ?
		`
		)
		.bind(userId, sectionId)
		.run();
}

/**
 * Get all section data for a user across all sections
 */
export async function getAllUserSectionData(
	db: D1Database,
	userId: number
): Promise<Map<number, ParsedSectionData>> {
	const result = await db
		.prepare(
			`
			SELECT * FROM section_data
			WHERE user_id = ?
		`
		)
		.bind(userId)
		.all<SectionData>();

	const dataMap = new Map<number, ParsedSectionData>();

	result.results?.forEach((row) => {
		dataMap.set(row.section_id, {
			...row,
			data: row.data ? JSON.parse(row.data) : {}
		});
	});

	return dataMap;
}

/**
 * Bulk save multiple section data entries (for migration)
 */
export async function bulkSaveSectionData(
	db: D1Database,
	entries: Array<{
		userId: number;
		sectionId: number;
		data: Record<string, any>;
	}>
): Promise<void> {
	for (const entry of entries) {
		const fields = await getSectionFields(db, entry.sectionId);
		await saveSectionData(db, entry.userId, entry.sectionId, entry.data, fields);
	}
}

type SectionDataRow = {
	slug: string;
	section_ref_id: number;
	section_data_id: number | null;
	section_data_user_id: number | null;
	section_data_section_id: number | null;
	data: string | null;
	completed_fields: number | null;
	total_fields: number | null;
	created_at: string | null;
	updated_at: string | null;
};

/**
 * Fetch parsed section_data rows for a set of section slugs.
 * Returns a map keyed by slug with ParsedSectionData or null if no record exists.
 */
export async function getSectionDataBySlugs(
	db: D1Database,
	userId: number,
	sectionSlugs: string[]
): Promise<Record<string, ParsedSectionData | null>> {
	const uniqueSlugs = Array.from(new Set(sectionSlugs.filter(Boolean)));
	if (uniqueSlugs.length === 0) {
		return {};
	}

	const placeholders = uniqueSlugs.map(() => '?').join(', ');

	const result = await db
		.prepare(
			`
			SELECT
				s.slug,
				s.id as section_ref_id,
				sd.id as section_data_id,
				sd.user_id as section_data_user_id,
				sd.section_id as section_data_section_id,
				sd.data,
				sd.completed_fields,
				sd.total_fields,
				sd.created_at,
				sd.updated_at
			FROM sections s
			LEFT JOIN section_data sd ON sd.section_id = s.id AND sd.user_id = ?
			WHERE s.slug IN (${placeholders})
		`
		)
		.bind(userId, ...uniqueSlugs)
		.all<SectionDataRow>();

	const dataMap: Record<string, ParsedSectionData | null> = {};
	for (const slug of uniqueSlugs) {
		dataMap[slug] = null;
	}

	result.results?.forEach((row) => {
		if (!row.slug) return;
		if (row.section_data_id === null || row.section_data_id === undefined) {
			dataMap[row.slug] = null;
			return;
		}

		dataMap[row.slug] = {
			id: row.section_data_id,
			user_id: row.section_data_user_id ?? userId,
			section_id: row.section_data_section_id ?? row.section_ref_id,
			data: row.data ? JSON.parse(row.data) : {},
			completed_fields: row.completed_fields ?? 0,
			total_fields: row.total_fields ?? 0,
			created_at: row.created_at ?? '',
			updated_at: row.updated_at ?? ''
		};
	});

	return dataMap;
}
