# Wrap It Up - Comprehensive Manual Testing Guide

## 1. APPLICATION OVERVIEW

**Application Name:** Wrap It Up (displayed as "rhythm")
**Purpose:** An end-of-life planning workbook that helps users organize comprehensive information about their life, finances, health, family, and end-of-life preferences.

**Tech Stack:**
- Frontend: SvelteKit 5 with Svelte 5
- Database: Cloudflare D1 (SQLite)
- Deployment: Cloudflare Pages
- AI Integration: OpenAI API (optional)
- UI Framework: DaisyUI + Tailwind CSS

**Key Features:**
- 17 comprehensive sections for organizing end-of-life planning information
- Readiness score tracking (0-100 points) to measure completion progress
- AI-powered assistance through "Ask AI" feature
- PDF export functionality with print-optimized styling
- Multi-record management (credentials, contacts, insurance, financial accounts, etc.)
- Category-based navigation with 5 journey stages
- Auto-save functionality with Cloudflare D1 database

---

## 2. MAIN FEATURES AND WORKFLOWS

### 2.1 User Authentication

**Routes:**
- `/login` - User login page
- `/register` - User registration page
- `/api/auth/login` - Login API endpoint
- `/api/auth/register` - Registration API endpoint
- `/api/auth/logout` - Logout API endpoint
- `/api/auth/me` - Current user info endpoint

**Workflows:**
1. **Registration:**
   - Email field (required)
   - Username field (3-20 characters, alphanumeric + underscores only)
   - Password (minimum 8 characters, must include uppercase, lowercase, and number)
   - Confirm Password (must match password)
   - Submit creates new user account

2. **Login:**
   - Email or Username field
   - Password field
   - Submit authenticates user and redirects to dashboard

3. **Logout:**
   - Button in top-right header
   - Clears session and redirects to login page

### 2.2 Dashboard Navigation

**Main Page:** `/` (requires authentication)

**Header Elements:**
- Readiness Score Circle (displays total_score 0-100)
- Application Title "rhythm"
- User info (@username) and Logout button
- Gradient background with decorative pattern

**Main Content Structure:**
1. Export Section Header
   - "Your End-of-Life Planning Document" title
   - Description about PDF export
   - "Export to PDF" button with loading state

2. Journey Visual Component
   - Visual representation of planning journey

3. Journey Tabs (5 categories)
   - Plan (Legal & Financial Foundation)
   - Care (Health & Daily Life)
   - Connect (Relationships & History)
   - Support (Digital & Practical)
   - Legacy (End-of-Life Planning)

4. Section Navigation Sidebar
   - Shows sections for active category
   - Current section highlighted with color
   - Checkmarks show completed sections (100% score)
   - Sticky positioning on desktop

5. Main Content Area
   - Displays all sections in active category
   - Scroll spy auto-updates active section
   - Smooth scrolling between sections

6. Scroll-to-Top Button
   - Appears when scrolled down 400px
   - Smooth scroll back to top

---

## 3. PAGES AND ROUTES

### 3.1 Main Routes Structure

```
/                          - Dashboard (main planning page)
/login                     - Login page
/register                  - Registration page
/api/auth/login           - POST endpoint
/api/auth/register        - POST endpoint
/api/auth/logout          - POST endpoint
/api/auth/me              - GET current user
/api/ask-ai               - POST AI assistance
/api/export-data          - POST PDF export
```

### 3.2 Journey Categories and Sections

**PLAN Category (4 sections) - Legal & Financial Foundation**
1. Legal Documents
2. Financial Accounts
3. Insurance Policies
4. Employment

**CARE Category (4 sections) - Health & Daily Life**
5. Medical Information
6. Personal Information
7. Primary Residence
8. Vehicles & Property

**CONNECT Category (3 sections) - Relationships & History**
9. Family History
10. Key Contacts
11. Pets

**SUPPORT Category (1 section) - Digital & Practical**
12. Usernames & Passwords

**LEGACY Category (5 sections) - End-of-Life Planning**
13. Final Days Preferences
14. After Death Arrangements
15. Funeral & Celebration of Life
16. Obituary Planning
17. Final Thoughts & Reflections

---

## 4. DATA MODELS AND FORMS

