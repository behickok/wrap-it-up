-- Seed sample data for user_id 1
-- Usage (from repo root):
--   sqlite3 <database-file>.sqlite < scripts/sample-data-user-1.sql

BEGIN TRANSACTION;

-- Ensure the target user exists
INSERT OR IGNORE INTO users (id, created_at, updated_at)
VALUES (1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Personal profile ---------------------------------------------------------
INSERT INTO personal_info (
	user_id, person_type, legal_name, maiden_name, date_of_birth, place_of_birth,
	address, home_phone, mobile_phone, email, drivers_license,
	ssn_or_green_card, passport_number, occupation, employer, education
)
VALUES (
	1, 'self', 'Jordan Avery Wells', 'Harper', '1984-05-18', 'Denver, CO, USA',
	'742 Evergreen Terrace, Denver, CO 80203',
	'(303) 555-0119', '(720) 555-0124', 'jordan.wells@example.com', 'CO-555-8820',
	'555-88-2019', 'XJ482993', 'Product Manager', 'Northwind Logistics', 'MBA, University of Colorado'
)

-- Additional personal records for family members ---------------------------
INSERT OR IGNORE INTO personal_info (
	id, user_id, person_type, legal_name, maiden_name, date_of_birth, place_of_birth,
	address, home_phone, mobile_phone, email, occupation, employer, education
)
VALUES (
	1001, 1, 'spouse', 'Casey Wells', 'Morgan', '1986-09-02', 'Boulder, CO, USA',
	'742 Evergreen Terrace, Denver, CO 80203',
	'(303) 555-0190', '(303) 555-0199', 'casey.wells@example.com', 'Landscape Architect', 'Urban Roots Design', 'BLA, Colorado State University'
);

INSERT OR IGNORE INTO personal_info (
	id, user_id, person_type, legal_name, maiden_name, date_of_birth, place_of_birth,
	address, home_phone, mobile_phone, email, occupation, employer, education
)
VALUES (
	1002, 1, 'self', 'Evelyn Harper Wells', 'Lopez', '1957-02-14', 'Santa Fe, NM, USA',
	'85 Aspen Dr, Fort Collins, CO 80524',
	'(505) 555-0192', '(505) 555-0194', 'evelyn.wells@example.com', 'Retired Teacher', 'Poudre School District', 'BA Education, University of New Mexico'
);

INSERT OR IGNORE INTO personal_info (
	id, user_id, person_type, legal_name, date_of_birth, place_of_birth,
	address, home_phone, mobile_phone, email, occupation, employer, education
)
VALUES (
	1003, 1, 'self', 'Michael James Wells', '1955-07-08', 'Portland, OR, USA',
	'120 Willow Lake Rd, Loveland, CO 80538',
	'(541) 555-0178', '(541) 555-0180', 'michael.wells@example.com', 'Retired Park Ranger', 'Colorado State Parks', 'BS Forestry, Oregon State University'
);

INSERT OR IGNORE INTO personal_info (
	id, user_id, person_type, legal_name, date_of_birth, place_of_birth,
	address, home_phone, mobile_phone, email, occupation, employer, education
)
VALUES (
	1004, 1, 'self', 'Lena Wells', '1990-11-22', 'Denver, CO, USA',
	'2443 Blake St, Denver, CO 80205',
	'(720) 555-0186', '(720) 555-0188', 'lena.wells@example.com', 'Sous Chef', 'Harvest Table', 'Culinary Institute of America'
);

-- Family history -----------------------------------------------------------
INSERT OR IGNORE INTO family_members (user_id, relationship, personal_info_id)
VALUES
	(1, 'Spouse', 1001),
	(1, 'Mother', 1002),
	(1, 'Father', 1003),
	(1, 'Sibling', 1004);

INSERT INTO family_history (
	user_id,
	parents_names,
	siblings_names,
	children_names,
	grandchildren_names,
	spouse_info,
	family_stories
)
VALUES (
	1,
	'Michael James Wells (father) & Evelyn Harper Wells (mother)',
	'Lena Wells (younger sister, living in Denver)',
	'None',
	'None',
	'Married to Casey Wells since 2012; met during grad school in Boulder',
	'Sunday hikes in Rocky Mountain National Park are the family reset ritual. Every winter holiday includes a handwritten letter exchange started by Evelyn. Keep Casey''s grandmother''s quilt with the family for future generations.'
)
ON CONFLICT(user_id) DO UPDATE SET
	parents_names = excluded.parents_names,
	siblings_names = excluded.siblings_names,
	children_names = excluded.children_names,
	grandchildren_names = excluded.grandchildren_names,
	spouse_info = excluded.spouse_info,
	family_stories = excluded.family_stories,
	updated_at = CURRENT_TIMESTAMP;

-- Medical ---------------------------------------------------------------
INSERT INTO medical_info (
	user_id, name, date_of_birth, blood_type, height, weight, sex,
	medical_conditions, preferred_hospital, preferred_pharmacy, allergies
)
VALUES (
	1,
	'Jordan Avery Wells',
	'1984-05-18',
	'O+',
	'5 ft 9 in',
	'165 lb',
	'Non-binary',
	'Mild asthma (inhaler as needed); seasonal allergies; ACL surgery 2015',
	'Denver General Hospital - Internal Medicine',
	'Green Valley Pharmacy, 1330 Pearl St, Denver, CO',
	'Penicillin; peanuts'
);

INSERT INTO physicians (
	user_id, medical_info_id, name, specialty, phone, address
)
VALUES
	(
		1,
		(SELECT id FROM medical_info WHERE user_id = 1 LIMIT 1),
		'Dr. Helena Ruiz',
		'Primary Care / Internal Medicine',
		'(303) 555-0102',
		'Denver General Internal Medicine, 900 Grant St, Denver, CO 80203'
	),
	(
		1,
		(SELECT id FROM medical_info WHERE user_id = 1 LIMIT 1),
		'Dr. Amir Bennett',
		'Pulmonology & Respiratory Therapy',
		'(720) 555-0168',
		'Front Range Pulmonary, 1225 Speer Blvd, Suite 400, Denver, CO 80204'
	);

-- Credentials --------------------------------------------------------------
INSERT INTO credentials (
	user_id, site_name, web_address, username, password, category, other_info
)
VALUES
	(1, 'Gmail', 'https://mail.google.com', 'jordan.w', 'SamplePass!23', 'email', '2FA via Authy'),
	(1, 'First Mile Bank', 'https://bank.firstmile.com', 'jordan.avery', 'Secure$avings42', 'banking', 'Primary checking account'),
	(1, 'Evergreen Utilities', 'https://portal.evergreenutilities.com', 'jwells', 'Utility!2024', 'utilities', 'Auto-pay enabled');

-- Documents ---------------------------------------------------------------
INSERT INTO documents (user_id, document_type, file_path)
VALUES
	(1, 'will', 'Fireproof safe drawer A3'),
	(1, 'insurance_policy', 'Evernote: Estate Planning/Insurance.pdf'),
	(1, 'passport', 'Hall closet lockbox - top shelf');

-- Legal documents ---------------------------------------------------------
INSERT INTO legal_documents (user_id, document_type, location, attorney_name, attorney_contact, notes)
VALUES
	(1, 'Living Trust', 'Binder in office bookshelf', 'Morgan Patel', 'mpatel@patellaw.com | (303) 555-0184', 'Updated 2023'),
	(1, 'Medical Power of Attorney', 'Safe deposit box #144, Mile High Credit Union', 'Morgan Patel', '(303) 555-0184', 'Primary agent: Casey Wells');

-- Contacts ----------------------------------------------------------------
INSERT INTO key_contacts (user_id, relationship, name, phone, address, email, date_of_birth)
VALUES
	(1, 'Spouse', 'Casey Wells', '(303) 555-0199', '742 Evergreen Terrace, Denver, CO 80203', 'casey.wells@example.com', '1986-09-02'),
	(1, 'Attorney', 'Morgan Patel', '(303) 555-0184', '1200 Blake St, Denver, CO', 'mpatel@patellaw.com', '1978-11-14'),
	(1, 'Executor', 'Dana Carter', '(970) 555-0170', '85 Aspen Dr, Fort Collins, CO', 'dana.carter@example.com', '1983-03-22');

-- Financial accounts ------------------------------------------------------
INSERT INTO bank_accounts (user_id, institution_name, account_type, account_number, routing_number, balance)
VALUES
	(1, 'First Mile Bank', 'Checking', '****4321', '102000021', 18500.75),
	(1, 'Summit Credit Union', 'Savings', '****7744', '123456789', 42000.00);

INSERT INTO investments (user_id, institution_name, account_type, account_number, value)
VALUES
	(1, 'Vanguard', '401k', 'VG-401K-9981', 265000.50),
	(1, 'Fidelity', 'Roth IRA', 'FID-ROTH-5521', 84000.25);

-- Insurance ---------------------------------------------------------------
INSERT INTO insurance (
	user_id, insurance_type, provider, policy_number, coverage_amount,
	beneficiary, agent_name, agent_phone, premium_amount, premium_frequency
)
VALUES
	(1, 'Life', 'Evergreen Mutual', 'EV-552100', 500000, 'Casey Wells', 'Amelia Reid', '(720) 555-0155', 96.25, 'monthly'),
	(1, 'Homeowners', 'Pioneer Insurance', 'PI-HO-8832', 650000, 'Mortgage Lender', 'Lucas Grant', '(303) 555-0133', 142.10, 'monthly');

-- Residence & property ----------------------------------------------------
INSERT INTO primary_residence (
	user_id, address, own_or_rent, mortgage_lease_info, balance, value,
	gas_company, electric_company, water_company, internet_company,
	hoa_contact_name, hoa_contact_phone, hoa_dues
)
VALUES (
	1,
	'742 Evergreen Terrace, Denver, CO 80203',
	'own',
	'30-year fixed @ 3.35% with Mile High Lending',
	245000.00,
	725000.00,
	'Rocky Mountain Gas',
	'Front Range Electric',
	'Denver Water',
	'Comet Fiber',
	'Capitol View HOA',
	'(303) 555-0191',
	125.00
);

INSERT INTO vehicles (
	user_id, names_on_title, make, model, year, vin, registration_dates, title_location
)
VALUES
	(1, 'Jordan & Casey Wells', 'Subaru', 'Outback', 2021, '4S4BTACC3M3123456', '2024-01-15 to 2025-01-14', 'Desk drawer - labeled folders'),
	(1, 'Jordan Wells', 'Harley-Davidson', 'Street 750', 2018, '1HD4NBB18JC500123', '2024-06-01 to 2025-05-31', 'Garage cabinet, top shelf');

INSERT INTO employment (
	user_id, employer_name, address, phone, position, hire_date, supervisor, supervisor_contact, is_current
) VALUES
	(1, 'Northwind Logistics', '1800 Blake St, Denver, CO 80202', '(303) 555-0175', 'Product Manager', '2018-03-12', 'Lena Ortiz', 'lena.ortiz@northwind.com', 1),
	(1, 'Summit Trails Outfitters', '455 Canyon Rd, Boulder, CO 80302', '(303) 555-0198', 'Operations Lead', '2012-06-01', 'Marcus Reid', '(303) 555-0190', 0);

-- Pets --------------------------------------------------------------------
INSERT INTO pets (
	user_id, breed, name, date_of_birth, license_chip_info, medications,
	veterinarian, vet_phone, other_info
)
VALUES (
	1,
	'Golden Retriever',
	'Maple',
	'2018-04-11',
	'Microchip #985112004321556',
	'Joint supplement daily',
	'City Paws Clinic',
	'(303) 555-0144',
	'Loves visitors; keep backyard gate locked'
);

-- Final days & after death ------------------------------------------------
INSERT INTO final_days (
	user_id, who_around, favorite_food_drink, music_type, flowers_preference,
	flower_types, aromatic_smells, smell_types, love_letter, organ_donation_info
)
VALUES (
	1,
	'Casey, Dana, and close family in small groups',
	'Fresh sourdough, tomato soup, lavender tea',
	'Indie acoustic playlists, live guitar',
	'Yes',
	'Wildflowers, eucalyptus, sunflowers',
	'Yes',
	'Lavender, cedar',
	'Thank you for carrying my light forward—celebrate with laughter.',
	'Registered donor via Colorado Donor Alliance'
);

INSERT INTO after_death (
	user_id, contact_name, contact_phone, contact_address, contact_email,
	body_disposal_preference, transfer_service, burial_outfit, organ_donation,
	burial_type, container_type, items_buried_with, ash_scatter_location,
	memorial_organization, flowers_location, visitation_timing, visitation_time,
	casket_open_closed
)
VALUES (
	1,
	'Morgan Patel',
	'(303) 555-0184',
	'1200 Blake St, Denver, CO',
	'mpatel@patellaw.com',
	'Cremation',
	'Summit Ridge Transfers',
	'Blue wool suit',
	'Honor prior donor registration',
	'Memorial garden niche',
	'Walnut urn with copper inlay',
	'Letter from Casey, wedding ring replica',
	'Trail crest near Emerald Lake',
	'Colorado Environmental Fund',
	'Donate to hospice lobby',
	'Evening before service',
	'6:00 PM',
	'Open for family hour, closed for public'
);

-- Funeral arrangements ----------------------------------------------------
INSERT INTO funeral (
	user_id, location_name, location_address, director_name, director_contact,
	military_honors, programs_printed, pictures, slideshow, pallbearers,
	order_of_service, pastor, organist, celebration_location, celebration_food,
	final_resting_place, headstone_info
)
VALUES (
	1,
	'Heritage Life Center',
	'4500 E Alameda Ave, Denver, CO',
	'Leah Chen',
	'(303) 555-0108',
	0,
	1,
	1,
	1,
	'Casey Wells, Dana Carter, Liam Burke, Harper Gray, Amir Lewis, Nina Ford',
	'Instrumental prelude → Welcome → Reading of letters → Musical tribute → Celebration stories → Closing benediction',
	'Rev. Elena Cruz',
	'Marcus Fields',
	'Rooftop greenhouse at Heritage Life Center',
	'Tapas, sparkling water, mini pies',
	'Columbarium at Mountain View Cemetery',
	'Bronze plaque with mountain silhouette'
);

-- Final thoughts ---------------------------------------------------------
INSERT INTO conclusion (
	user_id,
	life_reflections,
	advice_for_loved_ones,
	unfinished_business,
	digital_legacy,
	final_thoughts,
	additional_notes
)
VALUES (
	1,
	'Life has been a collection of small, meaningful moments—walks with Casey, family letters, and building community at work.',
	'Lead with kindness, choose collaboration over competition, and take breaks before burnout sneaks in.',
	'Label the analog photo boxes and finish digitizing 2010-2014 albums.',
	'Passwords stored in Wrap It Up; archive creative writing in shared Drive folder.',
	'Remember me through the traditions we built together—Sunday hikes, handwritten letters, and kitchen dance parties.',
	'Share digital photo albums with family and rotate Jordan’s sketches at the memorial.'
)


-- Obituary ----------------------------------------------------------------
INSERT INTO obituary (
	user_id, online_or_newspaper, contact_name, contact_phone, contact_email,
	publication_date, cost, obituary_text
)
VALUES (
	1,
	'Denver Post digital + print',
	'Dana Carter',
	'(970) 555-0170',
	'dana.carter@example.com',
	DATE('now', '+7 days'),
	425.00,
	'Jordan Avery Wells passed peacefully surrounded by family. Their legacy of service and creativity lives on through the communities they loved.'
);

-- Section completion snapshots --------------------------------------------
INSERT INTO section_completion (user_id, section_name, score, last_updated)
VALUES
		(1, 'personal', 85, CURRENT_TIMESTAMP),
		(1, 'credentials', 90, CURRENT_TIMESTAMP),
		(1, 'contacts', 80, CURRENT_TIMESTAMP),
		(1, 'legal', 75, CURRENT_TIMESTAMP),
		(1, 'financial', 88, CURRENT_TIMESTAMP),
		(1, 'insurance', 92, CURRENT_TIMESTAMP),
		(1, 'employment', 70, CURRENT_TIMESTAMP),
	(1, 'final-days', 95, CURRENT_TIMESTAMP)
ON CONFLICT(user_id, section_name) DO UPDATE SET
	score = excluded.score,
	last_updated = CURRENT_TIMESTAMP;

COMMIT;
