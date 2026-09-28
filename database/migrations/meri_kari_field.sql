-- Replace the meri, chu_meri and dai_meri note flags with one meriKari field (#288)
-- Run this migration in Supabase SQL Editor before the macOS visual run on the
-- PR, and deploy soon after: the visual tests load akatombo, whose meri notes use
-- the old flags. Between running it and deploying, production shows JSON scores
-- without their meri marks. That's acceptable while all stored scores are test data.
--
-- Only JSON scores store notes as objects; MusicXML and ABC scores are text and
-- are unaffected. Every stored score is test data (the app is unreleased), so
-- this only keeps those scores' meri marks. Where a note had more than one flag,
-- the strongest wins: dai-meri, then meri, then chu-meri.

update scores
set data = jsonb_set(
  data,
  '{notes}',
  (
    select jsonb_agg(
      case
        when note ? 'meri' or note ? 'chu_meri' or note ? 'dai_meri' then
          (note - 'meri' - 'chu_meri' - 'dai_meri')
          || coalesce(
            case
              when (note->>'dai_meri')::boolean then '{"meriKari": "dai-meri"}'::jsonb
              when (note->>'meri')::boolean then '{"meriKari": "meri"}'::jsonb
              when (note->>'chu_meri')::boolean then '{"meriKari": "chu-meri"}'::jsonb
            end,
            '{}'::jsonb
          )
        else note
      end
      order by ord
    )
    from jsonb_array_elements(data->'notes') with ordinality as n(note, ord)
  )
)
where data_format = 'json'
  and jsonb_typeof(data->'notes') = 'array'
  and jsonb_array_length(data->'notes') > 0
  and exists (
    select 1 from jsonb_array_elements(data->'notes') as n(note)
    where note ? 'meri' or note ? 'chu_meri' or note ? 'dai_meri'
  );
