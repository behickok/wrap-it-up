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
