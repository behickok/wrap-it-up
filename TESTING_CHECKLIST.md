# Comprehensive Testing Checklist for Wrap It Up Platform

**Platform Overview**: End-of-life planning and life event management platform (currently "Rhythm" branded) with multi-journey support, mentor review system, messaging, notifications, and marketplace functionality.

**Tech Stack**: 
- Frontend: SvelteKit 5 + Tailwind CSS + DaisyUI
- Backend: Cloudflare Workers (D1 Database)
- Testing: Playwright (E2E), Vitest (Unit)
- Database: 57 SQLite tables

---

## 1. AUTHENTICATION & USER MANAGEMENT

### 1.1 User Registration
- [x] Register with valid email and password (`tests/register.api.spec.ts`)
- [x] Register with valid username (3-20 chars, alphanumeric + underscore only) (`tests/register.api.spec.ts`)
- [x] Validate email format (`tests/register.api.spec.ts`)
- [x] Validate password strength (min 8 chars, uppercase, lowercase, number) (`tests/register.api.spec.ts`)
- [x] Validate username format (`tests/register.api.spec.ts`)
- [x] Prevent duplicate email registration (`tests/register.api.spec.ts`)
- [x] Prevent duplicate username registration (`tests/register.api.spec.ts`)
- [x] Hash passwords securely (PBKDF2) (`src/lib/auth.spec.ts`)
- [x] Create new user with default notification preferences (`tests/register.api.spec.ts`)
- [x] Verify user is marked as active (`tests/register.api.spec.ts`)

### 1.2 User Login
- [x] Login with email and password (`src/routes/api/auth/login/login.server.spec.ts`)
- [x] Login with username and password (`src/routes/api/auth/login/login.server.spec.ts`)
- [x] Invalid credentials rejection (`src/routes/api/auth/login/login.server.spec.ts`)
- [x] Case-insensitive email/username login (`src/routes/api/auth/login/login.server.spec.ts`)
- [x] Session creation and token generation (`src/routes/api/auth/login/login.server.spec.ts`)
- [x] Session expiration (7 days default) (`src/routes/api/auth/login/login.server.spec.ts`)
- [x] Redirect to dashboard on successful login (`e2e/login.spec.ts`)
- [x] Redirect unauthenticated users to login (`e2e/demo.spec.ts`)
- [x] Remember login state across page reloads (`e2e/login.spec.ts`)
- [x] Last login timestamp update (`src/routes/api/auth/login/login.server.spec.ts`)

### 1.3 User Logout
- [x] Destroy session on logout (`src/routes/api/auth/logout/logout.server.spec.ts`)
- [x] Redirect to login page after logout (`e2e/login.spec.ts`)
- [x] Clear authentication cookies (`src/routes/api/auth/logout/logout.server.spec.ts`)
- [ ] Invalidate all active sessions (optional)

### 1.4 User Authentication Persistence
- [x] Maintain session across navigation (`e2e/login.spec.ts`)
- [x] Validate session expiration (`src/lib/auth.spec.ts`)
- [x] Clean up expired sessions (`src/lib/auth.spec.ts`)
- [x] Handle session not found error (`src/hooks.server.spec.ts`)

### 1.5 User Profile
- [x] View current user profile (`tests/user-profile.api.spec.ts`)
- [x] Display username, email, join date (`tests/user-profile.api.spec.ts`)
- [x] Update user information (`tests/user-profile.api.spec.ts`)
- [x] View user activity/last login (`tests/user-profile.api.spec.ts`)

---

## 2. ROLE-BASED ACCESS CONTROL & PERMISSIONS

### 2.1 User Roles
The system supports multiple roles (from docs and code):
- **Regular User** - Base role for all authenticated users
- **Creator** - Can create and publish journeys
- **Mentor** - Can review sections and provide feedback
- **Coach** - Can manage clients (feature in code)
- **Admin** - Full platform access

### 2.2 Role Assignment & Management
- [ ] Assign roles to users
- [ ] Verify role-based access restrictions
- [ ] Check permission inheritance
- [ ] Test role removal/revocation
- [ ] Prevent unauthorized role elevation
- [ ] View current user roles in header (shows mentor status)

