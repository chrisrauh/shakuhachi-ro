/**
 * Unit tests for notation font resolution
 */

import { describe, it, expect } from 'vitest';
import { NOTATION_FONTS, resolveNotationFont } from './notation-fonts';

describe('resolveNotationFont', () => {
  it('resolves known keywords to their font stacks', () => {
    expect(resolveNotationFont('serif')).toBe(NOTATION_FONTS.serif);
    expect(resolveNotationFont('sans')).toBe(NOTATION_FONTS.sans);
  });

  it('falls back to sans for an absent value', () => {
    expect(resolveNotationFont(null)).toBe(NOTATION_FONTS.sans);
  });

  it('falls back to sans for an unrecognised value', () => {
    expect(resolveNotationFont('comic-sans')).toBe(NOTATION_FONTS.sans);
    expect(resolveNotationFont('')).toBe(NOTATION_FONTS.sans);
  });

  it('falls back to sans for inherited Object.prototype keys', () => {
    expect(resolveNotationFont('constructor')).toBe(NOTATION_FONTS.sans);
    expect(resolveNotationFont('toString')).toBe(NOTATION_FONTS.sans);
  });
});
