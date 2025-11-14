# Wrap It Up Platform - Features & Implementation Summary

## PLATFORM OVERVIEW

**Name**: Rhythm (formerly Wrap It Up)  
**Type**: End-of-life planning & life event management platform  
**Architecture**: SvelteKit frontend + Cloudflare Workers backend + D1 SQLite database  
**Current Phase**: Phase 9 - Complete (Messaging & Notifications)  

---

## 1. IMPLEMENTED FEATURES (PHASES 1-9 COMPLETE)

### Phase 1: Foundation & Authentication
- User registration with email/username/password
- PBKDF2 password hashing with salt
- Session management (7-day expiration)
- Email and password validation
- User profile management

### Phase 2: Journey Creation System
- Multi-journey support per platform
- Journey CRUD operations
- Journey marketplace with publish/draft status
- Category and section organization
- Featured journey marking
- Journey usage tracking

### Phase 3: Dynamic Journey Dashboard
- Journey enrollment (marketplace enrollment)
- Multi-journey user support
- User journey status tracking (active/paused/completed/cancelled)
- Progress visualization
- Readiness score calculation
- Motivational messaging based on progress
- Section navigation and organization
- Category-based section grouping

### Phase 4: Field Builder & Data Management
- 10+ field types (text, number, date, email, phone, URL, checkbox, radio, select, textarea, file, list)
- Dynamic form rendering
- Field-level validation
- List item management (add/edit/remove/reorder)
- Auto-save functionality
- Conditional field logic
- Field importance levels (critical/important/optional)
- Completed field tracking
- Scoring system with multiple scoring types

### Phase 5: Role-Based Access Control
- 5 user roles (User, Creator, Mentor, Coach, Admin)
- Permission inheritance system
- Role-based page access control
- API endpoint permission checks
- Role assignment and revocation

### Phase 6: Mentor Review System
- Mentor application and approval workflow
- Creator approval interface
- Mentor profile management with:
  - Display name, bio, expertise areas
  - Hourly rate
  - Availability status
  - Average rating and review count
  - Specializations
- Creator journey mentor assignment
- Compensation/rate setting per assignment
- Section review submission (by users on Guided tier)
- Mentor dashboard showing pending reviews
- Review interface with:
  - Field-level commenting
  - General feedback
  - Comment threading
  - Draft saving
- Review completion workflow (approve/request changes)
- Review history and notifications

### Phase 7: Analytics & Reporting
- Creator analytics dashboard (total journeys, users, trends)
- Mentor analytics dashboard (reviews, ratings, earnings, turnaround time)
- Admin analytics (platform-wide metrics)
- Chart visualizations (bar, line, rating stars)
- Data export (CSV/PDF)
- Web vitals tracking

### Phase 8: Advanced Features
- Mentor rating system (multi-dimensional)
- Transaction tracking for mentor payments
- Performance optimization with database views
- Indexing for query efficiency
- Accessibility features and settings

### Phase 9: Messaging & Notifications (COMPLETE)
- In-app notification center with:
  - 9 notification types
  - Read/unread status
  - Filtering and sorting
  - Pagination
  - Mark as read/delete actions
  - Link-based navigation
  
- Notification preferences:
  - Per-type toggle (reviews, messages, platform, milestones)
  - Browser notification support
  - Group similar notifications
  - Quiet hours (start/end time)
  
- Direct messaging system:
  - Thread-based conversations
  - Optional subject line
  - Optional review linking
  - Participant management
  - Message read receipts
  - Archive/unarchive threads
  - Soft delete for messages
  
- Auto-notifications via database triggers
- Notification templates for consistency
- Notification queue for batching
- Notification analytics tracking

---

## 2. CORE DATA ENTITIES (57 Database Tables)

### User & Authentication (3 tables)
- users (id, email, username, is_active, last_login, created_at, updated_at)
- sessions (id, user_id, expires_at, created_at)
- user_roles (user_id, role_id relationship)

### Journey Platform (6 tables)
- journeys (id, slug, name, description, icon, is_active)
- categories (id, name, description, icon)
- journey_categories (journey_id, category_id, display_order)
- sections (id, slug, name, description, scoring_type, weight)
- journey_sections (journey_id, section_id, category_id, display_order, is_required, weight_override)
- section_fields (section_id, field_name, field_type_id, field_config, is_required, etc.)

### User Journey Data (3 tables)
- user_journeys (user_id, journey_id, tier_id, status, started_at, completed_at)
- user_journey_progress (user_journey_id, section_id, score, is_completed)
- section_data (user_id, section_id, data JSON, completed_fields, total_fields)

### Creator & Marketplace (3 tables)
- journey_creators (journey_id, creator_user_id, is_published, is_featured, use_count)
- journey_templates (template_journey_id, cloned_journey_id, cloned_by_user_id)
- service_tiers (id, slug, name, price_monthly, price_annual, features_json)

