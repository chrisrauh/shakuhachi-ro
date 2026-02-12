-- Migration: Remove view_count column and related RPC function from scores table
-- Date: 2026-02-03
-- Description: Removes the view count feature as part of feature bloat reduction

-- Drop the increment_view_count RPC function if it exists
DROP FUNCTION IF EXISTS increment_view_count(UUID);

-- Drop the view_count column from the scores table
ALTER TABLE scores DROP COLUMN IF EXISTS view_count;
