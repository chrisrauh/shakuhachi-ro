-- Add slug column to scores table
-- Run this migration in Supabase SQL Editor

-- Add slug column
ALTER TABLE scores
ADD COLUMN slug TEXT;

-- Generate slugs for existing scores
-- This will create simple slugs from existing titles
UPDATE scores
SET slug = LOWER(REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'), ' ', '-'))
WHERE slug IS NULL;

-- Make slug NOT NULL after populating
ALTER TABLE scores
ALTER COLUMN slug SET NOT NULL;

-- Add unique constraint on slug
ALTER TABLE scores
ADD CONSTRAINT scores_slug_unique UNIQUE (slug);

-- Create index on slug for faster lookups
CREATE INDEX idx_scores_slug ON scores(slug);
