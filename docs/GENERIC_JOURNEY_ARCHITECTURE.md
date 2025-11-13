# Generic Journey Architecture

This document captures the **target architecture** for the creator-focused, multi-journey platform and the **current migration status** as we move from the rigid per-journey tables to the generic key-value (KV) model.

---

## Current State Snapshot (April 2025)

- `DynamicForm` now renders all single-record sections and `DynamicListSection` renders every repeatable section (credentials, contacts, legal, financial, insurance, employment, property, and all wedding lists). The bespoke `*List.svelte` components and their CRUD actions have been removed; everything persists via `section_data`.
- Wedding single-record sections (`marriage_license`, `prenup`, `joint_accounts`, `name_change`, `venue`, `home_setup`) now read/write exclusively through `section_data`. List-oriented wedding sections already use the generic list form.
- Scoring still relies on `section_completion`; the long-term goal is to remove it once `genericScoring` feeds `user_journey_progress` directly.
- Seeds still populate the legacy SQL tables. A migration/backfill is required to hydrate `section_data` with existing user data so the old tables can be dropped.

The rest of this doc clarifies the desired end-state so we can finish the migration with confidence.

---

## Target Architecture Components

### 1. Database Schema (authoritative view)

| Area | Tables | Purpose |
| --- | --- | --- |
| User & journey platform | `users`, `journeys`, `categories`, `journey_categories`, `sections`, `journey_sections`, `service_tiers`, `tier_features`, `user_journeys`, `user_journey_progress` | Define reusable sections, bundle them into journeys, and track a user’s progress per section. |
| Generic field system | `field_types`, `section_fields`, `section_data` | Describe every field inside a section and persist user answers as JSON blobs with cached completion stats. |
| Creator marketplace | `journey_creators`, `journey_templates` | Attribute journeys to creators, manage publishing, and support cloning. |
| Mentors & concierge | `mentors`, `mentor_journeys`, `mentor_reviews`, `review_comments`, `mentor_sessions`, `session_ratings` | Power mentor dashboards, review workflows, and session scheduling. |
| Legacy compatibility | `credentials`, `personal_info`, `...`, `wedding_home_setup`, `section_completion` | Still referenced in production code; scheduled for removal after migration. |

Indexes defined in migrations `0006`/`0007` should also be present in `schema.sql` so local SQLite mirrors production.

### 2. TypeScript Types (`src/lib/types.ts`)

```ts
// Field system
FieldType, ParsedFieldType;
SectionField, ParsedSectionField;
SectionData, ParsedSectionData;

// Form configs
SelectFieldConfig, TextFieldConfig, NumberFieldConfig, etc.

// Creator marketplace
JourneyCreator, JourneyTemplate;
```

These types exist but are not widely consumed yet; most UI still references the legacy `PersonalInfo`, `Wedding*` interfaces.

### 3. Components

- **`/src/lib/components/forms/DynamicFormField.svelte`** – Renders a field based on its `field_type` definition (15 types supported, validation hooks, conditional logic).
- **`/src/lib/components/forms/DynamicForm.svelte`** – Wraps all fields for a section, handles submission, validation, autosave, and progress display.
- **`/src/lib/components/forms/DynamicListSection.svelte`** – Generic list editor that renders repeatable sections from metadata (`LIST_SECTION_DEFINITIONS`) and persists the full array via `section_data`.
- **`/src/lib/components/SectionContent.svelte`** – Orchestrates rendering: it now routes single-record sections to `DynamicForm`, list sections to `DynamicListSection`, and only falls back to custom components for the few remaining bespoke wedding forms.

### 4. Utilities

- **`/src/lib/genericScoring.ts`** – Field-importance based scoring (critical 40, important 30, optional 10) + helper utilities for completion counts and suggestions.
- **`/src/lib/server/genericSectionData.ts`** – CRUD for `section_fields`/`section_data`, including automatic score updates to `user_journey_progress`.

### 5. Admin / Creator Interface

- **`/src/routes/admin/journeys/+page.svelte`** – Journey registry (list/create/publish/delete). A drag-and-drop section/field editor is still TODO.

---

## Legacy → Generic Mapping