### 2.3 Permission Enforcement
- [ ] Verify users without roles can't access restricted features
- [ ] Check page-level access control redirects
- [ ] Verify API endpoint permission checks
- [ ] Test role-specific feature visibility
- [ ] Confirm mentors can only access mentor features
- [ ] Confirm creators can only manage their journeys
- [ ] Verify admins have full access

---

## 3. CORE FUNCTIONALITY: JOURNEY MANAGEMENT

### 3.1 Journey Creation (Admin/Creator)
- [ ] Create new journey with name, slug, description, icon
- [ ] Auto-generate slug from journey name
- [ ] Manual slug customization
- [ ] Set journey as active/inactive
- [ ] Save journey metadata
- [ ] Validate unique journey slug
- [ ] Display created journey in journey list
- [ ] Edit created journey

### 3.2 Journey Organization
- [ ] Create categories (sections grouping)
- [ ] Assign sections to categories
- [ ] Set display order for categories
- [ ] Set display order for sections
- [ ] View category/section hierarchy
- [ ] Edit category assignments
- [ ] Delete categories (with section reassignment)

### 3.3 Dynamic Form Fields (Section Builder)
Available field types:
- Text (short/long)
- Number
- Date
- Email
- Phone
- URL
- Checkbox
- Radio
- Select/Dropdown
- Textarea
- File upload
- List (dynamic items)

Field Properties:
- [ ] Field name and label
- [ ] Field type selection
- [ ] Required/optional toggle
- [ ] Help text/description
- [ ] Placeholder text
- [ ] Default values
- [ ] Field ordering
- [ ] Importance level (critical/important/optional)
- [ ] Conditional logic
- [ ] Field configuration (type-specific options)

### 3.4 Section Configuration
- [ ] Create section with name and description
- [ ] Set scoring type (field_count, list_items, custom)
- [ ] Set section weight (default 5)
- [ ] Override weight per journey
- [ ] Mark section as required
- [ ] View section fields in order
- [ ] Edit section details
- [ ] Delete section (with cascade handling)

### 3.5 Journey Publication
- [ ] Mark journey as published/draft
- [ ] Feature journeys in marketplace
- [ ] Track usage count
- [ ] Publish to marketplace (Creator feature)
- [ ] Set journey visibility (public/private)

---

## 4. USER JOURNEYS & ENROLLMENT

### 4.1 Journey Browsing (Marketplace)
- [ ] Browse all active journeys in marketplace
- [ ] Search journeys by name/description
- [ ] Filter by category
- [ ] View journey cards with name, description, icon
- [ ] Display lowest pricing tier for each journey
- [ ] Sort journeys by relevance/popularity
- [ ] View creator information
- [ ] See journey description and features
- [ ] View use count (users enrolled)
- [ ] Pagination of journey list (50 per page)

### 4.2 Journey Enrollment
- [ ] Enroll in journey from marketplace
- [ ] Create user_journey record on enrollment
- [ ] Assign to appropriate tier (Free/Standard/Premium/Guided)
- [ ] Set enrollment status (active/paused/completed/cancelled)
- [ ] Record enrollment timestamp
- [ ] Redirect to journey dashboard after enrollment
- [ ] Prevent duplicate enrollments (unique constraint)
- [ ] Display successful enrollment message

### 4.3 User Journey Management
- [ ] View all enrolled journeys (My Journeys)
- [ ] View journey progress percentage
- [ ] View journey status (active/completed/paused)
- [ ] Pause journey
- [ ] Resume paused journey
- [ ] Cancel journey
- [ ] View completion date (if completed)
- [ ] Access journey dashboard from list

### 4.4 Journey Dashboard
- [ ] Load journey sections organized by category
- [ ] Display progress bar with completion percentage
- [ ] Show section completion status
- [ ] Show readiness score for applicable journeys
- [ ] Display motivational messages based on progress
- [ ] Scroll spy highlighting current section
- [ ] Category navigation tabs
- [ ] Export to PDF functionality

---

## 5. SECTION DATA & FORM MANAGEMENT

