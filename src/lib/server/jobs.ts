/**
 * Background Job Processing
 * Phase 8: Job processors for scheduled and async tasks
 */

import type { D1Database, KVNamespace } from '@cloudflare/workers-types';
import {
	getNextJob,
	startJob,
	completeJob,
	failJob,
	calculateDailyStats
} from './performance';
import {
	cleanupOldLogs,
	cleanupOldCacheEntries
} from './performance';
import { warmUpCache } from './cache';

// ============================================================================
// Job Types
// ============================================================================

export type JobType =
	| 'daily_stats'
	| 'cache_refresh'
	| 'cleanup'
	| 'performance_analysis'
	| 'report_generation'
	| 'data_export'
	| 'certificate_generation';

export interface JobContext {
	db: D1Database;
	kv?: KVNamespace;
}

export interface JobResult {
	success: boolean;
	message: string;
	data?: any;
}

type JourneyCacheStats = {
	total_enrollments: number | null;
	active_enrollments: number | null;
	completed_enrollments: number | null;
	avg_completion_time_days: number | null;
};

type MentorCacheStats = {
	total_reviews: number | null;
	completed_reviews: number | null;
	pending_reviews: number | null;
	avg_review_time_hours: number | null;
	avg_rating: number | null;
};

type JourneyCompletionRow = {
	completed_at: string | null;
	started_at: string | null;
};

// ============================================================================
// Job Processor Registry
// ============================================================================

type JobProcessor = (payload: any, context: JobContext) => Promise<JobResult>;

const JOB_PROCESSORS: Record<JobType, JobProcessor> = {
	daily_stats: processDailyStats,
	cache_refresh: processCacheRefresh,
	cleanup: processCleanup,
	performance_analysis: processPerformanceAnalysis,
	report_generation: processReportGeneration,
	data_export: processDataExport,
	certificate_generation: processCertificateGeneration
};

// ============================================================================
// Main Job Runner
// ============================================================================

/**
 * Process next available job in the queue
 */
export async function processNextJob(context: JobContext): Promise<boolean> {
	const job = await getNextJob(context.db);

	if (!job) {
		return false; // No jobs to process
	}

	console.log(`[Jobs] Processing job ${job.id}: ${job.job_type} - ${job.job_name}`);

	try {
		// Mark job as processing
		await startJob(context.db, job.id);

		// Get the appropriate processor
		const processor = JOB_PROCESSORS[job.job_type as JobType];

		if (!processor) {
			throw new Error(`Unknown job type: ${job.job_type}`);
		}

		// Parse payload
		const payload = job.payload ? JSON.parse(job.payload) : {};

		// Execute the job
		const result = await processor(payload, context);

		if (result.success) {
			// Mark as completed
			await completeJob(context.db, job.id, result.data);
			console.log(`[Jobs] Job ${job.id} completed: ${result.message}`);
		} else {
			// Mark as failed
			await failJob(context.db, job.id, result.message);
			console.error(`[Jobs] Job ${job.id} failed: ${result.message}`);
		}

		return true;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		await failJob(context.db, job.id, errorMessage);
		console.error(`[Jobs] Job ${job.id} error:`, error);
		return false;
	}
}

/**
 * Process multiple jobs until queue is empty or max jobs reached
 */
export async function processJobQueue(
	context: JobContext,
	maxJobs: number = 10
): Promise<number> {
	let processedCount = 0;

	for (let i = 0; i < maxJobs; i++) {
		const hasMore = await processNextJob(context);

		if (!hasMore) {
			break; // No more jobs
		}

		processedCount++;
	}

	return processedCount;
}

// ============================================================================
// Job Processors
// ============================================================================

/**
 * Calculate and store daily platform statistics
 */
async function processDailyStats(payload: any, context: JobContext): Promise<JobResult> {
	try {
		const date = payload.date || new Date().toISOString().split('T')[0];

		await calculateDailyStats(context.db, date);

		return {
			success: true,
			message: `Daily stats calculated for ${date}`,
			data: { date }
		};
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : 'Failed to calculate daily stats'
		};
	}
}

/**
 * Refresh cached data (KV cache warming)
 */
