-- Migration 0014: Advanced Mentor Features (Phase 6)
-- Created: 2025-11-13
-- Description: Adds mentor availability, review templates, training modules, and specializations

-- ============================================================================
-- Phase 6.1: Mentor Availability Management
-- ============================================================================

-- Mentor weekly availability schedule
CREATE TABLE IF NOT EXISTS mentor_availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mentor_user_id INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL, -- 0-6 (Sunday=0, Monday=1, ..., Saturday=6)
    start_time TEXT NOT NULL, -- HH:MM format (24-hour)
    end_time TEXT NOT NULL, -- HH:MM format (24-hour)
    timezone TEXT NOT NULL DEFAULT 'UTC', -- IANA timezone (e.g., 'America/New_York')
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mentor_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (day_of_week >= 0 AND day_of_week <= 6),
    CHECK (start_time < end_time)
);

CREATE INDEX idx_mentor_availability_mentor ON mentor_availability(mentor_user_id);
CREATE INDEX idx_mentor_availability_active ON mentor_availability(mentor_user_id, is_active);
CREATE INDEX idx_mentor_availability_day ON mentor_availability(day_of_week);

-- Mentor blocked/vacation dates
CREATE TABLE IF NOT EXISTS mentor_blocked_dates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mentor_user_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mentor_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (start_date <= end_date)
);

CREATE INDEX idx_mentor_blocked_dates_mentor ON mentor_blocked_dates(mentor_user_id);
CREATE INDEX idx_mentor_blocked_dates_active ON mentor_blocked_dates(mentor_user_id, is_active);
CREATE INDEX idx_mentor_blocked_dates_range ON mentor_blocked_dates(start_date, end_date);

-- ============================================================================
-- Phase 6.2: Review Templates & Training
-- ============================================================================

-- Reusable review feedback templates
CREATE TABLE IF NOT EXISTS review_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mentor_user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    section_type TEXT, -- NULL for general templates, or specific section types
    category TEXT, -- 'positive', 'constructive', 'question', 'general'
    is_shared BOOLEAN DEFAULT 0, -- Share with other mentors as examples
    usage_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mentor_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_review_templates_mentor ON review_templates(mentor_user_id);
CREATE INDEX idx_review_templates_section_type ON review_templates(section_type);
CREATE INDEX idx_review_templates_shared ON review_templates(is_shared);
CREATE INDEX idx_review_templates_category ON review_templates(category);

-- Mentor training modules
CREATE TABLE IF NOT EXISTS mentor_training_modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL, -- Markdown content
    video_url TEXT, -- YouTube/Vimeo embed URL (optional)
    duration_minutes INTEGER, -- Estimated completion time
    order_index INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_training_modules_order ON mentor_training_modules(order_index);
CREATE INDEX idx_training_modules_required ON mentor_training_modules(is_required);
CREATE INDEX idx_training_modules_active ON mentor_training_modules(is_active);

-- Track mentor training progress
CREATE TABLE IF NOT EXISTS mentor_training_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mentor_user_id INTEGER NOT NULL,
    module_id INTEGER NOT NULL,
    started_at DATETIME,
    completed_at DATETIME,
    score INTEGER, -- Optional quiz score (0-100)
    notes TEXT, -- Mentor's notes
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mentor_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES mentor_training_modules(id) ON DELETE CASCADE,
    UNIQUE(mentor_user_id, module_id)
);

CREATE INDEX idx_training_progress_mentor ON mentor_training_progress(mentor_user_id);
CREATE INDEX idx_training_progress_module ON mentor_training_progress(module_id);
CREATE INDEX idx_training_progress_completed ON mentor_training_progress(mentor_user_id, completed_at);

-- Quality checklists for reviews
CREATE TABLE IF NOT EXISTS review_quality_checklists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    section_type TEXT, -- NULL for general, or specific section types
    checklist_items TEXT NOT NULL, -- JSON array of checklist items
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quality_checklists_section_type ON review_quality_checklists(section_type);
CREATE INDEX idx_quality_checklists_active ON review_quality_checklists(is_active);

-- ============================================================================
-- Phase 6.3: Mentor Specializations & Matching
-- ============================================================================

