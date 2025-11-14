/**
 * Performance & Optimization Utilities
 * Phase 8: Database optimization, caching, and performance monitoring
 */

import type { D1Database } from '@cloudflare/workers-types';
import { createHash } from 'crypto';

// ============================================================================
// Query Performance Profiling
// ============================================================================

export interface QueryProfile {
	queryName: string;
	executionTimeMs: number;
	rowCount?: number;
	userId?: number;
	endpoint?: string;
	metadata?: Record<string, any>;
}

/**
 * Wraps a D1 query execution with performance logging
 */
export async function profileQuery<T>(
	db: D1Database,
	profile: Omit<QueryProfile, 'executionTimeMs'>,
	queryFn: () => Promise<T>
): Promise<T> {
	const startTime = performance.now();

	try {
		const result = await queryFn();
		const executionTimeMs = performance.now() - startTime;

		// Log performance asynchronously (don't block response)
		logQueryPerformance(db, {
			...profile,
			executionTimeMs
		}).catch((err) => {
			console.error('Failed to log query performance:', err);
		});

		return result;
	} catch (error) {
		const executionTimeMs = performance.now() - startTime;

		// Still log failed queries for debugging
		logQueryPerformance(db, {
			...profile,
			executionTimeMs,
			metadata: {
				...profile.metadata,
				error: error instanceof Error ? error.message : 'Unknown error'
			}
		}).catch(() => {});

		throw error;
	}
}

/**
 * Logs query performance to the database
 */
async function logQueryPerformance(db: D1Database, profile: QueryProfile): Promise<void> {
	// Generate query hash for grouping similar queries
	const queryHash = createHash('md5').update(profile.queryName).digest('hex').substring(0, 16);

	await db
		.prepare(
			`INSERT INTO query_performance_log
			(query_name, execution_time_ms, row_count, query_hash, user_id, endpoint, metadata)
			VALUES (?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			profile.queryName,
			profile.executionTimeMs,
			profile.rowCount ?? null,
			queryHash,
			profile.userId ?? null,
			profile.endpoint ?? null,
			profile.metadata ? JSON.stringify(profile.metadata) : null
		)
		.run();
}

/**
 * Get slow queries report
 */
export async function getSlowQueries(
	db: D1Database,
	thresholdMs: number = 100,
	limit: number = 50
): Promise<any[]> {
	const result = await db
		.prepare(
			`SELECT * FROM slow_queries_report
			WHERE avg_time_ms > ?
			ORDER BY avg_time_ms DESC
			LIMIT ?`
		)
		.bind(thresholdMs, limit)
		.all();

	return result.results || [];
}

// ============================================================================
// Cache Management
// ============================================================================

export interface CacheEntry {
	cacheKey: string;
	cacheType: 'kv' | 'browser' | 'api';
	entityType?: string;
	entityId?: number;
	ttlSeconds?: number;
}

/**
 * Track cache entry in database
 */
export async function trackCacheEntry(db: D1Database, entry: CacheEntry): Promise<void> {
	await db
		.prepare(
			`INSERT OR REPLACE INTO cache_entries
			(cache_key, cache_type, entity_type, entity_id, ttl_seconds, last_accessed_at)
			VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
		)
		.bind(
			entry.cacheKey,
			entry.cacheType,
			entry.entityType ?? null,
			entry.entityId ?? null,
			entry.ttlSeconds ?? null
		)
		.run();
}

/**
 * Invalidate cache entries by entity
 */
export async function invalidateCacheByEntity(
	db: D1Database,
	entityType: string,
	entityId?: number
): Promise<number> {
	let query = `
		UPDATE cache_entries
		SET invalidated_at = CURRENT_TIMESTAMP
		WHERE entity_type = ?
			AND invalidated_at IS NULL
	`;

	const bindings: any[] = [entityType];

	if (entityId !== undefined) {
		query += ' AND entity_id = ?';
		bindings.push(entityId);
	}

	const result = await db.prepare(query).bind(...bindings).run();

	return result.meta.changes || 0;
}

/**
 * Invalidate cache entries by key pattern
 */
export async function invalidateCacheByPattern(
	db: D1Database,
	keyPattern: string
): Promise<number> {
	const result = await db
		.prepare(
			`UPDATE cache_entries
			SET invalidated_at = CURRENT_TIMESTAMP
			WHERE cache_key LIKE ?
				AND invalidated_at IS NULL`
		)
		.bind(keyPattern)
		.run();

	return result.meta.changes || 0;
}

/**
 * Get cache performance metrics
 */
