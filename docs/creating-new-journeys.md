# Creating A New Journey

This repo now treats the **Wedding Journey** as the reference implementation for building richer,
multi-section experiences. Use the following checklist any time you stand up a new journey
(baby, move, health, etc.).

1. **Shape the database**
   - Add a new migration that inserts the journey, categories, and section rows (`journeys`,
     `journey_categories`, `sections`, `journey_sections`).
   - Create any journey-specific data tables (for example `wedding_marriage_license`,
     `wedding_guest_list`, etc.). Each section should have a place to persist structured answers.
   - Update `schema.sql` with the same schema so the reference snapshot stays in sync.

2. **Update shared type + scoring definitions**
   - Add TypeScript interfaces for every new table in `src/lib/types.ts`.
   - Extend the `SECTIONS` constant with the new section slugs and weights so readiness scoring
     knows they exist.
   - Update `SECTION_FIELDS` and any list-based scoring helpers in `src/lib/scoringRules.ts` /
     `src/lib/readinessScore.ts` to describe how points are awarded.

3. **Expose section data to the dashboard**
   - In `src/routes/journeys/[slug]/dashboard/+page.server.ts`:
     - Fetch the new tables when `journey.slug` matches your journey.
     - Merge the results into the `sectionData` object using the section slug as the key.
   - In `src/lib/journeyProgress.ts`, update `fetchAllSectionData` and
     `getSectionDataForScoring` so `recalculateAndUpdateProgress` has the latest answers.

4. **Build UI components**
   - Create standalone Svelte components for each section under `src/lib/components/<journey>/`.
     Follow the pattern from `src/lib/components/wedding/…`—each component owns its fields, posts to a
     named form action, and displays context about why the questions matter.
   - Update `src/lib/components/SectionContent.svelte` to render the new component when
     `sectionId` matches the slug returned from the database.

5. **Wire up form actions**
   - In `src/routes/journeys/[slug]/dashboard/+page.server.ts`, add actions that handle
     create/update/delete for each section. Use `recalculateAndUpdateProgress` after every save so the
     readiness score and dashboard progress bars stay current.

6. **Decide availability + marketing**
   - Surface a `coming soon` badge in `src/routes/+page.svelte` and `src/routes/journeys/+page.svelte`
     if the new journey is not launch-ready.
   - When you flip a journey live, update the `AVAILABLE_JOURNEYS` helpers (see `src/routes/+page.svelte`)
     so CTAs are enabled.

Following the steps above keeps the server, UI, and scoring layers consistent. Use the Wedding
Journey diff as a living example whenever you need to stand up the next experience.***
