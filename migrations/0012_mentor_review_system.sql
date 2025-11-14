-- Migration 0012: Mentor Review System
-- Purpose: Enable mentor-guided journey reviews (Guided tier)
-- Date: 2025-11-13

-- =======================
-- CLEANUP LEGACY TABLES (from 0006)
-- =======================

-- Legacy mentor review comments stored review_id references.
-- The new schema uses section_review_id and additional metadata,
-- so we drop the old table to avoid column conflicts when re-creating it.
DROP TABLE IF EXISTS review_comments;

-- =======================
-- MENTOR APPLICATIONS
-- =======================

-- Mentor application submissions
CREATE TABLE IF NOT EXISTS mentor_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    bio TEXT,
    expertise TEXT, -- Comma-separated or JSON array of expertise areas
    experience_years INTEGER,
    education TEXT,
    certifications TEXT,
    why_mentor TEXT, -- Why they want to be a mentor
    sample_feedback TEXT, -- Sample of their feedback style
    availability_hours INTEGER, -- Hours per week available
    hourly_rate REAL, -- Desired hourly rate
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    reviewed_by INTEGER, -- Admin/Creator who reviewed
    rejection_reason TEXT,
    notes TEXT, -- Internal admin notes
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

CREATE INDEX idx_mentor_applications_user ON mentor_applications(user_id);
CREATE INDEX idx_mentor_applications_status ON mentor_applications(status);

-- =======================
-- MENTOR PROFILES
-- =======================

-- Approved mentor profiles
CREATE TABLE IF NOT EXISTS mentor_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    bio TEXT NOT NULL,
    expertise TEXT, -- JSON array of expertise areas
    experience_years INTEGER DEFAULT 0,
    education TEXT,
    certifications TEXT,
    availability_hours INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT 1,
    is_featured BOOLEAN DEFAULT 0,
    profile_image_url TEXT,
    timezone TEXT DEFAULT 'America/New_York',
    languages TEXT, -- JSON array of languages spoken

    -- Stats (calculated)
    total_reviews INTEGER DEFAULT 0,
    completed_reviews INTEGER DEFAULT 0,
    average_rating REAL DEFAULT 0.0,
    average_turnaround_hours REAL DEFAULT 0.0,
    total_earnings REAL DEFAULT 0.0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_mentor_profiles_user ON mentor_profiles(user_id);
CREATE INDEX idx_mentor_profiles_active ON mentor_profiles(is_active);
CREATE INDEX idx_mentor_profiles_rating ON mentor_profiles(average_rating);

-- =======================
-- JOURNEY MENTOR ASSIGNMENTS
-- =======================

-- Assign mentors to specific journeys with rates
CREATE TABLE IF NOT EXISTS journey_mentors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journey_id INTEGER NOT NULL,
    mentor_user_id INTEGER NOT NULL,
    creator_user_id INTEGER NOT NULL, -- Creator who assigned the mentor
    status TEXT DEFAULT 'active', -- active, paused, removed

    -- Compensation
    review_rate REAL NOT NULL, -- Rate per review
    revenue_share_percentage REAL DEFAULT 10.0, -- % of Guided tier subscription

    -- Limits and availability
    max_reviews_per_week INTEGER DEFAULT 10,
    current_week_reviews INTEGER DEFAULT 0,

    -- Stats
    total_reviews INTEGER DEFAULT 0,
    average_rating REAL DEFAULT 0.0,

    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (journey_id) REFERENCES journeys(id),
    FOREIGN KEY (mentor_user_id) REFERENCES users(id),
    FOREIGN KEY (creator_user_id) REFERENCES users(id),
    UNIQUE(journey_id, mentor_user_id)
);

CREATE INDEX idx_journey_mentors_journey ON journey_mentors(journey_id);
CREATE INDEX idx_journey_mentors_mentor ON journey_mentors(mentor_user_id);
CREATE INDEX idx_journey_mentors_status ON journey_mentors(status);

-- =======================
-- SECTION REVIEWS
-- =======================