### 5.1 Section Data Entry
- [ ] Display dynamic form based on section fields
- [ ] Render appropriate form controls for field types
- [ ] Populate form with existing data (if any)
- [ ] Validate required fields before save
- [ ] Show field help text on hover/focus
- [ ] Show placeholder text in inputs
- [ ] Support conditional field visibility
- [ ] Handle default values

### 5.2 Data Persistence
- [ ] Save section data to section_data table
- [ ] Update completed_fields and total_fields counts
- [ ] Track auto-save functionality
- [ ] Update last_modified timestamp
- [ ] Handle concurrent edits gracefully
- [ ] Show save confirmation/success message
- [ ] Display save errors appropriately

### 5.3 Data Validation
- [ ] Validate field-specific requirements
- [ ] Validate required fields
- [ ] Validate field types (email, URL, date, etc.)
- [ ] Validate list items (dynamic item fields)
- [ ] Display validation error messages
- [ ] Highlight invalid fields
- [ ] Prevent save with validation errors

### 5.4 List/Dynamic Items Management
- [ ] Add new items to list fields
- [ ] Edit existing list items
- [ ] Remove list items
- [ ] Reorder list items
- [ ] Validate list item content
- [ ] Display item count
- [ ] Handle empty lists

### 5.5 Section Navigation
- [ ] Navigate between sections in same category
- [ ] Navigate between categories
- [ ] Show current section in sidebar
- [ ] Show section completion status
- [ ] Maintain scroll position when navigating
- [ ] Show progress in header

---

## 6. PROGRESS TRACKING & SCORING

### 6.1 Readiness Score Calculation
From `readinessScore.ts`:
- [ ] Calculate overall score (0-100)
- [ ] Weight sections based on weight property
- [ ] Include field completion count
- [ ] Include list item counts
- [ ] Custom scoring rules per section
- [ ] Show progress visualization

### 6.2 Journey Progress Tracking
- [ ] Track completion for each section
- [ ] Calculate section score
- [ ] Update journey_journey_progress table
- [ ] Display progress per section
- [ ] Display overall journey progress
- [ ] Show completion percentage

### 6.3 Section Completion Status
- [ ] Mark section as complete when all required fields filled
- [ ] Update is_completed flag
- [ ] Show visual indicator for complete sections
- [ ] Track completion timestamp

### 6.4 Scoring Rules
From `scoringRules.ts`:
- [ ] Apply specific scoring logic per section
- [ ] Handle multiple scoring types (field_count, list_items, custom)
- [ ] Update scores when data changes
- [ ] Reflect score changes in progress display

---

## 7. MENTOR SYSTEM

### 7.1 Mentor Application & Onboarding
- [ ] Apply to become mentor
- [ ] Submit application with profile information
- [ ] Upload profile picture/avatar (if supported)
- [ ] Enter display name
- [ ] Enter bio/expertise areas
- [ ] Set hourly rate
- [ ] See application submitted confirmation
- [ ] Receive approval notification

### 7.2 Mentor Approval Workflow (Creator)
- [ ] View pending mentor applications
- [ ] Review applicant profile
- [ ] Approve mentor application
- [ ] Reject mentor application with reason
- [ ] See approval status in application list
- [ ] Send approval/rejection notification

### 7.3 Mentor Profile Management
- [ ] View mentor profile (when approved)
- [ ] Update display name
- [ ] Update bio and expertise areas
- [ ] Update hourly rate
- [ ] View rating and review count
- [ ] View assigned journeys
- [ ] Update availability status
- [ ] Set availability calendar (if supported)
- [ ] View specializations
- [ ] Manage specializations/expertise areas

### 7.4 Journey Mentor Assignment (Creator)
- [ ] Assign approved mentors to journeys
- [ ] Set compensation/hourly rate for assignment
- [ ] Set assignment status (active/inactive)
- [ ] View assigned mentors in journey
- [ ] Remove mentor assignment
- [ ] Create mentor_journeys records
- [ ] View mentor history

---

## 8. REVIEW SYSTEM

### 8.1 Review Submission (User)
- [ ] Submit section for mentor review
- [ ] Select mentor to review (if multiple available)
- [ ] Add optional submission notes
- [ ] Create mentor_review record with "pending" status
- [ ] Show confirmation message
- [ ] Track submission timestamp
- [ ] Block duplicate submissions (same section)
- [ ] Show "submitted for review" status on section

