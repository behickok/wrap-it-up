import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { calculateSectionScore } from '$lib/readinessScore';
import { recalculateAndUpdateProgress } from '$lib/journeyProgress';

export const load: PageServerLoad = async ({ locals, platform, params }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	const { slug } = params;

	try {
		// Get journey
		const journeyResult = await db
			.prepare('SELECT * FROM journeys WHERE slug = ?')
			.bind(slug)
			.first();

		if (!journeyResult) {
			throw error(404, 'Journey not found');
		}

		const journey = journeyResult as any;

		// Check subscription
		const subscriptionResult = await db
			.prepare(
				`SELECT uj.*, st.name as tier_name, st.slug as tier_slug
				 FROM user_journeys uj
				 JOIN service_tiers st ON uj.tier_id = st.id
				 WHERE uj.user_id = ? AND uj.journey_id = ? AND uj.status = 'active'`
			)
			.bind(locals.user.id, journey.id)
			.first();

		if (!subscriptionResult) {
			throw redirect(303, `/journeys/${slug}`);
		}

		const subscription = subscriptionResult as any;
		const userId = locals.user.id;

		// Get categories for this journey
		const categoriesResult = await db
			.prepare(
				`SELECT c.*, jc.display_order
				 FROM categories c
				 JOIN journey_categories jc ON c.id = jc.category_id
				 WHERE jc.journey_id = ?
				 ORDER BY jc.display_order`
			)
			.bind(journey.id)
			.all();

		const categories = categoriesResult.results || [];

		// Get sections for this journey
		const sectionsResult = await db
			.prepare(
				`SELECT s.*, js.is_required, js.weight_override, js.category_id, js.display_order
				 FROM sections s
				 JOIN journey_sections js ON s.id = js.section_id
				 WHERE js.journey_id = ?
				 ORDER BY js.category_id, js.display_order`
			)
			.bind(journey.id)
			.all();

		const sections = sectionsResult.results || [];

		// Group sections by category
		const sectionsByCategory: Record<number, any[]> = {};
		for (const section of sections) {
			const categoryId = (section as any).category_id;
			if (!sectionsByCategory[categoryId]) {
				sectionsByCategory[categoryId] = [];
			}
			sectionsByCategory[categoryId].push(section);
		}

		// Get progress for all sections
		const progressResult = await db
			.prepare(
				`SELECT ujp.section_id, ujp.score, ujp.is_completed
				 FROM user_journey_progress ujp
				 WHERE ujp.user_journey_id = ?`
			)
			.bind(subscription.id)
			.all();

		const progressMap: Record<number, any> = {};
		for (const prog of (progressResult.results || [])) {
			const p = prog as any;
			progressMap[p.section_id] = {
				score: p.score,
				is_completed: p.is_completed
			};
		}

		// Calculate overall progress
		const completedCount = Object.values(progressMap).filter((p: any) => p.is_completed).length;
		const totalCount = sections.length;
		const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

		// Load all section data (reuse existing queries from +page.server.ts)
		const [
			personalResult,
			credentialsResult,
			contactsResult,
			legalResult,
			documentsResult,
			finalDaysResult,
			afterDeathResult,
			funeralResult,
			obituaryResult,
			conclusionResult,
			bankAccountsResult,
			insuranceResult,
			employmentResult,
			medicalResult,
			physiciansResult,
			residenceResult,
			vehiclesResult,
			familyMembersResult,
			familyHistoryResult,
			petsResult
		] = await Promise.all([
			db.prepare('SELECT * FROM personal_info WHERE user_id = ? AND person_type = ?').bind(userId, 'self').first(),
			db.prepare('SELECT * FROM credentials WHERE user_id = ?').bind(userId).all(),
			db.prepare('SELECT * FROM key_contacts WHERE user_id = ?').bind(userId).all(),
			db.prepare('SELECT * FROM legal_documents WHERE user_id = ?').bind(userId).all(),
			db.prepare('SELECT * FROM documents WHERE user_id = ?').bind(userId).all(),
			db.prepare('SELECT * FROM final_days WHERE user_id = ?').bind(userId).first(),
			db.prepare('SELECT * FROM after_death WHERE user_id = ?').bind(userId).first(),
			db.prepare('SELECT * FROM funeral WHERE user_id = ?').bind(userId).first(),
			db.prepare('SELECT * FROM obituary WHERE user_id = ?').bind(userId).first(),
			db.prepare('SELECT * FROM conclusion WHERE user_id = ?').bind(userId).first(),
			db.prepare('SELECT * FROM bank_accounts WHERE user_id = ?').bind(userId).all(),
			db.prepare('SELECT * FROM insurance WHERE user_id = ?').bind(userId).all(),
			db.prepare('SELECT * FROM employment WHERE user_id = ?').bind(userId).all(),
			db.prepare('SELECT * FROM medical_info WHERE user_id = ?').bind(userId).first(),
			db.prepare('SELECT * FROM physicians WHERE user_id = ? ORDER BY id ASC').bind(userId).all(),
			db.prepare('SELECT * FROM primary_residence WHERE user_id = ?').bind(userId).first(),
			db.prepare('SELECT * FROM vehicles WHERE user_id = ?').bind(userId).all(),
			db.prepare(
				`SELECT fm.id, fm.user_id, fm.relationship, fm.personal_info_id,
					pi.legal_name, pi.date_of_birth, pi.mobile_phone, pi.email, pi.address, pi.occupation
				 FROM family_members fm
				 LEFT JOIN personal_info pi ON pi.id = fm.personal_info_id
				 WHERE fm.user_id = ?
				 ORDER BY fm.relationship, pi.legal_name`
			).bind(userId).all(),
			db.prepare('SELECT * FROM family_history WHERE user_id = ?').bind(userId).first(),
			db.prepare('SELECT * FROM pets WHERE user_id = ?').bind(userId).all()
		]);

		const physicians = physiciansResult?.results || [];
		const familyMembers = familyMembersResult?.results || [];

		return {
			journey,
			subscription,
			categories,
			sections,
			sectionsByCategory,
			progressMap,
			completionPercentage,
			sectionsCompleted: completedCount,
			sectionsTotal: totalCount,
			// Section data for forms
			sectionData: {
				personal: personalResult || {},
				credentials: credentialsResult?.results || [],
				contacts: contactsResult?.results || [],
				legal: legalResult?.results || [],
				documents: documentsResult?.results || [],
				'final-days': finalDaysResult || {},
				'after-death': afterDeathResult || {},
				funeral: funeralResult || {},
				obituary: obituaryResult || {},
				conclusion: conclusionResult || {},
				financial: bankAccountsResult?.results || [],
				insurance: insuranceResult?.results || [],
				employment: employmentResult?.results || [],
				medical: medicalResult || {},
				physicians: physicians,
				residence: residenceResult || {},
				vehicles: vehiclesResult?.results || [],
				family: {
					members: familyMembers,
					history: familyHistoryResult || null
				},
				pets: petsResult?.results || [],
				property: [] // placeholder for now
			},
			userId: locals.user.id
		};
	} catch (err) {
		if (err instanceof Response) throw err;
		console.error('Error loading journey dashboard:', err);
		throw error(500, 'Failed to load dashboard');
	}
};

