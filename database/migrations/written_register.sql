-- Rename a note's pitch to written, and its octave to register; remove dotted (#492)
-- A note's "pitch" was the written character, not a sounding pitch, so it is
-- now "written": { "step", "register" }. The dot is no longer stored: a length
-- with a half ("3/2", "5/2", "3/4") is always drawn with one.
--
-- Run it in the Supabase SQL Editor right after #492 is deployed. Between the
-- deploy and this run, scores in the old shape show a validation error.
--
-- Every score is JSON (#459). A note that already has "written" and no
-- "dotted" is left alone, so a second run changes nothing.

update scores
set data = jsonb_set(
  data,
  '{notes}',
  (
    select jsonb_agg(
      case
        when note ? 'pitch' then
          (note - 'pitch' - 'dotted')
          || jsonb_build_object(
            'written',
            jsonb_build_object(
              'step', note->'pitch'->'step',
              'register', note->'pitch'->'octave'
            )
          )
        else note - 'dotted'
      end
      order by ord
    )
    from jsonb_array_elements(data->'notes') with ordinality as n(note, ord)
  )
)
where jsonb_typeof(data->'notes') = 'array'
  and exists (
    select 1 from jsonb_array_elements(data->'notes') as n(note)
    where note ? 'pitch' or note ? 'dotted'
  );
