# Generic Journey Architecture

## Overview

The application has been re-engineered to support a **creator-focused, extensible multi-journey platform**. Instead of hardcoded journey types with custom database tables and components, the system now uses:

- **Generic key-value storage** for all section data
- **Dynamic form builder** that renders forms based on field definitions
- **Field-based scoring** system using importance levels
- **Journey builder interface** for creators to build journeys without code

## Architecture Components

### 1. Database Schema

#### Core Tables

**`field_types`** - Available field types (text, date, select, etc.)
- Pre-seeded with 15 field types
- Includes validation schemas and default configs

**`section_fields`** - Field definitions for each section
- Defines what fields a section contains
- Specifies field type, importance level, validation rules
- Supports conditional logic for showing/hiding fields

**`section_data`** - Generic storage for all section data
- Single JSON column stores all field values
- Replaces custom tables like `wedding_marriage_license`, etc.
- Includes cached completion counts for performance

**`journey_creators`** - Tracks who created each journey
- Enables creator platform features
- Tracks publication status and usage metrics

**`journey_templates`** - Allows journeys to be cloned
- Enables marketplace of journey templates
- Tracks template usage and attribution

### 2. TypeScript Types

Located in `/src/lib/types.ts`:

```typescript
// Field system types
FieldType, ParsedFieldType
SectionField, ParsedSectionField
SectionData, ParsedSectionData

// Field configuration types
SelectFieldConfig, TextFieldConfig, NumberFieldConfig, etc.

// Journey creator types
JourneyCreator, JourneyTemplate
```

### 3. Components

#### `/src/lib/components/forms/DynamicFormField.svelte`
Renders individual form fields based on field type:
- Supports 15 field types
- Handles validation and error display
- Implements conditional logic
- Type-specific rendering (text, date, select, etc.)

#### `/src/lib/components/forms/DynamicForm.svelte`
Main form container:
- Renders all fields for a section
- Handles form submission and validation
- Shows progress indicator
- Implements autosave functionality
- Manages field visibility based on conditional logic

### 4. Utilities

#### `/src/lib/genericScoring.ts`
Field-based scoring system:
- `calculateGenericSectionScore()` - Score based on field importance
- Points: Critical=40, Important=30, Optional=10
- `countCompletedFields()` - Track completion metrics
- `getCompletionSuggestions()` - Guide users to improve scores

#### `/src/lib/server/genericSectionData.ts`
Server-side data management:
- `getSectionFields()` - Fetch field definitions
- `getSectionData()` - Fetch user's section data
- `saveSectionData()` - Save with automatic scoring
- `getSectionWithData()` - Combined fetch for rendering

### 5. Admin Interface

#### `/src/routes/admin/journeys/+page.svelte`
Journey management dashboard:
- List all journeys
- Create new journeys
- Publish/unpublish journeys
- Delete journeys
- View usage statistics

#### Journey Builder Features (To Be Implemented)
- Section editor: Add/remove sections
- Field editor: Define fields with drag-and-drop
- Category management
- Preview journey as user would see it
- Import/export journey templates

## Migration Strategy

### Database Migrations

1. **0007_generic_section_storage.sql**
   - Creates new generic storage tables
   - Adds field type system
   - Adds journey creator tracking

2. **0008_seed_section_fields.sql**
   - Seeds field definitions for existing sections
   - Covers Wedding journey sections (marriage_license, prenup, etc.)
   - Care journey fields to be added

### Data Migration

#### Approach
1. Old custom tables remain temporarily for backward compatibility
2. New data uses generic storage immediately
3. Migration utility converts old data to new format
4. After migration, old tables can be dropped

#### Migration Utility (To Be Created)
```typescript
// Example: Migrate wedding_marriage_license table
for each user {
  old_data = fetch from wedding_marriage_license
  new_data = {
    jurisdiction: old_data.jurisdiction,
    office_address: old_data.office_address,
    // ... map all fields
  }
  saveSectionData(user_id, marriage_license_section_id, new_data)
}
```

## How Creators Build Journeys

### Step 1: Create Journey
```
Journey Name: "Home Renovation"
Slug: "renovation"
Description: "Plan and track your home renovation project"
Icon: 🏠
```

### Step 2: Add Categories
```
Categories:
- Planning (legal, budget, timeline)
- Execution (contractors, materials)
- Finishing (inspection, warranty)
```

### Step 3: Define Sections
```
Section: "Budget Planning"
Category: Planning
Weight: 8 (affects scoring)
```

### Step 4: Add Fields
```
Field: "Total Budget"
Type: Currency
Importance: Critical (40 points)
Required: Yes
Help Text: "Your maximum budget for the project"

Field: "Contingency Fund"
Type: Currency
Importance: Important (30 points)
Required: No
Help Text: "Recommended 10-20% of total budget"

Field: "Budget Notes"
Type: Textarea
Importance: Optional (10 points)
Required: No
```

### Step 5: Publish
- Journey becomes available to all users
- Can be featured in marketplace
- Creator receives attribution

## Benefits

### For Creators
- ✅ No coding required
- ✅ Visual journey builder
- ✅ Reusable components
- ✅ Instant publishing
- ✅ Usage analytics

### For Users
- ✅ More journey options
- ✅ Consistent experience across journeys
- ✅ Better scoring and guidance
- ✅ Easier to complete sections

### For Developers
- ✅ No more custom tables per journey
- ✅ No more custom forms per section
- ✅ Single codebase handles all journeys
- ✅ Easy to add new field types
- ✅ Centralized scoring logic

## Supported Field Types