### 4.1 Single-Record Sections (Form-based)

**Personal Information**
- Basic Information: Legal Name, Maiden Name, Date of Birth, Place of Birth
- Contact Information: Address, P.O. Box details, Phone numbers (Home, Mobile, Office, Fax), Email
- Identification: Driver's License, SSN/Green Card, Passport, Visa
- Professional: Occupation, Employer, Employment Address, Military Service, Church Affiliation, Education

**Medical Information**
- Basic: Name, Date of Birth, Blood Type, Height, Weight, Sex
- Health: Medical Conditions, Preferred Hospital, Preferred Pharmacy, Allergies
- Physicians (multiple): Name, Specialty, Phone, Address

**Primary Residence**
- Address, Ownership (Own/Rent), Mortgage/Lease Info, Balance, Value, Lien Info
- Utilities: Gas, Electric, Water, Internet, Waste, Recycle Companies
- HOA: Contact Name, Phone, Dues

**Employment History (multiple records)**
- Employer Name, Address, Phone, Position
- Hire Date, Supervisor, Supervisor Contact
- Is Current (boolean toggle)

**Financial Accounts (multiple records)**
- Institution Name, Account Type (dropdown), Account Number, Routing Number, Balance

**Insurance Policies (multiple records)**
- Insurance Type, Provider, Policy Number, Coverage Amount
- Beneficiary, Agent Name, Agent Phone, Premium Amount, Premium Frequency

**Credentials (multiple records)**
- Site Name, Web Address, Username, Password
- Category (Email, Banking, Social, Utilities, Government, Other)
- Other Info

**Legal Documents (multiple records)**
- Document Type, Location, Attorney Name, Attorney Contact, Notes

**Key Contacts (multiple records)**
- Relationship, Name, Phone, Address, Email, Date of Birth

**Final Days Preferences**
- Who around, Favorite Food/Drink, Music Type
- Flowers preference (Yes/No/No preference) with optional flower types
- Aromatic smells preference (Yes/No/No preference) with optional scent types
- Love Letter (large text area)
- Organ Donation Info

**Obituary Planning**
- Online or Newspaper, Contact Name, Contact Phone, Contact Email
- Publication Date, Cost, Obituary Text

**After Death Arrangements**
- Contact information (Name, Phone, Address, Email)
- Body disposal preference, Transfer service, Embalming preference
- Burial outfit, Organ donation, Burial timing, Burial type, Container type
- Items buried with, Ash scatter location, Memorial organization
- Flowers location, Visitation timing/time, Casket open/closed

**Funeral & Celebration of Life**
- Location (Name & Address), Director (Name & Contact)
- Military honors (checkbox), Programs printed (checkbox)
- Pictures (checkbox), Slideshow (checkbox)
- Pallbearers, Order of Service, Pastor, Organist
- Celebration location, Celebration food, Final resting place, Headstone info

**Final Thoughts & Reflections**
- Life Reflections, Advice for Loved Ones, Unfinished Business
- Digital Legacy, Final Thoughts, Additional Notes

**Family History**
- Parents Names, Siblings Names, Children Names, Grandchildren Names
- Spouse Info, Family Stories

**Pets (multiple records)**
- Breed, Name, Date of Birth, License/Chip Info, Medications
- Veterinarian, Vet Phone, Pet Insurance, Policy Number, Other Info

**Vehicles (multiple records)**
- Names on Title, Make, Model, Year, VIN, Registration Dates, Title Location

### 4.2 Form Field Types

- Text input (email, tel, text)
- Date picker
- Number input (with currency formatting)
- Textarea (multi-line text)
- Select dropdown (with predefined options)
- Checkbox (boolean)
- Currency display (formatted as USD)

---

## 5. KEY COMPONENTS AND FUNCTIONALITY

### 5.1 Core Components

**FormField.svelte**
- Reusable form input component
- Supports: text, email, tel, date, number, textarea, select
- Labels with optional required indicator
- Two-way binding with parent component

**SectionContent.svelte**
- Main section display component
- Handles both single-record and multi-record sections
- Routes to appropriate list component for multi-record sections
- Form submission with auto-save

