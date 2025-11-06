import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { calculateSectionScore } from '$lib/readinessScore';

export const load: PageServerLoad = async ({ params, platform, locals }) => {
	const { slug } = params;
	const userId = locals.user?.id;

	if (!userId) {
		throw redirect(302, '/login');
	}

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

			case 'documents':
				const documentsResult = await db.prepare(
					'SELECT * FROM documents WHERE user_id = ?'
				).bind(userId).all();
				sectionData = documentsResult.results || [];
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
	save: async ({ request, platform, params, locals }) => {
		const { slug } = params;
		const userId = locals.user?.id;

		if (!userId) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;

		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		try {
			const formData = await request.formData();
			const data = Object.fromEntries(formData);

			let query = '';
			let values: any[] = [];
			let score = 0;

			switch (slug) {
				case 'personal':
					// Calculate score for completion
					score = calculateSectionScore('personal', data);

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
					score = calculateSectionScore('final-days', data);

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

			// Update section score
			await db.prepare(`
				INSERT INTO section_completion (user_id, section_name, score, last_updated)
				VALUES (?, ?, ?, CURRENT_TIMESTAMP)
				ON CONFLICT(user_id, section_name) DO UPDATE SET
					score = excluded.score,
					last_updated = CURRENT_TIMESTAMP
			`).bind(userId, slug, score).run();

			return { success: true };
		} catch (error) {
			console.error('Error saving section data:', error);
			return fail(500, { error: 'Failed to save data' });
		}
	},

	addCredential: async ({ request, platform, locals }) => {
		const userId = locals.user?.id;

		if (!userId) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;

		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		try {
			const formData = await request.formData();
			const data = Object.fromEntries(formData);

			await db.prepare(`
				INSERT INTO credentials (
					user_id, site_name, web_address, username, password, category, other_info
				) VALUES (?, ?, ?, ?, ?, ?, ?)
			`).bind(
				userId,
				data.site_name || '',
				data.web_address || '',
				data.username || '',
				data.password || '',
				data.category || 'other',
				data.other_info || ''
			).run();

			// Recalculate score for credentials section
			const credentialsResult = await db.prepare(
				'SELECT * FROM credentials WHERE user_id = ?'
			).bind(userId).all();

			const score = calculateSectionScore('credentials', credentialsResult.results || []);

			await db.prepare(`
				INSERT INTO section_completion (user_id, section_name, score, last_updated)
				VALUES (?, ?, ?, CURRENT_TIMESTAMP)
				ON CONFLICT(user_id, section_name) DO UPDATE SET
					score = excluded.score,
					last_updated = CURRENT_TIMESTAMP
			`).bind(userId, 'credentials', score).run();

			return { success: true };
		} catch (error) {
			console.error('Error adding credential:', error);
			return fail(500, { error: 'Failed to add credential' });
		}
	},

	updateCredential: async ({ request, platform, locals }) => {
		const userId = locals.user?.id;

		if (!userId) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;

		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		try {
			const formData = await request.formData();
			const data = Object.fromEntries(formData);
			const credentialId = data.id;

			if (!credentialId) {
				return fail(400, { error: 'Credential ID required' });
			}

			await db.prepare(`
				UPDATE credentials SET
					site_name = ?,
					web_address = ?,
					username = ?,
					password = ?,
					category = ?,
					other_info = ?,
					updated_at = CURRENT_TIMESTAMP
				WHERE id = ? AND user_id = ?
			`).bind(
				data.site_name || '',
				data.web_address || '',
				data.username || '',
				data.password || '',
				data.category || 'other',
				data.other_info || '',
				credentialId,
				userId
			).run();

			// Recalculate score for credentials section
			const credentialsResult = await db.prepare(
				'SELECT * FROM credentials WHERE user_id = ?'
			).bind(userId).all();

			const score = calculateSectionScore('credentials', credentialsResult.results || []);

			await db.prepare(`
				INSERT INTO section_completion (user_id, section_name, score, last_updated)
				VALUES (?, ?, ?, CURRENT_TIMESTAMP)
				ON CONFLICT(user_id, section_name) DO UPDATE SET
					score = excluded.score,
					last_updated = CURRENT_TIMESTAMP
			`).bind(userId, 'credentials', score).run();

			return { success: true };
		} catch (error) {
			console.error('Error updating credential:', error);
			return fail(500, { error: 'Failed to update credential' });
		}
	},

	deleteCredential: async ({ request, platform, locals }) => {
		const userId = locals.user?.id;

		if (!userId) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;

		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		try {
			const formData = await request.formData();
			const credentialId = formData.get('id');

			if (!credentialId) {
				return fail(400, { error: 'Credential ID required' });
			}

			await db.prepare(
				'DELETE FROM credentials WHERE id = ? AND user_id = ?'
			).bind(credentialId, userId).run();

			// Recalculate score for credentials section
			const credentialsResult = await db.prepare(
				'SELECT * FROM credentials WHERE user_id = ?'
			).bind(userId).all();

			const score = calculateSectionScore('credentials', credentialsResult.results || []);

			await db.prepare(`
				INSERT INTO section_completion (user_id, section_name, score, last_updated)
				VALUES (?, ?, ?, CURRENT_TIMESTAMP)
				ON CONFLICT(user_id, section_name) DO UPDATE SET
					score = excluded.score,
					last_updated = CURRENT_TIMESTAMP
			`).bind(userId, 'credentials', score).run();

			return { success: true };
		} catch (error) {
			console.error('Error deleting credential:', error);
			return fail(500, { error: 'Failed to delete credential' });
		}
	},

	addContact: async ({ request, platform, locals }) => {
		const userId = locals.user?.id;

		if (!userId) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;

		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		try {
			const formData = await request.formData();
			const data = Object.fromEntries(formData);

			await db.prepare(`
				INSERT INTO key_contacts (
					user_id, relationship, name, phone, address, email, date_of_birth
				) VALUES (?, ?, ?, ?, ?, ?, ?)
			`).bind(
				userId,
				data.relationship || '',
				data.name || '',
				data.phone || '',
				data.address || '',
				data.email || '',
				data.date_of_birth || ''
			).run();

			// Recalculate score for contacts section
			const contactsResult = await db.prepare(
				'SELECT * FROM key_contacts WHERE user_id = ?'
			).bind(userId).all();

			const score = calculateSectionScore('contacts', contactsResult.results || []);

			await db.prepare(`
				INSERT INTO section_completion (user_id, section_name, score, last_updated)
				VALUES (?, ?, ?, CURRENT_TIMESTAMP)
				ON CONFLICT(user_id, section_name) DO UPDATE SET
					score = excluded.score,
					last_updated = CURRENT_TIMESTAMP
			`).bind(userId, 'contacts', score).run();

			return { success: true };
		} catch (error) {
			console.error('Error adding contact:', error);
			return fail(500, { error: 'Failed to add contact' });
		}
	},

	updateContact: async ({ request, platform, locals }) => {
		const userId = locals.user?.id;

		if (!userId) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;

		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		try {
			const formData = await request.formData();
			const data = Object.fromEntries(formData);
			const contactId = data.id;

			if (!contactId) {
				return fail(400, { error: 'Contact ID required' });
			}

			await db.prepare(`
				UPDATE key_contacts SET
					relationship = ?,
					name = ?,
					phone = ?,
					address = ?,
					email = ?,
					date_of_birth = ?
				WHERE id = ? AND user_id = ?
			`).bind(
				data.relationship || '',
				data.name || '',
				data.phone || '',
				data.address || '',
				data.email || '',
				data.date_of_birth || '',
				contactId,
				userId
			).run();

			// Recalculate score for contacts section
			const contactsResult = await db.prepare(
				'SELECT * FROM key_contacts WHERE user_id = ?'
			).bind(userId).all();

			const score = calculateSectionScore('contacts', contactsResult.results || []);

			await db.prepare(`
				INSERT INTO section_completion (user_id, section_name, score, last_updated)
				VALUES (?, ?, ?, CURRENT_TIMESTAMP)
				ON CONFLICT(user_id, section_name) DO UPDATE SET
					score = excluded.score,
					last_updated = CURRENT_TIMESTAMP
			`).bind(userId, 'contacts', score).run();

			return { success: true };
		} catch (error) {
			console.error('Error updating contact:', error);
			return fail(500, { error: 'Failed to update contact' });
		}
	},

	deleteContact: async ({ request, platform, locals }) => {
		const userId = locals.user?.id;

		if (!userId) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;

		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		try {
			const formData = await request.formData();
			const contactId = formData.get('id');

			if (!contactId) {
				return fail(400, { error: 'Contact ID required' });
			}

			await db.prepare(
				'DELETE FROM key_contacts WHERE id = ? AND user_id = ?'
			).bind(contactId, userId).run();

			// Recalculate score for contacts section
			const contactsResult = await db.prepare(
				'SELECT * FROM key_contacts WHERE user_id = ?'
			).bind(userId).all();

			const score = calculateSectionScore('contacts', contactsResult.results || []);

			await db.prepare(`
				INSERT INTO section_completion (user_id, section_name, score, last_updated)
				VALUES (?, ?, ?, CURRENT_TIMESTAMP)
				ON CONFLICT(user_id, section_name) DO UPDATE SET
					score = excluded.score,
					last_updated = CURRENT_TIMESTAMP
			`).bind(userId, 'contacts', score).run();

			return { success: true };
		} catch (error) {
			console.error('Error deleting contact:', error);
			return fail(500, { error: 'Failed to delete contact' });
		}
	},

	addDocument: async ({ request, platform, locals }) => {
		const userId = locals.user?.id;

		if (!userId) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;

		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		try {
			const formData = await request.formData();
			const data = Object.fromEntries(formData);

			await db.prepare(`
				INSERT INTO documents (
					user_id, document_type, file_path, uploaded_at
				) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
			`).bind(
				userId,
				data.document_type || '',
				data.file_path || ''
			).run();

			return { success: true };
		} catch (error) {
			console.error('Error adding document:', error);
			return fail(500, { error: 'Failed to add document' });
		}
	},

	updateDocument: async ({ request, platform, locals }) => {
		const userId = locals.user?.id;

		if (!userId) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;

		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		try {
			const formData = await request.formData();
			const data = Object.fromEntries(formData);
			const documentId = data.id;

			if (!documentId) {
				return fail(400, { error: 'Document ID required' });
			}

			await db.prepare(`
				UPDATE documents SET
					document_type = ?,
					file_path = ?
				WHERE id = ? AND user_id = ?
			`).bind(
				data.document_type || '',
				data.file_path || '',
				documentId,
				userId
			).run();

			return { success: true };
		} catch (error) {
			console.error('Error updating document:', error);
			return fail(500, { error: 'Failed to update document' });
		}
	},

	deleteDocument: async ({ request, platform, locals }) => {
		const userId = locals.user?.id;

		if (!userId) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;

		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		try {
			const formData = await request.formData();
			const documentId = formData.get('id');

			if (!documentId) {
				return fail(400, { error: 'Document ID required' });
			}

			await db.prepare(
				'DELETE FROM documents WHERE id = ? AND user_id = ?'
			).bind(documentId, userId).run();

			return { success: true };
		} catch (error) {
			console.error('Error deleting document:', error);
			return fail(500, { error: 'Failed to delete document' });
		}
	}
};
