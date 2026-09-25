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
});
