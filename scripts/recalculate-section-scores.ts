/**
 * Script to recalculate section scores for all users
 * Run this after fixing the scoring system to update existing progress
 *
 * Usage: npx tsx scripts/recalculate-section-scores.ts
 */

import Database from 'better-sqlite3';
import { calculateGenericSectionScore } from '../src/lib/genericScoring';
import type { ParsedSectionField } from '../src/lib/types';

const DB_PATH = process.env.DB_PATH || './.wrangler/state/v3/d1/miniflare-D1DatabaseObject/a55b410dc48736dc6369d367814797270e8199d70c621253a25bd6131901fbfe.sqlite';

async function recalculateScores() {
	const db = new Database(DB_PATH);

	console.log('🔄 Recalculating section scores...\n');

	try {
		// Get all section_data records
		const sectionDataRecords = db.prepare(`
			SELECT
				sd.id,
				sd.user_id,
				sd.section_id,
				sd.data,
				s.slug as section_slug
			FROM section_data sd
			JOIN sections s ON s.id = sd.section_id
		`).all() as Array<{
			id: number;
			user_id: number;
			section_id: number;
			data: string;
			section_slug: string;
		}>;

		console.log(`Found ${sectionDataRecords.length} section data records to process\n`);

		let updatedCount = 0;

		for (const record of sectionDataRecords) {
			// Get fields for this section
			const fields = db.prepare(`
				SELECT
					sf.*,
					ft.type_name as field_type_name,
					ft.display_name as field_type_display_name
				FROM section_fields sf
				JOIN field_types ft ON sf.field_type_id = ft.id
				WHERE sf.section_id = ?
				ORDER BY sf.display_order ASC
			`).all(record.section_id) as any[];

			if (fields.length === 0) {
				console.log(`⏭️  Skipping ${record.section_slug} (no fields in section_fields table)`);
				continue;
			}

			// Parse fields
			const parsedFields: ParsedSectionField[] = fields.map((field: any) => ({
				id: field.id,
				section_id: field.section_id,
				field_name: field.field_name,
				field_label: field.field_label,
				field_type_id: field.field_type_id,
				is_required: Boolean(field.is_required),
				importance_level: field.importance_level,
				help_text: field.help_text,
				placeholder: field.placeholder,
				default_value: field.default_value,
				display_order: field.display_order,
				created_at: field.created_at,
				updated_at: field.updated_at,
				field_type: {
					id: field.field_type_id,
					type_name: field.field_type_name,
					display_name: field.field_type_display_name,
					validation_schema: null,
					default_config: null,
					icon: null,
					is_active: true,
					created_at: field.created_at
				},
				field_config: field.field_config ? JSON.parse(field.field_config) : null,
				conditional_logic: field.conditional_logic ? JSON.parse(field.conditional_logic) : null
			}));

			// Parse data
			const data = JSON.parse(record.data);

			// Calculate new score
			const newScore = calculateGenericSectionScore(parsedFields, data);
			const isCompleted = newScore >= 80;

			// Update section_data
			db.prepare(`
				UPDATE section_data
				SET completed_fields = ?,
				    total_fields = ?
				WHERE id = ?
			`).run(
				parsedFields.filter(f => {
					const value = data[f.field_name];
					return value !== null && value !== undefined && value !== '';
				}).length,
				parsedFields.length,
				record.id
			);

			// Update user_journey_progress for all journeys containing this section
			const userJourneys = db.prepare(`
				SELECT uj.id as user_journey_id
				FROM user_journeys uj
				JOIN journey_sections js ON uj.journey_id = js.journey_id
				WHERE uj.user_id = ? AND js.section_id = ? AND uj.status = 'active'
			`).all(record.user_id, record.section_id) as Array<{ user_journey_id: number }>;

			for (const { user_journey_id } of userJourneys) {
				db.prepare(`
					INSERT INTO user_journey_progress (user_journey_id, section_id, score, is_completed, last_updated)
					VALUES (?, ?, ?, ?, datetime('now'))
					ON CONFLICT(user_journey_id, section_id) DO UPDATE SET
					score = excluded.score,
					is_completed = excluded.is_completed,
					last_updated = excluded.last_updated
				`).run(user_journey_id, record.section_id, newScore, isCompleted ? 1 : 0);
			}

			console.log(`✅ Updated ${record.section_slug} for user ${record.user_id}: ${newScore}%`);
			updatedCount++;
		}

		console.log(`\n✨ Successfully recalculated scores for ${updatedCount} sections`);

	} catch (error) {
		console.error('❌ Error recalculating scores:', error);
		process.exit(1);
	} finally {
		db.close();
	}
}

recalculateScores();
