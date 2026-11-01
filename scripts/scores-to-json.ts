/**
 * One-off: converts every score stored as MusicXML or ABC to JSON (#459).
 *
 *   npx tsx scripts/scores-to-json.ts
 *
 * Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from the environment.
 * Reading scores is public, so the anon key is enough. The script changes
 * nothing in the database. It writes two files, both gitignored because they
 * hold users' scores:
 *
 * - tmp/scores-to-json.sql: one update per score. Run it in the Supabase SQL
 *   Editor, then the migration scores_json_only.sql, then deploy.
 * - tmp/scores-originals.json: the original text of each score. Keep it
 *   outside the repository and the database. With it, the scores can be
 *   converted again when JSON holds more, such as parts (#493) and bars (#465).
 *
 * It lists each score it can't convert. Those stay as they are, and the
 * migration fails until they are fixed.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { createClient } from '@supabase/supabase-js';
import { parseScoreText } from '../src/utils/score-data';
import type { ScoreDataFormat } from '../src/api/scores';

// The MusicXML parser uses the browser's DOMParser
globalThis.DOMParser = new JSDOM().window.DOMParser;

interface StoredScore {
  id: string;
  slug: string;
  data_format: Exclude<ScoreDataFormat, 'json'>;
  data: string;
}

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

const { data: scores, error } = await createClient(url, key)
  .from('scores')
  .select('id, slug, data_format, data')
  .neq('data_format', 'json')
  .order('slug')
  .returns<StoredScore[]>();
if (error) throw error;

/** A SQL string literal: single quotes are doubled. */
const literal = (text: string) => `'${text.replaceAll("'", "''")}'`;

const updates: string[] = [];
const failures: string[] = [];
for (const score of scores) {
  try {
    const json = JSON.stringify(parseScoreText(score.data, score.data_format));
    // The format in the where clause makes a second run change nothing
    updates.push(
      `update scores set data_format = 'json', data = ${literal(json)}::jsonb` +
        ` where id = ${literal(score.id)} and data_format = ${literal(score.data_format)};`,
    );
  } catch (thrown) {
    const reason = thrown instanceof Error ? thrown.message : String(thrown);
    failures.push(`${score.slug} (${score.data_format}): ${reason}`);
  }
}

mkdirSync('tmp', { recursive: true });
writeFileSync(
  'tmp/scores-to-json.sql',
  ['begin;', ...updates, 'commit;', ''].join('\n'),
);
writeFileSync(
  'tmp/scores-originals.json',
  JSON.stringify(scores, null, 2) + '\n',
);

console.log(
  `${scores.length} MusicXML and ABC scores. ${updates.length} converted, in tmp/scores-to-json.sql. Originals in tmp/scores-originals.json.`,
);
if (failures.length > 0) {
  console.log(`Not converted (${failures.length}):`);
  for (const failure of failures) console.log(`- ${failure}`);
  process.exitCode = 1;
}
