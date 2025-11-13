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

// ============================================================================
// GENERIC FORM SYSTEM TYPES
// ============================================================================

// Field type names supported by the system
export type FieldTypeName =
	| 'text'
	| 'textarea'
	| 'number'
	| 'date'
	| 'datetime'
	| 'select'
	| 'multiselect'
	| 'checkbox'
	| 'radio'
	| 'email'
	| 'phone'
	| 'url'
	| 'file'
	| 'currency'
	| 'rating';

// Field importance levels for scoring
export type FieldImportanceLevel = 'critical' | 'important' | 'optional';

// Field type definition
export interface FieldType {
	id: number;
	type_name: FieldTypeName;
	display_name: string;
	validation_schema: string | null; // JSON schema
	default_config: string | null; // JSON config
	icon: string | null;
	is_active: boolean;
	created_at: string;
}

// Parsed field type with JSON parsed
export interface ParsedFieldType extends Omit<FieldType, 'validation_schema' | 'default_config'> {
	validation_schema: Record<string, any> | null;
	default_config: Record<string, any> | null;
}

// Field configuration for select/multiselect/radio
export interface SelectFieldConfig {
	options: Array<{ label: string; value: string }>;
	placeholder?: string;
}

// Field configuration for text inputs
export interface TextFieldConfig {
	placeholder?: string;
	maxLength?: number;
	minLength?: number;
	pattern?: string;
}

// Field configuration for textarea
export interface TextAreaFieldConfig {
	placeholder?: string;
	rows?: number;
	maxLength?: number;
}

// Field configuration for number/currency
export interface NumberFieldConfig {
	placeholder?: string;
	min?: number;
	max?: number;
	step?: number;
	prefix?: string; // For currency
	suffix?: string;
}

// Field configuration for file upload
export interface FileFieldConfig {
	accept?: string; // MIME types
	maxSize?: number; // in bytes
	multiple?: boolean;
}

// Field configuration for rating
export interface RatingFieldConfig {
	max?: number; // default 5
	icon?: string; // default 'star'
}

// Conditional logic for showing/hiding fields
export interface ConditionalLogic {
	field: string; // field_name to watch
	operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty';
	value?: any;
}

// Union type for all field configs
export type FieldConfig =
	| SelectFieldConfig
	| TextFieldConfig
	| TextAreaFieldConfig
	| NumberFieldConfig
	| FileFieldConfig
	| RatingFieldConfig
	| Record<string, any>;

// Section field definition
export interface SectionField {
	id: number;
	section_id: number;
	field_name: string;
	field_label: string;
	field_type_id: number;
	field_config: string | null; // JSON
	is_required: boolean;
	importance_level: FieldImportanceLevel;
	help_text: string | null;
	placeholder: string | null;
	default_value: string | null;
	display_order: number;
	conditional_logic: string | null; // JSON
	created_at: string;
	updated_at: string;
}

// Parsed section field with JSON parsed and field type joined
export interface ParsedSectionField extends Omit<SectionField, 'field_config' | 'conditional_logic'> {
	field_type: FieldType;
	field_config: FieldConfig | null;
	conditional_logic: ConditionalLogic | null;
}

// Generic section data storage
export interface SectionData {
	id: number;
	user_id: number;
	section_id: number;
	data: string; // JSON object with field_name: value pairs
	completed_fields: number;
	total_fields: number;
	created_at: string;
	updated_at: string;
}

// Parsed section data
export interface ParsedSectionData extends Omit<SectionData, 'data'> {
	data: Record<string, any>;
}

export type ListFieldDefinition = {
	name: string;
	label: string;
	type?: 'text' | 'textarea' | 'select' | 'date' | 'number' | 'email' | 'tel' | 'checkbox';
	placeholder?: string;
	required?: boolean;
	rows?: number;
	options?: Array<{ value: string; label?: string } | string>;
};

