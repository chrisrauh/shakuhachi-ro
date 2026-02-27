/**
 * Kinko-ryū Pitch Mapping Constants
 *
 * Maps Western musical pitches to shakuhachi fingerings for Kinko style notation.
 * This mapping is specific to D shakuhachi (1.8 shaku).
 *
 * Based on fingering charts: kinko-chart.pdf, fingerchart.pdf, shak-fingering.png
 *
 * Note: Shakuhachi is microtonal - pitches often differ from Western equal temperament.
 * This mapping provides approximate equivalents for standard MusicXML conversion.
 */

import type { PitchStep } from '../types/ScoreData';

export interface PitchMapping {
  step: PitchStep;
  octave: number;
  meri?: boolean;
  chu_meri?: boolean;
  dai_meri?: boolean;
}

/**
 * Comprehensive pitch mapping for D shakuhachi (Kinko-ryū)
 * Maps Western pitch names (e.g., "D4", "F5") to shakuhachi fingerings
 */
export const KINKO_PITCH_MAP: Record<string, PitchMapping> = {
  // ============================================================
  // OTSU REGISTER (Lower Octave) - D4 to C5
  // ============================================================

  // Ro (ロ) - D4 base note
  C4: { step: 'ro', octave: 0, dai_meri: true }, // ro dai-meri (大メ)
  'C#4': { step: 'ro', octave: 0, meri: true }, // ro meri (メ)
  Db4: { step: 'ro', octave: 0, meri: true }, // ro meri (メ)
  D4: { step: 'ro', octave: 0 }, // ro (ロ) - fundamental note

  // Tsu (ツ) - F4 base note
  'D#4': { step: 'tsu', octave: 0, meri: true }, // tsu meri (ツメ)
  Eb4: { step: 'tsu', octave: 0, meri: true }, // tsu meri (ツメ)
  E4: { step: 'tsu', octave: 0, chu_meri: true }, // tsu chu-meri (ツ中メ)
  F4: { step: 'tsu', octave: 0 }, // tsu (ツ)

  // Re (レ) - G4 base note
  'F#4': { step: 're', octave: 0, meri: true }, // re meri (レメ)
  Gb4: { step: 're', octave: 0, meri: true }, // re meri (レメ)
  G4: { step: 're', octave: 0 }, // re (レ)

  // U/Chi (ウ/チ) - G#4/A4 base notes
  'G#4': { step: 'u', octave: 0 }, // u (ウ) - also called "chi meri"
  Ab4: { step: 'u', octave: 0 }, // u (ウ)
  A4: { step: 'chi', octave: 0 }, // chi (チ)
  'A#4': { step: 'chi', octave: 0, meri: true }, // chi meri (チメ) - raised via kari technique
  Bb4: { step: 'chi', octave: 0, meri: true }, // chi meri (チメ)

  // Ri (リ) - C5 base note
  B4: { step: 'ri', octave: 0, chu_meri: true }, // ri chu-meri (リ中メ)
  C5: { step: 'ri', octave: 0 }, // ri (リ)

  // ============================================================
  // KAN REGISTER (Middle Octave) - D5 to B5
  // ============================================================

  // Ro kan (ロ甲) - D5 base note
  'C#5': { step: 'ro', octave: 1, meri: true }, // ro meri (メ)
  Db5: { step: 'ro', octave: 1, meri: true }, // ro meri (メ)
  D5: { step: 'ro', octave: 1 }, // ro kan (ロ甲)

  // Tsu kan (ツ甲) - F5 base note (E5 also maps here with special fingering)
  'D#5': { step: 'tsu', octave: 1, meri: true }, // tsu meri (ツメ)
  Eb5: { step: 'tsu', octave: 1, meri: true }, // tsu meri (ツメ)
  E5: { step: 'tsu', octave: 1, chu_meri: true }, // tsu chu-meri (ツ中メ) - special fingering
  F5: { step: 'tsu', octave: 1 }, // tsu kan (ツ甲)

  // Re kan (レ甲) - G5 base note
  'F#5': { step: 're', octave: 1, meri: true }, // re meri (レメ)
  Gb5: { step: 're', octave: 1, meri: true }, // re meri (レメ)
  G5: { step: 're', octave: 1 }, // re kan (レ甲)

  // Chi kan (チ甲) - A5 base note
  'G#5': { step: 'chi', octave: 1, meri: true }, // chi meri (チメ)
  Ab5: { step: 'chi', octave: 1, meri: true }, // chi meri (チメ)
  A5: { step: 'chi', octave: 1 }, // chi kan (チ甲)
  'A#5': { step: 'chi', octave: 1, chu_meri: true }, // chi chu-meri (チ中メ)
  Bb5: { step: 'chi', octave: 1, chu_meri: true }, // chi chu-meri (チ中メ)

  // Ri/Hi kan (リ/ヒ甲) - B5/C6
  B5: { step: 'ri', octave: 1 }, // ri kan (リ甲)
  C6: { step: 'hi', octave: 1 }, // hi kan (ヒ甲)

  // ============================================================
  // DAI-KAN REGISTER (Upper Octave) - D6 and above
  // ============================================================

  'C#6': { step: 'ro', octave: 2, meri: true }, // ro meri dai-kan
  Db6: { step: 'ro', octave: 2, meri: true }, // ro meri dai-kan
  D6: { step: 'ro', octave: 2 }, // ro dai-kan (ロ大甲)
  'D#6': { step: 'tsu', octave: 2, meri: true }, // tsu meri dai-kan
  Eb6: { step: 'tsu', octave: 2, meri: true }, // tsu meri dai-kan
  E6: { step: 'tsu', octave: 2, chu_meri: true }, // tsu chu-meri dai-kan
  F6: { step: 'tsu', octave: 2 }, // tsu dai-kan (ツ大甲)
  'F#6': { step: 're', octave: 2, meri: true }, // re meri dai-kan
  Gb6: { step: 're', octave: 2, meri: true }, // re meri dai-kan
  G6: { step: 're', octave: 2 }, // re dai-kan (レ大甲)
  'G#6': { step: 'chi', octave: 2, meri: true }, // chi meri dai-kan
  Ab6: { step: 'chi', octave: 2, meri: true }, // chi meri dai-kan
  A6: { step: 'chi', octave: 2 }, // chi dai-kan (チ大甲)
  'A#6': { step: 'hi', octave: 2, meri: true }, // hi meri dai-kan
  Bb6: { step: 'hi', octave: 2, meri: true }, // hi meri dai-kan
  B6: { step: 'hi', octave: 2 }, // hi dai-kan (ヒ大甲) - upper limit
};