### 8.2 Pending Reviews (Mentor)
- [ ] View all pending reviews for assigned journeys
- [ ] Filter reviews by journey
- [ ] Filter reviews by status (pending, assigned, in_review, completed)
- [ ] Sort by submission date
- [ ] See user info and submission context
- [ ] Pagination of review list
- [ ] See section content/data being reviewed

### 8.3 Review Assignment (Mentor)
- [ ] Claim/assign review to self
- [ ] Update mentor_review status to "assigned"
- [ ] Start reviewing submission
- [ ] See notification of assignment
- [ ] Track assignment timestamp

### 8.4 Review Interface (Mentor)
- [ ] View section content/data in review mode
- [ ] See all section fields and filled data
- [ ] Add field-level comments/feedback
- [ ] Add general review comments
- [ ] View existing comments from user
- [ ] Reply to user comments
- [ ] Mark fields as reviewed
- [ ] Save review progress (draft)
- [ ] Display comment threads

### 8.5 Review Completion
- [ ] Approve submission (complete review)
- [ ] Request changes from user
- [ ] Add overall feedback
- [ ] Set mentor rating/feedback
- [ ] Update review status to "completed"
- [ ] Send notification to user of completion
- [ ] Show review history

### 8.6 User Review Response
- [ ] See review feedback and comments
- [ ] View mentor's overall assessment
- [ ] See field-level comments from mentor
- [ ] View review history
- [ ] Make updates based on feedback
- [ ] Resubmit if changes requested
- [ ] See "changes requested" notification

### 8.7 Review Analytics (Mentor)
- [ ] View all completed reviews
- [ ] See ratings distribution
- [ ] See average turnaround time
- [ ] See total reviews completed
- [ ] See earnings from reviews

---

## 9. MESSAGING SYSTEM

### 9.1 Message Threading
- [ ] Create message thread between two users
- [ ] Get or create existing thread
- [ ] Optionally link thread to section review
- [ ] Optionally link thread to journey
- [ ] Display thread with both participants
- [ ] Show thread in message inbox

### 9.2 Sending Messages
- [ ] Send message in thread
- [ ] Create message record with sender/recipient
- [ ] Show "sent" state
- [ ] Update thread's last_message_at
- [ ] Update thread's last_message_preview
- [ ] Auto-create notification for recipient
- [ ] Message appears in thread

### 9.3 Message Inbox
- [ ] View all message threads
- [ ] Sort by last message date (descending)
- [ ] Show thread participants
- [ ] Show subject (if set)
- [ ] Show message count per thread
- [ ] Show unread message count
- [ ] Show last message preview
- [ ] Show last message timestamp
- [ ] Pagination (50 per page)
- [ ] Archive/unarchive threads

### 9.4 Message Conversation View
- [ ] Load all messages in thread
- [ ] Sort messages by creation date (ascending)
- [ ] Show sender/recipient info
- [ ] Show message timestamps
- [ ] Show read receipts (if available)
- [ ] Mark messages as read
- [ ] Reply to messages in thread
- [ ] Edit messages (if not deleted)
- [ ] Delete messages (soft delete)
- [ ] View deleted message indicator

### 9.5 Message Notifications
- [ ] Send notification on new message
- [ ] Show notification with sender name
- [ ] Show message preview in notification
- [ ] Link notification to message thread
- [ ] Create in_app_notification records
- [ ] Check user notification preferences

### 9.6 Message Search/Filtering
- [ ] Filter by archived/active
- [ ] Search by participant name
- [ ] Search by message content
- [ ] Sort by date
- [ ] Show unread messages first

---

## 10. NOTIFICATION SYSTEM

### 10.1 Notification Types
The system supports these notification types:
- `review_claimed` - Mentor claimed a review
- `review_completed` - Review is done with feedback
- `review_changes_requested` - Need to make changes
- `review_available` - New review submitted for mentor
- `mentor_approved` - Application approved
- `mentor_rejected` - Application rejected
- `journey_enrolled` - User enrolled in journey
- `milestone_achieved` - User reached a milestone
- `new_message` - Received a message

