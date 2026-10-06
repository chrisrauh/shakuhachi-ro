import { ABCParser } from '../web-component/parser/ABCParser';
import { MusicXMLParser } from '../web-component/parser/MusicXMLParser';
import { ScoreParser } from '../web-component/parser/ScoreParser';
import type { ScoreDataFormat } from '../api/scores';
import { STRINGS } from '../constants/strings';

export function validateScoreInput(
  data: string,
  format: ScoreDataFormat,
): { valid: boolean; error?: string } {
  if (!data.trim()) return { valid: false };

  try {
    if (format === 'json') {
      // The same shape check the renderer applies, so what saves also renders
      ScoreParser.validate(JSON.parse(data));
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
          error: STRINGS.VALIDATION.scoreInput.invalidMusicXML,
        };
      }
      // The same import the score page runs, so what saves also renders
      MusicXMLParser.parse(data);
      return { valid: true };
    }
  } catch (error) {
    return {
      valid: false,
      error:
        error instanceof Error
          ? error.message
          : STRINGS.VALIDATION.scoreInput.invalidFormat,
    };
  }
}
