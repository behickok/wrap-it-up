// Type definitions for Wrap It Up application

export interface User {
	id: number;
	email: string;
	username: string;
	is_active: boolean;
	last_login: string | null;
	created_at: string;
	updated_at: string;
}

export interface Session {
	id: string;
	user_id: number;
	expires_at: string;
	created_at: string;
}

export type CredentialCategory = 'email' | 'banking' | 'social' | 'utilities' | 'government' | 'other';

export interface Credential {
	id?: number;
	user_id: number;
	site_name: string;
	web_address: string;
	username: string;
	password: string;
	category: CredentialCategory;
	other_info: string;
	created_at?: string;
	updated_at?: string;
}

export interface PersonalInfo {
	id?: number;
	user_id: number;
	person_type: 'self' | 'spouse';
	legal_name: string;
	maiden_name: string;
	date_of_birth: string;
	place_of_birth: string;
	address: string;
	po_box_number: string;
	po_box_location: string;
	po_box_key_location: string;
	home_phone: string;
	mobile_phone: string;
	office_phone: string;
	fax_number: string;
	email: string;
	drivers_license: string;
	ssn_or_green_card: string;
	passport_number: string;
	visa_number: string;
	occupation: string;
	employer: string;
	employment_address: string;
	military_service: string;
	church_affiliation: string;
	education: string;
}

export interface Pet {
	id?: number;
	user_id: number;
	breed: string;
	name: string;
	date_of_birth: string;
	license_chip_info: string;
	medications: string;
	veterinarian: string;
	vet_phone: string;
	pet_insurance: string;
	policy_number: string;
	other_info: string;
}

export interface KeyContact {
	id?: number;
	user_id: number;
	relationship: string;
	name: string;
	phone: string;
	address: string;
	email: string;
	date_of_birth: string;
}

export interface Document {
	id?: number;
	user_id: number;
	personal_info_id?: number;
	document_type: string;
	file_path: string;
	uploaded_at?: string;
}

export interface FamilyMember {
	id?: number;
	user_id: number;
	relationship: string;
	personal_info_id?: number;
	legal_name?: string;
	date_of_birth?: string;
	mobile_phone?: string;
	email?: string;
	address?: string;
	occupation?: string;
}

export interface MedicalInfo {
	id?: number;
	user_id: number;
	name: string;
	date_of_birth: string;
	blood_type: string;
	height: string;
	weight: string;
	sex: string;
	medical_conditions: string;
	preferred_hospital: string;
	preferred_pharmacy: string;
	allergies: string;
	physicians?: Physician[];
}

export interface Physician {
	id?: number;
	user_id: number;
	medical_info_id: number;
	name: string;
	specialty: string;
	phone: string;
	address: string;
}

export interface Employment {
	id?: number;
	user_id: number;
	employer_name: string;
	address: string;
	phone: string;
	position: string;
	hire_date: string;
	supervisor: string;
	supervisor_contact: string;
	is_current: boolean;
}

export interface PrimaryResidence {
	id?: number;
	user_id: number;
	address: string;
	own_or_rent: string;
	mortgage_lease_info: string;
	balance: number;
	value: number;
	lien_info: string;
	gas_company: string;
	electric_company: string;
	water_company: string;
	internet_company: string;
	waste_company: string;
	recycle_company: string;
	hoa_contact_name: string;
	hoa_contact_phone: string;
	hoa_dues: number;
}

export interface Vehicle {
	id?: number;
	user_id: number;
	names_on_title: string;
	make: string;
	model: string;
	year: number;
	vin: string;
	registration_dates: string;
	title_location: string;
}

export interface Insurance {
	id?: number;
	user_id: number;
	insurance_type: string;
	provider: string;
	policy_number: string;
	coverage_amount: number;
	beneficiary: string;
	agent_name: string;
	agent_phone: string;
	premium_amount: number;
	premium_frequency: string;
}

export interface BankAccount {
	id?: number;
	user_id: number;
	institution_name: string;
	account_type: string;
	account_number: string;
	routing_number: string;
	balance: number;
}

export interface LegalDocument {
	id?: number;
	user_id: number;
	document_type: string;
	location: string;
	attorney_name: string;
	attorney_contact: string;
	notes: string;
}

export interface FinalDays {
	id?: number;
	user_id: number;
	who_around: string;
	favorite_food_drink: string;
	music_type: string;
	flowers_preference: string;
	flower_types: string;
	aromatic_smells: string;
	smell_types: string;
	love_letter: string;
	organ_donation_info: string;
}