-- Mentor specialization categories
CREATE TABLE IF NOT EXISTS mentor_specializations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT, -- Icon name or emoji
    color TEXT, -- Hex color for UI badges
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_specializations_active ON mentor_specializations(is_active);
CREATE INDEX idx_specializations_slug ON mentor_specializations(slug);

-- Map mentors to their specializations
CREATE TABLE IF NOT EXISTS mentor_specialization_map (
    mentor_user_id INTEGER NOT NULL,
    specialization_id INTEGER NOT NULL,
    proficiency_level INTEGER DEFAULT 3, -- 1-5 scale (1=beginner, 5=expert)
    years_experience INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT 0, -- Primary specialization
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (mentor_user_id, specialization_id),
    FOREIGN KEY (mentor_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (specialization_id) REFERENCES mentor_specializations(id) ON DELETE CASCADE,
    CHECK (proficiency_level >= 1 AND proficiency_level <= 5)
);

CREATE INDEX idx_mentor_specialization_mentor ON mentor_specialization_map(mentor_user_id);
CREATE INDEX idx_mentor_specialization_spec ON mentor_specialization_map(specialization_id);
CREATE INDEX idx_mentor_specialization_primary ON mentor_specialization_map(mentor_user_id, is_primary);

-- Client preferences for mentor matching
CREATE TABLE IF NOT EXISTS client_mentor_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    preferred_mentor_id INTEGER, -- Preferred mentor (optional)
    blocked_mentor_ids TEXT, -- JSON array of blocked mentor user IDs
    preferred_specializations TEXT, -- JSON array of preferred specialization IDs
    preferred_communication_style TEXT, -- 'direct', 'encouraging', 'detailed', etc.
    notes TEXT, -- Client notes about preferences
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (preferred_mentor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_client_preferences_user ON client_mentor_preferences(user_id);
CREATE INDEX idx_client_preferences_mentor ON client_mentor_preferences(preferred_mentor_id);

-- Track successful mentor-client matches for learning
CREATE TABLE IF NOT EXISTS mentor_match_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL,
    mentor_user_id INTEGER NOT NULL,
    client_user_id INTEGER NOT NULL,
    journey_id INTEGER NOT NULL,
    section_id INTEGER NOT NULL,
    match_score REAL, -- Calculated match score (0-100)
    match_reasons TEXT, -- JSON array of match reasons
    client_rating INTEGER, -- Final client rating (1-5)
    would_work_again BOOLEAN, -- Would client work with this mentor again?
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES section_reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (mentor_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
);

CREATE INDEX idx_match_history_mentor ON mentor_match_history(mentor_user_id);
CREATE INDEX idx_match_history_client ON mentor_match_history(client_user_id);
CREATE INDEX idx_match_history_review ON mentor_match_history(review_id);
CREATE INDEX idx_match_history_rating ON mentor_match_history(client_rating);

-- ============================================================================
-- Seed Data: Default Specializations
-- ============================================================================

INSERT OR IGNORE INTO mentor_specializations (name, slug, description, icon, color) VALUES
('Career Development', 'career-development', 'Career planning, job search, and professional growth', '💼', '#3B82F6'),
('Technical Skills', 'technical-skills', 'Programming, data analysis, and technical competencies', '💻', '#8B5CF6'),
('Leadership', 'leadership', 'Management, team building, and leadership development', '👥', '#F59E0B'),
('Communication', 'communication', 'Public speaking, writing, and interpersonal skills', '🗣️', '#10B981'),
('Entrepreneurship', 'entrepreneurship', 'Starting and growing businesses', '🚀', '#EF4444'),
('Creative Skills', 'creative-skills', 'Design, writing, art, and creative pursuits', '🎨', '#EC4899'),
('Personal Development', 'personal-development', 'Self-improvement, habits, and mindset', '🌱', '#14B8A6'),
('Finance', 'finance', 'Personal finance, investing, and money management', '💰', '#F97316');

-- ============================================================================
-- Seed Data: Default Training Modules
-- ============================================================================

INSERT OR IGNORE INTO mentor_training_modules (title, description, content, duration_minutes, order_index, is_required) VALUES
(
    'Welcome to Mentoring',
    'Introduction to the Wrap It Up mentor program',
    '# Welcome to Wrap It Up Mentoring

## Your Role as a Mentor

As a mentor on Wrap It Up, you play a crucial role in helping learners achieve their goals. Your feedback, guidance, and support can make the difference between someone giving up and someone breaking through to success.

## Key Responsibilities

1. **Timely Reviews**: Claim and complete reviews within 24-48 hours
2. **Quality Feedback**: Provide specific, actionable, and encouraging feedback
3. **Professional Communication**: Maintain a supportive and respectful tone
4. **Continuous Learning**: Complete training modules and stay updated on best practices

## What Makes Great Feedback

- **Specific**: Point to exact examples in their work
- **Actionable**: Suggest concrete next steps
- **Balanced**: Highlight strengths and areas for improvement
- **Encouraging**: Recognize effort and progress

## Getting Started

Complete the remaining training modules to learn our review framework and best practices. Once complete, you''ll be ready to start claiming reviews!',
    15,
    1,
    1
),
(
    'Review Framework & Best Practices',
    'Learn the structured approach to providing effective reviews',
    '# Review Framework

## The 3-Part Review Structure

### 1. Strengths (What''s Working)
Start by identifying what the learner did well. This builds confidence and shows you''re paying attention to their effort.

**Example**: "Your analysis of the market trends shows strong research skills. I can tell you spent time gathering diverse sources."

### 2. Growth Areas (What to Improve)
Provide specific, actionable feedback on areas for improvement. Use the "I notice... I wonder..." framework.

**Example**: "I notice your conclusion jumps quickly to recommendations. I wonder if adding a transition section explaining your reasoning would help readers follow your logic?"

### 3. Next Steps (Action Items)
End with 2-3 clear, prioritized action items.

**Example**:
1. Add transition paragraph between analysis and recommendations
2. Include 2-3 supporting examples for each recommendation
3. Resubmit when ready for another review

## Common Mistakes to Avoid

- ❌ Vague feedback: "Good job" or "Needs work"
- ❌ Overwhelming with too many suggestions
- ❌ Focusing only on problems without recognizing strengths
- ❌ Being overly critical or discouraging

## The Golden Rule

Review as you would want to be reviewed: with honesty, specificity, and kindness.',
    20,
    2,
    1
),
(
    'Effective Communication & Tone',
    'Master the art of supportive, professional communication',
    '# Communication & Tone

## Voice & Style

Your written tone conveys as much as your words. Aim for:

- **Supportive**: "I can see you''re making progress with..."
- **Collaborative**: "Let''s work on..." instead of "You need to fix..."
- **Growth-minded**: "This draft shows improvement" vs "This is still not good"

## Phrase Framework

### Instead of... → Try...

- "This is wrong" → "I notice [X]. Have you considered [Y]?"
- "You didn''t follow instructions" → "The prompt asks for [X]. I see you focused on [Y]. Let''s align these."
- "This needs a lot of work" → "Here are 3 priority areas to focus on next..."

## Handling Difficult Situations

### When Work is Significantly Below Standard
1. Acknowledge the effort
2. Be honest but kind about gaps
3. Provide a clear roadmap to improvement
4. Offer encouragement

**Example**: "I can see you put effort into this submission. To meet the learning objectives, we need to strengthen [X, Y, Z]. Here''s a step-by-step approach to get there..."

### When You''re Unsure About Something
It''s okay to not know everything! Be honest:

"This is outside my primary area of expertise, but here are my thoughts... You might also want to research [topic] or consult [resource]."',
    15,
    3,
    1
);

-- ============================================================================
-- Seed Data: Default Quality Checklists
-- ============================================================================

INSERT OR IGNORE INTO review_quality_checklists (name, description, section_type, checklist_items) VALUES
(
    'General Review Quality',
    'Standard checklist for all reviews',
    NULL,
    '[
        {"item": "Reviewed all submitted content thoroughly", "required": true},
        {"item": "Identified specific strengths in the work", "required": true},
        {"item": "Provided actionable feedback for improvement", "required": true},
        {"item": "Included 2-3 clear next steps", "required": true},
        {"item": "Used supportive and professional tone", "required": true},
        {"item": "Checked for spelling/grammar in feedback", "required": false},
        {"item": "Responded to any direct questions from learner", "required": true}
    ]'
),
(
    'Text/Essay Review',
    'Checklist for reviewing written content',
    'text',
    '[
        {"item": "Evaluated structure and organization", "required": true},
        {"item": "Provided feedback on clarity and coherence", "required": true},
        {"item": "Highlighted strong examples or arguments", "required": true},
        {"item": "Suggested specific improvements for weak areas", "required": true},
        {"item": "Checked that main objectives were addressed", "required": true},
        {"item": "Commented on writing style and voice", "required": false}
    ]'
);

