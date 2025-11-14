-- Migration: Phase 8 - Performance & Scale Optimization
-- Description: Database optimization, query profiling, background jobs, and caching infrastructure
-- Date: 2025-11-14

-- ============================================================================
-- 8.1: Database Optimization & Query Performance
-- ============================================================================

-- Query performance logging for profiling and optimization
CREATE TABLE IF NOT EXISTS query_performance_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query_name TEXT NOT NULL,
    execution_time_ms REAL NOT NULL,
    row_count INTEGER,
    query_hash TEXT, -- Hash of query for grouping
    user_id INTEGER,
    endpoint TEXT, -- Which API endpoint triggered this
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT, -- JSON: additional context
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_query_perf_name ON query_performance_log(query_name, recorded_at);
CREATE INDEX IF NOT EXISTS idx_query_perf_time ON query_performance_log(execution_time_ms DESC);
CREATE INDEX IF NOT EXISTS idx_query_perf_hash ON query_performance_log(query_hash, recorded_at);

-- Materialized view for slow query summary (updated via trigger or cron)
CREATE TABLE IF NOT EXISTS slow_query_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query_name TEXT NOT NULL UNIQUE,
    avg_execution_time_ms REAL NOT NULL,
    p50_execution_time_ms REAL,
    p95_execution_time_ms REAL,
    p99_execution_time_ms REAL,
    total_executions INTEGER DEFAULT 0,
    last_executed_at DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Database health metrics
CREATE TABLE IF NOT EXISTS db_health_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_type TEXT NOT NULL, -- 'table_size', 'index_usage', 'query_count'
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_db_health ON db_health_metrics(metric_type, metric_name, recorded_at);

-- ============================================================================
-- 8.2: Caching Infrastructure
-- ============================================================================

