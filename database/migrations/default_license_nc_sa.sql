-- New scores default to CC BY-NC-SA 4.0 instead of CC BY-SA 4.0
-- Run this migration in Supabase SQL Editor
--
-- A default applies only to rows inserted after it changes: existing scores
-- keep their licence. Authors who want to allow commercial reuse pick another
-- licence in the editor.
--
-- With this default, forks of a new score by anyone else are fixed to
-- CC BY-NC-SA 4.0: the fork licence trigger (add_licensing_to_scores.sql) locks
-- ShareAlike, and this licence is ShareAlike.

alter table scores alter column license set default 'CC-BY-NC-SA-4.0';
