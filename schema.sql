-- Wrap It Up - End of Life Planning Database Schema

-- User profile table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- JOURNEY PLATFORM TABLES (AUTHORITATIVE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS journeys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journey_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journey_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(journey_id, category_id)
);

CREATE TABLE IF NOT EXISTS sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    scoring_type TEXT DEFAULT 'field_count' CHECK(scoring_type IN ('field_count', 'list_items', 'custom')),
    weight INTEGER DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journey_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journey_id INTEGER NOT NULL,
    section_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT 0,
    weight_override INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(journey_id, section_id)
);

CREATE TABLE IF NOT EXISTS service_tiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly REAL DEFAULT 0,
    price_annual REAL DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    features_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tier_features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tier_id INTEGER NOT NULL,
    feature_key TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT 1,
    config_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tier_id) REFERENCES service_tiers(id) ON DELETE CASCADE,
    UNIQUE(tier_id, feature_key)
);

CREATE TABLE IF NOT EXISTS user_journeys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    journey_id INTEGER NOT NULL,
    tier_id INTEGER NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'completed', 'cancelled')),
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
    FOREIGN KEY (tier_id) REFERENCES service_tiers(id),
    UNIQUE(user_id, journey_id)
);

CREATE TABLE IF NOT EXISTS user_journey_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_journey_id INTEGER NOT NULL,
    section_id INTEGER NOT NULL,
    score REAL DEFAULT 0,
    is_completed BOOLEAN DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_journey_id) REFERENCES user_journeys(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    UNIQUE(user_journey_id, section_id)
);

-- Creator marketplace -------------------------------------------------------

CREATE TABLE IF NOT EXISTS journey_creators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journey_id INTEGER NOT NULL UNIQUE,
    creator_user_id INTEGER NOT NULL,
    is_published BOOLEAN DEFAULT 0,
    is_featured BOOLEAN DEFAULT 0,
    use_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
    FOREIGN KEY (creator_user_id) REFERENCES users(id) ON DELETE CASCADE
);

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

-- Field builder -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS field_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type_name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    validation_schema TEXT,
    default_config TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS section_fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id INTEGER NOT NULL,
    field_name TEXT NOT NULL,
    field_label TEXT NOT NULL,
    field_type_id INTEGER NOT NULL,
    field_config TEXT,
    is_required BOOLEAN DEFAULT 0,
    importance_level TEXT DEFAULT 'optional' CHECK(importance_level IN ('critical', 'important', 'optional')),
    help_text TEXT,
    placeholder TEXT,
    default_value TEXT,
    display_order INTEGER DEFAULT 0,
    conditional_logic TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (field_type_id) REFERENCES field_types(id),
    UNIQUE(section_id, field_name)
);

CREATE TABLE IF NOT EXISTS section_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    section_id INTEGER NOT NULL,
    data TEXT NOT NULL,
    completed_fields INTEGER DEFAULT 0,
    total_fields INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    UNIQUE(user_id, section_id)
);

-- Mentor & concierge --------------------------------------------------------

CREATE TABLE IF NOT EXISTS mentors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    bio TEXT,
    expertise_areas TEXT,
    hourly_rate REAL DEFAULT 0,
    is_available BOOLEAN DEFAULT 1,
    availability_json TEXT,
    rating_average REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mentor_journeys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mentor_id INTEGER NOT NULL,
    journey_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE CASCADE,
    FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
    UNIQUE(mentor_id, journey_id)
);

CREATE TABLE IF NOT EXISTS mentor_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_journey_id INTEGER NOT NULL,
    section_id INTEGER NOT NULL,
    mentor_id INTEGER,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'assigned', 'in_review', 'completed', 'cancelled')),
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    assigned_at DATETIME,
    completed_at DATETIME,
    feedback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_journey_id) REFERENCES user_journeys(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS review_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    is_mentor BOOLEAN DEFAULT 0,
    comment TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES mentor_reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mentor_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_journey_id INTEGER NOT NULL,
    mentor_id INTEGER NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    scheduled_at DATETIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    meeting_link TEXT,
    prep_notes TEXT,
    session_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_journey_id) REFERENCES user_journeys(id) ON DELETE CASCADE,
    FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS session_ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL UNIQUE,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES mentor_sessions(id) ON DELETE CASCADE
);

