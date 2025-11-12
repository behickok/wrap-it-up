# Role-Based Access Control (RBAC) System

## Overview

The application now implements a comprehensive **role-based access control** system that enables four distinct user experiences:

1. **Participants** - Users taking journeys and managing their own data
2. **Creators** - Users building journeys for others to use
3. **Mentors** - Experts who review participant data and provide feedback
4. **Coaches** - Professionals who can fill in data on behalf of participants
5. **Admins** - System administrators with full access

## System Architecture

### Database Schema

#### Core RBAC Tables

**`roles`** - System roles
```sql
- participant: Default role for all users
- creator: Can build and publish journeys
- mentor: Can review and provide feedback
- coach: Can access client data
- admin: Full system access
```

**`user_roles`** - User role assignments
- Users can have multiple roles
- Tracks who granted the role
- Audit trail for role changes

**`permissions`** - Granular permissions
- 25+ permissions across 6 categories:
  - Journey management
  - Data access
  - Analytics
  - User management
  - Mentor operations
  - Coach operations
  - System administration

**`role_permissions`** - Maps permissions to roles
- Defines what each role can do
- Centralized permission management

#### Coach System Tables

**`coaches`** - Coach profiles
- Display name, bio, specialties
- Availability and rating
- Hourly rate information

**`coach_clients`** - Coach-client relationships
```typescript
status: 'pending' | 'active' | 'paused' | 'ended'
access_level: 'view' | 'edit' | 'full'
journey_id: null (all journeys) or specific journey
```

**`coach_access_log`** - Audit trail
- Every time coach accesses client data
- Action type: viewed, edited, exported
- Section-level tracking

#### Data Sharing Tables

**`section_shares`** - Granular sharing
```typescript
access_type: 'view' | 'comment' | 'edit'
expires_at: Optional expiration date
```
- Share specific sections with mentors/coaches
- Time-limited access
- Purpose-specific message

#### Analytics Tables

**`journey_analytics`** - Journey-level metrics
- Daily aggregated data
- Engagement: users, sessions, completions
- Progress: avg completion %, avg score
- Retention: 7-day, 30-day

**`section_analytics`** - Section-level insights
- Completion rates
- Average scores
- Common incomplete fields
- Problem area identification

**`analytics_events`** - Raw event tracking
```typescript
event_type:
  - journey_started
  - section_viewed
  - section_completed
  - data_saved
  - journey_completed
```

## Permission System

### Permission Categories

#### 1. Journey Permissions
```
journey.create          - Create new journeys
journey.edit_own        - Edit own journeys
journey.edit_any        - Edit any journey
journey.delete_own      - Delete own journeys
journey.delete_any      - Delete any journey
journey.publish         - Publish journeys
journey.view_all        - View unpublished journeys
```

#### 2. Data Permissions
```
data.view_own          - View own data
data.edit_own          - Edit own data
data.view_shared       - View data shared with you
data.edit_shared       - Edit shared data (coach)
data.export_own        - Export own data
data.delete_own        - Delete own data
```

#### 3. Analytics Permissions
```
analytics.view_own     - View own journey analytics
analytics.view_all     - View all analytics
analytics.export       - Export analytics data
```

#### 4. User Management Permissions
```
user.manage_roles      - Assign/remove roles
user.view_all          - View all user profiles
user.impersonate       - View as another user
```

#### 5. Mentor Permissions
```
mentor.receive_reviews    - Receive review requests
mentor.provide_feedback   - Comment on data
```

#### 6. Coach Permissions
```
coach.add_clients           - Establish relationships
coach.access_client_data    - Access client data
coach.edit_client_data      - Edit on behalf of client
```

#### 7. System Permissions
```
system.manage_settings     - System configuration
system.manage_permissions  - Modify RBAC system
```

### Role-Permission Mappings

#### Participant (Default)
- data.view_own
- data.edit_own
- data.export_own
- data.delete_own

#### Creator
- All Participant permissions
- journey.create
- journey.edit_own
- journey.delete_own
- journey.publish
- analytics.view_own
- analytics.export

#### Mentor
- All Participant permissions
- data.view_shared
- mentor.receive_reviews
- mentor.provide_feedback

#### Coach
- All Participant permissions
- data.view_shared
- data.edit_shared
- coach.add_clients
- coach.access_client_data
- coach.edit_client_data

#### Admin
- ALL permissions

## User Flows

### Participant Flow

1. **Sign Up** → Automatically assigned "participant" role
2. **Choose Journey** → Browse published journeys
3. **Start Journey** → Subscribe to journey with tier
4. **Fill Data** → Complete sections using dynamic forms
5. **Track Progress** → View scores and completion
6. **Request Help** → Share sections with mentors or request coach

### Creator Flow

1. **Apply for Creator** → Request creator role (or auto-granted)
2. **Creator Dashboard** → `/creator/dashboard`
   - View all journeys
   - See analytics summary
   - Create new journeys
