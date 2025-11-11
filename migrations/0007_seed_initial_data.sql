-- Migration: 0007_seed_initial_data
-- Description: Seed initial data for journeys, categories, sections, and service tiers
-- Date: 2025-11-11

-- ============================================================================
-- SERVICE TIERS
-- ============================================================================

INSERT INTO service_tiers (slug, name, description, price_monthly, price_annual, display_order, features_json) VALUES
('essentials', 'Essentials', 'Complete your journey at your own pace', 0, 0, 1, '["Full access to all forms and checklists", "AI-powered assistance", "Progress tracking with readiness score", "PDF export of your completed documents", "Unlimited saves and updates"]'),
('guided', 'Guided', 'Get expert feedback on your progress', 29, 290, 2, '["Everything in Essentials", "Submit sections for expert review", "Detailed feedback and suggestions", "Mentor assignment for your journey", "Email support and notifications", "Priority AI assistance"]'),
('premium', 'Premium', 'White-glove support with 1-on-1 guidance', 99, 990, 3, '["Everything in Guided", "Schedule 1-on-1 sessions with expert guides", "Personalized walkthrough of complex sections", "Pre-session preparation checklists", "Post-session notes and action items", "Priority scheduling", "Dedicated guide assignment"]');

-- Tier features
INSERT INTO tier_features (tier_id, feature_key, is_enabled) VALUES
-- Essentials features
(1, 'form_access', 1),
(1, 'ai_assistance', 1),
(1, 'progress_tracking', 1),
(1, 'pdf_export', 1),
(1, 'auto_save', 1),
-- Guided features (inherits + adds)
(2, 'form_access', 1),
(2, 'ai_assistance', 1),
(2, 'progress_tracking', 1),
(2, 'pdf_export', 1),
(2, 'auto_save', 1),
(2, 'mentor_review', 1),
(2, 'review_feedback', 1),
(2, 'email_notifications', 1),
-- Premium features (inherits + adds)
(3, 'form_access', 1),
(3, 'ai_assistance', 1),
(3, 'progress_tracking', 1),
(3, 'pdf_export', 1),
(3, 'auto_save', 1),
(3, 'mentor_review', 1),
(3, 'review_feedback', 1),
(3, 'email_notifications', 1),
(3, 'session_booking', 1),
(3, 'dedicated_guide', 1),
(3, 'priority_support', 1);

-- ============================================================================
-- CATEGORIES (reusable across journeys)
-- ============================================================================

INSERT INTO categories (name, description, icon) VALUES
-- Care Journey categories
('plan', 'Legal & Financial Foundation', '📋'),
('care', 'Health & Daily Life', '🏥'),
('connect', 'Relationships & History', '👨‍👩‍👧‍👦'),
('support', 'Digital & Practical', '💻'),
('legacy', 'End-of-Life Planning', '🕊️'),

-- Wedding Journey categories
('wedding_legal', 'Legal & Financial', '📝'),
('ceremony', 'Ceremony Planning', '💒'),
('celebration', 'Reception & Events', '🎉'),
('living_together', 'Merging Lives', '🏠'),

-- Baby Journey categories
('baby_preparation', 'Preparation', '🍼'),
('baby_medical', 'Healthcare', '🏥'),
('baby_financial', 'Financial Planning', '💰'),
('baby_home', 'Home & Safety', '🏡'),
('baby_support', 'Support Network', '👶'),

-- Move Journey categories
('move_planning', 'Planning & Timeline', '📅'),
('move_logistics', 'Moving Logistics', '🚚'),
('move_financial', 'Financial Details', '💵'),
('move_settling', 'Settling In', '🔑'),

-- Health Journey categories
('health_medical', 'Medical Care', '⚕️'),
('health_financial', 'Financial Planning', '💊'),
('health_lifestyle', 'Lifestyle Adjustments', '🥗'),
('health_support', 'Support System', '🤝'),
('health_legal', 'Legal Preparation', '📄');

-- ============================================================================
-- SECTIONS (reusable, can be shared across journeys)
-- ============================================================================

