-- Migration: seed demo data for user 1 (bhickok) across Care + Wedding journeys

INSERT INTO users (id, email, username, password_hash, is_active, created_at, updated_at)
VALUES (
	1,
	'bhickok@example.com',
	'bhickok',
	'kpHCYLS91wWiCcTgGam1IQ==:hU5/WwfM+xbLo0gTAo90qExlkiZ05NQ52u5VHWWP1yA=',
	1,
	CURRENT_TIMESTAMP,
	CURRENT_TIMESTAMP
)
ON CONFLICT(id) DO UPDATE SET
	email = excluded.email,
	username = excluded.username,
	password_hash = excluded.password_hash,
	is_active = excluded.is_active,
	updated_at = CURRENT_TIMESTAMP;

-- Personal profile (only insert if absent)
INSERT INTO personal_info (
	user_id, person_type, legal_name, date_of_birth, address,
	mobile_phone, email, occupation, employer
)
SELECT
	1, 'self', 'Blaire Hickok', '1990-05-17',
	'812 Wilson Ave, Austin, TX 78704',
	'512-555-0199', 'bhickok@example.com', 'Product Manager', 'Wrap It Up'
WHERE NOT EXISTS (
	SELECT 1 FROM personal_info WHERE user_id = 1 AND person_type = 'self'
);

-- Shared data tables ---------------------------------------------------------
INSERT INTO credentials (user_id, site_name, web_address, username, password, category, other_info)
SELECT 1, 'Gmail', 'https://mail.google.com', 'bhickok', 'sample-password', 'email', 'Primary inbox'
WHERE NOT EXISTS (SELECT 1 FROM credentials WHERE user_id = 1 AND site_name = 'Gmail');

INSERT INTO key_contacts (user_id, relationship, name, phone, email)
SELECT 1, 'Emergency Contact', 'Jordan Rivers', '512-555-2300', 'jordan@example.com'
WHERE NOT EXISTS (SELECT 1 FROM key_contacts WHERE user_id = 1 AND name = 'Jordan Rivers');

INSERT INTO legal_documents (user_id, document_type, location, attorney_name, attorney_contact, notes)
SELECT 1, 'Living Will', 'Home fire safe', 'Kim Hart', 'kim@hartlegal.com', 'Updated last year'
WHERE NOT EXISTS (SELECT 1 FROM legal_documents WHERE user_id = 1 AND document_type = 'Living Will');

INSERT INTO final_days (user_id, who_around, favorite_food_drink, music_type, organ_donation_info)
SELECT
	1,
	'Immediate family, Pastor Elise, closest friends',
	'Comfort soups + peach iced tea',
	'Indie folk playlist',
	'Registered donor in Texas'
WHERE NOT EXISTS (SELECT 1 FROM final_days WHERE user_id = 1);

-- Ensure Guided tier subscriptions for wedding + care
INSERT INTO user_journeys (user_id, journey_id, tier_id, status, started_at)
SELECT
	1,
	j.id,
	st.id,
	'active',
	datetime('now')
FROM journeys j
JOIN service_tiers st ON st.slug = 'guided'
WHERE j.slug IN ('wedding', 'care')
	AND NOT EXISTS (
		SELECT 1 FROM user_journeys uj
		WHERE uj.user_id = 1 AND uj.journey_id = j.id AND uj.status = 'active'
	);

-- Wedding journey: single-record sections -----------------------------------
INSERT INTO wedding_marriage_license (
	user_id, jurisdiction, office_address, appointment_date, expiration_date,
	required_documents, witness_requirements, fee_amount, confirmation_number, notes
)
SELECT
	1,
	'Travis County, Texas',
	'5501 Airport Blvd, Austin, TX',
	'2025-02-10',
	'2025-04-10',
	'Driver licenses, birth certificates, divorce decree copy',
	'Two witnesses age 18+, bring photo ID',
	75.00,
	'LIC-2025-0210-AUS',
	'Arrive 15 minutes early to clear security'
WHERE NOT EXISTS (SELECT 1 FROM wedding_marriage_license WHERE user_id = 1);

INSERT INTO wedding_prenup (
	user_id, status, attorney_user, attorney_partner, agreement_scope,
	financial_disclosures_ready, review_deadline, signing_plan, storage_plan, notes
)
SELECT
	1,
	'Draft under review',
	'Kim Hart',
	'Luis Ortega',
	'Protect pre-marriage equity, establish joint savings rules, outline support expectations',
	1,
	'2025-02-25',
	'Notary at Hart Legal, 2 witnesses required',
	'Original in law firm vault, copies in family Dropbox',
	'Need updated brokerage statements before signing'
WHERE NOT EXISTS (SELECT 1 FROM wedding_prenup WHERE user_id = 1);

INSERT INTO wedding_joint_finances (
	user_id, shared_values, accounts_to_merge, new_accounts,
	bill_split_plan, emergency_fund_plan, budgeting_tools,
	monthly_checkin_cadence, notes
)
SELECT
	1,
	'Prioritize flexibility, keep 6 months runway, automate generosity',
	'Close old regional bank accounts, keep Ally savings',
	'Open joint checking + travel fund at Local Credit Union',
	'60/40 split based on net income, auto-transfer twice per month',
	'Target $25k, replenish quarterly, keep in HYSA',
	'Shared Notion dashboard + Tiller sheet',
	'First Sunday evening each month',
	'Discuss guidelines for purchases > $500'
