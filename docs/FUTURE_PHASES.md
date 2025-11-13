# Future Development Phases - Wrap It Up Platform

## Overview
This document outlines planned phases beyond the completed Phase 4 (Mentor Review System). **Phases are ordered to minimize external dependencies** - integrations like Stripe and email services are pushed to later phases, allowing the platform to remain self-contained for as long as possible.

**Philosophy**: Build maximum value with existing stack (SvelteKit + Cloudflare D1 + Cloudflare native services) before adding external integrations.

---

## Phase 5: Analytics & Insights Dashboard

**Status**: Complete ✅
**Priority**: High
**Actual Effort**: 2 weeks
**Dependencies**: Phase 4 Complete
**External Integrations**: None ✅

### Objectives
Provide creators, mentors, and admins with actionable insights through comprehensive analytics dashboards using only D1 database queries and charting libraries.

### 5.1: Creator Analytics

**Metrics Tracked:**
- Journey enrollment trends
- User engagement per journey
- Section completion rates
- Review request frequency
- Session booking rates (when implemented)
- Revenue tracking (manual payments)
- User retention rates
- Churn analysis

**Dashboard Views:**
- Overview (key metrics cards)
- User engagement graphs
- Funnel analysis (view → enroll → complete)
- Mentor performance comparison
- Section-level completion heatmap

**Database Changes:**
```sql
CREATE TABLE analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL, -- page_view, enrollment, review_request, etc.
  user_id INTEGER,
  journey_id INTEGER,
  metadata TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_type_date ON analytics_events(event_type, created_at);
CREATE INDEX idx_analytics_user ON analytics_events(user_id);

-- Pre-computed daily stats for performance
CREATE TABLE daily_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL UNIQUE,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  enrollments INTEGER DEFAULT 0,
  reviews_requested INTEGER DEFAULT 0,
  reviews_completed INTEGER DEFAULT 0,
  sessions_booked INTEGER DEFAULT 0,
  revenue REAL DEFAULT 0,
  churn_count INTEGER DEFAULT 0
);
```

**Implementation:**
- Use D1 aggregation queries
- Chart.js or similar for visualizations
- CSV export functionality
- Date range filtering
- No external analytics services needed

### 5.2: Mentor Performance Dashboard

**Metrics Tracked:**
- Review completion time (average, median, p95)
- Review quality scores (from ratings)
- Client satisfaction ratings
- Response time to claims
- Revenue earned (manual tracking)
- Active clients
- Specialization effectiveness

**Dashboard Views:**
- Performance overview
- Earnings timeline
- Review statistics
- Client feedback summary
- Comparative metrics (vs other mentors)

### 5.3: Platform Admin Dashboard

**System Health Metrics:**
- Database size and growth
- Active users (DAU, WAU, MAU)
- Feature adoption rates
- Error tracking (console logs)

**Business Metrics:**
- Total platform revenue (manual)
- Mentor payout amounts
- Platform margin
- Growth rates

**Database Monitoring:**
```sql
CREATE TABLE system_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_metrics_name_time ON system_metrics(metric_name, recorded_at);
```

**Testing Requirements:**
- [ ] Event tracking implementation
- [ ] Chart rendering performance
- [ ] Real-time data updates
- [ ] Export functionality (CSV, PDF)
- [ ] Date range filtering
- [ ] Drill-down capabilities

**Estimated Deliverables:**
- 3 analytics dashboards
- 2 new database tables
- 12+ chart components
- Export functionality
- ~2,000 lines of code

---

## Phase 6: Advanced Mentor Features

**Status**: Complete ✅
**Priority**: High
**Actual Effort**: 1.5 weeks
**Dependencies**: Phase 4 Complete
**External Integrations**: None ✅

### Objectives
Enhance mentor experience and review quality without requiring external services.

### 6.1: Mentor Availability Management

**Features:**
- Weekly availability schedule
- Block out vacation/busy times
- Timezone support
- Auto-pause assignments during blocked periods
- Availability preview for clients

**Database Changes:**
```sql
CREATE TABLE mentor_availability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mentor_user_id INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0-6 (Sunday-Saturday)
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  FOREIGN KEY (mentor_user_id) REFERENCES users(id)
);

CREATE TABLE mentor_blocked_dates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mentor_user_id INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  FOREIGN KEY (mentor_user_id) REFERENCES users(id)
);
```

**UI Components:**
- Weekly calendar editor
- Block date picker
- Timezone selector
- Availability preview