### Mentor System (8 tables)
- mentors (user_id, display_name, bio, expertise_areas, hourly_rate, is_available, rating_average, review_count)
- mentor_journeys (mentor_id, journey_id)
- mentor_reviews (user_journey_id, section_id, mentor_id, status, feedback, submitted/assigned/completed_at)
- review_comments (review_id, user_id, is_mentor, comment, created_at)
- mentor_sessions (user_journey_id, mentor_id, status, scheduled_at, duration_minutes, meeting_link, notes)
- session_ratings (session_id, rating, feedback)
- mentor_transactions (if exists, payment tracking)
- mentor_specializations (if exists, expertise management)

### Messaging & Notifications (8 tables)
- message_threads (id, section_review_id, journey_id, participant1_user_id, participant2_user_id, subject, last_message_at, is_archived)
- messages (thread_id, sender_user_id, recipient_user_id, message_text, read, created_at, read_at, edited_at, deleted)
- in_app_notifications (user_id, type, title, message, link, read, created_at, read_at, metadata)
- notification_preferences (user_id, in_app_reviews, in_app_messages, browser_notifications, quiet_hours_enabled, quiet_hours_start/end)
- notification_queue (user_id, notification_type, payload, priority, status, scheduled_at)
- notification_templates (type, title_template, message_template, link_template, icon, priority)
- notification_analytics (notification_id, user_id, action, action_at)
- message_read_receipts (message_id, reader_user_id, read_at)

### Legacy End-of-Life Planning Sections (22+ tables)
- credentials
- personal_info
- family_members
- family_history
- pets
- key_contacts
- medical_info
- physicians
- employment
- primary_residence
- service_providers
- home_inventory
- other_real_estate
- vehicles
- personal_property
- insurance
- bank_accounts
- investments
- charitable_contributions
- legal_documents
- final_days
- obituary
- after_death
- funeral
- conclusion
- section_completion

### Wedding Journey Sections (9 tables)
- wedding_marriage_license
- wedding_prenup
- wedding_joint_finances
- wedding_name_change
- wedding_venue
- wedding_vendors
- wedding_guest_list
- wedding_registry_items
- wedding_home_setup

### Field Management (2 tables)
- field_types (type_name, display_name, validation_schema, default_config, icon)
- section_fields (field definitions with all properties)

### Pricing & Transactions (3 tables)
- service_tiers
- tier_features
- transactions (if exists)

---

## 3. USER ROLES & PERMISSIONS

### Role Hierarchy
1. **Regular User** - Base permissions, can enroll in journeys
2. **Creator** - Can create/edit journeys, manage mentor applications
3. **Mentor** - Can review sections, provide feedback
4. **Coach** - Can manage client accounts
5. **Admin** - Full platform access

### Key Permissions
- Can create journeys (Creator/Admin)
- Can publish journeys (Creator/Admin)
- Can review sections (Mentor)
- Can manage mentors (Creator/Admin)
- Can view analytics (Creator/Admin/Mentor)
- Can manage users (Admin)
- Can approve mentor applications (Creator/Admin)

---

## 4. PAGE ROUTES & UI SCREENS

### Public Pages (No Auth Required)
- `/login` - Login page
- `/register` - Registration page
- `/marketplace` - Journey marketplace with search/filter
- `/mentors` - Mentor discovery page
- `/offline` - Offline page

### Authenticated Pages (All Users)
- `/` - Dashboard (home page)
- `/journeys` - All journeys list
- `/journeys/[slug]` - Journey detail page
- `/journeys/[slug]/dashboard` - Journey working dashboard
- `/journeys/my` - My enrolled journeys
- `/messages` - Message inbox with threads
- `/messages/[threadId]` - Conversation view
- `/notifications` - Notification center
- `/my/progress` - Personal progress tracking
- `/settings/accessibility` - Accessibility settings

### Mentor Routes
- `/mentor/dashboard` - Mentor home (assigned journeys, pending reviews)
- `/mentor/reviews/[reviewId]` - Review interface with commenting
- `/mentor/analytics` - Mentor performance metrics
- `/mentor/apply` - Mentor application form
- `/mentor/apply/success` - Application confirmation
- `/mentor/availability` - Set availability
- `/mentor/specializations` - Manage expertise areas
- `/mentor/templates` - Journey templates
- `/mentor/training` - Mentor training materials

### Creator Routes
- `/creator/dashboard` - Creator home (journeys, users, metrics)
- `/creator/analytics` - Creator analytics dashboard
- `/creator/mentors` - Manage mentor assignments
- `/creator/revenue` - Revenue and payment tracking

### Admin Routes
- `/admin/journeys` - Journey management
- `/admin/journeys/[id]/edit` - Journey builder
- `/admin/analytics` - Platform analytics
- `/admin/performance` - Performance metrics
- `/admin/subscriptions` - Subscription management
- `/admin/transactions` - Transaction history

