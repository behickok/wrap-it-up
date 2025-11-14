-- Migration 0015: UX Enhancements (Phase 7)
-- Created: 2025-11-13
-- Description: Progress visualization, journey templates, customization, and accessibility features

-- ============================================================================
-- Phase 7.1: Progress Visualization & Achievements
-- ============================================================================

-- User milestones and achievements
CREATE TABLE IF NOT EXISTS user_milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    journey_id INTEGER,
    milestone_type TEXT NOT NULL, -- 'first_enrollment', 'section_complete', 'journey_complete', 'streak', 'review_received', etc.
    milestone_name TEXT NOT NULL,
    milestone_description TEXT,
    icon TEXT,
    color TEXT,
    metadata TEXT, -- JSON for additional data
    achieved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE SET NULL
);

CREATE INDEX idx_user_milestones_user ON user_milestones(user_id);
CREATE INDEX idx_user_milestones_journey ON user_milestones(journey_id);
CREATE INDEX idx_user_milestones_type ON user_milestones(milestone_type);
CREATE INDEX idx_user_milestones_date ON user_milestones(achieved_at);

-- Activity streaks tracking
CREATE TABLE IF NOT EXISTS user_activity_streaks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    total_active_days INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_activity_streaks_user ON user_activity_streaks(user_id);
CREATE INDEX idx_activity_streaks_current ON user_activity_streaks(current_streak DESC);

-- Journey completion certificates
CREATE TABLE IF NOT EXISTS journey_certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_journey_id INTEGER NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    journey_id INTEGER NOT NULL,
    certificate_id TEXT NOT NULL UNIQUE, -- UUID for verification
    issue_date DATE NOT NULL,
    completion_date DATE NOT NULL,
    completion_time_days INTEGER,
    final_score REAL, -- Overall score if applicable
    certificate_data TEXT, -- JSON with all certificate details
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_journey_id) REFERENCES user_journey_progress(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE
);

CREATE INDEX idx_certificates_user ON journey_certificates(user_id);
CREATE INDEX idx_certificates_journey ON journey_certificates(journey_id);
CREATE INDEX idx_certificates_id ON journey_certificates(certificate_id);
CREATE INDEX idx_certificates_date ON journey_certificates(issue_date);

-- ============================================================================
-- Phase 7.2: Journey Templates & Customization
-- ============================================================================

-- Journey templates for sharing/duplicating
CREATE TABLE IF NOT EXISTS journey_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    source_journey_id INTEGER NOT NULL,
    creator_user_id INTEGER NOT NULL,
    category TEXT, -- 'career', 'technical', 'personal', etc.
    is_public BOOLEAN DEFAULT 0,
    is_featured BOOLEAN DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    rating REAL DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    preview_image_url TEXT,
    tags TEXT, -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
    FOREIGN KEY (creator_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_journey_templates_creator ON journey_templates(creator_user_id);
CREATE INDEX idx_journey_templates_source ON journey_templates(source_journey_id);
CREATE INDEX idx_journey_templates_public ON journey_templates(is_public);
CREATE INDEX idx_journey_templates_featured ON journey_templates(is_featured);
CREATE INDEX idx_journey_templates_category ON journey_templates(category);
CREATE INDEX idx_journey_templates_downloads ON journey_templates(downloads DESC);
CREATE INDEX idx_journey_templates_rating ON journey_templates(rating DESC);

-- Template ratings/reviews
CREATE TABLE IF NOT EXISTS journey_template_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    rating INTEGER NOT NULL, -- 1-5
    review_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES journey_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(template_id, user_id),
    CHECK (rating >= 1 AND rating <= 5)
);

CREATE INDEX idx_template_reviews_template ON journey_template_reviews(template_id);
CREATE INDEX idx_template_reviews_user ON journey_template_reviews(user_id);
CREATE INDEX idx_template_reviews_rating ON journey_template_reviews(rating);

-- Journey versions for version control
CREATE TABLE IF NOT EXISTS journey_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journey_id INTEGER NOT NULL,
    version_number INTEGER NOT NULL,
    version_name TEXT,
    changes_summary TEXT,
    is_published BOOLEAN DEFAULT 0,
    snapshot_data TEXT NOT NULL, -- JSON snapshot of journey + sections
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE(journey_id, version_number)
);