### 10.2 Notification Center UI
- [ ] Display all notifications in chronological order
- [ ] Show unread notification count
- [ ] Filter by notification type
- [ ] Filter by read/unread
- [ ] Show notification icon/emoji per type
- [ ] Show notification title
- [ ] Show notification message
- [ ] Show notification timestamp (relative time)
- [ ] Pagination (50 per page)

### 10.3 Notification Interaction
- [ ] Mark individual notification as read
- [ ] Mark all notifications as read
- [ ] Delete individual notification
- [ ] Delete all read notifications
- [ ] Click notification to navigate to link
- [ ] View notification as read/unread state
- [ ] Show unread badge on unread notifications

### 10.4 Notification Preferences
- [ ] View notification preferences page
- [ ] In-app notification toggles (reviews, messages, platform, milestones)
- [ ] Browser notification toggle
- [ ] Group similar notifications toggle
- [ ] Quiet hours enable/disable
- [ ] Set quiet hours start time
- [ ] Set quiet hours end time
- [ ] Save preference changes
- [ ] Show success message on save

### 10.5 Notification Preferences Enforcement
- [ ] Create default preferences for new users
- [ ] Check preferences before sending notifications
- [ ] Respect quiet hours when enabled
- [ ] Group notifications if enabled
- [ ] Store preferences in notification_preferences table

### 10.6 Auto-Notifications
- [ ] Auto-notification on new message (via trigger)
- [ ] Auto-notification on review assignment
- [ ] Auto-notification on review completion
- [ ] Check recipient preferences for each
- [ ] Create in_app_notification records automatically

---

## 11. ANALYTICS & REPORTING

### 11.1 Creator Analytics Dashboard
- [ ] Display total journeys count
- [ ] Display published journeys count
- [ ] Display total users count (across all journeys)
- [ ] Display revenue metrics (if applicable)
- [ ] Show journey enrollment trends
- [ ] Show user engagement metrics
- [ ] Display chart visualizations
- [ ] Export analytics to CSV/PDF

### 11.2 Mentor Analytics Dashboard
- [ ] Display reviews completed count
- [ ] Display average rating
- [ ] Display earnings/revenue
- [ ] Display turnaround time
- [ ] Show review history
- [ ] Show rating distribution
- [ ] Display metrics over time
- [ ] Export analytics data

### 11.3 Admin Analytics
- [ ] View platform-wide metrics
- [ ] View all user registrations
- [ ] View all journeys and usage
- [ ] View mentor applications and stats
- [ ] View revenue/transactions
- [ ] View system health metrics

### 11.4 Data Export
- [ ] Export personal data (GDPR compliance)
- [ ] Export section data as CSV
- [ ] Export analytics as CSV/PDF
- [ ] Export full journey data
- [ ] Asynchronous export processing

---

## 12. SPECIAL FEATURES & CONTENT TYPES

### 12.1 End-of-Life Planning Content (Legacy Sections)
The system includes 18+ specialized sections for end-of-life planning:
- [ ] Credentials (passwords and usernames)
- [ ] Personal Information (self and spouse)
- [ ] Family History (family members and relationships)
- [ ] Pets (names, vets, insurance)
- [ ] Key Contacts (relationships and contact info)
- [ ] Medical Information (blood type, conditions, physicians)
- [ ] Employment (current/past employers)
- [ ] Primary Residence (home details and keys)
- [ ] Service Providers (utilities, contractors)
- [ ] Home Inventory (contents and value)
- [ ] Other Real Estate (properties owned)
- [ ] Vehicles (cars, motorcycles, etc.)
- [ ] Personal Property (valuables, collections)
- [ ] Insurance (health, auto, home, life)
- [ ] Bank Accounts (savings, checking, investment)
- [ ] Investments (stocks, bonds, retirement)
- [ ] Charitable Contributions (causes and preferences)
- [ ] Legal Documents (wills, trusts, powers of attorney)
- [ ] Final Days (funeral preferences)
- [ ] Obituary (biographical information)
- [ ] After Death (final instructions)
- [ ] Funeral (arrangements)
- [ ] Conclusion (reflections and advice)

