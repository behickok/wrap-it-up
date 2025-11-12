-- Migration: 0008_seed_section_fields
-- Description: Seed section fields for existing Care and Wedding journey sections
-- Date: 2025-11-12

-- This migration populates section_fields with field definitions for all existing sections
-- making them work with the new generic form system

-- ============================================================================
-- WEDDING JOURNEY SECTION FIELDS
-- ============================================================================

-- Marriage License Section Fields
INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'jurisdiction',
    'Jurisdiction / County',
    (SELECT id FROM field_types WHERE type_name = 'text'),
    1, -- required
    'critical',
    'The county or jurisdiction where you will file your marriage license',
    'Enter jurisdiction or county name',
    1,
    NULL
FROM sections s WHERE s.slug = 'marriage_license';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'office_address',
    'Clerk Office Address',
    (SELECT id FROM field_types WHERE type_name = 'textarea'),
    0,
    'important',
    'Address of the clerk office where you will apply',
    NULL,
    2,
    '{"rows": 3}'
FROM sections s WHERE s.slug = 'marriage_license';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'appointment_date',
    'Appointment Date',
    (SELECT id FROM field_types WHERE type_name = 'date'),
    0,
    'critical',
    'Date of your appointment to apply for the marriage license',
    NULL,
    3,
    NULL
FROM sections s WHERE s.slug = 'marriage_license';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'expiration_date',
    'Expiration Date',
    (SELECT id FROM field_types WHERE type_name = 'date'),
    0,
    'important',
    'Date when the marriage license expires',
    NULL,
    4,
    NULL
FROM sections s WHERE s.slug = 'marriage_license';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'required_documents',
    'Required Documents',
    (SELECT id FROM field_types WHERE type_name = 'textarea'),
    0,
    'critical',
    'List of documents you need to bring',
    'IDs, divorce decrees, certificate copies…',
    5,
    '{"rows": 4}'
FROM sections s WHERE s.slug = 'marriage_license';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'witness_requirements',
    'Witness Requirements',
    (SELECT id FROM field_types WHERE type_name = 'textarea'),
    0,
    'important',
    'Information about witness requirements',
    'Names, number of witnesses, notarization steps',
    6,
    '{"rows": 4}'
FROM sections s WHERE s.slug = 'marriage_license';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'fee_amount',
    'Application Fee',
    (SELECT id FROM field_types WHERE type_name = 'currency'),
    0,
    'optional',
    'Cost of the marriage license application',
    '0.00',
    7,
    '{"prefix": "$", "min": 0, "step": 0.01}'
FROM sections s WHERE s.slug = 'marriage_license';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'confirmation_number',
    'Confirmation Number',
    (SELECT id FROM field_types WHERE type_name = 'text'),
    0,
    'optional',
    'Your appointment confirmation number',
    'Enter confirmation number',
    8,
    NULL
FROM sections s WHERE s.slug = 'marriage_license';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'notes',
    'Notes',
    (SELECT id FROM field_types WHERE type_name = 'textarea'),
    0,
    'optional',
    'Additional notes or reminders',
    'Parking tips, who is picking it up, etc.',
    9,
    '{"rows": 4}'
FROM sections s WHERE s.slug = 'marriage_license';

-- Prenup Section Fields
INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'status',
    'Status',
    (SELECT id FROM field_types WHERE type_name = 'select'),
    0,
    'critical',
    'Current status of your prenuptial agreement',
    NULL,
    1,
    '{"options": [{"value": "considering", "label": "Considering"}, {"value": "in_progress", "label": "In Progress"}, {"value": "completed", "label": "Completed"}, {"value": "not_needed", "label": "Not Needed"}]}'
FROM sections s WHERE s.slug = 'prenup';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'attorney_user',
    'Your Attorney',
    (SELECT id FROM field_types WHERE type_name = 'text'),
    0,
    'important',
    'Name and contact of your attorney',
    'Attorney name and contact',
    2,
    NULL
