-- Store what a note writes: character, register and accidental; remove dotted (#492)
-- A note records the score, not the sound. Its "pitch" was the written character
-- and register, not a sounding pitch, so:
--   "pitch": { "step": "tsu", "octave": 1 }, "meriKari": "meri"
-- becomes
--   "character": "tsu", "register": 1, "accidental": "meri"
-- The dot is no longer stored: a length with a half ("3/2", "5/2", "3/4") is
-- always drawn with one.
--
-- Run it in the Supabase SQL Editor right after #492 is deployed. Between the
-- deploy and this run, scores in the old shape show a validation error.
--
-- Every score is JSON (#459). A note with no "pitch", "meriKari" or "dotted"
-- is left alone, so a second run changes nothing.

update scores
set data = jsonb_set(
  data,
  '{notes}',
  (
    select jsonb_agg(
      (note - 'pitch' - 'meriKari' - 'dotted')
      || case
        when note ? 'pitch' then jsonb_build_object(
          'character', note->'pitch'->'step',
          'register', note->'pitch'->'octave'
        )
        else '{}'::jsonb
      end
      || case
        when note ? 'meriKari' then jsonb_build_object('accidental', note->'meriKari')
        else '{}'::jsonb
      end
      order by ord
    )
    from jsonb_array_elements(data->'notes') with ordinality as n(note, ord)
  )
)
where jsonb_typeof(data->'notes') = 'array'
  and exists (
    select 1 from jsonb_array_elements(data->'notes') as n(note)
    where note ? 'pitch' or note ? 'meriKari' or note ? 'dotted'
  );
