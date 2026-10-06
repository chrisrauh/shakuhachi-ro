/**
 * Symbol Mappings for Shakuhachi Notation
 *
 * Defines the symbol systems for Kinko-ryū and Tozan-ryū notation,
 * including pitch information, fingerings, and metadata.
 *
 * References:
 * - Kinko-ryū Fingering Chart: https://files.shakuhachisociety.eu/resources/getting-started/Fingering%20Chart%20%28Kinko%2C%20Tozan%2C%20Zensabo%2C%20KSK%29.pdf
 * - Shakuhachi Notes Guide: https://josenshakuhachi.com/shakuhachi-guides/shakuhachi-note-charts
 * - Japanese Kana References: https://en.wikipedia.org/wiki/Ro_(kana), https://en.wikipedia.org/wiki/Tsu_(kana), etc.
 */

import type { PitchStep } from '../types/ScoreData';

/**
 * Octave range for shakuhachi
 * - otsu: Lower octave (fundamental)
 * - kan: Middle octave (first overtone)
 * - daikan: Upper octave (second overtone)
 */
export type Octave = 'otsu' | 'kan' | 'daikan';

/**
 * Common shakuhachi techniques
 */
export type Technique =
  | 'yuri' // Vibrato
  | 'atari' // Finger pop/percussion
  | 'muraiki' // Breathy/airy tone
  | 'korokoro' // Flutter tongue
  | 'uchi' // Strong attack
  | 'suri' // Slide up
  | 'ori'; // Slide down

/**
 * How a pitch step is written
 */
export interface KinkoSymbol {
  /** Japanese kana character */
  kana: string;

  /**
   * Small numerals written beside the kana, naming the holes that make the
   * fingering, e.g. 五 for go no hi (ヒ). Several are stacked, as for ハ in ni
   * shi go no ha.
   */
  numerals?: string;

  /** Romanized name */
  romaji: PitchStep;

  /**
   * Western pitch in otsu (octave 0), for finding which octave a note is
   * nearest to. Fingerings Koga lists only in kan are placed an octave below
   * it. The fingering table has the pitch of each fingering.
   */
  pitch: string;
}

/**
 * Kinko-ryū pitch steps, keyed by romaji. See PITCH_STEPS.
 */
export const kinkoMap: Record<PitchStep, KinkoSymbol> = {
  ro: { kana: 'ロ', romaji: 'ro', pitch: 'D4' },
  tsu: { kana: 'ツ', romaji: 'tsu', pitch: 'F4' },
  re: { kana: 'レ', romaji: 're', pitch: 'G4' },
  u: { kana: 'ウ', romaji: 'u', pitch: 'Ab4' },
  chi: { kana: 'チ', romaji: 'chi', pitch: 'A4' },
  ri: { kana: 'リ', romaji: 'ri', pitch: 'C5' },
  hi: { kana: 'ヒ', romaji: 'hi', pitch: 'C5' },
  ha: { kana: 'ハ', romaji: 'ha', pitch: 'D5' },
  'go-no-hi': { kana: 'ヒ', numerals: '五', romaji: 'go-no-hi', pitch: 'D5' },
  'go-no-ha': { kana: 'ハ', numerals: '五', romaji: 'go-no-ha', pitch: 'D5' },
  'san-no-u': { kana: 'ウ', numerals: '三', romaji: 'san-no-u', pitch: 'Bb4' },
  'san-no-ha': {
    kana: 'ハ',
    numerals: '三',
    romaji: 'san-no-ha',
    pitch: 'Eb5',
  },
  'shi-no-ha': { kana: 'ハ', numerals: '四', romaji: 'shi-no-ha', pitch: 'E5' },
  'ni-shi-go-no-ha': {
    kana: 'ハ',
    numerals: '二四五',
    romaji: 'ni-shi-go-no-ha',
    pitch: 'Eb5',
  },
  i: { kana: 'イ', romaji: 'i', pitch: 'D5' },
  a: { kana: 'ア', romaji: 'a', pitch: 'D5' },
  ru: { kana: 'ル', romaji: 'ru', pitch: 'G4' },
  'yon-go-no-ha': {
    kana: 'ハ',
    numerals: '四五',
    romaji: 'yon-go-no-ha',
    pitch: 'D5',
  },
  'ni-no-ha': { kana: 'ハ', numerals: '二', romaji: 'ni-no-ha', pitch: 'Eb5' },
  'yon-no-hi': { kana: 'ヒ', numerals: '四', romaji: 'yon-no-hi', pitch: 'B4' },
  'ni-no-re': { kana: 'レ', numerals: '二', romaji: 'ni-no-re', pitch: 'Gb4' },
  'ichi-san-no-u': {
    kana: 'ウ',
    numerals: '一三',
    romaji: 'ichi-san-no-u',
    pitch: 'G4',
  },
};