**List Components (Multi-record Sections)**
1. CredentialsList.svelte - Usernames & Passwords
2. ContactsList.svelte - Key Contacts
3. LegalDocumentsList.svelte - Legal Documents
4. FinancialAccountsList.svelte - Financial Accounts
5. InsuranceList.svelte - Insurance Policies
6. EmploymentList.svelte - Employment History
7. VehiclesList.svelte - Vehicles & Property
8. FamilyMembersList.svelte - Family Members
9. PhysiciansList.svelte - Physicians

**Each List Component Includes:**
- Display of existing records in a table/card format
- "Add New" button to create record
- Edit functionality (opens dialog with form)
- Delete functionality (with confirmation)
- Search/filter capabilities (varies by component)

**JourneyTabs.svelte**
- Tab navigation for 5 journey categories
- Visual indicators for category colors and icons
- Displays category description
- Updates sidebar sections when category changes

**JourneyVisual.svelte**
- Visual representation of current journey stage
- Animated or illustrative element
- Category-specific theming

**AskAI.svelte**
- Modal dialog for AI assistance
- Question input textarea
- "Get Answer" button with loading state
- AI response display in formatted box
- Close button

**SectionNavigation.svelte**
- Sidebar navigation for sections
- Auto-scrolls and highlights current section
- Shows completion status with checkmarks
- Smooth scroll-to-section functionality

### 5.2 API Endpoints

**Authentication:**
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login with email/username and password
- `POST /api/auth/logout` - Logout and clear session
- `GET /api/auth/me` - Get current user info

**AI Assistance:**
- `POST /api/ask-ai`
  - Body: `{ section: string, question: string }`
  - Response: `{ success: boolean, answer: string }`
  - Integrates with OpenAI API

**Export:**
- `POST /api/export-data`
  - Generates PDF with all user data
  - Returns: `{ success: boolean, filename?: string, error?: string }`
  - Uses jsPDF and jspdf-autotable libraries

**Section Data Management (in +page.server.ts):**
- `addCredential` - Add new credential
- `updateCredential` - Update existing credential
- `deleteCredential` - Delete credential
- `addContact` - Add key contact
- `updateContact` - Update contact
- `deleteContact` - Delete contact
- `addBankAccount` - Add financial account
- `updateBankAccount` - Update account
- `deleteBankAccount` - Delete account
- `addInsurance` - Add insurance policy
- `updateInsurance` - Update policy
- `deleteInsurance` - Delete policy
- `addEmployment` - Add employment record
- `updateEmployment` - Update record
- `deleteEmployment` - Delete record
- `addLegalDocument` - Add legal document
- `updateLegalDocument` - Update document
- `deleteLegalDocument` - Delete document
- Similar patterns for other multi-record sections

### 5.3 Scoring System

**Readiness Score (0-100 points):**
- Weighted calculation based on section completion
- Each section has a weight (importance level)
- Score reflects percentage of required fields filled

**Section Weights:**
- Legal Documents: 9 (highest priority)
- Financial Accounts: 8
- Insurance: 8
- Medical: 8
- Personal: 8
- Credentials: 5
- Residence: 6
- Property: 6
- Employment: 5
- Contacts: 7
- Family: 6
- Final Days: 7
- After Death: 8
- Funeral: 7
- Obituary: 5
- Conclusion: 4
- Pets: 3 (lowest priority)

**Completion Status:**
- 80-100: Green (Outstanding)
- 50-79: Yellow (Good Progress)
- 25-49: Orange (Getting Started)
- 0-24: Red (Not Started)

**Motivational Messages:**
- 90+: "Outstanding! You're well-prepared for the future."
- 75-89: "Great progress! You're almost there."
- 50-74: "Good start! Keep filling out the remaining sections."
- 25-49: "You're on your way. Every step counts!"
- 0-24: "Welcome! Let's start organizing your important information."

---

## 6. FUNCTIONALITY AND WORKFLOWS

### 6.1 User Registration and Login Flow

1. **New User Registration:**
   - Navigate to /register
   - Fill in email, username, password, confirm password
   - Client-side validation checks:
     - All fields required
     - Passwords match
     - Password: 8+ chars, uppercase, lowercase, number
     - Username: 3-20 chars, alphanumeric + underscore only
   - Submit creates account and redirects to dashboard