**No External Services:**
- Use native JavaScript Date/Intl API
- Luxon for timezone handling (library only)
- No calendar sync (future phase)

### 6.2: Review Templates & Standards

**Features:**
- Reusable feedback templates
- Section-specific guidance
- Quality checklists
- Review best practices
- Mentor training materials (stored in D1)

**Database Changes:**
```sql
CREATE TABLE review_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mentor_user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  section_type TEXT, -- NULL for general templates
  is_shared BOOLEAN DEFAULT 0, -- Share with other mentors
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mentor_user_id) REFERENCES users(id)
);

CREATE TABLE mentor_training_modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  video_url TEXT, -- YouTube embeds, no hosting needed
  order_index INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT 0
);

CREATE TABLE mentor_training_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mentor_user_id INTEGER NOT NULL,
  module_id INTEGER NOT NULL,
  completed BOOLEAN DEFAULT 0,
  completed_at DATETIME,
  FOREIGN KEY (mentor_user_id) REFERENCES users(id),
  FOREIGN KEY (module_id) REFERENCES mentor_training_modules(id),
  UNIQUE(mentor_user_id, module_id)
);
```

**Implementation:**
- Rich text editor (Tiptap or similar - client-side)
- Video embeds (YouTube/Vimeo - no hosting)
- PDF generation for exports (jsPDF - client-side)

### 6.3: Mentor Specializations & Matching

**Features:**
- Tag mentors with specializations
- Auto-match reviews to specialized mentors
- Preferred mentor selection for clients
- Mentor discovery and profiles
- Rating system (already tracked in mentor_profiles)

**Database Changes:**
```sql
CREATE TABLE mentor_specializations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT
);

CREATE TABLE mentor_specialization_map (
  mentor_user_id INTEGER NOT NULL,
  specialization_id INTEGER NOT NULL,
  proficiency_level INTEGER DEFAULT 1, -- 1-5
  PRIMARY KEY (mentor_user_id, specialization_id),
  FOREIGN KEY (mentor_user_id) REFERENCES users(id),
  FOREIGN KEY (specialization_id) REFERENCES mentor_specializations(id)
);

CREATE TABLE client_mentor_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  preferred_mentor_id INTEGER,
  blocked_mentor_ids TEXT, -- JSON array
  preferred_specializations TEXT, -- JSON array
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (preferred_mentor_id) REFERENCES users(id)
);
```

**Matching Algorithm:**
1. Check client preferred mentor
2. Match specialization to section type
3. Consider mentor availability
4. Factor in mentor ratings
5. Load balance across mentors

**Testing Requirements:**
- [ ] Availability calendar CRUD
- [ ] Timezone conversions
- [ ] Blocked date validation
- [ ] Template creation and usage
- [ ] Training module completion
- [ ] Specialization matching
- [ ] Mentor profile display

**Estimated Deliverables:**
- 7 new database tables
- Availability calendar component
- Template editor
- Training module viewer
- Matching algorithm
- ~1,500 lines of code

---

## Phase 7: User Experience Enhancements

**Status**: Not Started  
**Priority**: Medium  
**Estimated Effort**: 2-3 weeks  
**Dependencies**: None (can run parallel)  
**External Integrations**: None ✅

### Objectives
Improve user experience with better visualizations, mobile support, and accessibility - all without external services.

### 7.1: Progress Visualization

**Features:**
- Progress charts and graphs
- Milestone celebrations
- Completion certificates (generated client-side)
- Journey timeline view
- Comparison to average user
- Streak tracking

**Visualizations:**
- Radial progress chart per category
- Timeline of completed sections
- Heatmap of activity
- Trend lines (daily/weekly progress)
- Journey comparison dashboard

**Implementation:**
- Chart.js or D3.js (client-side)
- Canvas API for certificate generation
- SVG animations for milestones
- No image hosting needed

### 7.2: Journey Templates & Customization

**Features:**
- Journey duplication for creators
- Journey templates library (stored in D1)
- Custom branding per journey (colors, fonts)
- Journey versioning
- Import/export journey definitions (JSON)