async function processCacheRefresh(payload: any, context: JobContext): Promise<JobResult> {
	try {
		if (!context.kv) {
			throw new Error('KV namespace not available');
		}

		const entityType = payload.entity_type;

		if (entityType === 'journey_stats') {
			// Refresh journey stats cache
			const journeys = await context.db
				.prepare(
					`SELECT DISTINCT journey_id FROM user_journeys
					WHERE status IN ('active', 'completed')
					LIMIT 50`
				)
				.all();

			for (const journey of journeys.results || []) {
				const journeyId = (journey as any).journey_id;

				// Recalculate and update cache
				const stats = await context.db
					.prepare(
						`SELECT
							COUNT(*) as total_enrollments,
							COUNT(CASE WHEN status = 'active' THEN 1 END) as active_enrollments,
							COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_enrollments,
							AVG(CASE
								WHEN status = 'completed' AND completed_at IS NOT NULL AND started_at IS NOT NULL
								THEN JULIANDAY(completed_at) - JULIANDAY(started_at)
							END) as avg_completion_time_days
						FROM user_journeys
						WHERE journey_id = ?`
					)
					.bind(journeyId)
					.first<JourneyCacheStats>();

				if (!stats) continue;

				// Update cache table
				await context.db
					.prepare(
						`INSERT OR REPLACE INTO journey_stats_cache
						(journey_id, total_enrollments, active_enrollments, completed_enrollments,
						 avg_completion_time_days, last_updated_at)
						VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
					)
					.bind(
						journeyId,
						stats.total_enrollments ?? 0,
						stats.active_enrollments ?? 0,
						stats.completed_enrollments ?? 0,
						stats.avg_completion_time_days ?? null
					)
					.run();
			}

			return {
				success: true,
				message: `Refreshed ${journeys.results?.length || 0} journey stats`,
				data: { count: journeys.results?.length || 0 }
			};
		} else if (entityType === 'mentor_stats') {
			// Refresh mentor stats cache
			const mentors = await context.db
				.prepare(
					`SELECT DISTINCT mentor_user_id FROM section_reviews
					WHERE status = 'completed'
					LIMIT 50`
				)
				.all();

			for (const mentor of mentors.results || []) {
				const mentorUserId = (mentor as any).mentor_user_id;

				// Recalculate stats - trigger will handle it
				const stats = await context.db
					.prepare(
						`SELECT
							COUNT(*) as total_reviews,
							COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_reviews,
							COUNT(CASE WHEN status IN ('pending', 'claimed') THEN 1 END) as pending_reviews,
							AVG(CASE
								WHEN status = 'completed' AND claimed_at IS NOT NULL AND completed_at IS NOT NULL
								THEN (JULIANDAY(completed_at) - JULIANDAY(claimed_at)) * 24
							END) as avg_review_time_hours,
							AVG(client_rating) as avg_rating
						FROM section_reviews
						WHERE mentor_user_id = ?`
					)
					.bind(mentorUserId)
					.first<MentorCacheStats>();

				if (!stats) continue;

				// Update cache table
				await context.db
					.prepare(
						`INSERT OR REPLACE INTO mentor_stats_cache
						(mentor_user_id, total_reviews, completed_reviews, pending_reviews,
						 avg_review_time_hours, avg_rating, last_updated_at)
						VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
					)
					.bind(
						mentorUserId,
						stats.total_reviews ?? 0,
						stats.completed_reviews ?? 0,
						stats.pending_reviews ?? 0,
						stats.avg_review_time_hours ?? null,
						stats.avg_rating ?? null
					)
					.run();
			}

			return {
				success: true,
				message: `Refreshed ${mentors.results?.length || 0} mentor stats`,
				data: { count: mentors.results?.length || 0 }
			};
		} else if (entityType === 'warm_cache') {
			// Warm up KV cache with popular content
			await warmUpCache(context.kv, context.db);

			return {
				success: true,
				message: 'Cache warmed up successfully'
			};
		} else {
			throw new Error(`Unknown entity type: ${entityType}`);
		}
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : 'Failed to refresh cache'
		};
	}
}

/**
 * Cleanup old data
 */