2. **Returning User Login:**
   - Navigate to /login
   - Enter email/username and password
   - Server validates credentials
   - On success: redirect to /
   - On failure: display error message

3. **Authenticated Session:**
   - User ID stored in session
   - Header displays username with logout button
   - Public routes (/login, /register) allow unauthenticated access
   - All other routes require authentication

### 6.2 Data Entry and Form Submission

1. **Single-Record Section (e.g., Personal Information):**
   - Load existing data from database
   - Form fields pre-populated with saved values
   - User edits form fields
   - Submit button saves changes
   - Auto-update of section completion score

2. **Multi-Record Section (e.g., Credentials):**
   - Display list of existing records in cards/table
   - "Add New" button opens modal dialog
   - User fills form in dialog
   - Submit creates new record
   - Dialog closes, list refreshes
   - Edit button: opens dialog with existing data
   - Delete button: removes record with confirmation

3. **Save Process:**
   - Form submission via POST action
   - Backend validates and inserts/updates database
   - Section completion score recalculated
   - UI updates to reflect changes
   - Success message shown (optional)

### 6.3 Section Navigation and Progress Tracking

1. **Category Selection:**
   - Click on journey tab (Plan, Care, Connect, Support, Legacy)
   - Sidebar updates to show sections in that category
   - Page scrolls to first section in category
   - Section scores displayed for current category

2. **Scroll Spy:**
   - As user scrolls, active section automatically updates
   - Sidebar highlights current section
   - Category score calculation from visible sections

3. **Direct Section Jumping:**
   - Click section name in sidebar
   - Page smooth-scrolls to that section
   - Sidebar marks section as active

4. **Completion Indicators:**
   - Each section shows progress in sidebar
   - Green checkmark for 100% complete sections
   - Score percentage shows progress within section

### 6.4 AI Assistance Workflow

1. **Ask AI Button:**
   - Located in section header (next to section title)
   - Click opens modal dialog

2. **Modal Dialog:**
   - Title: "Ask AI for Help"
   - Subtitle mentions current section name
   - Textarea for user question (with example placeholder)
   - "Get Answer" button (disabled if empty)
   - Previous response displays in box if available

3. **AI Response:**
   - Submit sends question to `/api/ask-ai` endpoint
   - Loading state shows while waiting
   - Response displays in formatted box
   - User can ask multiple questions without closing dialog

4. **Close Dialog:**
   - Close button closes dialog
   - Clicking modal backdrop also closes

### 6.5 PDF Export Workflow

1. **Export Button:**
   - Located in top section of dashboard
   - Shows "Export to PDF" button with download icon
   - Large call-to-action button

2. **Export Process:**
   - Click triggers PDF generation
   - Button shows "Generating PDF..." with spinner
   - Fetches data from `/api/export-data`
   - Generates PDF with all filled sections
   - File downloaded to user's computer

3. **Success/Error Handling:**
   - Success message: "PDF exported successfully: [filename]"
   - Error message: "Failed to export PDF" or custom error
   - Message auto-dismisses after 5 seconds

4. **PDF Content:**
   - Organized by journey categories
   - Professional formatting with headers/footers
   - Table of contents
   - Field labels and values
   - Print-optimized styling

### 6.6 Data Persistence

1. **Database Structure:**
   - Cloudflare D1 (SQLite) stores all user data
   - Separate tables for each data model
   - Foreign keys link data to user accounts
   - Timestamp tracking (created_at, updated_at)

2. **Section Completion Tracking:**
   - `section_completion` table stores scores
   - Score (0-100) updated on every save
   - Last updated timestamp recorded
   - Composite unique key: (user_id, section_name)

3. **Data Loading:**
   - Dashboard load fetches all user data
   - Grouped by section
   - Passed to components as props
   - Components display and allow editing

---

## 7. COMPREHENSIVE TESTING CHECKLIST

### 7.1 Authentication Testing

- [ ] Register new account with valid credentials
- [ ] Register with invalid password (< 8 chars, missing uppercase, etc.)
- [ ] Register with mismatched passwords
- [ ] Register with invalid username (< 3 chars, special chars)
- [ ] Register with duplicate email
- [ ] Register with duplicate username
- [ ] Login with valid email and password
- [ ] Login with username and password
- [ ] Login with incorrect password
- [ ] Login with non-existent email
- [ ] Verify redirect to login when unauthenticated
- [ ] Verify logout clears session
- [ ] Verify header shows correct username when logged in

