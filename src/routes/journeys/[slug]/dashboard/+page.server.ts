import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
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

		// Get reviews for sections (Guided/Premium tier feature)
		const reviewsResult = await db
			.prepare(
				`SELECT mr.id, mr.section_id, mr.status, mr.submitted_at,
				        mr.completed_at, mr.feedback
				 FROM mentor_reviews mr
				 WHERE mr.user_journey_id = ?
				 ORDER BY mr.submitted_at DESC`
			)
			.bind(subscription.id)
			.all();

		const reviewsMap: Record<number, any> = {};
		for (const review of (reviewsResult.results || [])) {
			const r = review as any;
			// Keep only the most recent review per section
			if (!reviewsMap[r.section_id]) {
				reviewsMap[r.section_id] = r;
			}
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

		let weddingSectionData: Record<string, any> = {};
		if (journey.slug === 'wedding') {
			const [
				marriageLicenseResult,
				prenupResult,
				jointFinancesResult,
				nameChangeResult,
				venueResult,
				vendorsResult,
				guestListResult,
				registryResult,
				homeSetupResult
			] = await Promise.all([
				db.prepare('SELECT * FROM wedding_marriage_license WHERE user_id = ?').bind(userId).first(),
				db.prepare('SELECT * FROM wedding_prenup WHERE user_id = ?').bind(userId).first(),
				db.prepare('SELECT * FROM wedding_joint_finances WHERE user_id = ?').bind(userId).first(),
				db.prepare('SELECT * FROM wedding_name_change WHERE user_id = ?').bind(userId).first(),
				db.prepare('SELECT * FROM wedding_venue WHERE user_id = ?').bind(userId).first(),
				db.prepare('SELECT * FROM wedding_vendors WHERE user_id = ? ORDER BY vendor_type, business_name').bind(userId).all(),
				db.prepare('SELECT * FROM wedding_guest_list WHERE user_id = ? ORDER BY guest_name').bind(userId).all(),
				db.prepare('SELECT * FROM wedding_registry_items WHERE user_id = ? ORDER BY priority DESC, item_name').bind(userId).all(),
				db.prepare('SELECT * FROM wedding_home_setup WHERE user_id = ?').bind(userId).first()
			]);

			weddingSectionData = {
				marriage_license: marriageLicenseResult || {},
				prenup: prenupResult || {},
				joint_accounts: jointFinancesResult || {},
				name_change: nameChangeResult || {},
				venue: venueResult || {},
				vendors: vendorsResult?.results || [],
				guest_list: guestListResult?.results || [],
				registry: registryResult?.results || [],
				home_setup: homeSetupResult || {}
			};
		}

		// Get available mentors (for Premium tier session booking)
		const mentorsResult = await db
			.prepare('SELECT id, display_name, bio, hourly_rate FROM mentors WHERE is_available = 1')
			.all();

		return {
			journey,
			subscription,
			categories,
			sections,
			sectionsByCategory,
			progressMap,
			reviewsMap,
			completionPercentage,
			sectionsCompleted: completedCount,
			sectionsTotal: totalCount,
			mentors: mentorsResult?.results || [],
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
				property: [], // placeholder for now
				...(journey.slug === 'wedding' ? weddingSectionData : {})
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

function getTextField(formData: FormData, key: string): string | null {
	const value = formData.get(key);
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	return trimmed === '' ? null : trimmed;
}

function getNumberField(formData: FormData, key: string): number | null {
	const value = formData.get(key);
	if (typeof value !== 'string' || value.trim() === '') return null;
	const parsed = Number(value);
	return Number.isNaN(parsed) ? null : parsed;
}

function getBooleanFlag(formData: FormData, key: string): number {
	const value = formData.get(key);
	if (value === null) return 0;
	if (typeof value === 'string') {
		const normalized = value.toLowerCase();
		return normalized === '1' || normalized === 'true' || normalized === 'on' ? 1 : 0;
	}
	return 0;
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
	},

	saveWeddingMarriageLicense: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);
			if (!userId) return fail(401, { error: 'Not authenticated' });
			const db = getDb(platform);
			if (!db) return fail(500, { error: 'Database not available' });

			const formData = await request.formData();

			await db
				.prepare(
					`INSERT INTO wedding_marriage_license (
						user_id, jurisdiction, office_address, appointment_date, expiration_date,
						required_documents, witness_requirements, fee_amount, confirmation_number, notes
					) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
					ON CONFLICT(user_id) DO UPDATE SET
						jurisdiction = excluded.jurisdiction,
						office_address = excluded.office_address,
						appointment_date = excluded.appointment_date,
						expiration_date = excluded.expiration_date,
						required_documents = excluded.required_documents,
						witness_requirements = excluded.witness_requirements,
						fee_amount = excluded.fee_amount,
						confirmation_number = excluded.confirmation_number,
						notes = excluded.notes,
						updated_at = datetime('now')`
				)
				.bind(
					userId,
					getTextField(formData, 'jurisdiction'),
					getTextField(formData, 'office_address'),
					getTextField(formData, 'appointment_date'),
					getTextField(formData, 'expiration_date'),
					getTextField(formData, 'required_documents'),
					getTextField(formData, 'witness_requirements'),
					getNumberField(formData, 'fee_amount'),
					getTextField(formData, 'confirmation_number'),
					getTextField(formData, 'notes')
				)
				.run();

			await recalculateAndUpdateProgress(db, userId, 'marriage_license');
			return { success: true };
		} catch (error) {
			console.error('Error saving marriage license:', error);
			return fail(500, { error: 'Failed to save marriage license' });
		}
	},

	saveWeddingPrenup: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);
			if (!userId) return fail(401, { error: 'Not authenticated' });
			const db = getDb(platform);
			if (!db) return fail(500, { error: 'Database not available' });

			const formData = await request.formData();

			await db
				.prepare(
					`INSERT INTO wedding_prenup (
						user_id, status, attorney_user, attorney_partner, agreement_scope,
						financial_disclosures_ready, review_deadline, signing_plan, storage_plan, notes
					) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
					ON CONFLICT(user_id) DO UPDATE SET
						status = excluded.status,
						attorney_user = excluded.attorney_user,
						attorney_partner = excluded.attorney_partner,
						agreement_scope = excluded.agreement_scope,
						financial_disclosures_ready = excluded.financial_disclosures_ready,
						review_deadline = excluded.review_deadline,
						signing_plan = excluded.signing_plan,
						storage_plan = excluded.storage_plan,
						notes = excluded.notes,
						updated_at = datetime('now')`
				)
				.bind(
					userId,
					getTextField(formData, 'status'),
					getTextField(formData, 'attorney_user'),
					getTextField(formData, 'attorney_partner'),
					getTextField(formData, 'agreement_scope'),
					getBooleanFlag(formData, 'financial_disclosures_ready'),
					getTextField(formData, 'review_deadline'),
					getTextField(formData, 'signing_plan'),
					getTextField(formData, 'storage_plan'),
					getTextField(formData, 'notes')
				)
				.run();

			await recalculateAndUpdateProgress(db, userId, 'prenup');
			return { success: true };
		} catch (error) {
			console.error('Error saving prenup:', error);
			return fail(500, { error: 'Failed to save prenup' });
		}
	},

	saveWeddingJointFinances: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);
			if (!userId) return fail(401, { error: 'Not authenticated' });
			const db = getDb(platform);
			if (!db) return fail(500, { error: 'Database not available' });

			const formData = await request.formData();

			await db
				.prepare(
					`INSERT INTO wedding_joint_finances (
						user_id, shared_values, accounts_to_merge, new_accounts,
						bill_split_plan, emergency_fund_plan, budgeting_tools,
						monthly_checkin_cadence, notes
					) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
					ON CONFLICT(user_id) DO UPDATE SET
						shared_values = excluded.shared_values,
						accounts_to_merge = excluded.accounts_to_merge,
						new_accounts = excluded.new_accounts,
						bill_split_plan = excluded.bill_split_plan,
						emergency_fund_plan = excluded.emergency_fund_plan,
						budgeting_tools = excluded.budgeting_tools,
						monthly_checkin_cadence = excluded.monthly_checkin_cadence,
						notes = excluded.notes,
						updated_at = datetime('now')`
				)
				.bind(
					userId,
					getTextField(formData, 'shared_values'),
					getTextField(formData, 'accounts_to_merge'),
					getTextField(formData, 'new_accounts'),
					getTextField(formData, 'bill_split_plan'),
					getTextField(formData, 'emergency_fund_plan'),
					getTextField(formData, 'budgeting_tools'),
					getTextField(formData, 'monthly_checkin_cadence'),
					getTextField(formData, 'notes')
				)
				.run();

			await recalculateAndUpdateProgress(db, userId, 'joint_accounts');
			return { success: true };
		} catch (error) {
			console.error('Error saving joint finances:', error);
			return fail(500, { error: 'Failed to save joint finances' });
		}
	},

	saveWeddingNameChange: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);
			if (!userId) return fail(401, { error: 'Not authenticated' });
			const db = getDb(platform);
			if (!db) return fail(500, { error: 'Database not available' });

			const formData = await request.formData();

			await db
				.prepare(
					`INSERT INTO wedding_name_change (
						user_id, new_name, keeping_current_name, legal_documents, ids_to_update,
						digital_accounts, announcement_plan, target_effective_date, status, notes
					) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
					ON CONFLICT(user_id) DO UPDATE SET
						new_name = excluded.new_name,
						keeping_current_name = excluded.keeping_current_name,
						legal_documents = excluded.legal_documents,
						ids_to_update = excluded.ids_to_update,
						digital_accounts = excluded.digital_accounts,
						announcement_plan = excluded.announcement_plan,
						target_effective_date = excluded.target_effective_date,
						status = excluded.status,
						notes = excluded.notes,
						updated_at = datetime('now')`
				)
				.bind(
					userId,
					getTextField(formData, 'new_name'),
					getBooleanFlag(formData, 'keeping_current_name'),
					getTextField(formData, 'legal_documents'),
					getTextField(formData, 'ids_to_update'),
					getTextField(formData, 'digital_accounts'),
					getTextField(formData, 'announcement_plan'),
					getTextField(formData, 'target_effective_date'),
					getTextField(formData, 'status'),
					getTextField(formData, 'notes')
				)
				.run();

			await recalculateAndUpdateProgress(db, userId, 'name_change');
			return { success: true };
		} catch (error) {
			console.error('Error saving name change plan:', error);
			return fail(500, { error: 'Failed to save name change plan' });
		}
	},

	saveWeddingVenue: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);
			if (!userId) return fail(401, { error: 'Not authenticated' });
			const db = getDb(platform);
			if (!db) return fail(500, { error: 'Database not available' });

			const formData = await request.formData();

			await db
				.prepare(
					`INSERT INTO wedding_venue (
						user_id, venue_name, venue_style, venue_address, capacity,
						contact_name, contact_email, contact_phone, tour_date, decision_deadline,
						deposit_amount, total_cost, included_items, rain_plan, notes
					) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
					ON CONFLICT(user_id) DO UPDATE SET
						venue_name = excluded.venue_name,
						venue_style = excluded.venue_style,
						venue_address = excluded.venue_address,
						capacity = excluded.capacity,
						contact_name = excluded.contact_name,
						contact_email = excluded.contact_email,
						contact_phone = excluded.contact_phone,
						tour_date = excluded.tour_date,
						decision_deadline = excluded.decision_deadline,
						deposit_amount = excluded.deposit_amount,
						total_cost = excluded.total_cost,
						included_items = excluded.included_items,
						rain_plan = excluded.rain_plan,
						notes = excluded.notes,
						updated_at = datetime('now')`
				)
				.bind(
					userId,
					getTextField(formData, 'venue_name'),
					getTextField(formData, 'venue_style'),
					getTextField(formData, 'venue_address'),
					getNumberField(formData, 'capacity'),
					getTextField(formData, 'contact_name'),
					getTextField(formData, 'contact_email'),
					getTextField(formData, 'contact_phone'),
					getTextField(formData, 'tour_date'),
					getTextField(formData, 'decision_deadline'),
					getNumberField(formData, 'deposit_amount'),
					getNumberField(formData, 'total_cost'),
					getTextField(formData, 'included_items'),
					getTextField(formData, 'rain_plan'),
					getTextField(formData, 'notes')
				)
				.run();

			await recalculateAndUpdateProgress(db, userId, 'venue');
			return { success: true };
		} catch (error) {
			console.error('Error saving venue:', error);
			return fail(500, { error: 'Failed to save venue details' });
		}
	},

	saveWeddingHomeSetup: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);
			if (!userId) return fail(401, { error: 'Not authenticated' });
			const db = getDb(platform);
			if (!db) return fail(500, { error: 'Database not available' });

			const formData = await request.formData();

			await db
				.prepare(
					`INSERT INTO wedding_home_setup (
						user_id, housing_plan, move_in_date, utilities_plan, design_style,
						shared_calendar_link, hosting_goals, first_month_priorities, notes
					) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
					ON CONFLICT(user_id) DO UPDATE SET
						housing_plan = excluded.housing_plan,
						move_in_date = excluded.move_in_date,
						utilities_plan = excluded.utilities_plan,
						design_style = excluded.design_style,
						shared_calendar_link = excluded.shared_calendar_link,
						hosting_goals = excluded.hosting_goals,
						first_month_priorities = excluded.first_month_priorities,
						notes = excluded.notes,
						updated_at = datetime('now')`
				)
				.bind(
					userId,
					getTextField(formData, 'housing_plan'),
					getTextField(formData, 'move_in_date'),
					getTextField(formData, 'utilities_plan'),
					getTextField(formData, 'design_style'),
					getTextField(formData, 'shared_calendar_link'),
					getTextField(formData, 'hosting_goals'),
					getTextField(formData, 'first_month_priorities'),
					getTextField(formData, 'notes')
				)
				.run();

			await recalculateAndUpdateProgress(db, userId, 'home_setup');
			return { success: true };
		} catch (error) {
			console.error('Error saving home setup:', error);
			return fail(500, { error: 'Failed to save home setup plan' });
		}
	},

	saveWeddingVendor: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);
			if (!userId) return fail(401, { error: 'Not authenticated' });
			const db = getDb(platform);
			if (!db) return fail(500, { error: 'Database not available' });

			const formData = await request.formData();
			const vendorId = formData.get('id');

			if (vendorId) {
				await db
					.prepare(
						`UPDATE wedding_vendors SET
							vendor_type = ?, business_name = ?, contact_name = ?, contact_email = ?, contact_phone = ?,
							deposit_amount = ?, balance_due = ?, next_payment_due = ?, status = ?, notes = ?, updated_at = datetime('now')
						 WHERE id = ? AND user_id = ?`
					)
					.bind(
						getTextField(formData, 'vendor_type'),
						getTextField(formData, 'business_name'),
						getTextField(formData, 'contact_name'),
						getTextField(formData, 'contact_email'),
						getTextField(formData, 'contact_phone'),
						getNumberField(formData, 'deposit_amount'),
						getNumberField(formData, 'balance_due'),
						getTextField(formData, 'next_payment_due'),
						getTextField(formData, 'status'),
						getTextField(formData, 'notes'),
						vendorId,
						userId
					)
					.run();
			} else {
				await db
					.prepare(
						`INSERT INTO wedding_vendors (
							user_id, vendor_type, business_name, contact_name, contact_email,
							contact_phone, deposit_amount, balance_due, next_payment_due, status, notes
						) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
					)
					.bind(
						userId,
						getTextField(formData, 'vendor_type'),
						getTextField(formData, 'business_name'),
						getTextField(formData, 'contact_name'),
						getTextField(formData, 'contact_email'),
						getTextField(formData, 'contact_phone'),
						getNumberField(formData, 'deposit_amount'),
						getNumberField(formData, 'balance_due'),
						getTextField(formData, 'next_payment_due'),
						getTextField(formData, 'status'),
						getTextField(formData, 'notes')
					)
					.run();
			}

			await recalculateAndUpdateProgress(db, userId, 'vendors');
			return { success: true };
		} catch (error) {
			console.error('Error saving vendor:', error);
			return fail(500, { error: 'Failed to save vendor' });
		}
	},

	deleteWeddingVendor: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);
			if (!userId) return fail(401, { error: 'Not authenticated' });
			const db = getDb(platform);
			if (!db) return fail(500, { error: 'Database not available' });

			const formData = await request.formData();
			const id = formData.get('id');
			if (!id) return fail(400, { error: 'Vendor ID required' });

			await db.prepare('DELETE FROM wedding_vendors WHERE id = ? AND user_id = ?').bind(id, userId).run();
			await recalculateAndUpdateProgress(db, userId, 'vendors');
			return { success: true };
		} catch (error) {
			console.error('Error deleting vendor:', error);
			return fail(500, { error: 'Failed to delete vendor' });
		}
	},

	saveWeddingGuest: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);
			if (!userId) return fail(401, { error: 'Not authenticated' });
			const db = getDb(platform);
			if (!db) return fail(500, { error: 'Database not available' });

			const formData = await request.formData();
			const guestId = formData.get('id');

			if (guestId) {
				await db
					.prepare(
						`UPDATE wedding_guest_list SET
							guest_name = ?, relationship = ?, party_size = ?, email = ?, phone = ?, address = ?,
							invitation_sent = ?, rsvp_status = ?, meal_preference = ?, notes = ?, updated_at = datetime('now')
						 WHERE id = ? AND user_id = ?`
					)
					.bind(
						getTextField(formData, 'guest_name'),
						getTextField(formData, 'relationship'),
						getNumberField(formData, 'party_size'),
						getTextField(formData, 'email'),
						getTextField(formData, 'phone'),
						getTextField(formData, 'address'),
						getBooleanFlag(formData, 'invitation_sent'),
						getTextField(formData, 'rsvp_status'),
						getTextField(formData, 'meal_preference'),
						getTextField(formData, 'notes'),
						guestId,
						userId
					)
					.run();
			} else {
				await db
					.prepare(
						`INSERT INTO wedding_guest_list (
							user_id, guest_name, relationship, party_size, email, phone, address,
							invitation_sent, rsvp_status, meal_preference, notes
						) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
					)
					.bind(
						userId,
						getTextField(formData, 'guest_name'),
						getTextField(formData, 'relationship'),
						getNumberField(formData, 'party_size') ?? 1,
						getTextField(formData, 'email'),
						getTextField(formData, 'phone'),
						getTextField(formData, 'address'),
						getBooleanFlag(formData, 'invitation_sent'),
						getTextField(formData, 'rsvp_status'),
						getTextField(formData, 'meal_preference'),
						getTextField(formData, 'notes')
					)
					.run();
			}

			await recalculateAndUpdateProgress(db, userId, 'guest_list');
			return { success: true };
		} catch (error) {
			console.error('Error saving guest:', error);
			return fail(500, { error: 'Failed to save guest' });
		}
	},

	deleteWeddingGuest: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);
			if (!userId) return fail(401, { error: 'Not authenticated' });
			const db = getDb(platform);
			if (!db) return fail(500, { error: 'Database not available' });

			const formData = await request.formData();
			const id = formData.get('id');
			if (!id) return fail(400, { error: 'Guest ID required' });

			await db.prepare('DELETE FROM wedding_guest_list WHERE id = ? AND user_id = ?').bind(id, userId).run();
			await recalculateAndUpdateProgress(db, userId, 'guest_list');
			return { success: true };
		} catch (error) {
			console.error('Error deleting guest:', error);
			return fail(500, { error: 'Failed to delete guest' });
		}
	},

	saveWeddingRegistryItem: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);
			if (!userId) return fail(401, { error: 'Not authenticated' });
			const db = getDb(platform);
			if (!db) return fail(500, { error: 'Database not available' });

			const formData = await request.formData();
			const itemId = formData.get('id');

			if (itemId) {
				await db
					.prepare(
						`UPDATE wedding_registry_items SET
							retailer = ?, item_name = ?, item_url = ?, price = ?, quantity = ?,
							priority = ?, status = ?, notes = ?, updated_at = datetime('now')
						 WHERE id = ? AND user_id = ?`
					)
					.bind(
						getTextField(formData, 'retailer'),
						getTextField(formData, 'item_name'),
						getTextField(formData, 'item_url'),
						getNumberField(formData, 'price'),
						getNumberField(formData, 'quantity') ?? 1,
						getTextField(formData, 'priority'),
						getTextField(formData, 'status'),
						getTextField(formData, 'notes'),
						itemId,
						userId
					)
					.run();
			} else {
				await db
					.prepare(
						`INSERT INTO wedding_registry_items (
							user_id, retailer, item_name, item_url, price, quantity, priority, status, notes
						) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
					)
					.bind(
						userId,
						getTextField(formData, 'retailer'),
						getTextField(formData, 'item_name'),
						getTextField(formData, 'item_url'),
						getNumberField(formData, 'price'),
						getNumberField(formData, 'quantity') ?? 1,
						getTextField(formData, 'priority'),
						getTextField(formData, 'status'),
						getTextField(formData, 'notes')
					)
					.run();
			}

			await recalculateAndUpdateProgress(db, userId, 'registry');
			return { success: true };
		} catch (error) {
			console.error('Error saving registry item:', error);
			return fail(500, { error: 'Failed to save registry item' });
		}
	},

	deleteWeddingRegistryItem: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);
			if (!userId) return fail(401, { error: 'Not authenticated' });
			const db = getDb(platform);
			if (!db) return fail(500, { error: 'Database not available' });

			const formData = await request.formData();
			const id = formData.get('id');
			if (!id) return fail(400, { error: 'Registry item ID required' });

			await db.prepare('DELETE FROM wedding_registry_items WHERE id = ? AND user_id = ?').bind(id, userId).run();
			await recalculateAndUpdateProgress(db, userId, 'registry');
			return { success: true };
		} catch (error) {
			console.error('Error deleting registry item:', error);
			return fail(500, { error: 'Failed to delete registry item' });
		}
	},

	// Review submission (Guided/Premium tier feature)
	submitForReview: async ({ request, platform, locals, params }) => {
		try {
			const userId = getUserId(locals);
			if (!userId) return fail(401, { error: 'Not authenticated' });

			const db = getDb(platform);
			if (!db) return fail(500, { error: 'Database not available' });

			const formData = await request.formData();
			const userJourneyId = Number(formData.get('user_journey_id'));
			const sectionId = Number(formData.get('section_id'));
			const notes = formData.get('notes') || '';

			// Verify user owns this journey and has review access
			const journeyCheck = await db
				.prepare(
					`SELECT uj.id, st.slug as tier_slug
					 FROM user_journeys uj
					 JOIN service_tiers st ON uj.tier_id = st.id
					 WHERE uj.id = ? AND uj.user_id = ?`
				)
				.bind(userJourneyId, userId)
				.first();

			if (!journeyCheck) {
				return fail(403, { error: 'Journey not found or access denied' });
			}

			const tierSlug = (journeyCheck as any).tier_slug;
			if (tierSlug !== 'guided' && tierSlug !== 'premium') {
				return fail(403, { error: 'Review feature requires Guided or Premium tier' });
			}

			// Check if there's already a pending/in-review submission
			const existingReview = await db
				.prepare(
					`SELECT id FROM mentor_reviews
					 WHERE user_journey_id = ? AND section_id = ?
					 AND status IN ('pending', 'in_review')`
				)
				.bind(userJourneyId, sectionId)
				.first();

			if (existingReview) {
				return fail(400, { error: 'A review is already in progress for this section' });
			}

			// Create review request
			await db
				.prepare(
					`INSERT INTO mentor_reviews
					 (user_journey_id, section_id, status, submitted_at)
					 VALUES (?, ?, 'pending', datetime('now'))`
				)
				.bind(userJourneyId, sectionId)
				.run();

			return { success: true, message: 'Review request submitted successfully' };
		} catch (error) {
			console.error('Error submitting review:', error);
			return fail(500, { error: 'Failed to submit review request' });
		}
	},

	requestReReview: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);
			if (!userId) return fail(401, { error: 'Not authenticated' });

			const db = getDb(platform);
			if (!db) return fail(500, { error: 'Database not available' });

			const formData = await request.formData();
			const reviewId = Number(formData.get('review_id'));

			// Verify ownership and mark as completed -> pending new review
			const review = await db
				.prepare(
					`SELECT mr.user_journey_id, mr.section_id
					 FROM mentor_reviews mr
					 JOIN user_journeys uj ON mr.user_journey_id = uj.id
					 WHERE mr.id = ? AND uj.user_id = ?`
				)
				.bind(reviewId, userId)
				.first();

			if (!review) {
				return fail(403, { error: 'Review not found or access denied' });
			}

			const { user_journey_id, section_id } = review as any;

			// Create new review request
			await db
				.prepare(
					`INSERT INTO mentor_reviews
					 (user_journey_id, section_id, status, submitted_at)
					 VALUES (?, ?, 'pending', datetime('now'))`
				)
				.bind(user_journey_id, section_id)
				.run();

			return { success: true, message: 'Re-review requested successfully' };
		} catch (error) {
			console.error('Error requesting re-review:', error);
			return fail(500, { error: 'Failed to request re-review' });
		}
	},

	bookSession: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);
			if (!userId) return fail(401, { error: 'Not authenticated' });

			const db = getDb(platform);
			if (!db) return fail(500, { error: 'Database not available' });

			const formData = await request.formData();
			const userJourneyId = Number(formData.get('user_journey_id'));
			const mentorId = Number(formData.get('mentor_id'));
			const sessionDate = formData.get('session_date') as string;
			const sessionTime = formData.get('session_time') as string;
			const notes = (formData.get('notes') as string) || null;

			// Verify subscription has Premium access
			const subscription = await db
				.prepare(
					`SELECT uj.id, st.slug as tier_slug
					 FROM user_journeys uj
					 JOIN service_tiers st ON uj.tier_id = st.id
					 WHERE uj.id = ? AND uj.user_id = ?`
				)
				.bind(userJourneyId, userId)
				.first();

			if (!subscription) {
				return fail(403, { error: 'Journey subscription not found' });
			}

			const tierSlug = (subscription as any).tier_slug;
			if (tierSlug !== 'premium') {
				return fail(403, { error: 'Session booking requires Premium tier' });
			}

			// Combine date and time into a datetime
			const scheduledAt = `${sessionDate} ${sessionTime}:00`;

			// Create session booking
			await db
				.prepare(
					`INSERT INTO mentor_sessions
					 (user_journey_id, mentor_id, scheduled_at, duration_minutes, status, notes, created_at)
					 VALUES (?, ?, ?, 60, 'pending', ?, datetime('now'))`
				)
				.bind(userJourneyId, mentorId, scheduledAt, notes)
				.run();

			return { success: true, message: 'Session booked successfully! Your mentor will confirm shortly.' };
		} catch (error) {
			console.error('Error booking session:', error);
			return fail(500, { error: 'Failed to book session' });
		}
	}
};
