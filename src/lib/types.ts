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

export interface Credential {
	id?: number;
	user_id: number;
	site_name: string;
	web_address: string;
	username: string;
	password: string;
	other_info: string;
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
	completion_percentage: number;
	last_updated: string;
}

export interface ReadinessScore {
	total_score: number;
	sections: {
		[key: string]: number;
	};
}

export const SECTIONS = [
	{ id: 'credentials', name: 'Usernames & Passwords', weight: 5 },
	{ id: 'personal', name: 'Personal Information', weight: 8 },
	{ id: 'family', name: 'Family History', weight: 6 },
	{ id: 'pets', name: 'Pets', weight: 3 },
	{ id: 'contacts', name: 'Key Contacts', weight: 7 },
	{ id: 'medical', name: 'Medical', weight: 8 },
	{ id: 'employment', name: 'Employment', weight: 5 },
	{ id: 'residence', name: 'Primary Residence', weight: 6 },
	{ id: 'property', name: 'Property', weight: 6 },
	{ id: 'insurance', name: 'Insurance', weight: 8 },
	{ id: 'financial', name: 'Financial', weight: 8 },
	{ id: 'legal', name: 'Legal', weight: 9 },
	{ id: 'final-days', name: 'Final Days', weight: 7 },
	{ id: 'obituary', name: 'Obituary', weight: 5 },
	{ id: 'after-death', name: 'After Death', weight: 8 },
	{ id: 'funeral', name: 'Funeral & Celebration', weight: 7 },
	{ id: 'conclusion', name: 'Conclusion', weight: 4 }
] as const;
