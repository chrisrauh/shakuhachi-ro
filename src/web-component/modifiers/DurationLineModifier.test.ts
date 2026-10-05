/**
 * Unit tests for DurationLineModifier
 */

import { describe, it, expect, vi } from 'vitest';
import { DurationLineModifier } from './DurationLineModifier';
import { DEFAULT_RENDER_OPTIONS } from '../renderer/RenderOptions';
import type { RenderingBackend } from '../renderer/RenderingBackend';

/** Renders the modifier at (100, 200) and returns each drawLine call */
function drawnLines(modifier: DurationLineModifier) {
  const drawLine = vi.fn();
  modifier.render({ drawLine } as unknown as RenderingBackend, 100, 200);
  return drawLine.mock.calls.map(([x1, y1, x2, y2, , width]) => ({
    x1,
    y1,
    x2,
    y2,
    width,
  }));
}

describe('DurationLineModifier', () => {
  it('draws one vertical line per count, right of the note and spaced apart', () => {
    const modifier = new DurationLineModifier(2);
    const { x, y } = modifier.getOffset();

    const lines = drawnLines(modifier);

    expect(lines).toHaveLength(2);
    expect(lines[0].x1).toBe(100 + x);
    expect(lines[0].y1).toBe(200 + y);
    expect(lines[1].x1).toBe(lines[0].x1 + 8);
    for (const line of lines) expect(line.x2).toBe(line.x1);
  });

  it('draws nothing and takes no width with a count of zero', () => {
    const modifier = new DurationLineModifier(0);

    expect(drawnLines(modifier)).toEqual([]);
    expect(modifier.getWidth()).toBe(0);
  });

  it('runs a non-last segment exactly to the next note once fitted to the layout', () => {
    const modifier = new DurationLineModifier(1).fitToLayout(57, 36);

    const [line] = drawnLines(modifier);

    // The next note's segment starts 57 lower, so the two meet without a gap
    // or an overlap.
    expect(line.y2 - line.y1).toBe(57);
  });

  it('ends the last segment in a sequence at the note, whatever the distance to the next', () => {
    const near = new DurationLineModifier(1, true).fitToLayout(40, 36);
    const far = new DurationLineModifier(1, true).fitToLayout(90, 36);

    const [nearLine] = drawnLines(near);
    const [farLine] = drawnLines(far);

    expect(nearLine.y2).toBe(farLine.y2);
    // Ends above the baseline, inside the note glyph
    expect(nearLine.y2).toBeLessThan(200);
    expect(nearLine.y2).toBeGreaterThan(200 - 36);
  });

  it('assumes the default note spacing when fitToLayout() was never called', () => {
    const unfitted = new DurationLineModifier(1);
    const fitted = new DurationLineModifier(1).fitToLayout(
      DEFAULT_RENDER_OPTIONS.noteVerticalSpacing,
      DEFAULT_RENDER_OPTIONS.noteFontSize,
    );

    expect(drawnLines(unfitted)).toEqual(drawnLines(fitted));
  });

  it('draws with the line width and spacing set on it', () => {
    const modifier = new DurationLineModifier(2)
      .setLineWidth(3)
      .setLineSpacing(10);

    const lines = drawnLines(modifier);

    expect(lines.map((line) => line.width)).toEqual([3, 3]);
    expect(lines[1].x1 - lines[0].x1).toBe(10);
    expect(modifier.getWidth()).toBe(3 + 10);
  });
});
