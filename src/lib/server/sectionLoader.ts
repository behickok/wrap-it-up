import { getSectionDataBySlugs, getSectionFields } from './genericSectionData';
import { loadLegacySectionData, type LegacySectionSlug } from './legacySectionLoaders';
import type { ParsedSectionField, ParsedSectionData } from '$lib/types';

type SectionRow = {
	id: number;
	slug: string;
	name: string;
	description: string | null;
	scoring_type: string | null;
	weight: number | null;
};

export type LoadedSection = {
	section: SectionRow;
	fields: ParsedSectionField[];
	data: Record<string, any>;
	sectionData: ParsedSectionData | null;
};

/**
 * Loads sections (definition + fields + user data) for the given slugs.
 * Falls back to legacy tables when section_data has not been populated yet.
 */
export async function loadSectionsForUser(
	db: D1Database,
	userId: number,
	sectionSlugs: LegacySectionSlug[]
): Promise<Record<LegacySectionSlug, LoadedSection>> {
	const uniqueSlugs = Array.from(new Set(sectionSlugs));
	if (uniqueSlugs.length === 0) {
		return {};
	}

	const placeholders = uniqueSlugs.map(() => '?').join(', ');
	const sectionsResult = await db
		.prepare(
			`
			SELECT id, slug, name, description, scoring_type, weight
			FROM sections
			WHERE slug IN (${placeholders})
		`
		)
		.bind(...uniqueSlugs)
		.all<SectionRow>();

	const sectionMap = new Map<string, SectionRow>();
	sectionsResult.results?.forEach((row) => {
		if (row.slug) {
			sectionMap.set(row.slug, row);
		}
	});

	const sectionDataMap = await getSectionDataBySlugs(db, userId, uniqueSlugs);

	const fieldEntries = await Promise.all(
		uniqueSlugs.map(async (slug) => {
			const section = sectionMap.get(slug);
			if (!section) return [slug, []] as const;
			if (section.id <= 0) return [slug, []] as const;
			const fields = await getSectionFields(db, section.id);
			return [slug, fields] as const;
		})
	);

	const fieldMap = new Map<string, ParsedSectionField[]>();
	for (const [slug, fields] of fieldEntries) {
		fieldMap.set(slug, fields);
	}

	const results: Partial<Record<LegacySectionSlug, LoadedSection>> = {};

	await Promise.all(
		uniqueSlugs.map(async (slug) => {
			const section =
				sectionMap.get(slug) ??
				({
					id: -1,
					slug,
					name: slug,
					description: null,
					scoring_type: null,
					weight: null
				} as SectionRow);

			const sectionData = sectionDataMap[slug] ?? null;
			const data = sectionData ? sectionData.data : await loadLegacySectionData(db, userId, slug);

			results[slug as LegacySectionSlug] = {
				section,
				fields: fieldMap.get(slug) ?? [],
				data: data ?? {},
				sectionData
			};
		})
	);

	return results as Record<LegacySectionSlug, LoadedSection>;
}
