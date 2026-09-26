-- Record composition copyright and score licence as two separate layers (#306)
-- Run this migration in Supabase SQL Editor
--
-- WHY
--
-- The free-text `rights` column merged two different things: whether the
-- composition is still in copyright (a fact about the world) and the terms on
-- which this particular score's notation may be reused (a choice by whoever
-- produced it). "Public Domain" on a score said something about the piece and
-- nothing about the notation. The decisions behind every column below are on
-- issue #306; this file does not repeat the reasoning.
--
-- ORDERING
--
-- Run BEFORE deploying the code that reads these columns, and deploy promptly
-- after. Reading and saving keep working in between; forking someone else's
-- score may not, because the old code does not copy the licence and the trigger
-- below rejects a fork whose licence differs from its source's.
--
-- `rights` is dropped separately, AFTER the deploy, by
-- drop_rights_from_scores.sql — the old code still writes it.

create type copyright_status as enum (
  'public_domain',
  'no_known_copyright',
  'in_copyright',
  'undetermined',
  'not_evaluated',
  'original'
);

-- Why a public-domain composition is free. Terms count from different events,
-- so the year that applies is stored alongside rather than the conclusion alone.
create type copyright_basis as enum (
  'author_died',
  'published_anonymous',
  'traditional_immemorial'
);

-- SPDX identifiers. NOASSERTION means nobody has established the terms yet.
create type score_license as enum (
  'CC0-1.0',
  'CC-BY-4.0',
  'CC-BY-SA-4.0',
  'CC-BY-NC-4.0',
  'CC-BY-NC-SA-4.0',
  'CC-BY-ND-4.0',
  'CC-BY-NC-ND-4.0',
  'LicenseRef-AllRightsReserved',
  'NOASSERTION'
);

alter table scores
  add column composition_copyright_status copyright_status not null
    default 'not_evaluated',
  add column composition_copyright_basis copyright_basis,
  -- NULL means shakuhachi.ro determined the status itself; any value names the
  -- party whose claim is being passed on.
  add column composition_copyright_source text,
  add column composition_year_author_died int,
  add column composition_year_published int,
  -- Existing rows get NOASSERTION: their terms were never recorded, and
  -- asserting a licence on someone else's behalf would be worse than saying so.
  add column license score_license not null default 'NOASSERTION',
  add constraint composition_copyright_basis_only_when_free check (
    composition_copyright_basis is null
    or composition_copyright_status in ('public_domain', 'no_known_copyright')
  );

-- New scores default to CC BY-SA 4.0. Set only after the column exists, so the
-- backfill above does not pick it up.
alter table scores alter column license set default 'CC-BY-SA-4.0';

-- Backfill the seeded scores whose provenance is established (#306, decision 6):
-- transcribed by ear, so the notation is the owner's own work.
update scores set
  composition_copyright_status = 'public_domain',
  composition_copyright_basis = 'author_died',
  composition_year_author_died = 1903,
  license = 'CC-BY-SA-4.0'
where slug = 'kojo-no-tsuki';

update scores set
  composition_copyright_status = 'public_domain',
  composition_copyright_basis = 'traditional_immemorial',
  license = 'CC-BY-SA-4.0'
where slug in ('kuroda-bushi', 'sakura-sakura', 'shika-no-tone', 'tsuru-no-sugomori');

-- Existing forks inherit from their source, as a fork made from now on would.
update scores fork set
  composition_copyright_status = parent.composition_copyright_status,
  composition_copyright_basis = parent.composition_copyright_basis,
  composition_copyright_source = parent.composition_copyright_source,
  composition_year_author_died = parent.composition_year_author_died,
  composition_year_published = parent.composition_year_published,
  license = parent.license
from scores parent
where fork.forked_from = parent.id;

-- Fork rules (#306, decision 3), enforced here because RLS is the only boundary:
-- the anon key is public, so a check in the browser is advice, not a rule.
--
--   * a fork starts with its source's licence;
--   * ND and All Rights Reserved sources cannot be forked;
--   * ShareAlike and NOASSERTION stay locked afterwards; NonCommercial must stay NC;
--   * none of this applies to forking your own score — a licence binds others,
--     not the person granting it.
--
-- This guards the fork relation only. Anyone can still copy the notation into a
-- new score without claiming it as a fork; no rule here can prevent that.
create or replace function enforce_fork_license() returns trigger
language plpgsql as $$
declare
  parent scores%rowtype;
begin
  select * into parent from scores where id = new.forked_from;

  if not found or parent.user_id = new.user_id then
    return new;
  end if;

  if tg_op = 'INSERT' or new.forked_from is distinct from old.forked_from then
    if parent.license::text like '%-ND-%'
       or parent.license = 'LicenseRef-AllRightsReserved' then
      raise exception 'This score''s licence (%) does not allow forking',
        parent.license;
    end if;
    if new.license <> parent.license then
      raise exception 'A fork keeps the licence of the score it came from (%)',
        parent.license;
    end if;
  elsif (parent.license::text like '%-SA-%' or parent.license = 'NOASSERTION')
        and new.license <> parent.license then
    raise exception 'This fork must keep the licence of the score it came from (%)',
      parent.license;
  elsif parent.license::text like '%-NC-%'
        and new.license::text not like '%-NC-%' then
    raise exception 'This fork must keep a NonCommercial licence, like the score it came from (%)',
      parent.license;
  end if;

  return new;
end $$;

create trigger scores_enforce_fork_license
  before insert or update of license, forked_from on scores
  for each row
  when (new.forked_from is not null)
  execute function enforce_fork_license();
