-- Migration: Add attribution fields to scores table
-- Purpose: Enable proper source attribution for public domain scores

-- Add attribution columns
ALTER TABLE scores
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS rights TEXT,
ADD COLUMN IF NOT EXISTS source_description TEXT;

-- Add column comments for documentation
COMMENT ON COLUMN scores.source_url IS 'Reference URL for source material';
COMMENT ON COLUMN scores.rights IS 'License or rights (e.g., Public Domain)';
COMMENT ON COLUMN scores.source_description IS 'Human-readable attribution text';
