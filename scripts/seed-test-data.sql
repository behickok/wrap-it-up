-- Script: Seed deterministic data for automated tests
-- Usage: npm run seed:test -- --db <database-name> [--local]

PRAGMA foreign_keys = OFF;

DELETE FROM analytics_events;
DELETE FROM journey_analytics;
DELETE FROM section_analytics;
DELETE FROM daily_stats;
DELETE FROM system_metrics;
DELETE FROM in_app_notifications;
DELETE FROM messages;
DELETE FROM message_threads;
DELETE FROM section_shares;
DELETE FROM coach_clients;
DELETE FROM mentor_ratings;
DELETE FROM mentor_transactions;
DELETE FROM review_comments;
DELETE FROM section_reviews;
DELETE FROM mentor_sessions;
DELETE FROM session_ratings;
DELETE FROM journey_mentors;
DELETE FROM mentor_rates;
DELETE FROM concierge_rates;
DELETE FROM mentor_profiles;
DELETE FROM mentor_journeys;
DELETE FROM mentor_applications;
DELETE FROM mentors;
DELETE FROM journey_pricing;
DELETE FROM transactions;
DELETE FROM payouts;
DELETE FROM user_journey_progress;
DELETE FROM mentor_reviews;
DELETE FROM user_subscriptions;
DELETE FROM user_journeys;
DELETE FROM section_fields;
DELETE FROM field_types;
DELETE FROM section_data;
DELETE FROM journey_sections;
DELETE FROM journey_categories;
DELETE FROM journey_creators;
DELETE FROM journey_templates;
DELETE FROM sections;
DELETE FROM categories;
DELETE FROM journeys;
DELETE FROM tier_features;
DELETE FROM service_tiers;
DELETE FROM credentials;
DELETE FROM personal_info;
DELETE FROM documents;
DELETE FROM family_members;
DELETE FROM family_history;
DELETE FROM pets;
DELETE FROM key_contacts;
DELETE FROM medical_info;
DELETE FROM physicians;
DELETE FROM employment;
DELETE FROM primary_residence;
DELETE FROM service_providers;
DELETE FROM home_inventory;
DELETE FROM other_real_estate;
DELETE FROM vehicles;
DELETE FROM personal_property;
DELETE FROM insurance;
DELETE FROM bank_accounts;
DELETE FROM investments;
DELETE FROM charitable_contributions;
DELETE FROM legal_documents;
DELETE FROM final_days;
DELETE FROM obituary;
DELETE FROM after_death;
DELETE FROM funeral;
DELETE FROM conclusion;
DELETE FROM section_completion;
DELETE FROM notification_preferences;
DELETE FROM user_roles;
DELETE FROM roles;
DELETE FROM sessions;
DELETE FROM users;

DELETE FROM sqlite_sequence
	WHERE name IN (
		'analytics_events',
		'journey_analytics',
		'section_analytics',
		'daily_stats',
		'system_metrics',
		'in_app_notifications',
		'messages',
		'message_threads',
		'section_shares',
		'coach_clients',
		'journey_mentors',
		'mentor_rates',
		'concierge_rates',
		'mentor_profiles',
		'mentor_journeys',
		'mentor_applications',
		'mentor_ratings',
		'mentor_transactions',
		'review_comments',
		'section_reviews',
		'mentor_sessions',
		'session_ratings',
		'mentors',
		'journey_pricing',
		'transactions',
		'payouts',
		'user_journey_progress',
		'user_subscriptions',
		'user_journeys',
		'section_fields',
		'field_types',
		'section_data',
		'journey_sections',
		'journey_categories',
		'journeys',
		'sections',
		'categories',
		'tier_features',
		'service_tiers',
		'credentials',
		'personal_info',
		'documents',
		'family_members',
		'family_history',
		'pets',
		'key_contacts',
		'medical_info',
		'physicians',
		'employment',
		'primary_residence',
		'service_providers',
		'home_inventory',
		'other_real_estate',
		'vehicles',
		'personal_property',
		'insurance',
		'bank_accounts',
		'investments',
		'charitable_contributions',
		'legal_documents',
		'final_days',
		'obituary',
		'after_death',
		'funeral',
		'conclusion',
		'section_completion',
		'roles',
		'sessions',
		'users'
	);

PRAGMA foreign_keys = ON;

-- Roles ---------------------------------------------------------------------
INSERT INTO roles (id, name, display_name, description, is_active, created_at)
VALUES
	(1, 'participant', 'Participant', 'Regular authenticated user', 1, CURRENT_TIMESTAMP),
	(2, 'creator', 'Creator', 'Builds and manages journeys', 1, CURRENT_TIMESTAMP),
	(3, 'mentor', 'Mentor', 'Provides section reviews', 1, CURRENT_TIMESTAMP),
	(4, 'admin', 'Admin', 'Full platform access', 1, CURRENT_TIMESTAMP);

