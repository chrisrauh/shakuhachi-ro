/**
 * Unit tests for MeriKariModifier
 */

import { describe, it, expect, vi } from 'vitest';
import { MeriKariModifier } from './MeriKariModifier';
import { DEFAULT_RENDER_OPTIONS } from '../renderer/RenderOptions';
import type { SVGRenderer } from '../renderer/SVGRenderer';

describe('MeriKariModifier', () => {
  it('should render with the default render options when not configured', () => {
    const drawText = vi.fn();
    new MeriKariModifier('meri').render(
      { drawText } as unknown as SVGRenderer,
      0,
      0,
    );

    expect(drawText).toHaveBeenCalledWith(
      'メ',
      expect.any(Number),
      expect.any(Number),
      DEFAULT_RENDER_OPTIONS.meriKariFontSize,
      DEFAULT_RENDER_OPTIONS.noteFontFamily,
      expect.anything(),
      'middle',
      DEFAULT_RENDER_OPTIONS.meriKariFontWeight,
    );
  });
});