FROM sections s WHERE s.slug = 'prenup';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'attorney_partner',
    'Partner''s Attorney',
    (SELECT id FROM field_types WHERE type_name = 'text'),
    0,
    'important',
    'Name and contact of your partner''s attorney',
    'Attorney name and contact',
    3,
    NULL
FROM sections s WHERE s.slug = 'prenup';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'agreement_scope',
    'Agreement Scope',
    (SELECT id FROM field_types WHERE type_name = 'textarea'),
    0,
    'critical',
    'What will be covered in the prenuptial agreement',
    'Assets, debts, property, inheritance, etc.',
    4,
    '{"rows": 4}'
FROM sections s WHERE s.slug = 'prenup';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'financial_disclosures_ready',
    'Financial Disclosures Ready',
    (SELECT id FROM field_types WHERE type_name = 'checkbox'),
    0,
    'critical',
    'Check if all financial disclosures are prepared',
    NULL,
    5,
    NULL
FROM sections s WHERE s.slug = 'prenup';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'review_deadline',
    'Review Deadline',
    (SELECT id FROM field_types WHERE type_name = 'date'),
    0,
    'important',
    'Deadline for reviewing the agreement',
    NULL,
    6,
    NULL
FROM sections s WHERE s.slug = 'prenup';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'signing_plan',
    'Signing Plan',
    (SELECT id FROM field_types WHERE type_name = 'textarea'),
    0,
    'important',
    'When and how you will sign the agreement',
    NULL,
    7,
    '{"rows": 3}'
FROM sections s WHERE s.slug = 'prenup';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'storage_plan',
    'Storage Plan',
    (SELECT id FROM field_types WHERE type_name = 'textarea'),
    0,
    'optional',
    'Where you will store the signed agreement',
    NULL,
    8,
    '{"rows": 3}'
FROM sections s WHERE s.slug = 'prenup';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'notes',
    'Notes',
    (SELECT id FROM field_types WHERE type_name = 'textarea'),
    0,
    'optional',
    'Additional notes',
    NULL,
    9,
    '{"rows": 4}'
FROM sections s WHERE s.slug = 'prenup';

-- Joint Finances Section Fields
INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'shared_values',
    'Shared Financial Values',
    (SELECT id FROM field_types WHERE type_name = 'textarea'),
    0,
    'important',
    'Your shared values and goals around money',
    NULL,
    1,
    '{"rows": 4}'
FROM sections s WHERE s.slug = 'joint_accounts';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'accounts_to_merge',
    'Accounts to Merge',
    (SELECT id FROM field_types WHERE type_name = 'textarea'),
    0,
    'critical',
    'Which accounts you plan to combine',
    NULL,
    2,
    '{"rows": 4}'
FROM sections s WHERE s.slug = 'joint_accounts';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'new_accounts',
    'New Accounts Needed',
    (SELECT id FROM field_types WHERE type_name = 'textarea'),
    0,
    'important',
    'New joint accounts you need to open',
    NULL,
    3,
    '{"rows": 4}'
FROM sections s WHERE s.slug = 'joint_accounts';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'bill_split_plan',
    'Bill Splitting Plan',
    (SELECT id FROM field_types WHERE type_name = 'textarea'),
    0,
    'critical',
    'How you will split bills and expenses',
    NULL,
    4,
    '{"rows": 4}'
FROM sections s WHERE s.slug = 'joint_accounts';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'emergency_fund_plan',
    'Emergency Fund Plan',
    (SELECT id FROM field_types WHERE type_name = 'textarea'),
    0,
    'important',
    'Your strategy for building an emergency fund',
    NULL,
    5,
    '{"rows": 4}'
FROM sections s WHERE s.slug = 'joint_accounts';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'budgeting_tools',
    'Budgeting Tools',
    (SELECT id FROM field_types WHERE type_name = 'text'),
    0,
    'optional',
    'Apps or tools you will use for budgeting',
    'YNAB, Mint, spreadsheet, etc.',
    6,
    NULL
