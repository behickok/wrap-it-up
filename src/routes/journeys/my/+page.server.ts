import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Journey, ServiceTier, UserJourney } from '$lib/types';

type JourneyRow = Journey &
	UserJourney & {
		user_journey_id: number;
		tier_name: string;
		tier_slug: string;
		creator_username: string;
		is_featured: boolean;
	};

type JourneyWithStats = JourneyRow & {
	totalSections: number;
	completedSections: number;
	progressPercentage: number;
};

export const load: PageServerLoad = async ({ locals, platform }) => {
	// Require authentication
	if (!locals.user) {
		throw redirect(302, '/login?redirect=/journeys/my');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	try {
		// Fetch user's enrolled journeys
		const journeysResult = await db
			.prepare(
				`
			SELECT
				j.*,
				uj.id as user_journey_id,
				uj.status,
				uj.tier_id,
				uj.started_at,
				uj.completed_at,
				uj.progress_percentage,
				st.name as tier_name,
				st.slug as tier_slug,
				u.username as creator_username,
				jc.is_featured
			FROM user_journeys uj
			JOIN journeys j ON uj.journey_id = j.id
			JOIN service_tiers st ON uj.tier_id = st.id
			JOIN journey_creators jc ON j.id = jc.journey_id
			JOIN users u ON jc.creator_user_id = u.id
			WHERE uj.user_id = ? AND uj.status = 'active'
			ORDER BY uj.started_at DESC
		`
			)
		.bind(locals.user.id)
		.all<JourneyRow>();

		const journeys = (journeysResult.results || []) as JourneyRow[];

		// For each journey, get section count and completion stats
		const journeysWithStats: JourneyWithStats[] = await Promise.all(
			journeys.map(async (journey): Promise<JourneyWithStats> => {
				// Get total sections
				const sectionsCount = await db
					.prepare(
						`
					SELECT COUNT(*) as count
					FROM journey_sections js
					WHERE js.journey_id = ?
				`
					)
					.bind(journey.id)
					.first<{ count: number }>();

				// Get completed sections
				const completedCount = await db
					.prepare(
						`
					SELECT COUNT(*) as count
					FROM user_section_progress usp
					JOIN journey_sections js ON usp.section_id = js.section_id
					WHERE usp.user_journey_id = ? AND usp.is_complete = 1
				`
					)
					.bind(journey.user_journey_id)
					.first<{ count: number }>();

				const totalSections = sectionsCount?.count || 0;
				const completedSections = completedCount?.count || 0;
				const progressPercentage =
					totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;

				return {
					...journey,
					totalSections,
					completedSections,
					progressPercentage
				};
			})
		);

		// Get enrollment stats
		const stats = {
			total: journeys.length,
			inProgress: journeysWithStats.filter(
				(journey) => journey.progressPercentage > 0 && journey.progressPercentage < 100
			).length,
			notStarted: journeysWithStats.filter((journey) => journey.progressPercentage === 0).length,
			completed: journeysWithStats.filter((journey) => journey.progressPercentage === 100).length
		};

		return {
			journeys: journeysWithStats,
			stats
		};
	} catch (err) {
		console.error('Error loading my journeys:', err);
		throw error(500, 'Failed to load your journeys');
	}
};
