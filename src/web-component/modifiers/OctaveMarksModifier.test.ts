/**
 * Unit tests for OctaveMarksModifier
 */

import { describe, it, expect, vi } from 'vitest';
import { OctaveMarksModifier } from './OctaveMarksModifier';
import { DEFAULT_RENDER_OPTIONS } from '../renderer/RenderOptions';
import type { SVGRenderer } from '../renderer/SVGRenderer';

describe('OctaveMarksModifier', () => {
  it('should render with the default render options when not configured', () => {
    const drawText = vi.fn();
    new OctaveMarksModifier('kan').render(
      { drawText } as unknown as SVGRenderer,
      0,
      0,
    );

    expect(drawText).toHaveBeenCalledWith(
      '甲',
      expect.any(Number),
      expect.any(Number),
      DEFAULT_RENDER_OPTIONS.octaveMarkFontSize,
      DEFAULT_RENDER_OPTIONS.noteFontFamily,
      expect.anything(),
      'middle',
      DEFAULT_RENDER_OPTIONS.octaveMarkFontWeight,
    );
  });

  it('should stack 大甲 vertically, 大 where a single mark goes and 甲 below it', () => {
    const drawText = vi.fn();
    const renderer = { drawText } as unknown as SVGRenderer;
    new OctaveMarksModifier('kan').render(renderer, 0, 0);
    new OctaveMarksModifier('daikan').render(renderer, 0, 0);

    const [kan, dai, daikanKan] = drawText.mock.calls;
    expect([dai[0], daikanKan[0]]).toEqual(['大', '甲']);
    // Same column as a single mark
    expect(dai[1]).toBe(kan[1]);
    expect(daikanKan[1]).toBe(kan[1]);
    // 大 in the single-mark position, 甲 one character below it
    expect(dai[2]).toBe(kan[2]);
    expect(daikanKan[2]).toBe(
      kan[2] + DEFAULT_RENDER_OPTIONS.octaveMarkFontSize,
    );
  });
});
