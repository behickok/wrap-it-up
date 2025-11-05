import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { calculateSectionCompletion } from '$lib/readinessScore';

export const load: PageServerLoad = async ({ params, platform }) => {
	const { slug } = params;
	const userId = 1; // Default user for now

	const db = platform?.env?.DB;

	if (!db) {
		return {
			sectionData: null,
			slug
		};
	}

	try {
		let sectionData = null;

		// Fetch data based on section type
		switch (slug) {
			case 'personal':
				const personalResult = await db.prepare(
					'SELECT * FROM personal_info WHERE user_id = ? AND person_type = ?'
				).bind(userId, 'self').first();
				sectionData = personalResult || {};
				break;

			case 'credentials':
				const credentialsResult = await db.prepare(
					'SELECT * FROM credentials WHERE user_id = ?'
				).bind(userId).all();
				sectionData = credentialsResult.results || [];
				break;

			case 'pets':
				const petsResult = await db.prepare(
					'SELECT * FROM pets WHERE user_id = ?'
				).bind(userId).all();
				sectionData = petsResult.results || [];
				break;

			case 'contacts':
				const contactsResult = await db.prepare(
					'SELECT * FROM key_contacts WHERE user_id = ?'
				).bind(userId).all();
				sectionData = contactsResult.results || [];
				break;

			case 'medical':
				const medicalResult = await db.prepare(
					'SELECT * FROM medical_info WHERE user_id = ?'
				).bind(userId).first();
				sectionData = medicalResult || {};
				break;

			case 'legal':
				const legalResult = await db.prepare(
					'SELECT * FROM legal_documents WHERE user_id = ?'
				).bind(userId).all();
				sectionData = legalResult.results || [];
				break;

			case 'final-days':
				const finalDaysResult = await db.prepare(
					'SELECT * FROM final_days WHERE user_id = ?'
				).bind(userId).first();
				sectionData = finalDaysResult || {};
				break;

			default:
				sectionData = {};
		}

		return {
			sectionData,
			slug,
			userId
		};
	} catch (error) {
		console.error('Error loading section data:', error);
		return {
			sectionData: null,
			slug,
			userId
		};
	}
};

export const actions: Actions = {
	save: async ({ request, platform, params }) => {
		const { slug } = params;
		const userId = 1;

		const db = platform?.env?.DB;

		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		try {
			const formData = await request.formData();
			const data = Object.fromEntries(formData);

			let query = '';
			let values: any[] = [];
			let completionPercentage = 0;

			switch (slug) {
				case 'personal':
					// Calculate fields for completion
					completionPercentage = calculateSectionCompletion(data);

					query = `
						INSERT INTO personal_info (
							user_id, person_type, legal_name, maiden_name, date_of_birth,
							place_of_birth, address, po_box_number, home_phone, mobile_phone,
							email, drivers_license, ssn_or_green_card, passport_number,
							occupation, employer, military_service, church_affiliation, education
						) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
						ON CONFLICT(id) DO UPDATE SET
							legal_name = excluded.legal_name,
							maiden_name = excluded.maiden_name,
							date_of_birth = excluded.date_of_birth,
							place_of_birth = excluded.place_of_birth,
							address = excluded.address,
							po_box_number = excluded.po_box_number,
							home_phone = excluded.home_phone,
							mobile_phone = excluded.mobile_phone,
							email = excluded.email,
							drivers_license = excluded.drivers_license,
							ssn_or_green_card = excluded.ssn_or_green_card,
							passport_number = excluded.passport_number,
							occupation = excluded.occupation,
							employer = excluded.employer,
							military_service = excluded.military_service,
							church_affiliation = excluded.church_affiliation,
							education = excluded.education
					`;

					values = [
						userId, 'self',
						data.legal_name || '', data.maiden_name || '', data.date_of_birth || '',
						data.place_of_birth || '', data.address || '', data.po_box_number || '',
						data.home_phone || '', data.mobile_phone || '', data.email || '',
						data.drivers_license || '', data.ssn_or_green_card || '',
						data.passport_number || '', data.occupation || '', data.employer || '',
						data.military_service || '', data.church_affiliation || '',
						data.education || ''
					];
					break;

				case 'final-days':
					completionPercentage = calculateSectionCompletion(data);

					query = `
						INSERT INTO final_days (
							user_id, who_around, favorite_food_drink, music_type,
							flowers_preference, flower_types, aromatic_smells, smell_types,
							love_letter, organ_donation_info
						) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
						ON CONFLICT(user_id) DO UPDATE SET
							who_around = excluded.who_around,
							favorite_food_drink = excluded.favorite_food_drink,
							music_type = excluded.music_type,
							flowers_preference = excluded.flowers_preference,
							flower_types = excluded.flower_types,
							aromatic_smells = excluded.aromatic_smells,
							smell_types = excluded.smell_types,
							love_letter = excluded.love_letter,
							organ_donation_info = excluded.organ_donation_info
					`;

					values = [
						userId,
						data.who_around || '', data.favorite_food_drink || '',
						data.music_type || '', data.flowers_preference || '',
						data.flower_types || '', data.aromatic_smells || '',
						data.smell_types || '', data.love_letter || '',
						data.organ_donation_info || ''
					];
					break;

				default:
					return fail(400, { error: 'Unknown section' });
			}

			await db.prepare(query).bind(...values).run();

			// Update section completion
			await db.prepare(`
				INSERT INTO section_completion (user_id, section_name, completion_percentage, last_updated)
				VALUES (?, ?, ?, CURRENT_TIMESTAMP)
				ON CONFLICT(user_id, section_name) DO UPDATE SET
					completion_percentage = excluded.completion_percentage,
					last_updated = CURRENT_TIMESTAMP
			`).bind(userId, slug, completionPercentage).run();

			return { success: true };
		} catch (error) {
			console.error('Error saving section data:', error);
			return fail(500, { error: 'Failed to save data' });
		}
	}
};
