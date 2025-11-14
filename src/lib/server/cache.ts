/**
 * Cloudflare KV Caching Layer
 * Phase 8: Caching strategy for static and semi-static data
 */

import type { D1Database, KVNamespace } from '@cloudflare/workers-types';
import { trackCacheEntry, logCacheEvent } from './performance';

// ============================================================================
// Cache Configuration
// ============================================================================

export const CACHE_TTL = {
	// Static data (rarely changes)
	JOURNEY_META: 60 * 60, // 1 hour
	SECTION_FIELDS: 60 * 60, // 1 hour
	MENTOR_PUBLIC_PROFILE: 30 * 60, // 30 minutes
	TEMPLATES_LIST: 30 * 60, // 30 minutes
	SPECIALIZATIONS: 60 * 60 * 24, // 24 hours (static data)

	// Semi-dynamic data (changes occasionally)
	USER_ENROLLMENTS: 5 * 60, // 5 minutes
	JOURNEY_STATS: 10 * 60, // 10 minutes
	MENTOR_STATS: 10 * 60, // 10 minutes
	USER_PROGRESS: 5 * 60, // 5 minutes

	// Dynamic data (short TTL)
	REVIEW_STATUS: 60, // 1 minute
	UNREAD_COUNT: 60 // 1 minute
};

export const CACHE_KEYS = {
	journey: (slug: string) => `journey:${slug}`,
	journeyById: (id: number) => `journey:id:${id}`,
	journeyStats: (id: number) => `journey:stats:${id}`,
	sectionFields: (id: number) => `section:fields:${id}`,
	mentorProfile: (id: number) => `mentor:profile:${id}`,
	mentorStats: (id: number) => `mentor:stats:${id}`,
	userEnrollments: (userId: number) => `user:${userId}:enrollments`,
	userProgress: (userId: number, journeyId: number) => `user:${userId}:journey:${journeyId}:progress`,
	templatesList: (category?: string) => `templates:${category || 'all'}`,
	specializations: () => 'specializations:all'
};

// ============================================================================
// Cache Helper Functions
// ============================================================================

/**
 * Get data from cache with fallback to database
 */
export async function getOrSet<T>(
	kv: KVNamespace,
	db: D1Database,
	key: string,
	fetchFn: () => Promise<T>,
	options: {
		ttl?: number;
		entityType?: string;
		entityId?: number;
		userId?: number;
	} = {}
): Promise<T> {
	// Try to get from cache
	const cached = await kv.get(key, 'json');

	if (cached !== null) {
		// Cache hit - log it
		await logCacheEvent(db, 'kv', true).catch(() => {});
		return cached as T;
	}

	// Cache miss - log it
	await logCacheEvent(db, 'kv', false).catch(() => {});

	// Fetch from database
	const data = await fetchFn();

	// Store in cache
	const ttl = options.ttl ?? CACHE_TTL.JOURNEY_META;
	await kv.put(key, JSON.stringify(data), {
		expirationTtl: ttl
	});

	// Track cache entry in database (async, don't block)
	trackCacheEntry(db, {
		cacheKey: key,
		cacheType: 'kv',
		entityType: options.entityType,
		entityId: options.entityId,
		ttlSeconds: ttl
	}).catch(() => {});

	return data;
}

/**
 * Invalidate cache entry
 */
export async function invalidate(
	kv: KVNamespace,
	db: D1Database,
	key: string | string[]
): Promise<void> {
	const keys = Array.isArray(key) ? key : [key];

	// Delete from KV
	await Promise.all(keys.map((k) => kv.delete(k)));

	// Mark as invalidated in database (async)
	for (const k of keys) {
		await db
			.prepare(
				`UPDATE cache_entries
				SET invalidated_at = CURRENT_TIMESTAMP
				WHERE cache_key = ?`
			)
			.bind(k)
			.run()
			.catch(() => {});
	}
}

