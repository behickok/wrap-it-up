<script>
	import { enhance } from '$app/forms';
	import { SECTIONS } from '$lib/types';
	import FormField from '$lib/components/FormField.svelte';
	import AskAI from '$lib/components/AskAI.svelte';

	let { data, form } = $props();

	const section = $derived(SECTIONS.find(s => s.id === data.slug));
	const sectionData = $derived(data.sectionData || {});

	let formData = $state({ ...sectionData });
	let saving = $state(false);
</script>

<div class="section-page">
	<div class="section-header">
		<div>
			<a href="/" class="back-link">← Back to Dashboard</a>
			<h1>{section?.name || 'Section'}</h1>
		</div>
		<AskAI sectionName={section?.name || ''} />
	</div>

	{#if form?.success}
		<div class="success-message">
			✓ Your information has been saved successfully!
		</div>
	{/if}

	{#if form?.error}
		<div class="error-message">
			✗ {form.error}
		</div>
	{/if}

	<form method="POST" action="?/save" use:enhance={() => {
		saving = true;
		return async ({ update }) => {
			await update();
			saving = false;
		};
	}}>
		<div class="form-container">
			{#if data.slug === 'personal'}
				<div class="form-section">
					<h2>Basic Information</h2>
					<div class="form-grid">
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

				<div class="form-section">
					<h2>Contact Information</h2>
					<div class="form-grid">
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

				<div class="form-section">
					<h2>Identification</h2>
					<div class="form-grid">
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

				<div class="form-section">
					<h2>Professional & Affiliations</h2>
					<div class="form-grid">
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

			{:else if data.slug === 'final-days'}
				<div class="form-section">
					<h2>Your Final Days Preferences</h2>
					<p class="section-description">
						Help your loved ones understand how you'd like to spend your final days.
						These are personal preferences that will guide those caring for you.
					</p>

					<div class="form-grid">
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

			{:else if data.slug === 'credentials'}
				<div class="form-section">
					<h2>Usernames & Passwords</h2>
					<p class="section-description">
						Store your important login credentials securely. This helps ensure your loved ones can access important accounts when needed.
					</p>
					<div class="form-grid">
						<FormField
							label="Site Name"
							name="site_name"
							bind:value={formData.site_name}
							placeholder="e.g., Gmail, Bank of America"
						/>
						<FormField
							label="Web Address"
							name="web_address"
							type="url"
							bind:value={formData.web_address}
							placeholder="https://example.com"
						/>
						<FormField
							label="Username"
							name="username"
							bind:value={formData.username}
							placeholder="Your username or email"
						/>
						<FormField
							label="Password"
							name="password"
							bind:value={formData.password}
							placeholder="Your password"
						/>
						<FormField
							label="Other Information"
							name="other_info"
							type="textarea"
							bind:value={formData.other_info}
							placeholder="Security questions, recovery codes, notes"
						/>
					</div>
				</div>

			{:else if data.slug === 'family'}
				<div class="form-section">
					<h2>Family History</h2>
					<p class="section-description">
						Document your family history and relationships to help preserve your legacy.
					</p>
					<div class="form-grid">
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

			{:else if data.slug === 'pets'}
				<div class="form-section">
					<h2>Pet Information</h2>
					<p class="section-description">
						Record information about your pets to ensure they're properly cared for.
					</p>
					<div class="form-grid">
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

			{:else if data.slug === 'contacts'}
				<div class="form-section">
					<h2>Key Contacts</h2>
					<p class="section-description">
						List important people in your life who should be contacted or who can help with various matters.
					</p>
					<div class="form-grid">
						<FormField
							label="Relationship"
							name="relationship"
							bind:value={formData.relationship}
							placeholder="e.g., Attorney, Executor, Close Friend"
						/>
						<FormField
							label="Name"
							name="name"
							bind:value={formData.name}
							placeholder="Full name"
						/>
						<FormField
							label="Phone"
							name="phone"
							type="tel"
							bind:value={formData.phone}
						/>
						<FormField
							label="Email"
							name="email"
							type="email"
							bind:value={formData.email}
						/>
						<FormField
							label="Address"
							name="address"
							type="textarea"
							bind:value={formData.address}
							placeholder="Full address"
						/>
						<FormField
							label="Date of Birth"
							name="date_of_birth"
							type="date"
							bind:value={formData.date_of_birth}
						/>
					</div>
				</div>

			{:else if data.slug === 'medical'}
				<div class="form-section">
					<h2>Medical Information</h2>
					<p class="section-description">
						Your medical information to help healthcare providers and loved ones.
					</p>
					<div class="form-grid">
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

				<div class="form-section">
					<h2>Physician Information</h2>
					<div class="form-grid">
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

			{:else if data.slug === 'employment'}
				<div class="form-section">
					<h2>Employment Information</h2>
					<p class="section-description">
						Document your current and past employment history.
					</p>
					<div class="form-grid">
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

			{:else if data.slug === 'residence'}
				<div class="form-section">
					<h2>Primary Residence</h2>
					<p class="section-description">
						Information about your home and related services.
					</p>
					<div class="form-grid">
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

			{:else if data.slug === 'property'}
				<div class="form-section">
					<h2>Vehicles & Property</h2>
					<p class="section-description">
						Document your vehicles and other significant property.
					</p>
					<div class="form-grid">
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

			{:else if data.slug === 'insurance'}
				<div class="form-section">
					<h2>Insurance Policies</h2>
					<p class="section-description">
						Document all your insurance policies (life, health, auto, home, etc.).
					</p>
					<div class="form-grid">
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

			{:else if data.slug === 'financial'}
				<div class="form-section">
					<h2>Financial Accounts</h2>
					<p class="section-description">
						Document your bank accounts, investments, and other financial assets.
					</p>
					<div class="form-grid">
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

			{:else if data.slug === 'legal'}
				<div class="form-section">
					<h2>Legal Documents</h2>
					<p class="section-description">
						Track important legal documents like wills, trusts, power of attorney, etc.
					</p>
					<div class="form-grid">
						<FormField
							label="Document Type"
							name="document_type"
							type="select"
							bind:value={formData.document_type}
							options={['Will', 'Trust', 'Power of Attorney', 'Healthcare Directive', 'Living Will', 'Deed', 'Birth Certificate', 'Marriage Certificate', 'Divorce Decree', 'Other']}
						/>
						<FormField
							label="Location"
							name="location"
							type="textarea"
							bind:value={formData.location}
							placeholder="Where the document is stored"
						/>
						<FormField
							label="Attorney Name"
							name="attorney_name"
							bind:value={formData.attorney_name}
						/>
						<FormField
							label="Attorney Contact"
							name="attorney_contact"
							bind:value={formData.attorney_contact}
							placeholder="Phone or email"
						/>
						<FormField
							label="Notes"
							name="notes"
							type="textarea"
							bind:value={formData.notes}
							placeholder="Additional details or instructions"
							rows={4}
						/>
					</div>
				</div>

			{:else if data.slug === 'obituary'}
				<div class="form-section">
					<h2>Obituary Planning</h2>
					<p class="section-description">
						Plan your obituary to ensure your life story is told the way you want.
					</p>
					<div class="form-grid">
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

			{:else if data.slug === 'after-death'}
				<div class="form-section">
					<h2>After Death Arrangements</h2>
					<p class="section-description">
						Your preferences for what happens after your passing.
					</p>
					<div class="form-grid">
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

			{:else if data.slug === 'funeral'}
				<div class="form-section">
					<h2>Funeral & Celebration of Life</h2>
					<p class="section-description">
						Plan your funeral service or celebration of life the way you envision it.
					</p>
					<div class="form-grid">
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

			{:else if data.slug === 'conclusion'}
				<div class="form-section">
					<h2>Final Thoughts & Reflections</h2>
					<p class="section-description">
						Share any final thoughts, reflections, or additional information you'd like to document.
					</p>
					<div class="form-grid">
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
				<div class="form-section">
					<p class="coming-soon">
						The form for the {section?.name} section is coming soon.
						We're building out all 17 sections to help you organize your important information.
					</p>
				</div>
			{/if}
		</div>

		<div class="form-actions">
			<button type="submit" class="save-button" disabled={saving}>
				{#if saving}
					Saving...
				{:else}
					Save Progress
				{/if}
			</button>
			<a href="/" class="cancel-button">Cancel</a>
		</div>
	</form>
</div>

<style>
	.section-page {
		max-width: 900px;
		margin: 0 auto;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.back-link {
		display: inline-block;
		color: #667eea;
		text-decoration: none;
		margin-bottom: 0.5rem;
		font-size: 0.95rem;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	h1 {
		margin: 0;
		color: #2d3748;
		font-size: 2rem;
	}

	.success-message {
		background: #c6f6d5;
		color: #22543d;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		font-weight: 500;
	}

	.error-message {
		background: #fed7d7;
		color: #742a2a;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		font-weight: 500;
	}

	.form-container {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		margin-bottom: 1.5rem;
	}

	.form-section {
		margin-bottom: 2.5rem;
	}

	.form-section:last-child {
		margin-bottom: 0;
	}

	.form-section h2 {
		margin: 0 0 1rem 0;
		color: #2d3748;
		font-size: 1.4rem;
		padding-bottom: 0.75rem;
		border-bottom: 2px solid #e2e8f0;
	}

	.section-description {
		color: #4a5568;
		line-height: 1.6;
		margin-bottom: 1.5rem;
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
	}

	@media (min-width: 768px) {
		.form-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
	}

	.save-button {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		padding: 0.75rem 2rem;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.save-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
	}

	.save-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.cancel-button {
		background: white;
		color: #4a5568;
		border: 1px solid #cbd5e0;
		padding: 0.75rem 2rem;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 500;
		text-decoration: none;
		display: inline-block;
		transition: background 0.2s;
	}

	.cancel-button:hover {
		background: #f7fafc;
	}

	.coming-soon {
		text-align: center;
		padding: 3rem;
		color: #718096;
		font-size: 1.1rem;
	}

	@media (max-width: 768px) {
		.section-header {
			flex-direction: column;
		}

		.form-actions {
			flex-direction: column;
		}

		.save-button,
		.cancel-button {
			width: 100%;
			text-align: center;
		}
	}
</style>
