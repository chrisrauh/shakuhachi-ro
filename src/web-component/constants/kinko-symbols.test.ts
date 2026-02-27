import { describe, it, expect } from 'vitest';
import {
  kinkoMap,
  getSymbolByKana,
  getSymbolByRomaji,
  getSymbolByPitch,
  parseNote,
  pitchToMidi,
  getNoteMidi,
} from './kinko-symbols';

describe('kinkoMap', () => {
  it('contains all 7 base shakuhachi notes', () => {
    const notes = Object.keys(kinkoMap);
    expect(notes).toContain('ro');
    expect(notes).toContain('tsu');
    expect(notes).toContain('re');
    expect(notes).toContain('chi');
    expect(notes).toContain('ri');
    expect(notes).toContain('u');
    expect(notes).toContain('hi');
  });
});

describe('getSymbolByKana', () => {
  it('returns symbol for valid kana', () => {
    const ro = getSymbolByKana('ロ');
    expect(ro?.romaji).toBe('ro');
    expect(ro?.pitch).toBe('D4');
  });

  it('returns undefined for invalid kana', () => {
    expect(getSymbolByKana('ア')).toBeUndefined();
  });
});

describe('getSymbolByRomaji', () => {
  it('returns symbol for valid romaji', () => {
    const ro = getSymbolByRomaji('ro');
    expect(ro?.kana).toBe('ロ');
    expect(ro?.pitch).toBe('D4');
  });

  it('handles case-insensitive lookup', () => {
    expect(getSymbolByRomaji('RO')?.kana).toBe('ロ');
  });

  it('returns undefined for invalid romaji', () => {
    expect(getSymbolByRomaji('invalid')).toBeUndefined();
  });
});

describe('getSymbolByPitch', () => {
  it('returns symbol for valid pitch', () => {
    const ro = getSymbolByPitch('D4');
    expect(ro?.romaji).toBe('ro');
    expect(ro?.kana).toBe('ロ');
  });

  it('returns undefined for invalid pitch', () => {
    expect(getSymbolByPitch('Z9')).toBeUndefined();
  });
});

describe('parseNote', () => {
  it('accepts romaji input', () => {
    expect(parseNote('ro')?.kana).toBe('ロ');
  });

  it('accepts kana input', () => {
    expect(parseNote('ロ')?.romaji).toBe('ro');
  });

  it('accepts western pitch input', () => {
    expect(parseNote('D4')?.romaji).toBe('ro');
  });

  it('returns undefined for invalid input', () => {
    expect(parseNote('invalid')).toBeUndefined();
  });
});

describe('pitchToMidi', () => {
  it('converts standard pitch notation to MIDI', () => {
    expect(pitchToMidi('C4')).toBe(60); // Middle C
    expect(pitchToMidi('D4')).toBe(62);
    expect(pitchToMidi('A4')).toBe(69); // Concert A
  });

  it('handles sharps and flats', () => {
    expect(pitchToMidi('C#4')).toBe(61);
    expect(pitchToMidi('Bb3')).toBe(58);
  });

  it('throws error for invalid pitch notation', () => {
    expect(() => pitchToMidi('invalid')).toThrow('Invalid pitch notation');
    expect(() => pitchToMidi('H4')).toThrow('Invalid pitch notation');
  });
});

describe('getNoteMidi', () => {
  it('returns MIDI number for shakuhachi note in otsu octave', () => {
    expect(getNoteMidi('ro', 0)).toBe(62); // D4
  });

  it('returns MIDI number for kan octave (+12 semitones)', () => {
    expect(getNoteMidi('ro', 1)).toBe(74); // D5
  });

  it('throws error for invalid note', () => {
    expect(() => getNoteMidi('invalid', 0)).toThrow('Unknown note');
  });
});