-- Users ---------------------------------------------------------------------
INSERT INTO users (id, email, username, password_hash, is_active, created_at, updated_at)
VALUES
	(1, 'admin@example.com', 'admin_user', 'dB8yOziPU5zGv/i07RSMvQ==:y6/yqslJbb0hYv/4VHyPL6cb8Df8E8VtZJG10j45uII=', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
	(2, 'creator@example.com', 'creator_user', 'CEKtvGq2dJrYHm3ZBAoI+Q==:/3PmSx80cPFG7imjiU1SO24nXHBYupKALJRVMeJhih0=', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
	(3, 'mentor@example.com', 'mentor_user', 'VH9IWLhE6CUPdbbxOpNxBw==:kvRHro/Yo2ZYMksV370N2AWjPT0Tf5IOOeJR/DECT18=', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
	(4, 'participant@example.com', 'participant_user', 'vTpt8UAPsPG/pFlUiNF2nw==:uQ9ua0SUZgEtzeIEThq2EIMiaQTUS0/FCeSGzqRW4Jw=', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR REPLACE INTO notification_preferences (user_id) VALUES (1), (2), (3), (4);

-- Role assignments ----------------------------------------------------------
INSERT INTO user_roles (user_id, role_id, granted_by)
VALUES
	(1, 4, NULL),
	(2, 2, 1),
	(3, 3, 1),
	(4, 1, 1);

-- Service tiers -------------------------------------------------------------
INSERT INTO service_tiers (id, slug, name, description, price_monthly, price_annual, display_order, is_active, created_at, updated_at)
VALUES
	(1, 'essentials', 'Essentials', 'Self-guided access to all sections.', 0, 0, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
	(2, 'guided', 'Guided', 'Includes mentor guidance and concierge touches.', 149, 1500, 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Journeys ------------------------------------------------------------------
INSERT INTO journeys (id, slug, name, description, icon, is_active, created_at, updated_at)
VALUES
	(1, 'wedding', 'Wedding Journey', 'Plan a beautiful ceremony with legal, financial, and celebration milestones.', '💍', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
	(2, 'care', 'Care Journey', 'Coordinate long-term care preferences, documentation, and family guidance.', '🤍', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO journey_creators (journey_id, creator_user_id, is_published, is_featured, use_count, created_at, updated_at)
VALUES
	(1, 2, 1, 1, 25, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
	(2, 2, 1, 1, 42, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Categories ----------------------------------------------------------------
INSERT INTO categories (id, name, description, icon, created_at)
VALUES
	(1, 'Plan Legal & Financial Foundation', 'Documents, finances, and logistics.', '⚖️', CURRENT_TIMESTAMP),
	(2, 'Legacy End-of-Life Planning', 'Messages, memories, and celebration wishes.', '🌿', CURRENT_TIMESTAMP);

INSERT INTO journey_categories (journey_id, category_id, display_order, created_at)
VALUES
	(1, 1, 1, CURRENT_TIMESTAMP),
	(1, 2, 2, CURRENT_TIMESTAMP),
	(2, 1, 1, CURRENT_TIMESTAMP),
	(2, 2, 2, CURRENT_TIMESTAMP);

-- Sections ------------------------------------------------------------------
INSERT INTO sections (id, slug, name, description, scoring_type, weight, created_at)
VALUES
	(1, 'plan-legal', 'Legal Documents', 'Capture wills, POA, and legal paperwork.', 'field_count', 5, CURRENT_TIMESTAMP),
	(2, 'plan-financial', 'Financial Accounts', 'Track bank accounts and obligations.', 'field_count', 5, CURRENT_TIMESTAMP),
	(3, 'legacy-messages', 'Legacy Letters', 'Personal notes and instructions.', 'field_count', 5, CURRENT_TIMESTAMP),
	(4, 'legacy-celebration', 'Celebration Wishes', 'How you want people to gather.', 'field_count', 5, CURRENT_TIMESTAMP);

INSERT INTO journey_sections (journey_id, section_id, category_id, display_order, is_required, created_at)
VALUES
	(1, 1, 1, 1, 1, CURRENT_TIMESTAMP),
	(1, 3, 2, 2, 0, CURRENT_TIMESTAMP),
	(2, 2, 1, 1, 1, CURRENT_TIMESTAMP),
	(2, 4, 2, 2, 0, CURRENT_TIMESTAMP);

-- Pricing -------------------------------------------------------------------
INSERT INTO journey_pricing (journey_id, tier_id, base_price_monthly, base_price_annual, platform_fee_percentage, is_active, created_at, updated_at)
VALUES
	(1, 2, 149, 1500, 15, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
	(2, 2, 149, 1500, 15, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Participant enrollments ---------------------------------------------------
INSERT INTO user_journeys (user_id, journey_id, tier_id, status, started_at, created_at, updated_at)
VALUES
	(4, 1, 2, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
	(4, 2, 2, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Mentor profile ------------------------------------------------------------
INSERT INTO mentors (id, user_id, display_name, bio, expertise_areas, hourly_rate, is_available, availability_json, rating_average, review_count, created_at, updated_at)
VALUES
	(1, 3, 'Jordan Avery', 'Care navigation specialist and celebration planner.', '["care","wedding"]', 120, 1, '{"timezone":"America/Chicago"}', 4.9, 32, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO mentor_profiles (id, user_id, bio, expertise, experience_years, education, certifications, availability_hours, is_active, is_featured, profile_image_url, timezone, languages, total_reviews, completed_reviews, average_rating, average_turnaround_hours, total_earnings, created_at, updated_at)
VALUES
	(1, 3, 'Mentor for major life transitions.', '["care","wedding"]', 8, 'MSW, University of Texas', 'End-of-Life Doula', 10, 1, 1, NULL, 'America/Chicago', '["English"]', 40, 37, 4.9, 36, 12500, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
