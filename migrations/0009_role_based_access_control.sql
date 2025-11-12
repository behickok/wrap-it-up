-- Migration: 0009_role_based_access_control
-- Description: Add comprehensive role-based access control system
-- Date: 2025-11-12

-- ============================================================================
-- ROLE SYSTEM
-- ============================================================================

-- Define available roles in the system
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL, -- 'participant', 'creator', 'mentor', 'coach', 'admin'
    display_name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User role assignments (users can have multiple roles)
CREATE TABLE IF NOT EXISTS user_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    granted_by INTEGER, -- user_id of who granted this role
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(user_id, role_id)
);

-- Define granular permissions
CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL, -- e.g., 'journey.create', 'journey.edit', 'data.view_own', 'data.edit_others'
    display_name TEXT NOT NULL,
    description TEXT,
    category TEXT, -- 'journey', 'data', 'user', 'analytics', 'system'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Map permissions to roles
CREATE TABLE IF NOT EXISTS role_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE(role_id, permission_id)
);

-- ============================================================================
-- COACH-CLIENT RELATIONSHIP
-- ============================================================================

-- Coach profiles (users with coach role)
CREATE TABLE IF NOT EXISTS coaches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    bio TEXT,
    specialties TEXT, -- JSON array of journey types or expertise areas
    is_available BOOLEAN DEFAULT 1,
    hourly_rate REAL DEFAULT 0,
    rating_average REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Coach-client relationships
CREATE TABLE IF NOT EXISTS coach_clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coach_id INTEGER NOT NULL,
    client_user_id INTEGER NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('pending', 'active', 'paused', 'ended')),
    access_level TEXT DEFAULT 'view' CHECK(access_level IN ('view', 'edit', 'full')), -- view=read only, edit=can fill data, full=can manage journey
    journey_id INTEGER, -- NULL means access to all journeys
    notes TEXT, -- coach's notes about this client
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE,
    FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
    UNIQUE(coach_id, client_user_id, journey_id)
);

-- Track when coaches access client data (audit trail)
CREATE TABLE IF NOT EXISTS coach_access_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coach_client_id INTEGER NOT NULL,
    action TEXT NOT NULL, -- 'viewed', 'edited', 'exported'
    section_id INTEGER, -- which section was accessed
    details TEXT, -- JSON with additional context
    accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coach_client_id) REFERENCES coach_clients(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL
);

-- ============================================================================
-- DATA SHARING & PERMISSIONS
-- ============================================================================

-- Share specific sections with mentors/coaches (granular sharing)
CREATE TABLE IF NOT EXISTS section_shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL, -- owner of the data
    shared_with_user_id INTEGER NOT NULL, -- mentor or coach
    section_id INTEGER NOT NULL,
    access_type TEXT DEFAULT 'view' CHECK(access_type IN ('view', 'comment', 'edit')),
    message TEXT, -- optional message when sharing
    expires_at DATETIME, -- optional expiration
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_with_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    UNIQUE(user_id, shared_with_user_id, section_id)
);

-- ============================================================================
-- CREATOR ANALYTICS
-- ============================================================================

-- Track journey usage analytics for creators
CREATE TABLE IF NOT EXISTS journey_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journey_id INTEGER NOT NULL,
    metric_date DATE NOT NULL,
    -- Engagement metrics
    total_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0, -- users who made progress this period
    new_users INTEGER DEFAULT 0,
    completed_users INTEGER DEFAULT 0,
    -- Progress metrics
    avg_completion_percentage REAL DEFAULT 0,
    avg_score REAL DEFAULT 0,
    total_sections_completed INTEGER DEFAULT 0,
    -- Retention metrics
    retention_7day REAL DEFAULT 0,
    retention_30day REAL DEFAULT 0,
    -- Other
    total_sessions INTEGER DEFAULT 0,
    avg_session_duration_minutes REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
    UNIQUE(journey_id, metric_date)
);

-- Track section-level analytics
CREATE TABLE IF NOT EXISTS section_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id INTEGER NOT NULL,
    journey_id INTEGER NOT NULL,
    metric_date DATE NOT NULL,
    -- Section metrics
    total_completions INTEGER DEFAULT 0,
    avg_completion_time_minutes REAL DEFAULT 0,
    avg_score REAL DEFAULT 0,
    -- Problem areas
    incomplete_field_count INTEGER DEFAULT 0, -- how many fields left incomplete
    common_incomplete_fields TEXT, -- JSON array of field names
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
    UNIQUE(section_id, journey_id, metric_date)
);

-- Track events for analytics
CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    journey_id INTEGER,
    section_id INTEGER,
    event_type TEXT NOT NULL, -- 'journey_started', 'section_viewed', 'section_completed', 'data_saved', 'journey_completed'
    event_data TEXT, -- JSON with additional context
    session_id TEXT, -- group events by session
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE SET NULL,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

CREATE INDEX IF NOT EXISTS idx_coaches_user ON coaches(user_id);
CREATE INDEX IF NOT EXISTS idx_coaches_available ON coaches(is_available);

