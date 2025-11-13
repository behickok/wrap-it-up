# Wrap It Up - Documentation Index

## Quick Start
- [README.dev.md](./README.dev.md) - Development setup (outdated, needs update)

## Platform Architecture
- **[MENTOR_REVIEW_SYSTEM.md](./MENTOR_REVIEW_SYSTEM.md)** ⭐ **NEW** - Complete documentation for Phase 3.9 & Phase 4 (Journey Enrollment + Mentor System)
- [GENERIC_JOURNEY_ARCHITECTURE.md](./GENERIC_JOURNEY_ARCHITECTURE.md) - Core journey architecture and database schema
- [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) - Development phases and priorities
- [PLATFORM_REQUIREMENTS_AND_GAPS.md](./PLATFORM_REQUIREMENTS_AND_GAPS.md) - Feature requirements analysis

## Phase Documentation

### Current Phase Status
- ✅ Phase 1: Complete (see PHASE_1_SUMMARY.md)
- ✅ Phase 2: Complete (see PHASE_2_SUMMARY.md)
- ✅ Phase 3: Complete (see PHASE_3_SUMMARY.md)
- ✅ **Phase 3.9**: Journey Enrollment & User Access - **Documented in [MENTOR_REVIEW_SYSTEM.md](./MENTOR_REVIEW_SYSTEM.md)**
- ✅ **Phase 4**: Mentor Review System - **Documented in [MENTOR_REVIEW_SYSTEM.md](./MENTOR_REVIEW_SYSTEM.md)**
  - Phase 4.1: Database Foundation (commit 4b262f5)
  - Phase 4.2: Creator Approval (commit 0e6fd29)
  - Phase 4.3: Mentor Dashboard (commit 55dacfc)
  - Phase 4.4: Review Interface (commit 637b7d8)

### Historical Phase Documentation
- [PHASE_1_SUMMARY.md](./PHASE_1_SUMMARY.md) - Foundation and authentication
- [PHASE_2_SUMMARY.md](./PHASE_2_SUMMARY.md) - Journey creation system
- [PHASE_3_SUMMARY.md](./PHASE_3_SUMMARY.md) - Dynamic journey dashboard (older Phase 3 work)
- [PHASE_4_SUMMARY.md](./PHASE_4_SUMMARY.md) - Progress tracking (older Phase 4 work, superseded by mentor system)
- [PHASE_5_SUMMARY.md](./PHASE_5_SUMMARY.md) - Future enhancements

**Note:** PHASE_3_SUMMARY.md and PHASE_4_SUMMARY.md document earlier development cycles. The most recent Phase 3.9 and Phase 4 work (mentor review system) is documented in **[MENTOR_REVIEW_SYSTEM.md](./MENTOR_REVIEW_SYSTEM.md)**.

## Feature Documentation
- [ROLE_BASED_ACCESS_CONTROL.md](./ROLE_BASED_ACCESS_CONTROL.md) - User roles and permissions
- [creating-new-journeys.md](./creating-new-journeys.md) - Guide for creating journey content
- [book-overview.md](./book-overview.md) - Overview of the Care journey content

## Development Guides
- [agents.md](./agents.md) - AI agents documentation
- [TODO.md](./TODO.md) - Outstanding tasks and improvements
- [test-coverage-checklist.md](./test-coverage-checklist.md) - Testing requirements

## Key Systems Overview

### 1. Journey Management System
**Status**: Production Ready ✅  
**Documentation**: [GENERIC_JOURNEY_ARCHITECTURE.md](./GENERIC_JOURNEY_ARCHITECTURE.md)

- Create unlimited journeys as templates
- Flexible category and section organization
- Dynamic form builder with 10+ field types
- Progress tracking per user per journey

### 2. Mentor Review System
**Status**: Phase 4 Complete ✅  
**Documentation**: [MENTOR_REVIEW_SYSTEM.md](./MENTOR_REVIEW_SYSTEM.md)

**Features:**
- Mentor application and approval workflow
- Creator dashboard for mentor management
- Mentor-to-journey assignment with compensation
- Section review request flow (Guided tier)
- Comprehensive review interface with field-level commenting
- Review completion workflow (approve/request changes)
- Real-time stats tracking (ratings, turnaround time, earnings)

**Database Tables:**
- `mentor_applications` - Application submissions
- `mentor_profiles` - Approved mentor profiles
- `journey_mentors` - Assignments and compensation
- `section_reviews` - Review workflow tracking
- `review_comments` - Field-level and general feedback
- `mentor_ratings` - Multi-dimension ratings
- `mentor_transactions` - Payment tracking
- `review_notifications` - Status notifications

**User Journeys:**
1. Apply as mentor → Creator approval → Assignment to journeys
2. Client requests review → Mentor claims → Review with comments → Approve/request changes
3. Creator assigns mentor → Set compensation → Monitor performance

