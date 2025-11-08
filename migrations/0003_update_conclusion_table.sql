-- Migration: extend conclusion table for Final Thoughts & Reflections section

ALTER TABLE conclusion ADD COLUMN life_reflections TEXT;
ALTER TABLE conclusion ADD COLUMN advice_for_loved_ones TEXT;
ALTER TABLE conclusion ADD COLUMN unfinished_business TEXT;
ALTER TABLE conclusion ADD COLUMN digital_legacy TEXT;
ALTER TABLE conclusion ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE conclusion ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Ensure unique constraint on user_id (if duplicates existed, keep the latest and remove others)
WITH ranked AS (
	SELECT id, user_id,
		ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY id DESC) AS rn
	FROM conclusion
)
DELETE FROM conclusion WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conclusion_user_id ON conclusion(user_id);