### 7.2 Dashboard Navigation Testing

- [ ] Verify header displays readiness score (0-100)
- [ ] Verify header shows username
- [ ] Verify logout button functional in header
- [ ] Click each journey tab (Plan, Care, Connect, Support, Legacy)
- [ ] Verify sidebar updates sections per category
- [ ] Verify first section selected when changing category
- [ ] Scroll to bottom of page
- [ ] Verify "Scroll to Top" button appears
- [ ] Click "Scroll to Top" button
- [ ] Verify smooth scroll to top
- [ ] Verify scroll spy updates active section while scrolling
- [ ] Click section name in sidebar
- [ ] Verify smooth scroll to that section

### 7.3 Form Submission Testing (Single-Record Sections)

**Test with Personal Information section:**
- [ ] Navigate to Personal Information
- [ ] Verify form fields display
- [ ] Fill in all fields with valid data
- [ ] Submit form
- [ ] Verify data persists after page refresh
- [ ] Edit existing data
- [ ] Submit updated data
- [ ] Verify changes saved correctly
- [ ] Leave some fields empty
- [ ] Submit incomplete form
- [ ] Verify partial completion accepted
- [ ] Verify section score updates

### 7.4 Multi-Record Form Testing (Lists)

**Test with Credentials section:**
- [ ] Navigate to Usernames & Passwords
- [ ] Click "Add New Credential" button
- [ ] Modal dialog opens
- [ ] Fill in credential form (site name, username, password, category)
- [ ] Submit form
- [ ] Verify credential appears in list
- [ ] Click edit button on credential
- [ ] Modal opens with existing data
- [ ] Update data
- [ ] Save changes
- [ ] Verify credential updated in list
- [ ] Click delete button
- [ ] Confirm deletion
- [ ] Verify credential removed from list
- [ ] Add multiple credentials (5+)
- [ ] Verify list displays all records
- [ ] Test category filtering if implemented

**Test with other multi-record sections:**
- [ ] Financial Accounts (add, edit, delete bank accounts)
- [ ] Insurance Policies (add, edit, delete policies)
- [ ] Key Contacts (add, edit, delete contacts)
- [ ] Employment (add, edit, delete jobs)
- [ ] Legal Documents (add, edit, delete documents)
- [ ] Verify similar functionality in each

### 7.5 AI Assistance Testing

- [ ] Click "Ask AI for Help" button in section header
- [ ] Verify modal dialog opens with section name
- [ ] Type question in textarea
- [ ] Click "Get Answer" button
- [ ] Verify loading state shows
- [ ] Wait for response
- [ ] Verify response displays in formatted box
- [ ] Ask multiple questions in same dialog
- [ ] Verify previous answer still visible
- [ ] Test without OpenAI API key (error handling)
- [ ] Close modal dialog with close button
- [ ] Verify dialog closes properly

### 7.6 Scoring and Progress Testing

- [ ] Complete Personal Information section (all fields)
- [ ] Verify section shows 100% in sidebar
- [ ] Verify checkmark appears on section
- [ ] Check readiness score increases
- [ ] Complete additional sections
- [ ] Verify overall score increases proportionally
- [ ] Verify motivational message updates
- [ ] Leave a section incomplete
- [ ] Verify partial score shows percentage
- [ ] Verify weighted calculation (higher-weight sections impact score more)

### 7.7 PDF Export Testing

- [ ] Click "Export to PDF" button
- [ ] Verify button shows loading state
- [ ] Wait for PDF generation
- [ ] Verify success message appears
- [ ] Download and open PDF file
- [ ] Verify PDF contains section data
- [ ] Verify formatting is professional and readable
- [ ] Test with incomplete data
- [ ] Verify PDF still generates with partial data
- [ ] Test with full data
- [ ] Verify comprehensive PDF content
- [ ] Test export after adding new records
- [ ] Verify PDF includes latest data

### 7.8 Data Persistence Testing

