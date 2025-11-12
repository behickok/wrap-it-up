-- Migration: wedding journey content tables

-- Stores single-record planning info for the marriage license process
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

-- Stores single-record planning info for prenup/legal agreements
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

-- Stores money conversations and account plans
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

-- Tracks name change preferences/tasks
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

-- Stores venue research + contract info
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

-- Vendor roster, supports multiple rows
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

-- Guest list + RSVP tracking
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

-- Registry tracking
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

-- Shared home setup planning
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