1. **text** - Single-line text input
2. **textarea** - Multi-line text
3. **number** - Numeric input
4. **currency** - Money with $ prefix
5. **date** - Date picker
6. **datetime** - Date and time picker
7. **email** - Email with validation
8. **phone** - Phone number
9. **url** - Web address
10. **select** - Dropdown menu
11. **multiselect** - Multiple choice
12. **radio** - Radio buttons
13. **checkbox** - Single checkbox
14. **file** - File upload
15. **rating** - Star rating (1-5)

## Adding New Field Types

1. Add to `field_types` table:
```sql
INSERT INTO field_types (type_name, display_name, validation_schema)
VALUES ('color', 'Color Picker', '{"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$"}');
```

2. Add to `FieldTypeName` type in types.ts:
```typescript
export type FieldTypeName = 'text' | 'textarea' | ... | 'color';
```

3. Add rendering in `DynamicFormField.svelte`:
```svelte
{:else if field.field_type.type_name === 'color'}
  <input type="color" ... />
```

## Scoring System

### Field Importance Levels
- **Critical** (40 pts): Must-have fields (e.g., wedding date, venue)
- **Important** (30 pts): Recommended fields (e.g., photographer, dress)
- **Optional** (10 pts): Nice-to-have fields (e.g., favors, decorations)

### Section Score Calculation
```
Total Possible Points = Sum of all field importance points
Earned Points = Sum of completed field points
Score = (Earned Points / Total Possible Points) * 100
```

### Example
```
Fields:
- Venue Name (Critical, 40pts) ✅ Completed
- Venue Address (Important, 30pts) ✅ Completed
- Capacity (Important, 30pts) ❌ Incomplete
- Notes (Optional, 10pts) ❌ Incomplete

Earned: 70 pts
Possible: 110 pts
Score: (70/110) * 100 = 64%
```

## Next Steps

### Immediate (Current PR)
- [x] Database migrations
- [x] TypeScript types
- [x] Generic form components
- [x] Scoring system
- [x] Data utilities
- [x] Admin journey list
- [ ] Run migrations on database
- [ ] Update dashboard to use DynamicForm
- [ ] Test with Wedding journey

### Phase 2 (Future PR)
- [ ] Complete journey builder UI
  - [ ] Section editor
  - [ ] Field editor with drag-and-drop
  - [ ] Category management
  - [ ] Preview mode
- [ ] Data migration from old tables
- [ ] Remove old custom tables
- [ ] Migrate Care journey sections

### Phase 3 (Future PR)
- [ ] Journey marketplace
- [ ] Journey templates
- [ ] Clone journey feature
- [ ] Creator analytics dashboard
- [ ] Featured journeys

### Phase 4 (Future)
- [ ] Advanced field types (signature, location, etc.)
- [ ] Field validation rules builder
- [ ] Multi-page sections
- [ ] Section dependencies
- [ ] Custom scoring formulas

## File Structure

```
/migrations/
  0007_generic_section_storage.sql     # New tables
  0008_seed_section_fields.sql         # Field definitions

/src/lib/
  types.ts                              # TypeScript types
  genericScoring.ts                     # Scoring logic

  /components/forms/
    DynamicFormField.svelte            # Single field renderer
    DynamicForm.svelte                 # Full form container

  /server/
    genericSectionData.ts              # Data utilities

/src/routes/admin/
  /journeys/
    +page.server.ts                    # Journey CRUD
    +page.svelte                       # Journey list UI
    /[id]/edit/
      +page.server.ts                  # Journey editor (TODO)
      +page.svelte                     # Editor UI (TODO)
```

## Example: Creating a "Baby" Journey

### Database Setup
```sql
-- 1. Create journey
INSERT INTO journeys (slug, name, description, icon)
VALUES ('baby', 'Having a Baby', 'Prepare for your new arrival', '👶');

-- 2. Create categories
INSERT INTO categories (name, description, icon)
VALUES
  ('Preparation', 'Get ready before baby arrives', '📝'),
  ('Medical', 'Healthcare and insurance', '🏥'),
  ('Nursery', 'Baby room setup', '🍼');

-- 3. Link categories to journey
INSERT INTO journey_categories (journey_id, category_id, display_order)
SELECT j.id, c.id, 1
FROM journeys j, categories c
WHERE j.slug = 'baby' AND c.name = 'Preparation';

-- 4. Create section
INSERT INTO sections (slug, name, description, weight)
VALUES ('baby_names', 'Baby Names', 'Choose names for your baby', 5);

-- 5. Link section to journey
INSERT INTO journey_sections (journey_id, section_id, category_id, display_order)
SELECT j.id, s.id, c.id, 1
FROM journeys j, sections s, categories c
WHERE j.slug = 'baby'
  AND s.slug = 'baby_names'
  AND c.name = 'Preparation';

-- 6. Add fields
INSERT INTO section_fields (section_id, field_name, field_label, field_type_id, importance_level, display_order)
SELECT
  s.id,
  'first_choice',
  'First Choice Name',
  (SELECT id FROM field_types WHERE type_name = 'text'),
  'critical',
  1
FROM sections s WHERE s.slug = 'baby_names';
```

### User Experience
1. User starts "Baby" journey
2. Sees "Preparation" category
3. Opens "Baby Names" section
4. Sees dynamically rendered form with fields
5. Fills in "First Choice Name"
6. Score updates automatically
7. Progress tracked in dashboard

## Conclusion

This new architecture transforms the application from a single-purpose (Care journey) tool to a **multi-journey platform** where:

- **Creators** can build journeys without code
- **Users** get consistent, high-quality experiences
- **Developers** maintain a single, scalable codebase

The system is now ready to support unlimited journey types: weddings, babies, renovations, illness, career changes, relocations, and any other life journey creators want to build.
