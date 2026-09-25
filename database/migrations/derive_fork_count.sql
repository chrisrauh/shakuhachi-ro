-- Derive fork_count from forked_from instead of storing it
-- Run this migration in Supabase SQL Editor
--
-- WHY
--
-- fork_count duplicated information the forked_from self-FK already holds, and
-- the copy had drifted in both directions:
--
--   * forkScore() bumped the counter on the PARENT score, which the forking user
--     does not own. The "Users can update own scores" RLS policy is owner-only,
--     so that UPDATE matched zero rows — and a zero-row UPDATE is not an error.
--     The console.warn in src/api/scores.ts therefore never fired. Under-count.
--   * deleteScore() never decremented anything. Over-count.
--
-- Verified against production before this change: 3 of 24 rows were wrong.
-- Akatombo stored 1 with 5 actual forks; Love Story stored 1 with 0; Sakura
-- Sakura stored 0 with 1.
--
-- src/api/scores.ts now counts the relation per read
-- (select=*,forks:scores!forked_from(count)) and maps it onto Score.fork_count,
-- so the number cannot drift again and deletes are correct for free.
--
-- ORDERING
--
-- Safe in either direction. The mapper overwrites whatever the column holds
-- while it still exists, and `select *` simply stops returning it afterwards.

-- The count now runs on every read, so index the column it groups by.
create index if not exists idx_scores_forked_from on scores(forked_from);

alter table scores drop column if exists fork_count;

-- No-op unless an earlier version of this branch's increment_fork_count()
-- migration was applied. It is no longer used.
drop function if exists increment_fork_count(uuid);
