/**
 * MusicXMLSerializer Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { MusicXMLSerializer } from './MusicXMLSerializer';
import { MusicXMLParser } from './MusicXMLParser';
import type { ScoreData } from '../types/ScoreData';

describe('MusicXMLSerializer', () => {
  describe('serialize()', () => {
    it('should serialize simple ScoreData to valid MusicXML', () => {
      const scoreData: ScoreData = {
        title: 'Test Score',
        style: 'kinko',
        notes: [
          { pitch: { step: 'ro', octave: 0 }, duration: 1 }, // D4
          { pitch: { step: 'tsu', octave: 0 }, duration: 1 }, // F4
          { pitch: { step: 're', octave: 0 }, duration: 1 }, // G4
        ],
      };

      const xml = MusicXMLSerializer.serialize(scoreData);

      expect(xml).toContain('<?xml version="1.0"');
      expect(xml).toContain('<score-partwise');
      expect(xml).toContain('<work-title>Test Score</work-title>');
      expect(xml).toContain('<step>D</step>');
      expect(xml).toContain('<step>F</step>');
      expect(xml).toContain('<step>G</step>');
      expect(xml).toContain('<octave>4</octave>');
    });

    it('should serialize ScoreData with composer', () => {
      const scoreData: ScoreData = {
        title: 'Test Score',
        composer: 'Test Composer',
        style: 'kinko',
        notes: [{ pitch: { step: 'ro', octave: 0 }, duration: 1 }],
      };

      const xml = MusicXMLSerializer.serialize(scoreData);

      expect(xml).toContain('<creator type="composer">Test Composer</creator>');
    });

    it('should serialize notes with different octaves', () => {
      const scoreData: ScoreData = {
        title: 'Test',
        style: 'kinko',
        notes: [
          { pitch: { step: 'ro', octave: 0 }, duration: 1 }, // D4 (otsu)
          { pitch: { step: 'ro', octave: 1 }, duration: 1 }, // D5 (kan)
          { pitch: { step: 'tsu', octave: 2 }, duration: 1 }, // F6 (daikan)
        ],
      };

      const xml = MusicXMLSerializer.serialize(scoreData);

      // Should have D at different octaves
      expect(xml).toContain('<octave>4</octave>');
      expect(xml).toContain('<octave>5</octave>');
      expect(xml).toContain('<octave>6</octave>');
    });

    it('should write each fingering as its note in the pitch table', () => {
      const scoreData: ScoreData = {
        title: 'Test',
        style: 'kinko',
        notes: [
          { pitch: { step: 'tsu', octave: 0 }, duration: 1, meriKari: 'meri' }, // D#4
          {
            pitch: { step: 'tsu', octave: 0 },
            duration: 1,
            meriKari: 'chu-meri',
          }, // E4
        ],
      };

      const pitches = [
        ...MusicXMLSerializer.serialize(scoreData).matchAll(
          /<pitch>([\s\S]*?)<\/pitch>/g,
        ),
      ].map((m) => m[1].replace(/\s+/g, ''));

      expect(pitches).toEqual([
        '<step>D</step><alter>1</alter><octave>4</octave>',
        '<step>E</step><octave>4</octave>',
      ]);
    });

    it('should fail on a fingering the table has no note for', () => {
      const scoreData: ScoreData = {
        title: 'Test',
        style: 'kinko',
        notes: [
          { pitch: { step: 'ro', octave: 0 }, duration: 1 },
          { pitch: { step: 'ri', octave: 1 }, duration: 1 },
        ],
      };

      expect(() => MusicXMLSerializer.serialize(scoreData)).toThrow(
        "Note 2: ri in kan has no Western note in the fingering table, so the score can't be converted to MusicXML",
      );
    });

    it('names a fingering that is not its pitch default', () => {
      const xml = MusicXMLSerializer.serialize({
        title: 'Test',
        notes: [
          { pitch: { step: 'san-no-u', octave: 1 }, duration: 1 },
          { pitch: { step: 'hi', octave: 1 }, duration: 1, meriKari: 'meri' },
        ],
      });

      // Both are B♭5; hi meri is the default, so only san no u is named
      expect(xml.match(/<fingering>.*<\/fingering>/g)).toEqual([
        '<fingering>san-no-u</fingering>',
      ]);
    });

    it('should serialize rests', () => {
      const scoreData: ScoreData = {
        title: 'Test',
        style: 'kinko',
        notes: [{ rest: true, duration: 2 }],
      };

      const xml = MusicXMLSerializer.serialize(scoreData);

      expect(xml).toContain('<rest/>');
      expect(xml).toContain('<duration>16</duration>'); // 2 quarters * 8 divisions
    });

    it('should serialize dotted notes with the sounding duration', () => {
      const scoreData: ScoreData = {
        title: 'Test',
        style: 'kinko',
        notes: [
          { pitch: { step: 'ro', octave: 0 }, duration: 1, dotted: true },
        ],
      };

      const xml = MusicXMLSerializer.serialize(scoreData);

      expect(xml).toContain('<dot/>');
      // <duration> is the sounding length and includes the dot:
      // 1 quarter * 1.5 * 8 divisions
      expect(xml).toContain('<duration>12</duration>');
      // ...while <type> stays the base value.
      expect(xml).toContain('<type>quarter</type>');
    });

    it('should order note children per the MusicXML DTD (type before dot)', () => {
      const scoreData: ScoreData = {
        title: 'Test',
        style: 'kinko',
        notes: [
          { pitch: { step: 'ro', octave: 0 }, duration: 1, dotted: true },
        ],
      };

      const xml = MusicXMLSerializer.serialize(scoreData);

      expect(xml.indexOf('<type>')).toBeLessThan(xml.indexOf('<dot/>'));
      expect(xml.indexOf('<duration>')).toBeLessThan(xml.indexOf('<type>'));
    });

    it('should serialize different durations with correct types', () => {
      const scoreData: ScoreData = {
        title: 'Test',
        style: 'kinko',
        notes: [
          { pitch: { step: 'ro', octave: 0 }, duration: 4 }, // whole
          { pitch: { step: 'tsu', octave: 0 }, duration: 2 }, // half
          { pitch: { step: 're', octave: 0 }, duration: 1 }, // quarter
          { pitch: { step: 'chi', octave: 0 }, duration: 0.5 }, // eighth
        ],
      };

      const xml = MusicXMLSerializer.serialize(scoreData);

      expect(xml).toContain('<type>whole</type>');
      expect(xml).toContain('<type>half</type>');
      expect(xml).toContain('<type>quarter</type>');
      expect(xml).toContain('<type>eighth</type>');
    });

    it('should escape XML special characters in title', () => {
      const scoreData: ScoreData = {
        title: 'Test & "Score" <with> \'special\' chars',
        style: 'kinko',
        notes: [{ pitch: { step: 'ro', octave: 0 }, duration: 1 }],
      };

      const xml = MusicXMLSerializer.serialize(scoreData);

      expect(xml).toContain('&amp;');
      expect(xml).toContain('&quot;');
      expect(xml).toContain('&lt;');
      expect(xml).toContain('&gt;');
      expect(xml).toContain('&apos;');
    });

    it('should round-trip: ScoreData → MusicXML → ScoreData preserves basic structure', () => {
      const originalScoreData: ScoreData = {
        title: 'Round Trip Test',
        composer: 'Test Composer',
        style: 'kinko',
        notes: [
          { pitch: { step: 'ro', octave: 0 }, duration: 2 }, // D4 half
          { pitch: { step: 'tsu', octave: 0 }, duration: 1 }, // F4 quarter
          { rest: true, duration: 1 }, // quarter rest
          { pitch: { step: 're', octave: 0 }, duration: 1, dotted: true }, // G4 dotted quarter
        ],
      };

      const xml = MusicXMLSerializer.serialize(originalScoreData);
      const reparsed = MusicXMLParser.parse(xml);

      // Should have same title and composer
      expect(reparsed.title).toBe('Round Trip Test');
      expect(reparsed.composer).toBe('Test Composer');

      // Should have same number of notes
      expect(reparsed.notes).toHaveLength(4);

      // Should preserve pitches
      expect(reparsed.notes[0].pitch?.step).toBe('ro');
      expect(reparsed.notes[1].pitch?.step).toBe('tsu');
      expect(reparsed.notes[2].rest).toBe(true);
      expect(reparsed.notes[3].pitch?.step).toBe('re');

      // Should preserve dotted flag
      expect(reparsed.notes[3].dotted).toBe(true);

      // Should preserve durations. Asserting only structure is what let the
      // <divisions> bug survive: every duration used to come back doubled.
      expect(reparsed.notes.map((n) => n.duration)).toEqual([2, 1, 1, 1]);
    });

    it('should round-trip every supported duration exactly, dotted and plain', () => {
      const durations = [4, 2, 1, 0.5, 0.25];
      const notes: ScoreData['notes'] = durations.flatMap((duration) => [
        { pitch: { step: 'ro' as const, octave: 0 }, duration },
        { pitch: { step: 'ro' as const, octave: 0 }, duration, dotted: true },
      ]);

      const reparsed = MusicXMLParser.parse(
        MusicXMLSerializer.serialize({ title: 'Durations', notes }),
      );

      expect(reparsed.notes.map((n) => n.duration)).toEqual(
        notes.map((n) => n.duration),
      );
      expect(reparsed.notes.map((n) => n.dotted ?? false)).toEqual(
        notes.map((n) => n.dotted ?? false),
      );
    });
  });
});