- [ ] Fill in section form
- [ ] Submit form
- [ ] Navigate to different section
- [ ] Return to original section
- [ ] Verify data is still there
- [ ] Refresh page
- [ ] Verify data persists after refresh
- [ ] Login/logout
- [ ] Login again
- [ ] Verify all user data intact
- [ ] Add multi-record item
- [ ] Verify record still exists after refresh
- [ ] Edit multi-record item
- [ ] Verify changes persisted
- [ ] Delete multi-record item
- [ ] Verify deletion persisted after refresh

### 7.9 Responsive Design Testing

- [ ] Test on desktop (1920px+)
- [ ] Test on tablet (768-1024px)
- [ ] Test on mobile (< 768px)
- [ ] Verify sidebar collapses on mobile
- [ ] Verify sections displayed in full width on mobile
- [ ] Verify header responsive layout
- [ ] Verify forms responsive on mobile
- [ ] Verify list components responsive
- [ ] Test modal dialogs on small screens
- [ ] Verify all buttons clickable and sized appropriately

### 7.10 Error Handling Testing

- [ ] Submit form without network connection
- [ ] Verify error message displayed
- [ ] Disconnect database temporarily
- [ ] Verify appropriate error handling
- [ ] Test with invalid data (SQL injection attempts)
- [ ] Test with extremely long field values
- [ ] Test special characters in text fields
- [ ] Verify database integrity maintained
- [ ] Test concurrent updates (multiple tabs)
- [ ] Verify data consistency

### 7.11 Field Type Validation Testing

- [ ] **Text fields:** Test with various text, numbers, special characters
- [ ] **Email fields:** Test valid/invalid emails
- [ ] **Phone fields:** Test various phone number formats
- [ ] **Date fields:** Test date picker, invalid dates
- [ ] **Number fields:** Test integers, decimals, negative numbers
- [ ] **Currency fields:** Test formatting with decimals
- [ ] **Textarea:** Test long text, line breaks, special characters
- [ ] **Select dropdowns:** Test all options, verify correct value stored
- [ ] **Checkboxes:** Test toggle on/off, verify state persistence

### 7.12 UI/UX Testing

- [ ] Verify consistent styling across all sections
- [ ] Verify color scheme matches theme
- [ ] Verify readability of text (contrast, font size)
- [ ] Verify button hover states
- [ ] Verify form focus states
- [ ] Verify loading spinners show for async operations
- [ ] Verify success/error messages clear and helpful
- [ ] Verify smooth transitions between pages
- [ ] Verify no console errors
- [ ] Verify accessibility (keyboard navigation, screen reader compatible if applicable)

### 7.13 Performance Testing

- [ ] Measure page load time
- [ ] Test with large datasets (many records in list)
- [ ] Verify form submission speed
- [ ] Test PDF generation speed
- [ ] Verify no memory leaks (browser dev tools)
- [ ] Test scroll performance
- [ ] Test modal open/close performance

### 7.14 Browser Compatibility Testing

- [ ] Chrome/Chromium latest
- [ ] Firefox latest
- [ ] Safari latest
- [ ] Edge latest
- [ ] Mobile browsers (Chrome, Safari)

### 7.15 Section-Specific Testing

**Plan Category:**
- [ ] Legal Documents: Create, read, update, delete
- [ ] Financial Accounts: Test with various account types
- [ ] Insurance Policies: Test premium frequency dropdown
- [ ] Employment: Test is_current toggle

**Care Category:**
- [ ] Personal Information: Test all field groups
- [ ] Medical: Test with/without physicians
- [ ] Residence: Test utility company fields
- [ ] Property/Vehicles: Test multi-record vehicle management

**Connect Category:**
- [ ] Family History: Test narrative fields
- [ ] Key Contacts: Test contact information
- [ ] Pets: Test multiple pets

**Support Category:**
- [ ] Credentials: Test all category types
- [ ] Test password visibility toggle (if implemented)

**Legacy Category:**
- [ ] Final Days: Test conditional fields (flowers, scents)
- [ ] Obituary: Test date and cost fields
- [ ] After Death: Test all arrangement options
- [ ] Funeral: Test boolean checkboxes
- [ ] Conclusion: Test narrative reflection fields

---

## 8. EDGE CASES AND SPECIAL SCENARIOS

