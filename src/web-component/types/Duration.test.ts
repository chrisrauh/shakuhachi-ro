import { describe, it, expect } from 'vitest';
import {
  dottedLength,
  formatBeats,
  noteBeats,
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

  it("gives a note's length in beats, reading legacy numbers", () => {
    expect(noteBeats({ duration: '3/2', dotted: true })).toEqual({
      num: 3,
      den: 2,
    });
    expect(noteBeats({ duration: 4 })).toEqual({ num: 2, den: 1 });
    expect(noteBeats({ duration: 1, dotted: true })).toEqual({
      num: 3,
      den: 4,
    });
  });

  it('fails on a duration it cannot read', () => {
    expect(() => noteBeats({ duration: '0.5' })).toThrow(
      'Invalid duration: 0.5',
    );
  });
});