export async function getCacheMetrics(db: D1Database, cacheType?: string): Promise<any> {
	let query = 'SELECT * FROM cache_performance_summary';
	const bindings: any[] = [];

	if (cacheType) {
		query += ' WHERE cache_type = ?';
		bindings.push(cacheType);
	}

	const result = await db.prepare(query).bind(...bindings).all();

	return result.results;
}

/**
 * Log cache hit/miss
 */
export async function logCacheEvent(
	db: D1Database,
	cacheType: string,
	hit: boolean
): Promise<void> {
	// Get or create today's metrics
	const today = new Date().toISOString().split('T')[0];

	await db
		.prepare(
			`INSERT INTO cache_metrics (cache_type, hits, misses, recorded_at)
			VALUES (?, ?, ?, datetime('now', 'start of day'))
			ON CONFLICT(cache_type, recorded_at) DO UPDATE SET
				hits = hits + excluded.hits,
				misses = misses + excluded.misses,
				hit_rate = CAST(hits AS REAL) / (hits + misses)`
		)
		.bind(cacheType, hit ? 1 : 0, hit ? 0 : 1)
		.run();
}

// ============================================================================
// Background Jobs
// ============================================================================

export interface BackgroundJob {
	jobType: string;
	jobName: string;
	payload?: Record<string, any>;
	priority?: number;
	scheduledAt?: Date;
	maxAttempts?: number;
	createdBy?: number;
}

/**
 * Enqueue a background job
 */
