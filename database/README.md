# Database Setup Guide

This guide walks you through setting up the database for the Shakuhachi Score Library.

## Quick Start

Run these SQL files in order in your **Supabase Dashboard → SQL Editor**:

1. `migrations/add_attribution_to_scores.sql` - Adds attribution fields to scores table
2. `migrations/rls_policies_scores.sql` - **Required.** Row Level Security policies
3. `migrations/derive_fork_count.sql` - **Required.** Drops the stored `fork_count` column; the count is derived from `forked_from`
4. `migrations/seed_scores.sql` - Seeds 7 shakuhachi songs into the library

## Row Level Security

**RLS is the only thing protecting this database.** `VITE_SUPABASE_ANON_KEY` ships in
every browser bundle by design, and the ownership checks in `src/api/scores.ts` run in
the client's own browser — they are query filters, not constraints. Without the
policies in `migrations/rls_policies_scores.sql`, anyone holding the anon key can
update or delete any score.

Two separate things have to be true, and only checking one of them is a common trap:
the policies must exist, **and** RLS must be enabled on the table. Policies are inert
if it is not. Tables created with raw SQL (as this guide instructs) have RLS disabled
by default, and the app behaves identically either way, so the gap produces no visible
symptom. Verify both:

```sql
select relname, relrowsecurity from pg_class where relname = 'scores';
select policyname, cmd, qual, with_check from pg_policies where tablename = 'scores';
```

Expect `relrowsecurity = true` and four policies: public `select`, and owner-only
`insert` / `update` / `delete`.

Because the `update` policy is owner-only, a forking user cannot write to the parent
score at all. Nothing needs to: fork counts are **derived** from the `forked_from`
self-FK rather than stored in a column, so forking is a plain insert. See
`migrations/derive_fork_count.sql`.

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
  forked_from UUID REFERENCES scores(id),  -- fork count is derived from this
  source_url TEXT,           -- Reference URL for source material
  rights TEXT,               -- License or rights (e.g., Public Domain)
  source_description TEXT,   -- Human-readable attribution text
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Migrations

| Migration                           | Description                                                        |
| ----------------------------------- | ------------------------------------------------------------------ |
| `add_slug_to_scores.sql`            | Adds slug field for human-readable URLs                            |
| `add_attribution_to_scores.sql`     | Adds source_url, rights, source_description fields                 |
| `remove_difficulty_from_scores.sql` | Removes unused difficulty field                                    |
| `remove_tags_from_scores.sql`       | Removes unused tags field                                          |
| `remove_view_count_from_scores.sql` | Removes unused view_count field                                    |
| `rls_policies_scores.sql`           | Row Level Security policies (public read, owner-only write)        |
| `derive_fork_count.sql`             | Drops stored `fork_count`; the count is derived from `forked_from` |
| `seed_scores.sql`                   | Seeds 7 shakuhachi songs with full attribution                     |

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
