-- Seed users and role assignments for automated testing scenarios
-- Usage (local D1):
--   npx wrangler d1 execute wrap-it-up-db --local --file=./scripts/seed-test-users.sql
-- Usage (remote D1):
--   npx wrangler d1 execute wrap-it-up-db --file=./scripts/seed-test-users.sql

BEGIN TRANSACTION;

-- Ensure the canonical role records exist
INSERT OR IGNORE INTO roles (name, display_name, description) VALUES
	('participant', 'Participant', 'Regular authenticated user'),
	('creator', 'Creator', 'Can create and manage journeys'),
	('mentor', 'Mentor', 'Reviews journey sections for users'),
	('coach', 'Coach', 'Provides concierge support'),
	('admin', 'Administrator', 'Full platform access');

-- Helper upsert macro for readability
-- Inserts or updates the user while keeping the record active
INSERT INTO users (email, username, password_hash, is_active, last_login, created_at, updated_at) VALUES
	('admin@example.com', 'admin_user', 'dB8yOziPU5zGv/i07RSMvQ==:y6/yqslJbb0hYv/4VHyPL6cb8Df8E8VtZJG10j45uII=', 1, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
	('creator@example.com', 'creator_user', 'CEKtvGq2dJrYHm3ZBAoI+Q==:/3PmSx80cPFG7imjiU1SO24nXHBYupKALJRVMeJhih0=', 1, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
	('mentor@example.com', 'mentor_user', 'VH9IWLhE6CUPdbbxOpNxBw==:kvRHro/Yo2ZYMksV370N2AWjPT0Tf5IOOeJR/DECT18=', 1, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
	('participant@example.com', 'participant_user', 'vTpt8UAPsPG/pFlUiNF2nw==:uQ9ua0SUZgEtzeIEThq2EIMiaQTUS0/FCeSGzqRW4Jw=', 1, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(email) DO UPDATE SET
	username = excluded.username,
	password_hash = excluded.password_hash,
	is_active = 1,
	updated_at = CURRENT_TIMESTAMP;

-- Assign roles to the seeded users (idempotent)
INSERT OR IGNORE INTO user_roles (user_id, role_id, granted_by)
	SELECT u.id, r.id, NULL
	FROM users u
	JOIN roles r ON r.name = 'admin'
	WHERE u.email = 'admin@example.com';

INSERT OR IGNORE INTO user_roles (user_id, role_id, granted_by)
	SELECT u.id, r.id, NULL
	FROM users u
	JOIN roles r ON r.name = 'creator'
	WHERE u.email = 'creator@example.com';

INSERT OR IGNORE INTO user_roles (user_id, role_id, granted_by)
	SELECT u.id, r.id, NULL
	FROM users u
	JOIN roles r ON r.name = 'mentor'
	WHERE u.email = 'mentor@example.com';

INSERT OR IGNORE INTO user_roles (user_id, role_id, granted_by)
	SELECT u.id, r.id, NULL
	FROM users u
	JOIN roles r ON r.name = 'participant'
	WHERE u.email = 'participant@example.com';

COMMIT;