-- Indexes for the new platform tables
CREATE INDEX IF NOT EXISTS idx_journeys_slug ON journeys(slug);
CREATE INDEX IF NOT EXISTS idx_journeys_active ON journeys(is_active);
CREATE INDEX IF NOT EXISTS idx_journey_categories_journey ON journey_categories(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_sections_journey ON journey_sections(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_sections_category ON journey_sections(category_id);
CREATE INDEX IF NOT EXISTS idx_user_journeys_user ON user_journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journeys_status ON user_journeys(status);
CREATE INDEX IF NOT EXISTS idx_user_journey_progress_journey ON user_journey_progress(user_journey_id);
CREATE INDEX IF NOT EXISTS idx_mentors_user ON mentors(user_id);
CREATE INDEX IF NOT EXISTS idx_mentors_available ON mentors(is_available);
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
-- LEGACY SECTION TABLES (DEPRECATED - TO BE REMOVED AFTER MIGRATION)
-- ============================================================================

-- Section 1: Usernames and Passwords
CREATE TABLE IF NOT EXISTS credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    site_name TEXT,
    web_address TEXT,
    username TEXT,
    password TEXT,
    category TEXT DEFAULT 'other' CHECK(category IN ('email', 'banking', 'social', 'utilities', 'government', 'other')),
    other_info TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Section 2: Personal Information
CREATE TABLE IF NOT EXISTS personal_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    person_type TEXT CHECK(person_type IN ('self', 'spouse')) DEFAULT 'self',
    legal_name TEXT,
    maiden_name TEXT,
    date_of_birth DATE,
    place_of_birth TEXT,
    address TEXT,
    po_box_number TEXT,
    po_box_location TEXT,
    po_box_key_location TEXT,
    home_phone TEXT,
    mobile_phone TEXT,
    office_phone TEXT,
    fax_number TEXT,
    email TEXT,
    drivers_license TEXT,
    ssn_or_green_card TEXT,
    passport_number TEXT,
    visa_number TEXT,
    occupation TEXT,
    employer TEXT,
    employment_address TEXT,
    military_service TEXT,
    church_affiliation TEXT,
    education TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Document tracking
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    personal_info_id INTEGER,
    document_type TEXT,
    file_path TEXT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (personal_info_id) REFERENCES personal_info(id)
);

-- Section 3: Family History (uses personal_info table with relationships)
CREATE TABLE IF NOT EXISTS family_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    relationship TEXT,
    personal_info_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (personal_info_id) REFERENCES personal_info(id)
);

CREATE TABLE IF NOT EXISTS family_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    parents_names TEXT,
    siblings_names TEXT,
    children_names TEXT,
    grandchildren_names TEXT,
    spouse_info TEXT,
    family_stories TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Section 4: Pets
CREATE TABLE IF NOT EXISTS pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    breed TEXT,
    name TEXT,
    date_of_birth DATE,
    license_chip_info TEXT,
    medications TEXT,
    veterinarian TEXT,
    vet_phone TEXT,
    pet_insurance TEXT,
    policy_number TEXT,
    other_info TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Section 5: Key Contacts
CREATE TABLE IF NOT EXISTS key_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    relationship TEXT,
    name TEXT,
    phone TEXT,
    address TEXT,
    email TEXT,
    date_of_birth DATE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Section 6: Medical
CREATE TABLE IF NOT EXISTS medical_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT,
    date_of_birth DATE,
    blood_type TEXT,
    height TEXT,
    weight TEXT,
    sex TEXT,
    medical_conditions TEXT,
    preferred_hospital TEXT,
    preferred_pharmacy TEXT,
    allergies TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS physicians (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    medical_info_id INTEGER,
    name TEXT,
    specialty TEXT,
    phone TEXT,
    address TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (medical_info_id) REFERENCES medical_info(id)
);