export interface Obituary {
	id?: number;
	user_id: number;
	online_or_newspaper: string;
	contact_name: string;
	contact_phone: string;
	contact_email: string;
	publication_date: string;
	cost: number;
	obituary_text: string;
}

export interface AfterDeath {
	id?: number;
	user_id: number;
	contact_name: string;
	contact_phone: string;
	contact_address: string;
	contact_email: string;
	body_disposal_preference: string;
	transfer_service: string;
	embalming_preference: string;
	burial_outfit: string;
	organ_donation: string;
	burial_timing: string;
	burial_type: string;
	container_type: string;
	items_buried_with: string;
	ash_scatter_location: string;
	memorial_organization: string;
	flowers_location: string;
	visitation_timing: string;
	visitation_time: string;
	casket_open_closed: string;
}

export interface Funeral {
	id?: number;
	user_id: number;
	location_name: string;
	location_address: string;
	director_name: string;
	director_contact: string;
	military_honors: boolean;
	programs_printed: boolean;
	pictures: boolean;
	slideshow: boolean;
	pallbearers: string;
	order_of_service: string;
	pastor: string;
	organist: string;
	celebration_location: string;
	celebration_food: string;
	final_resting_place: string;
	headstone_info: string;
}

export interface SectionCompletion {
	id?: number;
	user_id: number;
	section_name: string;
	score: number;
	last_updated: string;
}

export interface ReadinessScore {
	total_score: number;
	sections: {
		[key: string]: number;
	};
}

export type JourneyCategory = 'plan' | 'care' | 'connect' | 'support' | 'legacy';

export interface JourneyCategoryInfo {
	id: JourneyCategory;
	name: string;
	description: string;
	color: string;
	icon: string;
}

export const JOURNEY_CATEGORIES: JourneyCategoryInfo[] = [
	{
		id: 'plan',
		name: 'Plan',
		description: 'Legal & Financial Foundation',
		color: 'var(--color-plan)',
		icon: 'shield'
	},
	{
		id: 'care',
		name: 'Care',
		description: 'Health & Daily Life',
		color: 'var(--color-care)',
		icon: 'heart'
	},
	{
		id: 'connect',
		name: 'Connect',
		description: 'Relationships & History',
		color: 'var(--color-connect)',
		icon: 'users'
	},
	{
		id: 'support',
		name: 'Support',
		description: 'Digital & Practical',
		color: 'var(--color-support)',
		icon: 'key'
	},
	{
		id: 'legacy',
		name: 'Legacy',
		description: 'End-of-Life Planning',
		color: 'var(--color-legacy)',
		icon: 'star'
	}
];

export const SECTIONS = [
	{ id: 'legal', name: 'Legal Documents', weight: 9, category: 'plan' as JourneyCategory },
	{ id: 'financial', name: 'Financial Accounts', weight: 8, category: 'plan' as JourneyCategory },
	{ id: 'insurance', name: 'Insurance Policies', weight: 8, category: 'plan' as JourneyCategory },
	{ id: 'employment', name: 'Employment', weight: 5, category: 'plan' as JourneyCategory },

	{ id: 'medical', name: 'Medical Information', weight: 8, category: 'care' as JourneyCategory },
	{ id: 'personal', name: 'Personal Information', weight: 8, category: 'care' as JourneyCategory },
	{ id: 'residence', name: 'Primary Residence', weight: 6, category: 'care' as JourneyCategory },
	{ id: 'property', name: 'Vehicles & Property', weight: 6, category: 'care' as JourneyCategory },

	{ id: 'family', name: 'Family History', weight: 6, category: 'connect' as JourneyCategory },
	{ id: 'contacts', name: 'Key Contacts', weight: 7, category: 'connect' as JourneyCategory },
	{ id: 'pets', name: 'Pets', weight: 3, category: 'connect' as JourneyCategory },

	{ id: 'credentials', name: 'Usernames & Passwords', weight: 5, category: 'support' as JourneyCategory },

	{ id: 'final-days', name: 'Final Days Preferences', weight: 7, category: 'legacy' as JourneyCategory },
	{ id: 'after-death', name: 'After Death Arrangements', weight: 8, category: 'legacy' as JourneyCategory },
	{ id: 'funeral', name: 'Funeral & Celebration of Life', weight: 7, category: 'legacy' as JourneyCategory },
	{ id: 'obituary', name: 'Obituary Planning', weight: 5, category: 'legacy' as JourneyCategory },
	{ id: 'conclusion', name: 'Final Thoughts & Reflections', weight: 4, category: 'legacy' as JourneyCategory },
	{ id: 'marriage_license', name: 'Marriage License', weight: 6, category: 'plan' as JourneyCategory },
	{ id: 'prenup', name: 'Prenuptial Agreement', weight: 5, category: 'plan' as JourneyCategory },
	{ id: 'joint_accounts', name: 'Joint Finances', weight: 5, category: 'support' as JourneyCategory },
	{ id: 'name_change', name: 'Name Change Plan', weight: 4, category: 'support' as JourneyCategory },
	{ id: 'venue', name: 'Venue Planning', weight: 6, category: 'care' as JourneyCategory },
	{ id: 'vendors', name: 'Vendor Team', weight: 5, category: 'care' as JourneyCategory },
	{ id: 'guest_list', name: 'Guest List', weight: 5, category: 'connect' as JourneyCategory },
	{ id: 'registry', name: 'Registry', weight: 4, category: 'connect' as JourneyCategory },
	{ id: 'home_setup', name: 'Home Setup', weight: 4, category: 'support' as JourneyCategory }
] as const;

