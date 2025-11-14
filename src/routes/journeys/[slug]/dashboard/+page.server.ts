import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { recalculateAndUpdateProgress } from '$lib/journeyProgress';
import { loadSectionsForUser, type LoadedSection } from '$lib/server/sectionLoader';
import { getSectionFields, saveSectionData as persistSectionData } from '$lib/server/genericSectionData';
import type { LegacySectionSlug } from '$lib/server/legacySectionLoaders';
import type { D1Database } from '@cloudflare/workers-types';

const BASE_SECTION_SLUGS: LegacySectionSlug[] = [
	'personal',
	'credentials',
	'contacts',
	'legal',
	'documents',
	'final-days',
	'after-death',
	'funeral',
	'obituary',
	'conclusion',
	'financial',
	'insurance',
	'employment',
	'medical',
	'physicians',
	'residence',
	'vehicles',
	'family',
	'pets'
];

const WEDDING_SLUGS: LegacySectionSlug[] = [
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

		// Get reviews for sections (Guided tier feature)
		const reviewsResult = await db
			.prepare(
				`SELECT sr.id, sr.section_id, sr.status, sr.mentor_feedback,
				        sr.requested_at, sr.reviewed_at, sr.overall_rating
				 FROM section_reviews sr
				 WHERE sr.user_journey_id = ?
				 ORDER BY sr.requested_at DESC`
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

		// Load section data via generic storage with legacy fallback
		const sectionSlugsForJourney: LegacySectionSlug[] =
			journey.slug === 'wedding'
				? [...BASE_SECTION_SLUGS, ...WEDDING_SLUGS]
				: [...BASE_SECTION_SLUGS];

		const loadedSections = await loadSectionsForUser(db, userId, sectionSlugsForJourney);

		const getSectionEntry = (slug: LegacySectionSlug) => loadedSections[slug];
		const asArray = (slug: LegacySectionSlug): any[] => {
			const value = getSectionEntry(slug)?.data;
			return Array.isArray(value) ? value : [];
		};
		const asObject = (slug: LegacySectionSlug): Record<string, any> => {
			const value = getSectionEntry(slug)?.data;
			return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
		};

		const personal = asObject('personal');
		const credentials = asArray('credentials');
		const contacts = asArray('contacts');
		const legal = asArray('legal');
		const documents = asArray('documents');
		const finalDays = asObject('final-days');
		const afterDeath = asObject('after-death');
		const funeralSection = asObject('funeral');
		const obituarySection = asObject('obituary');
		const conclusion = asObject('conclusion');
		const financial = asArray('financial');
		const insurance = asArray('insurance');
		const employment = asArray('employment');
		const medical = asObject('medical');
		const residence = asObject('residence');
		const vehicles = asArray('vehicles');
		const familyData = getSectionEntry('family')?.data;
		const pets = asArray('pets');

		const physiciansList = Array.isArray(medical?.physicians) ? medical.physicians : asArray('physicians');
		if (!Array.isArray(medical?.physicians)) {
			medical.physicians = physiciansList;
		}

		const normalizedFamily = {
			members: Array.isArray((familyData as any)?.members)
				? (familyData as any).members
				: Array.isArray(familyData)
					? (familyData as any)
					: [],
			history:
				familyData &&
				typeof familyData === 'object' &&
				!Array.isArray(familyData) &&
				typeof (familyData as any).history === 'object'
					? (familyData as any).history
					: {}
		};

		let weddingSectionData: Record<string, any> = {};
		if (journey.slug === 'wedding') {
			weddingSectionData = {
				marriage_license: asObject('marriage_license'),
				prenup: asObject('prenup'),
				joint_accounts: asObject('joint_accounts'),
				name_change: asObject('name_change'),
				venue: asObject('venue'),
				vendors: asArray('vendors'),
				guest_list: asArray('guest_list'),
				registry: asArray('registry'),
				home_setup: asObject('home_setup')
			};
		}

		const sectionFields = Object.fromEntries(
			sectionSlugsForJourney.map((slug) => [slug, getSectionEntry(slug)?.fields ?? []])
		);

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
					personal,
					credentials,
					contacts,
					legal,
					documents,
					'final-days': finalDays,
					'after-death': afterDeath,
					funeral: funeralSection,
					obituary: obituarySection,
					conclusion,
					financial,
					insurance,
					employment,
					medical,
					physicians: physiciansList,
					residence,
					vehicles,
					family: normalizedFamily,
					pets,
					property: [],
					...(journey.slug === 'wedding' ? weddingSectionData : {})
				},
				sectionFields,
				sectionDefinitions: Object.fromEntries(
					sectionSlugsForJourney.map((slug) => [slug, getSectionEntry(slug)?.section ?? null])
				),
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

function ensureObjectData<T extends Record<string, any>>(value: any): T {
	if (value && typeof value === 'object' && !Array.isArray(value)) {
		return { ...value };
	}
	return {} as T;
}

async function loadSectionEntry(
	db: D1Database,
	userId: number,
	slug: LegacySectionSlug
): Promise<LoadedSection> {
	const sections = await loadSectionsForUser(db, userId, [slug]);
	const entry = sections[slug];

	if (!entry || !entry.section || entry.section.id <= 0) {
		throw new Error(`Section ${slug} is not configured`);
	}

	return entry;
}

// Form actions - now journey-aware
export const actions: Actions = {
	saveSectionData: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);
			if (!userId) return fail(401, { error: 'Not authenticated' });

			const db = getDb(platform);
			if (!db) return fail(500, { error: 'Database not available' });

			const formData = await request.formData();
			const sectionSlug = formData.get('section_slug');
			const serializedData = formData.get('form_data');

			if (!sectionSlug || typeof sectionSlug !== 'string') {
				return fail(400, { error: 'Section slug is required' });
			}

			if (typeof serializedData !== 'string') {
				return fail(400, { error: 'Form data payload missing' });
			}

			let parsedData: Record<string, any>;
			try {
				parsedData = JSON.parse(serializedData);
			} catch {
				return fail(400, { error: 'Invalid form data payload' });
			}

			const sectionRecord = await db
				.prepare('SELECT id, slug FROM sections WHERE slug = ?')
				.bind(sectionSlug)
				.first<{ id: number; slug: string }>();

			if (!sectionRecord) {
				return fail(400, { error: 'Unknown section' });
			}

			const fields = await getSectionFields(db, sectionRecord.id);
			await persistSectionData(db, userId, sectionRecord.id, parsedData, fields);
			await recalculateAndUpdateProgress(db, userId, sectionSlug);

			return { success: true };
		} catch (error) {
			console.error('Error saving section data:', error);
			return fail(500, { error: 'Failed to save section data' });
		}
	},
	saveWeddingMarriageLicense: async ({ request, platform, locals }) => {
		try {
			const userId = getUserId(locals);
			if (!userId) return fail(401, { error: 'Not authenticated' });
			const db = getDb(platform);
			if (!db) return fail(500, { error: 'Database not available' });

			const formData = await request.formData();
			const sectionEntry = await loadSectionEntry(db, userId, 'marriage_license');

			const payload = ensureObjectData({
				jurisdiction: getTextField(formData, 'jurisdiction'),
				office_address: getTextField(formData, 'office_address'),
				appointment_date: getTextField(formData, 'appointment_date'),
				expiration_date: getTextField(formData, 'expiration_date'),
				required_documents: getTextField(formData, 'required_documents'),
				witness_requirements: getTextField(formData, 'witness_requirements'),
				fee_amount: getNumberField(formData, 'fee_amount'),
				confirmation_number: getTextField(formData, 'confirmation_number'),
				notes: getTextField(formData, 'notes'),
				updated_at: new Date().toISOString()
			});

			await persistSectionData(db, userId, sectionEntry.section.id, payload, sectionEntry.fields);

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
			const sectionEntry = await loadSectionEntry(db, userId, 'prenup');

			const payload = ensureObjectData({
				status: getTextField(formData, 'status'),
				attorney_user: getTextField(formData, 'attorney_user'),
				attorney_partner: getTextField(formData, 'attorney_partner'),
				agreement_scope: getTextField(formData, 'agreement_scope'),
				financial_disclosures_ready: Boolean(getBooleanFlag(formData, 'financial_disclosures_ready')),
				review_deadline: getTextField(formData, 'review_deadline'),
				signing_plan: getTextField(formData, 'signing_plan'),
				storage_plan: getTextField(formData, 'storage_plan'),
				notes: getTextField(formData, 'notes'),
				updated_at: new Date().toISOString()
			});

			await persistSectionData(db, userId, sectionEntry.section.id, payload, sectionEntry.fields);

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

			const sectionEntry = await loadSectionEntry(db, userId, 'joint_accounts');
			const payload = ensureObjectData({
				shared_values: getTextField(formData, 'shared_values'),
				accounts_to_merge: getTextField(formData, 'accounts_to_merge'),
				new_accounts: getTextField(formData, 'new_accounts'),
				bill_split_plan: getTextField(formData, 'bill_split_plan'),
				emergency_fund_plan: getTextField(formData, 'emergency_fund_plan'),
				budgeting_tools: getTextField(formData, 'budgeting_tools'),
				monthly_checkin_cadence: getTextField(formData, 'monthly_checkin_cadence'),
				notes: getTextField(formData, 'notes'),
				updated_at: new Date().toISOString()
			});

			await persistSectionData(db, userId, sectionEntry.section.id, payload, sectionEntry.fields);

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
			const sectionEntry = await loadSectionEntry(db, userId, 'name_change');
			const payload = ensureObjectData({
				new_name: getTextField(formData, 'new_name'),
				keeping_current_name: Boolean(getBooleanFlag(formData, 'keeping_current_name')),
				legal_documents: getTextField(formData, 'legal_documents'),
				ids_to_update: getTextField(formData, 'ids_to_update'),
				digital_accounts: getTextField(formData, 'digital_accounts'),
				announcement_plan: getTextField(formData, 'announcement_plan'),
				target_effective_date: getTextField(formData, 'target_effective_date'),
				status: getTextField(formData, 'status'),
				notes: getTextField(formData, 'notes'),
				updated_at: new Date().toISOString()
			});

			await persistSectionData(db, userId, sectionEntry.section.id, payload, sectionEntry.fields);

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

			const sectionEntry = await loadSectionEntry(db, userId, 'venue');
			const payload = ensureObjectData({
				venue_name: getTextField(formData, 'venue_name'),
				venue_style: getTextField(formData, 'venue_style'),
				venue_address: getTextField(formData, 'venue_address'),
				capacity: getNumberField(formData, 'capacity'),
				contact_name: getTextField(formData, 'contact_name'),
				contact_email: getTextField(formData, 'contact_email'),
				contact_phone: getTextField(formData, 'contact_phone'),
				tour_date: getTextField(formData, 'tour_date'),
				decision_deadline: getTextField(formData, 'decision_deadline'),
				deposit_amount: getNumberField(formData, 'deposit_amount'),
				total_cost: getNumberField(formData, 'total_cost'),
				included_items: getTextField(formData, 'included_items'),
				rain_plan: getTextField(formData, 'rain_plan'),
				notes: getTextField(formData, 'notes'),
				updated_at: new Date().toISOString()
			});

			await persistSectionData(db, userId, sectionEntry.section.id, payload, sectionEntry.fields);

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

			const sectionEntry = await loadSectionEntry(db, userId, 'home_setup');
			const payload = ensureObjectData({
				housing_plan: getTextField(formData, 'housing_plan'),
				move_in_date: getTextField(formData, 'move_in_date'),
				utilities_plan: getTextField(formData, 'utilities_plan'),
				design_style: getTextField(formData, 'design_style'),
				shared_calendar_link: getTextField(formData, 'shared_calendar_link'),
				hosting_goals: getTextField(formData, 'hosting_goals'),
				first_month_priorities: getTextField(formData, 'first_month_priorities'),
				notes: getTextField(formData, 'notes'),
				updated_at: new Date().toISOString()
			});

			await persistSectionData(db, userId, sectionEntry.section.id, payload, sectionEntry.fields);

			await recalculateAndUpdateProgress(db, userId, 'home_setup');
			return { success: true };
		} catch (error) {
			console.error('Error saving home setup:', error);
			return fail(500, { error: 'Failed to save home setup plan' });
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
	},

	requestReview: async ({ request, platform, locals, params }) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const sectionId = parseInt(formData.get('section_id') as string);
		const clientNotes = formData.get('client_notes') as string;
		const priority = (formData.get('priority') as string) || 'normal';

		try {
			// Get journey
			const journeyResult = await db
				.prepare('SELECT id FROM journeys WHERE slug = ?')
				.bind(params.slug)
				.first<{ id: number }>();

			if (!journeyResult) {
				return fail(404, { error: 'Journey not found' });
			}

			// Get user's journey subscription
			const userJourney = await db
				.prepare(
					`SELECT uj.*, st.slug as tier_slug
					 FROM user_journeys uj
					 JOIN service_tiers st ON uj.tier_id = st.id
					 WHERE uj.user_id = ? AND uj.journey_id = ? AND uj.status = 'active'`
				)
				.bind(locals.user.id, journeyResult.id)
				.first<any>();

			if (!userJourney) {
				return fail(403, { error: 'No active subscription to this journey' });
			}

			// Check if tier allows mentor reviews (Guided tier)
			if (userJourney.tier_slug !== 'guided') {
				return fail(403, {
					error: 'Mentor reviews are only available for Guided tier subscribers'
				});
			}

			// Check if there's already a pending/in-review request for this section
			const existingReview = await db
				.prepare(
					`SELECT id FROM section_reviews
					 WHERE user_journey_id = ? AND section_id = ?
					 AND status IN ('requested', 'in_review')
					 LIMIT 1`
				)
				.bind(userJourney.id, sectionId)
				.first();

			if (existingReview) {
				return fail(400, {
					error: 'A review is already in progress for this section'
				});
			}

			// Create review request
			await db
				.prepare(
					`INSERT INTO section_reviews
					 (user_journey_id, section_id, status, priority, client_notes)
					 VALUES (?, ?, 'requested', ?, ?)`
				)
				.bind(userJourney.id, sectionId, priority, clientNotes || null)
				.run();

			return { success: true, message: 'Review requested! A mentor will review your section soon.' };
		} catch (error) {
			console.error('Error requesting review:', error);
			return fail(500, { error: 'Failed to request review' });
		}
	}
};