CREATE INDEX idx_journey_versions_journey ON journey_versions(journey_id);
CREATE INDEX idx_journey_versions_published ON journey_versions(is_published);
CREATE INDEX idx_journey_versions_number ON journey_versions(journey_id, version_number DESC);

-- Add customization columns to journeys table
ALTER TABLE journeys ADD COLUMN theme_colors TEXT; -- JSON: {primary, secondary, accent, background}
ALTER TABLE journeys ADD COLUMN custom_font TEXT; -- Font family name
ALTER TABLE journeys ADD COLUMN logo_url TEXT; -- Cloudflare R2 URL
ALTER TABLE journeys ADD COLUMN banner_image_url TEXT; -- Header banner
ALTER TABLE journeys ADD COLUMN completion_message TEXT; -- Custom completion message
ALTER TABLE journeys ADD COLUMN show_progress_bar BOOLEAN DEFAULT 1;
ALTER TABLE journeys ADD COLUMN show_milestones BOOLEAN DEFAULT 1;
ALTER TABLE journeys ADD COLUMN certificate_enabled BOOLEAN DEFAULT 1;

-- ============================================================================
-- Phase 7.3: PWA & Mobile Support
-- ============================================================================

-- Push notification subscriptions (for PWA)
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    keys_auth TEXT NOT NULL,
    keys_p256dh TEXT NOT NULL,
    device_type TEXT, -- 'mobile', 'tablet', 'desktop'
    device_name TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_active ON push_subscriptions(is_active);
CREATE INDEX idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Offline sync queue (for PWA offline support)
CREATE TABLE IF NOT EXISTS offline_sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action_type TEXT NOT NULL, -- 'section_save', 'review_submit', etc.
    entity_type TEXT NOT NULL, -- 'section', 'review', etc.
    entity_id INTEGER,
    payload TEXT NOT NULL, -- JSON data
    status TEXT DEFAULT 'pending', -- 'pending', 'syncing', 'synced', 'failed'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    synced_at DATETIME,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_offline_sync_user ON offline_sync_queue(user_id);
CREATE INDEX idx_offline_sync_status ON offline_sync_queue(status);
CREATE INDEX idx_offline_sync_created ON offline_sync_queue(created_at);

-- ============================================================================
-- Phase 7.4: Accessibility Features
-- ============================================================================

-- User accessibility preferences
CREATE TABLE IF NOT EXISTS user_accessibility_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    high_contrast_mode BOOLEAN DEFAULT 0,
    font_size TEXT DEFAULT 'normal', -- 'small', 'normal', 'large', 'x-large'
    reduce_motion BOOLEAN DEFAULT 0,
    screen_reader_mode BOOLEAN DEFAULT 0,
    keyboard_navigation_hints BOOLEAN DEFAULT 1,
    focus_indicators_enhanced BOOLEAN DEFAULT 0,
    color_blind_mode TEXT, -- NULL, 'protanopia', 'deuteranopia', 'tritanopia'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_accessibility_prefs_user ON user_accessibility_preferences(user_id);

-- ============================================================================
-- Seed Data: Milestone Types
-- ============================================================================

-- Common milestones that will be automatically awarded
INSERT OR IGNORE INTO user_milestones (user_id, milestone_type, milestone_name, milestone_description, icon, color, achieved_at)
SELECT
    id as user_id,
    'account_created' as milestone_type,
    'Welcome Aboard!' as milestone_name,
    'Created your Wrap It Up account' as milestone_description,
    '🎉' as icon,
    '#3B82F6' as color,
    created_at as achieved_at
FROM users
WHERE id NOT IN (SELECT user_id FROM user_milestones WHERE milestone_type = 'account_created');

-- ============================================================================
-- Views for Progress Visualization
-- ============================================================================

-- View: User journey progress summary with completion percentage
CREATE VIEW IF NOT EXISTS user_journey_progress_summary AS
SELECT
    ujp.id as user_journey_id,
    ujp.user_id,
    ujp.journey_id,
    j.name as journey_name,
    j.slug as journey_slug,
    ujp.enrolled_at,
    ujp.completed_at,
    ujp.current_section_index,
    COUNT(DISTINCT s.id) as total_sections,
    COUNT(DISTINCT ups.section_id) as completed_sections,
    CAST(COUNT(DISTINCT ups.section_id) AS REAL) / NULLIF(COUNT(DISTINCT s.id), 0) * 100 as completion_percentage,
    CASE
        WHEN ujp.completed_at IS NOT NULL THEN 'completed'
        WHEN COUNT(DISTINCT ups.section_id) > 0 THEN 'in_progress'
        ELSE 'not_started'
    END as status