// Wedding Journey data models
export interface WeddingMarriageLicense {
	id?: number;
	user_id: number;
	jurisdiction: string;
	office_address: string;
	appointment_date: string;
	expiration_date: string;
	required_documents: string;
	witness_requirements: string;
	fee_amount: number;
	confirmation_number: string;
	notes: string;
}

export interface WeddingPrenup {
	id?: number;
	user_id: number;
	status: string;
	attorney_user: string;
	attorney_partner: string;
	agreement_scope: string;
	financial_disclosures_ready: number;
	review_deadline: string;
	signing_plan: string;
	storage_plan: string;
	notes: string;
}

export interface WeddingJointFinances {
	id?: number;
	user_id: number;
	shared_values: string;
	accounts_to_merge: string;
	new_accounts: string;
	bill_split_plan: string;
	emergency_fund_plan: string;
	budgeting_tools: string;
	monthly_checkin_cadence: string;
	notes: string;
}

export interface WeddingNameChange {
	id?: number;
	user_id: number;
	new_name: string;
	keeping_current_name: number;
	legal_documents: string;
	ids_to_update: string;
	digital_accounts: string;
	announcement_plan: string;
	target_effective_date: string;
	status: string;
	notes: string;
}

export interface WeddingVenue {
	id?: number;
	user_id: number;
	venue_name: string;
	venue_style: string;
	venue_address: string;
	capacity: number;
	contact_name: string;
	contact_email: string;
	contact_phone: string;
	tour_date: string;
	decision_deadline: string;
	deposit_amount: number;
	total_cost: number;
	included_items: string;
	rain_plan: string;
	notes: string;
}

export interface WeddingVendor {
	id?: number;
	user_id: number;
	vendor_type: string;
	business_name: string;
	contact_name: string;
	contact_email: string;
	contact_phone: string;
	deposit_amount: number;
	balance_due: number;
	next_payment_due: string;
	status: string;
	contract_signed: number;
	notes: string;
}

export interface WeddingGuest {
	id?: number;
	user_id: number;
	guest_name: string;
	relationship: string;
	party_size: number;
	email: string;
	phone: string;
	address: string;
	invitation_sent: number;
	rsvp_status: string;
	meal_preference: string;
	notes: string;
}

export interface WeddingRegistryItem {
	id?: number;
	user_id: number;
	retailer: string;
	item_name: string;
	item_url: string;
	price: number;
	quantity: number;
	priority: string;
	status: string;
	notes: string;
}

export interface WeddingHomeSetup {
	id?: number;
	user_id: number;
	housing_plan: string;
	move_in_date: string;
	utilities_plan: string;
	design_style: string;
	shared_calendar_link: string;
	hosting_goals: string;
	first_month_priorities: string;
	notes: string;
}

// ============================================================================
// MULTI-JOURNEY PLATFORM TYPES
// ============================================================================

