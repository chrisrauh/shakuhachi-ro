import { ABCParser } from '../web-component/parser/ABCParser';
import type { ScoreDataFormat } from '../api/scores';
import { STRINGS } from '../constants/strings';

export function validateScoreInput(
  data: string,
  format: ScoreDataFormat,
): { valid: boolean; error?: string } {
  if (!data.trim()) return { valid: false };

  try {
    if (format === 'json') {
      JSON.parse(data);
      return { valid: true };
    } else if (format === 'abc') {
      ABCParser.parse(data);
      return { valid: true };
    } else {
      // format === 'musicxml'
      // DOMParser.parseFromString never throws — errors appear as a <parsererror> element
      const doc = new DOMParser().parseFromString(data, 'text/xml');
      if (doc.querySelector('parsererror')) {
        return {
          valid: false,
          error: STRINGS.VALIDATION.ScoreEditor.invalidMusicXML,
        };
      }
      return { valid: true };
    }
  } catch (error) {
    // Only reachable from JSON and ABC branches — DOMParser never throws
    return {
      valid: false,
      error:
        error instanceof Error
          ? error.message
          : STRINGS.VALIDATION.ScoreEditor.invalidFormat,
    };
  }
}