async function processCleanup(payload: any, context: JobContext): Promise<JobResult> {
	try {
		const cleanupType = payload.cleanup_type;
		const daysToKeep = payload.days_to_keep || 30;

		if (cleanupType === 'query_performance_log') {
			const deleted = await cleanupOldLogs(context.db, daysToKeep);

			return {
				success: true,
				message: `Cleaned up ${deleted} old query performance logs`,
				data: { deleted }
			};
		} else if (cleanupType === 'old_cache_entries') {
			const deleted = await cleanupOldCacheEntries(context.db, daysToKeep);

			return {
				success: true,
				message: `Cleaned up ${deleted} old cache entries`,
				data: { deleted }
			};
		} else if (cleanupType === 'failed_jobs') {
			// Delete failed jobs older than daysToKeep
			const result = await context.db
				.prepare(
					`DELETE FROM background_jobs
					WHERE status = 'failed'
						AND failed_at < datetime('now', '-' || ? || ' days')`
				)
				.bind(daysToKeep)
				.run();

			return {
				success: true,
				message: `Cleaned up ${result.meta.changes} old failed jobs`,
				data: { deleted: result.meta.changes }
			};
		} else if (cleanupType === 'completed_jobs') {
			// Delete completed jobs older than daysToKeep
			const result = await context.db
				.prepare(
					`DELETE FROM background_jobs
					WHERE status = 'completed'
						AND completed_at < datetime('now', '-' || ? || ' days')`
				)
				.bind(daysToKeep)
				.run();

			return {
				success: true,
				message: `Cleaned up ${result.meta.changes} old completed jobs`,
				data: { deleted: result.meta.changes }
			};
		} else {
			throw new Error(`Unknown cleanup type: ${cleanupType}`);
		}
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : 'Failed to cleanup data'
		};
	}
}

/**
 * Analyze performance metrics and generate insights
 */
