/**
 * Unit tests for MeriKariModifier
 */

import { describe, it, expect, vi } from 'vitest';
import { MeriKariModifier } from './MeriKariModifier';
import { DEFAULT_RENDER_OPTIONS } from '../renderer/RenderOptions';
import type { RenderingBackend } from '../renderer/RenderingBackend';

describe('MeriKariModifier', () => {
  it('should render with the default render options when not configured', () => {
    const drawText = vi.fn();
    new MeriKariModifier('meri').render(
      { drawText } as unknown as RenderingBackend,
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

describe('MeriKariModifier marks', () => {
  /** The characters drawn for a mark, top to bottom, with their y */
  function drawn(type: ConstructorParameters<typeof MeriKariModifier>[0]) {
    const drawText = vi.fn();
    new MeriKariModifier(type).render(
      { drawText } as unknown as RenderingBackend,
      0,
      100,
    );
    return drawText.mock.calls.map(([text, , y]) => ({ text, y }));
  }

  it('draws a kari mark distinct from every meri mark', () => {
    const marks = (
      ['dai-meri', 'meri', 'chu-meri', 'chu-kari', 'kari', 'dai-kari'] as const
    ).map((type) =>
      drawn(type)
        .map(({ text }) => text)
        .join(''),
    );

    expect(marks).toEqual(['大メ', 'メ', '中', '中カ', 'カ', '大カ']);
  });

  it('stacks a two-character mark, ending at the note baseline', () => {
    const [upper, lower] = drawn('dai-meri');

    expect(lower.y).toBe(100);
    expect(upper.y).toBeLessThan(lower.y);
  });
});
