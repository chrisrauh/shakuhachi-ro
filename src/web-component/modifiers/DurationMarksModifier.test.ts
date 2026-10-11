/**
 * Unit tests for DurationMarksModifier
 */

import { describe, it, expect, vi } from 'vitest';
import { DurationMarksModifier, durationSlots } from './DurationMarksModifier';
import type { RenderingBackend } from '../renderer/RenderingBackend';
import { parseBeats } from '../types/Duration';

const layout = {
  distanceToNext: 0,
  noteFontSize: 32,
  noteSpacing: 44,
  dotSpacing: 22,
};

/** Renders the marks of a note at (100, 200) and returns what was drawn */
function draw(duration: string, linesContinue = false) {
  const marks = new DurationMarksModifier(
    durationSlots(parseBeats(duration)!),
    linesContinue,
  );
  const drawLine = vi.fn();
  const drawCircle = vi.fn();
  const distanceToNext = 44 + marks.extraHeight(layout);
  marks.render(
    { drawLine, drawCircle } as unknown as RenderingBackend,
    100,
    200,
    { ...layout, distanceToNext },
  );
  const lines = drawLine.mock.calls.map(([x1, y1, x2, y2]) => ({
    x1,
    y1,
    x2,
    y2,
  }));
  return {
    strokes: lines.filter((l) => l.x1 === 100),
    lines: lines.filter((l) => l.x1 !== 100),
    dots: drawCircle.mock.calls.map(([x, y]) => ({ x, y })),
    distanceToNext,
  };
}

describe('durationSlots', () => {
  it('marks nothing for one beat', () => {
    expect(
      DurationMarksModifier.marksAnything(durationSlots(parseBeats('1')!)),
    ).toBe(false);
  });

  it('writes whole beats before the half, and the half as a dot', () => {
    expect(durationSlots(parseBeats('7/2')!)).toEqual([
      { kind: 'note', lines: 0 },
      { kind: 'stroke', lines: 0 },
      { kind: 'stroke', lines: 0 },
      { kind: 'dot', lines: 0 },
    ]);
  });
});

describe('DurationMarksModifier', () => {
  it('draws a stroke on the column axis, between this note and the next', () => {
    const { strokes, distanceToNext } = draw('2');

    expect(strokes).toHaveLength(1);
    expect(strokes[0].y1).toBeGreaterThan(200);
    expect(strokes[0].y2).toBeLessThan(200 + distanceToNext - 32);
  });

  it('draws the dot after whole beats below the note, with no line', () => {
    // Dawn in the Forest: ロ・ リ, the line starting at リ
    const { dots, lines } = draw('3/2', true);

    expect(dots).toEqual([{ x: 100, y: expect.any(Number) }]);
    expect(dots[0].y).toBeGreaterThan(200 - 32 * 0.4);
    expect(lines).toHaveLength(0);
  });

  it("runs a half-beat note's line on beside its dot, as one line", () => {
    // Gyoson: リ レ・ under one line
    const { dots, lines } = draw('3/4');
    const [noteLine, dotLine] = lines;

    expect(lines).toHaveLength(2);
    expect(dotLine.x1).toBe(noteLine.x1);
    expect(dotLine.y1).toBe(noteLine.y2);
    expect(dotLine.y2).toBeGreaterThan(dots[0].y);
  });

  it('runs the last lines on to the next note when it has lines', () => {
    const { lines, distanceToNext } = draw('3/4', true);

    expect(lines.at(-1)!.y2).toBe(200 + distanceToNext - 22);
  });

  it('is as wide as its most lines', () => {
    const width = (duration: string) =>
      new DurationMarksModifier(
        durationSlots(parseBeats(duration)!),
        false,
      ).getWidth();

    expect(width('2')).toBe(0);
    expect(width('1/4')).toBeGreaterThan(width('3/4'));
  });
});
