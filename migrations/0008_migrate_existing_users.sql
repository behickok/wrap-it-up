-- Migration: 0008_migrate_existing_users
-- Description: Assign all existing users to the Care journey with Essentials tier
-- Date: 2025-11-11

-- This migration ensures existing users are automatically subscribed to the Care journey
-- so they can continue their progress seamlessly with the new multi-journey platform.

-- Subscribe all existing users to the Care journey with Essentials tier
INSERT INTO user_journeys (user_id, journey_id, tier_id, status, started_at)
SELECT
    u.id as user_id,
    (SELECT id FROM journeys WHERE slug = 'care') as journey_id,
    (SELECT id FROM service_tiers WHERE slug = 'essentials') as tier_id,
    'active' as status,
    COALESCE(u.created_at, datetime('now')) as started_at
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_journeys uj
    WHERE uj.user_id = u.id
    AND uj.journey_id = (SELECT id FROM journeys WHERE slug = 'care')
);

-- Migrate existing section_completion data to user_journey_progress
-- This preserves user progress in the Care journey
INSERT INTO user_journey_progress (user_journey_id, section_id, score, is_completed, last_updated)
SELECT
    uj.id as user_journey_id,
    s.id as section_id,
    COALESCE(sc.score, 0) as score,
    CASE WHEN COALESCE(sc.score, 0) >= 80 THEN 1 ELSE 0 END as is_completed,
    COALESCE(sc.last_updated, datetime('now')) as last_updated
FROM user_journeys uj
JOIN journeys j ON uj.journey_id = j.id
CROSS JOIN sections s
LEFT JOIN section_completion sc ON sc.user_id = uj.user_id AND sc.section_name = s.slug
WHERE j.slug = 'care'
AND NOT EXISTS (
    SELECT 1 FROM user_journey_progress ujp
    WHERE ujp.user_journey_id = uj.id
    AND ujp.section_id = s.id
);