async function processPerformanceAnalysis(payload: any, context: JobContext): Promise<JobResult> {
	try {
		const analysisType = payload.analysis_type;

		if (analysisType === 'slow_queries') {
			const thresholdMs = payload.threshold_ms || 100;

			// Get slow queries
			const slowQueries = await context.db
				.prepare(
					`SELECT
						query_name,
						COUNT(*) as execution_count,
						AVG(execution_time_ms) as avg_time_ms,
						MAX(execution_time_ms) as max_time_ms
					FROM query_performance_log
					WHERE recorded_at >= datetime('now', '-7 days')
					GROUP BY query_name
					HAVING AVG(execution_time_ms) > ?
					ORDER BY avg_time_ms DESC
					LIMIT 20`
				)
				.bind(thresholdMs)
				.all();

			// Update slow_query_summary table
			for (const query of slowQueries.results || []) {
				const q = query as any;

				await context.db
					.prepare(
						`INSERT OR REPLACE INTO slow_query_summary
						(query_name, avg_execution_time_ms, total_executions, last_executed_at, updated_at)
						VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
					)
					.bind(q.query_name, q.avg_time_ms, q.execution_count)
					.run();
			}

			return {
				success: true,
				message: `Analyzed ${slowQueries.results?.length || 0} slow queries`,
				data: {
					count: slowQueries.results?.length || 0,
					threshold_ms: thresholdMs
				}
			};
		} else if (analysisType === 'cache_efficiency') {
			// Analyze cache hit rates
			const cacheMetrics = await context.db
				.prepare(
					`SELECT
						cache_type,
						SUM(hits) as total_hits,
						SUM(misses) as total_misses,
						CAST(SUM(hits) AS REAL) / (SUM(hits) + SUM(misses)) as hit_rate
					FROM cache_metrics
					WHERE recorded_at >= datetime('now', '-7 days')
					GROUP BY cache_type`
				)
				.all();

			return {
				success: true,
				message: 'Cache efficiency analyzed',
				data: { metrics: cacheMetrics.results }
			};
		} else {
			throw new Error(`Unknown analysis type: ${analysisType}`);
		}
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : 'Failed to analyze performance'
		};
	}
}

/**
 * Generate reports (e.g., weekly performance report)
 */
async function processReportGeneration(payload: any, context: JobContext): Promise<JobResult> {
	try {
		const reportType = payload.report_type;

		if (reportType === 'weekly_performance') {
			// Get last 7 days of stats
			const stats = await context.db
				.prepare(
					`SELECT * FROM platform_stats_daily
					WHERE stat_date >= date('now', '-7 days')
					ORDER BY stat_date DESC`
				)
				.all();

			// Calculate week-over-week changes
			const thisWeek = stats.results?.[0] as any;
			const lastWeek = stats.results?.[7] as any;

			const report = {
				period: 'Last 7 days',
				total_users: thisWeek?.total_users || 0,
				active_users: thisWeek?.active_users || 0,
				new_users: thisWeek?.new_users || 0,
				growth_rate: lastWeek
					? ((thisWeek.total_users - lastWeek.total_users) / lastWeek.total_users) * 100
					: 0
			};

			return {
				success: true,
				message: 'Weekly performance report generated',
				data: report
			};
		} else {
			throw new Error(`Unknown report type: ${reportType}`);
		}
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : 'Failed to generate report'
		};
	}
}

/**
 * Export data to various formats
 */
async function processDataExport(payload: any, context: JobContext): Promise<JobResult> {
	try {
		const exportType = payload.export_type;
		const userId = payload.user_id;

		if (exportType === 'user_data') {
			// Export user's journey data
			const enrollments = await context.db
				.prepare(
					`SELECT j.name, ue.status, ue.enrolled_at, ue.completed_at
					FROM user_enrollments ue
					INNER JOIN journeys j ON ue.journey_id = j.id
					WHERE ue.user_id = ?`
				)
				.bind(userId)
				.all();

			const progressData = await context.db
				.prepare(
					`SELECT s.title, sp.status, sp.submitted_at, sp.completed_at
					FROM section_progress sp
					INNER JOIN sections s ON sp.section_id = s.id
					WHERE sp.user_id = ?`
				)
				.bind(userId)
				.all();

			return {
				success: true,
				message: 'User data exported',
				data: {
					enrollments: enrollments.results,
					progress: progressData.results
				}
			};
		} else {
			throw new Error(`Unknown export type: ${exportType}`);
		}
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : 'Failed to export data'
		};
	}
}

/**
 * Generate completion certificates
 */
async function processCertificateGeneration(
	payload: any,
	context: JobContext
): Promise<JobResult> {
	try {
		const userId = payload.user_id;
		const journeyId = payload.journey_id;

		// Verify journey is actually completed
		const enrollment = await context.db
			.prepare(
				`SELECT completed_at, started_at
				FROM user_journeys
				WHERE user_id = ? AND journey_id = ? AND status = 'completed'`
			)
			.bind(userId, journeyId)
			.first<JourneyCompletionRow>();

		if (!enrollment) {
			throw new Error('Journey not completed');
		}

		// Check if certificate already exists
		const existing = await context.db
			.prepare(
				`SELECT * FROM journey_certificates
				WHERE user_id = ? AND journey_id = ?`
			)
			.bind(userId, journeyId)
			.first();

		if (existing) {
			return {
				success: true,
				message: 'Certificate already exists',
				data: { certificate_id: (existing as any).certificate_id }
			};
		}

		// Generate certificate
		const certificateId = `CERT-${Date.now()}-${userId}-${journeyId}`;
		const verificationCode = Math.random().toString(36).substring(2, 18).toUpperCase();

		const completionTime = enrollment.completed_at && enrollment.started_at
			? Math.floor(
					(new Date(enrollment.completed_at).getTime() -
						new Date(enrollment.started_at).getTime()) /
						(1000 * 60 * 60 * 24)
				)
			: null;

		await context.db
			.prepare(
				`INSERT INTO journey_certificates
				(certificate_id, user_id, journey_id, completion_time_days, verification_code)
				VALUES (?, ?, ?, ?, ?)`
			)
			.bind(certificateId, userId, journeyId, completionTime, verificationCode)
			.run();

		return {
			success: true,
			message: 'Certificate generated successfully',
			data: {
				certificate_id: certificateId,
				verification_code: verificationCode
			}
		};
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : 'Failed to generate certificate'
		};
	}
}

// ============================================================================
// Scheduled Job Management
// ============================================================================

/**
 * Check and enqueue scheduled jobs that are due
 */
export async function processScheduledJobs(context: JobContext): Promise<number> {
	// Get jobs that are due to run
	const dueJobs = await context.db
		.prepare(
			`SELECT * FROM scheduled_jobs
			WHERE is_active = 1
				AND (next_run_at IS NULL OR next_run_at <= CURRENT_TIMESTAMP)`
		)
		.all();

	let enqueuedCount = 0;

	for (const scheduledJob of dueJobs.results || []) {
		const job = scheduledJob as any;

		// Parse payload template
		const payload = job.payload_template ? JSON.parse(job.payload_template) : {};

		// Enqueue the job
		await context.db
			.prepare(
				`INSERT INTO background_jobs (job_type, job_name, payload, priority)
				VALUES (?, ?, ?, 5)`
			)
			.bind(job.job_type, job.name, JSON.stringify(payload))
			.run();

		// Update last_run_at and calculate next_run_at
		// For now, just update last_run_at (cron parsing would go here)
		await context.db
			.prepare(
				`UPDATE scheduled_jobs
				SET last_run_at = CURRENT_TIMESTAMP,
					next_run_at = datetime(CURRENT_TIMESTAMP, '+1 day')
				WHERE id = ?`
			)
			.bind(job.id)
			.run();

		enqueuedCount++;
	}

	return enqueuedCount;
}