// Helper functions
function getUserId(locals: App.Locals) {
	return locals.user?.id ?? null;
}

function getDb(platform: Readonly<App.Platform> | undefined) {
	return platform?.env?.DB;
}

// Form actions - now journey-aware
export const actions: Actions = {
	addCredential: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);
			if (!userId) return fail(401, { error: 'Not authenticated' });

			const db = getDb(platform);
			if (!db) return fail(500, { error: 'Database not available' });

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

			// Update progress across all journeys
			await recalculateAndUpdateProgress(db, userId, 'credentials');

			return { success: true };
		} catch (error) {
			console.error('Error adding credential:', error);
			return fail(500, { error: 'Failed to add credential' });
		}
	},

	updateCredential: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);
			if (!userId) return fail(401, { error: 'Not authenticated' });

			const db = getDb(platform);
			if (!db) return fail(500, { error: 'Database not available' });

			const formData = await request.formData();
			const data = Object.fromEntries(formData);
			const credentialId = data.id;

			if (!credentialId) return fail(400, { error: 'Credential ID required' });

			await db.prepare(`
				UPDATE credentials SET
					site_name = ?, web_address = ?, username = ?,
					password = ?, category = ?, other_info = ?
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

			await recalculateAndUpdateProgress(db, userId, 'credentials');

			return { success: true };
		} catch (error) {
			console.error('Error updating credential:', error);
			return fail(500, { error: 'Failed to update credential' });
		}
	},

	deleteCredential: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);
			if (!userId) return fail(401, { error: 'Not authenticated' });

			const db = getDb(platform);
			if (!db) return fail(500, { error: 'Database not available' });

			const formData = await request.formData();
			const credentialId = formData.get('id');

			if (!credentialId) return fail(400, { error: 'Credential ID required' });

			await db.prepare('DELETE FROM credentials WHERE id = ? AND user_id = ?')
				.bind(credentialId, userId)
				.run();

			await recalculateAndUpdateProgress(db, userId, 'credentials');

			return { success: true };
		} catch (error) {
			console.error('Error deleting credential:', error);
			return fail(500, { error: 'Failed to delete credential' });
		}
	},

	addContact: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);
			if (!userId) return fail(401, { error: 'Not authenticated' });

			const db = getDb(platform);
			if (!db) return fail(500, { error: 'Database not available' });

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

			await recalculateAndUpdateProgress(db, userId, 'contacts');

			return { success: true };
		} catch (error) {
			console.error('Error adding contact:', error);
			return fail(500, { error: 'Failed to add contact' });
		}
	},

	updateContact: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);
			if (!userId) return fail(401, { error: 'Not authenticated' });

			const db = getDb(platform);
			if (!db) return fail(500, { error: 'Database not available' });

			const formData = await request.formData();
			const data = Object.fromEntries(formData);
			const contactId = data.id;

			if (!contactId) return fail(400, { error: 'Contact ID required' });

			await db.prepare(`
				UPDATE key_contacts SET
					relationship = ?, name = ?, phone = ?,
					address = ?, email = ?, date_of_birth = ?
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

			await recalculateAndUpdateProgress(db, userId, 'contacts');

			return { success: true };
		} catch (error) {
			console.error('Error updating contact:', error);
			return fail(500, { error: 'Failed to update contact' });
		}
	},

	deleteContact: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);
			if (!userId) return fail(401, { error: 'Not authenticated' });

			const db = getDb(platform);
			if (!db) return fail(500, { error: 'Database not available' });

			const formData = await request.formData();
			const contactId = formData.get('id');

			if (!contactId) return fail(400, { error: 'Contact ID required' });

			await db.prepare('DELETE FROM key_contacts WHERE id = ? AND user_id = ?')
				.bind(contactId, userId)
				.run();

			await recalculateAndUpdateProgress(db, userId, 'contacts');

			return { success: true };
		} catch (error) {
			console.error('Error deleting contact:', error);
			return fail(500, { error: 'Failed to delete contact' });
		}
	}
};
