import type { Score, ScoreDataFormat } from '../api/scores';
import type { ScoreData } from '../web-component/types/ScoreData';
import { ABCParser } from '../web-component/parser/ABCParser';
import { MusicXMLParser } from '../web-component/parser/MusicXMLParser';

export function toScoreData(score: Score): ScoreData {
  if (score.data_format === 'json') {
    return score.data as ScoreData;
  }
  return parseScoreText(score.data as string, score.data_format);
}

export function parseScoreText(
  text: string,
  format: ScoreDataFormat,
): ScoreData {
  switch (format) {
    case 'json':
      return JSON.parse(text);

    case 'musicxml':
      return MusicXMLParser.parse(text);

    case 'abc':
      return ABCParser.parse(text);

    default:
      throw new Error(`Unsupported score format: ${format}`);
  }
}
