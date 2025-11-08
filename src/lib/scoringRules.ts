/**
 * Point-based scoring system for Wrap It Up sections
 *
 * Each section is scored on a 0-100 point scale based on:
 * - Presence: Having any data at all
 * - Quality: Completeness and number of entries
 * - Priority: Important items worth more points
 */

import type {
	Credential,
	Pet,
	KeyContact,
	Insurance,
	BankAccount,
	Employment
} from './types';

// ============================================================================
// CREDENTIALS SCORING (0-100 points)
// ============================================================================

export interface CredentialsScore {
	basePoints: number; // 30 max
	categoryPoints: number; // 40 max
	completenessPoints: number; // 30 max
	total: number;
}

/**
 * Calculate score for credentials section
 *
 * Base Points (30):
 * - 0 points: No credentials
 * - 30 points: At least 1 credential with username AND password
 *
 * Critical Service Coverage (40 points max):
 * - Email account: +10 points
 * - Banking/Financial: +10 points
 * - Social Media: +10 points
 * - Utilities/Government: +10 points
 *
 * Completeness Bonus (30 points max):
 * - +5 points for each credential that has ALL fields filled
 * - Capped at 6 credentials (30 points)
 */
export function calculateCredentialsScore(credentials: Credential[]): CredentialsScore {
	let basePoints = 0;
	let categoryPoints = 0;
	let completenessPoints = 0;

	// No credentials = 0 points
	if (!credentials || credentials.length === 0) {
		return { basePoints: 0, categoryPoints: 0, completenessPoints: 0, total: 0 };
	}

	// Base points: At least one valid credential
	const hasValidCredential = credentials.some(
		(c) => c.username && c.username.trim() !== '' && c.password && c.password.trim() !== ''
	);
	if (hasValidCredential) {
		basePoints = 30;
	}

	// Category coverage points
	const categories = new Set(credentials.map((c) => c.category));
	if (categories.has('email')) categoryPoints += 10;
	if (categories.has('banking')) categoryPoints += 10;
	if (categories.has('social')) categoryPoints += 10;
	if (categories.has('utilities') || categories.has('government')) categoryPoints += 10;

	// Completeness bonus: credentials with all fields filled
	let completeCount = 0;
	credentials.forEach((credential) => {
		const isComplete =
			credential.site_name?.trim() &&
			credential.web_address?.trim() &&
			credential.username?.trim() &&
			credential.password?.trim() &&
			credential.category;
		if (isComplete) {
			completeCount++;
		}
	});

	// +5 points per complete credential, capped at 6 (30 points total)
	completenessPoints = Math.min(completeCount * 5, 30);

	const total = basePoints + categoryPoints + completenessPoints;

	return {
		basePoints,
		categoryPoints,
		completenessPoints,
		total: Math.min(total, 100) // Cap at 100
	};
}

// ============================================================================
// PETS SCORING (0-100 points)
// ============================================================================

/**
 * Calculate score for pets section
 *
 * Base Points (30):
 * - 30 points: At least one pet with name and basic info
 *
 * Essential Info (40 points max):
 * - Each pet with veterinarian info: +10 points (max 4 pets = 40 points)
 *
 * Completeness Bonus (30 points max):
 * - Each pet with ALL fields filled: +10 points (max 3 pets = 30 points)
 */
export function calculatePetsScore(pets: Pet[]): number {
	if (!pets || pets.length === 0) return 0;

	let score = 0;

	// Base points: At least one pet with name
	const hasValidPet = pets.some((p) => p.name && p.name.trim() !== '');
	if (hasValidPet) {
		score += 30;
	}

	// Essential info: Veterinarian information
	const petsWithVet = pets.filter((p) => p.veterinarian && p.vet_phone).length;
	score += Math.min(petsWithVet * 10, 40);

	// Completeness bonus
	let completeCount = 0;
	pets.forEach((pet) => {
		const isComplete =
			pet.name?.trim() &&
			pet.breed?.trim() &&
			pet.veterinarian?.trim() &&
			pet.vet_phone?.trim() &&
			pet.medications?.trim();
		if (isComplete) {
			completeCount++;
		}
	});
	score += Math.min(completeCount * 10, 30);

	return Math.min(score, 100);
}

// ============================================================================
// KEY CONTACTS SCORING (0-100 points)
// ============================================================================

/**
 * Calculate score for key contacts section
 *
 * Base Points (20):
 * - 20 points: At least one contact
 *
 * Category Coverage (60 points max):
 * - Emergency contact: +15 points
 * - Medical contact: +15 points
 * - Legal/Attorney: +15 points
 * - Financial/Accountant: +15 points
 *
 * Completeness Bonus (20 points max):
 * - Each contact with complete info (name, phone, relationship): +5 points (max 4 = 20 points)
 */
