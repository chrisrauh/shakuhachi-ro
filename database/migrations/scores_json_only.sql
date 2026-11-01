-- Store every score as JSON (#459)
-- MusicXML and ABC are now only views of the JSON in the editor's source
-- view, and a way to paste a score in. The editor saves JSON whichever view
-- is open.
--
-- Order:
-- 1. Run scripts/scores-to-json.ts and keep tmp/scores-originals.json outside
--    the repository.
-- 2. Run the tmp/scores-to-json.sql it writes, in the Supabase SQL Editor.
-- 3. Run this migration. If any MusicXML or ABC score remains, adding the
--    constraint fails and nothing changes.
-- 4. Deploy. Until then, a save from today's editor in the MusicXML or ABC
--    view is refused with an error.

alter table scores drop constraint scores_data_format_check;
alter table scores add constraint scores_data_format_check
  check (data_format = 'json');