export interface ListSectionDefinition {
	title: string;
	description?: string;
	addLabel?: string;
	emptyState?: {
		title?: string;
		description?: string;
	};
	fields: ListFieldDefinition[];
}

// Journey creator system
export interface JourneyCreator {
	id: number;
	journey_id: number;
	creator_user_id: number;
	is_published: boolean;
	is_featured: boolean;
	use_count: number;
	created_at: string;
	updated_at: string;
}

// Journey template tracking
export interface JourneyTemplate {
	id: number;
	template_journey_id: number;
	cloned_journey_id: number;
	cloned_by_user_id: number;
	created_at: string;
}

// Extended types with joined data
export interface JourneyCreatorWithDetails extends JourneyCreator {
	journey: Journey;
	creator: User;
}

// Form validation result
export interface ValidationResult {
	isValid: boolean;
	errors: Record<string, string>;
}

// Form submission data
export interface FormSubmissionData {
	section_id: number;
	data: Record<string, any>;
}

// ============================================================================
// ROLE-BASED ACCESS CONTROL TYPES
// ============================================================================

// Role names
export type RoleName = 'participant' | 'creator' | 'mentor' | 'coach' | 'admin';

// Permission names
export type PermissionName =
	// Journey permissions
	| 'journey.create'
	| 'journey.edit_own'
	| 'journey.edit_any'
	| 'journey.delete_own'
	| 'journey.delete_any'
	| 'journey.publish'
	| 'journey.view_all'
	// Data permissions
	| 'data.view_own'
	| 'data.edit_own'
	| 'data.view_shared'
	| 'data.edit_shared'
	| 'data.export_own'
	| 'data.delete_own'
	// Analytics permissions
	| 'analytics.view_own'
	| 'analytics.view_all'
	| 'analytics.export'
	// User management permissions
	| 'user.manage_roles'
	| 'user.view_all'
	| 'user.impersonate'
	// Mentor permissions
	| 'mentor.receive_reviews'
	| 'mentor.provide_feedback'
	// Coach permissions
	| 'coach.add_clients'
	| 'coach.access_client_data'
	| 'coach.edit_client_data'
	// System permissions
	| 'system.manage_settings'
	| 'system.manage_permissions';

// Role definition
export interface Role {
	id: number;
	name: RoleName;
	display_name: string;
	description: string | null;
	is_active: boolean;
	created_at: string;
}

// User role assignment
export interface UserRole {
	id: number;
	user_id: number;
	role_id: number;
	granted_at: string;
	granted_by: number | null;
}

// Permission definition
export interface Permission {
	id: number;
	name: PermissionName;
	display_name: string;
	description: string | null;
	category: string;
	created_at: string;
}

// Role-permission mapping
export interface RolePermission {
	id: number;
	role_id: number;
	permission_id: number;
	created_at: string;
}

// Coach profile
export interface Coach {
	id: number;
	user_id: number;
	display_name: string;
	bio: string | null;
	specialties: string | null; // JSON array
	is_available: boolean;
	hourly_rate: number;
	rating_average: number;
	review_count: number;
	created_at: string;
	updated_at: string;
}

// Coach-client relationship
export type CoachClientStatus = 'pending' | 'active' | 'paused' | 'ended';
export type AccessLevel = 'view' | 'edit' | 'full';

export interface CoachClient {
	id: number;
	coach_id: number;
	client_user_id: number;
	status: CoachClientStatus;
	access_level: AccessLevel;
	journey_id: number | null;
	notes: string | null;
	started_at: string;
	ended_at: string | null;
	created_at: string;
	updated_at: string;
}

// Coach access log
export interface CoachAccessLog {
	id: number;
	coach_client_id: number;
	action: string;
	section_id: number | null;
	details: string | null;
	accessed_at: string;
}

// Section sharing
export type SectionAccessType = 'view' | 'comment' | 'edit';

export interface SectionShare {
	id: number;
	user_id: number;
	shared_with_user_id: number;
	section_id: number;
	access_type: SectionAccessType;
	message: string | null;
	expires_at: string | null;
	created_at: string;
}