INSERT INTO sections (slug, name, description, scoring_type, weight) VALUES
-- Existing sections from Care journey
('credentials', 'Digital Accounts', 'Usernames and passwords for important online accounts', 'list_items', 6),
('personal_info', 'Personal Information', 'Basic personal and contact information', 'field_count', 8),
('family_history', 'Family History', 'Family members and relationships', 'field_count', 5),
('pets', 'Pets', 'Pet information and care instructions', 'list_items', 3),
('contacts', 'Key Contacts', 'Important people to notify', 'list_items', 7),
('legal', 'Legal Documents', 'Wills, trusts, and legal paperwork', 'list_items', 9),
('financial', 'Financial Accounts', 'Bank accounts and investments', 'list_items', 8),
('insurance', 'Insurance Policies', 'Life, health, and property insurance', 'list_items', 7),
('employment', 'Employment History', 'Current and past employment details', 'list_items', 5),
('medical', 'Medical Information', 'Health conditions and medical history', 'field_count', 8),
('physicians', 'Healthcare Providers', 'Doctors and specialists', 'list_items', 6),
('residence', 'Primary Residence', 'Home ownership and property details', 'field_count', 6),
('vehicles', 'Vehicles', 'Cars and vehicle information', 'list_items', 4),
('real_estate', 'Other Real Estate', 'Additional properties owned', 'list_items', 5),
('personal_property', 'Personal Property', 'Valuable possessions and heirlooms', 'list_items', 4),
('final_days', 'Final Days Wishes', 'Preferences for end-of-life care', 'field_count', 7),
('after_death', 'After Death Arrangements', 'Body disposition preferences', 'field_count', 8),
('funeral', 'Funeral Planning', 'Memorial service details', 'field_count', 6),
('obituary', 'Obituary', 'Life story and obituary information', 'field_count', 4),
('conclusion', 'Final Thoughts', 'Messages for loved ones', 'field_count', 4),

-- New sections for Wedding journey
('marriage_license', 'Marriage License', 'Legal marriage documentation', 'field_count', 9),
('prenup', 'Prenuptial Agreement', 'Financial agreements before marriage', 'field_count', 7),
('joint_accounts', 'Joint Accounts', 'Merging finances and accounts', 'list_items', 8),
('name_change', 'Name Change', 'Process for changing legal name', 'field_count', 6),
('venue', 'Venue Selection', 'Ceremony and reception location', 'field_count', 8),
('vendors', 'Vendor Contracts', 'Caterers, photographers, florists, etc.', 'list_items', 7),
('guest_list', 'Guest List', 'Invitations and RSVP tracking', 'list_items', 6),
('registry', 'Gift Registry', 'Wedding gift preferences', 'field_count', 4),
('home_setup', 'Home Setup', 'Living arrangements and household planning', 'field_count', 7),

-- New sections for Baby journey
('hospital_selection', 'Hospital & Birth Plan', 'Where and how you plan to deliver', 'field_count', 9),
('pediatrician', 'Pediatrician Selection', 'Choosing your baby''s doctor', 'field_count', 8),
('baby_insurance', 'Health Insurance', 'Adding baby to insurance coverage', 'field_count', 9),
('parental_leave', 'Parental Leave', 'Work leave planning', 'field_count', 7),
('baby_budget', 'Baby Budget', 'Financial planning for new expenses', 'field_count', 8),
('nursery', 'Nursery Setup', 'Baby room preparation', 'field_count', 6),
('baby_gear', 'Baby Gear & Supplies', 'Essential items checklist', 'list_items', 6),
('childcare', 'Childcare Plans', 'Daycare or nanny arrangements', 'field_count', 8),
('will_guardianship', 'Will & Guardianship', 'Legal protection for your child', 'field_count', 9),
('support_network', 'Support Network', 'Family and friends who can help', 'list_items', 6),

-- New sections for Move journey
('move_timeline', 'Moving Timeline', 'Key dates and milestones', 'field_count', 7),
('move_budget', 'Moving Budget', 'Estimated costs and expenses', 'field_count', 8),
('moving_company', 'Moving Company', 'Professional movers or DIY planning', 'field_count', 7),
('packing', 'Packing Plan', 'Room-by-room packing strategy', 'list_items', 5),
('utilities_setup', 'Utilities Setup', 'Electricity, water, internet, etc.', 'list_items', 8),
('address_change', 'Address Changes', 'Updating official records', 'list_items', 9),
('lease_mortgage', 'Lease/Mortgage', 'Housing contract details', 'field_count', 9),
('school_transfer', 'School Transfers', 'Enrolling children in new schools', 'field_count', 7),
('community_orientation', 'Community Orientation', 'Finding local services and amenities', 'list_items', 5),

