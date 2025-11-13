import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { MentorApplication } from '$lib/types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	// Require authentication
	if (!locals.user) {
		throw redirect(302, '/login?redirect=/mentor/apply');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	try {
		// Check if user already has an application
		const existingApplication = await db
			.prepare(
				`
			SELECT * FROM mentor_applications
			WHERE user_id = ?
			ORDER BY applied_at DESC
			LIMIT 1
		`
			)
			.bind(locals.user.id)
			.first<MentorApplication>();

		// Check if user already has an approved mentor profile
		const existingProfile = await db
			.prepare(
				`
			SELECT id FROM mentor_profiles
			WHERE user_id = ?
		`
			)
			.bind(locals.user.id)
			.first();

		return {
			existingApplication,
			hasProfile: !!existingProfile
		};
	} catch (err) {
		console.error('Error loading mentor application page:', err);
		throw error(500, 'Failed to load application');
	}
};

export const actions: Actions = {
	submit: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return fail(401, { error: 'Please log in to apply' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();

		// Extract form data
		const bio = (formData.get('bio') as string)?.trim();
		const expertise = (formData.get('expertise') as string)?.trim();
		const experienceYears = parseInt(formData.get('experience_years') as string);
		const education = (formData.get('education') as string)?.trim();
		const certifications = (formData.get('certifications') as string)?.trim();
		const whyMentor = (formData.get('why_mentor') as string)?.trim();
		const sampleFeedback = (formData.get('sample_feedback') as string)?.trim();
		const availabilityHours = parseInt(formData.get('availability_hours') as string);
		const hourlyRate = parseFloat(formData.get('hourly_rate') as string);

		// Validation
		if (!bio || bio.length < 100) {
			return fail(400, {
				error: 'Bio must be at least 100 characters',
				bio,
				expertise,
				experienceYears,
				education,
				certifications,
				whyMentor,
				sampleFeedback,
				availabilityHours,
				hourlyRate
			});
		}

		if (!expertise) {
			return fail(400, {
				error: 'Please list your areas of expertise',
				bio,
				expertise,
				experienceYears,
				education,
				certifications,
				whyMentor,
				sampleFeedback,
				availabilityHours,
				hourlyRate
			});
		}

		if (isNaN(experienceYears) || experienceYears < 0) {
			return fail(400, {
				error: 'Please provide valid years of experience',
				bio,
				expertise,
				experienceYears,
				education,
				certifications,
				whyMentor,
				sampleFeedback,
				availabilityHours,
				hourlyRate
			});
		}

		if (!whyMentor || whyMentor.length < 50) {
			return fail(400, {
				error: 'Please tell us why you want to be a mentor (at least 50 characters)',
				bio,
				expertise,
				experienceYears,
				education,
				certifications,
				whyMentor,
				sampleFeedback,
				availabilityHours,
				hourlyRate
			});
		}

		if (!sampleFeedback || sampleFeedback.length < 100) {
			return fail(400, {
				error: 'Please provide a sample feedback (at least 100 characters)',
				bio,
				expertise,
				experienceYears,
				education,
				certifications,
				whyMentor,
				sampleFeedback,
				availabilityHours,
				hourlyRate
			});
		}

		if (isNaN(availabilityHours) || availabilityHours < 1) {
			return fail(400, {
				error: 'Please specify your weekly availability (minimum 1 hour)',
				bio,
				expertise,
				experienceYears,
				education,
				certifications,
				whyMentor,
				sampleFeedback,
				availabilityHours,
				hourlyRate
			});
		}

		if (isNaN(hourlyRate) || hourlyRate < 0) {
			return fail(400, {
				error: 'Please provide a valid hourly rate',
				bio,
				expertise,
				experienceYears,
				education,
				certifications,
				whyMentor,
				sampleFeedback,
				availabilityHours,
				hourlyRate
			});
		}

		try {
			// Check if user already has a pending or approved application
			const existingApplication = await db
				.prepare(
					`
				SELECT id, status FROM mentor_applications
				WHERE user_id = ? AND status IN ('pending', 'approved')
			`
				)
				.bind(locals.user.id)
				.first<{ id: number; status: string }>();

			if (existingApplication) {
				if (existingApplication.status === 'approved') {
					return fail(400, {
						error:
							'You already have an approved mentor application. Check your mentor dashboard.'
					});
				} else {
					return fail(400, { error: 'You already have a pending application under review' });
				}
			}

			// Convert expertise to JSON array
			const expertiseArray = expertise
				.split(',')
				.map((e) => e.trim())
				.filter((e) => e.length > 0);
			const expertiseJson = JSON.stringify(expertiseArray);

			// Create application
			await db
				.prepare(
					`
				INSERT INTO mentor_applications (
					user_id, bio, expertise, experience_years, education,
					certifications, why_mentor, sample_feedback, availability_hours,
					hourly_rate, status
				)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
			`
				)
				.bind(
					locals.user.id,
					bio,
					expertiseJson,
					experienceYears,
					education || null,
					certifications || null,
					whyMentor,
					sampleFeedback,
					availabilityHours,
					hourlyRate
				)
				.run();

			// Redirect to confirmation page
			throw redirect(303, '/mentor/apply/success');
		} catch (err: any) {
			if (err.status === 303) throw err; // Allow redirect
			console.error('Error submitting mentor application:', err);
			return fail(500, { error: 'Failed to submit application. Please try again.' });
		}
	}
};