-- ============================================================================
-- Views for Mentor Matching
-- ============================================================================

-- View: Available mentors (not blocked, has availability)
CREATE VIEW IF NOT EXISTS available_mentors AS
SELECT DISTINCT
    mp.id as mentor_profile_id,
    mp.user_id as mentor_user_id,
    u.username,
    u.email,
    mp.bio,
    mp.average_rating,
    mp.total_reviews_completed,
    mp.specialties,
    mp.is_available,
    COUNT(DISTINCT ma.id) as availability_slots,
    COUNT(DISTINCT mbd.id) as active_blocks
FROM mentor_profiles mp
INNER JOIN users u ON mp.user_id = u.id
LEFT JOIN mentor_availability ma ON mp.user_id = ma.mentor_user_id AND ma.is_active = 1
LEFT JOIN mentor_blocked_dates mbd ON mp.user_id = mbd.mentor_user_id
    AND mbd.is_active = 1
    AND DATE('now') BETWEEN mbd.start_date AND mbd.end_date
WHERE mp.is_available = 1
    AND mp.approval_status = 'approved'
GROUP BY mp.id, mp.user_id, u.username, u.email, mp.bio, mp.average_rating,
         mp.total_reviews_completed, mp.specialties, mp.is_available;

-- View: Mentor specialization summary
CREATE VIEW IF NOT EXISTS mentor_specialization_summary AS
SELECT
    mp.user_id as mentor_user_id,
    u.username,
    GROUP_CONCAT(ms.name, ', ') as specialization_names,
    GROUP_CONCAT(ms.slug, ',') as specialization_slugs,
    COUNT(msm.specialization_id) as total_specializations,
    MAX(CASE WHEN msm.is_primary = 1 THEN ms.name END) as primary_specialization