-- New sections for Health journey
('diagnosis_info', 'Diagnosis Information', 'Details about your condition', 'field_count', 9),
('specialists', 'Specialist Team', 'Doctors and healthcare providers', 'list_items', 9),
('treatment_plan', 'Treatment Plan', 'Medications and procedures', 'field_count', 9),
('health_insurance', 'Health Insurance', 'Coverage and claims', 'field_count', 8),
('medical_expenses', 'Medical Expenses', 'Tracking costs and budgeting', 'field_count', 7),
('diet_exercise', 'Diet & Exercise', 'Lifestyle modifications', 'field_count', 6),
('mental_health', 'Mental Health Support', 'Counseling and coping strategies', 'field_count', 7),
('caregiver_network', 'Caregiver Network', 'People helping with your care', 'list_items', 8),
('advance_directive', 'Advance Directive', 'Healthcare decision-making documents', 'field_count', 9),
('disability_benefits', 'Disability Benefits', 'Financial assistance programs', 'field_count', 7);

-- ============================================================================
-- JOURNEYS
-- ============================================================================

INSERT INTO journeys (slug, name, description, icon, is_active) VALUES
('care', 'Care Journey', 'Prepare for assisted living and end-of-life planning with comprehensive documentation', '🤍', 1),
('wedding', 'Wedding Journey', 'Plan your marriage with legal, financial, and celebration preparation', '💍', 1),
('baby', 'Baby Journey', 'Prepare for parenthood with medical, financial, and home planning', '👶', 1),
('move', 'Move Journey', 'Organize your relocation with logistics, financial, and settling-in support', '🏡', 1),
('health', 'Health Journey', 'Navigate a health diagnosis with medical, financial, and support planning', '💚', 1);

-- ============================================================================
-- JOURNEY CATEGORIES (linking journeys to categories)
-- ============================================================================

-- Care Journey categories
INSERT INTO journey_categories (journey_id, category_id, display_order) VALUES
(1, 1, 1), -- plan
(1, 2, 2), -- care
(1, 3, 3), -- connect
(1, 4, 4), -- support
(1, 5, 5); -- legacy

-- Wedding Journey categories
INSERT INTO journey_categories (journey_id, category_id, display_order) VALUES
(2, 6, 1),  -- wedding_legal
(2, 7, 2),  -- ceremony
(2, 8, 3),  -- celebration
(2, 9, 4);  -- living_together

-- Baby Journey categories
INSERT INTO journey_categories (journey_id, category_id, display_order) VALUES
(3, 10, 1), -- baby_preparation
(3, 11, 2), -- baby_medical
(3, 12, 3), -- baby_financial
(3, 13, 4), -- baby_home
(3, 14, 5); -- baby_support

-- Move Journey categories
INSERT INTO journey_categories (journey_id, category_id, display_order) VALUES
(4, 15, 1), -- move_planning
(4, 16, 2), -- move_logistics
(4, 17, 3), -- move_financial
(4, 18, 4); -- move_settling

-- Health Journey categories
INSERT INTO journey_categories (journey_id, category_id, display_order) VALUES
(5, 19, 1), -- health_medical
(5, 20, 2), -- health_financial
(5, 21, 3), -- health_lifestyle
(5, 22, 4), -- health_support
(5, 23, 5); -- health_legal

-- ============================================================================
-- JOURNEY SECTIONS (linking sections to journeys with categories)
-- ============================================================================