-- Review requests and submissions for journey sections
CREATE TABLE IF NOT EXISTS section_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Context
    user_journey_id INTEGER NOT NULL,
    section_id INTEGER NOT NULL,
    mentor_user_id INTEGER,

    -- Status
    status TEXT DEFAULT 'requested', -- requested, in_review, changes_requested, approved, cancelled
    priority TEXT DEFAULT 'normal', -- low, normal, high, urgent

    -- Review content
    client_notes TEXT, -- Notes from client when requesting review
    mentor_feedback TEXT, -- Overall mentor feedback
    overall_rating INTEGER, -- 1-5 stars for the section

    -- Timestamps
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    claimed_at DATETIME, -- When mentor claimed the review
    reviewed_at DATETIME, -- When mentor completed review
    approved_at DATETIME, -- When section was approved

    -- Metrics
    turnaround_hours REAL, -- Time from claimed to reviewed
    revision_count INTEGER DEFAULT 0,

    FOREIGN KEY (user_journey_id) REFERENCES user_journeys(id),
    FOREIGN KEY (section_id) REFERENCES sections(id),
    FOREIGN KEY (mentor_user_id) REFERENCES users(id)
);

CREATE INDEX idx_section_reviews_user_journey ON section_reviews(user_journey_id);
CREATE INDEX idx_section_reviews_section ON section_reviews(section_id);
CREATE INDEX idx_section_reviews_mentor ON section_reviews(mentor_user_id);
CREATE INDEX idx_section_reviews_status ON section_reviews(status);

-- =======================
-- REVIEW COMMENTS (Field-level Feedback)
-- =======================

-- Field-by-field comments and feedback
CREATE TABLE IF NOT EXISTS review_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_review_id INTEGER NOT NULL,
    field_id INTEGER, -- NULL for general section comments

    -- Comment details
    comment_text TEXT NOT NULL,
    comment_type TEXT DEFAULT 'feedback', -- feedback, question, suggestion, approval, issue

    -- Author
    author_user_id INTEGER NOT NULL,
    author_role TEXT NOT NULL, -- mentor, client

    -- Threading
    parent_comment_id INTEGER, -- For replies
    is_resolved BOOLEAN DEFAULT 0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (section_review_id) REFERENCES section_reviews(id),
    FOREIGN KEY (field_id) REFERENCES section_fields(id),
    FOREIGN KEY (author_user_id) REFERENCES users(id),
    FOREIGN KEY (parent_comment_id) REFERENCES review_comments(id)
);

CREATE INDEX idx_review_comments_review ON review_comments(section_review_id);
CREATE INDEX idx_review_comments_field ON review_comments(field_id);
CREATE INDEX idx_review_comments_author ON review_comments(author_user_id);
CREATE INDEX idx_review_comments_parent ON review_comments(parent_comment_id);

-- =======================
-- MENTOR RATINGS
-- =======================

-- Client ratings of mentor reviews
CREATE TABLE IF NOT EXISTS mentor_ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_review_id INTEGER NOT NULL UNIQUE,
    mentor_user_id INTEGER NOT NULL,
    client_user_id INTEGER NOT NULL,
    journey_id INTEGER NOT NULL,

    -- Ratings (1-5 stars)
    overall_rating INTEGER NOT NULL CHECK(overall_rating >= 1 AND overall_rating <= 5),
    helpfulness_rating INTEGER CHECK(helpfulness_rating >= 1 AND helpfulness_rating <= 5),
    timeliness_rating INTEGER CHECK(timeliness_rating >= 1 AND timeliness_rating <= 5),
    communication_rating INTEGER CHECK(communication_rating >= 1 AND communication_rating <= 5),

    -- Feedback
    review_text TEXT,
    would_recommend BOOLEAN DEFAULT 1,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (section_review_id) REFERENCES section_reviews(id),
    FOREIGN KEY (mentor_user_id) REFERENCES users(id),
    FOREIGN KEY (client_user_id) REFERENCES users(id),
    FOREIGN KEY (journey_id) REFERENCES journeys(id)
);