FROM user_journey_progress ujp
INNER JOIN journeys j ON ujp.journey_id = j.id
LEFT JOIN sections s ON j.id = s.journey_id AND s.is_active = 1
LEFT JOIN user_progress_sections ups ON ujp.id = ups.user_journey_id AND ups.completed_at IS NOT NULL
GROUP BY ujp.id, ujp.user_id, ujp.journey_id, j.name, j.slug, ujp.enrolled_at, ujp.completed_at, ujp.current_section_index;

-- View: User activity summary for streak tracking
CREATE VIEW IF NOT EXISTS user_activity_summary AS
SELECT
    u.id as user_id,
    u.username,
    COUNT(DISTINCT DATE(ae.created_at)) as total_active_days,
    MAX(DATE(ae.created_at)) as last_activity_date,
    COUNT(DISTINCT ujp.id) as total_journeys_enrolled,
    COUNT(DISTINCT CASE WHEN ujp.completed_at IS NOT NULL THEN ujp.id END) as total_journeys_completed,
    COUNT(DISTINCT um.id) as total_milestones
FROM users u
LEFT JOIN analytics_events ae ON u.id = ae.user_id
LEFT JOIN user_journey_progress ujp ON u.id = ujp.user_id
LEFT JOIN user_milestones um ON u.id = um.user_id
GROUP BY u.id, u.username;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Auto-update journey template rating when review added/updated
CREATE TRIGGER IF NOT EXISTS update_template_rating_on_review
AFTER INSERT ON journey_template_reviews
FOR EACH ROW
BEGIN
    UPDATE journey_templates
    SET rating = (
        SELECT AVG(rating) FROM journey_template_reviews WHERE template_id = NEW.template_id
    ),
    rating_count = (
        SELECT COUNT(*) FROM journey_template_reviews WHERE template_id = NEW.template_id
    )
    WHERE id = NEW.template_id;
END;

-- Update accessibility preferences timestamp
CREATE TRIGGER IF NOT EXISTS update_accessibility_prefs_timestamp
AFTER UPDATE ON user_accessibility_preferences
FOR EACH ROW
BEGIN
    UPDATE user_accessibility_preferences SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Auto-create activity streak record when user created
CREATE TRIGGER IF NOT EXISTS create_activity_streak_on_user
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO user_activity_streaks (user_id, last_activity_date)
    VALUES (NEW.id, DATE('now'));
END;

-- Update activity streak on analytics event
-- Note: This would ideally be done in application code for performance,
-- but included here for completeness
CREATE TRIGGER IF NOT EXISTS update_streak_on_activity
AFTER INSERT ON analytics_events
FOR EACH ROW
WHEN NEW.user_id IS NOT NULL
BEGIN
    INSERT OR REPLACE INTO user_activity_streaks (
        id,
        user_id,
        current_streak,
        longest_streak,
        last_activity_date,
        total_active_days,
        updated_at
    )
    SELECT
        COALESCE(uas.id, NULL),
        NEW.user_id,
        CASE
            -- If last activity was yesterday, increment streak
            WHEN DATE(uas.last_activity_date) = DATE('now', '-1 day') THEN uas.current_streak + 1
            -- If last activity was today, keep streak
            WHEN DATE(uas.last_activity_date) = DATE('now') THEN uas.current_streak
            -- Otherwise, reset to 1
            ELSE 1
        END as current_streak,
        MAX(
            uas.longest_streak,
            CASE
                WHEN DATE(uas.last_activity_date) = DATE('now', '-1 day') THEN uas.current_streak + 1
                WHEN DATE(uas.last_activity_date) = DATE('now') THEN uas.current_streak
                ELSE 1
            END
        ) as longest_streak,
        DATE('now') as last_activity_date,
        CASE
            WHEN DATE(uas.last_activity_date) = DATE('now') THEN uas.total_active_days
            ELSE uas.total_active_days + 1
        END as total_active_days,
        CURRENT_TIMESTAMP
    FROM (SELECT * FROM user_activity_streaks WHERE user_id = NEW.user_id LIMIT 1) uas;
END;

-- ============================================================================
-- Migration Complete
-- ============================================================================
