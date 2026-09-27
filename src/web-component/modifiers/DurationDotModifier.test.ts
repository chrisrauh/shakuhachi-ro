/**
 * Unit tests for DurationDotModifier
 */

import { describe, it, expect, vi } from 'vitest';
import { DurationDotModifier } from './DurationDotModifier';
import type { SVGRenderer } from '../renderer/SVGRenderer';

function renderAt(modifier: DurationDotModifier, x: number, y: number) {
  const drawCircle = vi.fn();
  modifier.render({ drawCircle } as unknown as SVGRenderer, x, y);
  return drawCircle;
}

describe('DurationDotModifier', () => {
  it('draws the dot to the right of the note in horizontal layout', () => {
    const drawCircle = renderAt(new DurationDotModifier('right'), 100, 200);

    const [[x, y]] = drawCircle.mock.calls;
    expect(x).toBeGreaterThan(100);
    expect(y).toBe(200);
  });

  it('draws the dot below the note in vertical layout', () => {
    const drawCircle = renderAt(new DurationDotModifier('below'), 100, 200);

    const [[x, y]] = drawCircle.mock.calls;
    expect(x).toBe(100);
    expect(y).toBeGreaterThan(200);
  });

  it('draws at an offset set on it', () => {
    const modifier = new DurationDotModifier('below').setOffset(3, 20);

    const drawCircle = renderAt(modifier, 100, 200);

    expect(drawCircle.mock.calls[0].slice(0, 2)).toEqual([103, 220]);
  });

  it('draws and measures with the radius set on it', () => {
    const modifier = new DurationDotModifier().setDotRadius(4);

    const drawCircle = renderAt(modifier, 0, 0);

    expect(drawCircle.mock.calls[0][2]).toBe(4);
    expect(modifier.getWidth()).toBe(8);
    expect(modifier.getHeight()).toBe(8);
  });
});
