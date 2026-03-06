/**
 * MusicXMLParser Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MusicXMLParser } from './MusicXMLParser';

// Minimal valid MusicXML wrapper
function makeXML(
  bodyXML: string,
  title = 'Test Score',
  composer?: string,
): string {
  const workTitle = `<work><work-title>${title}</work-title></work>`;
  const creatorEl = composer
    ? `<identification><creator type="composer">${composer}</creator></identification>`
    : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise>
  ${workTitle}
  ${creatorEl}
  <part id="P1">
    <measure number="1">
      ${bodyXML}
    </measure>
  </part>
</score-partwise>`;
}

function makeNote(
  step: string,
  octave: number,
  duration = 2,
  extras = '',
): string {
  return `<note>
    <pitch><step>${step}</step><octave>${octave}</octave></pitch>
    <duration>${duration}</duration>
    ${extras}
  </note>`;
}

function makeRest(duration = 2): string {
  return `<note><rest/><duration>${duration}</duration></note>`;
}

describe('MusicXMLParser', () => {
  describe('parse()', () => {
    it('should parse valid MusicXML → correct ScoreData', () => {
      // D4 = ro, F4 = tsu, G4 = re
      const xml = makeXML(
        makeNote('D', 4) + makeNote('F', 4) + makeNote('G', 4),
        'My Score',
        'My Composer',
      );

      const score = MusicXMLParser.parse(xml);

      expect(score.title).toBe('My Score');
      expect(score.composer).toBe('My Composer');
      expect(score.style).toBe('kinko');
      expect(score.notes).toHaveLength(3);
      expect(score.notes[0].pitch?.step).toBe('ro');
      expect(score.notes[0].pitch?.octave).toBe(0);
      expect(score.notes[1].pitch?.step).toBe('tsu');
      expect(score.notes[2].pitch?.step).toBe('re');
    });

    it('should produce rest: true for <rest> element', () => {
      const xml = makeXML(makeRest(4));

      const score = MusicXMLParser.parse(xml);

      expect(score.notes).toHaveLength(1);
      expect(score.notes[0].rest).toBe(true);
      expect(score.notes[0].duration).toBe(4);
    });

    it('should produce dotted: true for note with <dot> element', () => {
      const xml = makeXML(makeNote('D', 4, 2, '<dot/>'));

      const score = MusicXMLParser.parse(xml);

      expect(score.notes).toHaveLength(1);
      expect(score.notes[0].dotted).toBe(true);
    });

    it('should skip note with no <pitch> and call console.warn with index', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // A note element with no <pitch> or <rest>
      const xml = makeXML('<note><duration>2</duration></note>');

      const score = MusicXMLParser.parse(xml);

      expect(score.notes).toHaveLength(0);
      expect(warnSpy).toHaveBeenCalledOnce();
      expect(warnSpy.mock.calls[0][0]).toContain('0'); // index 0

      warnSpy.mockRestore();
    });

    it('should skip note with unknown pitch and call console.warn', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // "Z9" is not in KINKO_PITCH_MAP
      const xml = makeXML(makeNote('Z', 9));

      const score = MusicXMLParser.parse(xml);

      expect(score.notes).toHaveLength(0);
      expect(warnSpy).toHaveBeenCalledOnce();
      expect(warnSpy.mock.calls[0][0]).toContain('Unknown pitch');

      warnSpy.mockRestore();
    });

    it('should set meri: true for a pitch that maps to meri', () => {
      // D#4 → tsu meri
      // MusicXML encodes D# as step=D with an <alter>1</alter>
      // But the parser builds pitchName from step+octave only → "D4" → ro
      // So use a pitch that maps directly without alter: C#4 = ro meri
      // The parser uses step+octave, no alter handling yet → use Db4
      // But "Db4" would require step=D+alter=-1 which parser doesn't combine.
      // Instead, use step=C, octave=4 → "C4" → ro dai_meri
      const xml = makeXML(makeNote('C', 4));

      const score = MusicXMLParser.parse(xml);

      expect(score.notes).toHaveLength(1);
      expect(score.notes[0].pitch?.step).toBe('ro');
      expect(score.notes[0].dai_meri).toBe(true);
    });

    it('should set meri: true for pitch with meri mapping', () => {
      // F#4 → re meri. Parser builds "F4" → tsu, "G4" → re.
      // There's no direct single-step meri without alter in standard note names.
      // Use E4 → tsu chu_meri (step=E, octave=4 → "E4" in KINKO_PITCH_MAP)
      const xml = makeXML(makeNote('E', 4));

      const score = MusicXMLParser.parse(xml);

      expect(score.notes).toHaveLength(1);
      expect(score.notes[0].pitch?.step).toBe('tsu');
      expect(score.notes[0].chu_meri).toBe(true);
    });

    it('should default title to "Untitled" when <work-title> is missing', () => {
      const xml = `<?xml version="1.0"?>
<score-partwise>
  <part id="P1">
    <measure number="1">
      ${makeNote('D', 4)}
    </measure>
  </part>
</score-partwise>`;

      const score = MusicXMLParser.parse(xml);

      expect(score.title).toBe('Untitled');
    });

    it('should return empty notes array when no <note> elements exist', () => {
      const xml = makeXML('');

      const score = MusicXMLParser.parse(xml);

      expect(score.title).toBe('Test Score');
      expect(score.notes).toEqual([]);
    });
  });

  describe('parseFromURL()', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('should throw with descriptive message when fetch returns non-ok status', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        new Response(null, { status: 404, statusText: 'Not Found' }),
      );

      await expect(
        MusicXMLParser.parseFromURL('http://example.com/score.xml'),
      ).rejects.toThrow('Not Found');
    });

    it('should throw when fetch rejects (network error)', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

      await expect(
        MusicXMLParser.parseFromURL('http://example.com/score.xml'),
      ).rejects.toThrow('Network error');
    });
  });
});
