-- Migration 0013: Analytics & Insights System
-- Purpose: Enable comprehensive analytics for creators, mentors, and platform admins
-- Phase: Phase 5 - Analytics & Insights Dashboard
-- Date: 2025-11-13
-- Dependencies: Phase 4 Complete (Mentor Review System)

-- =======================
-- CLEANUP LEGACY ANALYTICS STRUCTURES (from prior phases)
-- =======================

DROP TABLE IF EXISTS analytics_events;
DROP TABLE IF EXISTS journey_analytics;
DROP TABLE IF EXISTS section_analytics;

-- =======================
-- ANALYTICS EVENTS
-- =======================

-- Track all user actions and platform events for analytics
CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Event details
    event_type TEXT NOT NULL, -- page_view, journey_view, enrollment, section_start, section_complete, review_request, review_complete, mentor_application, login, etc.
    event_category TEXT, -- user_action, system_event, mentor_activity, creator_activity

    -- Context
    user_id INTEGER,
    journey_id INTEGER,
    section_id INTEGER,
    session_id TEXT, -- Browser session tracking

    -- Additional data
    metadata TEXT, -- JSON for flexible event data
    page_url TEXT,
    referrer_url TEXT,
    user_agent TEXT,

    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (journey_id) REFERENCES journeys(id),
    FOREIGN KEY (section_id) REFERENCES sections(id)
);