### Coach Routes
- `/coach/dashboard` - Coach client management

---

## 5. KEY FEATURES BY USER TYPE

### Regular User Features
- Register/login
- Browse marketplace journeys
- Enroll in journeys
- Fill in journey sections
- Submit sections for review
- View readiness score
- Track progress
- Receive and read notifications
- Message mentors
- View mentor reviews and feedback
- Export journey data to PDF

### Creator Features
- All user features
- Create new journeys
- Edit journey structure (sections, fields)
- Publish journeys
- Feature journeys in marketplace
- View journey analytics (enrollments, users)
- Manage mentor applications
- Approve/reject mentors
- Assign mentors to journeys
- Set mentor compensation
- View creator-specific analytics

### Mentor Features
- All user features
- Apply to become mentor
- Manage mentor profile
- View assigned journeys
- See pending reviews for journeys
- Claim section reviews
- Review section submissions with detailed comments
- Provide field-level feedback
- Complete reviews (approve/request changes)
- See review analytics (completed, ratings, earnings)
- View specializations
- Set availability
- Message users about reviews

### Admin Features
- All Creator features
- Manage all journeys (create, edit, publish, delete)
- Manage all users (view, edit, roles)
- View platform-wide analytics
- View transaction history
- Manage system settings
- Seed/manage test data

---

## 6. NOTIFICATIONS & MESSAGING FLOWS

### Auto-Generated Notifications
1. **on_new_message** - When recipient receives message
2. **on_review_claimed** - When mentor claims a review
3. **on_review_completed** - When review is finished
4. **on_changes_requested** - When mentor requests changes
5. **on_mentor_approved** - When application approved
6. **on_mentor_rejected** - When application rejected
7. **on_journey_enrolled** - When user enrolls
8. **on_milestone_achieved** - When milestone reached

### Message Threading
- Two-way messaging between users
- Optional connection to section review
- Optional connection to journey
- Message archival
- Read receipts
- Soft delete support

---

## 7. SCORING & PROGRESS SYSTEM

### Scoring Components
- **Field Count** - Score based on completed fields
- **List Items** - Score based on list item counts
- **Custom** - Section-specific scoring logic
- **Readiness Score** - Overall weighted score (0-100)

### Progress Tracking
- Per-section completion percentage
- Per-user-journey completion percentage
- Visual progress bar
- Motivational messages at milestone percentages
- Weighted scoring by section importance

---

## 8. TESTING INFRASTRUCTURE

### Unit Tests (Vitest)
- auth.spec.ts - Authentication utilities
- pdfExport.spec.ts - PDF export functionality
- readinessScore.spec.ts - Scoring calculations
- scoringRules.spec.ts - Section-specific scoring
- journeyProgress.ts - Progress tracking

### E2E Tests (Playwright)
- Page navigation
- Form submissions
- Workflow testing
- Accessibility testing

### Test Configuration
- Playwright with Chrome/Firefox/WebKit
- Vitest browser mode
- Test database isolation
- Mock data fixtures

---

## 9. DEPLOYMENT

### Tech Stack
- **Frontend**: SvelteKit 5 + Svelte 5
- **Styling**: Tailwind CSS 4 + DaisyUI 5
- **Backend**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Build**: Vite 7
- **Package Manager**: NPM

### Scripts
- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run preview` - Local preview of build
- `npm run test:unit` - Run Vitest
- `npm run test:e2e` - Run Playwright tests
- `npm run lint` - Lint code
- `npm run deploy` - Deploy to Cloudflare Pages

### Databases
- 57 SQLite tables
- 17 migration files (0001_initial_schema.sql through 0017_messaging_notifications.sql)
- Views for complex queries
- Triggers for auto-notifications

---

## 10. ARCHITECTURE PATTERNS

### Backend Pattern
- Cloudflare Workers (serverless)
- D1 Database (SQLite)
- Raw SQL queries with parameter binding
- Database views for efficiency
- Database triggers for auto-notifications

### Frontend Pattern
- Svelte 5 components
- SvelteKit routing and layout
- Reactive declarations ($derived, $effect)
- Form enhancement (use:enhance)
- CSS-in-JS with Tailwind

### Data Flow
- Server Load Functions (+page.server.ts) fetch data
- Components receive via PageData
- Form actions modify data
- Revalidation updates UI

---

## KEY TECHNICAL NOTES

1. **Security**: Uses PBKDF2 password hashing, parameterized SQL queries, session-based auth
2. **Database**: No ORM, raw SQL with parameter binding
3. **Notifications**: Database triggers create auto-notifications on message inserts
4. **Exports**: PDF export uses jsPDF library
5. **Performance**: Database views and indexes for complex queries
6. **Accessibility**: Has dedicated accessibility settings page
7. **Features**: Full CRUD for journeys, sections, fields, and data
8. **Multi-Journey**: Users can enroll in multiple journeys simultaneously