-- Care Journey sections
INSERT INTO journey_sections (journey_id, section_id, category_id, display_order, is_required) VALUES
-- Plan category
(1, 6, 1, 1, 1),   -- legal
(1, 7, 1, 2, 1),   -- financial
(1, 8, 1, 3, 0),   -- insurance
(1, 9, 1, 4, 0),   -- employment
-- Care category
(1, 2, 2, 1, 1),   -- personal_info
(1, 10, 2, 2, 1),  -- medical
(1, 11, 2, 3, 0),  -- physicians
(1, 12, 2, 4, 0),  -- residence
(1, 13, 2, 5, 0),  -- vehicles
(1, 14, 2, 6, 0),  -- real_estate
(1, 15, 2, 7, 0),  -- personal_property
-- Connect category
(1, 3, 3, 1, 0),   -- family_history
(1, 5, 3, 2, 1),   -- contacts
(1, 4, 3, 3, 0),   -- pets
-- Support category
(1, 1, 4, 1, 0),   -- credentials
-- Legacy category
(1, 16, 5, 1, 0),  -- final_days
(1, 17, 5, 2, 0),  -- after_death
(1, 18, 5, 3, 0),  -- funeral
(1, 19, 5, 4, 0),  -- obituary
(1, 20, 5, 5, 0);  -- conclusion

-- Wedding Journey sections
INSERT INTO journey_sections (journey_id, section_id, category_id, display_order, is_required) VALUES
-- Wedding Legal category
(2, 21, 6, 1, 1),  -- marriage_license
(2, 22, 6, 2, 0),  -- prenup
(2, 23, 6, 3, 1),  -- joint_accounts
(2, 24, 6, 4, 0),  -- name_change
-- Ceremony category
(2, 25, 7, 1, 1),  -- venue
(2, 26, 7, 2, 1),  -- vendors
-- Celebration category
(2, 27, 8, 1, 1),  -- guest_list
(2, 28, 8, 2, 0),  -- registry
-- Living Together category
(2, 29, 9, 1, 1);  -- home_setup

-- Baby Journey sections
INSERT INTO journey_sections (journey_id, section_id, category_id, display_order, is_required) VALUES
-- Preparation category
(3, 30, 10, 1, 1), -- hospital_selection
(3, 31, 10, 2, 1), -- pediatrician
-- Baby Medical category
(3, 32, 11, 1, 1), -- baby_insurance
(3, 11, 11, 2, 0), -- physicians (reused)
-- Baby Financial category
(3, 33, 12, 1, 0), -- parental_leave
(3, 34, 12, 2, 1), -- baby_budget
-- Baby Home category
(3, 35, 13, 1, 0), -- nursery
(3, 36, 13, 2, 1), -- baby_gear
-- Baby Support category
(3, 37, 14, 1, 1), -- childcare
(3, 38, 14, 2, 1), -- will_guardianship
(3, 39, 14, 3, 0); -- support_network

-- Move Journey sections
INSERT INTO journey_sections (journey_id, section_id, category_id, display_order, is_required) VALUES
-- Move Planning category
(4, 40, 15, 1, 1), -- move_timeline
(4, 41, 15, 2, 1), -- move_budget
-- Move Logistics category
(4, 42, 16, 1, 1), -- moving_company
(4, 43, 16, 2, 0), -- packing
-- Move Financial category
(4, 44, 17, 1, 1), -- utilities_setup
(4, 45, 17, 2, 1), -- address_change
(4, 46, 17, 3, 1), -- lease_mortgage
-- Move Settling category
(4, 47, 18, 1, 0), -- school_transfer
(4, 48, 18, 2, 0); -- community_orientation

-- Health Journey sections
INSERT INTO journey_sections (journey_id, section_id, category_id, display_order, is_required) VALUES
-- Health Medical category
(5, 49, 19, 1, 1), -- diagnosis_info
(5, 50, 19, 2, 1), -- specialists
(5, 51, 19, 3, 1), -- treatment_plan
-- Health Financial category
(5, 52, 20, 1, 1), -- health_insurance
(5, 53, 20, 2, 0), -- medical_expenses
-- Health Lifestyle category
(5, 54, 21, 1, 0), -- diet_exercise
(5, 55, 21, 2, 0), -- mental_health
-- Health Support category
(5, 56, 22, 1, 1), -- caregiver_network
-- Health Legal category
(5, 57, 23, 1, 1), -- advance_directive
(5, 58, 23, 2, 0); -- disability_benefits