### 12.2 Wedding Journey Content
- [ ] Marriage License (jurisdiction, dates, requirements)
- [ ] Prenup (status, review deadline, signing plan)
- [ ] Joint Finances (account merging, budgeting plan)
- [ ] Name Change (new name, documents to update)
- [ ] Venue (selection, tour dates, costs)
- [ ] Vendors (contact info, contracts, payments)
- [ ] Guest List (names, RSVP tracking, meal preferences)
- [ ] Registry Items (items, quantities, prices)
- [ ] Home Setup (housing plan, utilities, design)

### 12.3 PDF Export
- [ ] Export journey data to PDF
- [ ] Include section content
- [ ] Include formatting and structure
- [ ] Include progress information
- [ ] Handle file download
- [ ] Show export status/progress

---

## 13. UI COMPONENTS & INTERACTION

### 13.1 Dynamic Form Components
- [ ] DynamicForm component renders field array
- [ ] DynamicFormField component for each field
- [ ] DynamicListSection for list items
- [ ] Form validation and error display
- [ ] Form auto-save (if implemented)
- [ ] Loading states during submission

### 13.2 Navigation & Layout
- [ ] Main header with navigation
- [ ] User greeting with username
- [ ] Logout button in header
- [ ] Logo/brand link to homepage
- [ ] Navigation to Dashboard
- [ ] Navigation to Journeys
- [ ] Navigation to Mentor dashboard (if applicable)
- [ ] Footer with links
- [ ] Responsive mobile menu
- [ ] Active page highlighting

### 13.3 Cards & Display
- [ ] Journey cards with icon, name, description
- [ ] Thread cards showing last message
- [ ] Notification cards with actions
- [ ] Stats cards (numbers with icons)
- [ ] Review cards with status badges

### 13.4 Forms & Inputs
- [ ] Text inputs with validation
- [ ] Textarea for longer content
- [ ] Date pickers
- [ ] Email inputs with validation
- [ ] Phone inputs with formatting
- [ ] URL inputs with validation
- [ ] Checkbox groups
- [ ] Radio button groups
- [ ] Select/dropdown menus
- [ ] File upload inputs
- [ ] Required field indicators

### 13.5 Modals & Dialogs
- [ ] Create/edit journey modals
- [ ] Confirm action dialogs
- [ ] Complete review modals
- [ ] Message compose modals
- [ ] Settings modals
- [ ] Close on escape key
- [ ] Backdrop click to close
- [ ] Form submission in modals

### 13.6 Charts & Visualizations
- [ ] Bar charts (for metrics)
- [ ] Line charts (for trends)
- [ ] Progress bars (for completion)
- [ ] Rating stars (1-5 stars)
- [ ] Pie charts (for distributions)

### 13.7 Loading & Error States
- [ ] Loading spinners during async operations
- [ ] Loading state buttons (disabled + spinner)
- [ ] Error alerts with messages
- [ ] Success alerts with messages
- [ ] Skeleton loaders (if implemented)
- [ ] Empty state messages
- [ ] "Not found" error pages

### 13.8 Accessibility
- [ ] Keyboard navigation support
- [ ] ARIA labels on interactive elements
- [ ] Form labels associated with inputs
- [ ] Focus visible styles
- [ ] Color contrast compliance
- [ ] Alt text on images
- [ ] Accessibility settings page (exists in codebase)

---

## 14. API ENDPOINTS

### 14.1 Authentication APIs
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### 14.2 Review/Section APIs
- Review submission and claiming
- Review completion and feedback
- Comment creation and retrieval
- Review status updates

### 14.3 Analytics Export APIs
- `GET /api/admin/analytics/export` - Export admin analytics
- `GET /api/creator/analytics/export` - Export creator analytics
- `GET /api/mentor/analytics/export` - Export mentor analytics
- CSV/PDF export formats

### 14.4 User Data Export
- `GET /api/export-data` - Export personal user data

### 14.5 AI/Chat API
- `POST /api/ask-ai` - Ask AI assistant questions

### 14.6 Performance Tracking
- `POST /api/performance/web-vitals` - Send web vitals metrics

---

## 15. ERROR HANDLING & VALIDATION