-- Indexes for fast event querying
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_date ON analytics_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_journey ON analytics_events(journey_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category ON analytics_events(event_category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_date ON analytics_events(created_at);

-- =======================
-- DAILY STATISTICS
-- =======================

-- Pre-computed daily statistics for performance optimization
CREATE TABLE IF NOT EXISTS daily_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stat_date DATE NOT NULL UNIQUE,

    -- User metrics
    new_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    returning_users INTEGER DEFAULT 0,

    -- Journey metrics
    journey_views INTEGER DEFAULT 0,
    new_enrollments INTEGER DEFAULT 0,
    active_journeys INTEGER DEFAULT 0,
    completed_journeys INTEGER DEFAULT 0,

    -- Section metrics
    sections_started INTEGER DEFAULT 0,
    sections_completed INTEGER DEFAULT 0,

    -- Mentor metrics
    reviews_requested INTEGER DEFAULT 0,
    reviews_claimed INTEGER DEFAULT 0,
    reviews_completed INTEGER DEFAULT 0,
    mentor_applications INTEGER DEFAULT 0,

    -- Session metrics
    sessions_booked INTEGER DEFAULT 0,
    sessions_completed INTEGER DEFAULT 0,

    -- Revenue metrics (manual tracking until Stripe integration)
    revenue_total REAL DEFAULT 0,
    revenue_subscriptions REAL DEFAULT 0,
    revenue_reviews REAL DEFAULT 0,
    revenue_sessions REAL DEFAULT 0,

    -- Engagement metrics
    avg_session_duration_seconds INTEGER DEFAULT 0,
    total_page_views INTEGER DEFAULT 0,
    unique_page_views INTEGER DEFAULT 0,

    -- Churn/Retention
    churned_users INTEGER DEFAULT 0,
    paused_journeys INTEGER DEFAULT 0,
    cancelled_journeys INTEGER DEFAULT 0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(stat_date);

-- =======================
-- SYSTEM METRICS
-- =======================

-- Track system health and performance metrics
CREATE TABLE IF NOT EXISTS system_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Metric details
    metric_name TEXT NOT NULL, -- db_size, active_users_dau, active_users_wau, active_users_mau, error_rate, avg_response_time, etc.
    metric_category TEXT, -- performance, business, engagement, technical
    metric_value REAL NOT NULL,
    metric_unit TEXT, -- bytes, count, percentage, milliseconds, etc.

    -- Context
    metadata TEXT, -- JSON for additional context

    -- Timestamps
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_name_time ON system_metrics(metric_name, recorded_at);
CREATE INDEX IF NOT EXISTS idx_system_metrics_category ON system_metrics(metric_category);

-- =======================
-- JOURNEY ANALYTICS
-- =======================

-- Aggregate analytics per journey for creator dashboards
CREATE TABLE IF NOT EXISTS journey_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journey_id INTEGER NOT NULL,
    stat_date DATE NOT NULL,

    -- Visibility metrics
    views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,

    -- Conversion metrics
    enrollments INTEGER DEFAULT 0,
    conversion_rate REAL DEFAULT 0, -- enrollments / views

    -- Engagement metrics
    active_users INTEGER DEFAULT 0,
    sections_completed INTEGER DEFAULT 0,
    avg_progress_percentage REAL DEFAULT 0,

    -- Completion metrics
    completions INTEGER DEFAULT 0,
    completion_rate REAL DEFAULT 0, -- completions / enrollments
    avg_completion_days INTEGER DEFAULT 0,

    -- Review metrics (for Guided tier)
    reviews_requested INTEGER DEFAULT 0,
    reviews_completed INTEGER DEFAULT 0,
    avg_review_rating REAL DEFAULT 0,

    -- Session metrics (for Premium tier)
    sessions_booked INTEGER DEFAULT 0,
    sessions_completed INTEGER DEFAULT 0,

    -- Revenue metrics
    revenue REAL DEFAULT 0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (journey_id) REFERENCES journeys(id),
    UNIQUE(journey_id, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_journey_analytics_journey ON journey_analytics(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_analytics_date ON journey_analytics(stat_date);
CREATE INDEX IF NOT EXISTS idx_journey_analytics_journey_date ON journey_analytics(journey_id, stat_date);

-- =======================
-- MENTOR ANALYTICS
-- =======================

-- Aggregate analytics per mentor for performance tracking
CREATE TABLE IF NOT EXISTS mentor_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mentor_user_id INTEGER NOT NULL,
    stat_date DATE NOT NULL,

    -- Activity metrics
    reviews_claimed INTEGER DEFAULT 0,
    reviews_completed INTEGER DEFAULT 0,
    reviews_in_progress INTEGER DEFAULT 0,

    -- Performance metrics
    avg_turnaround_hours REAL DEFAULT 0,
    avg_response_hours REAL DEFAULT 0, -- Time to claim review

    -- Quality metrics
    avg_rating REAL DEFAULT 0,
    avg_helpfulness_rating REAL DEFAULT 0,
    avg_timeliness_rating REAL DEFAULT 0,
    avg_communication_rating REAL DEFAULT 0,
    ratings_count INTEGER DEFAULT 0,

    -- Client satisfaction
    approval_rate REAL DEFAULT 0, -- % of reviews approved without changes
    revision_rate REAL DEFAULT 0, -- % requiring changes

    -- Earnings
    earnings_total REAL DEFAULT 0,
    earnings_from_reviews REAL DEFAULT 0,
    earnings_from_revenue_share REAL DEFAULT 0,

    -- Availability
    available_hours INTEGER DEFAULT 0,
    utilized_hours REAL DEFAULT 0,
    utilization_rate REAL DEFAULT 0, -- utilized / available

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (mentor_user_id) REFERENCES users(id),
    UNIQUE(mentor_user_id, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_mentor_analytics_mentor ON mentor_analytics(mentor_user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_analytics_date ON mentor_analytics(stat_date);
CREATE INDEX IF NOT EXISTS idx_mentor_analytics_mentor_date ON mentor_analytics(mentor_user_id, stat_date);

-- =======================
-- USER ENGAGEMENT METRICS
-- =======================

-- Track individual user engagement patterns
CREATE TABLE IF NOT EXISTS user_engagement_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    metric_date DATE NOT NULL,

    -- Activity metrics
    login_count INTEGER DEFAULT 0,
    sessions_count INTEGER DEFAULT 0,
    total_time_minutes INTEGER DEFAULT 0,
    pages_viewed INTEGER DEFAULT 0,

    -- Journey progress
    sections_viewed INTEGER DEFAULT 0,
    sections_started INTEGER DEFAULT 0,
    sections_completed INTEGER DEFAULT 0,

    -- Interaction metrics
    reviews_requested INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,

    -- Engagement score (0-100)
    engagement_score REAL DEFAULT 0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_user_engagement_user ON user_engagement_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_engagement_date ON user_engagement_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_user_engagement_score ON user_engagement_metrics(engagement_score);

-- =======================
-- FUNNEL ANALYTICS
-- =======================

-- Track conversion funnels for journey enrollment and completion
CREATE TABLE IF NOT EXISTS funnel_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journey_id INTEGER NOT NULL,
    stat_date DATE NOT NULL,

    -- Funnel stages (cumulative counts)
    stage_1_views INTEGER DEFAULT 0, -- Journey page viewed
    stage_2_view_sections INTEGER DEFAULT 0, -- Viewed sections/details
    stage_3_enroll INTEGER DEFAULT 0, -- Started enrollment
    stage_4_complete_profile INTEGER DEFAULT 0, -- Completed profile/payment
    stage_5_active INTEGER DEFAULT 0, -- Started first section
    stage_6_halfway INTEGER DEFAULT 0, -- Completed 50% of sections
    stage_7_completed INTEGER DEFAULT 0, -- Completed journey

    -- Conversion rates (percentages)
    conversion_view_to_enroll REAL DEFAULT 0,
    conversion_enroll_to_active REAL DEFAULT 0,
    conversion_active_to_complete REAL DEFAULT 0,
    overall_conversion_rate REAL DEFAULT 0,

    -- Drop-off analysis
    dropoff_stage_1_2 INTEGER DEFAULT 0,
    dropoff_stage_2_3 INTEGER DEFAULT 0,
    dropoff_stage_3_4 INTEGER DEFAULT 0,
    dropoff_stage_4_5 INTEGER DEFAULT 0,
    dropoff_stage_5_6 INTEGER DEFAULT 0,
    dropoff_stage_6_7 INTEGER DEFAULT 0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (journey_id) REFERENCES journeys(id),
    UNIQUE(journey_id, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_funnel_analytics_journey ON funnel_analytics(journey_id);
CREATE INDEX IF NOT EXISTS idx_funnel_analytics_date ON funnel_analytics(stat_date);

-- =======================
-- SECTION ANALYTICS
-- =======================

-- Track performance of individual sections
CREATE TABLE IF NOT EXISTS section_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id INTEGER NOT NULL,
    journey_id INTEGER NOT NULL,
    stat_date DATE NOT NULL,

    -- Usage metrics
    views INTEGER DEFAULT 0,
    starts INTEGER DEFAULT 0,
    completions INTEGER DEFAULT 0,

    -- Performance metrics
    completion_rate REAL DEFAULT 0,
    avg_completion_time_minutes INTEGER DEFAULT 0,
    abandon_rate REAL DEFAULT 0,

    -- Review metrics
    reviews_requested INTEGER DEFAULT 0,
    avg_review_rating REAL DEFAULT 0,

    -- Common issues (for improvement)
    revision_requests INTEGER DEFAULT 0,
    help_requests INTEGER DEFAULT 0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (section_id) REFERENCES sections(id),
    FOREIGN KEY (journey_id) REFERENCES journeys(id),
    UNIQUE(section_id, journey_id, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_section_analytics_section ON section_analytics(section_id);
CREATE INDEX IF NOT EXISTS idx_section_analytics_journey ON section_analytics(journey_id);
CREATE INDEX IF NOT EXISTS idx_section_analytics_date ON section_analytics(stat_date);

-- =======================
-- VIEWS FOR ANALYTICS DASHBOARDS
-- =======================

-- Creator dashboard: Journey performance summary
CREATE VIEW IF NOT EXISTS v_creator_journey_stats AS
SELECT
    j.id as journey_id,
    j.name as journey_name,
    j.slug as journey_slug,
    COUNT(DISTINCT uj.user_id) as total_enrollments,
    COUNT(DISTINCT CASE WHEN uj.status = 'active' THEN uj.user_id END) as active_users,
    COUNT(DISTINCT CASE WHEN uj.status = 'completed' THEN uj.user_id END) as completed_users,
    COUNT(DISTINCT sr.id) as total_reviews,
    AVG(mr.overall_rating) as avg_review_rating,
    SUM(mt.mentor_amount) as total_mentor_earnings
FROM journeys j
LEFT JOIN user_journeys uj ON j.id = uj.journey_id
LEFT JOIN section_reviews sr ON uj.id = sr.user_journey_id
LEFT JOIN mentor_ratings mr ON sr.id = mr.section_review_id
LEFT JOIN mentor_transactions mt ON j.id = mt.journey_id
GROUP BY j.id, j.name, j.slug;

-- Mentor dashboard: Performance overview
CREATE VIEW IF NOT EXISTS v_mentor_performance_stats AS
SELECT
    mp.user_id as mentor_user_id,
    u.username as mentor_username,
    mp.total_reviews,
    mp.completed_reviews,
    mp.average_rating,
    mp.average_turnaround_hours,
    mp.total_earnings,
    COUNT(DISTINCT CASE WHEN sr.status = 'in_review' THEN sr.id END) as in_progress_reviews,
    COUNT(DISTINCT CASE WHEN sr.status = 'requested' THEN sr.id END) as pending_reviews,
    COUNT(DISTINCT jm.journey_id) as assigned_journeys
FROM mentor_profiles mp
JOIN users u ON mp.user_id = u.id
LEFT JOIN section_reviews sr ON mp.user_id = sr.mentor_user_id
LEFT JOIN journey_mentors jm ON mp.user_id = jm.mentor_user_id AND jm.status = 'active'
GROUP BY mp.user_id, u.username, mp.total_reviews, mp.completed_reviews,
         mp.average_rating, mp.average_turnaround_hours, mp.total_earnings;

-- Platform admin: System overview
CREATE VIEW IF NOT EXISTS v_platform_overview AS
SELECT
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM users WHERE created_at >= date('now', '-7 days')) as new_users_7d,
    (SELECT COUNT(*) FROM users WHERE created_at >= date('now', '-30 days')) as new_users_30d,
    (SELECT COUNT(*) FROM journeys WHERE is_active = 1) as active_journeys,
    (SELECT COUNT(DISTINCT user_id) FROM user_journeys WHERE status = 'active') as active_journey_users,
    (SELECT COUNT(*) FROM mentor_profiles WHERE is_active = 1) as active_mentors,
    (SELECT COUNT(*) FROM section_reviews WHERE status IN ('requested', 'in_review')) as pending_reviews,
    (SELECT SUM(total_earnings) FROM mentor_profiles) as total_mentor_earnings,
    (SELECT COUNT(*) FROM section_reviews WHERE reviewed_at >= date('now', '-7 days')) as reviews_completed_7d;

-- Journey engagement: Daily active users per journey
CREATE VIEW IF NOT EXISTS v_journey_daily_engagement AS
SELECT
    j.id as journey_id,
    j.name as journey_name,
    date(ae.created_at) as activity_date,
    COUNT(DISTINCT ae.user_id) as daily_active_users,
    COUNT(*) as total_events
FROM journeys j
JOIN analytics_events ae ON j.id = ae.journey_id
WHERE ae.event_category IN ('user_action', 'mentor_activity')
GROUP BY j.id, j.name, date(ae.created_at);

-- =======================
-- HELPER FUNCTIONS (via TRIGGERS for auto-calculations)
-- =======================

-- Update journey_analytics when analytics_events are inserted
CREATE TRIGGER IF NOT EXISTS trg_update_journey_analytics_on_event
AFTER INSERT ON analytics_events
WHEN NEW.event_type IN ('journey_view', 'enrollment', 'section_complete')
BEGIN
    INSERT INTO journey_analytics (journey_id, stat_date, views, enrollments, sections_completed)
    VALUES (
        NEW.journey_id,
        date(NEW.created_at),
        CASE WHEN NEW.event_type = 'journey_view' THEN 1 ELSE 0 END,
        CASE WHEN NEW.event_type = 'enrollment' THEN 1 ELSE 0 END,
        CASE WHEN NEW.event_type = 'section_complete' THEN 1 ELSE 0 END
    )
    ON CONFLICT(journey_id, stat_date) DO UPDATE SET
        views = views + CASE WHEN NEW.event_type = 'journey_view' THEN 1 ELSE 0 END,
        enrollments = enrollments + CASE WHEN NEW.event_type = 'enrollment' THEN 1 ELSE 0 END,
        sections_completed = sections_completed + CASE WHEN NEW.event_type = 'section_complete' THEN 1 ELSE 0 END,
        updated_at = CURRENT_TIMESTAMP;
END;

-- =======================
-- COMMENTS FOR DOCUMENTATION
-- =======================

-- This analytics system is designed for:
-- 1. Real-time event tracking via analytics_events table
-- 2. Pre-computed daily aggregations for performance
-- 3. Role-specific analytics (creator, mentor, admin)
-- 4. Flexible querying without external analytics services
-- 5. Privacy-focused (all data in D1, no third-party tracking)

-- Future enhancements (later phases):
-- - Integration with email notification events (Phase 10)
-- - Payment processing analytics (Phase 10)
-- - Advanced ML-based insights (future)
-- - Real-time dashboard updates via WebSocket (Phase 9)