WHERE NOT EXISTS (SELECT 1 FROM wedding_joint_finances WHERE user_id = 1);

INSERT INTO wedding_name_change (
	user_id, new_name, keeping_current_name, legal_documents, ids_to_update,
	digital_accounts, announcement_plan, target_effective_date, status, notes
)
SELECT
	1,
	'Blaire Rivers Hickok',
	0,
	'Marriage certificate, Social Security, Passport, Texas DL',
	'Banking, work HRIS, insurance, voter registration',
	'Email signature, LinkedIn, Instagram, domain records',
	'Send celebratory email to friends/family + note to HR the week after ceremony',
	'2025-03-15',
	'Paperwork queued',
	'Need new passport photos and DL appointment'
WHERE NOT EXISTS (SELECT 1 FROM wedding_name_change WHERE user_id = 1);

INSERT INTO wedding_venue (
	user_id, venue_name, venue_style, venue_address, capacity,
	contact_name, contact_email, contact_phone, tour_date, decision_deadline,
	deposit_amount, total_cost, included_items, rain_plan, notes
)
SELECT
	1,
	'The Greenhouse at Driftwood',
	'Modern greenhouse + hill country views',
	'850 Co Rd 220, Driftwood, TX 78619',
	120,
	'Melissa Chang',
	'melissa@greenhouseevents.com',
	'512-555-3800',
	'2025-01-27',
	'2025-02-05',
	4000.00,
	18500.00,
	'Tables, chairs, onsite coordinator, two getting-ready suites',
	'Indoor conservatory reserved as backup',
	'Need to confirm catering cut-off two weeks out'
WHERE NOT EXISTS (SELECT 1 FROM wedding_venue WHERE user_id = 1);

INSERT INTO wedding_home_setup (
	user_id, housing_plan, move_in_date, utilities_plan, design_style,
	shared_calendar_link, hosting_goals, first_month_priorities, notes
)
SELECT
	1,
	'Keeping bungalow, refreshing guest room + converting garage into studio',
	'2025-02-20',
	'Blaire handles electric + internet, partner handles water + trash',
	'Warm modern + botanicals, mix of vintage furniture',
	'https://notion.so/bhickok/home-dashboard',
	'Sunday brunch monthly, summer movie nights on patio',
	'Declutter office, assemble standing desk, create command-center wall',
	'Order new locks + add to emergency contact sheet'
WHERE NOT EXISTS (SELECT 1 FROM wedding_home_setup WHERE user_id = 1);

-- Wedding list tables --------------------------------------------------------
INSERT INTO wedding_vendors (
	user_id, vendor_type, business_name, contact_name, contact_email, contact_phone,
	deposit_amount, balance_due, next_payment_due, status, notes
)
SELECT
	1, 'Planner', 'North Loop Events', 'Casey North', 'casey@nlevents.com', '512-555-8844',
	2000, 3000, '2025-02-28', 'Booked', 'Handles timeline + rehearsal'
WHERE NOT EXISTS (SELECT 1 FROM wedding_vendors WHERE user_id = 1 AND business_name = 'North Loop Events');

INSERT INTO wedding_vendors (
	user_id, vendor_type, business_name, contact_name, contact_email, contact_phone,
	deposit_amount, balance_due, next_payment_due, status, notes
)
SELECT
	1, 'Florist', 'Wildcrest Floral Studio', 'Laney Fox', 'laney@wildcrest.com', '512-555-9920',
	1200, 900, '2025-03-05', 'Proposal sent', 'Need final palette after dress fitting'
WHERE NOT EXISTS (SELECT 1 FROM wedding_vendors WHERE user_id = 1 AND business_name = 'Wildcrest Floral Studio');

INSERT INTO wedding_guest_list (
	user_id, guest_name, relationship, party_size, email, phone, invitation_sent, rsvp_status, meal_preference, notes
)
SELECT
	1, 'Jordan & Avery Rivers', 'Family', 2, 'jordan@example.com', '512-555-2300', 1, 'Accepted', 'Vegetarian', 'Sitting with parents'
WHERE NOT EXISTS (SELECT 1 FROM wedding_guest_list WHERE user_id = 1 AND guest_name = 'Jordan & Avery Rivers');

INSERT INTO wedding_guest_list (
	user_id, guest_name, relationship, party_size, email, invitation_sent, rsvp_status, meal_preference
)
SELECT
	1, 'Maya Chen', 'Friend', 1, 'maya@example.com', 0, 'Pending', 'No nuts'
WHERE NOT EXISTS (SELECT 1 FROM wedding_guest_list WHERE user_id = 1 AND guest_name = 'Maya Chen');

INSERT INTO wedding_registry_items (
	user_id, retailer, item_name, item_url, price, quantity, priority, status, notes
)
SELECT
	1, 'Crate & Barrel', 'Stoneware Dining Set', 'https://example.com/dining-set', 220, 1, 'Must-have', 'Open', 'Matches kitchen palette'
WHERE NOT EXISTS (SELECT 1 FROM wedding_registry_items WHERE user_id = 1 AND item_name = 'Stoneware Dining Set');

INSERT INTO wedding_registry_items (
	user_id, retailer, item_name, price, quantity, priority, status, notes
)
SELECT
	1, 'Honeymoon Fund', 'Lisbon Food Tour', 150, 2, 'Nice-to-have', 'Reserved', 'Gift from Casey'
WHERE NOT EXISTS (SELECT 1 FROM wedding_registry_items WHERE user_id = 1 AND item_name = 'Lisbon Food Tour');
