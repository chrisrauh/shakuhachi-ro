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

/**
 * Octave range for shakuhachi
 * - otsu: Lower octave (fundamental)
 * - kan: Middle octave (first overtone)
 * - daikan: Upper octave (second overtone)
 */
export type Octave = 'otsu' | 'kan' | 'daikan';

/**
 * Pitch alteration techniques
 * - meri: Lowering pitch (half or whole step)
 * - kari: Raising pitch (half step)
 */
export type PitchAlteration = 'meri' | 'kari' | 'dai-meri' | null;

/**
 * Common shakuhachi techniques
 */
export type Technique =
  | 'yuri'      // Vibrato
  | 'atari'     // Finger pop/percussion
  | 'muraiki'   // Breathy/airy tone
  | 'korokoro' // Flutter tongue
  | 'uchi'      // Strong attack
  | 'suri'      // Slide up
  | 'ori';      // Slide down

/**
 * Fingering pattern (simplified - true = hole closed, false = hole open)
 * Holes from top to bottom: [1, 2, 3, 4, 5] (thumb is hole 5)
 */
export type Fingering = [boolean, boolean, boolean, boolean, boolean];

/**
 * Complete symbol definition for a shakuhachi note
 */
export interface KinkoSymbol {
  /** Japanese kana character */
  kana: string;

  /** Romanized name */
  romaji: string;

  /** Western pitch equivalent (for reference) */
  pitch: string;

  /** Default octave */
  defaultOctave: Octave;

  /** Basic fingering pattern (otsu octave) */
  fingering: Fingering;

  /** Whether meri/kari alterations are commonly used */
  canAlter: boolean;

  /** Unicode code point (for reference) */
  unicode: string;
}

/**
 * Basic Kinko-ryū note symbols
 *
 * The fundamental five notes (五音 go-on) of Kinko notation,
 * representing the D pentatonic scale on a standard 1.8 shakuhachi.
 */
export const kinkoMap: Record<string, KinkoSymbol> = {
  ro: {
    kana: 'ロ',
    romaji: 'ro',
    pitch: 'D4',  // On 1.8 shakuhachi
    defaultOctave: 'otsu',
    fingering: [true, true, true, true, true],  // All holes closed
    canAlter: true,
    unicode: 'U+30ED'
  },

  tsu: {
    kana: 'ツ',
    romaji: 'tsu',
    pitch: 'F4',
    defaultOctave: 'otsu',
    fingering: [true, true, true, true, false],  // Bottom hole (thumb) open
    canAlter: true,
    unicode: 'U+30C4'
  },

  re: {
    kana: 'レ',
    romaji: 're',
    pitch: 'G4',
    defaultOctave: 'otsu',
    fingering: [true, true, true, false, false],  // Bottom two holes open
    canAlter: true,
    unicode: 'U+30EC'
  },

  chi: {
    kana: 'チ',
    romaji: 'chi',
    pitch: 'A4',
    defaultOctave: 'otsu',
    fingering: [true, true, false, false, false],  // Top two holes closed
    canAlter: true,
    unicode: 'U+30C1'
  },

  ri: {
    kana: 'リ',
    romaji: 'ri',
    pitch: 'C5',  // Note: sometimes B4 depending on fingering
    defaultOctave: 'otsu',
    fingering: [true, false, false, false, false],  // Only top hole closed
    canAlter: true,
    unicode: 'U+30EA'
  },

  // Additional common notes
  u: {
    kana: 'ウ',
    romaji: 'u',
    pitch: 'C4',  // Lower than ro
    defaultOctave: 'otsu',
    fingering: [true, true, true, true, true],  // All closed + special embouchure
    canAlter: false,
    unicode: 'U+30A6'
  },

  hi: {
    kana: 'ヒ',
    romaji: 'hi',
    pitch: 'E4',
    defaultOctave: 'otsu',
    fingering: [true, true, true, false, true],
    canAlter: true,
    unicode: 'U+30D2'
  }
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
  return Object.values(kinkoMap).find(symbol => symbol.kana === kana);
}

/**
 * Helper function to get symbol by romaji name
 */
export function getSymbolByRomaji(romaji: string): KinkoSymbol | undefined {
  return kinkoMap[romaji.toLowerCase()];
}

/**
 * Helper function to get symbol by western pitch (e.g., "D4", "G4", "A4")
 */
export function getSymbolByPitch(pitch: string): KinkoSymbol | undefined {
  return Object.values(kinkoMap).find(symbol => symbol.pitch === pitch);
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
  otsu: 0,      // Base octave
  kan: 12,      // +1 octave (12 semitones)
  daikan: 24    // +2 octaves (24 semitones)
};

/**
 * Pitch alterations in semitones
 */
export const alterationSemitones: Record<string, number> = {
  'meri': -1,        // Half step down
  'dai-meri': -2,    // Whole step down
  'kari': 1          // Half step up
};

/**
 * Visual symbols for meri/kari pitch alterations
 */
export const meriKariSymbols: Record<string, string> = {
  'meri': '◁',       // Left-pointing triangle
  'dai-meri': '◀',   // Filled left-pointing triangle
  'kari': '▷'        // Right-pointing triangle
};

/**
 * Visual symbols for performance techniques
 */
export const techniqueSymbols: Record<string, string> = {
  'yuri': '〜',       // Wave/tilde for vibrato
  'atari': '>',      // Accent mark
  'muraiki': 'ム',   // Katakana mu
  'uchi': '^',       // Strong attack
  'suri': '↗',       // Slide up
  'ori': '↘'         // Slide down
};

/**
 * Number of dots to display for each octave register
 */
export const octaveDots: Record<Octave, { above: number; below: number }> = {
  'otsu': { above: 0, below: 1 },
  'kan': { above: 1, below: 0 },
  'daikan': { above: 2, below: 0 }
};

// TODO: Add Tozan notation mappings when needed
// export const tozanMap: Record<string, TozanSymbol> = { ... };