-- Cache metadata tracking (KV entries tracked here for monitoring)
CREATE TABLE IF NOT EXISTS cache_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cache_key TEXT NOT NULL UNIQUE,
    cache_type TEXT NOT NULL, -- 'kv', 'browser', 'api'
    entity_type TEXT, -- 'journey', 'section', 'mentor', etc.
    entity_id INTEGER,
    ttl_seconds INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at DATETIME,
    access_count INTEGER DEFAULT 0,
    invalidated_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_cache_key ON cache_entries(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_entity ON cache_entries(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_cache_type ON cache_entries(cache_type, invalidated_at);

-- Cache performance metrics
CREATE TABLE IF NOT EXISTS cache_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cache_type TEXT NOT NULL,
    hits INTEGER DEFAULT 0,
    misses INTEGER DEFAULT 0,
    hit_rate REAL, -- Calculated: hits / (hits + misses)
    avg_response_time_ms REAL,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cache_metrics ON cache_metrics(cache_type, recorded_at);

-- ============================================================================
-- 8.3: Background Job Processing
-- ============================================================================

-- Background jobs queue
CREATE TABLE IF NOT EXISTS background_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_type TEXT NOT NULL, -- 'daily_stats', 'report_generation', 'data_export', etc.
    job_name TEXT NOT NULL,
    payload TEXT, -- JSON data for job
    priority INTEGER DEFAULT 5, -- 1-10, lower = higher priority
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    scheduled_at DATETIME, -- When to run (NULL = ASAP)
    started_at DATETIME,
    completed_at DATETIME,
    failed_at DATETIME,
    error_message TEXT,
    result TEXT, -- JSON result data
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON background_jobs(status, priority, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON background_jobs(job_type, status);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled ON background_jobs(scheduled_at);

-- Job execution history (for analytics)
CREATE TABLE IF NOT EXISTS job_execution_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    execution_time_ms REAL NOT NULL,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES background_jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_job_history ON job_execution_history(job_id, executed_at);

-- Scheduled job definitions (cron-like)
CREATE TABLE IF NOT EXISTS scheduled_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    job_type TEXT NOT NULL,
    schedule TEXT NOT NULL, -- Cron expression or interval
    payload_template TEXT, -- JSON template
    is_active BOOLEAN DEFAULT 1,
    last_run_at DATETIME,
    next_run_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8.4: Performance Monitoring & Metrics
-- ============================================================================

-- Web vitals tracking (Core Web Vitals)
CREATE TABLE IF NOT EXISTS web_vitals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    metric_name TEXT NOT NULL, -- 'LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP'
    metric_value REAL NOT NULL,
    page_path TEXT NOT NULL,
    user_agent TEXT,
    connection_type TEXT, -- 'slow-2g', '2g', '3g', '4g'
    device_type TEXT, -- 'mobile', 'tablet', 'desktop'
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_web_vitals_metric ON web_vitals(metric_name, recorded_at);
CREATE INDEX IF NOT EXISTS idx_web_vitals_page ON web_vitals(page_path, metric_name);

-- API endpoint performance
CREATE TABLE IF NOT EXISTS api_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL, -- 'GET', 'POST', etc.
    response_time_ms REAL NOT NULL,
    status_code INTEGER NOT NULL,
    user_id INTEGER,
    error_message TEXT,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_api_perf ON api_performance(endpoint, recorded_at);
CREATE INDEX IF NOT EXISTS idx_api_perf_status ON api_performance(status_code, recorded_at);

-- Asset performance (images, scripts, etc.)
CREATE TABLE IF NOT EXISTS asset_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_url TEXT NOT NULL,
    asset_type TEXT NOT NULL, -- 'image', 'script', 'style', 'font'
    file_size_bytes INTEGER,
    load_time_ms REAL NOT NULL,
    cached BOOLEAN DEFAULT 0,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_asset_perf ON asset_performance(asset_type, recorded_at);

-- ============================================================================
-- Additional Indexes for Existing Tables (Based on Common Queries)
-- ============================================================================

-- User enrollments - frequently filtered by status and date
CREATE INDEX IF NOT EXISTS idx_enrollments_user_status ON user_enrollments(user_id, status, enrolled_at);
CREATE INDEX IF NOT EXISTS idx_enrollments_journey_status ON user_enrollments(journey_id, status);

-- Section progress - frequently joined with user and section
CREATE INDEX IF NOT EXISTS idx_section_progress_composite ON section_progress(user_id, section_id, status);

-- Section reviews - frequently filtered by status and dates
CREATE INDEX IF NOT EXISTS idx_reviews_mentor_status ON section_reviews(mentor_user_id, status, claimed_at);
CREATE INDEX IF NOT EXISTS idx_reviews_client_status ON section_reviews(client_user_id, status, created_at);

-- Analytics events - frequently aggregated by type and date
CREATE INDEX IF NOT EXISTS idx_analytics_composite ON analytics_events(event_type, user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_journey ON analytics_events(journey_id, event_type, created_at);

-- Mentor profiles - frequently sorted by rating
CREATE INDEX IF NOT EXISTS idx_mentor_rating ON mentor_profiles(average_rating DESC, total_reviews DESC);

-- Journey templates - frequently filtered and sorted
CREATE INDEX IF NOT EXISTS idx_templates_category ON journey_templates(category, is_public, average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_templates_featured ON journey_templates(is_featured, average_rating DESC);

-- User accessibility preferences - frequently joined with users
CREATE INDEX IF NOT EXISTS idx_accessibility_user ON user_accessibility_preferences(user_id);

-- Activity streaks - frequently queried by user
CREATE INDEX IF NOT EXISTS idx_streaks_user ON user_activity_streaks(user_id, current_streak DESC);

-- ============================================================================
-- Materialized Views for Expensive Queries
-- ============================================================================

-- Platform-wide statistics summary (updated daily via cron)
CREATE TABLE IF NOT EXISTS platform_stats_daily (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stat_date DATE NOT NULL UNIQUE,
    total_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    total_journeys INTEGER DEFAULT 0,
    active_journeys INTEGER DEFAULT 0,
    total_enrollments INTEGER DEFAULT 0,
    new_enrollments INTEGER DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    completed_reviews INTEGER DEFAULT 0,
    avg_review_time_hours REAL,
    total_mentors INTEGER DEFAULT 0,
    active_mentors INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Journey performance summary (updated hourly)
CREATE TABLE IF NOT EXISTS journey_stats_cache (
    journey_id INTEGER PRIMARY KEY,
    total_enrollments INTEGER DEFAULT 0,
    active_enrollments INTEGER DEFAULT 0,
    completed_enrollments INTEGER DEFAULT 0,
    avg_completion_time_days REAL,
    completion_rate REAL, -- Percentage
    total_sections INTEGER DEFAULT 0,
    avg_sections_completed REAL,
    total_reviews_requested INTEGER DEFAULT 0,
    avg_rating REAL,
    last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE
);

-- Mentor performance summary (updated hourly)
CREATE TABLE IF NOT EXISTS mentor_stats_cache (
    mentor_user_id INTEGER PRIMARY KEY,
    total_reviews INTEGER DEFAULT 0,
    completed_reviews INTEGER DEFAULT 0,
    pending_reviews INTEGER DEFAULT 0,
    avg_review_time_hours REAL,
    avg_rating REAL,
    total_clients INTEGER DEFAULT 0,
    active_clients INTEGER DEFAULT 0,
    revenue_total REAL DEFAULT 0,
    revenue_this_month REAL DEFAULT 0,
    last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mentor_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- Triggers for Auto-updating Cached Stats
-- ============================================================================

-- Update mentor stats cache when review is completed
CREATE TRIGGER IF NOT EXISTS update_mentor_stats_on_review
AFTER UPDATE ON section_reviews
FOR EACH ROW
WHEN NEW.status = 'completed' AND OLD.status != 'completed'
BEGIN
    INSERT OR REPLACE INTO mentor_stats_cache (
        mentor_user_id,
        total_reviews,
        completed_reviews,
        avg_review_time_hours,
        avg_rating,
        last_updated_at
    )
    SELECT
        NEW.mentor_user_id,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        AVG(CASE
            WHEN status = 'completed' AND claimed_at IS NOT NULL AND completed_at IS NOT NULL
            THEN (JULIANDAY(completed_at) - JULIANDAY(claimed_at)) * 24
        END) as avg_time,
        AVG(client_rating) as avg_rating,
        CURRENT_TIMESTAMP
    FROM section_reviews
    WHERE mentor_user_id = NEW.mentor_user_id;
END;

-- Update journey stats cache when enrollment status changes
CREATE TRIGGER IF NOT EXISTS update_journey_stats_on_enrollment
AFTER UPDATE ON user_enrollments
FOR EACH ROW
WHEN NEW.status != OLD.status
BEGIN
    INSERT OR REPLACE INTO journey_stats_cache (
        journey_id,
        total_enrollments,
        active_enrollments,
        completed_enrollments,
        avg_completion_time_days,
        completion_rate,
        last_updated_at
    )
    SELECT
        NEW.journey_id,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        AVG(CASE
            WHEN status = 'completed' AND completed_at IS NOT NULL AND enrolled_at IS NOT NULL
            THEN JULIANDAY(completed_at) - JULIANDAY(enrolled_at)
        END) as avg_days,
        CAST(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*) AS REAL) as rate,
        CURRENT_TIMESTAMP
    FROM user_enrollments
    WHERE journey_id = NEW.journey_id;
END;

-- Update cache entry access tracking
CREATE TRIGGER IF NOT EXISTS track_cache_access
AFTER UPDATE ON cache_entries
FOR EACH ROW
WHEN NEW.last_accessed_at != OLD.last_accessed_at
BEGIN
    UPDATE cache_entries
    SET access_count = access_count + 1
    WHERE id = NEW.id;
END;

-- ============================================================================
-- Performance Utility Views
-- ============================================================================

-- View for identifying slow queries
CREATE VIEW IF NOT EXISTS slow_queries_report AS
SELECT
    query_name,
    COUNT(*) as execution_count,
    AVG(execution_time_ms) as avg_time_ms,
    MAX(execution_time_ms) as max_time_ms,
    MIN(execution_time_ms) as min_time_ms,
    AVG(row_count) as avg_rows
FROM query_performance_log
WHERE recorded_at >= datetime('now', '-7 days')
GROUP BY query_name
HAVING AVG(execution_time_ms) > 100
ORDER BY avg_time_ms DESC;

-- View for cache performance summary
CREATE VIEW IF NOT EXISTS cache_performance_summary AS
SELECT
    cache_type,
    COUNT(*) as total_entries,
    COUNT(CASE WHEN invalidated_at IS NULL THEN 1 END) as active_entries,
    AVG(access_count) as avg_accesses,
    AVG(JULIANDAY('now') - JULIANDAY(created_at)) as avg_age_days
FROM cache_entries
GROUP BY cache_type;

-- View for job queue health
CREATE VIEW IF NOT EXISTS job_queue_health AS
SELECT
    job_type,
    COUNT(*) as total_jobs,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
    AVG(CASE
        WHEN status = 'completed' AND started_at IS NOT NULL AND completed_at IS NOT NULL
        THEN (JULIANDAY(completed_at) - JULIANDAY(started_at)) * 24 * 60 * 60 * 1000
    END) as avg_execution_time_ms
FROM background_jobs
WHERE created_at >= datetime('now', '-7 days')
GROUP BY job_type;

-- ============================================================================
-- Seed Data: Scheduled Jobs
-- ============================================================================

-- Daily statistics calculation
INSERT OR IGNORE INTO scheduled_jobs (name, job_type, schedule, payload_template, is_active, next_run_at)
VALUES (
    'Daily Platform Statistics',
    'daily_stats',
    '0 0 * * *', -- Every day at midnight
    '{"aggregate_period": "daily"}',
    1,
    datetime('now', '+1 day', 'start of day')
);

-- Hourly cache refresh for journey stats
INSERT OR IGNORE INTO scheduled_jobs (name, job_type, schedule, payload_template, is_active, next_run_at)
VALUES (
    'Refresh Journey Stats Cache',
    'cache_refresh',
    '0 * * * *', -- Every hour
    '{"entity_type": "journey_stats"}',
    1,
    datetime('now', '+1 hour', 'start of hour')
);

-- Hourly cache refresh for mentor stats
INSERT OR IGNORE INTO scheduled_jobs (name, job_type, schedule, payload_template, is_active, next_run_at)
VALUES (
    'Refresh Mentor Stats Cache',
    'cache_refresh',
    '0 * * * *', -- Every hour
    '{"entity_type": "mentor_stats"}',
    1,
    datetime('now', '+1 hour', 'start of hour')
);

-- Weekly slow query analysis
INSERT OR IGNORE INTO scheduled_jobs (name, job_type, schedule, payload_template, is_active, next_run_at)
VALUES (
    'Weekly Slow Query Analysis',
    'performance_analysis',
    '0 1 * * 0', -- Sunday at 1 AM
    '{"analysis_type": "slow_queries", "threshold_ms": 100}',
    1,
    datetime('now', 'weekday 0', '+1 week', '+1 hour')
);

-- Daily cache cleanup (remove invalidated entries older than 30 days)
INSERT OR IGNORE INTO scheduled_jobs (name, job_type, schedule, payload_template, is_active, next_run_at)
VALUES (
    'Daily Cache Cleanup',
    'cleanup',
    '0 2 * * *', -- Every day at 2 AM
    '{"cleanup_type": "old_cache_entries", "days_to_keep": 30}',
    1,
    datetime('now', '+1 day', 'start of day', '+2 hours')
);

-- Weekly performance log cleanup (keep only 30 days)
INSERT OR IGNORE INTO scheduled_jobs (name, job_type, schedule, payload_template, is_active, next_run_at)
VALUES (
    'Weekly Performance Log Cleanup',
    'cleanup',
    '0 3 * * 0', -- Sunday at 3 AM
    '{"cleanup_type": "query_performance_log", "days_to_keep": 30}',
    1,
    datetime('now', 'weekday 0', '+1 week', '+3 hours')
);

-- ============================================================================
-- Comments
-- ============================================================================

-- This migration adds comprehensive performance monitoring and optimization infrastructure:
-- 1. Query performance logging for identifying bottlenecks
-- 2. Cache infrastructure for KV and browser caching
-- 3. Background job system for async processing
-- 4. Web vitals tracking for frontend performance
-- 5. Materialized views and indexes for query optimization
-- 6. Automated triggers for keeping stats up-to-date
-- 7. Scheduled jobs for maintenance and analytics

-- All features use only Cloudflare D1 and native browser APIs - no external services required.
