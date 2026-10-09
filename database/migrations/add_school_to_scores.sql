-- Record the school (ryū) a version of a piece comes from (#405)
-- Run this migration in Supabase SQL Editor, BEFORE deploying the code that
-- reads and saves `school`: until then the editor's saves are rejected.
--
-- Honkyoku often have no composer; what a player cares about is which
-- tradition this version comes from. That has been squeezed into `composer`
-- as "Traditional (Kinko-ryu)". The decisions are on issue #405.
--
-- The stored value is a key. Display names ("Kinko-ryū") live in
-- src/utils/school.ts, whose keys must match this enum. Adding a school later
-- is one `alter type school add value '…';` plus an entry there.

create type school as enum (
  'kinko',
  'tozan',
  'myoan',
  'nezasa',
  'ueda',
  'chikuho',
  'dokyoku'
);

alter table scores add column school school;

-- Move the schools out of `composer`. Chikuzen is a region, not a school:
-- Kuroda Bushi's description already says where it comes from.
-- JSON scores also carry the composer inside `data`, shown in the editor's
-- source view, so it changes there too.
update scores set school = 'kinko' where composer = 'Traditional (Kinko-ryu)';
update scores set school = 'dokyoku' where composer = 'Traditional (Dokyoku)';

update scores
set
  composer = 'Traditional',
  data = case
    when data_format = 'json' and data ? 'composer'
      then jsonb_set(data, '{composer}', '"Traditional"')
    else data
  end
where composer in (
  'Traditional (Kinko-ryu)',
  'Traditional (Dokyoku)',
  'Traditional (Chikuzen)'
);