CREATE INDEX IF NOT EXISTS idx_coach_clients_coach ON coach_clients(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_clients_client ON coach_clients(client_user_id);
CREATE INDEX IF NOT EXISTS idx_coach_clients_status ON coach_clients(status);

CREATE INDEX IF NOT EXISTS idx_coach_access_log_coach_client ON coach_access_log(coach_client_id);
CREATE INDEX IF NOT EXISTS idx_coach_access_log_accessed_at ON coach_access_log(accessed_at);

CREATE INDEX IF NOT EXISTS idx_section_shares_user ON section_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_section_shares_shared_with ON section_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_section_shares_section ON section_shares(section_id);

CREATE INDEX IF NOT EXISTS idx_journey_analytics_journey ON journey_analytics(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_analytics_date ON journey_analytics(metric_date);

CREATE INDEX IF NOT EXISTS idx_section_analytics_section ON section_analytics(section_id);
CREATE INDEX IF NOT EXISTS idx_section_analytics_journey ON section_analytics(journey_id);
CREATE INDEX IF NOT EXISTS idx_section_analytics_date ON section_analytics(metric_date);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_journey ON analytics_events(journey_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);

-- ============================================================================
-- SEED DATA: Roles
-- ============================================================================

INSERT INTO roles (name, display_name, description) VALUES
('participant', 'Participant', 'Users who are taking journeys and filling out their own data'),
('creator', 'Creator', 'Users who can create and manage journeys for others to use'),
('mentor', 'Mentor', 'Users who can review participant data and provide feedback'),
('coach', 'Coach', 'Users who can help participants by filling out data on their behalf'),
('admin', 'Administrator', 'Full system access for platform management');

-- ============================================================================
-- SEED DATA: Permissions
-- ============================================================================

-- Journey permissions
INSERT INTO permissions (name, display_name, description, category) VALUES
('journey.create', 'Create Journeys', 'Can create new journeys', 'journey'),
('journey.edit_own', 'Edit Own Journeys', 'Can edit journeys they created', 'journey'),
('journey.edit_any', 'Edit Any Journey', 'Can edit any journey in the system', 'journey'),
('journey.delete_own', 'Delete Own Journeys', 'Can delete journeys they created', 'journey'),
('journey.delete_any', 'Delete Any Journey', 'Can delete any journey', 'journey'),
('journey.publish', 'Publish Journeys', 'Can publish journeys to make them available', 'journey'),
('journey.view_all', 'View All Journeys', 'Can view all journeys including unpublished', 'journey');

-- Data permissions
INSERT INTO permissions (name, display_name, description, category) VALUES
('data.view_own', 'View Own Data', 'Can view their own journey data', 'data'),
('data.edit_own', 'Edit Own Data', 'Can edit their own journey data', 'data'),
('data.view_shared', 'View Shared Data', 'Can view data shared with them', 'data'),
('data.edit_shared', 'Edit Shared Data', 'Can edit data shared with them (as coach)', 'data'),
('data.export_own', 'Export Own Data', 'Can export their own data', 'data'),
('data.delete_own', 'Delete Own Data', 'Can delete their own data', 'data');

-- Analytics permissions
INSERT INTO permissions (name, display_name, description, category) VALUES
('analytics.view_own', 'View Own Analytics', 'Can view analytics for journeys they created', 'analytics'),
('analytics.view_all', 'View All Analytics', 'Can view analytics for all journeys', 'analytics'),
('analytics.export', 'Export Analytics', 'Can export analytics data', 'analytics');

-- User management permissions
INSERT INTO permissions (name, display_name, description, category) VALUES
('user.manage_roles', 'Manage User Roles', 'Can assign/remove roles from users', 'user'),
('user.view_all', 'View All Users', 'Can view all user profiles', 'user'),
('user.impersonate', 'Impersonate Users', 'Can view system as another user (for support)', 'user');

-- Mentor permissions
INSERT INTO permissions (name, display_name, description, category) VALUES
('mentor.receive_reviews', 'Receive Review Requests', 'Can receive and respond to review requests', 'mentor'),
('mentor.provide_feedback', 'Provide Feedback', 'Can comment on shared data', 'mentor');

-- Coach permissions
INSERT INTO permissions (name, display_name, description, category) VALUES
('coach.add_clients', 'Add Clients', 'Can establish coach-client relationships', 'coach'),
('coach.access_client_data', 'Access Client Data', 'Can access client data with permission', 'coach'),
('coach.edit_client_data', 'Edit Client Data', 'Can edit client data on their behalf', 'coach');

-- System permissions
INSERT INTO permissions (name, display_name, description, category) VALUES
('system.manage_settings', 'Manage System Settings', 'Can configure system-wide settings', 'system'),
('system.manage_permissions', 'Manage Permissions', 'Can modify roles and permissions', 'system');

-- ============================================================================
-- SEED DATA: Role-Permission Mappings
-- ============================================================================

-- Participant role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'participant'
AND p.name IN (
    'data.view_own',
    'data.edit_own',
    'data.export_own',
    'data.delete_own'
);

-- Creator role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'creator'
AND p.name IN (
    -- Creator has all participant permissions plus:
    'data.view_own',
    'data.edit_own',
    'data.export_own',
    'data.delete_own',
    -- Journey management
    'journey.create',
    'journey.edit_own',
    'journey.delete_own',
    'journey.publish',
    -- Analytics
    'analytics.view_own',
    'analytics.export'
);

-- Mentor role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'mentor'
AND p.name IN (
    -- Mentor has all participant permissions plus:
    'data.view_own',
    'data.edit_own',
    'data.export_own',
    'data.delete_own',
    -- Mentor-specific
    'data.view_shared',
    'mentor.receive_reviews',
    'mentor.provide_feedback'
);

-- Coach role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'coach'
AND p.name IN (
    -- Coach has all participant permissions plus:
    'data.view_own',
    'data.edit_own',
    'data.export_own',
    'data.delete_own',
    -- Coach-specific
    'data.view_shared',
    'data.edit_shared',
    'coach.add_clients',
    'coach.access_client_data',
    'coach.edit_client_data'
);

-- Admin role permissions (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin';

-- ============================================================================
-- AUTO-ASSIGN PARTICIPANT ROLE TO EXISTING USERS
-- ============================================================================

-- Give all existing users the participant role
INSERT OR IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE r.name = 'participant';
