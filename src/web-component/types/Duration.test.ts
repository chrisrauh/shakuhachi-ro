import { describe, it, expect } from 'vitest';
import {
  dottedLength,
  formatBeats,
  legacyDuration,
  parseBeats,
  writtenLength,
} from './Duration';

describe('Duration', () => {
  it('reads and writes whole beats and fractions', () => {
    for (const text of ['1', '3', '1/2', '3/4']) {
      expect(formatBeats(parseBeats(text)!)).toBe(text);
    }
    expect(parseBeats('3/2')).toEqual({ num: 3, den: 2 });
  });

  // A dot fills a slot of the beat it falls in: half a beat after a beat or
  // more, a quarter after half a beat
  it('adds a dot of half a beat, or a quarter after half a beat', () => {
    const dotted = (written: string) =>
      formatBeats(dottedLength(parseBeats(written)!));
    expect(dotted('1')).toBe('3/2');
    expect(dotted('2')).toBe('5/2');
    expect(dotted('1/2')).toBe('3/4');
  });

  it('gives the length written before the dot', () => {
    const written = (beats: string) =>
      formatBeats(writtenLength(parseBeats(beats)!, true));
    expect(written('3/2')).toBe('1');
    expect(written('5/2')).toBe('2');
    expect(written('3/4')).toBe('1/2');
    expect(writtenLength(parseBeats('3/2')!)).toEqual({ num: 3, den: 2 });
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
