-- Let scores be stored as ABC text, as the author typed it
-- Run this migration in Supabase SQL Editor, before deploying the editor
-- change that saves ABC as 'abc' (#262): until then those saves are rejected.
--
-- The existing constraint allowed only 'json' and 'musicxml', so the editor
-- converted ABC to JSON on save and the author's ABC was lost. Readers already
-- parse stored ABC (src/utils/score-data.ts). Like MusicXML, the text is
-- stored as a JSON string in the jsonb data column.

alter table scores drop constraint scores_data_format_check;
alter table scores add constraint scores_data_format_check
  check (data_format in ('json', 'musicxml', 'abc'));