1. **Concurrent Editing:**
   - Open same section in two browser tabs
   - Edit in one tab, save
   - Verify other tab reflects changes

2. **Very Long Content:**
   - Add very long text (10,000+ characters)
   - Verify database stores correctly
   - Verify display doesn't break layout

3. **Special Characters:**
   - Test with emoji, unicode characters
   - Test with HTML/JavaScript strings
   - Verify proper escaping

4. **Deleted Records:**
   - Delete record from database directly
   - Verify UI handles missing records gracefully

5. **Network Interruption:**
   - Start form submission
   - Interrupt network
   - Verify error handling
   - Verify retry functionality if available

6. **Session Timeout:**
   - Leave browser idle
   - Verify session timeout behavior
   - Attempt to submit form
   - Verify redirect to login

---

## 9. INTEGRATION POINTS TO TEST

1. **OpenAI API Integration:**
   - Verify API calls work with valid key
   - Verify error handling without key
   - Test response parsing

2. **PDF Generation:**
   - Verify jsPDF library integration
   - Verify data formatting
   - Test with various data sizes

3. **Database Integration:**
   - Verify all CRUD operations
   - Test foreign key relationships
   - Verify transaction handling

4. **Authentication System:**
   - Verify session management
   - Test with multiple simultaneous users
   - Verify security of credentials

---

## 10. KNOWN FEATURES NOT YET IMPLEMENTED

Based on TODO.md, the following features are planned but may not be fully implemented:

- [ ] Encryption of sensitive information
- [ ] Document upload functionality
- [ ] Advanced search/filtering in lists
- [ ] Data import from common formats
- [ ] Version history/changelog
- [ ] Email reminders for updates
- [ ] Session timeout warnings
- [ ] Two-factor authentication
- [ ] Data portability export
- [ ] Share sections with trusted contacts

---

## 11. TESTING PRIORITIES

**Critical (Must Test):**
- User authentication (login/register)
- Form submission and data persistence
- Readiness score calculation
- Multi-record management
- PDF export

**High Priority:**
- All section navigation
- Field validation
- Error handling
- Responsive design
- Data integrity

**Medium Priority:**
- AI assistance features
- Performance optimization
- Browser compatibility
- UI/UX polish

**Low Priority:**
- Edge cases with extreme data
- Accessibility features
- Analytics/tracking

---

## 12. QUICK START TEST SCENARIOS

### Scenario 1: New User Complete Workflow
1. Register new account
2. Complete Personal Information section
3. Add 3 credentials
4. Add 2 financial accounts
5. Check readiness score increased
6. Export to PDF
7. Verify PDF contains data

### Scenario 2: Multi-Record Section Testing
1. Login with existing account
2. Go to Insurance section
3. Add 3 insurance policies with different types
4. Edit one policy
5. Delete one policy
6. Verify all changes persisted

### Scenario 3: Score Progression
1. Login with fresh account (0% complete)
2. Fill Personal Information completely (should increase score)
3. Add 1 credential
4. Add 1 contact
5. Check readiness score reflects all additions
6. Verify motivational message updates

### Scenario 4: Category Navigation
1. Login to dashboard
2. Click through each category tab (Plan, Care, Connect, Support, Legacy)
3. Verify sidebar sections change
4. Verify first section auto-selected
5. Test section clicking and scrolling
6. Verify scroll spy works during scrolling

---

## 13. TESTING ENVIRONMENT SETUP

**Prerequisites:**
- Node.js 18+
- npm or yarn
- Modern web browser (Chrome, Firefox, Safari, Edge)
- OpenAI API key (optional, for AI features)

**Setup:**
```bash
npm install
cp .dev.vars.example .dev.vars
# Edit .dev.vars with OpenAI key if available
npm run dev
# Visit http://localhost:5173
```

**Database Reset (if needed):**
```bash
npx wrangler d1 execute wrap-it-up-db --local --file=./schema.sql
```

---

## 14. TEST EXECUTION NOTES

- Document any bugs found with screenshots/reproduction steps
- Test with both fresh accounts and existing accounts
- Clear browser cache between test runs if needed
- Monitor browser console for errors
- Check Network tab for failed requests
- Verify database updates via backend logs if available
- Test across different network speeds (throttle if possible)
