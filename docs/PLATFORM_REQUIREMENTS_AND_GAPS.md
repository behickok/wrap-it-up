# Platform Requirements and Gap Analysis

This document outlines the complete functionality for all user roles in the Wrap It Up platform and identifies gaps between the current implementation and target state.

---

## Table of Contents

1. [Role Definitions & Capabilities](#role-definitions--capabilities)
2. [Revenue & Pricing System](#revenue--pricing-system)
3. [Current Implementation Status](#current-implementation-status)
4. [Gap Analysis](#gap-analysis)
5. [Implementation Roadmap](#implementation-roadmap)

---

## Role Definitions & Capabilities

### 1. Creator

**Primary Purpose:** Create journeys, manage pricing, assign service providers, and monitor journey performance.

**Key Capabilities:**

- **Journey Management**
  - ✅ Create and edit journeys (name, slug, description, icon)
  - ✅ Assign categories to journeys
  - ✅ Create and manage sections
  - ✅ Define fields with 15 field types
  - ✅ Publish/unpublish journeys
  - ✅ Preview journey as users will see it
  - ❌ Set journey pricing (base price per tier)
  - ❌ Configure platform fee visibility
  - ❌ Clone journeys from templates

- **Service Provider Management**
  - ❌ Assign mentors to journeys
  - ❌ Assign concierges to journeys
  - ❌ Set mentor/concierge commission rates
  - ❌ Approve/reject mentor applications
  - ❌ Remove service providers

- **Analytics Dashboard**
  - ❌ Journey views (total, unique, by time period)
  - ❌ Journey signups (new users per journey)
  - ❌ Revenue metrics:
    - MTD (Month-to-Date) revenue
    - Projected revenue (based on recurring subscriptions)
    - Historical revenue (by month, quarter, year)
    - Revenue by tier (Essentials, Guided, Premium)
    - Revenue after platform fee (15%)
  - ❌ Completion metrics:
    - Average completion percentage
    - Section completion rates
    - Drop-off points
  - ❌ User engagement:
    - Active users
    - Session duration
    - Return rate

- **Financial Management**
  - ❌ View payout history
  - ❌ Set up payment methods (Stripe Connect)
  - ❌ Download tax documents
  - ❌ View commission splits with mentors/concierges

---

### 2. Mentor

**Primary Purpose:** Review client submissions and provide feedback to help them improve their journey completion.

**Key Capabilities:**

- **Journey Affiliation**
  - ✅ Database structure exists (`mentor_journeys`)
  - ❌ View list of affiliated journeys
  - ❌ Apply to become mentor for journeys
  - ❌ View journey requirements and guidelines

- **Review Workflow**
  - ✅ Database structure exists (`mentor_reviews`, `review_comments`)
  - ❌ View pending review requests
  - ❌ Accept/decline review requests
  - ❌ Review submitted sections
  - ❌ Provide inline feedback on fields
  - ❌ Add general comments
  - ❌ Mark review as complete
  - ❌ Request additional information

- **Client Communication**
  - ❌ Send messages to clients
  - ❌ Receive messages from clients
  - ❌ View message history
  - ❌ Notification system for new messages

- **Revenue Dashboard**
  - ❌ MTD revenue from reviews
  - ❌ Projected revenue (pending reviews × rate)
  - ❌ Historical revenue
  - ❌ Reviews completed count
  - ❌ Average review time
  - ❌ Revenue by journey

- **Affiliate System**
  - ❌ Generate unique affiliate link
  - ❌ Set affiliate commission rate (configured by creator)
  - ❌ Track affiliate signups
  - ❌ View affiliate revenue
  - ❌ Share affiliate link on social media

---

### 3. Concierge (Enhanced Coach Role)

**Primary Purpose:** Provide white-glove service by scheduling sessions and helping clients complete forms in real-time.

**Key Capabilities:**

- **Journey Affiliation**
  - ✅ Database structure exists (`coach_clients`, `coaches`)
  - ❌ View list of affiliated journeys
  - ❌ Apply to become concierge for journeys
  - ❌ View concierge requirements

- **Session Management**
  - ✅ Database structure exists (`mentor_sessions`, `session_ratings`)
  - ❌ View client session requests
  - ❌ Calendar integration (view available slots)
  - ❌ Schedule sessions with clients
  - ❌ Send calendar invites
  - ❌ Add pre-session preparation notes
  - ❌ Join video sessions (Zoom/Meet integration)
  - ❌ Add post-session notes
  - ❌ Mark sessions as completed

- **Form Assistance**
  - ✅ Permission system exists (`coach.edit_client_data`)
  - ❌ Fill out forms on behalf of client during session
  - ❌ Real-time collaboration mode
  - ❌ Save draft changes
  - ❌ Submit forms for client review

- **Client Communication**
  - ❌ Send messages to clients
  - ❌ Receive messages from clients
  - ❌ Schedule follow-up sessions via messaging
  - ❌ Share resources and links

- **Revenue Dashboard**
  - ❌ MTD revenue from sessions
  - ❌ Projected revenue (scheduled sessions × rate)
  - ❌ Historical revenue
  - ❌ Sessions completed count
  - ❌ Average session duration
  - ❌ Client satisfaction rating
  - ❌ Revenue by journey

- **Affiliate System**
  - ❌ Generate unique affiliate link
  - ❌ Set affiliate commission rate (configured by creator)
  - ❌ Track affiliate signups
  - ❌ View affiliate revenue
  - ❌ Share affiliate link

---

### 4. Client (Participant)

**Primary Purpose:** Complete journeys by filling out forms, getting expert feedback, and tracking progress.

**Key Capabilities:**

- **Journey Marketplace**
  - ❌ Browse available journeys
  - ❌ Filter by category (Care, Wedding, Baby, Health, etc.)
  - ❌ View journey details (sections, estimated time)
  - ❌ See creator information
  - ❌ Read journey reviews
  - ❌ Compare service tiers (Essentials, Guided, Premium)
  - ❌ Start journey (subscribe to tier)

- **Journey Completion**
  - ✅ View journey dashboard
  - ✅ See progress per section
  - ✅ Fill out dynamic forms
  - ✅ Auto-save functionality
  - ✅ Score tracking
  - ❌ Export journey data to PDF
  - ❌ Share sections with family/friends

- **Mentor Review (Guided & Premium Tiers)**
  - ❌ Choose mentor from list
  - ❌ Submit section for review
  - ❌ View review status (pending, in review, completed)
  - ❌ Read mentor feedback
  - ❌ Reply to mentor comments
  - ❌ Mark feedback as addressed
  - ❌ Rate mentor after review

- **Concierge Sessions (Premium Tier)**
  - ❌ Browse available concierges
  - ❌ View concierge profiles (bio, ratings, availability)
  - ❌ Schedule session with concierge
  - ❌ Reschedule/cancel sessions
  - ❌ Join video session
  - ❌ Review concierge notes after session
  - ❌ Rate concierge after session

- **Communication**
  - ❌ Send messages to assigned mentor
  - ❌ Send messages to assigned concierge
  - ❌ Receive notifications for new messages
  - ❌ View message history

- **Account Management**
  - ✅ User authentication (login/signup)
  - ❌ Manage subscription (upgrade/downgrade tier)
  - ❌ Update payment method
  - ❌ View billing history
  - ❌ Cancel subscription

---

### 5. Super Admin

**Primary Purpose:** Platform oversight, revenue monitoring, content moderation, and system management.

**Key Capabilities:**

- **Platform Revenue Dashboard**
  - ❌ Total platform revenue (15% fee from all transactions)
  - ❌ MTD platform revenue
  - ❌ Projected platform revenue
  - ❌ Historical platform revenue
  - ❌ Revenue breakdown by:
    - Journey
    - Creator
    - Service tier
    - Transaction type (subscription, review, session)
  - ❌ Creator payouts pending
  - ❌ Mentor/concierge payouts pending

- **User Management**
  - ✅ View all users
  - ✅ Role management (grant/revoke roles)
  - ❌ User activity logs
  - ❌ Ban/suspend users
  - ❌ Impersonate users (for support)

- **Journey Management**
  - ✅ View all journeys (published and unpublished)
  - ✅ Edit any journey
  - ✅ Delete any journey
  - ❌ Feature journeys on marketplace
  - ❌ Approve journey publications
  - ❌ View journey analytics (all journeys)

- **Content Moderation**
  - ❌ Review flagged content
  - ❌ Read all messages (moderation)
  - ❌ Remove inappropriate content
  - ❌ Warn/ban users for violations

- **Financial Management**
  - ❌ Process creator payouts
  - ❌ Process mentor/concierge payouts
  - ❌ Handle refund requests
  - ❌ View transaction logs
  - ❌ Generate financial reports

- **System Settings**
  - ❌ Configure platform fee percentage
  - ❌ Set default service tier prices
  - ❌ Manage payment processors
  - ❌ Configure email templates
  - ❌ System health monitoring

---

## Revenue & Pricing System

### Pricing Structure

**Base Model:**
- Creators set prices for each service tier (Essentials, Guided, Premium)
- **15% platform fee** is automatically deducted from all payments
- Creators receive 85% of the price they set
- Platform retains 15%

**Example:**
```
Creator sets Premium tier at $100/month
- Client pays: $100/month
- Platform keeps: $15/month (15%)
- Creator receives: $85/month (85%)
```

### Price Configuration Interface (Creator)

When creator sets prices, they should see:
```
Premium Tier Monthly Price
[$ 100.00]

Breakdown:
- You receive: $85.00 (85%)
- Platform fee: $15.00 (15%)
- Client pays: $100.00
```

### Revenue Components

**For Creators:**
1. **Subscription Revenue** (recurring)
   - Essentials tier subscriptions
   - Guided tier subscriptions
   - Premium tier subscriptions
2. **Commission from Mentors** (if creator sets commission split)
3. **Commission from Concierges** (if creator sets commission split)

**For Mentors:**
1. **Review Revenue** (per review)
   - Rate set by creator or mentor
   - Deducted from Guided tier subscription
2. **Affiliate Revenue** (recurring)
   - Commission on signups via affiliate link
   - Rate set by creator

**For Concierges:**
1. **Session Revenue** (per session)
   - Rate set by creator or concierge
   - Deducted from Premium tier subscription
2. **Affiliate Revenue** (recurring)
   - Commission on signups via affiliate link
   - Rate set by creator

**For Platform (Super Admin):**
1. **Subscription Fees** (15% of all subscription revenue)
2. **Review Fees** (15% of all review payments)
3. **Session Fees** (15% of all session payments)

### Required Database Tables

**Pricing Configuration:**
```sql
CREATE TABLE journey_pricing (
    id INTEGER PRIMARY KEY,
    journey_id INTEGER NOT NULL,
    tier_id INTEGER NOT NULL,
    base_price_monthly REAL NOT NULL,
    base_price_annual REAL NOT NULL,
    platform_fee_percentage REAL DEFAULT 15,
    creator_revenue_monthly REAL GENERATED ALWAYS AS (
        base_price_monthly * (100 - platform_fee_percentage) / 100
    ),
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (journey_id) REFERENCES journeys(id),
    FOREIGN KEY (tier_id) REFERENCES service_tiers(id)
);

CREATE TABLE mentor_rates (
    id INTEGER PRIMARY KEY,
    mentor_id INTEGER NOT NULL,
    journey_id INTEGER NOT NULL,
    review_rate REAL NOT NULL, -- per review
    currency TEXT DEFAULT 'USD',
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (mentor_id) REFERENCES mentors(id),
    FOREIGN KEY (journey_id) REFERENCES journeys(id)
);

CREATE TABLE concierge_rates (
    id INTEGER PRIMARY KEY,
    coach_id INTEGER NOT NULL,
    journey_id INTEGER NOT NULL,
    hourly_rate REAL NOT NULL,
    session_rate REAL NOT NULL, -- per session (if different from hourly)
    currency TEXT DEFAULT 'USD',
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (coach_id) REFERENCES coaches(id),
    FOREIGN KEY (journey_id) REFERENCES journeys(id)
);

CREATE TABLE affiliate_links (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL, -- mentor or concierge
    journey_id INTEGER NOT NULL,
    affiliate_code TEXT UNIQUE NOT NULL,
    commission_percentage REAL NOT NULL, -- set by creator
    click_count INTEGER DEFAULT 0,
    signup_count INTEGER DEFAULT 0,
    total_revenue REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (journey_id) REFERENCES journeys(id)
);

CREATE TABLE transactions (
    id INTEGER PRIMARY KEY,
    user_journey_id INTEGER NOT NULL,
    transaction_type TEXT NOT NULL, -- 'subscription', 'review', 'session', 'affiliate'
    amount REAL NOT NULL,
    platform_fee REAL NOT NULL,
    creator_amount REAL NOT NULL,
    mentor_amount REAL, -- if review
    concierge_amount REAL, -- if session
    affiliate_amount REAL, -- if affiliate referral
    stripe_payment_id TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_journey_id) REFERENCES user_journeys(id)
);

CREATE TABLE payouts (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    payout_type TEXT NOT NULL, -- 'creator', 'mentor', 'concierge', 'affiliate'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    stripe_payout_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## Current Implementation Status

### ✅ Fully Implemented

1. **RBAC System**
   - Roles: participant, creator, mentor, coach, admin
   - Granular permissions
   - Role-permission mappings
   - Permission checking utilities

2. **Journey Builder (Phase 2 - Just Completed!)**
   - Journey CRUD operations
   - Category management
   - Section editor
   - Field editor with drag-and-drop
   - 15 field types supported
   - Preview mode
   - Publishing workflow

3. **Database Schema**
   - Journey platform tables
   - Field builder tables
   - Mentor tables (`mentors`, `mentor_journeys`, `mentor_reviews`, `review_comments`)
   - Session tables (`mentor_sessions`, `session_ratings`)
   - Coach tables (`coaches`, `coach_clients`, `coach_access_log`)
   - Analytics tables (`journey_analytics`, `section_analytics`, `analytics_events`)
   - Section sharing table

4. **Dynamic Form System**
   - DynamicForm component (single-record sections)
   - DynamicListSection component (repeatable sections)
   - DynamicFormField (15 field types)
   - Generic scoring system
   - Auto-save functionality

5. **User Authentication**
   - Login/signup
   - Session management
   - Password hashing

### 🟡 Partially Implemented

1. **Journey Dashboard** (Client side)
   - ✅ View sections and progress
   - ✅ Fill out forms
   - ✅ Score tracking
   - ❌ Export to PDF
   - ❌ Share sections

2. **Mentor System**
   - ✅ Database tables exist
   - ❌ No UI for review workflow
   - ❌ No mentor dashboard
   - ❌ No feedback interface

3. **Coach/Concierge System**
   - ✅ Database tables exist
   - ✅ Permission system exists
   - ❌ No session scheduling UI
   - ❌ No calendar integration
   - ❌ No video integration

4. **Analytics**
   - ✅ Database tables exist
   - ❌ No data collection (event tracking)
   - ❌ No dashboard views
   - ❌ No revenue calculations

### ❌ Not Implemented

1. **Journey Marketplace**
   - Browse journeys
   - Filter/search
   - Journey details page
   - Subscription checkout

2. **Pricing & Revenue System**
   - Journey pricing configuration
   - Platform fee calculation
   - Transaction tracking
   - Payout management
   - Payment processing (Stripe)

3. **Messaging System**
   - User-to-user messaging
   - Notifications
   - Message threads

4. **Affiliate System**
   - Affiliate link generation
   - Click tracking
   - Conversion tracking
   - Commission calculations

5. **Revenue Dashboards**
   - Creator analytics
   - Mentor revenue dashboard
   - Concierge revenue dashboard
   - Super admin financial dashboard

6. **Calendar & Scheduling**
   - Concierge availability management
   - Session booking interface
   - Calendar integration

7. **Video Integration**
   - Zoom/Meet integration for sessions
   - Join session interface

8. **Export & Sharing**
   - PDF export
   - Section sharing with family

9. **Subscription Management**
   - Tier upgrade/downgrade
   - Billing management
   - Subscription cancellation

---

## Gap Analysis

### Critical Gaps (Must Have for MVP)

| Feature | Current Status | Effort | Priority | Dependencies |
|---------|---------------|--------|----------|--------------|
| Journey Pricing System | ❌ Not started | Large | **P0** | Database migration, Stripe setup |
| Pricing UI (Creator) | ❌ Not started | Medium | **P0** | Journey pricing system |
| Journey Marketplace | ❌ Not started | Large | **P0** | Journey pricing system |
| Subscription Checkout | ❌ Not started | Large | **P0** | Stripe integration, journey pricing |
| Mentor Review UI | ❌ Not started | Large | **P0** | Messaging foundation |
| Concierge Scheduling | ❌ Not started | Large | **P0** | Calendar system |
| Messaging System | ❌ Not started | Large | **P0** | WebSocket or polling |
| Transaction Tracking | ❌ Not started | Medium | **P0** | Stripe webhooks |

### High Priority Gaps (Should Have)

| Feature | Current Status | Effort | Priority | Dependencies |
|---------|---------------|--------|----------|--------------|
| Creator Analytics Dashboard | ❌ Not started | Medium | **P1** | Transaction tracking, analytics events |
| Mentor Revenue Dashboard | ❌ Not started | Medium | **P1** | Transaction tracking |
| Concierge Revenue Dashboard | ❌ Not started | Medium | **P1** | Transaction tracking |
| Affiliate System | ❌ Not started | Medium | **P1** | Transaction tracking |
| Super Admin Dashboard | ❌ Not started | Large | **P1** | Transaction tracking, analytics |
| Payout Management | ❌ Not started | Large | **P1** | Stripe Connect, transaction tracking |
| Calendar Integration | ❌ Not started | Medium | **P1** | Third-party API (Google/Outlook) |
| Video Session Integration | ❌ Not started | Small | **P1** | Third-party API (Zoom/Meet) |

### Nice to Have (Could Have)

| Feature | Current Status | Effort | Priority | Dependencies |
|---------|---------------|--------|----------|--------------|
| PDF Export | ❌ Not started | Medium | **P2** | PDF generation library |
| Section Sharing | 🟡 Database exists | Small | **P2** | Share UI |
| Real-time Collaboration | ❌ Not started | Large | **P2** | WebSocket, operational transforms |
| Advanced Analytics | 🟡 Tables exist | Medium | **P2** | Data collection, charting library |
| Journey Templates/Cloning | 🟡 Tables exist | Small | **P2** | Clone logic |
| Mobile App | ❌ Not started | X-Large | **P3** | Separate project |

---

## Implementation Roadmap

### Phase 3: Pricing & Marketplace (8-10 weeks)

**Goal:** Enable journey monetization and allow clients to discover/subscribe to journeys.

**Week 1-2: Pricing System Foundation**
- [ ] Create pricing database tables
  - `journey_pricing`
  - `mentor_rates`
  - `concierge_rates`
  - `transactions`
  - `payouts`
- [ ] Migrate schema to production
- [ ] Create TypeScript types for pricing
- [ ] Build pricing utilities (calculate platform fee, creator revenue, etc.)

**Week 3-4: Stripe Integration**
- [ ] Set up Stripe account and API keys
- [ ] Implement Stripe Connect for creator payouts
- [ ] Create subscription checkout flow
- [ ] Set up webhook handlers for payment events
- [ ] Test payment processing in sandbox

**Week 5-6: Creator Pricing UI**
- [ ] Add pricing tab to journey editor
- [ ] Build pricing configuration form
  - Set prices per tier
  - Show platform fee calculation
  - Preview client-facing price
- [ ] Save pricing configuration
- [ ] Validate pricing rules (minimums, etc.)

**Week 7-8: Journey Marketplace**
- [ ] Create marketplace landing page (`/marketplace`)
- [ ] Build journey card component (image, title, description, price)
- [ ] Implement filters (category, price range, rating)
- [ ] Create journey detail page
  - Show sections overview
  - Display creator info
  - Show pricing tiers
  - CTA: "Start Journey" button
- [ ] Implement search functionality

**Week 9-10: Subscription Flow**
- [ ] Build tier selection UI
- [ ] Implement Stripe Checkout redirect
- [ ] Create success/cancel pages
- [ ] Provision user journey on successful payment
- [ ] Send confirmation emails
- [ ] Test end-to-end subscription flow

**Deliverables:**
- Functioning marketplace where clients can browse and subscribe
- Creator can set journey prices
- Payment processing through Stripe
- User journeys provisioned automatically

---

### Phase 4: Mentor Review System (6-8 weeks)

**Goal:** Enable mentor review workflow for Guided tier users.

**Week 1-2: Mentor Application & Assignment**
- [ ] Create mentor application form
- [ ] Build creator dashboard for reviewing mentor applications
- [ ] Implement mentor-journey assignment
- [ ] Set mentor rates per journey
- [ ] Create mentor profile page (bio, expertise, rating)

**Week 3-4: Review Submission Flow (Client)**
- [ ] Add "Request Review" button to completed sections
- [ ] Build mentor selection UI (if multiple mentors available)
- [ ] Create review request confirmation
- [ ] Show review status in journey dashboard
- [ ] Notification when review is assigned/completed

**Week 5-6: Review Workflow (Mentor)**
- [ ] Create mentor dashboard (`/mentor/dashboard`)
- [ ] Show pending review requests
- [ ] Build review interface
  - Display client's submitted data
  - Inline field-level comments
  - General feedback textarea
  - "Request More Info" / "Complete Review" actions
- [ ] Save draft feedback
- [ ] Submit completed review

**Week 7-8: Review Feedback & Communication**
- [ ] Show mentor feedback to client
- [ ] Build comment threading system
- [ ] Implement "Mark as Addressed" for client
- [ ] Add review rating system
- [ ] Update mentor rating based on reviews

**Deliverables:**
- Mentors can accept and complete reviews
- Clients can submit sections for review
- Threaded communication on feedback
- Rating system for mentors

---

### Phase 5: Concierge Sessions (6-8 weeks)

**Goal:** Enable Premium tier users to schedule and attend sessions with concierges.

**Week 1-2: Concierge Application & Setup**
- [ ] Create concierge application form
- [ ] Build creator dashboard for reviewing applications
- [ ] Implement concierge-journey assignment
- [ ] Set concierge rates per journey
- [ ] Create concierge profile page

**Week 3-4: Availability & Calendar**
- [ ] Build availability management UI for concierges
- [ ] Integrate with Google Calendar API (or similar)
- [ ] Implement time zone handling
- [ ] Create calendar view component
- [ ] Block out unavailable times

**Week 5-6: Session Booking (Client)**
- [ ] Create concierge selection UI
- [ ] Build session scheduling interface
  - View concierge availability
  - Select date/time
  - Choose duration
  - Add session notes/goals
- [ ] Send confirmation emails
- [ ] Allow reschedule/cancel (with policy)

**Week 7-8: Session Management**
- [ ] Integrate with Zoom API (or similar)
- [ ] Generate meeting links automatically
- [ ] Build "Join Session" interface
- [ ] Implement co-editing during session (concierge fills forms)
- [ ] Add post-session notes
- [ ] Session rating system

**Deliverables:**
- Concierges can manage availability
- Clients can book sessions
- Video integration for sessions
- Co-editing capability during sessions

---

### Phase 6: Messaging & Notifications (4-6 weeks)

**Goal:** Enable communication between clients, mentors, and concierges.

**Week 1-2: Messaging Database & API**
- [ ] Create messaging database tables
  - `conversations`
  - `messages`
  - `message_participants`
  - `message_read_status`
- [ ] Build messaging API endpoints
  - Create conversation
  - Send message
  - Get messages
  - Mark as read
- [ ] Implement real-time updates (WebSocket or Server-Sent Events)

**Week 3-4: Messaging UI**
- [ ] Create inbox page (`/messages`)
- [ ] Build conversation list component
- [ ] Create message thread component
- [ ] Implement message composer
- [ ] Add file attachment support
- [ ] Show typing indicators

**Week 5-6: Notifications**
- [ ] Create notifications database table
- [ ] Build notification system
  - New message
  - Review completed
  - Session scheduled
  - Payment received
- [ ] Create notification dropdown UI
- [ ] Implement email notifications
- [ ] Add push notifications (optional)

**Deliverables:**
- In-app messaging between users
- Notification system
- Email notifications for key events

---

### Phase 7: Revenue Dashboards (6-8 weeks)

**Goal:** Provide revenue analytics for creators, mentors, concierges, and super admin.

**Week 1-2: Analytics Event Collection**
- [ ] Implement event tracking throughout app
  - Journey started
  - Section viewed
  - Section completed
  - Review submitted
  - Session scheduled
  - Subscription change
- [ ] Create background job to aggregate analytics
- [ ] Populate `journey_analytics` and `section_analytics` tables

**Week 3-4: Creator Analytics Dashboard**
- [ ] Build creator dashboard page (`/creator/analytics`)
- [ ] Display journey performance metrics
  - Views, signups, completions
  - User engagement (active users, session duration)
  - Section-level insights
- [ ] Revenue metrics
  - MTD, projected, historical
  - Revenue by tier
  - Revenue after platform fee
- [ ] Charts and visualizations (Chart.js or similar)
- [ ] Export to CSV

**Week 5-6: Mentor & Concierge Dashboards**
- [ ] Build mentor dashboard (`/mentor/revenue`)
  - MTD revenue
  - Reviews completed
  - Average review time
  - Historical revenue
  - Affiliate earnings
- [ ] Build concierge dashboard (`/concierge/revenue`)
  - MTD revenue
  - Sessions completed
  - Average session duration
  - Client satisfaction
  - Affiliate earnings
- [ ] Charts for trends

**Week 7-8: Super Admin Dashboard**
- [ ] Build admin dashboard (`/admin/revenue`)
  - Platform revenue (15% fees)
  - MTD, projected, historical
  - Revenue by journey
  - Revenue by creator
  - Pending payouts
- [ ] Transaction logs view
- [ ] Payout management interface
- [ ] Financial reports export

**Deliverables:**
- Comprehensive analytics for all roles
- Revenue tracking with platform fee calculations
- Visual charts and trends
- Export capabilities

---

### Phase 8: Affiliate System (3-4 weeks)

**Goal:** Enable mentors and concierges to generate affiliate revenue.

**Week 1-2: Affiliate Link Generation**
- [ ] Create `affiliate_links` table
- [ ] Build affiliate link generator
  - Unique code per user-journey pair
  - Short URL format
- [ ] Implement click tracking
- [ ] Track signup attribution

**Week 3-4: Affiliate Dashboard & Payouts**
- [ ] Add affiliate section to mentor/concierge dashboard
  - Unique affiliate link
  - Click count
  - Signup count
  - Total affiliate revenue
- [ ] Implement commission calculation
- [ ] Include affiliate revenue in payouts
- [ ] Social sharing buttons

**Deliverables:**
- Mentors/concierges can generate affiliate links
- Attribution tracking
- Commission calculations
- Social sharing

---

### Phase 9: Subscription Management (3-4 weeks)

**Goal:** Allow clients to manage their subscriptions.

**Week 1-2: Subscription Management UI**
- [ ] Create account settings page (`/account/billing`)
- [ ] Display current subscription details
- [ ] Build tier upgrade/downgrade flow
- [ ] Implement subscription cancellation
- [ ] Show billing history
- [ ] Update payment method

**Week 3-4: Stripe Portal & Webhooks**
- [ ] Integrate Stripe Customer Portal
- [ ] Handle subscription change webhooks
- [ ] Pro-rate charges for upgrades
- [ ] Handle failed payments
- [ ] Send billing receipts via email

**Deliverables:**
- Clients can manage subscriptions
- Billing history view
- Seamless tier changes

---

### Phase 10: Polish & Additional Features (4-6 weeks)

**Week 1-2: PDF Export**
- [ ] Install PDF generation library (jsPDF or Puppeteer)
- [ ] Create PDF templates for journey data
- [ ] Implement export functionality
- [ ] Add logo and branding
- [ ] Test PDF output quality

**Week 3-4: Section Sharing**
- [ ] Build section sharing UI
- [ ] Generate shareable links
- [ ] Implement access control for shared sections
- [ ] Add expiration dates
- [ ] Email sharing invitations

**Week 5-6: Content Moderation (Admin)**
- [ ] Build moderation dashboard
- [ ] Flag inappropriate content system
- [ ] Review queue for flagged items
- [ ] User warning system
- [ ] Ban/suspend user flow

**Deliverables:**
- PDF export functionality
- Section sharing with access control
- Content moderation tools

---

## Technical Considerations

### Payment Processing

**Stripe Integration:**
- Use Stripe Checkout for subscriptions
- Stripe Connect for creator/mentor/concierge payouts
- Webhooks for payment events (`customer.subscription.created`, `invoice.paid`, etc.)
- Handle failed payments and retry logic
- Comply with PCI-DSS (Stripe handles this)

**Platform Fee Calculation:**
```typescript
interface PriceBreakdown {
  clientPays: number;
  platformFee: number; // 15%
  creatorReceives: number; // 85%
  mentorReceives?: number; // if review
  conciergeReceives?: number; // if session
  affiliateCommission?: number; // if affiliate referral
}

function calculatePricing(
  basePrice: number,
  platformFeePercent: number = 15
): PriceBreakdown {
  const platformFee = basePrice * (platformFeePercent / 100);
  const creatorReceives = basePrice - platformFee;

  return {
    clientPays: basePrice,
    platformFee,
    creatorReceives
  };
}
```

### Real-Time Features

**Messaging:**
- Option 1: WebSocket (Socket.io) for real-time messaging
- Option 2: Server-Sent Events (SSE) for one-way updates
- Option 3: Long polling (fallback for older browsers)

**Recommendation:** Start with polling, upgrade to WebSocket if needed.

### Calendar Integration

**Options:**
- Google Calendar API (read/write availability)
- Microsoft Outlook API
- Calendly integration (easier but less control)

**Recommendation:** Start with Calendly integration for MVP, build custom later.

### Video Integration

**Options:**
- Zoom API (create meetings programmatically)
- Google Meet API
- Embedded video (Daily.co, Twilio Video)

**Recommendation:** Zoom API for simplicity, most users familiar with it.

### Analytics & Reporting

**Data Collection:**
- Track events in `analytics_events` table
- Use background jobs to aggregate daily
- Store aggregated data in `journey_analytics` and `section_analytics`

**Charting:**
- Chart.js (free, lightweight)
- Recharts (React-based)
- D3.js (advanced, steeper learning curve)

**Recommendation:** Chart.js for MVP.

---

## Database Migration Summary

### New Tables Required

1. **Pricing & Transactions:**
   - `journey_pricing` - Price configuration per journey/tier
   - `mentor_rates` - Review rates for mentors
   - `concierge_rates` - Session rates for concierges
   - `transactions` - All financial transactions
   - `payouts` - Payout history to creators/mentors/concierges

2. **Affiliate System:**
   - `affiliate_links` - Unique affiliate codes and tracking
   - `affiliate_conversions` - Track signups via affiliate links

3. **Messaging:**
   - `conversations` - Message threads
   - `messages` - Individual messages
   - `message_participants` - Users in conversation
   - `message_read_status` - Read receipts

4. **Notifications:**
   - `notifications` - User notifications
   - `notification_preferences` - User preferences for notifications

5. **Subscriptions:**
   - `user_subscriptions` - Link to Stripe subscriptions
   - `billing_history` - Payment receipts and invoices

### Indexes Required

Add indexes for performance on:
- `transactions.user_journey_id`
- `transactions.created_at`
- `transactions.transaction_type`
- `payouts.user_id`
- `payouts.status`
- `affiliate_links.affiliate_code`
- `affiliate_links.user_id`
- `messages.conversation_id`
- `messages.created_at`
- `notifications.user_id`
- `notifications.is_read`

---

## Estimated Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 3: Pricing & Marketplace | 10 weeks | 10 weeks |
| Phase 4: Mentor Review System | 8 weeks | 18 weeks |
| Phase 5: Concierge Sessions | 8 weeks | 26 weeks |
| Phase 6: Messaging & Notifications | 6 weeks | 32 weeks |
| Phase 7: Revenue Dashboards | 8 weeks | 40 weeks |
| Phase 8: Affiliate System | 4 weeks | 44 weeks |
| Phase 9: Subscription Management | 4 weeks | 48 weeks |
| Phase 10: Polish & Additional Features | 6 weeks | 54 weeks |

**Total: ~54 weeks (~13 months) for full implementation**

**MVP (Phases 3-4-6):** ~24 weeks (~6 months)

---

## Prioritization Rationale

**Why this order?**

1. **Pricing & Marketplace (Phase 3):** Foundation for monetization. Without this, no revenue.

2. **Mentor Review (Phase 4):** Core value proposition of Guided tier. Differentiates from Essentials.

3. **Messaging (Phase 6 moved up):** Required for mentor-client communication. Should come before or alongside reviews.

4. **Concierge Sessions (Phase 5):** Premium tier feature. Can launch with Essentials + Guided tiers first.

5. **Revenue Dashboards (Phase 7):** Once transactions are flowing, creators need visibility.

6. **Affiliate System (Phase 8):** Growth feature, can come after core product is working.

7. **Subscription Management (Phase 9):** Important but not needed at launch. Manual support can handle initially.

8. **Polish (Phase 10):** Nice-to-haves that improve UX but not critical for MVP.

---

## MVP Definition (6 months)

**Core Features:**
- ✅ Journey builder (complete!)
- [ ] Journey marketplace
- [ ] Subscription checkout (Stripe)
- [ ] Creator can set pricing
- [ ] Client can complete journeys
- [ ] Mentor review workflow
- [ ] Messaging between client and mentor
- [ ] Basic analytics for creators

**Out of Scope for MVP:**
- Concierge sessions
- Affiliate system
- Advanced analytics
- PDF export
- Real-time collaboration
- Mobile app

---

## Success Metrics

**For Creators:**
- Number of journey signups
- Monthly recurring revenue (MRR)
- User completion rate
- User satisfaction (NPS)

**For Mentors:**
- Reviews completed per month
- Average review rating
- Response time
- Revenue per hour

**For Concierges:**
- Sessions completed per month
- Average session rating
- Rebook rate
- Revenue per session

**For Platform (Super Admin):**
- Total platform revenue (15% fees)
- Number of active journeys
- Number of active creators
- Number of paying users
- Churn rate
- Customer acquisition cost (CAC)
- Lifetime value (LTV)

---

## Conclusion

This document provides a comprehensive roadmap from the current state (Phase 2 complete) to a fully-featured multi-role platform with monetization, reviews, sessions, messaging, and analytics.

**Next Steps:**
1. Review and approve this plan
2. Set up Stripe account and API keys
3. Begin Phase 3 (Pricing & Marketplace) database migrations
4. Establish development timeline and milestones

**Questions to Address:**
- What is the target platform fee percentage? (Currently 15%)
- Should creators be able to adjust platform fee? (No for MVP)
- What payment methods to support? (Credit card only for MVP)
- International currencies? (USD only for MVP, expand later)
- Refund policy? (30 days, pro-rated)
- Minimum payout threshold? ($100 minimum)
