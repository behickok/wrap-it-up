-- Migration: 0002_add_user_authentication
-- Description: Add authentication fields to users table
-- Date: 2025-11-05

-- SQLite doesn't support adding NOT NULL columns with UNIQUE constraints directly
-- We need to recreate the users table with the new schema

-- Create new users table with authentication fields
CREATE TABLE users_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copy existing data (if any) - won't work for existing users without auth fields
-- This is safe for new installations
-- INSERT INTO users_new (id, created_at, updated_at)
-- SELECT id, created_at, updated_at FROM users;

-- Drop old table
DROP TABLE IF EXISTS users;

-- Rename new table
ALTER TABLE users_new RENAME TO users;

-- Create sessions table for managing user sessions
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
