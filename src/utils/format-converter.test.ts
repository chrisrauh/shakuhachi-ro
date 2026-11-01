/**
 * Format Converter Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  convertFormat,
  parseFormat,
  serializeFormat,
} from './format-converter';
import type { ScoreData, ScoreNote } from '../web-component/types/ScoreData';
import { FINGERINGS } from '../web-component/constants/kinko-fingerings';

describe('format-converter', () => {
  const sampleScoreData: ScoreData = {
    title: 'Test Score',
    composer: 'Test Composer',
    style: 'kinko',
    notes: [
      { written: { step: 'ro', register: 0 }, duration: '1' },
      { written: { step: 'tsu', register: 0 }, duration: '1/2' },
      { rest: true, duration: '1/2' },
      { written: { step: 're', register: 0 }, duration: '3/4' },
    ],
  };

  const sampleJSON = JSON.stringify(sampleScoreData, null, 2);

  const sampleABC = `X:1
T:Test Score
C:Test Composer
M:4/4
L:1/8
K:D

D2 F z G>
`;

  describe('parseFormat()', () => {
    it('should parse JSON format', () => {
      const result = parseFormat(sampleJSON, 'json');

      expect(result.title).toBe('Test Score');
      expect(result.notes).toHaveLength(4);
    });

    it('should parse ABC format', () => {
      const result = parseFormat(sampleABC, 'abc');

      expect(result.title).toBe('Test Score');
      expect(result.composer).toBe('Test Composer');
      expect(result.notes).toHaveLength(4); // D2 F z G>
    });

    it('should parse MusicXML format', () => {
      const musicXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>Test</work-title>
  </work>
  <part-list>
    <score-part id="P1">
      <part-name>Piano</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <note>
        <pitch>
          <step>D</step>
          <octave>4</octave>
        </pitch>
        <duration>2</duration>
      </note>
    </measure>
  </part>
</score-partwise>`;

      const result = parseFormat(musicXML, 'musicxml');

      expect(result.title).toBe('Test');
      expect(result.notes).toHaveLength(1);
    });

    it('should throw error for unsupported format', () => {
      expect(() => parseFormat('{}', 'unsupported' as any)).toThrow(
        'Unsupported input format',
      );
    });
  });

  describe('serializeFormat()', () => {
    it('should serialize to JSON format', () => {
      const result = serializeFormat(sampleScoreData, 'json');

      expect(result).toContain('"title": "Test Score"');
      expect(result).toContain('"composer": "Test Composer"');
    });

    it('should serialize to ABC format', () => {
      const result = serializeFormat(sampleScoreData, 'abc');

      expect(result).toContain('T:Test Score');
      expect(result).toContain('C:Test Composer');
      expect(result).toContain('K:D');
    });

    it('should serialize to MusicXML format', () => {
      const result = serializeFormat(sampleScoreData, 'musicxml');

      expect(result).toContain('<?xml version="1.0"');
      expect(result).toContain('<work-title>Test Score</work-title>');
      expect(result).toContain(
        '<creator type="composer">Test Composer</creator>',
      );
    });

    it('should throw error for unsupported format', () => {
      expect(() =>
        serializeFormat(sampleScoreData, 'unsupported' as any),
      ).toThrow('Unsupported output format');
    });
  });

  describe('convertFormat()', () => {
    it('should return same input if formats match', () => {
      const result = convertFormat(sampleJSON, 'json', 'json');

      expect(result).toBe(sampleJSON);
    });

    it('should convert ABC → JSON', () => {
      const result = convertFormat(sampleABC, 'abc', 'json');

      const parsed = JSON.parse(result);
      expect(parsed.title).toBe('Test Score');
      expect(parsed.composer).toBe('Test Composer');
      expect(parsed.notes).toBeDefined();
    });

    it('should convert JSON → ABC', () => {
      const result = convertFormat(sampleJSON, 'json', 'abc');

      expect(result).toContain('T:Test Score');
      expect(result).toContain('C:Test Composer');
      expect(result).toContain('K:D');
    });

    it('should convert ABC → MusicXML', () => {
      const result = convertFormat(sampleABC, 'abc', 'musicxml');

      expect(result).toContain('<?xml version="1.0"');
      expect(result).toContain('<work-title>Test Score</work-title>');
      expect(result).toContain(
        '<creator type="composer">Test Composer</creator>',
      );
    });

    it('should convert MusicXML → ABC', () => {
      const musicXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>Test Score</work-title>
  </work>
  <identification>
    <creator type="composer">Test Composer</creator>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Piano</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <note>
        <pitch>
          <step>D</step>
          <octave>4</octave>
        </pitch>
        <duration>2</duration>
      </note>
      <note>
        <pitch>
          <step>F</step>
          <octave>4</octave>
        </pitch>
        <duration>2</duration>
      </note>
    </measure>
  </part>
</score-partwise>`;

      const result = convertFormat(musicXML, 'musicxml', 'abc');

      expect(result).toContain('T:Test Score');
      expect(result).toContain('C:Test Composer');
      expect(result).toContain('D');
      expect(result).toContain('F');
    });

    it('should convert JSON → MusicXML', () => {
      const result = convertFormat(sampleJSON, 'json', 'musicxml');

      expect(result).toContain('<?xml version="1.0"');
      expect(result).toContain('<work-title>Test Score</work-title>');
      expect(result).toContain('<step>D</step>');
    });

    it('should convert MusicXML → JSON', () => {
      const musicXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>Test Score</work-title>
  </work>
  <part-list>
    <score-part id="P1">
      <part-name>Piano</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <note>
        <pitch>
          <step>D</step>
          <octave>4</octave>
        </pitch>
        <duration>2</duration>
      </note>
    </measure>
  </part>
</score-partwise>`;

      const result = convertFormat(musicXML, 'musicxml', 'json');

      const parsed = JSON.parse(result);
      expect(parsed.title).toBe('Test Score');
      expect(parsed.notes).toHaveLength(1);
    });

    it('should handle round-trip conversions', () => {
      // ABC → JSON → ABC
      const json1 = convertFormat(sampleABC, 'abc', 'json');
      const abc1 = convertFormat(json1, 'json', 'abc');

      expect(abc1).toContain('T:Test Score');
      expect(abc1).toContain('C:Test Composer');

      // JSON → ABC → JSON
      const abc2 = convertFormat(sampleJSON, 'json', 'abc');
      const json2 = convertFormat(abc2, 'abc', 'json');

      const parsed = JSON.parse(json2);
      expect(parsed.title).toBe('Test Score');
      expect(parsed.composer).toBe('Test Composer');
    });
  });
});

/**
 * MusicXML and ABC are views of the stored JSON in the editor (#459). A score
 * shown in either and saved again must come back with the same music: every
 * fingering the table names, every meri and kari, dots and rests. tempo and
 * key aren't checked: nothing outside the parsers reads them, and MusicXML
 * export doesn't write them (#472).
 */
describe('views of a JSON score lose nothing', () => {
  const fingerings: ScoreNote[] = FINGERINGS.flatMap(({ written }) =>
    written
      ? [
          {
            written: { step: written.step, register: written.register },
            duration: '1',
            ...(written.meriKari && { meriKari: written.meriKari }),
          },
        ]
      : [],
  );
  const score: ScoreData = {
    title: 'Every fingering',
    composer: 'Test Composer',
    style: 'kinko',
    notes: [
      ...fingerings,
      { written: { step: 'ro', register: 0 }, duration: '1/2' },
      { written: { step: 'tsu', register: 0 }, duration: '3/2' },
      { written: { step: 're', register: 0 }, duration: '3/4' },
      { written: { step: 'chi', register: 1 }, duration: '2' },
      { rest: true, duration: '1' },
      { rest: true, duration: '1/2' },
    ],
  };

  it.each(['musicxml', 'abc'] as const)('through %s', (format) => {
    const view = serializeFormat(score, format);
    const back = parseFormat(view, format);

    expect(back.title).toBe(score.title);
    expect(back.composer).toBe(score.composer);
    expect(back.notes).toEqual(score.notes);
  });
});
