-- Migration: Remove tags column from scores table
-- Date: 2026-02-02
-- Description: Removes the tags feature as part of feature bloat reduction

-- Drop the tags column from the scores table
ALTER TABLE scores DROP COLUMN IF EXISTS tags;