// Journey analytics
export interface JourneyAnalytics {
	id: number;
	journey_id: number;
	metric_date: string;
	// Engagement
	total_users: number;
	active_users: number;
	new_users: number;
	completed_users: number;
	// Progress
	avg_completion_percentage: number;
	avg_score: number;
	total_sections_completed: number;
	// Retention
	retention_7day: number;
	retention_30day: number;
	// Other
	total_sessions: number;
	avg_session_duration_minutes: number;
	created_at: string;
}

// ============================================================================
// PRICING & REVENUE TYPES
// ============================================================================

// Journey pricing configuration
export interface JourneyPricing {
	id: number;
	journey_id: number;
	tier_id: number;
	base_price_monthly: number;
	base_price_annual: number;
	platform_fee_percentage: number;
	creator_revenue_monthly: number; // calculated
	creator_revenue_annual: number; // calculated
	platform_fee_monthly: number; // calculated
	platform_fee_annual: number; // calculated
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

// Mentor rates
export interface MentorRate {
	id: number;
	mentor_id: number;
	journey_id: number;
	review_rate: number;
	currency: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

// Concierge rates
export interface ConciergeRate {
	id: number;
	coach_id: number;
	journey_id: number;
	hourly_rate: number;
	session_rate: number;
	currency: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

// User subscriptions
export type SubscriptionStatus = 'active' | 'cancelled' | 'paused' | 'expired';
export type BillingCycle = 'monthly' | 'annual';

export interface UserSubscription {
	id: number;
	user_journey_id: number;
	tier_id: number;
	status: SubscriptionStatus;
	billing_cycle: BillingCycle;
	price_amount: number;
	platform_fee: number;
	creator_amount: number;
	started_at: string;
	current_period_start: string;
	current_period_end: string;
	cancelled_at: string | null;
	payment_method: string;
	stripe_subscription_id: string | null;
	notes: string | null;
	created_at: string;
	updated_at: string;
}

// Transactions
export type TransactionType =
	| 'subscription'
	| 'review'
	| 'session'
	| 'affiliate'
	| 'refund'
	| 'adjustment';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';

export interface Transaction {
	id: number;
	transaction_type: TransactionType;
	user_id: number;
	user_journey_id: number | null;
	journey_id: number;
	mentor_id: number | null;
	coach_id: number | null;
	subscription_id: number | null;
	amount: number;
	platform_fee: number;
	creator_amount: number;
	mentor_amount: number;
	concierge_amount: number;
	affiliate_amount: number;
	status: TransactionStatus;
	payment_method: string;
	stripe_payment_id: string | null;
	description: string | null;
	notes: string | null;
	metadata: string | null;
	transaction_date: string;
	completed_at: string | null;
	created_at: string;
	updated_at: string;
}

// Payouts
export type PayoutType = 'creator' | 'mentor' | 'concierge' | 'affiliate';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface Payout {
	id: number;
	user_id: number;
	payout_type: PayoutType;
	amount: number;
	period_start: string;
	period_end: string;
	status: PayoutStatus;
	payment_method: string;
	stripe_payout_id: string | null;
	transaction_count: number;
	notes: string | null;
	scheduled_date: string | null;
	completed_at: string | null;
	created_at: string;
	updated_at: string;
}

// Payout transactions (junction table)
export interface PayoutTransaction {
	id: number;
	payout_id: number;
	transaction_id: number;
	amount: number;
	created_at: string;
}

// Affiliate links
export interface AffiliateLink {
	id: number;
	user_id: number;
	journey_id: number;
	affiliate_code: string;
	commission_percentage: number;
	click_count: number;
	signup_count: number;
	total_revenue: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

// Affiliate clicks
export interface AffiliateClick {
	id: number;
	affiliate_link_id: number;
	ip_address: string | null;
	user_agent: string | null;
	referrer: string | null;
	clicked_at: string;
}

// Affiliate conversions
export interface AffiliateConversion {
	id: number;
	affiliate_link_id: number;
	user_id: number;
	user_journey_id: number;
	commission_amount: number;
	transaction_id: number | null;
	converted_at: string;
}

// Revenue settings
export interface RevenueSetting {
	id: number;
	setting_key: string;
	setting_value: string;
	description: string | null;
	updated_at: string;
}

// Extended types with joined data
export interface JourneyPricingWithTier extends JourneyPricing {
	tier: ServiceTier;
}

export interface TransactionWithDetails extends Transaction {
	user: User;
	journey: Journey;
	mentor?: Mentor;
	coach?: Coach;
}

export interface PayoutWithTransactions extends Payout {
	transactions: Transaction[];
}

// Pricing breakdown calculation result
export interface PricingBreakdown {
	basePrice: number;
	platformFee: number;
	platformFeePercentage: number;
	creatorReceives: number;
	clientPays: number;
}

// Revenue summary for dashboards
export interface RevenueSummary {
	// Current period
	mtd_revenue: number; // Month-to-date
	mtd_transactions: number;

