# Database Setup Guide

This guide walks you through setting up the database for the Shakuhachi Score Library.

## Quick Start

Run these two SQL files in order in your **Supabase Dashboard → SQL Editor**:

1. `migrations/add_attribution_to_scores.sql` - Adds attribution fields to scores table
2. `migrations/seed_scores.sql` - Seeds 7 shakuhachi songs into the library

## Database Schema

After running migrations, the `scores` table has:

```sql
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  composer TEXT,
  description TEXT,
  data_format TEXT NOT NULL,
  data JSONB NOT NULL,
  forked_from UUID REFERENCES scores(id),
  fork_count INTEGER DEFAULT 0,
  source_url TEXT,           -- Reference URL for source material
  rights TEXT,               -- License or rights (e.g., Public Domain)
  source_description TEXT,   -- Human-readable attribution text
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Migrations

| Migration | Description |
|-----------|-------------|
| `add_slug_to_scores.sql` | Adds slug field for human-readable URLs |
| `add_attribution_to_scores.sql` | Adds source_url, rights, source_description fields |
| `remove_difficulty_from_scores.sql` | Removes unused difficulty field |
| `remove_tags_from_scores.sql` | Removes unused tags field |
| `remove_view_count_from_scores.sql` | Removes unused view_count field |
| `seed_scores.sql` | Seeds 7 shakuhachi songs with full attribution |

## Seeded Songs

The seed script adds these songs to your library:

1. **Akatombo** - Traditional folk song (beginner)
2. **Love Story** - Unknown composer
3. **Sakura Sakura** - Traditional Edo period folk song
4. **Kojo no Tsuki** - Rentaro Taki (1901)
5. **Kuroda Bushi** - Traditional Chikuzen folk song
6. **Shika no Tone** - Traditional Kinko-ryu honkyoku
7. **Tsuru no Sugomori** - Traditional Dokyoku honkyoku (Voyager Golden Record)

## Troubleshooting

### "No users found" error when seeding
Create an account through the web app first, then run the seed script.

### Duplicate slug error
The seed script uses fixed slugs. If a score already exists with that slug, you may need to delete it first or skip that INSERT.
