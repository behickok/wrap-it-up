-- Cleanup script to remove legacy tables that are no longer referenced by the application.
-- Run with:
--   npx wrangler d1 execute wrap-it-up-db --local --file=./scripts/drop-legacy-tables.sql

BEGIN TRANSACTION;

DROP TABLE IF EXISTS wedding_marriage_license;
DROP TABLE IF EXISTS wedding_prenup;
DROP TABLE IF EXISTS wedding_joint_finances;
DROP TABLE IF EXISTS wedding_name_change;
DROP TABLE IF EXISTS wedding_venue;
DROP TABLE IF EXISTS wedding_vendors;
DROP TABLE IF EXISTS wedding_guest_list;
DROP TABLE IF EXISTS wedding_registry_items;
DROP TABLE IF EXISTS wedding_home_setup;

COMMIT;
