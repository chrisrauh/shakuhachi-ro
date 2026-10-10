import { describe, it, expect } from 'vitest';
import { formatBeats, legacyDuration, parseBeats } from './Duration';

describe('Duration', () => {
  it('reads and writes whole beats and fractions', () => {
    for (const text of ['1', '3', '1/2', '3/4']) {
      expect(formatBeats(parseBeats(text)!)).toBe(text);
    }
    expect(parseBeats('3/2')).toEqual({ num: 3, den: 2 });
  });

  it('gives the legacy number for a length in beats', () => {
    expect(legacyDuration({ duration: '1' })).toBe(2);
    expect(legacyDuration({ duration: '1/4' })).toBe(0.5);
    expect(legacyDuration({ duration: '3/2', dotted: true })).toBe(2);
    expect(legacyDuration({ duration: '3/4', dotted: true })).toBe(1);
    expect(legacyDuration({ duration: 4, dotted: true })).toBe(4);
  });

  it('fails on a duration it cannot read', () => {
    expect(() => legacyDuration({ duration: '0.5' })).toThrow(
      'Invalid duration: 0.5',
    );
  });
});