**Database Changes:**
```sql
CREATE TABLE journey_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  source_journey_id INTEGER NOT NULL,
  creator_user_id INTEGER NOT NULL,
  is_public BOOLEAN DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  rating REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_journey_id) REFERENCES journeys(id),
  FOREIGN KEY (creator_user_id) REFERENCES users(id)
);

CREATE TABLE journey_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journey_id INTEGER NOT NULL,
  version_number INTEGER NOT NULL,
  changes_summary TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  snapshot_data TEXT, -- JSON snapshot
  FOREIGN KEY (journey_id) REFERENCES journeys(id),
  UNIQUE(journey_id, version_number)
);

-- Journey branding
ALTER TABLE journeys ADD COLUMN theme_colors TEXT; -- JSON: {primary, secondary, accent}
ALTER TABLE journeys ADD COLUMN custom_font TEXT;
ALTER TABLE journeys ADD COLUMN logo_url TEXT; -- Cloudflare Images or R2
```

### 7.3: Mobile Optimization

**Features:**
- Progressive Web App (PWA)
- Mobile-first responsive design
- Touch-optimized interactions
- Offline support (Service Worker + IndexedDB)
- Push notifications (browser native)
- Home screen installation

**Technical Changes:**
- Service worker implementation
- Manifest.json configuration
- IndexedDB for offline data
- Background sync
- Media query optimizations
- Touch gesture support

**No External Services:**
- Use browser native PWA features
- IndexedDB for local storage
- Service Workers (Cloudflare Workers compatible)
- No Firebase/OneSignal needed

### 7.4: Accessibility Improvements

**Features:**
- WCAG 2.1 AA compliance
- Screen reader optimization
- Keyboard navigation
- High contrast mode
- Text size adjustments
- Focus indicators
- ARIA labels throughout

**Testing:**
- Lighthouse audits
- axe DevTools
- Screen reader testing (NVDA, VoiceOver)
- Keyboard-only navigation
- Color contrast validation

**Testing Requirements:**
- [ ] Journey duplication
- [ ] Template import/export
- [ ] Version control
- [ ] Progress charts rendering
- [ ] PWA installation
- [ ] Offline functionality
- [ ] Screen reader compatibility
- [ ] Keyboard navigation

**Estimated Deliverables:**
- 2 new database tables
- 8 new chart components
- PWA configuration
- Accessibility audit report
- Certificate generator
- ~1,500 lines of code

---

## Phase 8: Performance & Scale Optimization

**Status**: Not Started  
**Priority**: Medium (scale-dependent)  
**Estimated Effort**: 2-3 weeks  
**Dependencies**: Platform has significant user base  
**External Integrations**: None (Cloudflare native only) ✅

### Objectives
Optimize platform performance using Cloudflare native services without external dependencies.

### 8.1: Database Optimization

**Strategies:**
- Query optimization and profiling
- Additional indexes based on usage patterns
- Materialized views for expensive queries
- D1 query batching
- Read replicas (D1 feature)

**Monitoring:**
```sql
CREATE TABLE query_performance_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query_name TEXT NOT NULL,
  execution_time_ms REAL NOT NULL,
  row_count INTEGER,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_query_perf ON query_performance_log(query_name, recorded_at);
```

### 8.2: Caching Strategy (Cloudflare Native)

**Implementation:**
- **Cloudflare KV** for static data
  - Journey metadata
  - Section field definitions
  - Mentor profiles
  - Public templates

- **Cloudflare Cache API** for pages
  - Static pages
  - User dashboards (with user-specific keys)

- **Browser cache** optimization
  - Aggressive caching headers
  - Cache-Control strategies

**Cache Keys:**
```javascript
// KV cache
`journey:${slug}` // Journey metadata
`section:${id}:fields` // Section fields
`mentor:${id}:profile` // Public mentor profiles
`user:${id}:journeys` // User enrollments (short TTL)

// Cache API
`page:/journeys/${slug}` // Journey page
`api:/journeys/${slug}/data` // JSON data
```

**No External Services:**
- No Redis needed (use Cloudflare KV)
- No CDN needed (Cloudflare is the CDN)
- No separate cache server

### 8.3: Background Job Processing (Cloudflare Native)

**Job Types:**
- Daily stat calculations
- Report generation
- Data exports
- Notification preparation (for future email phase)
- Certificate generation

**Implementation:**
- **Cloudflare Cron Triggers** for scheduled jobs
- **Cloudflare Queues** for async processing
- **Durable Objects** for stateful jobs (if needed)

**Database Changes:**
```sql
CREATE TABLE background_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_type TEXT NOT NULL,
  payload TEXT, -- JSON
  status TEXT DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME,
  completed_at DATETIME,
  error_message TEXT
);

CREATE INDEX idx_jobs_status ON background_jobs(status, created_at);
```

