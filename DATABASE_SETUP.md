# Database Setup Guide

This guide walks you through setting up the database for slug-based URLs and seeding initial scores.

## Step 1: Run the Database Migration

The migration adds the `slug` field to the `scores` table, which enables human-readable URLs.

### Instructions:

1. **Go to your Supabase Dashboard**
   - Open your Supabase project
   - Navigate to **SQL Editor** in the left sidebar

2. **Run the migration**
   - Copy the contents of `migrations/add_slug_to_scores.sql`
   - Paste into the SQL Editor
   - Click **Run** or press `Cmd/Ctrl + Enter`

3. **Verify the migration**
   - Go to **Table Editor** → `scores` table
   - Confirm the `slug` column exists
   - Check that there's a unique constraint on `slug`

### What the migration does:
- Adds `slug TEXT` column
- Generates slugs for existing scores
- Makes `slug` NOT NULL
- Adds unique constraint `scores_slug_unique`
- Creates index `idx_scores_slug` for fast lookups

## Step 2: Seed Initial Scores

After running the migration, add the Akatombo score to the database.

### Instructions:

1. **Make sure you're logged in**
   - Go to the app and sign in
   - The seed script requires authentication

2. **Open the seed page**
   - Navigate to `/seed-database.html` in your browser
   - e.g., `http://localhost:3001/seed-database.html`

3. **Add Akatombo**
   - Click **"Add Akatombo to Database"**
   - Wait for confirmation in the log
   - The score will be available at `/score.html?slug=akatombo`

4. **Clean up test entries (optional)**
   - Click **"Clean Up Test Entries"**
   - This removes any test/example scores from development

## Step 3: Verify Everything Works

1. **Test the library page**
   - Go to `/` (or `/index.html`)
   - You should see Akatombo listed

2. **Test the score detail page**
   - Click on Akatombo
   - Should navigate to `/score.html?slug=akatombo`
   - The score should render with all metadata

3. **Test creating a new score**
   - Go to `/editor.html`
   - Create a new score
   - Verify it gets a slug automatically

## Troubleshooting

### "Score not found" error
- Make sure the migration ran successfully
- Check that the score has a `slug` field in the database

### "Must be logged in" error
- Sign in to the app first
- The seeding requires a valid user session

### Duplicate slug error
- The app automatically handles duplicates by appending numbers
- e.g., "akatombo", "akatombo-2", "akatombo-3"

## Next Steps: Love Story

The Love Story score is available as an image (`references/scores-pictures/Love story.jpg`) but needs to be:
1. Transcribed to MusicXML or JSON format
2. Added to the database using the seed page

This requires either:
- Manual transcription
- OCR tool (future enhancement)
- Visual score editor (Phase 2 enhancement)

## Database Schema

After migration, the `scores` table has:

```sql
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,  -- New field
  composer TEXT,
  difficulty TEXT,
  description TEXT,
  data_format TEXT NOT NULL,
  data JSONB NOT NULL,
  forked_from UUID REFERENCES scores(id),
  fork_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