	// Projected
	projected_monthly: number;
	active_subscriptions: number;

	// Historical
	last_month_revenue: number;
	all_time_revenue: number;

	// Breakdown by type
	subscription_revenue: number;
	review_revenue: number;
	session_revenue: number;
	affiliate_revenue: number;

	// For creators specifically
	pending_payout?: number;
	last_payout_amount?: number;
	last_payout_date?: string;
}

// Section analytics
export interface SectionAnalytics {
	id: number;
	section_id: number;
	journey_id: number;
	metric_date: string;
	total_completions: number;
	avg_completion_time_minutes: number;
	avg_score: number;
	incomplete_field_count: number;
	common_incomplete_fields: string | null; // JSON array
	created_at: string;
}

// Analytics event
export type AnalyticsEventType =
	| 'journey_started'
	| 'section_viewed'
	| 'section_completed'
	| 'data_saved'
	| 'journey_completed';

export interface AnalyticsEvent {
	id: number;
	user_id: number | null;
	journey_id: number | null;
	section_id: number | null;
	event_type: AnalyticsEventType;
	event_data: string | null; // JSON
	session_id: string | null;
	created_at: string;
}

// Extended types with joined data
export interface UserWithRoles extends User {
	roles: Role[];
	permissions: Permission[];
}

export interface CoachWithDetails extends Coach {
	user: User;
	clients: CoachClient[];
}

export interface CoachClientWithDetails extends CoachClient {
	coach: Coach;
	client: User;
	journey?: Journey;
}

// =======================
// MENTOR REVIEW SYSTEM (Phase 4)
// =======================

// Mentor application
export type MentorApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface MentorApplication {
	id: number;
	user_id: number;
	status: MentorApplicationStatus;
	bio: string | null;
	expertise: string | null; // JSON array
	experience_years: number | null;
	education: string | null;
	certifications: string | null;
	why_mentor: string | null;
	sample_feedback: string | null;
	availability_hours: number | null;
	hourly_rate: number | null;
	applied_at: string;
	reviewed_at: string | null;
	reviewed_by: number | null;
	rejection_reason: string | null;
	notes: string | null;
}

// Mentor profile
export interface MentorProfile {
	id: number;
	user_id: number;
	bio: string;
	expertise: string | null; // JSON array
	experience_years: number;
	education: string | null;
	certifications: string | null;
	availability_hours: number;
	is_active: boolean;
	is_featured: boolean;
	profile_image_url: string | null;
	timezone: string;
	languages: string | null; // JSON array
	total_reviews: number;
	completed_reviews: number;
	average_rating: number;
	average_turnaround_hours: number;
	total_earnings: number;
	created_at: string;
	updated_at: string;
}

// Journey mentor assignment
export type JourneyMentorStatus = 'active' | 'paused' | 'removed';

export interface JourneyMentor {
	id: number;
	journey_id: number;
	mentor_user_id: number;
	creator_user_id: number;
	status: JourneyMentorStatus;
	review_rate: number;
	revenue_share_percentage: number;
	max_reviews_per_week: number;
	current_week_reviews: number;
	total_reviews: number;
	average_rating: number;
	assigned_at: string;
	updated_at: string;
}

// Section review
export type SectionReviewStatus =
	| 'requested'
	| 'in_review'
	| 'changes_requested'
	| 'approved'
	| 'cancelled';

export type ReviewPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface SectionReview {
	id: number;
	user_journey_id: number;
	section_id: number;
	mentor_user_id: number | null;
	status: SectionReviewStatus;
	priority: ReviewPriority;
	client_notes: string | null;
	mentor_feedback: string | null;
	overall_rating: number | null; // 1-5
	requested_at: string;
	claimed_at: string | null;
	reviewed_at: string | null;
	approved_at: string | null;
	turnaround_hours: number | null;
	revision_count: number;
}

// Review comment
export type ReviewCommentType = 'feedback' | 'question' | 'suggestion' | 'approval' | 'issue';
export type ReviewAuthorRole = 'mentor' | 'client';

export interface ReviewComment {
	id: number;
	section_review_id: number;
	field_id: number | null;
	comment_text: string;
	comment_type: ReviewCommentType;
	author_user_id: number;
	author_role: ReviewAuthorRole;
	parent_comment_id: number | null;
	is_resolved: boolean;
	created_at: string;
	updated_at: string;
}

// Mentor rating
export interface MentorRating {
	id: number;
	section_review_id: number;
	mentor_user_id: number;
	client_user_id: number;
	journey_id: number;
	overall_rating: number; // 1-5
	helpfulness_rating: number | null; // 1-5
	timeliness_rating: number | null; // 1-5
	communication_rating: number | null; // 1-5
	review_text: string | null;
	would_recommend: boolean;
	created_at: string;
}

// Mentor transaction
export type MentorTransactionType = 'review_fee' | 'revenue_share' | 'bonus' | 'adjustment';
export type MentorTransactionStatus = 'pending' | 'completed' | 'paid_out';

export interface MentorTransaction {
	id: number;
	mentor_user_id: number;
	transaction_type: MentorTransactionType;
	section_review_id: number | null;
	subscription_id: number | null;
	journey_id: number;
	amount: number;
	platform_fee: number;
	mentor_amount: number;
	status: MentorTransactionStatus;
	payment_method: string;
	description: string | null;
	transaction_date: string;
	completed_at: string | null;
	paid_out_at: string | null;
	created_at: string;
}

// Review notification
export type ReviewNotificationType =
	| 'review_requested'
	| 'review_claimed'
	| 'review_completed'
	| 'changes_requested'
	| 'review_approved'
	| 'rating_received';

export interface ReviewNotification {
	id: number;
	user_id: number;
	notification_type: ReviewNotificationType;
	section_review_id: number;
	title: string;
	message: string;
	is_read: boolean;
	read_at: string | null;
	created_at: string;
}

// Extended types with joined data
export interface MentorApplicationWithUser extends MentorApplication {
	username: string;
	email: string;
}

export interface MentorProfileWithUser extends MentorProfile {
	username: string;
	email: string;
}

export interface JourneyMentorWithDetails extends JourneyMentor {
	journey_name: string;
	journey_slug: string;
	mentor_username: string;
	mentor_email: string;
	mentor_bio: string | null;
	mentor_rating: number;
	mentor_total_reviews: number;
}

export interface SectionReviewWithContext extends SectionReview {
	client_user_id: number;
	client_username: string;
	client_email: string;
	section_name: string;
	section_slug: string;
	journey_name: string;
	journey_slug: string;
	mentor_username?: string;
}

export interface ReviewCommentWithAuthor extends ReviewComment {
	author_username: string;
	field_name?: string;
}