/**
 * Invalidate all cache entries for an entity
 */
export async function invalidateByEntity(
	kv: KVNamespace,
	db: D1Database,
	entityType: string,
	entityId: number
): Promise<void> {
	// Get all cache keys for this entity
	const result = await db
		.prepare(
			`SELECT cache_key FROM cache_entries
			WHERE entity_type = ? AND entity_id = ? AND invalidated_at IS NULL`
		)
		.bind(entityType, entityId)
		.all();

	if (result.results && result.results.length > 0) {
		const keys = result.results.map((r: any) => r.cache_key);
		await invalidate(kv, db, keys);
	}
}

// ============================================================================
// Journey Caching
// ============================================================================

/**
 * Get journey metadata from cache
 */
export async function getCachedJourney(
	kv: KVNamespace,
	db: D1Database,
	slug: string
): Promise<any> {
	return getOrSet(
		kv,
		db,
		CACHE_KEYS.journey(slug),
		async () => {
			const journey = await db
				.prepare(
					`SELECT j.*, u.username as creator_username
					FROM journeys j
					INNER JOIN users u ON j.creator_user_id = u.id
					WHERE j.slug = ? AND j.status = 'published'`
				)
				.bind(slug)
				.first();

			return journey;
		},
		{
			ttl: CACHE_TTL.JOURNEY_META,
			entityType: 'journey',
			entityId: undefined // Don't know ID yet
		}
	);
}

/**
 * Get journey stats from cache
 */
export async function getCachedJourneyStats(
	kv: KVNamespace,
	db: D1Database,
	journeyId: number
): Promise<any> {
	return getOrSet(
		kv,
		db,
		CACHE_KEYS.journeyStats(journeyId),
		async () => {
			const stats = await db
				.prepare('SELECT * FROM journey_stats_cache WHERE journey_id = ?')
				.bind(journeyId)
				.first();

			return stats;
		},
		{
			ttl: CACHE_TTL.JOURNEY_STATS,
			entityType: 'journey',
			entityId: journeyId
		}
	);
}

/**
 * Invalidate journey cache when updated
 */
export async function invalidateJourneyCache(
	kv: KVNamespace,
	db: D1Database,
	journey: { id: number; slug: string }
): Promise<void> {
	await invalidate(kv, db, [
		CACHE_KEYS.journey(journey.slug),
		CACHE_KEYS.journeyById(journey.id),
		CACHE_KEYS.journeyStats(journey.id)
	]);
}

// ============================================================================
// Section Caching
// ============================================================================

/**
 * Get section field definitions from cache
 */
export async function getCachedSectionFields(
	kv: KVNamespace,
	db: D1Database,
	sectionId: number
): Promise<any[]> {
	return getOrSet(
		kv,
		db,
		CACHE_KEYS.sectionFields(sectionId),
		async () => {
			const fields = await db
				.prepare(
					`SELECT * FROM section_fields
					WHERE section_id = ?
					ORDER BY order_index ASC`
				)
				.bind(sectionId)
				.all();

			return fields.results || [];
		},
		{
			ttl: CACHE_TTL.SECTION_FIELDS,
			entityType: 'section',
			entityId: sectionId
		}
	);
}

/**
 * Invalidate section cache when updated
 */
export async function invalidateSectionCache(
	kv: KVNamespace,
	db: D1Database,
	sectionId: number
): Promise<void> {
	await invalidate(kv, db, CACHE_KEYS.sectionFields(sectionId));
}

// ============================================================================
// Mentor Caching
// ============================================================================

/**
 * Get mentor public profile from cache
 */