export function calculateContactsScore(contacts: KeyContact[]): number {
	if (!contacts || contacts.length === 0) return 0;

	let score = 0;

	// Base points
	if (contacts.length > 0) {
		score += 20;
	}

	// Category coverage - based on relationship keywords
	const relationships = contacts.map((c) => c.relationship?.toLowerCase() || '');
	if (relationships.some((r) => r.includes('emergency') || r.includes('next of kin'))) {
		score += 15;
	}
	if (relationships.some((r) => r.includes('doctor') || r.includes('medical') || r.includes('physician'))) {
		score += 15;
	}
	if (relationships.some((r) => r.includes('attorney') || r.includes('lawyer') || r.includes('legal'))) {
		score += 15;
	}
	if (relationships.some((r) => r.includes('accountant') || r.includes('financial') || r.includes('advisor'))) {
		score += 15;
	}

	// Completeness bonus
	let completeCount = 0;
	contacts.forEach((contact) => {
		const isComplete =
			contact.name?.trim() &&
			contact.phone?.trim() &&
			contact.relationship?.trim();
		if (isComplete) {
			completeCount++;
		}
	});
	score += Math.min(completeCount * 5, 20);

	return Math.min(score, 100);
}

// ============================================================================
// INSURANCE SCORING (0-100 points)
// ============================================================================

/**
 * Calculate score for insurance section
 *
 * Base Points (20):
 * - 20 points: At least one policy
 *
 * Critical Coverage (60 points max):
 * - Health insurance: +15 points
 * - Life insurance: +15 points
 * - Auto insurance: +15 points
 * - Home/Property insurance: +15 points
 *
 * Completeness Bonus (20 points max):
 * - Each policy with complete info: +5 points (max 4 = 20 points)
 */
export function calculateInsuranceScore(policies: Insurance[]): number {
	if (!policies || policies.length === 0) return 0;

	let score = 0;

	// Base points
	if (policies.length > 0) {
		score += 20;
	}

	// Critical coverage types
	const types = policies.map((p) => p.insurance_type?.toLowerCase() || '');
	if (types.some((t) => t.includes('health') || t.includes('medical'))) {
		score += 15;
	}
	if (types.some((t) => t.includes('life'))) {
		score += 15;
	}
	if (types.some((t) => t.includes('auto') || t.includes('car') || t.includes('vehicle'))) {
		score += 15;
	}
	if (types.some((t) => t.includes('home') || t.includes('property') || t.includes('renters'))) {
		score += 15;
	}

	// Completeness bonus
	let completeCount = 0;
	policies.forEach((policy) => {
		const isComplete =
			policy.insurance_type?.trim() &&
			policy.provider?.trim() &&
			policy.policy_number?.trim() &&
			policy.agent_name?.trim() &&
			policy.agent_phone?.trim();
		if (isComplete) {
			completeCount++;
		}
	});
	score += Math.min(completeCount * 5, 20);

	return Math.min(score, 100);
}

// ============================================================================
// FINANCIAL SCORING (0-100 points)
// ============================================================================

/**
 * Calculate score for financial section (bank accounts + investments)
 *
 * Base Points (30):
 * - 30 points: At least one financial account
 *
 * Account Diversity (40 points max):
 * - Checking account: +10 points
 * - Savings account: +10 points
 * - Investment/Retirement account: +10 points
 * - Additional accounts: +10 points
 *
 * Completeness Bonus (30 points max):
 * - Each account with complete info: +6 points (max 5 = 30 points)
 */
export function calculateFinancialScore(accounts: BankAccount[]): number {
	if (!accounts || accounts.length === 0) return 0;

	let score = 0;

	// Base points
	if (accounts.length > 0) {
		score += 30;
	}

	// Account diversity
	const types = accounts.map((a) => a.account_type?.toLowerCase() || '');
	if (types.some((t) => t.includes('checking'))) {
		score += 10;
	}
	if (types.some((t) => t.includes('savings'))) {
		score += 10;
	}
	if (types.some((t) => t.includes('investment') || t.includes('retirement') || t.includes('401k') || t.includes('ira'))) {
		score += 10;
	}
	if (accounts.length > 3) {
		score += 10; // Bonus for having multiple accounts documented
	}

	// Completeness bonus
	let completeCount = 0;
	accounts.forEach((account) => {
		const isComplete =
			account.institution_name?.trim() &&
			account.account_type?.trim() &&
			account.account_number?.trim();
		if (isComplete) {
			completeCount++;
		}
	});
	score += Math.min(completeCount * 6, 30);

	return Math.min(score, 100);
}

