-- Drop the free-text rights column (#306)
-- Run this migration in Supabase SQL Editor
--
-- Superseded by composition_copyright_status and license
-- (add_licensing_to_scores.sql).
--
-- ORDERING
--
-- Run only AFTER the code that stopped writing `rights` is deployed. Until then
-- createScore() still sends it, and every new score would fail to save.

alter table scores drop column if exists rights;
