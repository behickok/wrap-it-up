# Wrap It Up - Codebase Overview

## Application Summary

**Wrap It Up** (displayed as "rhythm" in the UI) is a compassionate end-of-life planning workbook application that helps users organize comprehensive information about their life, finances, health, family, and end-of-life preferences.

## Core Purpose

Enable users to compile and organize all important life information in one secure location, covering:
- Legal and financial documents
- Personal and medical information
- Family relationships and history
- Daily life management (residence, property, employment)
- End-of-life preferences and arrangements
- Legacy and final thoughts

---

## Architecture Overview

### Tech Stack
- **Frontend:** SvelteKit 5 + Svelte 5
- **Database:** Cloudflare D1 (SQLite)
- **Styling:** Tailwind CSS + DaisyUI
- **AI Integration:** OpenAI API (optional)
- **Export:** jsPDF + jspdf-autotable
- **Deployment:** Cloudflare Pages

### Project Structure
```
src/
├── lib/
│   ├── components/          # Reusable UI components
│   ├── types.ts            # TypeScript interfaces
│   ├── readinessScore.ts   # Scoring logic
│   ├── scoringRules.ts     # Section scoring rules
│   ├── pdfExport.ts        # PDF generation
│   ├── utils.ts            # Utility functions
│   └── auth.ts             # Authentication helpers
├── routes/
│   ├── +layout.svelte      # Main layout (header, footer)
│   ├── +layout.server.ts   # Layout data loading
│   ├── +page.svelte        # Dashboard (main page)
│   ├── +page.server.ts     # Dashboard data + form actions
│   ├── login/              # Login page
│   ├── register/           # Registration page
│   └── api/
│       ├── auth/           # Authentication endpoints
│       ├── ask-ai/         # AI assistance endpoint
│       └── export-data/    # PDF export endpoint
├── app.css                 # Global styles
└── app.html                # HTML shell

schema.sql                 # Database schema
```

---

## Key Features

### 1. User Authentication
- Register with email, username, password
- Login with email or username
- Session-based authentication
- Logout functionality
- Password validation: 8+ chars, uppercase, lowercase, number

### 2. Dashboard with Navigation
- 5 journey categories (Plan, Care, Connect, Support, Legacy)
- 17 comprehensive sections organized by category
- Section sidebar with scroll-spy auto-selection
- Readiness score display (0-100 points)
- Sticky navigation on desktop, responsive on mobile

### 3. Forms and Data Entry
**Single-Record Sections:**
- Personal Information
- Medical Information
- Primary Residence
- Final Days Preferences
- Obituary Planning
- After Death Arrangements
- Funeral & Celebration of Life
- Final Thoughts & Reflections
- Family History

**Multi-Record Sections (with Add/Edit/Delete):**
- Usernames & Passwords (with categories)
- Key Contacts
- Legal Documents
- Financial Accounts
- Insurance Policies
- Employment History
- Vehicles & Property
- Pets
- Physicians

### 4. Readiness Score System
- Weighted calculation based on section completion
- 0-100 point scale
- Higher weights for critical sections (Legal, Financial, Insurance)
- Motivational messages based on progress
- Visual indicators (green, yellow, orange, red)

### 5. AI Assistance
- "Ask AI for Help" button in each section
- Modal dialog for questions
- Powered by OpenAI API
- Helpful prompts and suggestions
- Error handling if API unavailable

### 6. PDF Export
- Export all planning information to professional PDF
- Organized by journey categories
- Print-optimized formatting
- Filename with export timestamp
- Success/error notifications

### 7. Data Persistence
- All data stored in Cloudflare D1 (SQLite)
- User-specific data isolation
- Automatic score updates on save
- Foreign key relationships for data integrity

---

## Database Schema (Key Tables)