**Cron Schedule:**
```toml
# wrangler.toml
[triggers]
crons = [
  "0 0 * * *",   # Daily stats at midnight
  "0 */6 * * *", # Cleanup every 6 hours
  "0 1 * * 0"    # Weekly reports on Sunday
]
```

### 8.4: Asset Optimization

**Strategies:**
- Image compression (client-side before upload)
- Cloudflare Images for resizing/optimization
- Lazy loading images
- Code splitting (Vite native)
- Tree shaking (Vite native)
- Critical CSS extraction

**Performance Targets:**
- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s
- Lighthouse Score > 90
- Bundle size < 200KB (gzipped)

**Storage:**
- User uploads → Cloudflare R2 (object storage)
- Transformed images → Cloudflare Images
- Static assets → Cloudflare Pages (automatic)

**Testing Requirements:**
- [ ] Load testing (1000+ concurrent users)
- [ ] Database query profiling
- [ ] Cache hit rate monitoring
- [ ] Background job reliability
- [ ] Asset load times
- [ ] Lighthouse audits
- [ ] Core Web Vitals

**Estimated Deliverables:**
- KV caching layer
- Background job system
- Performance monitoring
- Optimization report
- ~800 lines of code

---

## Phase 9: In-App Messaging & Notifications

**Status**: Not Started  
**Priority**: Medium-Low  
**Estimated Effort**: 2 weeks  
**Dependencies**: Phase 4 Complete  
**External Integrations**: None initially (email added in Phase 10) ✅

### Objectives
Implement in-app notification and messaging system without external email services initially.

### 9.1: In-App Notification Center

**Features:**
- Real-time notification feed
- Notification badges (unread count)
- Mark as read/unread
- Notification grouping by type
- Quick actions from notifications
- Browser notifications (native)

**Database Changes:**
```sql
CREATE TABLE in_app_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- review_completed, session_booked, etc.
  title TEXT NOT NULL,
  message TEXT,
  link TEXT, -- Where to go when clicked
  read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME,
  metadata TEXT, -- JSON
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_notifications_user_unread ON in_app_notifications(user_id, read);

-- User notification preferences
CREATE TABLE notification_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  in_app_reviews BOOLEAN DEFAULT 1,
  in_app_sessions BOOLEAN DEFAULT 1,
  in_app_platform BOOLEAN DEFAULT 1,
  browser_notifications BOOLEAN DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Notification Types:**
1. Review lifecycle:
   - Review claimed (to client)
   - Review completed (to client)
   - Changes requested (to client)

2. Mentor system:
   - Application approved/rejected
   - New journey assignment
   - New review available

3. Platform updates:
   - Journey enrollment confirmation
   - Milestone celebrations

**Implementation:**
- Server-Sent Events (SSE) for real-time updates
- Browser Notification API (no external service)
- Polling fallback
- Toast notifications (client-side)

### 9.2: Mentor-Client Messaging

**Features:**
- Direct messaging between client and mentor
- Message threads per review
- Message status (sent, read)
- Simple text only (no attachments initially)

**Database Changes:**
```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER NOT NULL,
  sender_user_id INTEGER NOT NULL,
  recipient_user_id INTEGER NOT NULL,
  message_text TEXT NOT NULL,
  read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME,
  FOREIGN KEY (sender_user_id) REFERENCES users(id),
  FOREIGN KEY (recipient_user_id) REFERENCES users(id)
);

