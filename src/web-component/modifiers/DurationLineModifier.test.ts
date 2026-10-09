/**
 * Unit tests for DurationLineModifier
 */

import { describe, it, expect, vi } from 'vitest';
import { DurationLineModifier } from './DurationLineModifier';
import type { ModifierLayout } from './Modifier';
import type { RenderingBackend } from '../renderer/RenderingBackend';

const DEFAULT_LAYOUT: ModifierLayout = { distanceToNext: 44, noteFontSize: 36 };

/** Renders the modifier at (100, 200) and returns each drawLine call */
function drawnLines(
  modifier: DurationLineModifier,
  layout: ModifierLayout = DEFAULT_LAYOUT,
) {
  const drawLine = vi.fn();
  modifier.render(
    { drawLine } as unknown as RenderingBackend,
    100,
    200,
    layout,
  );
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

  it('runs a non-last segment exactly to the next note', () => {
    const modifier = new DurationLineModifier(1);

    const [line] = drawnLines(modifier, {
      distanceToNext: 57,
      noteFontSize: 36,
    });

    // The next note's segment starts 57 lower, so the two meet without a gap
    // or an overlap.
    expect(line.y2 - line.y1).toBe(57);
  });

  it('ends the last segment in a sequence at the note, whatever the distance to the next', () => {
    const last = new DurationLineModifier(1, true);

    const [nearLine] = drawnLines(last, {
      distanceToNext: 40,
      noteFontSize: 36,
    });
    const [farLine] = drawnLines(last, {
      distanceToNext: 90,
      noteFontSize: 36,
    });

    expect(nearLine.y2).toBe(farLine.y2);
    // Ends above the baseline, inside the note glyph
    expect(nearLine.y2).toBeLessThan(200);
    expect(nearLine.y2).toBeGreaterThan(200 - 36);
  });

  // Its height in the note's bounding box is the line it draws, so the box
  // follows the layout too (a dotted note's line runs further)
  it('takes the height of the line it draws for the layout', () => {
    const modifier = new DurationLineModifier(1);
    const layout = { distanceToNext: 57, noteFontSize: 36 };

    const [line] = drawnLines(modifier, layout);

    expect(modifier.getHeight(layout)).toBe(line.y2 - line.y1);
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