-- Section 7: Employment
CREATE TABLE IF NOT EXISTS employment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    employer_name TEXT,
    address TEXT,
    phone TEXT,
    position TEXT,
    hire_date DATE,
    supervisor TEXT,
    supervisor_contact TEXT,
    is_current BOOLEAN DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Section 8: Primary Residence
CREATE TABLE IF NOT EXISTS primary_residence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    address TEXT,
    own_or_rent TEXT,
    mortgage_lease_info TEXT,
    balance DECIMAL(12,2),
    value DECIMAL(12,2),
    lien_info TEXT,
    gas_company TEXT,
    electric_company TEXT,
    water_company TEXT,
    internet_company TEXT,
    waste_company TEXT,
    recycle_company TEXT,
    hoa_contact_name TEXT,
    hoa_contact_phone TEXT,
    hoa_dues DECIMAL(10,2),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS service_providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    residence_id INTEGER,
    service_date DATE,
    provider_name TEXT,
    phone TEXT,
    service_performed TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (residence_id) REFERENCES primary_residence(id)
);

CREATE TABLE IF NOT EXISTS home_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    residence_id INTEGER,
    item_description TEXT,
    location TEXT,
    value DECIMAL(10,2),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (residence_id) REFERENCES primary_residence(id)
);

-- Section 9: Property (Other Real Estate & Vehicles)
CREATE TABLE IF NOT EXISTS other_real_estate (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    address TEXT,
    own_or_rent TEXT,
    mortgage_lease_info TEXT,
    balance DECIMAL(12,2),
    value DECIMAL(12,2),
    lien_info TEXT,
    gas_company TEXT,
    electric_company TEXT,
    water_company TEXT,
    internet_company TEXT,
    waste_company TEXT,
    recycle_company TEXT,
    hoa_contact_name TEXT,
    hoa_contact_phone TEXT,
    hoa_dues DECIMAL(10,2),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    names_on_title TEXT,
    make TEXT,
    model TEXT,
    year INTEGER,
    vin TEXT,
    registration_dates TEXT,
    title_location TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS personal_property (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    property_type TEXT,
    owners TEXT,
    value DECIMAL(10,2),
    location TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Section 10: Insurance
CREATE TABLE IF NOT EXISTS insurance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    insurance_type TEXT,
    provider TEXT,
    policy_number TEXT,
    coverage_amount DECIMAL(12,2),
    beneficiary TEXT,
    agent_name TEXT,
    agent_phone TEXT,
    premium_amount DECIMAL(10,2),
    premium_frequency TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Section 11: Financial
CREATE TABLE IF NOT EXISTS bank_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    institution_name TEXT,
    account_type TEXT,
    account_number TEXT,
    routing_number TEXT,
    balance DECIMAL(12,2),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS investments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    institution_name TEXT,
    account_type TEXT,
    account_number TEXT,
    value DECIMAL(12,2),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS charitable_contributions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    charity_name TEXT,
    amount DECIMAL(10,2),
    donation_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Section 12: Legal
CREATE TABLE IF NOT EXISTS legal_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    document_type TEXT,
    location TEXT,
    attorney_name TEXT,
    attorney_contact TEXT,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Section 13: Final Days
CREATE TABLE IF NOT EXISTS final_days (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    who_around TEXT,
    favorite_food_drink TEXT,
    music_type TEXT,
    flowers_preference TEXT,
    flower_types TEXT,
    aromatic_smells TEXT,
    smell_types TEXT,
    love_letter TEXT,
    organ_donation_info TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Section 14: Obituary
CREATE TABLE IF NOT EXISTS obituary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    online_or_newspaper TEXT,
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    publication_date DATE,
    cost DECIMAL(10,2),
    obituary_text TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Section 15: After Death
CREATE TABLE IF NOT EXISTS after_death (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    contact_name TEXT,
    contact_phone TEXT,
    contact_address TEXT,
    contact_email TEXT,
    body_disposal_preference TEXT,
    transfer_service TEXT,
    embalming_preference TEXT,
    burial_outfit TEXT,
    organ_donation TEXT,
    burial_timing TEXT,
    burial_type TEXT,
    container_type TEXT,
    items_buried_with TEXT,
    ash_scatter_location TEXT,
    memorial_organization TEXT,
    flowers_location TEXT,
    visitation_timing TEXT,
    visitation_time TEXT,
    casket_open_closed TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Section 16: Funeral & Celebration of Life
CREATE TABLE IF NOT EXISTS funeral (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    location_name TEXT,
    location_address TEXT,
    director_name TEXT,
    director_contact TEXT,
    military_honors BOOLEAN,
    programs_printed BOOLEAN,
    pictures BOOLEAN,
    slideshow BOOLEAN,
    pallbearers TEXT,
    order_of_service TEXT,
    pastor TEXT,
    organist TEXT,
    celebration_location TEXT,
    celebration_food TEXT,
    final_resting_place TEXT,
    headstone_info TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Section 17: Final Thoughts & Reflections
CREATE TABLE IF NOT EXISTS conclusion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    life_reflections TEXT,
    advice_for_loved_ones TEXT,
    unfinished_business TEXT,
    digital_legacy TEXT,
    final_thoughts TEXT,
    additional_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Readiness tracking
CREATE TABLE IF NOT EXISTS section_completion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    section_name TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, section_name)
);

-- Wedding Journey specific tables
CREATE TABLE IF NOT EXISTS wedding_marriage_license (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    jurisdiction TEXT,
    office_address TEXT,
    appointment_date DATE,
    expiration_date DATE,
    required_documents TEXT,
    witness_requirements TEXT,
    fee_amount DECIMAL(10,2),
    confirmation_number TEXT,
    notes TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS wedding_prenup (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    status TEXT,
    attorney_user TEXT,
    attorney_partner TEXT,
    agreement_scope TEXT,
    financial_disclosures_ready BOOLEAN DEFAULT 0,
    review_deadline DATE,
    signing_plan TEXT,
    storage_plan TEXT,
    notes TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS wedding_joint_finances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    shared_values TEXT,
    accounts_to_merge TEXT,
    new_accounts TEXT,
    bill_split_plan TEXT,
    emergency_fund_plan TEXT,
    budgeting_tools TEXT,
    monthly_checkin_cadence TEXT,
    notes TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS wedding_name_change (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    new_name TEXT,
    keeping_current_name BOOLEAN DEFAULT 0,
    legal_documents TEXT,
    ids_to_update TEXT,
    digital_accounts TEXT,
    announcement_plan TEXT,
    target_effective_date DATE,
    status TEXT,
    notes TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS wedding_venue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    venue_name TEXT,
    venue_style TEXT,
    venue_address TEXT,
    capacity INTEGER,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    tour_date DATE,
    decision_deadline DATE,
    deposit_amount DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    included_items TEXT,
    rain_plan TEXT,
    notes TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS wedding_vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    vendor_type TEXT,
    business_name TEXT NOT NULL,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    deposit_amount DECIMAL(10,2),
    balance_due DECIMAL(10,2),
    next_payment_due DATE,
    status TEXT,
    contract_signed BOOLEAN DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_wedding_vendors_user ON wedding_vendors(user_id);

CREATE TABLE IF NOT EXISTS wedding_guest_list (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    guest_name TEXT NOT NULL,
    relationship TEXT,
    party_size INTEGER DEFAULT 1,
    email TEXT,
    phone TEXT,
    address TEXT,
    invitation_sent BOOLEAN DEFAULT 0,
    rsvp_status TEXT,
    meal_preference TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_wedding_guest_list_user ON wedding_guest_list(user_id);

CREATE TABLE IF NOT EXISTS wedding_registry_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    retailer TEXT,
    item_name TEXT NOT NULL,
    item_url TEXT,
    price DECIMAL(10,2),
    quantity INTEGER DEFAULT 1,
    priority TEXT,
    status TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_wedding_registry_user ON wedding_registry_items(user_id);

CREATE TABLE IF NOT EXISTS wedding_home_setup (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    housing_plan TEXT,
    move_in_date DATE,
    utilities_plan TEXT,
    design_style TEXT,
    shared_calendar_link TEXT,
    hosting_goals TEXT,
    first_month_priorities TEXT,
    notes TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