```sql
users                   -- User accounts
credentials            -- Passwords and account logins
personal_info          -- User demographic information
family_history         -- Family relationships
family_members         -- Individual family member records
pets                   -- Pet information
key_contacts           -- Important contacts
medical_info           -- Medical details
physicians             -- Doctor/healthcare provider information
employment             -- Job history
primary_residence      -- Home information
other_real_estate      -- Additional properties
vehicles               -- Vehicle information
personal_property      -- Other valuable items
insurance              -- Insurance policies
bank_accounts          -- Financial accounts
investments            -- Investment accounts
charitable_contributions -- Donation history
legal_documents        -- Legal document tracking
final_days             -- End-of-life preferences
obituary               -- Obituary planning
after_death            -- Body disposition preferences
funeral                 -- Funeral arrangements
conclusion             -- Final thoughts and reflections
section_completion     -- Progress tracking (scores)
documents              -- Document file references
```

---

## Component Architecture

### Core Components

**FormField.svelte** - Reusable form input
- Supports: text, email, tel, date, number, textarea, select
- Label with optional required indicator
- Two-way binding

**SectionContent.svelte** - Section display logic
- Routes to appropriate component based on section type
- Handles form submission
- Displays list components for multi-record sections

**List Components** (CredentialsList, ContactsList, etc.)
- Display records in table/card format
- Modal dialogs for add/edit
- Confirmation for delete
- Category-specific styling

**JourneyTabs.svelte** - Category navigation
- 5 journey tabs with icons
- Color-coded by category
- Category description display

**AskAI.svelte** - AI assistance modal
- Question input textarea
- Loading state during API call
- Response display box
- Error handling

---

## API Endpoints

### Authentication
```
POST   /api/auth/register     -- Create new account
POST   /api/auth/login        -- Login user
POST   /api/auth/logout       -- Logout user
GET    /api/auth/me           -- Get current user
```

### Features
```
POST   /api/ask-ai            -- Get AI assistance
POST   /api/export-data       -- Generate PDF export
```

### Section Data (all in +page.server.ts)
```
POST   /save-section          -- Save form data for any section
```

Form actions for CRUD operations:
- addCredential, updateCredential, deleteCredential
- addContact, updateContact, deleteContact
- addBankAccount, updateBankAccount, deleteBankAccount
- addInsurance, updateInsurance, deleteInsurance
- addEmployment, updateEmployment, deleteEmployment
- addLegalDocument, updateLegalDocument, deleteLegalDocument
- addDocument, updateDocument, deleteDocument

---

## Scoring System Details

### How Scores Are Calculated

1. **Section Scoring:**
   - Different logic for single-record vs multi-record sections
   - Single-record: percentage of fields filled
   - Multi-record: based on number of records and field completion
   - Field categories: critical, important, optional

2. **Readiness Score:**
   - Weighted average of all section scores
   - Weights defined in `types.ts` SECTIONS array
   - Formula: (sum of (section_score * weight)) / total_weight

3. **Motivational Messages:**
   - Auto-update based on current score
   - Different message at each tier (90+, 75+, 50+, 25+, 0+)

### Scoring Files
- `/src/lib/readinessScore.ts` - Main scoring logic
- `/src/lib/scoringRules.ts` - Section-specific scoring rules

---

## Form Patterns

### Single-Record Form Pattern
1. Load existing data in +page.server.ts
2. Display in SectionContent.svelte with FormField components
3. Use form submit action in +page.server.ts
4. Update database and recalculate score
5. Component reactively updates

### Multi-Record Form Pattern
1. Load array of records in +page.server.ts
2. Pass to list component (CredentialsList, etc.)
3. List component manages modal state for add/edit
4. Modal calls form action in +page.server.ts
5. Form action inserts/updates/deletes in database
6. List component refreshes after action completes

---

## Testing Information

### Automated Tests
- Unit tests in `*.spec.ts` and `*.spec.js` files
- E2E tests using Playwright in `/e2e` directory
- Run with: `npm run test`
- E2E tests run with: `npm run test:e2e`