export async function getCachedMentorProfile(
	kv: KVNamespace,
	db: D1Database,
	mentorUserId: number
): Promise<any> {
	return getOrSet(
		kv,
		db,
		CACHE_KEYS.mentorProfile(mentorUserId),
		async () => {
			const profile = await db
				.prepare(
					`SELECT mp.*, u.username, u.email
					FROM mentor_profiles mp
					INNER JOIN users u ON mp.user_id = u.id
					WHERE mp.user_id = ? AND mp.status = 'approved'`
				)
				.bind(mentorUserId)
				.first();

			return profile;
		},
		{
			ttl: CACHE_TTL.MENTOR_PUBLIC_PROFILE,
			entityType: 'mentor',
			entityId: mentorUserId
		}
	);
}

/**
 * Get mentor stats from cache
 */
export async function getCachedMentorStats(
	kv: KVNamespace,
	db: D1Database,
	mentorUserId: number
): Promise<any> {
	return getOrSet(
		kv,
		db,
		CACHE_KEYS.mentorStats(mentorUserId),
		async () => {
			const stats = await db
				.prepare('SELECT * FROM mentor_stats_cache WHERE mentor_user_id = ?')
				.bind(mentorUserId)
				.first();

			return stats;
		},
		{
			ttl: CACHE_TTL.MENTOR_STATS,
			entityType: 'mentor',
			entityId: mentorUserId
		}
	);
}

/**
 * Invalidate mentor cache when profile updated
 */
export async function invalidateMentorCache(
	kv: KVNamespace,
	db: D1Database,
	mentorUserId: number
): Promise<void> {
	await invalidate(kv, db, [
		CACHE_KEYS.mentorProfile(mentorUserId),
		CACHE_KEYS.mentorStats(mentorUserId)
	]);
}

// ============================================================================
// Template Caching
// ============================================================================

/**
 * Get templates list from cache
 */
export async function getCachedTemplates(
	kv: KVNamespace,
	db: D1Database,
	category?: string
): Promise<any[]> {
	return getOrSet(
		kv,
		db,
		CACHE_KEYS.templatesList(category),
		async () => {
			let query = `
				SELECT jt.*, u.username as creator_name, j.name as journey_name
				FROM journey_templates jt
				INNER JOIN users u ON jt.creator_user_id = u.id
				INNER JOIN journeys j ON jt.source_journey_id = j.id
				WHERE jt.is_public = 1
			`;

			const bindings: any[] = [];

			if (category) {
				query += ' AND jt.category = ?';
				bindings.push(category);
			}

			query += ' ORDER BY jt.is_featured DESC, jt.average_rating DESC LIMIT 50';

			const result = await db.prepare(query).bind(...bindings).all();

			return result.results || [];
		},
		{
			ttl: CACHE_TTL.TEMPLATES_LIST,
			entityType: 'templates'
		}
	);
}

/**
 * Invalidate templates cache when new template added
 */
export async function invalidateTemplatesCache(kv: KVNamespace, db: D1Database): Promise<void> {
	// Invalidate all template lists (all categories)
	const keys = [
		CACHE_KEYS.templatesList(),
		CACHE_KEYS.templatesList('career'),
		CACHE_KEYS.templatesList('technical'),
		CACHE_KEYS.templatesList('personal'),
		CACHE_KEYS.templatesList('creative'),
		CACHE_KEYS.templatesList('business'),
		CACHE_KEYS.templatesList('health'),
		CACHE_KEYS.templatesList('other')
	];

	await invalidate(kv, db, keys);
}

// ============================================================================
// User Data Caching
// ============================================================================

/**
 * Get user enrollments from cache
 */
export async function getCachedUserEnrollments(
	kv: KVNamespace,
	db: D1Database,
	userId: number
): Promise<any[]> {
	return getOrSet(
		kv,
		db,
		CACHE_KEYS.userEnrollments(userId),
		async () => {
			const enrollments = await db
				.prepare(
					`SELECT ue.*, j.name as journey_name, j.slug as journey_slug
					FROM user_enrollments ue
					INNER JOIN journeys j ON ue.journey_id = j.id
					WHERE ue.user_id = ?
					ORDER BY ue.enrolled_at DESC`
				)
				.bind(userId)
				.all();

			return enrollments.results || [];
		},
		{
			ttl: CACHE_TTL.USER_ENROLLMENTS,
			entityType: 'user_enrollments',
			entityId: userId
		}
	);
}

