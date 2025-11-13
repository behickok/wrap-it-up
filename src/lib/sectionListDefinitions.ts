import type { ListSectionDefinition } from '$lib/types';

export const LIST_SECTION_DEFINITIONS: Record<string, ListSectionDefinition> = {
	legal: {
		title: 'Legal Documents',
		description: 'Track wills, trusts, and other critical legal paperwork.',
		addLabel: 'Add Document',
		fields: [
			{
				name: 'document_type',
				label: 'Document Type',
				type: 'select',
				required: true,
				options: [
					{ value: 'Will', label: 'Will' },
					{ value: 'Trust', label: 'Trust' },
					{ value: 'Power of Attorney', label: 'Power of Attorney' },
					{ value: 'Healthcare Directive', label: 'Healthcare Directive' },
					{ value: 'Living Will', label: 'Living Will' },
					{ value: 'Deed', label: 'Deed' },
					{ value: 'Birth Certificate', label: 'Birth Certificate' },
					{ value: 'Marriage Certificate', label: 'Marriage Certificate' },
					{ value: 'Divorce Decree', label: 'Divorce Decree' },
					{ value: 'Other', label: 'Other' }
				]
			},
			{ name: 'location', label: 'Location / Storage', type: 'textarea', rows: 3 },
			{ name: 'attorney_name', label: 'Attorney Name', type: 'text' },
			{ name: 'attorney_contact', label: 'Attorney Contact', type: 'text' },
			{ name: 'notes', label: 'Notes', type: 'textarea', rows: 3 }
		]
	},
	financial: {
		title: 'Financial Accounts',
		description: 'Document the banks and institutions that hold your assets.',
		addLabel: 'Add Account',
		fields: [
			{ name: 'institution_name', label: 'Institution Name', type: 'text', required: true },
			{
				name: 'account_type',
				label: 'Account Type',
				type: 'select',
				options: [
					{ value: 'Checking', label: 'Checking' },
					{ value: 'Savings', label: 'Savings' },
					{ value: 'Investment', label: 'Investment' },
					{ value: 'Retirement (401k)', label: 'Retirement (401k)' },
					{ value: 'Retirement (IRA)', label: 'Retirement (IRA)' },
					{ value: 'CD', label: 'CD' },
					{ value: 'Money Market', label: 'Money Market' },
					{ value: 'Other', label: 'Other' }
				]
			},
			{ name: 'account_number', label: 'Account Number', type: 'text' },
			{ name: 'routing_number', label: 'Routing Number', type: 'text' },
			{ name: 'balance', label: 'Approximate Balance', type: 'number' },
			{ name: 'notes', label: 'Notes', type: 'textarea', rows: 3 }
		]
	},
	insurance: {
		title: 'Insurance Policies',
		description: 'Summarize coverage amounts, beneficiaries, and agent details.',
		addLabel: 'Add Policy',
		fields: [
			{
				name: 'insurance_type',
				label: 'Policy Type',
				type: 'select',
				options: ['Life', 'Health', 'Disability', 'Homeowners', 'Renters', 'Auto', 'Long-term Care', 'Other']
			},
			{ name: 'provider', label: 'Provider', type: 'text' },
			{ name: 'policy_number', label: 'Policy Number', type: 'text' },
			{ name: 'coverage_amount', label: 'Coverage Amount', type: 'number' },
			{ name: 'beneficiary', label: 'Beneficiary', type: 'text' },
			{ name: 'agent_name', label: 'Agent Name', type: 'text' },
			{ name: 'agent_phone', label: 'Agent Phone', type: 'tel' },
			{ name: 'premium_amount', label: 'Premium Amount', type: 'number' },
			{
				name: 'premium_frequency',
				label: 'Premium Frequency',
				type: 'select',
				options: ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual']
			},
			{ name: 'notes', label: 'Notes', type: 'textarea', rows: 3 }
		]
	},
	employment: {
		title: 'Employment History',
		description: 'Capture current and prior employers with supervisor contacts.',
		addLabel: 'Add Employer',
		fields: [
			{ name: 'employer_name', label: 'Employer Name', type: 'text', required: true },
			{ name: 'position', label: 'Role / Position', type: 'text' },
			{ name: 'hire_date', label: 'Start Date', type: 'date' },
			{ name: 'is_current', label: 'Currently employed here', type: 'checkbox' },
			{ name: 'address', label: 'Work Address', type: 'textarea', rows: 3 },
			{ name: 'phone', label: 'Employer Phone', type: 'tel' },
			{ name: 'supervisor', label: 'Supervisor', type: 'text' },
			{ name: 'supervisor_contact', label: 'Supervisor Contact', type: 'text' },
			{ name: 'notes', label: 'Notes', type: 'textarea', rows: 3 }
		]
	},
	property: {
		title: 'Vehicles & Property',
		description: 'Store vehicle ownership details for titles and insurance.',
		addLabel: 'Add Vehicle',
		fields: [
			{ name: 'names_on_title', label: 'Names on Title', type: 'text' },
			{ name: 'make', label: 'Make', type: 'text' },
			{ name: 'model', label: 'Model', type: 'text' },
			{ name: 'year', label: 'Year', type: 'number' },
			{ name: 'vin', label: 'VIN', type: 'text' },
			{ name: 'registration_dates', label: 'Registration Dates', type: 'text' },
			{ name: 'title_location', label: 'Title Location', type: 'text' },
			{ name: 'notes', label: 'Notes', type: 'textarea', rows: 3 }
		]
	},
	credentials: {
		title: 'Usernames & Passwords',
		description: 'Store login information for the accounts your family will need.',
		addLabel: 'Add Credential',
		fields: [
			{ name: 'site_name', label: 'Site / Service', type: 'text', required: true },
			{ name: 'web_address', label: 'Login URL', type: 'text' },
			{ name: 'username', label: 'Username', type: 'text' },
			{ name: 'password', label: 'Password', type: 'text' },
			{
				name: 'category',
				label: 'Category',
				type: 'select',
				options: [
					{ value: 'email', label: 'Email' },
					{ value: 'banking', label: 'Banking / Financial' },
					{ value: 'social', label: 'Social' },
					{ value: 'utilities', label: 'Utilities' },
					{ value: 'government', label: 'Government' },
					{ value: 'other', label: 'Other' }
				]
			},
			{ name: 'other_info', label: 'Notes', type: 'textarea', rows: 3 }
		]
	},
	contacts: {
		title: 'Key Contacts',
		description: 'Capture the people your loved ones will need to reach quickly.',
		addLabel: 'Add Contact',
		fields: [
			{ name: 'relationship', label: 'Relationship', type: 'text', required: true },
			{ name: 'name', label: 'Name', type: 'text', required: true },
			{ name: 'phone', label: 'Phone', type: 'tel' },
			{ name: 'email', label: 'Email', type: 'email' },
			{ name: 'address', label: 'Address', type: 'textarea', rows: 3 },
			{ name: 'date_of_birth', label: 'Date of Birth', type: 'date' }
		]
	},
	vendors: {
		title: 'Wedding Vendors',
		description: 'Track every professional helping you deliver the experience.',
		addLabel: 'Add Vendor',
		fields: [
			{ name: 'vendor_type', label: 'Vendor Type', type: 'text', placeholder: 'Planner, florist, DJ…' },
			{ name: 'business_name', label: 'Business Name', type: 'text', required: true },
			{ name: 'contact_name', label: 'Contact Name', type: 'text' },
			{ name: 'contact_email', label: 'Contact Email', type: 'email' },
			{ name: 'contact_phone', label: 'Contact Phone', type: 'tel' },
			{ name: 'next_payment_due', label: 'Next Payment Due', type: 'date' },
			{ name: 'deposit_amount', label: 'Deposit', type: 'number' },
			{ name: 'balance_due', label: 'Balance Due', type: 'number' },
			{ name: 'status', label: 'Status', type: 'text', placeholder: 'Booked, paid, pending…' },
			{ name: 'notes', label: 'Notes', type: 'textarea', rows: 3 }
		]
	},
	guest_list: {
		title: 'Guest List',
		description: 'Manage RSVPs, dietary needs, and invitation status.',
		addLabel: 'Add Guest',
		fields: [
			{ name: 'guest_name', label: 'Guest Name', type: 'text', required: true },
			{ name: 'relationship', label: 'Relationship', type: 'text' },
			{ name: 'party_size', label: 'Party Size', type: 'number' },
			{ name: 'email', label: 'Email', type: 'email' },
			{ name: 'phone', label: 'Phone', type: 'tel' },
			{ name: 'address', label: 'Address', type: 'textarea', rows: 3 },
			{
				name: 'invitation_sent',
				label: 'Invitation Sent',
				type: 'checkbox',
				placeholder: 'Mark if invitation has been sent'
			},
			{ name: 'rsvp_status', label: 'RSVP Status', type: 'text', placeholder: 'Pending, accepted, declined…' },
			{ name: 'meal_preference', label: 'Meal Preference', type: 'text' },
			{ name: 'notes', label: 'Notes', type: 'textarea', rows: 3 }
		]
	},
	registry: {
		title: 'Registry Items',
		description: 'Track every request across traditional registries and funds.',
		addLabel: 'Add Registry Item',
		fields: [
			{ name: 'retailer', label: 'Retailer / Fund', type: 'text' },
			{ name: 'item_name', label: 'Item Name', type: 'text', required: true },
			{ name: 'item_url', label: 'Item URL', type: 'text' },
			{ name: 'price', label: 'Price', type: 'number' },
			{ name: 'quantity', label: 'Quantity', type: 'number' },
			{ name: 'priority', label: 'Priority', type: 'text', placeholder: 'Must-have, nice-to-have…' },
			{ name: 'status', label: 'Status', type: 'text', placeholder: 'Open, reserved, purchased' },
			{ name: 'notes', label: 'Notes', type: 'textarea', rows: 3 }
		]
	}
};