### Manual Testing
See `MANUAL_TESTING_GUIDE.md` for comprehensive testing checklist covering:
- Authentication workflows
- Form submission and validation
- Navigation and scroll-spy
- Multi-record management
- Readiness score tracking
- PDF export functionality
- Data persistence
- Error handling
- Responsive design
- Browser compatibility

### Quick Test
```bash
npm install
npm run dev
# Navigate to http://localhost:5173
```

---

## Key Design Patterns

### State Management
- Svelte 5 runes (`$state`, `$derived`, `$effect`)
- Component-local state for forms
- Server-side data loading
- Form actions for mutations

### Data Flow
1. Server loads data (useLayout, usePage)
2. Pass data to components as props
3. Components bind form values
4. Submit via form actions
5. Server updates database
6. UI reactively updates

### Error Handling
- Try/catch in form actions
- Return error objects with `fail()`
- Display user-friendly messages
- Console logging for debugging

---

## Configuration Files

- `svelte.config.js` - SvelteKit configuration
- `vite.config.js` - Vite bundler configuration
- `tailwind.config.js` - Tailwind CSS customization
- `postcss.config.js` - PostCSS plugins
- `wrangler.jsonc` - Cloudflare Pages configuration
- `playwright.config.js` - E2E test configuration
- `jsconfig.json` - JavaScript/TypeScript configuration

---

## Environment Variables

Create `.dev.vars` file (copy from `.dev.vars.example`):
```
OPENAI_API_KEY=your_api_key_here  # Optional, for AI features
```

Production environment variables set in Cloudflare dashboard.

---

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type checking
npm run check

# Linting and formatting
npm run lint
npm run format

# Run tests
npm run test              # Unit + E2E tests
npm run test:unit        # Unit tests only
npm run test:e2e         # E2E tests only

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Cloudflare
npm run deploy
```

---

## Key Files to Understand

1. **schema.sql** - Complete database schema
2. **src/lib/types.ts** - All TypeScript interfaces and SECTIONS definition
3. **src/routes/+page.server.ts** - All form actions and data loading
4. **src/routes/+page.svelte** - Main dashboard layout and navigation
5. **src/lib/components/SectionContent.svelte** - Section rendering logic
6. **src/lib/readinessScore.ts** - Score calculation

---

## Notable Implementation Details

1. **No Traditional Form Framework** - Uses SvelteKit's native form actions
2. **Category-Based Navigation** - 5 journey stages with 17 sections
3. **Weighted Scoring** - Higher-priority sections influence score more
4. **AI Integration** - Optional OpenAI integration for guidance
5. **PDF Generation** - Client-side using jsPDF
6. **No User Password Encryption** - TODO item for future implementation
7. **Session-Based Auth** - Simple cookie-based authentication

---

## Future Enhancement Opportunities

See TODO.md for planned features:
- Encryption of sensitive data
- Document upload functionality
- Data import/export formats
- Version history tracking
- Email reminders
- Two-factor authentication
- Share sections with trusted contacts

---

## Performance Considerations

- Lazy loading of PDF libraries
- Scroll-spy with debouncing
- Efficient database queries with Promise.all
- Sticky positioning for navigation
- CSS grid for responsive layouts

---

## Security Notes

- User data isolated by user_id
- Form actions validate input
- No stored passwords visible in DB (TODO: implement encryption)
- Session-based authentication
- CSRF protection via SvelteKit

---

## Learning Resources for New Developers

1. **SvelteKit Docs:** https://kit.svelte.dev/docs/introduction
2. **Svelte 5 Guide:** https://svelte.dev/docs/svelte/what-is-svelte
3. **Tailwind CSS:** https://tailwindcss.com/docs
4. **DaisyUI Components:** https://daisyui.com/docs/install/
5. **Cloudflare D1:** https://developers.cloudflare.com/d1/
6. **jsPDF:** https://github.com/parallax/jsPDF
7. **OpenAI API:** https://platform.openai.com/docs/api-reference

---

For detailed testing information, see **MANUAL_TESTING_GUIDE.md**
