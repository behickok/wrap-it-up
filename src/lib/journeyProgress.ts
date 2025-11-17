/**
 * Helper functions for updating user journey progress
 * Bridges old section_completion system with new user_journey_progress system
 */

import { calculateGenericSectionScore } from './genericScoring';
import { getSectionFields } from './server/genericSectionData';
import { loadSectionsForUser } from './server/sectionLoader';
import type { LegacySectionSlug } from './server/legacySectionLoaders';
import type { D1Database } from '@cloudflare/workers-types';
import type { ParsedSectionField } from './types';

const PROGRESS_SECTION_SLUGS: LegacySectionSlug[] = [
	'credentials',
	'contacts',
	'legal',
	'financial',
	'insurance',
	'employment',
	'personal',
	'medical',
	'physicians',
	'residence',
	'vehicles',
	'family',
	'pets',
	'final-days',
	'after-death',
	'funeral',
	'obituary',
	'conclusion',
	'marriage_license',
	'prenup',
	'joint_accounts',
	'name_change',
	'venue',
	'vendors',
	'guest_list',
	'registry',
	'home_setup'
];

interface UpdateProgressOptions {
	db: D1Database;
	userId: number;
	sectionSlug: string;
	sectionData: any;
	sectionId?: number;
	fields?: ParsedSectionField[];
}

/**
 * Updates progress for a section across all user's journeys that contain it
 * Also maintains backward compatibility with section_completion table
 */
export async function updateSectionProgress(options: UpdateProgressOptions): Promise<void> {
	const { db, userId, sectionSlug, sectionData, sectionId: providedSectionId, fields: providedFields } = options;

	try {
		// Get section ID if not provided
		let sectionId = providedSectionId;
		if (!sectionId) {
			const sectionResult = await db
				.prepare(`SELECT id FROM sections WHERE slug = ?`)
				.bind(sectionSlug)
				.first<{ id: number }>();

			if (!sectionResult) {
				console.warn(`[Progress Update] Section not found: ${sectionSlug}`);
				return;
			}
			sectionId = sectionResult.id;
		}

		// Get fields if not provided
		const fields = providedFields || await getSectionFields(db, sectionId);

		// Calculate score using generic scoring system with database fields
		const score = calculateGenericSectionScore(fields, sectionData);
		const isCompleted = score >= 80;

		// Update old section_completion table (backward compatibility)
		await db
			.prepare(
				`INSERT INTO section_completion (user_id, section_name, score, last_updated)
				 VALUES (?, ?, ?, datetime('now'))
				 ON CONFLICT(user_id, section_name) DO UPDATE SET
				 score = excluded.score,
				 last_updated = excluded.last_updated`
			)
			.bind(userId, sectionSlug, score)
			.run();

		// Find all user journeys that include this section
		const journeysResult = await db
			.prepare(
				`SELECT DISTINCT uj.id as user_journey_id, s.id as section_id
				 FROM user_journeys uj
				 JOIN journey_sections js ON uj.journey_id = js.journey_id
				 JOIN sections s ON js.section_id = s.id
				 WHERE uj.user_id = ? AND s.slug = ? AND uj.status = 'active'`
			)
			.bind(userId, sectionSlug)
			.all();

		// Update progress for each journey that contains this section
		for (const journey of journeysResult.results || []) {
			const { user_journey_id, section_id } = journey as any;

			await db
				.prepare(
					`INSERT INTO user_journey_progress (user_journey_id, section_id, score, is_completed, last_updated)
					 VALUES (?, ?, ?, ?, datetime('now'))
					 ON CONFLICT(user_journey_id, section_id) DO UPDATE SET
					 score = excluded.score,
					 is_completed = excluded.is_completed,
					 last_updated = excluded.last_updated`
				)
				.bind(user_journey_id, section_id, score, isCompleted ? 1 : 0)
				.run();
		}

		console.log(`[Progress Update] Section ${sectionSlug} updated for user ${userId}: ${score}%`);
	} catch (error) {
		console.error('[Progress Update] Error updating section progress:', error);
		// Don't throw - we don't want to break form submissions if progress update fails
	}
}

/**
 * Gets section data for score calculation based on section type
 */
export function getSectionDataForScoring(sectionSlug: string, allData: any): any {
	switch (sectionSlug) {
		case 'credentials':
			return allData.credentials || [];
		case 'contacts':
			return allData.contacts || [];
		case 'legal':
			return allData.legal || [];
		case 'financial':
			return allData.financial || [];
		case 'insurance':
			return allData.insurance || [];
		case 'employment':
			return allData.employment || [];
		case 'physicians':
			return allData.physicians || [];
		case 'vehicles':
			return allData.vehicles || [];
		case 'pets':
			return allData.pets || [];
		case 'personal':
			return allData.personal || {};
		case 'medical':
			return allData.medical || {};
		case 'residence':
			return allData.residence || {};
		case 'family':
			return {
				members: allData.family?.members || [],
				history: allData.family?.history || {}
			};
		case 'final-days':
			return allData['final-days'] || {};
		case 'after-death':
			return allData['after-death'] || {};
	case 'funeral':
		return allData.funeral || {};
	case 'obituary':
		return allData.obituary || {};
	case 'conclusion':
		return allData.conclusion || {};
	case 'marriage_license':
		return allData.marriage_license || {};
	case 'prenup':
		return allData.prenup || {};
	case 'joint_accounts':
		return allData.joint_accounts || {};
	case 'name_change':
		return allData.name_change || {};
	case 'venue':
		return allData.venue || {};
	case 'vendors':
		return allData.vendors || [];
	case 'guest_list':
		return allData.guest_list || [];
	case 'registry':
		return allData.registry || [];
	case 'home_setup':
		return allData.home_setup || {};
	default:
		return allData?.[sectionSlug] ?? {};
	}
}

