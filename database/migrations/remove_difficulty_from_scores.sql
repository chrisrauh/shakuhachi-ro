-- Migration: Remove difficulty column from scores table
-- Date: 2026-02-03
-- Description: Removes the difficulty feature as part of feature bloat reduction

-- Drop the difficulty column from the scores table
ALTER TABLE scores DROP COLUMN IF EXISTS difficulty;
