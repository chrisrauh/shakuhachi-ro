import { describe, it, expect } from 'vitest';
import { toScoreData, parseScoreText } from './score-data';
import type { Score } from '../api/scores';
import type { ScoreData } from '../web-component/types/ScoreData';

const sampleScoreData: ScoreData = {
  title: 'Test Score',
  composer: 'Test Composer',
  style: 'kinko',
  notes: [
    { pitch: { step: 'ro', octave: 0 }, duration: 2 },
    { pitch: { step: 'tsu', octave: 0 }, duration: 1 },
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

function makeScore(data: unknown, format: 'json' | 'musicxml' | 'abc'): Score {
  return {
    id: 'test-id',
    user_id: 'test-user',
    title: 'Test',
    slug: 'test',
    data_format: format,
    data,
    created_at: '',
    updated_at: '',
    fork_count: 0,
    composer: null,
    description: null,
    forked_from: null,
    source_url: null,
    rights: null,
    source_description: null,
  };
}

describe('score-data', () => {
  describe('toScoreData()', () => {
    it('should pass JSON data through as-is (no parsing)', () => {
      const score = makeScore(sampleScoreData, 'json');
      const result = toScoreData(score);

      // Should be the same object reference — no parsing
      expect(result).toBe(sampleScoreData);
    });

    it('should parse MusicXML string data', () => {
      const score = makeScore(sampleMusicXML, 'musicxml');
      const result = toScoreData(score);

      expect(result.title).toBe('Test');
      expect(result.notes).toHaveLength(1);
    });

    it('should parse ABC string data', () => {
      const score = makeScore(sampleABC, 'abc');
      const result = toScoreData(score);

      expect(result.title).toBe('Test Score');
      expect(result.composer).toBe('Test Composer');
      expect(result.notes.length).toBeGreaterThan(0);
    });

    it('should throw for unsupported format', () => {
      const score = makeScore('data', 'unknown' as any);
      expect(() => toScoreData(score)).toThrow('Unsupported score format');
    });
  });

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
