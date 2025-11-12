/**
 * Helper functions for updating user journey progress
 * Bridges old section_completion system with new user_journey_progress system
 */

import { calculateSectionScore } from './readinessScore';

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
	const [
		credentialsResult,
		contactsResult,
		legalResult,
		bankAccountsResult,
		insuranceResult,
		employmentResult,
		physiciansResult,
		vehiclesResult,
		petsResult,
		personalResult,
		medicalResult,
		residenceResult,
		familyMembersResult,
		familyHistoryResult,
		finalDaysResult,
		afterDeathResult,
		funeralResult,
		obituaryResult,
		conclusionResult,
		weddingMarriageLicenseResult,
		weddingPrenupResult,
		weddingJointFinancesResult,
		weddingNameChangeResult,
		weddingVenueResult,
		weddingVendorsResult,
		weddingGuestListResult,
		weddingRegistryResult,
		weddingHomeSetupResult
	] = await Promise.all([
		db.prepare('SELECT * FROM credentials WHERE user_id = ?').bind(userId).all(),
		db.prepare('SELECT * FROM key_contacts WHERE user_id = ?').bind(userId).all(),
		db.prepare('SELECT * FROM legal_documents WHERE user_id = ?').bind(userId).all(),
		db.prepare('SELECT * FROM bank_accounts WHERE user_id = ?').bind(userId).all(),
		db.prepare('SELECT * FROM insurance WHERE user_id = ?').bind(userId).all(),
		db.prepare('SELECT * FROM employment WHERE user_id = ?').bind(userId).all(),
		db.prepare('SELECT * FROM physicians WHERE user_id = ?').bind(userId).all(),
		db.prepare('SELECT * FROM vehicles WHERE user_id = ?').bind(userId).all(),
		db.prepare('SELECT * FROM pets WHERE user_id = ?').bind(userId).all(),
		db.prepare('SELECT * FROM personal_info WHERE user_id = ? AND person_type = ?').bind(userId, 'self').first(),
		db.prepare('SELECT * FROM medical_info WHERE user_id = ?').bind(userId).first(),
		db.prepare('SELECT * FROM primary_residence WHERE user_id = ?').bind(userId).first(),
		db.prepare(
			`SELECT fm.id, fm.user_id, fm.relationship, fm.personal_info_id,
				pi.legal_name, pi.date_of_birth, pi.mobile_phone, pi.email, pi.address, pi.occupation
			 FROM family_members fm
			 LEFT JOIN personal_info pi ON pi.id = fm.personal_info_id
			 WHERE fm.user_id = ?`
		).bind(userId).all(),
		db.prepare('SELECT * FROM family_history WHERE user_id = ?').bind(userId).first(),
		db.prepare('SELECT * FROM final_days WHERE user_id = ?').bind(userId).first(),
		db.prepare('SELECT * FROM after_death WHERE user_id = ?').bind(userId).first(),
		db.prepare('SELECT * FROM funeral WHERE user_id = ?').bind(userId).first(),
		db.prepare('SELECT * FROM obituary WHERE user_id = ?').bind(userId).first(),
		db.prepare('SELECT * FROM conclusion WHERE user_id = ?').bind(userId).first(),
		db.prepare('SELECT * FROM wedding_marriage_license WHERE user_id = ?').bind(userId).first(),
		db.prepare('SELECT * FROM wedding_prenup WHERE user_id = ?').bind(userId).first(),
		db.prepare('SELECT * FROM wedding_joint_finances WHERE user_id = ?').bind(userId).first(),
		db.prepare('SELECT * FROM wedding_name_change WHERE user_id = ?').bind(userId).first(),
		db.prepare('SELECT * FROM wedding_venue WHERE user_id = ?').bind(userId).first(),
		db.prepare('SELECT * FROM wedding_vendors WHERE user_id = ?').bind(userId).all(),
		db.prepare('SELECT * FROM wedding_guest_list WHERE user_id = ?').bind(userId).all(),
		db.prepare('SELECT * FROM wedding_registry_items WHERE user_id = ?').bind(userId).all(),
		db.prepare('SELECT * FROM wedding_home_setup WHERE user_id = ?').bind(userId).first()
	]);

	return {
		credentials: credentialsResult?.results || [],
		contacts: contactsResult?.results || [],
		legal: legalResult?.results || [],
		financial: bankAccountsResult?.results || [],
		insurance: insuranceResult?.results || [],
		employment: employmentResult?.results || [],
		physicians: physiciansResult?.results || [],
		vehicles: vehiclesResult?.results || [],
		pets: petsResult?.results || [],
		personal: personalResult || {},
		medical: medicalResult || {},
		residence: residenceResult || {},
		family: {
			members: familyMembersResult?.results || [],
			history: familyHistoryResult || {}
		},
		'final-days': finalDaysResult || {},
		'after-death': afterDeathResult || {},
		funeral: funeralResult || {},
		obituary: obituaryResult || {},
		conclusion: conclusionResult || {},
		marriage_license: weddingMarriageLicenseResult || {},
		prenup: weddingPrenupResult || {},
		joint_accounts: weddingJointFinancesResult || {},
		name_change: weddingNameChangeResult || {},
		venue: weddingVenueResult || {},
		vendors: weddingVendorsResult?.results || [],
		guest_list: weddingGuestListResult?.results || [],
		registry: weddingRegistryResult?.results || [],
		home_setup: weddingHomeSetupResult || {}
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
