/**
 * ScoreParser Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { ScoreParser } from './ScoreParser';
import type { ScoreData } from '../types/ScoreData';

describe('ScoreParser', () => {
  describe('parse()', () => {
    it('should parse a valid score with single note', () => {
      const scoreData: ScoreData = {
        title: 'Test Score',
        style: 'kinko',
        notes: [
          {
            pitch: { step: 'ro', octave: 0 },
            duration: 1
          }
        ]
      };

      const notes = ScoreParser.parse(scoreData);

      expect(notes).toHaveLength(1);
      expect(notes[0].getKana()).toBe('ロ');
      expect(notes[0].getDuration()).toBe('q');
    });

    it('should parse notes with octave modifiers', () => {
      const scoreData: ScoreData = {
        title: 'Test Score',
        style: 'kinko',
        notes: [
          { pitch: { step: 'tsu', octave: 0 }, duration: 4 },  // Use whole notes (no duration lines)
          { pitch: { step: 'tsu', octave: 1 }, duration: 4 },
          { pitch: { step: 'tsu', octave: 2 }, duration: 4 }
        ]
      };

      const notes = ScoreParser.parse(scoreData);

      expect(notes).toHaveLength(3);

      // Otsu - no modifiers (whole notes don't get duration lines)
      expect(notes[0].getModifiers()).toHaveLength(0);

      // Kan - 1 octave dot
      expect(notes[1].getModifiers()).toHaveLength(1);

      // Daikan - 2 octave dots
      expect(notes[2].getModifiers()).toHaveLength(1);
    });

    it('should parse notes with meri modifier', () => {
      const scoreData: ScoreData = {
        title: 'Test Score',
        style: 'kinko',
        notes: [
          { pitch: { step: 'ro', octave: 0 }, duration: 4, meri: true }  // Use whole note
        ]
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
          { pitch: { step: 'chi', octave: 1 }, duration: 4, meri: true }  // Use whole note
        ]
      };

      const notes = ScoreParser.parse(scoreData);

      expect(notes).toHaveLength(1);
      // Should have both octave and meri modifiers
      expect(notes[0].getModifiers()).toHaveLength(2);
    });

    it('should map durations correctly', () => {
      const scoreData: ScoreData = {
        title: 'Test Score',
        style: 'kinko',
        notes: [
          { pitch: { step: 'ro', octave: 0 }, duration: 1 },
          { pitch: { step: 'tsu', octave: 0 }, duration: 2 },
          { pitch: { step: 're', octave: 0 }, duration: 4 }
        ]
      };

      const notes = ScoreParser.parse(scoreData);

      expect(notes[0].getDuration()).toBe('q'); // quarter
      expect(notes[1].getDuration()).toBe('h'); // half
      expect(notes[2].getDuration()).toBe('w'); // whole
    });

    it('should parse all valid pitch steps', () => {
      const scoreData: ScoreData = {
        title: 'Test Score',
        style: 'kinko',
        notes: [
          { pitch: { step: 'ro', octave: 0 }, duration: 1 },
          { pitch: { step: 'tsu', octave: 0 }, duration: 1 },
          { pitch: { step: 're', octave: 0 }, duration: 1 },
          { pitch: { step: 'chi', octave: 0 }, duration: 1 },
          { pitch: { step: 'ri', octave: 0 }, duration: 1 },
          { pitch: { step: 'u', octave: 0 }, duration: 1 },
          { pitch: { step: 'hi', octave: 0 }, duration: 1 }
        ]
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
          { pitch: { step: 'ro', octave: 0 }, duration: 1, dotted: true },
          { pitch: { step: 'tsu', octave: 0 }, duration: 1, dotted: false }
        ]
      };

      const notes = ScoreParser.parse(scoreData);

      expect(notes).toHaveLength(2);

      // First note should have DurationDotModifier
      const firstNoteModifiers = notes[0].getModifiers();
      const hasDurationDot = firstNoteModifiers.some(
        (m) => m.constructor.name === 'DurationDotModifier'
      );
      expect(hasDurationDot).toBe(true);

      // Second note should NOT have DurationDotModifier
      const secondNoteModifiers = notes[1].getModifiers();
      const hasNoDurationDot = secondNoteModifiers.every(
        (m) => m.constructor.name !== 'DurationDotModifier'
      );
      expect(hasNoDurationDot).toBe(true);
    });

    it('should parse rest notes correctly', () => {
      const scoreData: ScoreData = {
        title: 'Test Score',
        style: 'kinko',
        notes: [
          { rest: true, duration: 2 },
          { pitch: { step: 'ro', octave: 0 }, duration: 1 }
        ]
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
          { pitch: { step: 'chi', octave: 1 }, duration: 4, meri: true, dotted: true }  // Use whole note
        ]
      };

      const notes = ScoreParser.parse(scoreData);

      expect(notes).toHaveLength(1);
      // Should have octave, meri, and duration dot modifiers (no duration lines for whole notes)
      expect(notes[0].getModifiers()).toHaveLength(3);
    });
  });

  describe('validate()', () => {
    it('should throw error if score data is null', () => {
      expect(() => ScoreParser.parse(null as any)).toThrow('Score data is required');
    });

    it('should throw error if title is missing', () => {
      const scoreData = {
        style: 'kinko',
        notes: []
      } as any;

      expect(() => ScoreParser.parse(scoreData)).toThrow('Score title is required');
    });

    it('should throw error if style is missing', () => {
      const scoreData = {
        title: 'Test',
        notes: []
      } as any;

      expect(() => ScoreParser.parse(scoreData)).toThrow('Score style is required');
    });

    it('should throw error if notes is not an array', () => {
      const scoreData = {
        title: 'Test',
        style: 'kinko',
        notes: 'not an array'
      } as any;

      expect(() => ScoreParser.parse(scoreData)).toThrow('Score notes must be an array');
    });

    it('should throw error if notes array is empty', () => {
      const scoreData: ScoreData = {
        title: 'Test',
        style: 'kinko',
        notes: []
      };

      expect(() => ScoreParser.parse(scoreData)).toThrow('Score must contain at least one note');
    });

    it('should throw error if note is missing pitch', () => {
      const scoreData = {
        title: 'Test',
        style: 'kinko',
        notes: [
          { duration: 1 }
        ]
      } as any;

      expect(() => ScoreParser.parse(scoreData)).toThrow('Note at index 0 is missing pitch');
    });

    it('should throw error if note is missing pitch.step', () => {
      const scoreData = {
        title: 'Test',
        style: 'kinko',
        notes: [
          { pitch: { octave: 0 }, duration: 1 }
        ]
      } as any;

      expect(() => ScoreParser.parse(scoreData)).toThrow('Note at index 0 is missing pitch.step');
    });

    it('should throw error if note is missing pitch.octave', () => {
      const scoreData = {
        title: 'Test',
        style: 'kinko',
        notes: [
          { pitch: { step: 'ro' }, duration: 1 }
        ]
      } as any;

      expect(() => ScoreParser.parse(scoreData)).toThrow('Note at index 0 is missing pitch.octave');
    });

    it('should throw error if note is missing duration', () => {
      const scoreData = {
        title: 'Test',
        style: 'kinko',
        notes: [
          { pitch: { step: 'ro', octave: 0 } }
        ]
      } as any;

      expect(() => ScoreParser.parse(scoreData)).toThrow('Note at index 0 is missing duration');
    });

    it('should throw error if octave is out of range (too low)', () => {
      const scoreData: ScoreData = {
        title: 'Test',
        style: 'kinko',
        notes: [
          { pitch: { step: 'ro', octave: -1 }, duration: 1 }
        ]
      };

      expect(() => ScoreParser.parse(scoreData)).toThrow('Note at index 0 has invalid octave: -1');
    });

    it('should throw error if octave is out of range (too high)', () => {
      const scoreData: ScoreData = {
        title: 'Test',
        style: 'kinko',
        notes: [
          { pitch: { step: 'ro', octave: 3 }, duration: 1 }
        ]
      };

      expect(() => ScoreParser.parse(scoreData)).toThrow('Note at index 0 has invalid octave: 3');
    });

    it('should throw error if duration is zero', () => {
      const scoreData: ScoreData = {
        title: 'Test',
        style: 'kinko',
        notes: [
          { pitch: { step: 'ro', octave: 0 }, duration: 0 }
        ]
      };

      expect(() => ScoreParser.parse(scoreData)).toThrow('Note at index 0 has invalid duration: 0');
    });

    it('should throw error if duration is negative', () => {
      const scoreData: ScoreData = {
        title: 'Test',
        style: 'kinko',
        notes: [
          { pitch: { step: 'ro', octave: 0 }, duration: -1 }
        ]
      };

      expect(() => ScoreParser.parse(scoreData)).toThrow('Note at index 0 has invalid duration: -1');
    });

    it('should throw error if rest note is missing duration', () => {
      const scoreData = {
        title: 'Test',
        style: 'kinko',
        notes: [
          { rest: true }
        ]
      } as any;

      expect(() => ScoreParser.parse(scoreData)).toThrow('Rest at index 0 is missing duration');
    });

    it('should allow rest notes without pitch', () => {
      const scoreData: ScoreData = {
        title: 'Test',
        style: 'kinko',
        notes: [
          { rest: true, duration: 2 }
        ]
      };

      // Should not throw
      const notes = ScoreParser.parse(scoreData);
      expect(notes).toHaveLength(1);
    });
  });

  describe('duration line modifiers', () => {
    it('should add duration lines based on note duration', () => {
      const scoreData: ScoreData = {
        title: 'Test Score',
        style: 'kinko',
        notes: [
          { pitch: { step: 'ro', octave: 0 }, duration: 4 },  // Whole note: 0 lines
          { pitch: { step: 'tsu', octave: 0 }, duration: 2 }, // Half note: 1 line
          { pitch: { step: 're', octave: 0 }, duration: 1 },  // Quarter note: 2 lines
        ]
      };

      const notes = ScoreParser.parse(scoreData);

      expect(notes).toHaveLength(3);

      // Whole note should have NO duration lines
      const wholeNoteModifiers = notes[0].getModifiers();
      const wholeDurationLines = wholeNoteModifiers.filter(
        (m) => m.constructor.name === 'DurationLineModifier'
      );
      expect(wholeDurationLines).toHaveLength(0);

      // Half note should have 0 duration lines
      const halfNoteModifiers = notes[1].getModifiers();
      const halfDurationLines = halfNoteModifiers.filter(
        (m) => m.constructor.name === 'DurationLineModifier'
      );
      expect(halfDurationLines).toHaveLength(0);

      // Quarter note should have 1 duration line modifier with 1 line
      const quarterNoteModifiers = notes[2].getModifiers();
      const quarterDurationLines = quarterNoteModifiers.filter(
        (m) => m.constructor.name === 'DurationLineModifier'
      );
      expect(quarterDurationLines).toHaveLength(1);
    });

    it('should add duration lines to rest notes', () => {
      const scoreData: ScoreData = {
        title: 'Test Score',
        style: 'kinko',
        notes: [
          { rest: true, duration: 2 },  // Half rest: 0 lines
          { rest: true, duration: 1 },  // Quarter rest: 1 line
        ]
      };

      const notes = ScoreParser.parse(scoreData);

      expect(notes).toHaveLength(2);

      // Half rest should have no duration lines
      const halfRestModifiers = notes[0].getModifiers();
      const halfDurationLines = halfRestModifiers.filter(
        (m) => m.constructor.name === 'DurationLineModifier'
      );
      expect(halfDurationLines).toHaveLength(0);

      // Quarter rest should have duration lines
      const quarterRestModifiers = notes[1].getModifiers();
      const quarterDurationLines = quarterRestModifiers.filter(
        (m) => m.constructor.name === 'DurationLineModifier'
      );
      expect(quarterDurationLines).toHaveLength(1);
    });
  });

  describe('parseJSON()', () => {
    it('should parse valid JSON string', () => {
      const json = JSON.stringify({
        title: 'Test Score',
        style: 'kinko',
        notes: [
          { pitch: { step: 'ro', octave: 0 }, duration: 1 }
        ]
      });

      const notes = ScoreParser.parseJSON(json);

      expect(notes).toHaveLength(1);
      expect(notes[0].getKana()).toBe('ロ');
    });

    it('should throw error for invalid JSON', () => {
      const invalidJson = '{ invalid json }';

      expect(() => ScoreParser.parseJSON(invalidJson)).toThrow('Invalid JSON');
    });
  });
});
