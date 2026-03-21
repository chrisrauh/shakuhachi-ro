/**
 * Score Data Utilities
 *
 * Centralized format dispatch for converting score data to the ScoreData format
 * required by the renderer and web component.
 *
 * Two functions serve two distinct input contracts:
 * - toScoreData: takes a Score DB record (JSON data is pre-parsed Supabase JSONB)
 * - parseScoreText: takes raw text from a text field (all formats are strings)
 *
 * The editor's text-manipulation conversions (format switching) live separately
 * in format-converter.ts — that serves a different use case (string ↔ string).
 */

import type { Score, ScoreDataFormat } from '../api/scores';
import type { ScoreData } from '../web-component/types/ScoreData';

/**
 * Convert a Score record (from Supabase) to the ScoreData format.
 *
 * JSON scores: data arrives as a pre-parsed object (Supabase JSONB) — passed through directly.
 * MusicXML/ABC: data arrives as a string — parsed via dynamically-imported parsers.
 */
export async function toScoreData(score: Score): Promise<ScoreData> {
  if (score.data_format === 'json') {
    return score.data as ScoreData;
  }
  return parseScoreText(score.data as string, score.data_format);
}

/**
 * Parse a raw score text string into ScoreData.
 *
 * Used by the editor's preview rendering, where the input is always
 * a string from the text area regardless of format.
 *
 * Parsers are dynamically imported so that JSON viewers (the most common format)
 * load zero parser code.
 */
export async function parseScoreText(
  text: string,
  format: ScoreDataFormat,
): Promise<ScoreData> {
  switch (format) {
    case 'json':
      return JSON.parse(text);

    case 'musicxml': {
      const { MusicXMLParser } =
        await import('../web-component/parser/MusicXMLParser');
      return MusicXMLParser.parse(text);
    }

    case 'abc': {
      const { ABCParser } = await import('../web-component/parser/ABCParser');
      return ABCParser.parse(text);
    }

    default:
      throw new Error(`Unsupported score format: ${format}`);
  }
}
