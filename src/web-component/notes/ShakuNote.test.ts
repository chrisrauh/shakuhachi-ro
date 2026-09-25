/**
 * Unit tests for ShakuNote
 */

import { describe, it, expect } from 'vitest';
import { ShakuNote } from './ShakuNote';
import { DurationDotModifier } from '../modifiers/DurationDotModifier';
import { OctaveMarksModifier } from '../modifiers/OctaveMarksModifier';

describe('ShakuNote', () => {
  describe('needsExtraSpacing', () => {
    it('is false for a note without modifiers', () => {
      expect(new ShakuNote({ symbol: 'ro' }).needsExtraSpacing()).toBe(false);
    });

    it('is false when no modifier needs extra space', () => {
      const note = new ShakuNote({ symbol: 'ro' }).addModifier(
        new OctaveMarksModifier('kan'),
      );
      expect(note.needsExtraSpacing()).toBe(false);
    });

    it('is true when the note has a duration dot', () => {
      const note = new ShakuNote({ symbol: 'ro' }).addModifiers([
        new OctaveMarksModifier('kan'),
        new DurationDotModifier(),
      ]);
      expect(note.needsExtraSpacing()).toBe(true);
    });
  });
});
