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
          { sign: 'ro', register: 0, duration: '1' }, // D4
          { sign: 'tsu', register: 0, duration: '1' }, // F4
          { sign: 're', register: 0, duration: '1' }, // G4
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
        notes: [{ sign: 'ro', register: 0, duration: '1' }],
      };

      const xml = MusicXMLSerializer.serialize(scoreData);

      expect(xml).toContain('<creator type="composer">Test Composer</creator>');
    });

    it('should serialize notes with different octaves', () => {
      const scoreData: ScoreData = {
        title: 'Test',
        style: 'kinko',
        notes: [
          { sign: 'ro', register: 0, duration: '1' }, // D4 (otsu)
          { sign: 'ro', register: 1, duration: '1' }, // D5 (kan)
          { sign: 'tsu', register: 2, duration: '1' }, // F6 (daikan)
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
          {
            sign: 'tsu',
            register: 0,
            duration: '1',
            accidental: 'meri',
          }, // D#4
          {
            sign: 'tsu',
            register: 0,
            duration: '1',
            accidental: 'chu-meri',
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

    it('should fail on a note whose octave is not valid', () => {
      const scoreData: ScoreData = {
        title: 'Test',
        notes: [
          { sign: 'ro', register: 0, duration: '1' },
          { sign: 'ro', register: 3, duration: '1' },
        ],
      };

      expect(() => MusicXMLSerializer.serialize(scoreData)).toThrow(
        "Note 2 has a sign, register or accidental that isn't valid.",
      );
    });

    it('names a fingering that is not its pitch default', () => {
      const xml = MusicXMLSerializer.serialize({
        title: 'Test',
        notes: [
          { sign: 'san-no-u', register: 1, duration: '1' },
          {
            sign: 'hi',
            register: 1,
            duration: '1',
            accidental: 'meri',
          },
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
        notes: [{ rest: true, duration: '2' }],
      };

      const xml = MusicXMLSerializer.serialize(scoreData);

      expect(xml).toContain('<rest/>');
      expect(xml).toContain('<duration>8</duration>'); // 2 quarters * 4 divisions
    });

    it('should serialize dotted notes with the sounding duration', () => {
      const scoreData: ScoreData = {
        title: 'Test',
        style: 'kinko',
        notes: [{ sign: 'ro', register: 0, duration: '3/2' }],
      };

      const xml = MusicXMLSerializer.serialize(scoreData);

      expect(xml).toContain('<dot/>');
      // <duration> is the sounding length and includes the dot:
      // 3/2 quarters * 4 divisions
      expect(xml).toContain('<duration>6</duration>');
      // ...while <type> is the written value.
      expect(xml).toContain('<type>quarter</type>');
    });

    it('should order note children per the MusicXML DTD (type before dot)', () => {
      const scoreData: ScoreData = {
        title: 'Test',
        style: 'kinko',
        notes: [{ sign: 'ro', register: 0, duration: '3/2' }],
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
          { sign: 'ro', register: 0, duration: '4' }, // whole
          { sign: 'tsu', register: 0, duration: '2' }, // half
          { sign: 're', register: 0, duration: '1' }, // quarter
          { sign: 'chi', register: 0, duration: '1/2' }, // eighth
          { sign: 'ri', register: 0, duration: '1/4' }, // 16th
        ],
      };

      const xml = MusicXMLSerializer.serialize(scoreData);

      expect(xml).toContain('<type>whole</type>');
      expect(xml).toContain('<type>half</type>');
      expect(xml).toContain('<type>quarter</type>');
      expect(xml).toContain('<type>eighth</type>');
      expect(xml).toContain('<type>16th</type>');
    });

    it('should write a length no note value shows without a type', () => {
      const xml = MusicXMLSerializer.serialize({
        title: 'Test',
        notes: [{ sign: 'ro', register: 0, duration: '3' }],
      });

      expect(xml).toContain('<duration>12</duration>');
      expect(xml).not.toContain('<type>');
    });

    it('should escape XML special characters in title', () => {
      const scoreData: ScoreData = {
        title: 'Test & "Score" <with> \'special\' chars',
        style: 'kinko',
        notes: [{ sign: 'ro', register: 0, duration: '1' }],
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
          { sign: 'ro', register: 0, duration: '2' }, // D4 half
          { sign: 'tsu', register: 0, duration: '1' }, // F4 quarter
          { rest: true, duration: '1' }, // quarter rest
          { sign: 're', register: 0, duration: '3/2' }, // G4 dotted quarter
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
      expect(reparsed.notes[0].sign).toBe('ro');
      expect(reparsed.notes[1].sign).toBe('tsu');
      expect(reparsed.notes[2].rest).toBe(true);
      expect(reparsed.notes[3].sign).toBe('re');

      // Should preserve durations. Asserting only structure is what let the
      // <divisions> bug survive: every duration used to come back doubled.
      expect(reparsed.notes.map((n) => n.duration)).toEqual([
        '2',
        '1',
        '1',
        '3/2',
      ]);
    });

    it('should round-trip every supported length exactly, dotted and plain', () => {
      const notes: ScoreData['notes'] = [
        ...['4', '3', '2', '1', '3/2', '1/2', '3/4', '1/4'].map((duration) => ({
          sign: 'ro' as const,
          register: 0,
          duration,
        })),
        ...['3/2', '3/4'].map((duration) => ({
          sign: 'ro' as const,
          register: 0,
          duration,
        })),
      ];

      const reparsed = MusicXMLParser.parse(
        MusicXMLSerializer.serialize({ title: 'Durations', notes }),
      );

      expect(reparsed.notes.map((n) => n.duration)).toEqual(
        notes.map((n) => n.duration),
      );
    });

    // A Western dot would make a dotted half 3 beats, not 5/2
    it('should export a note dotted after two beats by its length alone', () => {
      const xml = MusicXMLSerializer.serialize({
        title: 'Dotted 5/2',
        notes: [{ sign: 'ro', register: 0, duration: '5/2' }],
      });

      expect(xml).not.toContain('<dot/>');
      expect(xml).not.toContain('<type>');
      expect(MusicXMLParser.parse(xml).notes[0]).toMatchObject({
        duration: '5/2',
      });
    });
  });
});
