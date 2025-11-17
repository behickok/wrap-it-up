import { getSectionDataBySlugs, getSectionFields } from './genericSectionData';
import {
	loadLegacySectionData,
	LEGACY_SECTION_SLUGS,
	type LegacySectionSlug
} from './legacySectionLoaders';
import type { ParsedSectionField, ParsedSectionData } from '$lib/types';
import type { D1Database } from '@cloudflare/workers-types';

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
const LEGACY_SLUG_SET = new Set<string>(LEGACY_SECTION_SLUGS);

function isLegacySlug(slug: string): slug is LegacySectionSlug {
	return LEGACY_SLUG_SET.has(slug);
}

export async function loadSectionsForUser(
	db: D1Database,
	userId: number,
	sectionSlugs: string[]
): Promise<Record<string, LoadedSection>> {
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

	console.log('[sectionLoader] sections lookup', {
		userId,
		slugs: uniqueSlugs,
		results: sectionsResult.results?.map((row) => ({ id: row.id, slug: row.slug }))
	});

	const sectionMap = new Map<string, SectionRow>();
	sectionsResult.results?.forEach((row: SectionRow) => {
		if (row.slug) {
			sectionMap.set(row.slug, row);
		}
	});

	const sectionDataMap = await getSectionDataBySlugs(db, userId, uniqueSlugs);
	console.log('[sectionLoader] section_data lookup', {
		userId,
		keys: Object.keys(sectionDataMap),
		entries: Object.entries(sectionDataMap).map(([slug, record]) => ({
			slug,
			section_id: record?.section_id,
			record_id: record?.id
		}))
	});

	const fieldEntries = await Promise.all(
		uniqueSlugs.map(async (slug) => {
			const section = sectionMap.get(slug);
			if (!section) return [slug, [] as ParsedSectionField[]] as const;
			if (section.id <= 0) return [slug, [] as ParsedSectionField[]] as const;
			const fields = await getSectionFields(db, section.id);
			return [slug, fields] as const;
		})
	);

	const fieldMap = new Map<string, ParsedSectionField[]>();
	for (const [slug, fields] of fieldEntries) {
		fieldMap.set(slug, fields);
	}

	const results: Record<string, LoadedSection> = {};

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
			let data = sectionData?.data;

			if (data === undefined || data === null) {
				data = {};
			}

			results[slug] = {
				section,
				fields: fieldMap.get(slug) ?? [],
				data,
				sectionData
			};

			console.log('[sectionLoader] assembled section', {
				userId,
				slug,
				sectionId: section.id,
				fieldCount: (fieldMap.get(slug) ?? []).length,
				dataKeys:
					data && typeof data === 'object'
						? Object.keys(data)
						: [],
				sectionDataId: sectionData?.id ?? null
			});
		})
	);

	return results;
}