CREATE INDEX idx_mentor_ratings_mentor ON mentor_ratings(mentor_user_id);
CREATE INDEX idx_mentor_ratings_client ON mentor_ratings(client_user_id);
CREATE INDEX idx_mentor_ratings_journey ON mentor_ratings(journey_id);

-- =======================
-- MENTOR REVENUE TRACKING
-- =======================

-- Track mentor earnings from reviews
CREATE TABLE IF NOT EXISTS mentor_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mentor_user_id INTEGER NOT NULL,
    transaction_type TEXT NOT NULL, -- review_fee, revenue_share, bonus, adjustment

    -- Related records
    section_review_id INTEGER, -- For review fees
    subscription_id INTEGER, -- For revenue shares
    journey_id INTEGER NOT NULL,

    -- Amounts
    amount REAL NOT NULL,
    platform_fee REAL DEFAULT 0,
    mentor_amount REAL NOT NULL, -- Amount mentor receives

    -- Status
    status TEXT DEFAULT 'pending', -- pending, completed, paid_out
    payment_method TEXT DEFAULT 'manual',

    description TEXT,
    transaction_date DATE DEFAULT CURRENT_DATE,
    completed_at DATETIME,
    paid_out_at DATETIME,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (mentor_user_id) REFERENCES users(id),
    FOREIGN KEY (section_review_id) REFERENCES section_reviews(id),
    FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id),
    FOREIGN KEY (journey_id) REFERENCES journeys(id)
);

CREATE INDEX idx_mentor_transactions_mentor ON mentor_transactions(mentor_user_id);
CREATE INDEX idx_mentor_transactions_type ON mentor_transactions(transaction_type);
CREATE INDEX idx_mentor_transactions_status ON mentor_transactions(status);
CREATE INDEX idx_mentor_transactions_date ON mentor_transactions(transaction_date);

-- =======================
-- REVIEW NOTIFICATIONS
-- =======================

-- Track review-related notifications
CREATE TABLE IF NOT EXISTS review_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    notification_type TEXT NOT NULL, -- review_requested, review_claimed, review_completed, changes_requested, review_approved, rating_received
    section_review_id INTEGER NOT NULL,

    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    read_at DATETIME,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (section_review_id) REFERENCES section_reviews(id)
);

CREATE INDEX idx_review_notifications_user ON review_notifications(user_id);
CREATE INDEX idx_review_notifications_read ON review_notifications(is_read);
CREATE INDEX idx_review_notifications_created ON review_notifications(created_at);

-- =======================
-- VIEWS FOR EASY QUERYING
-- =======================

-- Active mentors with journey assignments
CREATE VIEW IF NOT EXISTS v_active_journey_mentors AS
SELECT
    jm.*,
    j.name as journey_name,
    j.slug as journey_slug,
    u.username as mentor_username,
    u.email as mentor_email,
    mp.bio as mentor_bio,
    mp.average_rating as mentor_rating,
    mp.total_reviews as mentor_total_reviews
FROM journey_mentors jm
JOIN journeys j ON jm.journey_id = j.id
JOIN users u ON jm.mentor_user_id = u.id
JOIN mentor_profiles mp ON u.id = mp.user_id
WHERE jm.status = 'active' AND mp.is_active = 1;

-- Pending reviews with context
CREATE VIEW IF NOT EXISTS v_pending_reviews AS
SELECT
    sr.*,
    uj.user_id as client_user_id,
    u.username as client_username,
    u.email as client_email,
    s.name as section_name,
    s.slug as section_slug,
    j.name as journey_name,
    j.slug as journey_slug
FROM section_reviews sr
JOIN user_journeys uj ON sr.user_journey_id = uj.id
JOIN users u ON uj.user_id = u.id
JOIN sections s ON sr.section_id = s.id
JOIN journeys j ON uj.journey_id = j.id
WHERE sr.status IN ('requested', 'in_review');

-- =======================
-- INITIAL DATA
-- =======================

-- No initial data needed for mentor system
-- Mentors will apply through the application form
