/**
 * Format Converter Utility
 *
 * Decoupled utility for converting between all supported score formats:
 * - ABC notation
 * - JSON (native ScoreData)
 * - MusicXML
 *
 * Provides bidirectional conversion: all 6 format combinations are supported.
 */

import type { ScoreData } from '../web-component/types/ScoreData';
import type { ScoreDataFormat } from '../api/scores';
import { ABCParser } from '../web-component/parser/ABCParser';
import { ABCSerializer } from '../web-component/parser/ABCSerializer';
import { MusicXMLParser } from '../web-component/parser/MusicXMLParser';
import { MusicXMLSerializer } from '../web-component/parser/MusicXMLSerializer';

/**
 * Convert score data from one format to another
 *
 * Supported conversions (all 6 combinations):
 * - ABC ↔ JSON
 * - ABC ↔ MusicXML
 * - JSON ↔ MusicXML
 *
 * @param input - The input score data as a string
 * @param fromFormat - Source format
 * @param toFormat - Target format
 * @returns Converted score data as a string
 */
export function convertFormat(
  input: string,
  fromFormat: ScoreDataFormat,
  toFormat: ScoreDataFormat,
): string {
  // No-op if same format
  if (fromFormat === toFormat) {
    return input;
  }

  // Convert to ScoreData (intermediate format)
  const scoreData = parseFormat(input, fromFormat);

  // Convert to target format
  return serializeFormat(scoreData, toFormat);
}

/**
 * Parse input string to ScoreData based on format
 *
 * @param input - Input score data as string
 * @param format - Input format
 * @returns ScoreData object
 */
export function parseFormat(input: string, format: ScoreDataFormat): ScoreData {
  switch (format) {
    case 'json':
      return JSON.parse(input);

    case 'musicxml':
      return MusicXMLParser.parse(input);

    case 'abc':
      return ABCParser.parse(input);

    default:
      throw new Error(`Unsupported input format: ${format}`);
  }
}

/**
 * Serialize ScoreData to string based on format
 *
 * @param scoreData - ScoreData object
 * @param format - Output format
 * @returns Serialized score data as string
 */
export function serializeFormat(
  scoreData: ScoreData,
  format: ScoreDataFormat,
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(scoreData, null, 2);

    case 'musicxml':
      return MusicXMLSerializer.serialize(scoreData);

    case 'abc':
      return ABCSerializer.serialize(scoreData);

    default:
      throw new Error(`Unsupported output format: ${format}`);
  }
}