/**
 * Fetches all section data needed for progress calculation
 */
export async function fetchAllSectionData(db: D1Database, userId: number): Promise<any> {
	const sectionsResult = await db
		.prepare(
			`SELECT DISTINCT s.slug
			 FROM user_journeys uj
			 JOIN journey_sections js ON uj.journey_id = js.journey_id
			 JOIN sections s ON js.section_id = s.id
			 WHERE uj.user_id = ? AND uj.status = 'active'`
		)
		.bind(userId)
		.all<{ slug: string }>();

	const activeSlugs = (sectionsResult.results || [])
		.map((row) => row.slug)
		.filter((slug): slug is string => typeof slug === 'string' && slug.length > 0);

	const sectionSequence = Array.from(new Set([...activeSlugs, ...PROGRESS_SECTION_SLUGS]));

	const loadedSections = await loadSectionsForUser(db, userId, sectionSequence);

	const getData = (slug: string): any => loadedSections[slug]?.data ?? null;

	const personal = getData('personal') ?? {};
	const credentials = getData('credentials') ?? [];
	const contacts = getData('contacts') ?? [];
	const legal = getData('legal') ?? [];
	const financial = getData('financial') ?? [];
	const insurance = getData('insurance') ?? [];
	const employment = getData('employment') ?? [];
	const vehicles = getData('vehicles') ?? [];
	const pets = getData('pets') ?? [];
	const medicalRaw = getData('medical') ?? {};
	const physiciansData =
		Array.isArray(medicalRaw?.physicians) && medicalRaw.physicians.length > 0
			? medicalRaw.physicians
			: getData('physicians') ?? [];
	const residence = getData('residence') ?? {};
	const familyRaw = getData('family');
	const family =
		familyRaw && typeof familyRaw === 'object'
			? {
					members: Array.isArray(familyRaw.members) ? familyRaw.members : [],
					history: familyRaw.history ?? {}
			  }
			: { members: [], history: {} };
	const finalDays = getData('final-days') ?? {};
	const afterDeath = getData('after-death') ?? {};
	const funeral = getData('funeral') ?? {};
	const obituary = getData('obituary') ?? {};
	const conclusion = getData('conclusion') ?? {};
	const marriageLicense = getData('marriage_license') ?? {};
	const prenup = getData('prenup') ?? {};
	const jointAccounts = getData('joint_accounts') ?? {};
	const nameChange = getData('name_change') ?? {};
	const venue = getData('venue') ?? {};
	const vendors = getData('vendors') ?? [];
	const guestList = getData('guest_list') ?? [];
	const registry = getData('registry') ?? [];
	const homeSetup = getData('home_setup') ?? {};

	const normalizedMedical =
		medicalRaw && typeof medicalRaw === 'object'
			? { ...medicalRaw, physicians: physiciansData }
			: { physicians: physiciansData };

	return {
		credentials,
		contacts,
		legal,
		financial,
		insurance,
		employment,
		physicians: physiciansData,
		vehicles,
		pets,
		personal,
		medical: normalizedMedical,
		residence,
		family,
		'final-days': finalDays,
		'after-death': afterDeath,
		funeral,
		obituary,
		conclusion,
		marriage_license: marriageLicense,
		prenup,
		joint_accounts: jointAccounts,
		name_change: nameChange,
		venue,
		vendors,
		guest_list: guestList,
		registry,
		home_setup: homeSetup
	};
}

/**
 * Updates progress for a specific section after a data change
 * Call this after any form submission that affects a section's data
 */
export async function recalculateAndUpdateProgress(
	db: D1Database,
	userId: number,
	sectionSlug: string
): Promise<void> {
	// Get section ID and fields from database
	const sectionResult = await db
		.prepare(`SELECT id FROM sections WHERE slug = ?`)
		.bind(sectionSlug)
		.first<{ id: number }>();

	if (!sectionResult) {
		console.warn(`[Progress Update] Section not found: ${sectionSlug}`);
		return;
	}

	const sectionId = sectionResult.id;
	const fields = await getSectionFields(db, sectionId);

	// Load user's data for this section
	const allData = await fetchAllSectionData(db, userId);
	const sectionData = getSectionDataForScoring(sectionSlug, allData);

	await updateSectionProgress({
		db,
		userId,
		sectionSlug,
		sectionData,
		sectionId,
		fields
	});
}
