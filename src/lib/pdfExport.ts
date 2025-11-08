import { SECTIONS, JOURNEY_CATEGORIES } from '$lib/types';

type JsPDFConstructor = typeof import('jspdf').default;
type AutoTablePlugin = typeof import('jspdf-autotable').default;

let jsPDFModule: JsPDFConstructor | null = null;
let autoTableModule: AutoTablePlugin | null = null;

async function loadPdfLibraries() {
	if (!jsPDFModule || !autoTableModule) {
		const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
			import('jspdf'),
			import('jspdf-autotable')
		]);

		jsPDFModule = jsPDF;
		autoTableModule = autoTable;
	}

	return {
		jsPDF: jsPDFModule!,
		autoTable: autoTableModule!
	};
}

interface ExportData {
	user: {
		username: string;
		email: string;
	};
	data: {
		personalInfo: any[];
		credentials: any[];
		pets: any[];
		keyContacts: any[];
		medicalInfo: any[];
		physicians: any[];
		employment: any[];
		primaryResidence: any[];
		vehicles: any[];
		insurance: any[];
		bankAccounts: any[];
		legalDocuments: any[];
		finalDays: any[];
		obituary: any[];
		afterDeath: any[];
		funeral: any[];
	};
	exportedAt: string;
}

// Field labels for better display
const FIELD_LABELS: Record<string, string> = {
	// Personal Info
	legal_name: 'Legal Name',
	maiden_name: 'Maiden Name',
	date_of_birth: 'Date of Birth',
	place_of_birth: 'Place of Birth',
	address: 'Address',
	po_box_number: 'P.O. Box Number',
	po_box_location: 'P.O. Box Location',
	po_box_key_location: 'P.O. Box Key Location',
	home_phone: 'Home Phone',
	mobile_phone: 'Mobile Phone',
	office_phone: 'Office Phone',
	fax_number: 'Fax Number',
	email: 'Email',
	drivers_license: "Driver's License",
	ssn_or_green_card: 'SSN/Green Card',
	passport_number: 'Passport Number',
	visa_number: 'Visa Number',
	occupation: 'Occupation',
	employer: 'Employer',
	employment_address: 'Employment Address',
	military_service: 'Military Service',
	church_affiliation: 'Church Affiliation',
	education: 'Education',

	// Credentials
	site_name: 'Site Name',
	web_address: 'Web Address',
	username: 'Username',
	password: 'Password',
	category: 'Category',
	other_info: 'Other Info',

	// Pets
	breed: 'Breed',
	name: 'Name',
	license_chip_info: 'License/Chip Info',
	medications: 'Medications',
	veterinarian: 'Veterinarian',
	vet_phone: 'Vet Phone',
	pet_insurance: 'Pet Insurance',
	policy_number: 'Policy Number',

	// Key Contacts
	relationship: 'Relationship',
	phone: 'Phone',

	// Medical
	blood_type: 'Blood Type',
	height: 'Height',
	weight: 'Weight',
	sex: 'Sex',
	medical_conditions: 'Medical Conditions',
	preferred_hospital: 'Preferred Hospital',
	preferred_pharmacy: 'Preferred Pharmacy',
	allergies: 'Allergies',
	specialty: 'Specialty',

	// Employment
	employer_name: 'Employer Name',
	position: 'Position',
	hire_date: 'Hire Date',
	supervisor: 'Supervisor',
	supervisor_contact: 'Supervisor Contact',
	is_current: 'Current Employment',

	// Residence
	own_or_rent: 'Own or Rent',
	mortgage_lease_info: 'Mortgage/Lease Info',
	balance: 'Balance',
	value: 'Value',
	lien_info: 'Lien Info',
	gas_company: 'Gas Company',
	electric_company: 'Electric Company',
	water_company: 'Water Company',
	internet_company: 'Internet Company',
	waste_company: 'Waste Company',
	recycle_company: 'Recycle Company',
	hoa_contact_name: 'HOA Contact Name',
	hoa_contact_phone: 'HOA Contact Phone',
	hoa_dues: 'HOA Dues',

	// Vehicles
	names_on_title: 'Names on Title',
	make: 'Make',
	model: 'Model',
	year: 'Year',
	vin: 'VIN',
	registration_dates: 'Registration Dates',
	title_location: 'Title Location',

	// Insurance
	insurance_type: 'Insurance Type',
	provider: 'Provider',
	coverage_amount: 'Coverage Amount',
	beneficiary: 'Beneficiary',
	agent_name: 'Agent Name',
	agent_phone: 'Agent Phone',
	premium_amount: 'Premium Amount',
	premium_frequency: 'Premium Frequency',

	// Bank Accounts
	institution_name: 'Institution Name',
	account_type: 'Account Type',
	account_number: 'Account Number',
	routing_number: 'Routing Number',

	// Legal Documents
	document_type: 'Document Type',
	location: 'Location',
	attorney_name: 'Attorney Name',
	attorney_contact: 'Attorney Contact',
	notes: 'Notes',

	// Final Days
	who_around: 'Who To Have Around',
	favorite_food_drink: 'Favorite Food/Drink',
	music_type: 'Music Type',
	flowers_preference: 'Flowers Preference',
	flower_types: 'Flower Types',
	aromatic_smells: 'Aromatic Smells',
	smell_types: 'Smell Types',
	love_letter: 'Love Letter',
	organ_donation_info: 'Organ Donation Info',

	// Obituary
	online_or_newspaper: 'Online or Newspaper',
	contact_name: 'Contact Name',
	contact_phone: 'Contact Phone',
	contact_email: 'Contact Email',
	publication_date: 'Publication Date',
	cost: 'Cost',
	obituary_text: 'Obituary Text',

	// After Death
	contact_address: 'Contact Address',
	body_disposal_preference: 'Body Disposal Preference',
	transfer_service: 'Transfer Service',
	embalming_preference: 'Embalming Preference',
	burial_outfit: 'Burial Outfit',
	organ_donation: 'Organ Donation',
	burial_timing: 'Burial Timing',
	burial_type: 'Burial Type',
	container_type: 'Container Type',
	items_buried_with: 'Items Buried With',
	ash_scatter_location: 'Ash Scatter Location',
	memorial_organization: 'Memorial Organization',
	flowers_location: 'Flowers Location',
	visitation_timing: 'Visitation Timing',
	visitation_time: 'Visitation Time',
	casket_open_closed: 'Casket Open/Closed',

	// Funeral
	location_name: 'Location Name',
	location_address: 'Location Address',
	director_name: 'Director Name',
	director_contact: 'Director Contact',
	military_honors: 'Military Honors',
	programs_printed: 'Programs Printed',
	pictures: 'Pictures',
	slideshow: 'Slideshow',
	pallbearers: 'Pallbearers',
	order_of_service: 'Order of Service',
	pastor: 'Pastor',
	organist: 'Organist',
	celebration_location: 'Celebration Location',
	celebration_food: 'Celebration Food',
	final_resting_place: 'Final Resting Place',
	headstone_info: 'Headstone Info'
};

