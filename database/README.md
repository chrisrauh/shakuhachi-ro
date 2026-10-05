# Database Setup Guide

This guide walks you through setting up the database for the Shakuhachi Score Library.

## Quick Start

Run these SQL files in order in your **Supabase Dashboard → SQL Editor**:

1. `migrations/add_attribution_to_scores.sql` - Adds attribution fields to scores table
2. `migrations/rls_policies_scores.sql` - **Required.** Row Level Security policies
3. `migrations/derive_fork_count.sql` - **Required.** Drops the stored `fork_count` column; the count is derived from `forked_from`
4. `migrations/add_licensing_to_scores.sql` - **Required.** Composition copyright status, score licence, and the fork licence trigger
5. `migrations/drop_rights_from_scores.sql` - Drops the superseded free-text `rights` column
6. `migrations/seed_scores.sql` - Seeds 6 shakuhachi songs into the library

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
  data_format TEXT NOT NULL CHECK (data_format IN ('json', 'musicxml', 'abc')),
  data JSONB NOT NULL,        -- a ScoreData object for json; the text as a JSON string otherwise
  forked_from UUID REFERENCES scores(id),  -- fork count is derived from this
  source_url TEXT,           -- Reference URL for source material
  source_description TEXT,   -- Human-readable attribution text
  -- Composition layer: a fact about the piece
  composition_copyright_status copyright_status NOT NULL DEFAULT 'not_evaluated',
  composition_copyright_basis copyright_basis,  -- only when public domain / no known copyright
  composition_copyright_source TEXT,            -- NULL = determined by shakuhachi.ro
  composition_year_author_died INT,
  composition_year_published INT,
  -- Score layer: the terms on this notation (SPDX identifier)
  license score_license NOT NULL DEFAULT 'CC-BY-NC-SA-4.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Migrations

| Migration                           | Description                                                                 |
| ----------------------------------- | --------------------------------------------------------------------------- |
| `add_slug_to_scores.sql`            | Adds slug field for human-readable URLs                                     |
| `add_attribution_to_scores.sql`     | Adds source_url, rights, source_description fields                          |
| `remove_difficulty_from_scores.sql` | Removes unused difficulty field                                             |
| `remove_tags_from_scores.sql`       | Removes unused tags field                                                   |
| `remove_view_count_from_scores.sql` | Removes unused view_count field                                             |
| `rls_policies_scores.sql`           | Row Level Security policies (public read, owner-only write)                 |
| `derive_fork_count.sql`             | Drops stored `fork_count`; the count is derived from `forked_from`          |
| `add_licensing_to_scores.sql`       | Two rights layers, backfill, and the fork licence trigger (#306)            |
| `drop_rights_from_scores.sql`       | Drops `rights`, superseded by the two layers                                |
| `default_license_nc_sa.sql`         | New scores default to CC BY-NC-SA 4.0                                       |
| `allow_abc_data_format.sql`         | Allows `data_format` `abc`, so ABC is stored as typed (#262)                |
| `meri_kari_field.sql`               | Replaces the `meri`/`chu_meri`/`dai_meri` note flags with `meriKari` (#288) |
| `seed_scores.sql`                   | Seeds 6 shakuhachi songs with full attribution                              |

## Seeded Songs

The seed script adds these songs to your library:

1. **Akatombo** - Traditional folk song (beginner)
2. **Sakura Sakura** - Traditional Edo period folk song
3. **Kojo no Tsuki** - Rentaro Taki (1901)
4. **Kuroda Bushi** - Traditional Chikuzen folk song
5. **Shika no Tone** - Traditional Kinko-ryu honkyoku
6. **Tsuru no Sugomori** - Traditional Dokyoku honkyoku (Voyager Golden Record)

## Troubleshooting

### "No users found" error when seeding

Create an account through the web app first, then run the seed script.

### Duplicate slug error

The seed script uses fixed slugs. If a score already exists with that slug, you may need to delete it first or skip that INSERT.