/**
 * Helper function to get all available Kinko symbols
 */
export function getKinkoSymbols(): string[] {
  return Object.keys(kinkoMap);
}

/**
 * Helper function to get symbol by kana character
 */
export function getSymbolByKana(kana: string): KinkoSymbol | undefined {
  return Object.values(kinkoMap).find((symbol) => symbol.kana === kana);
}

/**
 * Helper function to get symbol by romaji name
 */
export function getSymbolByRomaji(romaji: string): KinkoSymbol | undefined {
  const key = romaji.toLowerCase();
  return Object.hasOwn(kinkoMap, key) ? kinkoMap[key as PitchStep] : undefined;
}

/**
 * Helper function to get symbol by western pitch (e.g., "D4", "G4", "A4")
 */
export function getSymbolByPitch(pitch: string): KinkoSymbol | undefined {
  return Object.values(kinkoMap).find((symbol) => symbol.pitch === pitch);
}

/**
 * Universal lookup - accepts romaji, kana, or western pitch
 * Examples:
 *   - parseNote('ro') → ro symbol
 *   - parseNote('ロ') → ro symbol
 *   - parseNote('D4') → ro symbol
 */
export function parseNote(input: string): KinkoSymbol | undefined {
  // Try romaji first (most common in code)
  const byRomaji = getSymbolByRomaji(input);
  if (byRomaji) return byRomaji;

  // Try kana
  const byKana = getSymbolByKana(input);
  if (byKana) return byKana;

  // Try western pitch
  const byPitch = getSymbolByPitch(input);
  if (byPitch) return byPitch;

  return undefined;
}

/**
 * Pitch modifiers for octave calculation
 */
export const octaveModifiers: Record<Octave, number> = {
  otsu: 0, // Base octave
  kan: 12, // +1 octave (12 semitones)
  daikan: 24, // +2 octaves (24 semitones)
};

/**
 * Visual symbols for performance techniques
 */
export const techniqueSymbols: Record<string, string> = {
  yuri: '〜', // Wave/tilde for vibrato
  atari: '>', // Accent mark
  muraiki: 'ム', // Katakana mu
  uchi: '^', // Strong attack
  suri: '↗', // Slide up
  ori: '↘', // Slide down
};

/**
 * Number of dots to display for each octave register
 */
export const octaveDots: Record<Octave, { above: number; below: number }> = {
  otsu: { above: 0, below: 1 },
  kan: { above: 1, below: 0 },
  daikan: { above: 2, below: 0 },
};

/**
 * Converts a Western pitch notation (e.g., "D4", "G4") to MIDI note number
 *
 * @param pitch - Western pitch notation (e.g., "C4", "D#5", "Bb3")
 * @returns MIDI note number (C4 = 60)
 */
export function pitchToMidi(pitch: string): number {
  const pitchClassMap: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  };

  const match = pitch.match(/^([A-G])(#|b)?(\d+)$/);
  if (!match) {
    throw new Error(`Invalid pitch notation: ${pitch}`);
  }

  const [, note, accidental, octaveStr] = match;
  const pitchClass = pitchClassMap[note];
  const accidentalOffset = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;
  const octave = parseInt(octaveStr, 10);

  // MIDI note number: (octave + 1) * 12 + pitchClass + accidentalOffset
  // C4 = 60, so C0 = 12
  return (octave + 1) * 12 + pitchClass + accidentalOffset;
}

/**
 * Gets the MIDI note number for a shakuhachi note (romaji) in a specific octave
 *
 * @param romaji - Note name (e.g., "ro", "tsu", "re")
 * @param octave - Octave number (0=otsu, 1=kan, 2=daikan)
 * @returns MIDI note number
 */
export function getNoteMidi(romaji: string, octave: number): number {
  const symbol = getSymbolByRomaji(romaji);
  if (!symbol) {
    throw new Error(`Unknown note: ${romaji}`);
  }

  const baseMidi = pitchToMidi(symbol.pitch);
  return baseMidi + octave * 12;
}

// TODO: Add Tozan notation mappings when needed
// export const tozanMap: Record<string, TozanSymbol> = { ... };
