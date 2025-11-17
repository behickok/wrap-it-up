/**
 * Performance Dashboard
 * Phase 8: Admin dashboard for monitoring platform performance
 */

import type { PageServerLoad } from './$types';
import {
	getSlowQueries,
	getCacheMetrics,
	getJobQueueHealth,
	getWebVitalsSummary,
	getApiPerformanceSummary,
	getPlatformStats
} from '$lib/server/performance';

export const load: PageServerLoad = async ({ locals, platform }) => {
	requireAdmin({ locals });

	const db = platform?.env?.DB;
	if (!db) {
		throw new Error('Database not available');
	}

	// Get various performance metrics
	const [
		slowQueries,
		cacheMetrics,
		jobQueueHealth,
		webVitals,
		apiPerformance,
		platformStats,
		recentQueryLogs,
		cachePerformance
	] = await Promise.all([
		// Slow queries (avg > 100ms)
		getSlowQueries(db, 100, 20),

		// Cache metrics
		getCacheMetrics(db),

		// Job queue health
		getJobQueueHealth(db),

		// Web vitals summary
		getWebVitalsSummary(db, undefined, 7),

		// API performance summary
		getApiPerformanceSummary(db, undefined, 7),

		// Platform stats (today)
		getPlatformStats(db),

		// Recent slow query logs
		db
			.prepare(
				`SELECT query_name, execution_time_ms, row_count, endpoint, recorded_at
				FROM query_performance_log
				WHERE execution_time_ms > 100
					AND recorded_at >= datetime('now', '-24 hours')
				ORDER BY execution_time_ms DESC
				LIMIT 50`
			)
			.all(),

		// Cache performance over time
		db
			.prepare(
				`SELECT
					cache_type,
					DATE(recorded_at) as date,
					SUM(hits) as hits,
					SUM(misses) as misses,
					AVG(hit_rate) as hit_rate
				FROM cache_metrics
				WHERE recorded_at >= datetime('now', '-7 days')
				GROUP BY cache_type, DATE(recorded_at)
				ORDER BY date DESC, cache_type`
			)
			.all()
	]);

	// Get database size estimate
	const dbStats = await db
		.prepare(
			`SELECT
				(SELECT COUNT(*) FROM analytics_events) as total_events,
				(SELECT COUNT(*) FROM query_performance_log) as total_query_logs,
				(SELECT COUNT(*) FROM web_vitals) as total_web_vitals,
				(SELECT COUNT(*) FROM cache_entries) as total_cache_entries,
				(SELECT COUNT(*) FROM background_jobs) as total_jobs`
		)
		.first();

	// Calculate Core Web Vitals scores
	const webVitalsScores = calculateWebVitalsScores(webVitals);

	return {
		slowQueries,
		cacheMetrics,
		jobQueueHealth,
		webVitals,
		webVitalsScores,
		apiPerformance: apiPerformance || [],
		platformStats,
		recentQueryLogs: recentQueryLogs.results || [],
		cachePerformance: cachePerformance.results || [],
		dbStats
	};
};

/**
 * Calculate Core Web Vitals scores based on Google's thresholds
 */
function calculateWebVitalsScores(vitals: any[]): Record<string, any> {
	const scores: Record<string, any> = {};

	const thresholds = {
		LCP: { good: 2500, poor: 4000 }, // milliseconds
		FID: { good: 100, poor: 300 },
		CLS: { good: 0.1, poor: 0.25 },
		FCP: { good: 1800, poor: 3000 },
		TTFB: { good: 800, poor: 1800 },
		INP: { good: 200, poor: 500 }
	};

	for (const vital of vitals) {
		const metricName = vital.metric_name;
		const avgValue = vital.avg_value;
		const threshold = thresholds[metricName as keyof typeof thresholds];

		if (!threshold) continue;

		let rating: 'good' | 'needs-improvement' | 'poor';
		if (avgValue <= threshold.good) {
			rating = 'good';
		} else if (avgValue <= threshold.poor) {
			rating = 'needs-improvement';
		} else {
			rating = 'poor';
		}

		scores[metricName] = {
			value: avgValue,
			rating,
			threshold,
			sampleCount: vital.sample_count,
			deviceType: vital.device_type,
			connectionType: vital.connection_type
		};
	}

	return scores;
}
import { requireAdmin } from '../-guards.server';