| Section slug | Legacy tables | Data shape today | Target storage in `section_data` | Notes / migration status |
| --- | --- | --- | --- | --- |
| `personal` | `personal_info` | Single row per user/person_type | Object with contact + identity fields | Needs field definitions + data migration. |
| `medical` | `medical_info`, `physicians` | One row + child list | Object with nested `physicians` array | Requires composite field config. |
| `contacts` | `key_contacts` | List | Array of contact objects | ✅ Rendered via `DynamicListSection`; data now lives in `section_data`. |
| `family` | `family_members`, `family_history` | One-to-many + history blob | Object `{ members: [], history: {} }` | Need nested structures + adapters. |
| `pets` | `pets` | List | Array | Straightforward list migration. |
| `employment` | `employment` | List | Array | ✅ Managed through `DynamicListSection`; KV storage is the source of truth. |
| `financial` | `bank_accounts`, `investments`, `charitable_contributions` | Multiple lists | Either split into sub-sections or single section with typed arrays | ✅ Bank accounts now use `DynamicListSection`; investment/charity sections still TBD. |
| `insurance` | `insurance` | List | Array | ✅ Uses `DynamicListSection` and `section_data`. |
| `legal` | `legal_documents`, `documents` | List + uploads | JSON array plus asset metadata | ✅ Uses `DynamicListSection`; upload strategy still pending. |
| `residence` | `primary_residence`, `service_providers`, `home_inventory` | One row + child lists | Object with nested arrays | Staged migration recommended. |
| `property` | `vehicles`, `personal_property`, `other_real_estate` | Lists | Separate arrays inside JSON object | ✅ Vehicles live in `section_data`; real-estate split still optional. |
| `final-days` | `final_days` | Single row | Object | Low risk migration. |
| `after-death` | `after_death` | Single row | Object | Low risk migration. |
| `funeral` | `funeral` | Single row | Object | Low risk migration. |
| `obituary` | `obituary` | Single row | Object | Low risk migration. |
| `conclusion` | `conclusion` | Single row | Object | Low risk migration. |
| `credentials` | `credentials` | List | Array | ✅ Uses `DynamicListSection`; encryption-at-rest still a requirement before dropping the legacy table. |
| Wedding sections (`marriage_license`, `prenup`, `joint_accounts`, `name_change`, `venue`, `vendors`, `guest_list`, `registry`, `home_setup`) | `wedding_*` tables | Mix of single rows + lists | JSON per section | ✅ All wedding sections now read/write through `section_data` (lists via `DynamicListSection`, forms via `DynamicForm`). |
| Readiness score | `section_completion` | Derived table | Should derive from `user_journey_progress` | Remove after generic scoring rollout. |

Any tables not listed (e.g., `documents`, `service_providers`) should either become their own sections or be folded into the parent section’s JSON schema.

---

## Migration Strategy

1. **Schema parity**
   - Ensure `schema.sql` mirrors migrations `0006` and `0007` (journey platform + KV tables) while clearly marking legacy tables as deprecated.
   - Add migration comments / deprecation notes so future contributors do not extend the old schema.
2. **Field definitions**
   - Keep seeding `field_types` and `section_fields` via migrations (`0007`, `0008`). Extend seeds for every Care journey section before touching production data.
3. **Data migration**
   - Build a scripted migration (SQL or TypeScript) that reads from each legacy table, reshapes rows into JSON, and calls `saveSectionData`.
   - Run in dry-run mode first and log per-section counts for verification.
4. **Application cutover**
   - Update data loaders (`journeyProgress.ts`, `SectionContent.svelte`, mentor dashboards, export APIs) to read `section_data`.
   - Switch scoring to `genericScoring` + `user_journey_progress`, then delete `section_completion`.
5. **Cleanup**
   - Drop legacy tables once no code references them, remove obsolete TypeScript interfaces/components, and adjust docs/READMEs.

Example migration helper:

```ts
const sectionId = await lookupSectionId('marriage_license');
const rows = await db.prepare('SELECT * FROM wedding_marriage_license').all();
for (const row of rows.results ?? []) {
  await saveSectionData(db, row.user_id, sectionId, {
    jurisdiction: row.jurisdiction,
    office_address: row.office_address,
    // ...
  }, fieldsCache[sectionId]);
}
```

---

## Next Steps (May 2025)

(All completed ✅ — migrations have been run and the dashboard now uses the dynamic form stack end to end.)

## Journey Creator Workflow (target UX)

1. **Create Journey**
   ```
   Name: "Home Renovation"
   Slug: "renovation"
   Description: "Plan and track your home renovation"
   Icon: 🏠
   ```
2. **Add Categories**
   - Planning (legal, budget, timeline)
   - Execution (contractors, materials)
   - Finishing (inspection, warranty)
3. **Define Sections**
   ```
   Section: "Budget Planning"
   Category: Planning
   Weight: 8
   ```
4. **Add Fields**
   ```
   "Total Budget" (currency, critical, required)
   "Contingency Fund" (currency, important)
   "Budget Notes" (textarea, optional)
   ```
5. **Publish**
   - Journey becomes available to users.
   - Creators can feature or clone via `journey_templates`.

---

## Benefits

### For Creators
- ✅ No custom SQL required
- ✅ Visual journey builder (in progress)
- ✅ Reusable components
- ✅ Instant publishing workflow
- ✅ Usage analytics & attribution

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
- [x] Run migrations on database
- [x] Update dashboard to use DynamicForm
- [x] Test with Wedding journey

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