FROM mentor_profiles mp
INNER JOIN users u ON mp.user_id = u.id
LEFT JOIN mentor_specialization_map msm ON mp.user_id = msm.mentor_user_id
LEFT JOIN mentor_specializations ms ON msm.specialization_id = ms.id AND ms.is_active = 1
WHERE mp.approval_status = 'approved'
GROUP BY mp.user_id, u.username;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update review_templates.updated_at on modification
CREATE TRIGGER IF NOT EXISTS update_review_templates_timestamp
AFTER UPDATE ON review_templates
FOR EACH ROW
BEGIN
    UPDATE review_templates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update mentor_availability.updated_at on modification
CREATE TRIGGER IF NOT EXISTS update_mentor_availability_timestamp
AFTER UPDATE ON mentor_availability
FOR EACH ROW
BEGIN
    UPDATE mentor_availability SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update mentor_blocked_dates.updated_at on modification
CREATE TRIGGER IF NOT EXISTS update_mentor_blocked_dates_timestamp
AFTER UPDATE ON mentor_blocked_dates
FOR EACH ROW
BEGIN
    UPDATE mentor_blocked_dates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Increment template usage count when used
CREATE TRIGGER IF NOT EXISTS increment_template_usage
AFTER INSERT ON section_reviews
FOR EACH ROW
WHEN NEW.review_notes LIKE '%[template:%'
BEGIN
    -- This is a simplified version - in practice, you'd parse the template ID from review_notes
    -- and increment the specific template's usage_count
    NULL; -- Placeholder for future implementation
END;

-- ============================================================================
-- Migration Complete
-- ============================================================================