### 3. Enrollment System
**Status**: Phase 3.9 Complete ✅  
**Documentation**: [MENTOR_REVIEW_SYSTEM.md](./MENTOR_REVIEW_SYSTEM.md#phase-39-journey-enrollment--user-access)

- Public journey browsing
- One-click enrollment
- My Journeys dashboard
- Multi-journey support per user

### 4. Pricing & Marketplace
**Status**: Production Ready ✅  
**Documentation**: [PHASE_3_SUMMARY.md](./PHASE_3_SUMMARY.md) (older phase work)

- 3-tier pricing (Self-Serve, Guided, Premium)
- Journey marketplace
- Creator revenue tracking
- Manual payment setup (pre-Stripe)

## Database Schema

### Core Tables
- `users` - User accounts
- `journeys` - Journey templates
- `categories` - Journey categories
- `sections` - Journey sections
- `section_fields` - Dynamic form fields
- `user_journeys` - User enrollments
- `user_section_data` - User progress data
- `user_journey_progress` - Progress tracking

### Mentor System Tables
- `mentor_applications`
- `mentor_profiles`
- `journey_mentors`
- `section_reviews`
- `review_comments`
- `mentor_ratings`
- `mentor_transactions`
- `review_notifications`

### Pricing Tables
- `service_tiers` - Tier definitions
- `journey_pricing` - Per-journey pricing
- `user_subscriptions` - User tier assignments

**Full Schema**: See `migrations/` directory

## Migration Files

### Current Migrations
- `0001_*.sql` - Initial schema
- `0002_*.sql` - Generic journey system
- `0003_*.sql` - Pricing and marketplace
- `0012_mentor_review_system.sql` - **Mentor review system** (Phase 4.1)

**Location**: `/migrations/`

## Routes Reference

### Public Routes
- `/` - Main dashboard (legacy)
- `/journeys` - Journey marketplace
- `/journeys/[slug]` - Journey detail page
- `/login`, `/register` - Authentication

### User Routes
- `/journeys/my` - My enrolled journeys
- `/journeys/[slug]/dashboard` - Journey progress dashboard

### Mentor Routes
- `/mentor/apply` - Application form
- `/mentor/dashboard` - Mentor dashboard (stats, pending/in-progress/completed reviews)
- `/mentor/reviews/[reviewId]` - Review interface

### Creator Routes
- `/creator/mentors` - Manage mentor applications and assignments
- `/creator/revenue` - Revenue tracking
- `/admin/journeys` - Journey management

## Testing

### Manual Testing Checklists
- [test-coverage-checklist.md](./test-coverage-checklist.md) - General test coverage
- [MENTOR_REVIEW_SYSTEM.md](./MENTOR_REVIEW_SYSTEM.md#testing-checklist) - Mentor system specific tests

### Test Coverage Priorities
1. ✅ Mentor application flow
2. ✅ Creator approval workflow
3. ✅ Review request and completion
4. ⏸️ Payment processing
5. ⏸️ Notification delivery
6. ⏸️ Analytics and reporting

## Recent Commits (Phase 4)

| Commit | Date | Description | Files | Lines |
|--------|------|-------------|-------|-------|
| `9b4e82c` | 2025-11-13 | Add mentor system documentation | 1 | +931 |
| `637b7d8` | 2025-11-13 | Phase 4.4: Review interface | 4 | +809 |
| `55dacfc` | 2025-11-13 | Phase 4.3: Mentor dashboard | 2 | +520 |
| `0e6fd29` | 2025-11-13 | Phase 4.2: Creator approval | 2 | +894 |
| `4b262f5` | 2025-11-13 | Phase 4.1: Database foundation | 5 | +580 |
| `b1da182` | 2025-11-13 | Phase 3.9: Enrollment flow | 4 | +380 |

**Branch**: `claude/read-journey-architecture-01CMrJQytEHg8v78JGRqAqNo`

## Getting Started for New Developers

### 1. Read First
1. [README.dev.md](./README.dev.md) - Setup instructions
2. [GENERIC_JOURNEY_ARCHITECTURE.md](./GENERIC_JOURNEY_ARCHITECTURE.md) - Core architecture
3. [MENTOR_REVIEW_SYSTEM.md](./MENTOR_REVIEW_SYSTEM.md) - Latest features

### 2. Run Migrations
```bash
# Local development
npx wrangler d1 execute wrap-it-up-db --local --file=./migrations/0001_*.sql
npx wrangler d1 execute wrap-it-up-db --local --file=./migrations/0002_*.sql
# ... etc
npx wrangler d1 execute wrap-it-up-db --local --file=./migrations/0012_mentor_review_system.sql
```

### 3. Start Development
```bash
npm install
npm run dev
```

### 4. Test Key Flows
- Register as mentor → Apply → Get approved
- Enroll in journey → Request review → Complete section
- Create journey → Assign mentor → Monitor reviews

## Support & Questions

- **Technical Issues**: Check [TODO.md](./TODO.md) for known issues
- **Architecture Questions**: See [GENERIC_JOURNEY_ARCHITECTURE.md](./GENERIC_JOURNEY_ARCHITECTURE.md)
- **Mentor System**: See [MENTOR_REVIEW_SYSTEM.md](./MENTOR_REVIEW_SYSTEM.md)

---

**Last Updated**: 2025-11-13  
**Current Phase**: Phase 4 Complete ✅  
**Next Phase**: Phase 5 (Payment Integration, Analytics)
