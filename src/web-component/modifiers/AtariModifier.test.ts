/**
 * Unit tests for AtariModifier
 */

import { describe, it, expect, vi } from 'vitest';
import { AtariModifier } from './AtariModifier';
import type { RenderingBackend } from '../renderer/RenderingBackend';

function renderAt(modifier: AtariModifier, x: number, y: number) {
  const renderer = { drawLine: vi.fn(), drawCircle: vi.fn() };
  modifier.render(renderer as unknown as RenderingBackend, x, y);
  return renderer;
}

describe('AtariModifier', () => {
  it('draws a chevron left of the note by default, pointing at it', () => {
    const { drawLine, drawCircle } = renderAt(new AtariModifier(), 100, 200);

    expect(drawCircle).not.toHaveBeenCalled();
    expect(drawLine).toHaveBeenCalledTimes(2);
    // Both strokes meet at the tip, which is left of the note
    const [[, , tipX, tipY], [fromX, fromY]] = drawLine.mock.calls;
    expect([fromX, fromY]).toEqual([tipX, tipY]);
    expect(tipX).toBeLessThan(100);
  });

  it('draws an arrow as a shaft and two head strokes', () => {
    const { drawLine } = renderAt(new AtariModifier('arrow'), 100, 200);

    expect(drawLine).toHaveBeenCalledTimes(3);
  });

  it('draws a dot sized to the mark', () => {
    const { drawLine, drawCircle } = renderAt(
      new AtariModifier('dot').setSize(12),
      100,
      200,
    );

    expect(drawLine).not.toHaveBeenCalled();
    expect(drawCircle.mock.calls[0][2]).toBe(6);
  });

  it('draws in the style set after construction', () => {
    const modifier = new AtariModifier('arrow').setStyle('dot');

    const { drawCircle } = renderAt(modifier, 0, 0);

    expect(modifier.getStyle()).toBe('dot');
    expect(drawCircle).toHaveBeenCalledTimes(1);
  });

  it('places itself on the side of the note it is given', () => {
    const offsets = (['left', 'right', 'above', 'below'] as const).map(
      (position) => new AtariModifier('chevron', position).getOffset(),
    );
    const [left, right, above, below] = offsets;

    expect(left.x).toBeLessThan(0);
    expect(right.x).toBeGreaterThan(0);
    expect(above.y).toBeLessThan(0);
    expect(below.y).toBeGreaterThan(0);
  });

  it('draws with the stroke width set on it', () => {
    const { drawLine } = renderAt(new AtariModifier().setStrokeWidth(4), 0, 0);

    for (const call of drawLine.mock.calls) expect(call[5]).toBe(4);
  });
});
