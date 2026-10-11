/**
 * ScoreParser Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { ScoreParser } from './ScoreParser';
import type { OctaveMarksModifier } from '../modifiers/OctaveMarksModifier';
import type { ScoreData, ScoreNote } from '../types/ScoreData';
import type { ShakuNote } from '../notes/ShakuNote';
import { DurationMarksModifier } from '../modifiers/DurationMarksModifier';

/**
 * The slots each note takes in the column, a line beside a slot written as
 * "|": "note stroke|" is a note, then a stroke with one line
 */
function durationMarks(notes: ScoreNote[]): string[] {
  return ScoreParser.parse({ notes }).map((note: ShakuNote) => {
    const marks = note
      .getModifiers()
      .find((m) => m instanceof DurationMarksModifier);
    if (!marks) return 'note';
    return marks
      .getSlots()
      .map((slot) => slot.kind + '|'.repeat(slot.lines))
      .join(' ');
  });
}

const ro = (duration: string, dotted?: boolean): ScoreNote => ({
  pitch: { step: 'ro', octave: 0 },
  duration,
  ...(dotted && { dotted }),
});

describe('ScoreParser', () => {
  describe('parse()', () => {
    it('should parse a valid score with single note', () => {
      const scoreData: ScoreData = {
        title: 'Test Score',
        style: 'kinko',
        notes: [
          {
            pitch: { step: 'ro', octave: 0 },
            duration: '1',
          },
        ],
      };

      const notes = ScoreParser.parse(scoreData);

      expect(notes).toHaveLength(1);
      expect(notes[0].getKana()).toBe('ロ');
    });

    it('should parse notes with octave modifiers', () => {
      const scoreData: ScoreData = {
        title: 'Test Score',
        style: 'kinko',
        notes: [
          { pitch: { step: 'tsu', octave: 0 }, duration: '1' }, // One beat: no duration marks
          { pitch: { step: 'tsu', octave: 1 }, duration: '1' },
          { pitch: { step: 'tsu', octave: 2 }, duration: '1' },
        ],
      };

      const notes = ScoreParser.parse(scoreData);

      expect(notes).toHaveLength(3);

      // Otsu - no modifiers
      expect(notes[0].getModifiers()).toHaveLength(0);

      // Kan - 甲
      expect(notes[1].getModifiers()).toHaveLength(1);
      expect(
        (notes[1].getModifiers()[0] as OctaveMarksModifier).getRegister(),
      ).toBe('kan');

      // Daikan - 大甲
      expect(notes[2].getModifiers()).toHaveLength(1);
      expect(
        (notes[2].getModifiers()[0] as OctaveMarksModifier).getRegister(),
      ).toBe('daikan');
    });

    it('should parse notes with meri modifier', () => {
      const scoreData: ScoreData = {
        title: 'Test Score',
        style: 'kinko',
        notes: [
          { pitch: { step: 'ro', octave: 0 }, duration: '1', meriKari: 'meri' }, // One beat: no duration marks
        ],
      };

      const notes = ScoreParser.parse(scoreData);

      expect(notes).toHaveLength(1);
      expect(notes[0].getModifiers()).toHaveLength(1);
    });

    it('should parse notes with multiple modifiers', () => {
      const scoreData: ScoreData = {
        title: 'Test Score',
        style: 'kinko',
        notes: [
          {
            pitch: { step: 'chi', octave: 1 },
            duration: '1',
            meriKari: 'meri',
          }, // One beat: no duration marks
        ],
      };

      const notes = ScoreParser.parse(scoreData);

      expect(notes).toHaveLength(1);
      // Should have both octave and meri modifiers
      expect(notes[0].getModifiers()).toHaveLength(2);
    });

    it('should parse all valid pitch steps', () => {
      const scoreData: ScoreData = {
        title: 'Test Score',
        style: 'kinko',
        notes: [
          { pitch: { step: 'ro', octave: 0 }, duration: '1' },
          { pitch: { step: 'tsu', octave: 0 }, duration: '1' },
          { pitch: { step: 're', octave: 0 }, duration: '1' },
          { pitch: { step: 'chi', octave: 0 }, duration: '1' },
          { pitch: { step: 'ri', octave: 0 }, duration: '1' },
          { pitch: { step: 'u', octave: 0 }, duration: '1' },
          { pitch: { step: 'hi', octave: 0 }, duration: '1' },
        ],
      };

      const notes = ScoreParser.parse(scoreData);

      expect(notes).toHaveLength(7);
      expect(notes[0].getKana()).toBe('ロ');
      expect(notes[1].getKana()).toBe('ツ');
      expect(notes[2].getKana()).toBe('レ');
      expect(notes[3].getKana()).toBe('チ');
      expect(notes[4].getKana()).toBe('リ');
      expect(notes[5].getKana()).toBe('ウ');
      expect(notes[6].getKana()).toBe('ヒ');
    });

    it('should parse notes with dotted duration modifier', () => {
      const scoreData: ScoreData = {
        title: 'Test Score',
        style: 'kinko',
        notes: [
          { pitch: { step: 'ro', octave: 0 }, duration: '3/2', dotted: true },
          { pitch: { step: 'tsu', octave: 0 }, duration: '1', dotted: false },
        ],
      };

      const notes = ScoreParser.parse(scoreData);

      expect(notes).toHaveLength(2);

      expect(durationMarks(scoreData.notes)).toEqual(['note dot', 'note']);
    });

    it('should parse rest notes correctly', () => {
      const scoreData: ScoreData = {
        title: 'Test Score',
        style: 'kinko',
        notes: [
          { rest: true, duration: '1' },
          { pitch: { step: 'ro', octave: 0 }, duration: '1' },
        ],
      };

      const notes = ScoreParser.parse(scoreData);

      expect(notes).toHaveLength(2);
      // First note is a rest, second is a regular note
      expect(notes[1].getKana()).toBe('ロ');
    });

    it('should parse notes with multiple modifiers including duration dot', () => {
      const scoreData: ScoreData = {
        title: 'Test Score',
        style: 'kinko',
        notes: [
          {
            pitch: { step: 'chi', octave: 1 },
            duration: '3/2',
            meriKari: 'meri',
            dotted: true,
          }, // A beat and its dot: no duration lines
        ],
      };

      const notes = ScoreParser.parse(scoreData);

      expect(notes).toHaveLength(1);
      // Should have octave, meri, and duration dot modifiers
      expect(notes[0].getModifiers()).toHaveLength(3);
    });
  });

  describe('validate()', () => {
    it('should throw error if score data is null', () => {
      expect(() => ScoreParser.parse(null as any)).toThrow(
        'Score data is required',
      );
    });

    it('should parse minimal data without title or style', () => {
      const minimalData = {
        notes: [{ pitch: { step: 'ro', octave: 0 }, duration: '1' }],
      } as any;

      const parsed = ScoreParser.parse(minimalData);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].getKana()).toBe('ロ');
    });

    it('should throw error if notes is not an array', () => {
      const scoreData = {
        notes: 'not an array',
      } as any;

      expect(() => ScoreParser.parse(scoreData)).toThrow(
        'Score notes must be an array',
      );
    });

    it('parses an empty score, which is how new scores start, to no notes', () => {
      expect(ScoreParser.parse({ notes: [] } as any)).toEqual([]);
    });

    it('should throw error if note is missing pitch', () => {
      const scoreData = {
        notes: [{ duration: '1' }],
      } as any;

      expect(() => ScoreParser.parse(scoreData)).toThrow(
        'Note 1 is missing pitch',
      );
    });

    it('should throw error if note is missing pitch.step', () => {
      const scoreData = {
        notes: [{ pitch: { octave: 0 }, duration: '1' }],
      } as any;

      expect(() => ScoreParser.parse(scoreData)).toThrow(
        'Note 1 is missing pitch.step',
      );
    });

    it('should throw error if note is missing pitch.octave', () => {
      const scoreData = {
        notes: [{ pitch: { step: 'ro' }, duration: '1' }],
      } as any;

      expect(() => ScoreParser.parse(scoreData)).toThrow(
        'Note 1 is missing pitch.octave',
      );
    });

    it('should throw error if note is missing duration', () => {
      const scoreData = {
        notes: [{ pitch: { step: 'ro', octave: 0 } }],
      } as any;

      expect(() => ScoreParser.parse(scoreData)).toThrow(
        'Note 1 is missing duration',
      );
    });

    it('should throw error if octave is out of range (too low)', () => {
      const scoreData: ScoreData = {
        title: 'Test',
        style: 'kinko',
        notes: [{ pitch: { step: 'ro', octave: -1 }, duration: '1' }],
      };

      expect(() => ScoreParser.parse(scoreData)).toThrow(
        'Note 1 has invalid octave: -1',
      );
    });

    it('should throw error if octave is out of range (too high)', () => {
      const scoreData: ScoreData = {
        title: 'Test',
        style: 'kinko',
        notes: [{ pitch: { step: 'ro', octave: 3 }, duration: '1' }],
      };

      expect(() => ScoreParser.parse(scoreData)).toThrow(
        'Note 1 has invalid octave: 3',
      );
    });

    it('should throw error if meriKari is not a known value', () => {
      const scoreData = {
        notes: [
          {
            pitch: { step: 'ro', octave: 0 },
            duration: '1',
            meriKari: 'merri',
          },
        ],
      } as unknown as ScoreData;

      expect(() => ScoreParser.parse(scoreData)).toThrow(
        'Note 1 has invalid meriKari: merri',
      );
    });

    it('should throw error if step is not a known value, numbering notes from 1', () => {
      const scoreData = {
        notes: [
          { pitch: { step: 'ro', octave: 0 }, duration: '1' },
          { pitch: { step: 'go', octave: 0 }, duration: '1' },
        ],
      } as unknown as ScoreData;

      expect(() => ScoreParser.parse(scoreData)).toThrow(
        'Note 2 has invalid pitch.step: go. Must be one of: ro, tsu,',
      );
    });

    it('should throw error if duration is a number, the form before beats', () => {
      const scoreData = {
        notes: [{ pitch: { step: 'ro', octave: 0 }, duration: 2 }],
      } as unknown as ScoreData;

      expect(() => ScoreParser.parse(scoreData)).toThrow(
        'Note 1 has invalid duration: 2',
      );
    });

    it('should throw error if rest note is missing duration', () => {
      const scoreData = {
        notes: [{ rest: true }],
      } as any;

      expect(() => ScoreParser.parse(scoreData)).toThrow(
        'Note 1 is a rest and is missing duration',
      );
    });

    it('should allow rest notes without pitch', () => {
      const scoreData = {
        notes: [{ rest: true, duration: '1' }],
      } as any;

      // Should not throw
      const notes = ScoreParser.parse(scoreData);
      expect(notes).toHaveLength(1);
    });
  });

  describe('durations in beats', () => {
    it('draws one line for half a beat and two for a quarter', () => {
      expect(durationMarks([ro('1/2'), ro('1/4')])).toEqual([
        'note|',
        'note||',
      ]);
    });

    it('draws a stroke for each beat after the first', () => {
      expect(durationMarks([ro('1'), ro('2'), ro('4')])).toEqual([
        'note',
        'note stroke',
        'note stroke stroke stroke',
      ]);
    });

    it('writes a half as a dot, dotted or not', () => {
      expect(
        durationMarks([
          ro('3/2', true),
          ro('5/2', true),
          ro('3/4', true),
          ro('3/2'),
          ro('3/4'),
        ]),
      ).toEqual([
        'note dot',
        'note stroke dot',
        'note| dot|',
        'note dot',
        'note| dot|',
      ]);
    });

    it('draws duration marks on rests too', () => {
      const rest = (duration: string): ScoreNote => ({ rest: true, duration });
      expect(durationMarks([rest('1'), rest('1/2'), rest('2')])).toEqual([
        'note',
        'note|',
        'note stroke',
      ]);
    });

    it('accepts every supported length', () => {
      const lengths = ['1/4', '1/2', '3/4', '1', '3/2', '2', '5/2', '7/2', '6'];
      expect(() =>
        ScoreParser.validate({ notes: lengths.map((d) => ro(d)) }),
      ).not.toThrow();
    });

    it('rejects a duration that is not a fraction in lowest terms', () => {
      for (const duration of ['0.5', '2/4', '2/1', '0', '1/0', '', ' 1']) {
        expect(() => ScoreParser.validate({ notes: [ro(duration)] })).toThrow(
          `Note 1 has invalid duration: "${duration}"`,
        );
      }
      expect(() =>
        ScoreParser.validate({ notes: [{ rest: true, duration: true }] }),
      ).toThrow('Note 1 has invalid duration: true');
    });

    it('rejects a length notation cannot show', () => {
      expect(() => ScoreParser.validate({ notes: [ro('5/4')] })).toThrow(
        'Note 1 has invalid duration: "5/4". Shakuhachi notation can show',
      );
      expect(() =>
        ScoreParser.validate({ notes: [{ rest: true, duration: '1/8' }] }),
      ).toThrow('Note 1 has invalid duration: "1/8"');
    });

    it('rejects a dot on a length without a half', () => {
      expect(() => ScoreParser.validate({ notes: [ro('1', true)] })).toThrow(
        'Note 1 is dotted, but its duration, "1", has no half',
      );
    });
  });

  describe('parseJSON()', () => {
    it('should parse valid JSON string', () => {
      const json = JSON.stringify({
        title: 'Test Score',
        style: 'kinko',
        notes: [{ pitch: { step: 'ro', octave: 0 }, duration: '1' }],
      });

      const notes = ScoreParser.parseJSON(json);

      expect(notes).toHaveLength(1);
      expect(notes[0].getKana()).toBe('ロ');
    });

    it('should throw error for invalid JSON', () => {
      const invalidJson = '{ invalid json }';

      expect(() => ScoreParser.parseJSON(invalidJson)).toThrow('Invalid JSON');
    });

    it('should preserve the original parse error as cause', () => {
      const invalidJson = '{ invalid json }';

      try {
        ScoreParser.parseJSON(invalidJson);
        expect.unreachable('parseJSON should have thrown');
      } catch (error) {
        expect((error as Error).cause).toBeInstanceOf(SyntaxError);
      }
    });
  });
});
