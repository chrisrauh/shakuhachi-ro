import { describe, it, expect } from 'vitest';
import { parseScoreText } from './score-data';
import type { ScoreData } from '../web-component/types/ScoreData';

const sampleScoreData: ScoreData = {
  title: 'Test Score',
  composer: 'Test Composer',
  style: 'kinko',
  notes: [
    { written: { step: 'ro', register: 0 }, duration: '1' },
    { written: { step: 'tsu', register: 0 }, duration: '1/2' },
  ],
};

const sampleJSON = JSON.stringify(sampleScoreData, null, 2);

const sampleMusicXML = `<?xml version="1.0" encoding="UTF-8"?>
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

const sampleABC = `X:1
T:Test Score
C:Test Composer
M:4/4
L:1/8
K:D

D2 F
`;

describe('score-data', () => {
  describe('parseScoreText()', () => {
    it('should parse JSON text', () => {
      const result = parseScoreText(sampleJSON, 'json');

      expect(result.title).toBe('Test Score');
      expect(result.notes).toHaveLength(2);
    });

    it('should parse MusicXML text', () => {
      const result = parseScoreText(sampleMusicXML, 'musicxml');

      expect(result.title).toBe('Test');
      expect(result.notes).toHaveLength(1);
    });

    it('should parse ABC text', () => {
      const result = parseScoreText(sampleABC, 'abc');

      expect(result.title).toBe('Test Score');
      expect(result.notes.length).toBeGreaterThan(0);
    });

    it('should throw for unsupported format', () => {
      expect(() => parseScoreText('data', 'unknown' as any)).toThrow(
        'Unsupported score format',
      );
    });
  });
});