3. **Build Journey** → `/admin/journeys/[id]/edit`
   - Define categories
   - Add sections
   - Configure fields
   - Set importance levels
4. **Test Journey** → Preview as participant
5. **Publish** → Make available to users
6. **Monitor** → View analytics, engagement, completion rates

### Coach Flow

1. **Apply for Coach** → Request coach role
2. **Coach Dashboard** → `/coach/dashboard`
   - View client requests
   - Accept/reject clients
   - Manage active relationships
3. **Receive Request** → Client invites coach
   - Review request
   - Set access level
   - Accept or decline
4. **Access Client Data** → `/coach/clients/[userId]`
   - View client's journey progress
   - Fill in sections on their behalf
   - Add private notes
5. **Audit Trail** → All access logged automatically

### Mentor Flow

1. **Apply for Mentor** → Request mentor role
2. **Mentor Dashboard** → `/mentor/dashboard`
   - View review requests
   - Pending reviews
   - Completed reviews
3. **Receive Review Request** → Client submits section
   - Review section data
   - Provide feedback
   - Approve or suggest changes
4. **Track Impact** → See how many users helped

## Access Control Implementation

### Server-Side Utilities (`/src/lib/server/permissions.ts`)

#### Load User with Roles
```typescript
const user = await getUserWithRoles(db, userId);
// Returns: UserWithRoles (includes roles and permissions arrays)
```

#### Check Permissions
```typescript
// Single permission
if (hasPermission(user, 'journey.create')) {
  // Allow action
}

// Multiple permissions (any)
if (hasAnyPermission(user, ['journey.edit_own', 'journey.edit_any'])) {
  // Allow if has either
}

// Multiple permissions (all)
if (hasAllPermissions(user, ['data.view_shared', 'data.edit_shared'])) {
  // Allow only if has both
}
```

#### Check Roles
```typescript
// Single role
if (hasRole(user, 'creator')) {
  // Allow
}

// Multiple roles
if (hasAnyRole(user, ['coach', 'mentor', 'admin'])) {
  // Allow if any match
}
```

#### Context-Aware Checks
```typescript
// Check if user can edit specific journey
const canEdit = await canEditJourney(db, user, journeyId);

// Check if user can delete journey
const canDelete = await canDeleteJourney(db, user, journeyId);

// Check coach access to client data
const { canAccess, accessLevel } = await canAccessClientData(
  db,
  coachUserId,
  clientUserId,
  sectionId
);
```

#### Middleware Functions
```typescript
// Require specific permission
requirePermission('journey.create')(user); // throws if not authorized

// Require specific role
requireRole('creator')(user); // throws if not authorized

// Require any of multiple roles
requireAnyRole(['coach', 'admin'])(user); // throws if not authorized
```

### Route Protection

#### Example: Creator Dashboard
```typescript
// +page.server.ts
export const load: PageServerLoad = async ({ locals, platform }) => {
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  const db = platform?.env?.DB;
  const userWithRoles = await getUserWithRoles(db, locals.user.id);

  // Check permission
  if (!hasPermission(userWithRoles, 'journey.create')) {
    throw redirect(302, '/'); // Not authorized
  }

  // Fetch creator-specific data
  return { ... };
};
```

#### Example: Coach Accessing Client Data
```typescript
export const load: PageServerLoad = async ({ locals, platform, params }) => {
  const userWithRoles = await getUserWithRoles(db, locals.user.id);

  // Check if coach can access this client
  const { canAccess, accessLevel } = await canAccessClientData(
    db,
    locals.user.id,
    params.clientId,
    params.sectionId
  );

  if (!canAccess) {
    throw error(403, 'Access denied');
  }

  // Log access for audit trail
  await logCoachAccess(db, coachClientId, 'viewed', sectionId);

  // Return client data based on access level
  return {
    clientData,
    readonly: accessLevel === 'view'
  };
};
```

## Coach-Client Access Levels

### View Only
- Coach can see client's data
- Cannot make changes
- Good for consultations

### Edit Access
- Coach can fill in sections
- Coach can update existing data
- All changes logged

### Full Access
- Coach can manage journey subscription
- Can add/remove sections
- Can export data
- Complete control on behalf of client

## Data Sharing Model

### Coach-Client Relationship
```typescript
// Participant invites coach
POST /api/coach/invite
{
  coachId: 123,
  journeyId: 456, // or null for all journeys
  accessLevel: 'edit',
  message: "Please help me with this journey"
}

// Creates coach_clients record with status='pending'
// Coach receives notification
// Coach accepts/rejects from dashboard
```

### Section-Level Sharing
```typescript
// Share specific section with mentor
POST /api/sections/share
{
  sectionId: 789,
  mentorId: 234,
  accessType: 'comment',
  expiresAt: '2025-12-31',
  message: "Can you review my budget planning?"
}

// Creates section_shares record
// Mentor can view and comment
// Auto-expires on date
```

## Analytics System