CREATE TABLE message_threads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_review_id INTEGER,
  participant1_user_id INTEGER NOT NULL,
  participant2_user_id INTEGER NOT NULL,
  last_message_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (section_review_id) REFERENCES section_reviews(id),
  FOREIGN KEY (participant1_user_id) REFERENCES users(id),
  FOREIGN KEY (participant2_user_id) REFERENCES users(id)
);
```

**UI Routes:**
- `/messages` - Message inbox
- `/messages/[threadId]` - Message thread
- Message composer in review interface

**Real-time:**
- WebSocket via Cloudflare Durable Objects
- Or polling (simpler, no external service)

**Testing Requirements:**
- [ ] In-app notification creation
- [ ] Notification mark as read
- [ ] Browser notification permission
- [ ] Message sending/receiving
- [ ] Message threading
- [ ] Real-time updates
- [ ] Unread counts

**Estimated Deliverables:**
- 4 new database tables
- 3 new UI components
- 2 new pages
- Messaging interface
- ~1,200 lines of code

---

## Phase 10: Email Notifications & Payment Integration

**Status**: Not Started  
**Priority**: Low (External Integration Phase)  
**Estimated Effort**: 4-5 weeks  
**Dependencies**: Phase 9 Complete (in-app notifications first)  
**External Integrations**: Resend/SendGrid, Stripe ⚠️

### Objectives
Add external integrations only when all internal features are complete and stable.

### 10.1: Email Notification System

**Email Service**: Resend or SendGrid

**Email Templates:**
1. **Review Lifecycle** (mirrors in-app):
   - Review requested (to mentors)
   - Review claimed (to client)
   - Review completed (to client)
   - Changes requested (to client)

2. **Mentor System**:
   - Application received
   - Application approved/rejected
   - New journey assignment

3. **Platform Updates**:
   - Welcome email
   - Weekly digest
   - Journey completion

**Database Changes:**
```sql
CREATE TABLE email_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at DATETIME,
  opened_at DATETIME,
  clicked_at DATETIME,
  status TEXT DEFAULT 'pending',
  metadata TEXT, -- JSON
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Update notification_preferences
ALTER TABLE notification_preferences ADD COLUMN email_reviews BOOLEAN DEFAULT 1;
ALTER TABLE notification_preferences ADD COLUMN email_sessions BOOLEAN DEFAULT 1;
ALTER TABLE notification_preferences ADD COLUMN email_platform BOOLEAN DEFAULT 1;
ALTER TABLE notification_preferences ADD COLUMN email_marketing BOOLEAN DEFAULT 0;
```

**Implementation:**
- Email service SDK (Resend recommended - simple API)
- HTML email templates (MJML or React Email)
- Retry logic for failures
- Unsubscribe handling
- Email analytics

**Cost**: ~$10-20/month for 10,000 emails

### 10.2: Stripe Payment Integration

**Features:**
- Stripe Checkout for subscriptions
- Service tier → Stripe price mapping
- Subscription lifecycle management
- Webhook handling
- Customer portal

**Database Changes:**
```sql
-- Update user_subscriptions
ALTER TABLE user_subscriptions ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE user_subscriptions ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE user_subscriptions ADD COLUMN current_period_end DATETIME;

-- Webhook tracking
CREATE TABLE stripe_webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**API Routes:**
- `/api/stripe/create-checkout`
- `/api/stripe/webhook`
- `/api/stripe/customer-portal`

**Cost**: 2.9% + $0.30 per transaction

### 10.3: Stripe Connect for Mentor Payouts

**Features:**
- Mentor onboarding with Stripe Connect
- Automatic payout calculation
- Monthly payout schedules
- Earnings dashboard
- 1099 tax reporting

**Database Changes:**
```sql
-- Add to mentor_profiles
ALTER TABLE mentor_profiles ADD COLUMN stripe_account_id TEXT;
ALTER TABLE mentor_profiles ADD COLUMN stripe_onboarding_complete BOOLEAN DEFAULT 0;
ALTER TABLE mentor_profiles ADD COLUMN payout_schedule TEXT DEFAULT 'monthly';

CREATE TABLE mentor_payouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mentor_user_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  stripe_payout_id TEXT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  paid_at DATETIME,
  FOREIGN KEY (mentor_user_id) REFERENCES users(id)
);
```

**Background Jobs:**
- Daily: Calculate pending payouts
- Monthly: Trigger Stripe payouts
- Weekly: Send earnings reports (email)

**Cost**: Stripe Connect fees apply

**Testing Requirements:**
- [ ] Email template rendering
- [ ] Email delivery
- [ ] Notification preferences
- [ ] Stripe Checkout integration
- [ ] Webhook handling
- [ ] Subscription lifecycle
- [ ] Connect onboarding
- [ ] Payout calculations
- [ ] Tax reporting

**Estimated Deliverables:**
- 8 email templates
- 6 new API routes
- 3 new database tables
- Payment flow UI
- ~2,500 lines of code

---

## Updated Implementation Priority Matrix

### Phase Priority (No External Dependencies First)

**Tier 1: No External Services (Build First)**
- ✅ Phase 3.9: Journey Enrollment (Complete)
- ✅ Phase 4: Mentor Review System (Complete)
- ✅ Phase 5: Analytics & Insights (Complete)
- ✅ Phase 6: Advanced Mentor Features (Complete)
- 🔲 Phase 7: User Experience Enhancements

