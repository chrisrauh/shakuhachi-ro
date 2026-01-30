# Database Migrations

This directory contains SQL migration scripts for the Supabase database.

## How to Run Migrations

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Open the migration file and copy its contents
4. Paste into the SQL Editor and run

## Migrations

### `add_slug_to_scores.sql`

Adds the `slug` field to the `scores` table for human-readable URLs.

**What it does:**
- Adds `slug` column to `scores` table
- Generates slugs for any existing scores
- Makes `slug` NOT NULL
- Adds unique constraint on `slug`
- Creates index on `slug` for fast lookups

**Run this migration:** Before deploying the slug-based URL feature.