### Event Tracking

Automatically tracked events:
- **journey_started**: User subscribes to journey
- **section_viewed**: User opens a section
- **section_completed**: Section score reaches 80%+
- **data_saved**: User saves section data
- **journey_completed**: All required sections completed

### Analytics Aggregation

Daily cron job aggregates events into:
- `journey_analytics` - Journey-level metrics
- `section_analytics` - Section-level insights

### Creator Analytics Dashboard

Shows:
- **Engagement**: Total users, active users, new users
- **Progress**: Avg completion %, avg score
- **Retention**: 7-day and 30-day retention rates
- **Trends**: User growth, completion trends
- **Problem Areas**: Sections with low completion
- **Drop-off Points**: Where users get stuck

## Security Considerations

### Audit Trail
- All coach access logged to `coach_access_log`
- Includes: timestamp, action, section, details
- Immutable log for compliance

### Permission Checks
- Server-side only (never trust client)
- Check on every request
- Context-aware (ownership, relationships)

### Data Isolation
- Users can only see own data
- Shared access explicitly granted
- Time-limited sharing supported

### Role Assignment
- Only admins can grant roles
- Tracked: who granted, when
- Can be revoked

## Future Enhancements

### Phase 3 (Planned)
- [ ] Role marketplace (apply to be creator/coach/mentor)
- [ ] Coach certification system
- [ ] Mentor matching algorithm
- [ ] Team collaboration (multiple coaches per client)
- [ ] Advanced analytics (funnel analysis, cohorts)

### Phase 4 (Future)
- [ ] Custom roles (journey-specific)
- [ ] Fine-grained permissions builder
- [ ] Organization accounts (companies, nonprofits)
- [ ] White-label journeys
- [ ] API access for integrations

## Migration Guide

### Granting Roles to Existing Users

```typescript
// Promote user to creator
await grantRole(db, userId, 'creator', adminId);

// Promote user to coach
await grantRole(db, userId, 'coach', adminId);

// Multiple roles
await grantRole(db, userId, 'creator', adminId);
await grantRole(db, userId, 'mentor', adminId);
```

### Creating Coach Profile

```typescript
// User must have 'coach' role first
await grantRole(db, userId, 'coach', adminId);

// Profile created automatically on first coach dashboard visit
// Or create manually:
await db.prepare(`
  INSERT INTO coaches (user_id, display_name, bio, specialties)
  VALUES (?, ?, ?, ?)
`).bind(
  userId,
  'Jane Smith, LCSW',
  'Experienced life coach specializing in major transitions',
  JSON.stringify(['wellness', 'career', 'relationships'])
).run();
```

## API Reference

### Permission Utilities

```typescript
import {
  getUserWithRoles,
  hasPermission,
  hasRole,
  canEditJourney,
  canAccessClientData,
  requirePermission
} from '$lib/server/permissions';
```

### Common Patterns

```typescript
// Load user with roles (in +page.server.ts)
const userWithRoles = await getUserWithRoles(db, locals.user.id);

// Protect route
if (!hasPermission(userWithRoles, 'journey.create')) {
  throw redirect(302, '/');
}

// Check ownership
const creator = await db.prepare(`
  SELECT creator_user_id FROM journey_creators
  WHERE journey_id = ?
`).bind(journeyId).first();

if (creator.creator_user_id !== userWithRoles.id) {
  throw error(403, 'Not your journey');
}

// Log coach access
await logCoachAccess(
  db,
  coachClientId,
  'edited',
  sectionId,
  { fields: ['budget', 'timeline'] }
);
```

## Testing Roles

### Manual Testing

1. Create test users for each role
2. Grant roles via SQL:
```sql
-- Make user a creator
INSERT INTO user_roles (user_id, role_id, granted_by)
SELECT 123, id, 1 FROM roles WHERE name = 'creator';

-- Make user a coach
INSERT INTO user_roles (user_id, role_id, granted_by)
SELECT 123, id, 1 FROM roles WHERE name = 'coach';
```

3. Test access controls:
- Try accessing protected routes
- Verify dashboards show correct data
- Test permission denied cases

### Automated Testing

```typescript
// Test permission checking
test('creator can edit own journey', async () => {
  const user = await getUserWithRoles(db, creatorId);
  const canEdit = await canEditJourney(db, user, journeyId);
  expect(canEdit).toBe(true);
});

test('participant cannot edit journey', async () => {
  const user = await getUserWithRoles(db, participantId);
  const canEdit = await canEditJourney(db, user, journeyId);
  expect(canEdit).toBe(false);
});
```

## Conclusion

This RBAC system provides:
- ✅ Clear separation of user types
- ✅ Granular permission control
- ✅ Comprehensive audit trail
- ✅ Flexible data sharing
- ✅ Creator analytics
- ✅ Coach-client relationships
- ✅ Scalable architecture

The system is production-ready and can scale to support thousands of creators, coaches, and participants with proper database indexing and caching strategies.
