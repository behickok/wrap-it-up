-- Migration: 0007_generic_section_storage
-- Description: Add generic key-value storage for section data and field definitions
-- Date: 2025-11-12

-- ============================================================================
-- FIELD TYPE SYSTEM
-- ============================================================================

-- Define available field types that can be used in forms
CREATE TABLE IF NOT EXISTS field_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type_name TEXT UNIQUE NOT NULL, -- text, textarea, number, date, select, multiselect, checkbox, radio, file, email, phone, url
    display_name TEXT NOT NULL,
    validation_schema TEXT, -- JSON schema for validation rules
    default_config TEXT, -- JSON with default configuration
    icon TEXT, -- icon name or emoji
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION FIELD DEFINITIONS
-- ============================================================================

-- Define the fields for each section (form builder schema)
CREATE TABLE IF NOT EXISTS section_fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id INTEGER NOT NULL,
    field_name TEXT NOT NULL, -- unique identifier for this field (e.g., 'jurisdiction', 'appointment_date')
    field_label TEXT NOT NULL, -- display label (e.g., 'Jurisdiction', 'Appointment Date')
    field_type_id INTEGER NOT NULL, -- references field_types
    field_config TEXT, -- JSON config (e.g., options for select, validation rules, placeholder, etc)
    is_required BOOLEAN DEFAULT 0,
    importance_level TEXT DEFAULT 'optional' CHECK(importance_level IN ('critical', 'important', 'optional')), -- for scoring
    help_text TEXT, -- helper text shown to user
    placeholder TEXT, -- placeholder text for input
    default_value TEXT, -- default value for field
    display_order INTEGER DEFAULT 0,
    conditional_logic TEXT, -- JSON for show/hide logic based on other fields
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (field_type_id) REFERENCES field_types(id),
    UNIQUE(section_id, field_name)
);

-- ============================================================================
-- GENERIC SECTION DATA STORAGE
-- ============================================================================

-- Store all section data as JSON (replaces custom tables like wedding_marriage_license, etc)
CREATE TABLE IF NOT EXISTS section_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    section_id INTEGER NOT NULL,
    data TEXT NOT NULL, -- JSON object with field_name: value pairs
    completed_fields INTEGER DEFAULT 0, -- cache for scoring
    total_fields INTEGER DEFAULT 0, -- cache for scoring
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    UNIQUE(user_id, section_id)
);

-- ============================================================================
-- JOURNEY CREATOR SYSTEM
-- ============================================================================

-- Track who created each journey (for creator-focused platform)
CREATE TABLE IF NOT EXISTS journey_creators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journey_id INTEGER NOT NULL UNIQUE,
    creator_user_id INTEGER NOT NULL,
    is_published BOOLEAN DEFAULT 0,
    is_featured BOOLEAN DEFAULT 0,
    use_count INTEGER DEFAULT 0, -- how many users joined this journey
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
    FOREIGN KEY (creator_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Allow journeys to be templates that others can clone
CREATE TABLE IF NOT EXISTS journey_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_journey_id INTEGER NOT NULL,
    cloned_journey_id INTEGER NOT NULL,
    cloned_by_user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
    FOREIGN KEY (cloned_journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
    FOREIGN KEY (cloned_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_section_fields_section ON section_fields(section_id);
CREATE INDEX IF NOT EXISTS idx_section_fields_type ON section_fields(field_type_id);
CREATE INDEX IF NOT EXISTS idx_section_fields_order ON section_fields(section_id, display_order);

CREATE INDEX IF NOT EXISTS idx_section_data_user ON section_data(user_id);
CREATE INDEX IF NOT EXISTS idx_section_data_section ON section_data(section_id);
CREATE INDEX IF NOT EXISTS idx_section_data_user_section ON section_data(user_id, section_id);

CREATE INDEX IF NOT EXISTS idx_journey_creators_creator ON journey_creators(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_journey_creators_published ON journey_creators(is_published);

CREATE INDEX IF NOT EXISTS idx_journey_templates_template ON journey_templates(template_journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_templates_cloned_by ON journey_templates(cloned_by_user_id);

-- ============================================================================
-- SEED DATA: Field Types
-- ============================================================================

INSERT INTO field_types (type_name, display_name, validation_schema, default_config, icon) VALUES
('text', 'Text Input', '{"type": "string", "maxLength": 255}', '{"placeholder": "Enter text..."}', '📝'),
('textarea', 'Text Area', '{"type": "string", "maxLength": 5000}', '{"placeholder": "Enter details...", "rows": 4}', '📄'),
('number', 'Number', '{"type": "number"}', '{"placeholder": "Enter number..."}', '🔢'),
('date', 'Date', '{"type": "string", "format": "date"}', '{}', '📅'),
('datetime', 'Date & Time', '{"type": "string", "format": "date-time"}', '{}', '🕐'),
('select', 'Dropdown', '{"type": "string"}', '{"options": []}', '📋'),
('multiselect', 'Multi-Select', '{"type": "array"}', '{"options": []}', '☑️'),
('checkbox', 'Checkbox', '{"type": "boolean"}', '{}', '✅'),
('radio', 'Radio Buttons', '{"type": "string"}', '{"options": []}', '🔘'),
('email', 'Email', '{"type": "string", "format": "email"}', '{"placeholder": "email@example.com"}', '📧'),
('phone', 'Phone', '{"type": "string", "pattern": "^[0-9+\\-\\(\\)\\s]+$"}', '{"placeholder": "(555) 123-4567"}', '📞'),
('url', 'URL', '{"type": "string", "format": "uri"}', '{"placeholder": "https://example.com"}', '🔗'),
('file', 'File Upload', '{"type": "string"}', '{"maxSize": 5242880, "accept": "*"}', '📎'),
('currency', 'Currency', '{"type": "number"}', '{"prefix": "$", "placeholder": "0.00"}', '💰'),
('rating', 'Rating', '{"type": "number", "minimum": 1, "maximum": 5}', '{"max": 5}', '⭐');
