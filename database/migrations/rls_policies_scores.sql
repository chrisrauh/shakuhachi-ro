-- Row Level Security policies for the scores table
-- Run this migration in Supabase SQL Editor
--
-- STATUS: already deployed and enforced. Verified 2026-09-25 against production:
-- pg_class.relrowsecurity = true, and all four policies below present with these
-- exact definitions. This file exists to put them under version control — they
-- were previously configured only in the Supabase dashboard, invisible to anyone
-- reviewing this repo. Re-running it reproduces the deployed catalog state
-- exactly; it is not a behaviour change.
--
-- WHY THEY MATTER
--
-- VITE_SUPABASE_ANON_KEY ships in every browser bundle by design. The ownership
-- checks in src/api/scores.ts run in the client's own browser, and the
-- .eq('user_id', user.id) filters on update/delete are query filters, not
-- constraints — a client can simply omit them. These policies are the only real
-- authorization boundary for this table.
--
-- Note that policies are inert unless RLS is also ENABLED on the table. Tables
-- created with raw SQL (as database/README.md instructs) have it disabled by
-- default, and the app behaves identically either way, so the difference produces
-- no visible symptom. Verify both, not just the policy list:
--
--   select relname, relrowsecurity from pg_class where relname = 'scores';
--   select policyname, cmd, qual, with_check from pg_policies where tablename = 'scores';

alter table scores enable row level security;

-- Read is public: the browse page lists every score while logged out.
drop policy if exists "Scores are viewable by everyone" on scores;
create policy "Scores are viewable by everyone" on scores
  for select
  using (true);

drop policy if exists "Users can create scores" on scores;
create policy "Users can create scores" on scores
  for insert
  with check (auth.uid() = user_id);

-- No explicit WITH CHECK: Postgres reuses the USING expression for the new row,
-- so a user cannot reassign a score to someone else. Left implicit to match the
-- deployed definition exactly.
drop policy if exists "Users can update own scores" on scores;
create policy "Users can update own scores" on scores
  for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own scores" on scores;
create policy "Users can delete own scores" on scores
  for delete
  using (auth.uid() = user_id);

-- The owner-only UPDATE policy means a forking user cannot write to the parent
-- score at all. Nothing needs to: fork counts are derived from forked_from
-- rather than stored. See derive_fork_count.sql.
