-- Wrap It Up - End of Life Planning Database Schema

-- User profile table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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
