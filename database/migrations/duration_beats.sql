-- Rewrite note durations from the legacy numbers to beats (#438)
-- A legacy duration counts two to a beat: 2 is one beat, 1 half a beat. A
-- dotted legacy note is half as long again. A duration in beats is a fraction
-- string in lowest terms: "1" is one beat, "1/2" half a beat, "3/2" a beat and
-- a half.
--
-- Run it in the Supabase SQL Editor after #469 is deployed, so the editor no
-- longer writes numbers, and before #459's conversion of MusicXML and ABC scores.
--
-- Only JSON scores store notes as objects; MusicXML and ABC scores are text and
-- are unaffected. Durations that are already strings are left alone: scores
-- saved from the editor since #469 hold them. So a second run changes nothing.
--
-- A legacy length with no place in beats fails the whole run, and nothing is
-- written. Every stored score converts (production, read on 2026-10-10).

-- Beats for a legacy duration: in quarter beats, it is the number doubled, or
-- tripled when dotted
create function pg_temp.legacy_beats(legacy numeric, dotted boolean)
returns text
language plpgsql
as $$
declare
  quarters numeric := legacy * case when dotted then 3 else 2 end;
  divisor int;
  beats text;
begin
  if quarters <= 0 or quarters <> trunc(quarters) then
    raise exception 'Duration % (dotted: %) is no whole number of quarter beats', legacy, dotted;
  end if;
  divisor := gcd(quarters::int, 4);
  beats := case
    when divisor = 4 then (quarters::int / 4)::text
    else (quarters::int / divisor) || '/' || (4 / divisor)
  end;
  -- The lengths the renderer can show (Duration.ts): whole beats, a half, a
  -- quarter, and a dotted half or beat
  if divisor <> 4 and beats not in ('1/2', '1/4', '3/2', '3/4') then
    raise exception 'Duration % (dotted: %) is % beats, a length that can''t be shown', legacy, dotted, beats;
  end if;
  return beats;
end;
$$;

update scores
set data = jsonb_set(
  data,
  '{notes}',
  (
    select jsonb_agg(
      case
        when jsonb_typeof(note->'duration') = 'number' then
          -- A dot stays where the length has a half to write as one
          (note - 'dotted')
          || jsonb_build_object(
            'duration',
            pg_temp.legacy_beats(
              (note->>'duration')::numeric,
              coalesce((note->>'dotted')::boolean, false)
            )
          )
          || case
            when coalesce((note->>'dotted')::boolean, false)
              and pg_temp.legacy_beats((note->>'duration')::numeric, true) in ('3/2', '3/4')
            then '{"dotted": true}'::jsonb
            else '{}'::jsonb
          end
        else note
      end
      order by ord
    )
    from jsonb_array_elements(data->'notes') with ordinality as n(note, ord)
  )
)
where data_format = 'json'
  and jsonb_typeof(data->'notes') = 'array'
  and exists (
    select 1 from jsonb_array_elements(data->'notes') as n(note)
    where jsonb_typeof(note->'duration') = 'number'
  );
