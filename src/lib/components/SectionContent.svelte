<script lang="ts">
	import { enhance } from '$app/forms';
	import { SECTIONS } from '$lib/types';
	import FormField from '$lib/components/FormField.svelte';
	import AskAI from '$lib/components/AskAI.svelte';
	import CredentialsList from '$lib/components/CredentialsList.svelte';
	import LegalDocumentsList from '$lib/components/LegalDocumentsList.svelte';
	import ContactsList from '$lib/components/ContactsList.svelte';

	let { sectionId, data }: { sectionId: string; data: any } = $props();

	const section = $derived(SECTIONS.find((s) => s.id === sectionId));
	const sectionData = $derived(data?.sectionData?.[sectionId] || data?.sectionData || {});
	const userId = $derived(data?.userId || data?.user?.id);
	const standaloneSections = ['credentials', 'contacts', 'legal'];
	const isStandaloneSection = $derived(standaloneSections.includes(sectionId));

	let formData = $state({ ...sectionData });
	let saving = $state(false);

	function getCategoryColor(category: string): string {
		const colors: Record<string, string> = {
			plan: 'var(--color-plan)',
			care: 'var(--color-care)',
			connect: 'var(--color-connect)',
			support: 'var(--color-support)',
			legacy: 'var(--color-legacy)'
		};
		return colors[category] || 'var(--color-primary)';
	}
</script>