/**
 * Get user progress for a journey from cache
 */
export async function getCachedUserProgress(
	kv: KVNamespace,
	db: D1Database,
	userId: number,
	journeyId: number
): Promise<any> {
	return getOrSet(
		kv,
		db,
		CACHE_KEYS.userProgress(userId, journeyId),
		async () => {
			const progress = await db
				.prepare('SELECT * FROM user_journey_progress_summary WHERE user_id = ? AND journey_id = ?')
				.bind(userId, journeyId)
				.first();

			return progress;
		},
		{
			ttl: CACHE_TTL.USER_PROGRESS,
			entityType: 'user_progress',
			entityId: userId
		}
	);
}

/**
 * Invalidate user cache when enrollment or progress changes
 */
export async function invalidateUserCache(
	kv: KVNamespace,
	db: D1Database,
	userId: number,
	journeyId?: number
): Promise<void> {
	const keys = [CACHE_KEYS.userEnrollments(userId)];

	if (journeyId) {
		keys.push(CACHE_KEYS.userProgress(userId, journeyId));
	}

	await invalidate(kv, db, keys);
}

// ============================================================================
// Specializations Caching (Static Data)
// ============================================================================

/**
 * Get all specializations from cache (rarely changes)
 */
export async function getCachedSpecializations(
	kv: KVNamespace,
	db: D1Database
): Promise<any[]> {
	return getOrSet(
		kv,
		db,
		CACHE_KEYS.specializations(),
		async () => {
			const result = await db
				.prepare('SELECT * FROM mentor_specializations WHERE is_active = 1 ORDER BY name ASC')
				.all();

			return result.results || [];
		},
		{
			ttl: CACHE_TTL.SPECIALIZATIONS,
			entityType: 'specializations'
		}
	);
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Warm up cache for popular content
 */
export async function warmUpCache(kv: KVNamespace, db: D1Database): Promise<void> {
	// Get top 10 most enrolled journeys
	const topJourneys = await db
		.prepare(
			`SELECT j.id, j.slug
			FROM journeys j
			INNER JOIN user_enrollments ue ON j.id = ue.journey_id
			WHERE j.status = 'published'
			GROUP BY j.id
			ORDER BY COUNT(ue.id) DESC
			LIMIT 10`
		)
		.all();

	// Cache them
	for (const journey of topJourneys.results || []) {
		await getCachedJourney(kv, db, (journey as any).slug).catch(() => {});
		await getCachedJourneyStats(kv, db, (journey as any).id).catch(() => {});
	}

	// Get top 10 mentors
	const topMentors = await db
		.prepare(
			`SELECT user_id
			FROM mentor_profiles
			WHERE status = 'approved'
			ORDER BY average_rating DESC, total_reviews DESC
			LIMIT 10`
		)
		.all();

	// Cache them
	for (const mentor of topMentors.results || []) {
		await getCachedMentorProfile(kv, db, (mentor as any).user_id).catch(() => {});
		await getCachedMentorStats(kv, db, (mentor as any).user_id).catch(() => {});
	}

	// Cache specializations (static data)
	await getCachedSpecializations(kv, db).catch(() => {});

	// Cache templates
	await getCachedTemplates(kv, db).catch(() => {});
}

/**
 * Purge all caches (use sparingly)
 */
export async function purgeAllCaches(kv: KVNamespace, db: D1Database): Promise<void> {
	// Get all active cache keys
	const result = await db
		.prepare('SELECT cache_key FROM cache_entries WHERE invalidated_at IS NULL')
		.all();

	if (result.results && result.results.length > 0) {
		const keys = result.results.map((r: any) => r.cache_key);
		await invalidate(kv, db, keys);
	}
}