### 15.1 Input Validation
- [ ] Server-side validation on all inputs
- [ ] Client-side validation with user feedback
- [ ] Email format validation
- [ ] Password strength validation
- [ ] Required field validation
- [ ] Field type-specific validation (date, number, etc.)
- [ ] Unique constraint validation (slug, email, username)
- [ ] List item validation

### 15.2 Error Messages
- [ ] Clear, user-friendly error messages
- [ ] Specific field error messages
- [ ] Form-level error messages
- [ ] API error response handling
- [ ] Network error handling
- [ ] Not found (404) error pages
- [ ] Unauthorized (401) error handling
- [ ] Forbidden (403) error handling
- [ ] Server error (500) error pages

### 15.3 Graceful Degradation
- [ ] Handle missing database gracefully
- [ ] Handle offline scenarios
- [ ] Fallback UI for missing data
- [ ] Handle partial load failures
- [ ] Retry mechanisms for failed requests

---

## 16. SECURITY & DATA PROTECTION

### 16.1 Authentication Security
- [ ] Password hashing (PBKDF2 with salt)
- [ ] Session management with expiration
- [ ] Secure session storage
- [ ] HTTPS/secure cookies (in production)
- [ ] CSRF protection (if applicable)
- [ ] SQL injection prevention (parameterized queries)

### 16.2 Authorization
- [ ] Server-side permission checks
- [ ] Prevent unauthorized access to resources
- [ ] Check journey ownership/access
- [ ] Check review ownership/access
- [ ] Check message thread access
- [ ] Verify role permissions

### 16.3 Data Protection
- [ ] Sensitive data hashing (passwords)
- [ ] Sensitive field encryption (optional)
- [ ] Data deletion/GDPR compliance
- [ ] Audit logging (if implemented)
- [ ] Rate limiting (if implemented)

---

## 17. PERFORMANCE & OPTIMIZATION

### 17.1 Database Optimization
- [ ] Proper indexing on query columns
- [ ] Query optimization and N+1 prevention
- [ ] Connection pooling
- [ ] Caching layer (if implemented)
- [ ] View usage for complex queries

### 17.2 Frontend Performance
- [ ] Lazy loading of images
- [ ] Code splitting and bundling
- [ ] Minification
- [ ] CSS optimization
- [ ] Web vitals tracking (API exists)
- [ ] Page load time monitoring

### 17.3 Pagination
- [ ] Implement pagination for large datasets
- [ ] 50 items per page default
- [ ] Pagination controls (previous/next)
- [ ] Current page indicator

---

## 18. TESTING INFRASTRUCTURE

### 18.1 Unit Tests (Vitest)
- [ ] Auth utilities (`auth.spec.ts`)
- [ ] PDF export functionality (`pdfExport.spec.ts`)
- [ ] Readiness scoring (`readinessScore.spec.ts`)
- [ ] Scoring rules (`scoringRules.spec.ts`)
- [ ] Journey progress (`journeyProgress.ts`)
- [ ] Generic scoring (`genericScoring.ts`)

### 18.2 E2E Tests (Playwright)
- [ ] Navigate to pages
- [ ] Fill out forms
- [ ] Submit data
- [ ] Verify success messages
- [ ] Test workflows end-to-end
- [ ] Cross-browser testing (if configured)
- [ ] Accessibility testing with Playwright

### 18.3 Test Configuration
- [ ] Playwright config with browsers
- [ ] Test environment setup
- [ ] Test database seeding
- [ ] Mock data fixtures
- [ ] Test utility functions

---

## 19. DEPLOYMENT & ENVIRONMENT

### 19.1 Build & Deployment
- [ ] Run `npm run build`
- [ ] Verify build output
- [ ] Test production build locally
- [ ] Deploy to Cloudflare Pages
- [ ] Verify deployment success
- [ ] Check environment variables

### 19.2 Environment Configuration
- [ ] `.dev.vars` file setup (local)
- [ ] Cloudflare env vars (production)
- [ ] Database connection (D1)
- [ ] API secrets (if any)

---

## 20. CROSS-FUNCTIONAL WORKFLOWS

