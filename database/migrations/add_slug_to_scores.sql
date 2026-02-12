-- Add slug column to scores table
-- Run this migration in Supabase SQL Editor

-- Add slug column
ALTER TABLE scores
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Generate unique slugs for existing scores
-- This handles duplicates by appending numbers (test-score, test-score-2, test-score-3, etc.)
WITH ranked_scores AS (
  SELECT
    id,
    title,
    LOWER(REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'), ' ', '-')) as base_slug,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'), ' ', '-'))
      ORDER BY created_at
    ) as row_num
  FROM scores
  WHERE slug IS NULL
)
UPDATE scores
SET slug = CASE
  WHEN ranked_scores.row_num = 1 THEN ranked_scores.base_slug
  ELSE ranked_scores.base_slug || '-' || ranked_scores.row_num
END
FROM ranked_scores
WHERE scores.id = ranked_scores.id;

-- Make slug NOT NULL after populating
ALTER TABLE scores
ALTER COLUMN slug SET NOT NULL;

-- Add unique constraint on slug
ALTER TABLE scores
ADD CONSTRAINT scores_slug_unique UNIQUE (slug);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_scores_slug ON scores(slug);
