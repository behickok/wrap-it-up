-- Migration: Refactor credentials table and scoring system
-- Date: 2025-11-05
-- Purpose: Add category field to credentials and update scoring to point-based system

-- Add category field to credentials table
ALTER TABLE credentials ADD COLUMN category TEXT DEFAULT 'other'
    CHECK(category IN ('email', 'banking', 'social', 'utilities', 'government', 'other'));

-- Add timestamps to credentials table for better tracking
ALTER TABLE credentials ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE credentials ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Rename completion_percentage to score in section_completion table
-- SQLite doesn't support column rename directly, so we need to recreate the table
CREATE TABLE section_completion_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    section_name TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, section_name)
);

-- Copy existing data from old table
INSERT INTO section_completion_new (id, user_id, section_name, score, last_updated)
SELECT id, user_id, section_name, completion_percentage, last_updated
FROM section_completion;

-- Drop old table and rename new one
DROP TABLE section_completion;
ALTER TABLE section_completion_new RENAME TO section_completion;

-- Add category field to other variable-length tables for consistency
ALTER TABLE pets ADD COLUMN category TEXT DEFAULT 'pet';
ALTER TABLE key_contacts ADD COLUMN category TEXT DEFAULT 'emergency';
ALTER TABLE insurance ADD COLUMN category TEXT DEFAULT 'other';
