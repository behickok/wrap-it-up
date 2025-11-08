# Full Test Coverage Checklist

- [x] Install Playwright system dependencies (`npx playwright install-deps`) so both Vitest browser suites and Playwright e2e specs can execute locally and in CI (covers `src/routes/page.svelte.spec.js` + `e2e/demo.test.js`).
- [x] Add Vitest tests for server logic in `src/routes/+page.server.ts`, mocking the Cloudflare D1 API to cover the `load` function’s data shaping plus every action (`addCredential`, `addEmployment`, deletes, etc.) including `updateSectionCompletion`.
- [x] Exercise utility modules that remain untested (`src/lib/auth.ts`, `src/lib/utils.ts`, `src/lib/pdfExport.ts` fetch wrapper) with deterministic unit tests that cover error paths, input validation, and helper exports.
- [x] Create browser-component tests for interactive Svelte pieces such as `SectionContent.svelte`, `JourneyTabs.svelte`, `JourneyVisual.svelte`, `AskAI.svelte`, and the list editors (credentials, contacts, employment) to verify rendering based on props/state changes and event emissions.
- [x] Expand Playwright coverage beyond the login redirect: script an authenticated flow that populates a section, verifies readiness-score updates, interacts with the export CTA, and checks the scroll-to-top affordance defined in `src/routes/+page.svelte`.
- [x] Backfill API-route tests (e.g., `/api/auth/login`, `/api/export-data`, `/api/ask-ai`) via Vitest + `@sveltejs/kit/node` adapters to validate JSON contracts, authentication guards, and error handling.
- [x] Add database-focused integration tests that run against a local D1/SQLite file seeded with `scripts/sample-data-user-1.sql`, ensuring migrations and `SECTIONS` weighting (from `src/lib/types.ts`) stay in sync with the dashboard data loader.