// Journey System Types
export interface Journey {
	id: number;
	slug: string;
	name: string;
	description: string | null;
	icon: string | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface Category {
	id: number;
	name: string;
	description: string | null;
	icon: string | null;
	created_at: string;
}

export interface JourneyCategoryMapping {
	id: number;
	journey_id: number;
	category_id: number;
	display_order: number;
	created_at: string;
}

export interface Section {
	id: number;
	slug: string;
	name: string;
	description: string | null;
	scoring_type: 'field_count' | 'list_items' | 'custom';
	weight: number;
	created_at: string;
}

export interface JourneySection {
	id: number;
	journey_id: number;
	section_id: number;
	category_id: number;
	display_order: number;
	is_required: boolean;
	weight_override: number | null;
	created_at: string;
}

// Service Tier Types
export type ServiceTierSlug = 'essentials' | 'guided' | 'premium';

export interface ServiceTier {
	id: number;
	slug: ServiceTierSlug;
	name: string;
	description: string | null;
	price_monthly: number;
	price_annual: number;
	display_order: number;
	is_active: boolean;
	features_json: string | null; // JSON array of feature descriptions
	created_at: string;
	updated_at: string;
}

export interface TierFeature {
	id: number;
	tier_id: number;
	feature_key: string;
	is_enabled: boolean;
	config_json: string | null;
	created_at: string;
}

// Parsed features from JSON
export interface ParsedServiceTier extends Omit<ServiceTier, 'features_json'> {
	features: string[];
}

// User Journey Types
export type UserJourneyStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export interface UserJourney {
	id: number;
	user_id: number;
	journey_id: number;
	tier_id: number;
	status: UserJourneyStatus;
	started_at: string;
	completed_at: string | null;
	created_at: string;
	updated_at: string;
}

export interface UserJourneyProgress {
	id: number;
	user_journey_id: number;
	section_id: number;
	score: number;
	is_completed: boolean;
	last_updated: string;
}

// Extended types with joined data
export interface UserJourneyWithDetails extends UserJourney {
	journey: Journey;
	tier: ServiceTier;
	progress: UserJourneyProgress[];
	overall_score?: number;
}

// Mentor System Types
export interface Mentor {
	id: number;
	user_id: number;
	display_name: string;
	bio: string | null;
	expertise_areas: string | null; // comma-separated journey slugs
	hourly_rate: number;
	is_available: boolean;
	availability_json: string | null; // JSON calendar data
	rating_average: number;
	review_count: number;
	created_at: string;
	updated_at: string;
}

export interface MentorJourney {
	id: number;
	mentor_id: number;
	journey_id: number;
	created_at: string;
}

export type MentorReviewStatus = 'pending' | 'assigned' | 'in_review' | 'completed' | 'cancelled';

export interface MentorReview {
	id: number;
	user_journey_id: number;
	section_id: number;
	mentor_id: number | null;
	status: MentorReviewStatus;
	submitted_at: string;
	assigned_at: string | null;
	completed_at: string | null;
	feedback: string | null;
	created_at: string;
	updated_at: string;
}

export interface ReviewComment {
	id: number;
	review_id: number;
	user_id: number;
	is_mentor: boolean;
	comment: string;
	created_at: string;
}

export type MentorSessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';

export interface MentorSession {
	id: number;
	user_journey_id: number;
	mentor_id: number;
	status: MentorSessionStatus;
	scheduled_at: string;
	duration_minutes: number;
	meeting_link: string | null;
	prep_notes: string | null;
	session_notes: string | null;
	created_at: string;
	updated_at: string;
}

export interface SessionRating {
	id: number;
	session_id: number;
	rating: number; // 1-5
	feedback: string | null;
	created_at: string;
}

// Extended types with joined data
export interface MentorWithDetails extends Mentor {
	user: User;
	journeys: Journey[];
}

export interface MentorReviewWithDetails extends MentorReview {
	user_journey: UserJourney;
	section: Section;
	mentor: Mentor | null;
	comments: ReviewComment[];
}

export interface MentorSessionWithDetails extends MentorSession {
	user_journey: UserJourney;
	mentor: MentorWithDetails;
	rating: SessionRating | null;
}

// Feature flag helper type
export type FeatureKey =
	| 'form_access'
	| 'ai_assistance'
	| 'progress_tracking'
	| 'pdf_export'
	| 'auto_save'
	| 'mentor_review'
	| 'review_feedback'
	| 'email_notifications'
	| 'session_booking'
	| 'dedicated_guide'
	| 'priority_support';

// Helper function to check if user has access to a feature
export function hasFeature(tier: ServiceTier, feature: FeatureKey): boolean {
	// This would query tier_features table in practice
	// For now, basic tier logic:
	const essentialsFeatures: FeatureKey[] = [
		'form_access',
		'ai_assistance',
		'progress_tracking',
		'pdf_export',
		'auto_save'
	];

	const guidedFeatures: FeatureKey[] = [
		...essentialsFeatures,
		'mentor_review',
		'review_feedback',
		'email_notifications'
	];

	const premiumFeatures: FeatureKey[] = [
		...guidedFeatures,
		'session_booking',
		'dedicated_guide',
		'priority_support'
	];

	switch (tier.slug) {
		case 'essentials':
			return essentialsFeatures.includes(feature);
		case 'guided':
			return guidedFeatures.includes(feature);
		case 'premium':
			return premiumFeatures.includes(feature);
		default:
			return false;
	}
}
