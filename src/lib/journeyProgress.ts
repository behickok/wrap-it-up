/**
 * Helper functions for updating user journey progress
 * Bridges old section_completion system with new user_journey_progress system
 */

import { calculateSectionScore } from './readinessScore';
import { getSectionDataBySlugs } from './server/genericSectionData';
import { loadLegacySectionData, type LegacySectionSlug } from './server/legacySectionLoaders';

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
}

/**
 * Updates progress for a section across all user's journeys that contain it
 * Also maintains backward compatibility with section_completion table
 */
export async function updateSectionProgress(options: UpdateProgressOptions): Promise<void> {
	const { db, userId, sectionSlug, sectionData } = options;

	try {
		// Calculate score for this section
		const score = calculateSectionScore(sectionSlug, sectionData);
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
		return {};
	}
}

/**
 * Fetches all section data needed for progress calculation
 */
export async function fetchAllSectionData(db: D1Database, userId: number): Promise<any> {
	const genericSectionData = await getSectionDataBySlugs(db, userId, PROGRESS_SECTION_SLUGS);
	const memo = new Map<LegacySectionSlug, Promise<any>>();

	const getOrFallback = (slug: LegacySectionSlug): Promise<any> => {
		if (!memo.has(slug)) {
			const record = genericSectionData[slug];
			memo.set(slug, record ? Promise.resolve(record.data) : loadLegacySectionData(db, userId, slug));
		}
		return memo.get(slug)!;
	};

	const sectionSequence: LegacySectionSlug[] = [
		'credentials',
		'contacts',
		'legal',
		'financial',
		'insurance',
		'employment',
		'vehicles',
		'pets',
		'personal',
		'medical',
		'residence',
		'family',
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

	const results = await Promise.all(sectionSequence.map((slug) => getOrFallback(slug)));

	const [
		credentials,
		contacts,
		legal,
		financial,
		insurance,
		employment,
		vehicles,
		pets,
		personal,
		medical,
		residence,
		family,
		finalDays,
		afterDeath,
		funeral,
		obituary,
		conclusion,
		weddingMarriageLicense,
		weddingPrenup,
		weddingJointFinances,
		weddingNameChange,
		weddingVenue,
		weddingVendors,
		weddingGuestList,
		weddingRegistry,
		weddingHomeSetup
	] = results;

	const physicians =
		Array.isArray(medical?.physicians) && medical.physicians.length > 0
			? medical.physicians
			: await getOrFallback('physicians');

	const normalizedMedical =
		medical && typeof medical === 'object'
			? { ...medical, physicians: Array.isArray(medical.physicians) ? medical.physicians : physicians }
			: { physicians };

	const normalizedFamily = {
		members: Array.isArray(family?.members) ? family.members : [],
		history: family?.history ?? {}
	};

	return {
		credentials: credentials ?? [],
		contacts: contacts ?? [],
		legal: legal ?? [],
		financial: financial ?? [],
		insurance: insurance ?? [],
		employment: employment ?? [],
		physicians: physicians ?? [],
		vehicles: vehicles ?? [],
		pets: pets ?? [],
		personal: personal ?? {},
		medical: normalizedMedical,
		residence: residence ?? {},
		family: normalizedFamily,
		'final-days': finalDays ?? {},
		'after-death': afterDeath ?? {},
		funeral: funeral ?? {},
		obituary: obituary ?? {},
		conclusion: conclusion ?? {},
		marriage_license: weddingMarriageLicense ?? {},
		prenup: weddingPrenup ?? {},
		joint_accounts: weddingJointFinances ?? {},
		name_change: weddingNameChange ?? {},
		venue: weddingVenue ?? {},
		vendors: weddingVendors ?? [],
		guest_list: weddingGuestList ?? [],
		registry: weddingRegistry ?? [],
		home_setup: weddingHomeSetup ?? {}
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
	const allData = await fetchAllSectionData(db, userId);
	const sectionData = getSectionDataForScoring(sectionSlug, allData);

	await updateSectionProgress({
		db,
		userId,
		sectionSlug,
		sectionData
	});
}