<div class="section-content-container">
	<div class="flex justify-between items-start mb-6 gap-4">
		<div class="flex-1">
			<h2 class="text-3xl font-bold text-foreground mb-2">{section?.name || 'Section'}</h2>
		</div>
		<AskAI sectionName={section?.name || ''} />
	</div>

	{#if isStandaloneSection}
		<div class="card shadow-xl p-8 mb-6" style="background-color: var(--color-card);">
			{#if sectionId === 'credentials'}
				<CredentialsList credentials={Array.isArray(sectionData) ? sectionData : []} {userId} />

			{:else if sectionId === 'contacts'}
				<ContactsList contacts={Array.isArray(sectionData) ? sectionData : []} {userId} />

			{:else if sectionId === 'legal'}
				<LegalDocumentsList documents={Array.isArray(sectionData) ? sectionData : []} {userId} />
			{/if}
		</div>
	{:else}
		<form method="POST" action="/section/{sectionId}?/save">
			<div class="card shadow-xl p-8 mb-6" style="background-color: var(--color-card);">
				{#if sectionId === 'personal'}
				<div class="mb-10">
					<h3 class="text-2xl font-semibold text-foreground mb-4 pb-3 border-b-2 border-border">
						Basic Information
					</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormField
							label="Legal Name"
							name="legal_name"
							bind:value={formData.legal_name}
							placeholder="Enter your full legal name"
						/>
						<FormField
							label="Maiden Name"
							name="maiden_name"
							bind:value={formData.maiden_name}
							placeholder="If applicable"
						/>
						<FormField
							label="Date of Birth"
							name="date_of_birth"
							type="date"
							bind:value={formData.date_of_birth}
						/>
						<FormField
							label="Place of Birth"
							name="place_of_birth"
							bind:value={formData.place_of_birth}
							placeholder="City, State, Country"
						/>
					</div>
				</div>

				<div class="mb-10">
					<h3 class="text-2xl font-semibold text-foreground mb-4 pb-3 border-b-2 border-border">
						Contact Information
					</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormField
							label="Address"
							name="address"
							type="textarea"
							bind:value={formData.address}
							placeholder="Full mailing address"
						/>
						<FormField
							label="P.O. Box Number"
							name="po_box_number"
							bind:value={formData.po_box_number}
						/>
						<FormField
							label="Home Phone"
							name="home_phone"
							type="tel"
							bind:value={formData.home_phone}
						/>
						<FormField
							label="Mobile Phone"
							name="mobile_phone"
							type="tel"
							bind:value={formData.mobile_phone}
						/>
						<FormField
							label="Email"
							name="email"
							type="email"
							bind:value={formData.email}
						/>
					</div>
				</div>

				<div class="mb-10">
					<h3 class="text-2xl font-semibold text-foreground mb-4 pb-3 border-b-2 border-border">
						Identification
					</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormField
							label="Driver's License Number"
							name="drivers_license"
							bind:value={formData.drivers_license}
						/>
						<FormField
							label="Social Security / Green Card Number"
							name="ssn_or_green_card"
							bind:value={formData.ssn_or_green_card}
						/>
						<FormField
							label="Passport Number"
							name="passport_number"
							bind:value={formData.passport_number}
						/>
					</div>
				</div>

				<div class="mb-10">
					<h3 class="text-2xl font-semibold text-foreground mb-4 pb-3 border-b-2 border-border">
						Professional & Affiliations
					</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormField
							label="Occupation"
							name="occupation"
							bind:value={formData.occupation}
						/>
						<FormField
							label="Employer"
							name="employer"
							bind:value={formData.employer}
						/>
						<FormField
							label="Military Service"
							name="military_service"
							type="textarea"
							bind:value={formData.military_service}
							placeholder="Branch, rank, years of service"
						/>
						<FormField
							label="Church Affiliation"
							name="church_affiliation"
							bind:value={formData.church_affiliation}
						/>
						<FormField
							label="Education"
							name="education"
							type="textarea"
							bind:value={formData.education}
							placeholder="Degrees, institutions, years"
						/>
					</div>
				</div>

			{:else if sectionId === 'final-days'}
				<div class="mb-10">
					<h3 class="text-2xl font-semibold text-foreground mb-4 pb-3 border-b-2 border-border">
						Your Final Days Preferences
					</h3>
					<p class="text-muted-foreground leading-relaxed mb-6">
						Help your loved ones understand how you'd like to spend your final days.
						These are personal preferences that will guide those caring for you.
					</p>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormField
							label="Who do you want around you?"
							name="who_around"
							type="textarea"
							bind:value={formData.who_around}
							placeholder="Names of family members, friends, or others you'd like present"
						/>
						<FormField
							label="What is your favorite food/drink?"
							name="favorite_food_drink"
							type="textarea"
							bind:value={formData.favorite_food_drink}
							placeholder="Comfort foods, beverages, special treats"
						/>
						<FormField
							label="What type of music do you want playing?"
							name="music_type"
							type="textarea"
							bind:value={formData.music_type}
							placeholder="Artists, genres, specific songs or playlists"
						/>
						<FormField
							label="Do you want flowers?"
							name="flowers_preference"
							type="select"
							bind:value={formData.flowers_preference}
							options={['Yes', 'No', 'No preference']}
						/>
						{#if formData.flowers_preference === 'Yes'}
							<FormField
								label="What kind of flowers?"
								name="flower_types"
								type="textarea"
								bind:value={formData.flower_types}
								placeholder="Specific flowers, colors, arrangements"
							/>
						{/if}
						<FormField
							label="Do you like aromatic smells?"
							name="aromatic_smells"
							type="select"
							bind:value={formData.aromatic_smells}
							options={['Yes', 'No', 'No preference']}
						/>
						{#if formData.aromatic_smells === 'Yes'}
							<FormField
								label="What kind of scents?"
								name="smell_types"
								type="textarea"
								bind:value={formData.smell_types}
								placeholder="Candles, essential oils, incense, etc."
							/>
						{/if}
						<FormField
							label="Love Letter"
							name="love_letter"
							type="textarea"
							bind:value={formData.love_letter}
							placeholder="A message to your loved ones..."
							rows={8}
						/>
						<FormField
							label="Organ Donation / Anatomical Gift Information"
							name="organ_donation_info"
							type="textarea"
							bind:value={formData.organ_donation_info}
							placeholder="Your wishes regarding organ donation"
						/>
					</div>
				</div>

			{:else if sectionId === 'family'}
				<div class="mb-10">
					<h3 class="text-2xl font-semibold text-foreground mb-4 pb-3 border-b-2 border-border">
						Family History
					</h3>
					<p class="text-muted-foreground leading-relaxed mb-6">
						Document your family history and relationships to help preserve your legacy.
					</p>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormField
							label="Parents' Names"
							name="parents_names"
							type="textarea"
							bind:value={formData.parents_names}
							placeholder="Full names of your parents"
						/>
						<FormField
							label="Siblings' Names"
							name="siblings_names"
							type="textarea"
							bind:value={formData.siblings_names}
							placeholder="Names and details about your siblings"
						/>
						<FormField
							label="Children's Names"
							name="children_names"
							type="textarea"
							bind:value={formData.children_names}
							placeholder="Names and details about your children"
						/>
						<FormField
							label="Grandchildren's Names"
							name="grandchildren_names"
							type="textarea"
							bind:value={formData.grandchildren_names}
							placeholder="Names and details about your grandchildren"
						/>
						<FormField
							label="Spouse Information"
							name="spouse_info"
							type="textarea"
							bind:value={formData.spouse_info}
							placeholder="Current or former spouse(s)"
						/>
						<FormField
							label="Family Stories & Traditions"
							name="family_stories"
							type="textarea"
							bind:value={formData.family_stories}
							placeholder="Important family stories, traditions, or history"
							rows={6}
						/>
					</div>
				</div>

			{:else if sectionId === 'pets'}
				<div class="mb-10">
					<h3 class="text-2xl font-semibold text-foreground mb-4 pb-3 border-b-2 border-border">
						Pet Information
					</h3>
					<p class="text-muted-foreground leading-relaxed mb-6">
						Record information about your pets to ensure they're properly cared for.
					</p>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormField
							label="Pet Name"
							name="name"
							bind:value={formData.name}
							placeholder="Your pet's name"
						/>
						<FormField
							label="Breed"
							name="breed"
							bind:value={formData.breed}
							placeholder="Breed or type"
						/>
						<FormField
							label="Date of Birth"
							name="date_of_birth"
							type="date"
							bind:value={formData.date_of_birth}
						/>
						<FormField
							label="License/Chip Information"
							name="license_chip_info"
							bind:value={formData.license_chip_info}
							placeholder="License number, microchip ID"
						/>
						<FormField
							label="Medications"
							name="medications"
							type="textarea"
							bind:value={formData.medications}
							placeholder="Current medications and dosages"
						/>
						<FormField
							label="Veterinarian Name"
							name="veterinarian"
							bind:value={formData.veterinarian}
							placeholder="Vet's name and practice"
						/>
						<FormField
							label="Vet Phone"
							name="vet_phone"
							type="tel"
							bind:value={formData.vet_phone}
						/>
						<FormField
							label="Pet Insurance Provider"
							name="pet_insurance"
							bind:value={formData.pet_insurance}
						/>
						<FormField
							label="Policy Number"
							name="policy_number"
							bind:value={formData.policy_number}
						/>
						<FormField
							label="Other Information"
							name="other_info"
							type="textarea"
							bind:value={formData.other_info}
							placeholder="Feeding schedule, special needs, behaviors"
						/>
					</div>
				</div>

			{:else if sectionId === 'medical'}
				<div class="mb-10">
					<h3 class="text-2xl font-semibold text-foreground mb-4 pb-3 border-b-2 border-border">
						Medical Information
					</h3>
					<p class="text-muted-foreground leading-relaxed mb-6">
						Your medical information to help healthcare providers and loved ones.
					</p>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormField
							label="Full Name"
							name="name"
							bind:value={formData.name}
						/>
						<FormField
							label="Date of Birth"
							name="date_of_birth"
							type="date"
							bind:value={formData.date_of_birth}
						/>
						<FormField
							label="Blood Type"
							name="blood_type"
							bind:value={formData.blood_type}
							placeholder="e.g., O+, A-, AB+"
						/>
						<FormField
							label="Height"
							name="height"
							bind:value={formData.height}
							placeholder="e.g., 5'10&quot;"
						/>
						<FormField
							label="Weight"
							name="weight"
							bind:value={formData.weight}
							placeholder="e.g., 170 lbs"
						/>
						<FormField
							label="Sex"
							name="sex"
							type="select"
							bind:value={formData.sex}
							options={['Male', 'Female', 'Other']}
						/>
						<FormField
							label="Medical Conditions"
							name="medical_conditions"
							type="textarea"
							bind:value={formData.medical_conditions}
							placeholder="List any chronic conditions, diagnoses"
							rows={4}
						/>
						<FormField
							label="Allergies"
							name="allergies"
							type="textarea"
							bind:value={formData.allergies}
							placeholder="Medications, food, environmental"
						/>
						<FormField
							label="Preferred Hospital"
							name="preferred_hospital"
							bind:value={formData.preferred_hospital}
							placeholder="Name and location"
						/>
						<FormField
							label="Preferred Pharmacy"
							name="preferred_pharmacy"
							bind:value={formData.preferred_pharmacy}
							placeholder="Name and location"
						/>
					</div>
				</div>

				<div class="mb-10">
					<h3 class="text-2xl font-semibold text-foreground mb-4 pb-3 border-b-2 border-border">
						Physician Information
					</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormField
							label="Physician Name"
							name="physician_name"
							bind:value={formData.physician_name}
						/>
						<FormField
							label="Specialty"
							name="specialty"
							bind:value={formData.specialty}
							placeholder="e.g., Primary Care, Cardiologist"
						/>
						<FormField
							label="Phone"
							name="physician_phone"
							type="tel"
							bind:value={formData.physician_phone}
						/>
						<FormField
							label="Address"
							name="physician_address"
							type="textarea"
							bind:value={formData.physician_address}
						/>
					</div>
				</div>

			{:else if sectionId === 'employment'}
				<div class="mb-10">
					<h3 class="text-2xl font-semibold text-foreground mb-4 pb-3 border-b-2 border-border">
						Employment Information
					</h3>
					<p class="text-muted-foreground leading-relaxed mb-6">
						Document your current and past employment history.
					</p>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormField
							label="Employer Name"
							name="employer_name"
							bind:value={formData.employer_name}
						/>
						<FormField
							label="Position/Title"
							name="position"
							bind:value={formData.position}
						/>
						<FormField
							label="Hire Date"
							name="hire_date"
							type="date"
							bind:value={formData.hire_date}
						/>
						<FormField
							label="Current Employment"
							name="is_current"
							type="select"
							bind:value={formData.is_current}
							options={['Yes', 'No']}
						/>
						<FormField
							label="Address"
							name="address"
							type="textarea"
							bind:value={formData.address}
							placeholder="Company address"
						/>
						<FormField
							label="Phone"
							name="phone"
							type="tel"
							bind:value={formData.phone}
						/>
						<FormField
							label="Supervisor Name"
							name="supervisor"
							bind:value={formData.supervisor}
						/>
						<FormField
							label="Supervisor Contact"
							name="supervisor_contact"
							bind:value={formData.supervisor_contact}
							placeholder="Phone or email"
						/>
					</div>
				</div>

			{:else if sectionId === 'residence'}
				<div class="mb-10">
					<h3 class="text-2xl font-semibold text-foreground mb-4 pb-3 border-b-2 border-border">
						Primary Residence
					</h3>
					<p class="text-muted-foreground leading-relaxed mb-6">
						Information about your home and related services.
					</p>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormField
							label="Address"
							name="address"
							type="textarea"
							bind:value={formData.address}
							placeholder="Full address"
						/>
						<FormField
							label="Own or Rent"
							name="own_or_rent"
							type="select"
							bind:value={formData.own_or_rent}
							options={['Own', 'Rent']}
						/>
						<FormField
							label="Mortgage/Lease Information"
							name="mortgage_lease_info"
							type="textarea"
							bind:value={formData.mortgage_lease_info}
							placeholder="Lender/landlord name, account number"
						/>
						<FormField
							label="Balance Owed"
							name="balance"
							type="number"
							bind:value={formData.balance}
							placeholder="0.00"
						/>
						<FormField
							label="Estimated Value"
							name="value"
							type="number"
							bind:value={formData.value}
							placeholder="0.00"
						/>
						<FormField
							label="Lien Information"
							name="lien_info"
							type="textarea"
							bind:value={formData.lien_info}
							placeholder="Any liens or encumbrances"
						/>
						<FormField
							label="Gas Company"
							name="gas_company"
							bind:value={formData.gas_company}
						/>
						<FormField
							label="Electric Company"
							name="electric_company"
							bind:value={formData.electric_company}
						/>
						<FormField
							label="Water Company"
							name="water_company"
							bind:value={formData.water_company}
						/>
						<FormField
							label="Internet Company"
							name="internet_company"
							bind:value={formData.internet_company}
						/>
						<FormField
							label="Waste Company"
							name="waste_company"
							bind:value={formData.waste_company}
						/>
						<FormField
							label="Recycle Company"
							name="recycle_company"
							bind:value={formData.recycle_company}
						/>
						<FormField
							label="HOA Contact Name"
							name="hoa_contact_name"
							bind:value={formData.hoa_contact_name}
						/>
						<FormField
							label="HOA Contact Phone"
							name="hoa_contact_phone"
							type="tel"
							bind:value={formData.hoa_contact_phone}
						/>
						<FormField
							label="HOA Dues"
							name="hoa_dues"
							type="number"
							bind:value={formData.hoa_dues}
							placeholder="Monthly/annual amount"
						/>
					</div>
				</div>

			{:else if sectionId === 'property'}
				<div class="mb-10">
					<h3 class="text-2xl font-semibold text-foreground mb-4 pb-3 border-b-2 border-border">
						Vehicles & Property
					</h3>
					<p class="text-muted-foreground leading-relaxed mb-6">
						Document your vehicles and other significant property.
					</p>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormField
							label="Names on Title"
							name="names_on_title"
							bind:value={formData.names_on_title}
							placeholder="Owner name(s)"
						/>
						<FormField
							label="Make"
							name="make"
							bind:value={formData.make}
							placeholder="e.g., Toyota, Ford"
						/>
						<FormField
							label="Model"
							name="model"
							bind:value={formData.model}
							placeholder="e.g., Camry, F-150"
						/>
						<FormField
							label="Year"
							name="year"
							type="number"
							bind:value={formData.year}
						/>
						<FormField
							label="VIN"
							name="vin"
							bind:value={formData.vin}
							placeholder="Vehicle Identification Number"
						/>
						<FormField
							label="Registration Dates"
							name="registration_dates"
							bind:value={formData.registration_dates}
							placeholder="When registration expires"
						/>
						<FormField
							label="Title Location"
							name="title_location"
							type="textarea"
							bind:value={formData.title_location}
							placeholder="Where the title is kept"
						/>
					</div>
				</div>

			{:else if sectionId === 'insurance'}
				<div class="mb-10">
					<h3 class="text-2xl font-semibold text-foreground mb-4 pb-3 border-b-2 border-border">
						Insurance Policies
					</h3>
					<p class="text-muted-foreground leading-relaxed mb-6">
						Document all your insurance policies (life, health, auto, home, etc.).
					</p>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormField
							label="Insurance Type"
							name="insurance_type"
							type="select"
							bind:value={formData.insurance_type}
							options={['Life', 'Health', 'Auto', 'Home', 'Disability', 'Long-term Care', 'Other']}
						/>
						<FormField
							label="Provider"
							name="provider"
							bind:value={formData.provider}
							placeholder="Insurance company name"
						/>
						<FormField
							label="Policy Number"
							name="policy_number"
							bind:value={formData.policy_number}
						/>
						<FormField
							label="Coverage Amount"
							name="coverage_amount"
							type="number"
							bind:value={formData.coverage_amount}
							placeholder="0.00"
						/>
						<FormField
							label="Beneficiary"
							name="beneficiary"
							bind:value={formData.beneficiary}
							placeholder="Primary beneficiary name"
						/>
						<FormField
							label="Agent Name"
							name="agent_name"
							bind:value={formData.agent_name}
						/>
						<FormField
							label="Agent Phone"
							name="agent_phone"
							type="tel"
							bind:value={formData.agent_phone}
						/>
						<FormField
							label="Premium Amount"
							name="premium_amount"
							type="number"
							bind:value={formData.premium_amount}
							placeholder="0.00"
						/>
						<FormField
							label="Premium Frequency"
							name="premium_frequency"
							type="select"
							bind:value={formData.premium_frequency}
							options={['Monthly', 'Quarterly', 'Semi-Annual', 'Annual']}
						/>
					</div>
				</div>

			{:else if sectionId === 'financial'}
				<div class="mb-10">
					<h3 class="text-2xl font-semibold text-foreground mb-4 pb-3 border-b-2 border-border">
						Financial Accounts
					</h3>
					<p class="text-muted-foreground leading-relaxed mb-6">
						Document your bank accounts, investments, and other financial assets.
					</p>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormField
							label="Institution Name"
							name="institution_name"
							bind:value={formData.institution_name}
							placeholder="Bank or financial institution"
						/>
						<FormField
							label="Account Type"
							name="account_type"
							type="select"
							bind:value={formData.account_type}
							options={['Checking', 'Savings', 'Investment', 'Retirement (401k)', 'Retirement (IRA)', 'CD', 'Money Market', 'Other']}
						/>
						<FormField
							label="Account Number"
							name="account_number"
							bind:value={formData.account_number}
							placeholder="Last 4 digits or full number"
						/>
						<FormField
							label="Routing Number"
							name="routing_number"
							bind:value={formData.routing_number}
						/>
						<FormField
							label="Approximate Balance"
							name="balance"
							type="number"
							bind:value={formData.balance}
							placeholder="0.00"
						/>
					</div>
				</div>

			{:else if sectionId === 'obituary'}
				<div class="mb-10">
					<h3 class="text-2xl font-semibold text-foreground mb-4 pb-3 border-b-2 border-border">
						Obituary Planning
					</h3>
					<p class="text-muted-foreground leading-relaxed mb-6">
						Plan your obituary to ensure your life story is told the way you want.
					</p>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormField
							label="Online or Newspaper"
							name="online_or_newspaper"
							type="select"
							bind:value={formData.online_or_newspaper}
							options={['Online', 'Newspaper', 'Both']}
						/>
						<FormField
							label="Contact Name"
							name="contact_name"
							bind:value={formData.contact_name}
							placeholder="Publication or service contact"
						/>
						<FormField
							label="Contact Phone"
							name="contact_phone"
							type="tel"
							bind:value={formData.contact_phone}
						/>
						<FormField
							label="Contact Email"
							name="contact_email"
							type="email"
							bind:value={formData.contact_email}
						/>
						<FormField
							label="Publication Date Preference"
							name="publication_date"
							type="date"
							bind:value={formData.publication_date}
						/>
						<FormField
							label="Estimated Cost"
							name="cost"
							type="number"
							bind:value={formData.cost}
							placeholder="0.00"
						/>
						<FormField
							label="Obituary Text"
							name="obituary_text"
							type="textarea"
							bind:value={formData.obituary_text}
							placeholder="Write your obituary or key points you want included..."
							rows={8}
						/>
					</div>
				</div>

			{:else if sectionId === 'after-death'}
				<div class="mb-10">
					<h3 class="text-2xl font-semibold text-foreground mb-4 pb-3 border-b-2 border-border">
						After Death Arrangements
					</h3>
					<p class="text-muted-foreground leading-relaxed mb-6">
						Your preferences for what happens after your passing.
					</p>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormField
							label="Primary Contact Name"
							name="contact_name"
							bind:value={formData.contact_name}
							placeholder="Person to handle arrangements"
						/>
						<FormField
							label="Contact Phone"
							name="contact_phone"
							type="tel"
							bind:value={formData.contact_phone}
						/>
						<FormField
							label="Contact Address"
							name="contact_address"
							type="textarea"
							bind:value={formData.contact_address}
						/>
						<FormField
							label="Contact Email"
							name="contact_email"
							type="email"
							bind:value={formData.contact_email}
						/>
						<FormField
							label="Body Disposal Preference"
							name="body_disposal_preference"
							type="select"
							bind:value={formData.body_disposal_preference}
							options={['Burial', 'Cremation', 'Donation to Science', 'Other']}
						/>
						<FormField
							label="Transfer Service"
							name="transfer_service"
							bind:value={formData.transfer_service}
							placeholder="Funeral home or service to transport body"
						/>
						<FormField
							label="Embalming Preference"
							name="embalming_preference"
							type="select"
							bind:value={formData.embalming_preference}
							options={['Yes', 'No', 'No preference']}
						/>
						<FormField
							label="Burial Outfit"
							name="burial_outfit"
							type="textarea"
							bind:value={formData.burial_outfit}
							placeholder="What you'd like to wear"
						/>
						<FormField
							label="Organ Donation"
							name="organ_donation"
							type="select"
							bind:value={formData.organ_donation}
							options={['Yes', 'No', 'Undecided']}
						/>
						<FormField
							label="Burial Timing"
							name="burial_timing"
							bind:value={formData.burial_timing}
							placeholder="e.g., Within 3 days, 1 week"
						/>
						<FormField
							label="Burial Type"
							name="burial_type"
							type="select"
							bind:value={formData.burial_type}
							options={['Ground burial', 'Mausoleum', 'Cremation burial', 'Cremation scattering', 'Other']}
						/>
						<FormField
							label="Container Type"
							name="container_type"
							bind:value={formData.container_type}
							placeholder="Casket, urn, shroud, etc."
						/>
						<FormField
							label="Items to be Buried With"
							name="items_buried_with"
							type="textarea"
							bind:value={formData.items_buried_with}
							placeholder="Jewelry, photos, letters, etc."
						/>
						<FormField
							label="Ash Scatter Location"
							name="ash_scatter_location"
							type="textarea"
							bind:value={formData.ash_scatter_location}
							placeholder="If cremated, where ashes should go"
						/>
						<FormField
							label="Memorial Organization"
							name="memorial_organization"
							bind:value={formData.memorial_organization}
							placeholder="Charity for memorial donations"
						/>
						<FormField
							label="Flowers Location"
							name="flowers_location"
							bind:value={formData.flowers_location}
							placeholder="Where flowers should go after service"
						/>
						<FormField
							label="Visitation Timing"
							name="visitation_timing"
							bind:value={formData.visitation_timing}
							placeholder="Before or after funeral"
						/>
						<FormField
							label="Visitation Time"
							name="visitation_time"
							bind:value={formData.visitation_time}
							placeholder="Duration preference"
						/>
						<FormField
							label="Casket Open/Closed"
							name="casket_open_closed"
							type="select"
							bind:value={formData.casket_open_closed}
							options={['Open', 'Closed', 'Family only', 'No preference']}
						/>
					</div>
				</div>

			{:else if sectionId === 'funeral'}
				<div class="mb-10">
					<h3 class="text-2xl font-semibold text-foreground mb-4 pb-3 border-b-2 border-border">
						Funeral & Celebration of Life
					</h3>
					<p class="text-muted-foreground leading-relaxed mb-6">
						Plan your funeral service or celebration of life the way you envision it.
					</p>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormField
							label="Location Name"
							name="location_name"
							bind:value={formData.location_name}
							placeholder="Church, funeral home, venue"
						/>
						<FormField
							label="Location Address"
							name="location_address"
							type="textarea"
							bind:value={formData.location_address}
						/>
						<FormField
							label="Funeral Director Name"
							name="director_name"
							bind:value={formData.director_name}
						/>
						<FormField
							label="Director Contact"
							name="director_contact"
							bind:value={formData.director_contact}
							placeholder="Phone or email"
						/>
						<FormField
							label="Military Honors"
							name="military_honors"
							type="select"
							bind:value={formData.military_honors}
							options={['Yes', 'No']}
						/>
						<FormField
							label="Programs Printed"
							name="programs_printed"
							type="select"
							bind:value={formData.programs_printed}
							options={['Yes', 'No']}
						/>
						<FormField
							label="Pictures Display"
							name="pictures"
							type="select"
							bind:value={formData.pictures}
							options={['Yes', 'No']}
						/>
						<FormField
							label="Slideshow"
							name="slideshow"
							type="select"
							bind:value={formData.slideshow}
							options={['Yes', 'No']}
						/>
						<FormField
							label="Pallbearers"
							name="pallbearers"
							type="textarea"
							bind:value={formData.pallbearers}
							placeholder="Names of pallbearers"
						/>
						<FormField
							label="Order of Service"
							name="order_of_service"
							type="textarea"
							bind:value={formData.order_of_service}
							placeholder="Outline of the service, readings, music, speakers"
							rows={6}
						/>
						<FormField
							label="Pastor/Officiant"
							name="pastor"
							bind:value={formData.pastor}
							placeholder="Name and contact"
						/>
						<FormField
							label="Organist/Musician"
							name="organist"
							bind:value={formData.organist}
							placeholder="Name and contact"
						/>
						<FormField
							label="Celebration Location"
							name="celebration_location"
							type="textarea"
							bind:value={formData.celebration_location}
							placeholder="Reception or gathering after service"
						/>
						<FormField
							label="Celebration Food"
							name="celebration_food"
							type="textarea"
							bind:value={formData.celebration_food}
							placeholder="Food preferences or catering info"
						/>
						<FormField
							label="Final Resting Place"
							name="final_resting_place"
							type="textarea"
							bind:value={formData.final_resting_place}
							placeholder="Cemetery name and plot location"
						/>
						<FormField
							label="Headstone Information"
							name="headstone_info"
							type="textarea"
							bind:value={formData.headstone_info}
							placeholder="Inscription, design preferences"
							rows={4}
						/>
					</div>
				</div>

			{:else if sectionId === 'conclusion'}
				<div class="mb-10">
					<h3 class="text-2xl font-semibold text-foreground mb-4 pb-3 border-b-2 border-border">
						Final Thoughts & Reflections
					</h3>
					<p class="text-muted-foreground leading-relaxed mb-6">
						Share any final thoughts, reflections, or additional information you'd like to document.
					</p>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormField
							label="Life Reflections"
							name="life_reflections"
							type="textarea"
							bind:value={formData.life_reflections}
							placeholder="Thoughts about your life, accomplishments, regrets, wisdom to share..."
							rows={6}
						/>
						<FormField
							label="Advice for Loved Ones"
							name="advice_for_loved_ones"
							type="textarea"
							bind:value={formData.advice_for_loved_ones}
							placeholder="Words of wisdom or guidance for those you leave behind..."
							rows={6}
						/>
						<FormField
							label="Unfinished Business"
							name="unfinished_business"
							type="textarea"
							bind:value={formData.unfinished_business}
							placeholder="Things you wish to complete or have others know about..."
							rows={4}
						/>
						<FormField
							label="Digital Legacy"
							name="digital_legacy"
							type="textarea"
							bind:value={formData.digital_legacy}
							placeholder="Instructions for social media accounts, digital assets, online presence..."
							rows={4}
						/>
						<FormField
							label="Additional Notes"
							name="additional_notes"
							type="textarea"
							bind:value={formData.additional_notes}
							placeholder="Anything else you want to document..."
							rows={6}
						/>
					</div>
				</div>

			{:else}
				<div class="mb-10">
					<p class="text-center py-12 text-muted-foreground text-lg">
						Content for {section?.name} is coming soon to the main dashboard experience.
					</p>
				</div>
			{/if}
			</div>

			<div class="flex gap-4 justify-end">
				<button type="submit" class="btn" style="background-color: var(--color-primary); color: var(--color-primary-foreground);" disabled={saving}>
					{#if saving}
						Saving...
					{:else}
						Save Progress
					{/if}
				</button>
			</div>
		</form>
	{/if}
</div>
