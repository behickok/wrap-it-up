-- Migration: Phase 9 - In-App Messaging & Notifications
-- Description: Notification center and mentor-client messaging system
-- Date: 2025-11-14

-- ============================================================================
-- 9.1: In-App Notification System
-- ============================================================================

-- In-app notifications table
CREATE TABLE IF NOT EXISTS in_app_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'review_claimed', 'review_completed', 'review_changes_requested',
                        -- 'mentor_approved', 'mentor_rejected', 'journey_enrolled',
                        -- 'milestone_achieved', 'new_message', 'review_available'
    title TEXT NOT NULL,
    message TEXT,
    link TEXT, -- URL to navigate to when clicked
    read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME,
    metadata TEXT, -- JSON: additional data specific to notification type
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON in_app_notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON in_app_notifications(type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON in_app_notifications(created_at DESC);

-- User notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,

    -- In-app notification preferences
    in_app_reviews BOOLEAN DEFAULT 1,
    in_app_messages BOOLEAN DEFAULT 1,
    in_app_platform BOOLEAN DEFAULT 1,
    in_app_milestones BOOLEAN DEFAULT 1,

    -- Browser notification preferences
    browser_notifications BOOLEAN DEFAULT 0,
    browser_reviews BOOLEAN DEFAULT 0,
    browser_messages BOOLEAN DEFAULT 0,

    -- Notification grouping
    group_similar BOOLEAN DEFAULT 1,

    -- Quiet hours
    quiet_hours_enabled BOOLEAN DEFAULT 0,
    quiet_hours_start TEXT, -- HH:MM format
    quiet_hours_end TEXT, -- HH:MM format

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notif_prefs_user ON notification_preferences(user_id);

-- ============================================================================
-- 9.2: Messaging System
-- ============================================================================

-- Message threads (conversations)
CREATE TABLE IF NOT EXISTS message_threads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_review_id INTEGER, -- Optional: link to specific review
    journey_id INTEGER, -- Optional: link to journey
    participant1_user_id INTEGER NOT NULL,
    participant2_user_id INTEGER NOT NULL,
    subject TEXT, -- Optional subject line
    last_message_at DATETIME,
    last_message_preview TEXT, -- First 100 chars of last message
    is_archived BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_review_id) REFERENCES section_reviews(id) ON DELETE SET NULL,
    FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE SET NULL,
    FOREIGN KEY (participant1_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (participant2_user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(participant1_user_id, participant2_user_id, section_review_id)
);

CREATE INDEX IF NOT EXISTS idx_threads_participant1 ON message_threads(participant1_user_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_participant2 ON message_threads(participant2_user_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_review ON message_threads(section_review_id);
CREATE INDEX IF NOT EXISTS idx_threads_archived ON message_threads(is_archived, last_message_at DESC);

-- Individual messages
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER NOT NULL,
    sender_user_id INTEGER NOT NULL,
    recipient_user_id INTEGER NOT NULL,
    message_text TEXT NOT NULL,
    read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME,
    edited_at DATETIME,
    deleted BOOLEAN DEFAULT 0,
    deleted_at DATETIME,
    FOREIGN KEY (thread_id) REFERENCES message_threads(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_unread ON messages(recipient_user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- ============================================================================
-- Views for Efficient Queries
-- ============================================================================

-- Unread notification count per user
CREATE VIEW IF NOT EXISTS user_unread_notifications AS
SELECT
    user_id,
    COUNT(*) as unread_count,
    MAX(created_at) as latest_notification_at
FROM in_app_notifications
WHERE read = 0
GROUP BY user_id;

-- Unread message count per user
CREATE VIEW IF NOT EXISTS user_unread_messages AS
SELECT
    recipient_user_id as user_id,
    COUNT(*) as unread_count,
    MAX(created_at) as latest_message_at
FROM messages
WHERE read = 0 AND deleted = 0
GROUP BY recipient_user_id;

-- Message thread summary with participant info
CREATE VIEW IF NOT EXISTS message_thread_summary AS
SELECT
    mt.*,
    u1.username as participant1_username,
    u1.email as participant1_email,
    u2.username as participant2_username,
    u2.email as participant2_email,
    (SELECT COUNT(*) FROM messages m WHERE m.thread_id = mt.id AND m.deleted = 0) as message_count,
    (SELECT COUNT(*) FROM messages m
     WHERE m.thread_id = mt.id
     AND m.read = 0
     AND m.deleted = 0
     AND m.recipient_user_id = mt.participant1_user_id) as participant1_unread,
    (SELECT COUNT(*) FROM messages m
     WHERE m.thread_id = mt.id
     AND m.read = 0
     AND m.deleted = 0
     AND m.recipient_user_id = mt.participant2_user_id) as participant2_unread
FROM message_threads mt
INNER JOIN users u1 ON mt.participant1_user_id = u1.id
INNER JOIN users u2 ON mt.participant2_user_id = u2.id;

-- ============================================================================
-- Triggers for Auto-updates
-- ============================================================================

-- Update thread's last_message_at when new message is added
CREATE TRIGGER IF NOT EXISTS update_thread_on_new_message
AFTER INSERT ON messages
FOR EACH ROW
WHEN NEW.deleted = 0
BEGIN
    UPDATE message_threads
    SET
        last_message_at = NEW.created_at,
        last_message_preview = SUBSTR(NEW.message_text, 1, 100),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.thread_id;
END;

-- Update thread's last_message_at when message is deleted (recalculate)
CREATE TRIGGER IF NOT EXISTS update_thread_on_message_delete
AFTER UPDATE ON messages
FOR EACH ROW
WHEN NEW.deleted = 1 AND OLD.deleted = 0
BEGIN
    UPDATE message_threads
    SET
        last_message_at = (
            SELECT MAX(created_at)
            FROM messages
            WHERE thread_id = NEW.thread_id AND deleted = 0
        ),
        last_message_preview = (
            SELECT SUBSTR(message_text, 1, 100)
            FROM messages
            WHERE thread_id = NEW.thread_id AND deleted = 0
            ORDER BY created_at DESC
            LIMIT 1
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.thread_id;
END;

-- Update notification_preferences updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_notif_prefs_timestamp
AFTER UPDATE ON notification_preferences
FOR EACH ROW
BEGIN
    UPDATE notification_preferences
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

-- Initialize notification preferences for new users
CREATE TRIGGER IF NOT EXISTS init_notification_prefs
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id);
END;

-- Create notification when message is sent
CREATE TRIGGER IF NOT EXISTS create_notif_on_message
AFTER INSERT ON messages
FOR EACH ROW
WHEN NEW.deleted = 0
BEGIN
    -- Check if recipient has in_app_messages enabled (default to true if no prefs)
    INSERT INTO in_app_notifications (user_id, type, title, message, link, metadata)
    SELECT
        NEW.recipient_user_id,
        'new_message',
        'New message from ' || u.username,
        SUBSTR(NEW.message_text, 1, 100),
        '/messages/' || NEW.thread_id,
        json_object('thread_id', NEW.thread_id, 'sender_id', NEW.sender_user_id)
    FROM users u
    WHERE u.id = NEW.sender_user_id
        AND (
            SELECT COALESCE(np.in_app_messages, 1)
            FROM notification_preferences np
            WHERE np.user_id = NEW.recipient_user_id
        ) = 1;
END;

-- ============================================================================
-- Helper Functions via Additional Tables
-- ============================================================================

-- Notification templates (for consistent messaging)
CREATE TABLE IF NOT EXISTS notification_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL UNIQUE,
    title_template TEXT NOT NULL, -- Can contain {{placeholders}}
    message_template TEXT,
    link_template TEXT,
    icon TEXT,
    priority INTEGER DEFAULT 5, -- 1-10, lower = higher priority
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed notification templates
INSERT OR IGNORE INTO notification_templates (type, title_template, message_template, link_template, icon, priority)
VALUES
    ('review_claimed', 'Review Claimed', 'Your {{section_title}} review has been claimed by {{mentor_name}}', '/journeys/{{journey_slug}}/sections/{{section_id}}/review', '👀', 5),
    ('review_completed', 'Review Complete! 🎉', '{{mentor_name}} has completed your {{section_title}} review', '/journeys/{{journey_slug}}/sections/{{section_id}}/review', '✅', 3),
    ('review_changes_requested', 'Changes Requested', '{{mentor_name}} has requested changes to your {{section_title}} submission', '/journeys/{{journey_slug}}/sections/{{section_id}}/review', '📝', 4),
    ('review_available', 'New Review Available', 'A new {{section_type}} review is available for {{journey_name}}', '/mentor/reviews', '📋', 6),
    ('mentor_approved', 'Mentor Application Approved! 🎉', 'Your mentor application has been approved. Welcome to the team!', '/mentor/dashboard', '👏', 1),
    ('mentor_rejected', 'Mentor Application Update', 'Thank you for your interest. We''ll keep your application on file.', '/mentor/application', '📧', 2),
    ('journey_enrolled', 'Journey Enrolled', 'You''ve successfully enrolled in {{journey_name}}', '/journeys/{{journey_slug}}', '🚀', 7),
    ('milestone_achieved', 'Milestone Achieved! 🏆', 'You''ve earned: {{milestone_name}}', '/my/progress', '🎖️', 3),
    ('new_message', 'New Message', 'You have a new message from {{sender_name}}', '/messages/{{thread_id}}', '💬', 4);

-- ============================================================================
-- Notification Queue (for batching and rate limiting)
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    notification_type TEXT NOT NULL,
    payload TEXT NOT NULL, -- JSON
    priority INTEGER DEFAULT 5,
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    scheduled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sent_at DATETIME,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notif_queue_status ON notification_queue(status, priority, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notif_queue_user ON notification_queue(user_id, status);

-- ============================================================================
-- Analytics for Notifications and Messages
-- ============================================================================

-- Track notification interactions
CREATE TABLE IF NOT EXISTS notification_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    notification_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL, -- 'created', 'read', 'clicked', 'dismissed'
    action_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notification_id) REFERENCES in_app_notifications(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notif_analytics ON notification_analytics(notification_id, action);
CREATE INDEX IF NOT EXISTS idx_notif_analytics_user ON notification_analytics(user_id, action_at DESC);

-- Track message read receipts for analytics
CREATE TABLE IF NOT EXISTS message_read_receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    reader_user_id INTEGER NOT NULL,
    read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (reader_user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(message_id, reader_user_id)
);

CREATE INDEX IF NOT EXISTS idx_read_receipts_message ON message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_read_receipts_user ON message_read_receipts(reader_user_id, read_at DESC);

-- ============================================================================
-- Comments
-- ============================================================================

-- This migration adds comprehensive in-app notification and messaging systems:
-- 1. In-app notification center with preferences
-- 2. Direct messaging between users (especially mentor-client)
-- 3. Message threading and read status
-- 4. Notification templates for consistency
-- 5. Notification queue for batching
-- 6. Analytics for tracking engagement
-- 7. Auto-notification on messages via triggers
-- 8. Views for efficient unread counts
-- 9. Browser notification support (preferences only, implementation in client)

-- All features use only Cloudflare D1 - no external messaging services required.
-- Email notifications will be added in Phase 10 as an enhancement.
