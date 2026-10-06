/**
 * Unit tests for ShakuNote
 */

import { describe, it, expect, vi } from 'vitest';
import { ShakuNote } from './ShakuNote';
import { DurationDotModifier } from '../modifiers/DurationDotModifier';
import { OctaveMarksModifier } from '../modifiers/OctaveMarksModifier';
import type { RenderingBackend } from '../renderer/RenderingBackend';

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

  describe('render', () => {
    function drawnText(symbol: string) {
      const drawText = vi.fn();
      new ShakuNote({ symbol, x: 100, y: 200 }).render({
        drawText,
      } as unknown as RenderingBackend);
      return drawText.mock.calls.map(([text, x, y, size]) => ({
        text,
        x,
        y,
        size,
      }));
    }

    it('draws a numeral small, in the lower right of ヒ', () => {
      const [kana, numeral] = drawnText('go-no-hi');

      expect(kana.text).toBe('ヒ');
      expect(numeral.text).toBe('五');
      expect(numeral.size).toBeLessThan(kana.size);
      expect(numeral.x).toBeGreaterThan(kana.x);
      expect(numeral.y).toBe(kana.y);
    });

    it('stacks several numerals upwards from the baseline', () => {
      const [, ...numerals] = drawnText('ni-shi-go-no-ha');

      expect(numerals.map((n) => n.text)).toEqual(['二', '四', '五']);
      expect(numerals[2].y).toBe(200);
      expect(numerals[0].y).toBeLessThan(numerals[1].y);
      expect(numerals[1].y).toBeLessThan(numerals[2].y);
    });
  });
});
