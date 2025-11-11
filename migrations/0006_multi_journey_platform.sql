-- Migration: 0006_multi_journey_platform
-- Description: Add support for multiple journeys, service tiers, and mentor system
-- Date: 2025-11-11

-- ============================================================================
-- JOURNEY SYSTEM TABLES
-- ============================================================================

-- Core journey definitions (e.g., Care, Wedding, Baby, Move, Health)
CREATE TABLE IF NOT EXISTS journeys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT, -- emoji or icon name
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Categories within a journey (e.g., Plan, Care, Connect, Support, Legacy)
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Link categories to specific journeys with ordering
CREATE TABLE IF NOT EXISTS journey_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journey_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(journey_id, category_id)
);

-- Section definitions (reusable across journeys)
CREATE TABLE IF NOT EXISTS sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    scoring_type TEXT DEFAULT 'field_count' CHECK(scoring_type IN ('field_count', 'list_items', 'custom')),
    weight INTEGER DEFAULT 5, -- default weight for scoring
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Link sections to journeys with category and ordering
CREATE TABLE IF NOT EXISTS journey_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journey_id INTEGER NOT NULL,
    section_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT 0,
    weight_override INTEGER, -- journey-specific weight override
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(journey_id, section_id)
);

-- ============================================================================
-- SERVICE TIER TABLES
-- ============================================================================

-- Service tier definitions (Essentials, Guided, Premium)
CREATE TABLE IF NOT EXISTS service_tiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly REAL DEFAULT 0,
    price_annual REAL DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    features_json TEXT, -- JSON array of feature descriptions
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Feature flags per tier
CREATE TABLE IF NOT EXISTS tier_features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tier_id INTEGER NOT NULL,
    feature_key TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT 1,
    config_json TEXT, -- optional JSON config for the feature
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tier_id) REFERENCES service_tiers(id) ON DELETE CASCADE,
    UNIQUE(tier_id, feature_key)
);

-- ============================================================================
-- USER JOURNEY SUBSCRIPTION TABLES
-- ============================================================================

-- User's subscribed journeys with their tier
CREATE TABLE IF NOT EXISTS user_journeys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    journey_id INTEGER NOT NULL,
    tier_id INTEGER NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'completed', 'cancelled')),
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
    FOREIGN KEY (tier_id) REFERENCES service_tiers(id),
    UNIQUE(user_id, journey_id)
);

-- Track progress per section within a user's journey
CREATE TABLE IF NOT EXISTS user_journey_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_journey_id INTEGER NOT NULL,
    section_id INTEGER NOT NULL,
    score REAL DEFAULT 0,
    is_completed BOOLEAN DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_journey_id) REFERENCES user_journeys(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    UNIQUE(user_journey_id, section_id)
);

-- ============================================================================
-- MENTOR SYSTEM TABLES
-- ============================================================================

-- Mentor profiles (users who can be mentors)
CREATE TABLE IF NOT EXISTS mentors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    bio TEXT,
    expertise_areas TEXT, -- comma-separated or JSON array of journey types
    hourly_rate REAL DEFAULT 0,
    is_available BOOLEAN DEFAULT 1,
    availability_json TEXT, -- JSON object with calendar availability
    rating_average REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Link mentors to specific journeys they can guide
CREATE TABLE IF NOT EXISTS mentor_journeys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mentor_id INTEGER NOT NULL,
    journey_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE CASCADE,
    FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
    UNIQUE(mentor_id, journey_id)
);

-- Review requests (Guided tier feature)
CREATE TABLE IF NOT EXISTS mentor_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_journey_id INTEGER NOT NULL,
    section_id INTEGER NOT NULL,
    mentor_id INTEGER,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'assigned', 'in_review', 'completed', 'cancelled')),
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    assigned_at DATETIME,
    completed_at DATETIME,
    feedback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_journey_id) REFERENCES user_journeys(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE SET NULL
);

-- Review comments thread
CREATE TABLE IF NOT EXISTS review_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    is_mentor BOOLEAN DEFAULT 0,
    comment TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES mentor_reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Concierge session bookings (Premium tier feature)
CREATE TABLE IF NOT EXISTS mentor_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_journey_id INTEGER NOT NULL,
    mentor_id INTEGER NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    scheduled_at DATETIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    meeting_link TEXT,
    prep_notes TEXT,
    session_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_journey_id) REFERENCES user_journeys(id) ON DELETE CASCADE,
    FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE CASCADE
);

-- Session ratings/feedback from users
CREATE TABLE IF NOT EXISTS session_ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL UNIQUE,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES mentor_sessions(id) ON DELETE CASCADE
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_journeys_slug ON journeys(slug);
CREATE INDEX IF NOT EXISTS idx_journeys_active ON journeys(is_active);

CREATE INDEX IF NOT EXISTS idx_journey_categories_journey ON journey_categories(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_sections_journey ON journey_sections(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_sections_category ON journey_sections(category_id);

CREATE INDEX IF NOT EXISTS idx_user_journeys_user ON user_journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journeys_status ON user_journeys(status);
CREATE INDEX IF NOT EXISTS idx_user_journey_progress_journey ON user_journey_progress(user_journey_id);

CREATE INDEX IF NOT EXISTS idx_mentors_user ON mentors(user_id);
CREATE INDEX IF NOT EXISTS idx_mentors_available ON mentors(is_available);

CREATE INDEX IF NOT EXISTS idx_mentor_reviews_journey ON mentor_reviews(user_journey_id);
CREATE INDEX IF NOT EXISTS idx_mentor_reviews_mentor ON mentor_reviews(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_reviews_status ON mentor_reviews(status);

CREATE INDEX IF NOT EXISTS idx_mentor_sessions_journey ON mentor_sessions(user_journey_id);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_mentor ON mentor_sessions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_scheduled ON mentor_sessions(scheduled_at);
