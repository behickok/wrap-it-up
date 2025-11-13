<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Get status badge class
	function getStatusBadgeClass(status: string): string {
		switch (status) {
			case 'pending':
				return 'badge-warning';
			case 'approved':
				return 'badge-success';
			case 'rejected':
				return 'badge-error';
			default:
				return 'badge-ghost';
		}
	}

	// Format date
	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Apply to be a Mentor - Wrap It Up</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-4xl">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-4xl font-bold mb-2">Become a Mentor</h1>
		<p class="text-base-content/70">
			Help guide others through their journeys with expert feedback and support
		</p>
	</div>

	<!-- Already has profile -->
	{#if data.hasProfile}
		<div class="alert alert-success mb-8">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="stroke-current shrink-0 h-6 w-6"
				fill="none"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<div>
				<h3 class="font-bold">You're already a mentor!</h3>
				<div class="text-sm">
					<a href="/mentor/dashboard" class="link">Go to your mentor dashboard →</a>
				</div>
			</div>
		</div>
	{/if}

	<!-- Existing application status -->
	{#if data.existingApplication && !data.hasProfile}
		<div class="card bg-base-100 shadow-xl mb-8">
			<div class="card-body">
				<h2 class="card-title">Your Application Status</h2>

				<div class="flex items-center gap-3 my-4">
					<div class="badge {getStatusBadgeClass(data.existingApplication.status)} badge-lg">
						{data.existingApplication.status.toUpperCase()}
					</div>
					<span class="text-sm text-base-content/70">
						Applied on {formatDate(data.existingApplication.applied_at)}
					</span>
				</div>

				{#if data.existingApplication.status === 'pending'}
					<p class="text-base-content/70">
						Your application is currently under review. We'll notify you once a decision has been
						made. This typically takes 3-5 business days.
					</p>
				{:else if data.existingApplication.status === 'rejected'}
					<div>
						<p class="text-base-content/70 mb-2">
							Unfortunately, your application was not approved at this time.
						</p>
						{#if data.existingApplication.rejection_reason}
							<div class="alert alert-warning">
								<strong>Reason:</strong>
								{data.existingApplication.rejection_reason}
							</div>
						{/if}
						<p class="text-sm text-base-content/60 mt-4">
							You may reapply after 30 days by submitting a new application below.
						</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Only show form if no pending/approved application and no profile -->
	{#if !data.hasProfile && (!data.existingApplication || data.existingApplication.status === 'rejected')}
		<!-- Benefits Section -->
		<div class="card bg-base-100 shadow-xl mb-8">
			<div class="card-body">
				<h2 class="card-title text-2xl mb-4">Why Become a Mentor?</h2>

				<div class="grid md:grid-cols-2 gap-6">
					<div>
						<h3 class="font-bold mb-2 flex items-center gap-2">
							<span class="text-2xl">💰</span>
							Earn Money
						</h3>
						<p class="text-sm text-base-content/70">
							Get paid per review plus revenue share from Guided tier subscriptions
						</p>
					</div>

					<div>
						<h3 class="font-bold mb-2 flex items-center gap-2">
							<span class="text-2xl">🎯</span>
							Flexible Schedule
						</h3>
						<p class="text-sm text-base-content/70">
							Work on your own time, choose your availability, set your own rates
						</p>
					</div>

					<div>
						<h3 class="font-bold mb-2 flex items-center gap-2">
							<span class="text-2xl">🌟</span>
							Make an Impact
						</h3>
						<p class="text-sm text-base-content/70">
							Help people through important life transitions with expert guidance
						</p>
					</div>

					<div>
						<h3 class="font-bold mb-2 flex items-center gap-2">
							<span class="text-2xl">📈</span>
							Build Your Reputation
						</h3>
						<p class="text-sm text-base-content/70">
							Gain ratings and reviews, get featured, attract more clients
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Application Form -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title text-2xl mb-4">Application Form</h2>

				{#if form?.error}
					<div class="alert alert-error mb-4">
						<span>{form.error}</span>
					</div>
				{/if}

				<form method="POST" action="?/submit" use:enhance class="space-y-6">
					<!-- Bio -->
					<div class="form-control">
						<label class="label" for="bio">
							<span class="label-text">Professional Bio *</span>
						</label>
						<textarea
							id="bio"
							name="bio"
							rows="5"
							class="textarea textarea-bordered"
							placeholder="Tell us about your professional background, experience, and what makes you a great mentor..."
							value={form?.bio || ''}
							required
						></textarea>
						<label class="label">
							<span class="label-text-alt">Minimum 100 characters</span>
						</label>
					</div>

					<!-- Expertise -->
					<div class="form-control">
						<label class="label" for="expertise">
							<span class="label-text">Areas of Expertise *</span>
						</label>
						<input
							type="text"
							id="expertise"
							name="expertise"
							class="input input-bordered"
							placeholder="e.g., Estate Planning, Healthcare Navigation, Wedding Planning"
							value={form?.expertise || ''}
							required
						/>
						<label class="label">
							<span class="label-text-alt">Separate multiple areas with commas</span>
						</label>
					</div>

					<!-- Experience Years -->
					<div class="form-control">
						<label class="label" for="experience_years">
							<span class="label-text">Years of Experience *</span>
						</label>
						<input
							type="number"
							id="experience_years"
							name="experience_years"
							class="input input-bordered"
							min="0"
							step="1"
							placeholder="5"
							value={form?.experienceYears || ''}
							required
						/>
					</div>

					<!-- Education -->
					<div class="form-control">
						<label class="label" for="education">
							<span class="label-text">Education</span>
						</label>
						<textarea
							id="education"
							name="education"
							rows="3"
							class="textarea textarea-bordered"
							placeholder="Your educational background (degrees, schools, etc.)"
							value={form?.education || ''}
						></textarea>
					</div>

					<!-- Certifications -->
					<div class="form-control">
						<label class="label" for="certifications">
							<span class="label-text">Certifications & Licenses</span>
						</label>
						<textarea
							id="certifications"
							name="certifications"
							rows="3"
							class="textarea textarea-bordered"
							placeholder="Relevant certifications, licenses, or credentials"
							value={form?.certifications || ''}
						></textarea>
					</div>

					<!-- Why Mentor -->
					<div class="form-control">
						<label class="label" for="why_mentor">
							<span class="label-text">Why do you want to be a mentor? *</span>
						</label>
						<textarea
							id="why_mentor"
							name="why_mentor"
							rows="4"
							class="textarea textarea-bordered"
							placeholder="What motivates you to help others? What do you hope to achieve as a mentor?"
							value={form?.whyMentor || ''}
							required
						></textarea>
						<label class="label">
							<span class="label-text-alt">Minimum 50 characters</span>
						</label>
					</div>

					<!-- Sample Feedback -->
					<div class="form-control">
						<label class="label" for="sample_feedback">
							<span class="label-text">Sample Feedback *</span>
						</label>
						<textarea
							id="sample_feedback"
							name="sample_feedback"
							rows="5"
							class="textarea textarea-bordered"
							placeholder="Provide a sample of how you would give constructive feedback to someone working through a journey section. Show your mentoring style..."
							value={form?.sampleFeedback || ''}
							required
						></textarea>
						<label class="label">
							<span class="label-text-alt">Minimum 100 characters - show us your feedback style</span>
						</label>
					</div>

					<!-- Availability -->
					<div class="form-control">
						<label class="label" for="availability_hours">
							<span class="label-text">Weekly Availability (hours) *</span>
						</label>
						<input
							type="number"
							id="availability_hours"
							name="availability_hours"
							class="input input-bordered"
							min="1"
							max="40"
							step="1"
							placeholder="10"
							value={form?.availabilityHours || ''}
							required
						/>
						<label class="label">
							<span class="label-text-alt">How many hours per week can you dedicate to mentoring?</span>
						</label>
					</div>

					<!-- Hourly Rate -->
					<div class="form-control">
						<label class="label" for="hourly_rate">
							<span class="label-text">Desired Hourly Rate ($) *</span>
						</label>
						<input
							type="number"
							id="hourly_rate"
							name="hourly_rate"
							class="input input-bordered"
							min="0"
							step="1"
							placeholder="50"
							value={form?.hourlyRate || ''}
							required
						/>
						<label class="label">
							<span class="label-text-alt"
								>This is your base rate - actual rates are negotiated per journey</span
							>
						</label>
					</div>

					<!-- Submit -->
					<div class="card-actions justify-end pt-4">
						<button type="submit" class="btn btn-primary btn-lg">Submit Application</button>
					</div>
				</form>
			</div>
		</div>

		<!-- Process Info -->
		<div class="alert alert-info mt-8">
			<div>
				<h3 class="font-bold mb-2">What happens next?</h3>
				<ol class="list-decimal list-inside text-sm space-y-1">
					<li>Your application will be reviewed by our team (3-5 business days)</li>
					<li>If approved, we'll create your mentor profile</li>
					<li>Journey creators can then invite you to mentor their journeys</li>
					<li>You'll receive reviews to complete and earn money helping others!</li>
				</ol>
			</div>
		</div>
	{/if}
</div>