// ============================================================================
// EMPLOYMENT SCORING (0-100 points)
// ============================================================================

export function calculateEmploymentScore(records: Employment[]): number {
	if (!records || records.length === 0) return 0;

	let score = 0;

	// Base points: any employment history
	score += 30;

	// Current employment bonus
	if (records.some((r) => r.is_current)) {
		score += 20;
	}

	// Diversity: multiple employers/roles
	const employers = new Set(records.map((r) => r.employer_name?.trim()).filter(Boolean));
	if (employers.size >= 2) {
		score += 15;
	}
	if (employers.size >= 3) {
		score += 5;
	}

	// Completeness bonus
	let completeCount = 0;
	records.forEach((record) => {
		const isComplete =
			record.employer_name?.trim() &&
			record.position?.trim() &&
			record.hire_date?.trim() &&
			record.supervisor?.trim() &&
			record.supervisor_contact?.trim();
		if (isComplete) {
			completeCount++;
		}
	});
	score += Math.min(completeCount * 6, 30);

	return Math.min(score, 100);
}

// ============================================================================
// SIMPLE FIELD-BASED SCORING (for sections with fixed fields)
// ============================================================================

/**
 * Calculate score for sections with fixed fields
 * Uses a simple presence-based system with field weighting
 *
 * @param data - The section data object
 * @param criticalFields - Fields that are worth more points (10 points each)
 * @param importantFields - Fields worth moderate points (5 points each)
 * @param optionalFields - Fields worth fewer points (2 points each)
 */
export function calculateFieldBasedScore(
	data: any,
	criticalFields: string[] = [],
	importantFields: string[] = [],
	optionalFields: string[] = []
): number {
	if (!data) return 0;

	let score = 0;
	let maxScore = 0;

	// Calculate max possible score
	maxScore += criticalFields.length * 10;
	maxScore += importantFields.length * 5;
	maxScore += optionalFields.length * 2;

	// Calculate actual score
	criticalFields.forEach((field) => {
		const value = data[field];
		if (value !== null && value !== undefined && value !== '') {
			score += 10;
		}
	});

	importantFields.forEach((field) => {
		const value = data[field];
		if (value !== null && value !== undefined && value !== '') {
			score += 5;
		}
	});

	optionalFields.forEach((field) => {
		const value = data[field];
		if (value !== null && value !== undefined && value !== '') {
			score += 2;
		}
	});

	// Convert to 0-100 scale
	if (maxScore === 0) return 0;
	return Math.round((score / maxScore) * 100);
}

// ============================================================================
// SECTION FIELD DEFINITIONS
// ============================================================================

export const SECTION_FIELDS = {
	personal: {
		critical: ['legal_name', 'date_of_birth', 'address', 'ssn_or_green_card'],
		important: ['mobile_phone', 'email', 'drivers_license'],
		optional: ['home_phone', 'passport_number', 'occupation', 'employer']
	},
	medical: {
		critical: ['name', 'blood_type', 'medical_conditions', 'allergies'],
		important: ['preferred_hospital', 'preferred_pharmacy'],
		optional: ['height', 'weight']
	},
	employment: {
		critical: ['employer_name', 'position'],
		important: ['phone', 'address', 'supervisor'],
		optional: ['hire_date', 'supervisor_contact']
	},
	residence: {
		critical: ['address', 'own_or_rent'],
		important: ['mortgage_lease_info', 'value'],
		optional: ['gas_company', 'electric_company', 'water_company', 'internet_company']
	},
	legal: {
		critical: ['document_type', 'location'],
		important: ['attorney_name', 'attorney_contact'],
		optional: ['notes']
	},
	'final-days': {
		critical: ['who_around', 'organ_donation_info'],
		important: ['favorite_food_drink', 'music_type'],
		optional: ['flowers_preference', 'aromatic_smells', 'love_letter']
	},
	obituary: {
		critical: ['obituary_text'],
		important: ['online_or_newspaper', 'contact_name', 'contact_phone'],
		optional: ['publication_date', 'cost']
	},
	'after-death': {
		critical: ['contact_name', 'contact_phone', 'body_disposal_preference'],
		important: ['burial_type', 'container_type', 'organ_donation'],
		optional: ['burial_outfit', 'items_buried_with', 'memorial_organization']
	},
	funeral: {
		critical: ['location_name', 'director_name', 'final_resting_place'],
		important: ['pallbearers', 'order_of_service'],
		optional: ['military_honors', 'programs_printed', 'pictures', 'slideshow']
	},
	conclusion: {
		critical: ['final_thoughts'],
		important: [],
		optional: ['additional_notes']
	}
} as const;