function formatFieldValue(value: any): string {
	if (value === null || value === undefined || value === '') {
		return 'Not provided';
	}
	if (typeof value === 'boolean') {
		return value ? 'Yes' : 'No';
	}
	if (typeof value === 'number') {
		return value.toString();
	}
	return String(value);
}

function getFieldLabel(fieldName: string): string {
	return FIELD_LABELS[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export async function exportToPDF() {
	try {
		if (typeof window === 'undefined') {
			return {
				success: false,
				error: 'PDF export is only available in the browser'
			};
		}

		const { jsPDF, autoTable } = await loadPdfLibraries();

		// Fetch the data from API
		const response = await fetch('/api/export-data');
		if (!response.ok) {
			throw new Error('Failed to fetch data');
		}

		const exportData: ExportData = await response.json();

		// Create PDF with A4 size
		const doc = new jsPDF({
			orientation: 'portrait',
			unit: 'mm',
			format: 'a4'
		});

		let yPosition = 20;
		const pageWidth = doc.internal.pageSize.getWidth();
		const pageHeight = doc.internal.pageSize.getHeight();
		const margin = 15;
		const contentWidth = pageWidth - (margin * 2);

		// Title Page
		doc.setFontSize(28);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(44, 62, 80);
		doc.text('Wrap It Up', pageWidth / 2, 60, { align: 'center' });

		doc.setFontSize(16);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(100, 100, 100);
		doc.text('End of Life Planning Document', pageWidth / 2, 75, { align: 'center' });

		doc.setFontSize(12);
		doc.text(`Prepared for: ${exportData.user.username}`, pageWidth / 2, 95, { align: 'center' });
		doc.text(`Generated: ${new Date(exportData.exportedAt).toLocaleDateString()}`, pageWidth / 2, 105, { align: 'center' });

		// Confidentiality notice
		doc.setFontSize(10);
		doc.setTextColor(200, 0, 0);
		doc.setFont('helvetica', 'bold');
		doc.text('CONFIDENTIAL', pageWidth / 2, 130, { align: 'center' });
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(100, 100, 100);
		const confidentialityText = 'This document contains sensitive personal information. Please store securely and dispose of properly.';
		const splitConfidentiality = doc.splitTextToSize(confidentialityText, contentWidth - 40);
		doc.text(splitConfidentiality, pageWidth / 2, 140, { align: 'center' });

		// Add new page for content
		doc.addPage();
		yPosition = 20;

		// Helper function to check if we need a new page
		function checkAddPage(neededSpace: number = 20) {
			if (yPosition + neededSpace > pageHeight - margin) {
				doc.addPage();
				yPosition = 20;
				return true;
			}
			return false;
		}

		// Helper function to add section header
		function addSectionHeader(title: string, categoryColor: string) {
			checkAddPage(30);
			doc.setFillColor(245, 245, 245);
			doc.rect(margin, yPosition - 5, contentWidth, 15, 'F');
			doc.setFontSize(14);
			doc.setFont('helvetica', 'bold');
			doc.setTextColor(44, 62, 80);
			doc.text(title, margin + 5, yPosition + 5);
			yPosition += 20;
		}

		// Helper function to add journey category header
		function addJourneyCategoryHeader(category: any) {
			checkAddPage(40);
			doc.setFontSize(18);
			doc.setFont('helvetica', 'bold');
			doc.setTextColor(60, 80, 100);
			doc.text(`${category.name}: ${category.description}`, margin, yPosition);
			yPosition += 10;
			doc.setDrawColor(200, 200, 200);
			doc.line(margin, yPosition, pageWidth - margin, yPosition);
			yPosition += 15;
		}

		// Helper function to add data table
		function addDataTable(data: any[], excludeFields: string[] = ['id', 'user_id', 'created_at', 'updated_at', 'person_type']) {
			if (!data || data.length === 0) {
				doc.setFontSize(10);
				doc.setFont('helvetica', 'italic');
				doc.setTextColor(150, 150, 150);
				doc.text('No data provided', margin + 5, yPosition);
				yPosition += 15;
				return;
			}

			data.forEach((item, index) => {
				if (index > 0) {
					yPosition += 5;
				}

				checkAddPage(20);

				if (data.length > 1) {
					doc.setFontSize(11);
					doc.setFont('helvetica', 'bold');
					doc.setTextColor(80, 80, 80);
					doc.text(`Entry ${index + 1}:`, margin + 5, yPosition);
					yPosition += 8;
				}

				const tableData: any[] = [];
				Object.keys(item).forEach(key => {
					if (!excludeFields.includes(key)) {
						tableData.push([getFieldLabel(key), formatFieldValue(item[key])]);
					}
				});

				if (tableData.length > 0) {
					autoTable(doc, {
						startY: yPosition,
						head: [['Field', 'Value']],
						body: tableData,
						theme: 'grid',
						headStyles: {
							fillColor: [52, 73, 94],
							textColor: [255, 255, 255],
							fontStyle: 'bold',
							fontSize: 10
						},
						bodyStyles: {
							fontSize: 9,
							cellPadding: 3
						},
						alternateRowStyles: {
							fillColor: [249, 249, 249]
						},
						columnStyles: {
							0: { cellWidth: 60, fontStyle: 'bold' },
							1: { cellWidth: contentWidth - 60 }
						},
						margin: { left: margin, right: margin },
						didDrawPage: (data) => {
							// Update yPosition after table
							yPosition = (data.cursor?.y || yPosition) + 10;
						}
					});

					// Get final Y position after table
					yPosition = (doc as any).lastAutoTable.finalY + 10;
				}
			});
		}

		// Export data by journey category
		for (const category of JOURNEY_CATEGORIES) {
			addJourneyCategoryHeader(category);

			const sectionsInCategory = SECTIONS.filter(s => s.category === category.id);

			for (const section of sectionsInCategory) {
				addSectionHeader(section.name, category.color);

				// Map section IDs to data
				switch (section.id) {
					case 'personal':
						addDataTable(exportData.data.personalInfo);
						break;
					case 'credentials':
						addDataTable(exportData.data.credentials);
						break;
					case 'pets':
						addDataTable(exportData.data.pets);
						break;
					case 'contacts':
						addDataTable(exportData.data.keyContacts);
						break;
					case 'medical':
						addDataTable(exportData.data.medicalInfo);
						if (exportData.data.physicians && exportData.data.physicians.length > 0) {
							yPosition += 5;
							doc.setFontSize(12);
							doc.setFont('helvetica', 'bold');
							doc.text('Physicians:', margin + 5, yPosition);
							yPosition += 8;
							addDataTable(exportData.data.physicians, ['id', 'user_id', 'medical_info_id']);
						}
						break;
					case 'employment':
						addDataTable(exportData.data.employment);
						break;
					case 'residence':
						addDataTable(exportData.data.primaryResidence);
						break;
					case 'property':
						addDataTable(exportData.data.vehicles);
						break;
					case 'insurance':
						addDataTable(exportData.data.insurance);
						break;
					case 'financial':
						addDataTable(exportData.data.bankAccounts);
						break;
					case 'legal':
						addDataTable(exportData.data.legalDocuments);
						break;
					case 'final-days':
						addDataTable(exportData.data.finalDays);
						break;
					case 'obituary':
						addDataTable(exportData.data.obituary);
						break;
					case 'after-death':
						addDataTable(exportData.data.afterDeath);
						break;
					case 'funeral':
						addDataTable(exportData.data.funeral);
						break;
					default:
						doc.setFontSize(10);
						doc.setFont('helvetica', 'italic');
						doc.setTextColor(150, 150, 150);
						doc.text('Section not yet implemented', margin + 5, yPosition);
						yPosition += 15;
				}
			}
		}

		// Add page numbers to all pages except the first (title page)
		const totalPages = doc.getNumberOfPages();
		for (let i = 2; i <= totalPages; i++) {
			doc.setPage(i);
			doc.setFontSize(9);
			doc.setFont('helvetica', 'normal');
			doc.setTextColor(150, 150, 150);
			doc.text(
				`Page ${i - 1} of ${totalPages - 1}`,
				pageWidth / 2,
				pageHeight - 10,
				{ align: 'center' }
			);
		}

		// Save the PDF
		const filename = `wrap-it-up-${exportData.user.username}-${new Date().toISOString().split('T')[0]}.pdf`;
		doc.save(filename);

		return { success: true, filename };
	} catch (error) {
		console.error('Error generating PDF:', error);
		return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
	}
}