export async function enqueueJob(db: D1Database, job: BackgroundJob): Promise<number> {
	const result = await db
		.prepare(
			`INSERT INTO background_jobs
			(job_type, job_name, payload, priority, scheduled_at, max_attempts, created_by)
			VALUES (?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			job.jobType,
			job.jobName,
			job.payload ? JSON.stringify(job.payload) : null,
			job.priority ?? 5,
			job.scheduledAt ? job.scheduledAt.toISOString() : null,
			job.maxAttempts ?? 3,
			job.createdBy ?? null
		)
		.run();

	return result.meta.last_row_id || 0;
}

/**
 * Get next pending job to process
 */
export async function getNextJob(db: D1Database, jobTypes?: string[]): Promise<any | null> {
	let query = `
		SELECT * FROM background_jobs
		WHERE status = 'pending'
			AND (scheduled_at IS NULL OR scheduled_at <= CURRENT_TIMESTAMP)
	`;

	const bindings: any[] = [];

	if (jobTypes && jobTypes.length > 0) {
		const placeholders = jobTypes.map(() => '?').join(',');
		query += ` AND job_type IN (${placeholders})`;
		bindings.push(...jobTypes);
	}

	query += `
		ORDER BY priority ASC, scheduled_at ASC, created_at ASC
		LIMIT 1
	`;

	const result = await db.prepare(query).bind(...bindings).first();

	return result;
}

/**
 * Mark job as processing
 */
export async function startJob(db: D1Database, jobId: number): Promise<void> {
	await db
		.prepare(
			`UPDATE background_jobs
			SET status = 'processing',
				started_at = CURRENT_TIMESTAMP,
				attempts = attempts + 1,
				updated_at = CURRENT_TIMESTAMP
			WHERE id = ?`
		)
		.bind(jobId)
		.run();
}

/**
 * Mark job as completed
 */
export async function completeJob(
	db: D1Database,
	jobId: number,
	result?: Record<string, any>
): Promise<void> {
	const completedAt = new Date().toISOString();
	const startedAt = await db
		.prepare('SELECT started_at FROM background_jobs WHERE id = ?')
		.bind(jobId)
		.first<{ started_at: string }>();

	if (startedAt?.started_at) {
		const executionTimeMs =
			new Date(completedAt).getTime() - new Date(startedAt.started_at).getTime();

		// Log execution history
		await db
			.prepare(
				`INSERT INTO job_execution_history (job_id, execution_time_ms, success)
				VALUES (?, ?, 1)`
			)
			.bind(jobId, executionTimeMs)
			.run();
	}

	await db
		.prepare(
			`UPDATE background_jobs
			SET status = 'completed',
				completed_at = CURRENT_TIMESTAMP,
				result = ?,
				updated_at = CURRENT_TIMESTAMP
			WHERE id = ?`
		)
		.bind(result ? JSON.stringify(result) : null, jobId)
		.run();
}

/**
 * Mark job as failed
 */
export async function failJob(
	db: D1Database,
	jobId: number,
	errorMessage: string
): Promise<void> {
	const job = await db
		.prepare('SELECT attempts, max_attempts, started_at FROM background_jobs WHERE id = ?')
		.bind(jobId)
		.first<{ attempts: number; max_attempts: number; started_at: string }>();

	if (!job) return;

	// Check if we should retry or mark as permanently failed
	const shouldRetry = job.attempts < job.max_attempts;

	// Log execution history
	if (job.started_at) {
		const executionTimeMs = Date.now() - new Date(job.started_at).getTime();

		await db
			.prepare(
				`INSERT INTO job_execution_history (job_id, execution_time_ms, success, error_message)
				VALUES (?, ?, 0, ?)`
			)
			.bind(jobId, executionTimeMs, errorMessage)
			.run();
	}

	if (shouldRetry) {
		// Reset to pending for retry
		await db
			.prepare(
				`UPDATE background_jobs
				SET status = 'pending',
					error_message = ?,
					updated_at = CURRENT_TIMESTAMP
				WHERE id = ?`
			)
			.bind(errorMessage, jobId)
			.run();
	} else {
		// Mark as permanently failed
		await db
			.prepare(
				`UPDATE background_jobs
				SET status = 'failed',
					failed_at = CURRENT_TIMESTAMP,
					error_message = ?,
					updated_at = CURRENT_TIMESTAMP
				WHERE id = ?`
			)
			.bind(errorMessage, jobId)
			.run();
	}
}

/**
 * Get job queue health
 */
export async function getJobQueueHealth(db: D1Database): Promise<any[]> {
	const result = await db.prepare('SELECT * FROM job_queue_health').all();

	return result.results || [];
}

// ============================================================================
// Web Vitals Tracking
// ============================================================================

export interface WebVital {
	userId?: number;
	metricName: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP';
	metricValue: number;
	pagePath: string;
	userAgent?: string;
	connectionType?: string;
	deviceType?: 'mobile' | 'tablet' | 'desktop';
}

/**
 * Log web vital metric
 */
export async function logWebVital(db: D1Database, vital: WebVital): Promise<void> {
	await db
		.prepare(
			`INSERT INTO web_vitals
			(user_id, metric_name, metric_value, page_path, user_agent, connection_type, device_type)
			VALUES (?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			vital.userId ?? null,
			vital.metricName,
			vital.metricValue,
			vital.pagePath,
			vital.userAgent ?? null,
			vital.connectionType ?? null,
			vital.deviceType ?? null
		)
		.run();
}

/**
 * Get web vitals summary
 */
export async function getWebVitalsSummary(
	db: D1Database,
	metricName?: string,
	days: number = 7
): Promise<any> {
	let query = `
		SELECT
			metric_name,
			COUNT(*) as sample_count,
			AVG(metric_value) as avg_value,
			MIN(metric_value) as min_value,
			MAX(metric_value) as max_value,
			device_type,
			connection_type
		FROM web_vitals
		WHERE recorded_at >= datetime('now', '-' || ? || ' days')
	`;

	const bindings: any[] = [days];

	if (metricName) {
		query += ' AND metric_name = ?';
		bindings.push(metricName);
	}

	query += ' GROUP BY metric_name, device_type, connection_type';

	const result = await db.prepare(query).bind(...bindings).all();

	return result.results;
}

// ============================================================================
// API Performance Tracking
// ============================================================================

export interface ApiPerformance {
	endpoint: string;
	method: string;
	responseTimeMs: number;
	statusCode: number;
	userId?: number;
	errorMessage?: string;
}

/**
 * Log API endpoint performance
 */
export async function logApiPerformance(db: D1Database, perf: ApiPerformance): Promise<void> {
	await db
		.prepare(
			`INSERT INTO api_performance
			(endpoint, method, response_time_ms, status_code, user_id, error_message)
			VALUES (?, ?, ?, ?, ?, ?)`
		)
		.bind(
			perf.endpoint,
			perf.method,
			perf.responseTimeMs,
			perf.statusCode,
			perf.userId ?? null,
			perf.errorMessage ?? null
		)
		.run();
}

/**
 * Get API performance summary
 */
export async function getApiPerformanceSummary(
	db: D1Database,
	endpoint?: string,
	days: number = 7
): Promise<any> {
	let query = `
		SELECT
			endpoint,
			method,
			COUNT(*) as request_count,
			AVG(response_time_ms) as avg_response_time,
			MIN(response_time_ms) as min_response_time,
			MAX(response_time_ms) as max_response_time,
			COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count,
			CAST(COUNT(CASE WHEN status_code >= 400 THEN 1 END) * 100.0 / COUNT(*) AS REAL) as error_rate
		FROM api_performance
		WHERE recorded_at >= datetime('now', '-' || ? || ' days')
	`;

	const bindings: any[] = [days];

	if (endpoint) {
		query += ' AND endpoint = ?';
		bindings.push(endpoint);
	}

	query += ' GROUP BY endpoint, method ORDER BY request_count DESC';

	const result = await db.prepare(query).bind(...bindings).all();

	return result.results;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Clean up old performance logs (keep last N days)
 */
export async function cleanupOldLogs(db: D1Database, daysToKeep: number = 30): Promise<number> {
	const result = await db
		.prepare(
			`DELETE FROM query_performance_log
			WHERE recorded_at < datetime('now', '-' || ? || ' days')`
		)
		.bind(daysToKeep)
		.run();

	return result.meta.changes || 0;
}

/**
 * Clean up old cache entries
 */
export async function cleanupOldCacheEntries(
	db: D1Database,
	daysToKeep: number = 30
): Promise<number> {
	const result = await db
		.prepare(
			`DELETE FROM cache_entries
			WHERE invalidated_at IS NOT NULL
				AND invalidated_at < datetime('now', '-' || ? || ' days')`
		)
		.bind(daysToKeep)
		.run();

	return result.meta.changes || 0;
}

/**
 * Get platform statistics for a date
 */
export async function getPlatformStats(db: D1Database, date?: string): Promise<any> {
	const targetDate = date || new Date().toISOString().split('T')[0];

	const result = await db
		.prepare('SELECT * FROM platform_stats_daily WHERE stat_date = ?')
		.bind(targetDate)
		.first();

	return result;
}

/**
 * Calculate and update daily platform statistics
 */
type PlatformStatsRow = {
	total_users: number;
	active_users: number;
	new_users: number;
	total_journeys: number;
	active_journeys: number;
	total_enrollments: number;
	new_enrollments: number;
	total_reviews: number;
	completed_reviews: number;
	avg_review_time_hours: number | null;
	total_mentors: number;
	active_mentors: number;
};

export async function calculateDailyStats(db: D1Database, date?: string): Promise<void> {
	const targetDate = date || new Date().toISOString().split('T')[0];

	// Calculate all stats for the day
	const stats = await db
		.prepare(
			`SELECT
				(SELECT COUNT(*) FROM users) as total_users,
				(SELECT COUNT(DISTINCT user_id) FROM analytics_events WHERE DATE(created_at) = ?) as active_users,
				(SELECT COUNT(*) FROM users WHERE DATE(created_at) = ?) as new_users,
				(SELECT COUNT(*) FROM journeys WHERE is_active = 1) as total_journeys,
				(SELECT COUNT(DISTINCT journey_id) FROM user_journeys WHERE status = 'active') as active_journeys,
				(SELECT COUNT(*) FROM user_journeys) as total_enrollments,
				(SELECT COUNT(*) FROM user_journeys WHERE DATE(started_at) = ?) as new_enrollments,
				(SELECT COUNT(*) FROM section_reviews) as total_reviews,
				(SELECT COUNT(*) FROM section_reviews WHERE status = 'completed' AND DATE(completed_at) = ?) as completed_reviews,
				(SELECT AVG(JULIANDAY(completed_at) - JULIANDAY(claimed_at)) * 24
					FROM section_reviews
					WHERE status = 'completed' AND DATE(completed_at) = ?) as avg_review_time_hours,
				(SELECT COUNT(*) FROM mentors) as total_mentors,
				(SELECT COUNT(DISTINCT mentor_user_id) FROM section_reviews WHERE DATE(claimed_at) = ?) as active_mentors
			`
		)
		.bind(targetDate, targetDate, targetDate, targetDate, targetDate, targetDate)
		.first<PlatformStatsRow>();

	if (!stats) {
		return;
	}

	// Insert or update the stats
	await db
		.prepare(
			`INSERT OR REPLACE INTO platform_stats_daily
			(stat_date, total_users, active_users, new_users, total_journeys, active_journeys,
			 total_enrollments, new_enrollments, total_reviews, completed_reviews,
			 avg_review_time_hours, total_mentors, active_mentors)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			targetDate,
			stats.total_users,
			stats.active_users,
			stats.new_users,
			stats.total_journeys,
			stats.active_journeys,
			stats.total_enrollments,
			stats.new_enrollments,
			stats.total_reviews,
			stats.completed_reviews,
			stats.avg_review_time_hours,
			stats.total_mentors,
			stats.active_mentors
		)
		.run();
}
