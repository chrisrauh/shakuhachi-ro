/**
 * Unit tests for ShakuNote
 */

import { describe, it, expect, vi } from 'vitest';
import { ShakuNote } from './ShakuNote';
import {
  DurationMarksModifier,
  durationSlots,
} from '../modifiers/DurationMarksModifier';
import { OctaveMarksModifier } from '../modifiers/OctaveMarksModifier';
import type { RenderingBackend } from '../renderer/RenderingBackend';

function layout(distanceToNext: number) {
  return { distanceToNext, noteFontSize: 32, noteSpacing: 44, dotSpacing: 22 };
}

describe('ShakuNote', () => {
  describe('extraHeight', () => {
    const spacing = { noteSpacing: 44, dotSpacing: 22 };

    it('is 0 for a note without modifiers', () => {
      expect(new ShakuNote({ symbol: 'ro' }).extraHeight(spacing)).toBe(0);
    });

    it('is 0 when no modifier takes space in the column', () => {
      const note = new ShakuNote({ symbol: 'ro' }).addModifier(
        new OctaveMarksModifier('kan'),
      );
      expect(note.extraHeight(spacing)).toBe(0);
    });

    it('adds a note slot per stroke and a dot slot per dot', () => {
      const note = new ShakuNote({ symbol: 'ro' }).addModifiers([
        new OctaveMarksModifier('kan'),
        new DurationMarksModifier(
          durationSlots({ num: 5, den: 2 }, true),
          false,
        ),
      ]);
      expect(note.extraHeight(spacing)).toBe(44 + 22);
    });
  });

  describe('render', () => {
    function drawnText(symbol: string) {
      const drawText = vi.fn();
      new ShakuNote({ symbol }).render(
        { drawText } as unknown as RenderingBackend,
        100,
        200,
        layout(44),
      );
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

  describe('getBBox', () => {
    const backend = {
      drawText: vi.fn(),
      drawLine: vi.fn(),
    } as unknown as RenderingBackend;

    it('is where the note was last drawn', () => {
      const note = new ShakuNote({ symbol: 'ro' });
      note.render(backend, 100, 200, layout(44));
      note.render(backend, 300, 400, layout(44));

      const box = note.getBBox();

      expect(note.getPosition()).toEqual({ x: 300, y: 400 });
      expect(box.x + box.width / 2).toBe(300);
      expect(box.y + box.height).toBe(400);
    });

    // A duration line runs to the next note, so the box spans the line drawn
    // in the layout the note was last rendered in
    it('sizes its duration line from the layout it was last rendered in', () => {
      const boxHeight = (distanceToNext: number) => {
        const note = new ShakuNote({
          symbol: 'ro',
          modifiers: [
            new DurationMarksModifier([{ kind: 'note', lines: 1 }], true),
          ],
        });
        note.render(backend, 100, 200, layout(distanceToNext));
        return note.getBBox().height;
      };

      expect(boxHeight(80)).toBeGreaterThan(boxHeight(44));
    });
  });
});