**Tier 2: Cloudflare Native Only**
- 🔲 Phase 8: Performance & Scale Optimization

**Tier 3: Internal Communication (Minimal External)**
- 🔲 Phase 9: In-App Messaging & Notifications

**Tier 4: External Integrations (Build Last)**
- 🔲 Phase 10: Email & Payment Integration

### Updated Dependency Graph

```
Phase 4 (Mentor System) ✅
    ↓
    ├─→ Phase 5 (Analytics) ──┐
    ├─→ Phase 6 (Mentor Adv) ─┤
    ├─→ Phase 7 (UX) ─────────┼─→ Phase 8 (Performance)
    │                         │       ↓
    └─→ Phase 9 (In-App Notifications)
            ↓
        Phase 10 (Email + Stripe) ← Only when needed
```

**Critical Path**: 5 → 6 → 7 → 8 → 9 → 10  
**Can Build in Parallel**: 5, 6, 7 (independent)  
**External Deps**: Only Phase 10

---

## Resource Estimates (Updated)

### Development Time (Single Developer)
- Phase 5 (Analytics): 2-3 weeks
- Phase 6 (Mentor Advanced): 3 weeks
- Phase 7 (UX): 2-3 weeks
- Phase 8 (Performance): 2-3 weeks
- Phase 9 (In-App Notif): 2 weeks
- Phase 10 (Email + Stripe): 4-5 weeks

**Total Internal Features**: ~12-15 weeks (3-4 months)  
**External Integrations**: +4-5 weeks (when needed)

### Infrastructure Costs (No External Services)

**Current (Phases 5-9)**:
- Cloudflare Pages: $0-20/month
- D1 Database: $0-5/month
- Cloudflare KV: $0-5/month
- R2 Storage: $0-5/month
- Cloudflare Queues: $0-5/month

**Estimated**: $0-40/month for 100-500 users

**With External Services (Phase 10)**:
- Add Email Service: +$10-20/month
- Add Stripe fees: +2.9% per transaction

---

## Success Metrics

### Phase 5 (Analytics)
- [ ] Dashboard load time < 2s
- [ ] Data accuracy: 100%
- [ ] Creator engagement with analytics > 60%
- [ ] Export success rate > 95%

### Phase 6 (Mentor Features)
- [ ] Availability utilization > 70%
- [ ] Template usage rate > 40%
- [ ] Matching accuracy > 85%
- [ ] Training completion > 80%

### Phase 7 (UX)
- [ ] Mobile traffic support > 30%
- [ ] PWA install rate > 10%
- [ ] Accessibility score: A
- [ ] User satisfaction > 4.5/5

### Phase 8 (Performance)
- [ ] Page load < 1.5s (p95)
- [ ] Cache hit rate > 80%
- [ ] Error rate < 0.1%
- [ ] Database query < 100ms

### Phase 9 (In-App Notif)
- [ ] Notification delivery: 100%
- [ ] Click-through > 20%
- [ ] Message delivery < 1s
- [ ] Browser notif opt-in > 15%

### Phase 10 (External)
- [ ] Payment success > 95%
- [ ] Email delivery > 95%
- [ ] Email open rate > 25%
- [ ] Payout accuracy: 100%

---

## Why This Order?

### Benefits of Delaying External Integrations:

1. **Lower Costs**: No monthly fees during development
2. **Faster Iteration**: No external API rate limits
3. **Simpler Testing**: No webhook testing complexity
4. **Data Privacy**: All data stays in your control
5. **Independence**: Not locked into external services early
6. **Focus**: Build core value first, monetize later

### What Works Without External Services:

- ✅ Complete mentor review system
- ✅ Analytics and insights
- ✅ Availability management
- ✅ Templates and training
- ✅ Progress visualization
- ✅ Mobile PWA
- ✅ In-app messaging
- ✅ Real-time notifications (browser native)
- ✅ Manual payment tracking
- ✅ Performance optimization

### What Requires External Services:

- ⚠️ Email notifications (Phase 10)
- ⚠️ Automated payments (Phase 10)
- ⚠️ Automated payouts (Phase 10)

---

**Last Updated**: 2025-11-13
**Current Status**: Phases 3.9, 4, 5 & 6 Complete ✅
**Next Recommended**: Phase 7 (UX Enhancements) or Phase 8 (Performance) - No external deps
**Estimated Time to External Deps**: 7-10 weeks (Build Phases 7-9 first)
**Philosophy**: Maximum value with minimum dependencies ✅