FROM sections s WHERE s.slug = 'joint_accounts';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'monthly_checkin_cadence',
    'Monthly Check-in Cadence',
    (SELECT id FROM field_types WHERE type_name = 'text'),
    0,
    'important',
    'How often you will review finances together',
    'First Sunday of each month, etc.',
    7,
    NULL
FROM sections s WHERE s.slug = 'joint_accounts';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'notes',
    'Notes',
    (SELECT id FROM field_types WHERE type_name = 'textarea'),
    0,
    'optional',
    'Additional notes',
    NULL,
    8,
    '{"rows": 4}'
FROM sections s WHERE s.slug = 'joint_accounts';

-- Name Change Section Fields
INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'new_name',
    'New Name',
    (SELECT id FROM field_types WHERE type_name = 'text'),
    0,
    'critical',
    'Your new name after marriage',
    NULL,
    1,
    NULL
FROM sections s WHERE s.slug = 'name_change';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'keeping_current_name',
    'Keeping Current Name',
    (SELECT id FROM field_types WHERE type_name = 'checkbox'),
    0,
    'critical',
    'Check if you are keeping your current name',
    NULL,
    2,
    NULL
FROM sections s WHERE s.slug = 'name_change';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'legal_documents',
    'Legal Documents to Update',
    (SELECT id FROM field_types WHERE type_name = 'textarea'),
    0,
    'critical',
    'List of legal documents that need updating',
    'Social Security card, passport, etc.',
    3,
    '{"rows": 4}'
FROM sections s WHERE s.slug = 'name_change';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'ids_to_update',
    'IDs to Update',
    (SELECT id FROM field_types WHERE type_name = 'textarea'),
    0,
    'important',
    'Driver''s license, professional licenses, etc.',
    NULL,
    4,
    '{"rows": 4}'
FROM sections s WHERE s.slug = 'name_change';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'digital_accounts',
    'Digital Accounts to Update',
    (SELECT id FROM field_types WHERE type_name = 'textarea'),
    0,
    'important',
    'Email, social media, banking apps, etc.',
    NULL,
    5,
    '{"rows": 4}'
FROM sections s WHERE s.slug = 'name_change';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'announcement_plan',
    'Announcement Plan',
    (SELECT id FROM field_types WHERE type_name = 'textarea'),
    0,
    'optional',
    'How you will announce your name change',
    NULL,
    6,
    '{"rows": 3}'
FROM sections s WHERE s.slug = 'name_change';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'target_effective_date',
    'Target Effective Date',
    (SELECT id FROM field_types WHERE type_name = 'date'),
    0,
    'important',
    'When you want the name change to be effective',
    NULL,
    7,
    NULL
FROM sections s WHERE s.slug = 'name_change';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'status',
    'Status',
    (SELECT id FROM field_types WHERE type_name = 'select'),
    0,
    'important',
    'Current status of your name change',
    NULL,
    8,
    '{"options": [{"value": "planning", "label": "Planning"}, {"value": "in_progress", "label": "In Progress"}, {"value": "completed", "label": "Completed"}]}'
FROM sections s WHERE s.slug = 'name_change';

INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, is_required, importance_level, help_text, placeholder, display_order, field_config)
SELECT
    s.id,
    'notes',
    'Notes',
    (SELECT id FROM field_types WHERE type_name = 'textarea'),
    0,
    'optional',
    'Additional notes',
    NULL,
    9,
    '{"rows": 4}'
FROM sections s WHERE s.slug = 'name_change';

-- ============================================================================
-- NOTES
-- ============================================================================
-- Additional sections (venue, vendors, guest_list, registry, home_setup) use
-- list-based components and will need custom handling. They are not included
-- in this initial seed as they require a different approach (list items vs form fields).
--
-- Care journey sections (credentials, legal, financial, etc.) will be seeded
-- in a follow-up migration after examining their current structure.