### 20.1 Complete User Flow: Journey Enrollment
1. [ ] User registers account
2. [ ] User logs in
3. [ ] User browses marketplace
4. [ ] User searches/filters journeys
5. [ ] User enrolls in journey
6. [ ] User sees "My Journeys"
7. [ ] User opens journey dashboard
8. [ ] User views sections
9. [ ] User fills in section data
10. [ ] User saves progress
11. [ ] Progress updates in dashboard

### 20.2 Complete Mentor Flow: Section Review
1. [ ] User applies as mentor
2. [ ] Creator approves application
3. [ ] Mentor receives approval notification
4. [ ] Creator assigns mentor to journey
5. [ ] Mentor sees assigned journey
6. [ ] User submits section for review
7. [ ] Mentor sees pending review
8. [ ] Mentor claims review
9. [ ] Mentor opens review interface
10. [ ] Mentor adds comments to fields
11. [ ] Mentor completes review with feedback
12. [ ] User receives "review completed" notification
13. [ ] User views mentor feedback
14. [ ] User updates section based on feedback
15. [ ] User resubmits (if changes requested)

### 20.3 Complete Messaging Flow
1. [ ] Mentor and user are in same context (review/journey)
2. [ ] One initiates message (creates thread)
3. [ ] Recipient sees message in inbox
4. [ ] Recipient sees notification
5. [ ] Recipient opens message thread
6. [ ] Recipient replies to message
7. [ ] Sender sees new message notification
8. [ ] Sender opens thread and sees reply
9. [ ] Conversation continues
10. [ ] User archives thread
11. [ ] Thread moves to archived section

### 20.4 Complete Notification Flow
1. [ ] Action triggers notification (e.g., message sent)
2. [ ] Notification created in in_app_notifications table
3. [ ] Trigger checks user preferences
4. [ ] Trigger respects quiet hours (if enabled)
5. [ ] Notification appears in notification center
6. [ ] User sees unread count
7. [ ] User opens notification center
8. [ ] User marks notification as read
9. [ ] Unread count updates
10. [ ] User clicks notification to navigate

---

## 21. REGRESSION TESTING CHECKLIST

### 21.1 Critical Paths (Test After Every Change)
- [ ] User can register and login
- [ ] User can enroll in journey
- [ ] User can fill in and save section data
- [ ] User can submit for review
- [ ] Mentor can claim and complete review
- [ ] Messages are created and received
- [ ] Notifications are created and displayed
- [ ] PDF export works
- [ ] Analytics display correctly

### 21.2 Known Issues/Edge Cases
- [ ] Concurrent edit handling
- [ ] Large file uploads (if applicable)
- [ ] Long-running exports
- [ ] Network timeout recovery
- [ ] Session expiration handling
- [ ] Multiple browser tabs
- [ ] Mobile responsiveness

---

## 22. TESTING PRIORITIES

### High Priority (Test First)
1. Authentication flows
2. Journey enrollment and dashboard
3. Section data persistence
4. Mentor review workflow
5. Messaging system
6. Notifications
7. Permission checks

### Medium Priority
1. Analytics calculations
2. PDF export
3. Advanced search/filtering
4. Accessibility features
5. Error handling

### Low Priority
1. UI edge cases
2. Performance optimization
3. Accessibility polish
4. Non-critical features

---

## 23. TEST DATA REQUIREMENTS

### Sample Data Needed
- [ ] Test user (regular, creator, mentor, admin)
- [ ] Test journeys (with various section types)
- [ ] Test section data (populated and empty)
- [ ] Test mentors (approved and pending)
- [ ] Test reviews (in various states)
- [ ] Test messages (threads with multiple messages)
- [ ] Test notifications (various types)

### Seeding Scripts
- `0010_seed_sample_user.sql` - Sample user creation
- `0007_seed_initial_data.sql` - Initial data
- `0008_seed_section_fields.sql` - Field definitions
- `scripts/sample-data-user-1.sql` - Sample user data

---

## 24. BROWSER & DEVICE TESTING

### Browsers to Test
- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Devices to Test
- [ ] Desktop (1920x1080)
- [ ] Tablet (768px breakpoint)
- [ ] Mobile (375px breakpoint)
- [ ] Mobile landscape

### Browser Features
- [ ] JavaScript enabled
- [ ] Cookies enabled
- [ ] LocalStorage available
- [ ] WebStorage API
