/**
 * ABC Notation Pitch Mapping Constants
 *
 * Maps ABC pitch notation to shakuhachi fingerings for Kinko style notation.
 * This mapping is specific to D shakuhachi (1.8 shaku).
 *
 * ABC Notation Octave System:
 * - Uppercase letters (C-B) = octave 4 (middle C to B4)
 * - Lowercase letters (c-b) = octave 5 (C5 to B5)
 * - Apostrophe after lowercase (c', d') = octave 6+
 * - Comma before uppercase (,C, ,D) = octave 3 and below
 *
 * ABC Accidentals:
 * - ^ (sharp) raises pitch by half step
 * - ^^ (double sharp) raises pitch by whole step
 * - _ (flat) lowers pitch by half step
 * - __ (double flat) lowers pitch by whole step
 * - = (natural) cancels previous accidentals
 *
 * D Shakuhachi Base Mapping (K:D):
 * - D → ro (ロ)
 * - E → (tsu chu-meri)
 * - F → tsu (ツ)
 * - G → re (レ)
 * - A → chi (チ)
 * - B → ri (リ) chu-meri
 * - C → ri (リ)
 */

import type { PitchStep } from '../types/ScoreData';

export interface ABCPitchMapping {
  step: PitchStep;
  octave: number;
  meri?: boolean;
  chu_meri?: boolean;
  dai_meri?: boolean;
}

/**
 * Comprehensive ABC to Kinko pitch mapping for D shakuhachi
 * Maps ABC notation (e.g., "D", "^d", "d'") to shakuhachi fingerings
 */
export const ABC_TO_KINKO_MAP: Record<string, ABCPitchMapping> = {
  // ============================================================
  // OTSU REGISTER (Lower Octave) - Uppercase letters (D4-C5)
  // ============================================================

  // Ro (ロ) - D4 base note
  C: { step: 'ro', octave: 0, dai_meri: true }, // ro dai-meri (大メ)
  '^C': { step: 'ro', octave: 0, meri: true }, // ro meri (メ)
  _D: { step: 'ro', octave: 0, meri: true }, // ro meri (メ)
  '=D': { step: 'ro', octave: 0 }, // ro (ロ) - natural
  D: { step: 'ro', octave: 0 }, // ro (ロ) - fundamental note

  // Tsu (ツ) - F4 base note
  '^D': { step: 'tsu', octave: 0, meri: true }, // tsu meri (ツメ)
  _E: { step: 'tsu', octave: 0, meri: true }, // tsu meri (ツメ)
  E: { step: 'tsu', octave: 0, chu_meri: true }, // tsu chu-meri (ツ中メ)
  '=F': { step: 'tsu', octave: 0 }, // tsu (ツ) - natural
  F: { step: 'tsu', octave: 0 }, // tsu (ツ)

  // Re (レ) - G4 base note
  '^F': { step: 're', octave: 0, meri: true }, // re meri (レメ)
  _G: { step: 're', octave: 0, meri: true }, // re meri (レメ)
  '=G': { step: 're', octave: 0 }, // re (レ) - natural
  G: { step: 're', octave: 0 }, // re (レ)

  // U/Chi (ウ/チ) - G#4/A4 base notes
  '^G': { step: 'u', octave: 0 }, // u (ウ) - also called "chi meri"
  _A: { step: 'u', octave: 0 }, // u (ウ)
  '=A': { step: 'chi', octave: 0 }, // chi (チ) - natural
  A: { step: 'chi', octave: 0 }, // chi (チ)
  '^A': { step: 'chi', octave: 0, meri: true }, // chi meri (チメ)
  _B: { step: 'chi', octave: 0, meri: true }, // chi meri (チメ)

  // Ri (リ) - C5 base note
  '=B': { step: 'ri', octave: 0, chu_meri: true }, // ri chu-meri (リ中メ) - natural
  B: { step: 'ri', octave: 0, chu_meri: true }, // ri chu-meri (リ中メ)

  // ============================================================
  // KAN REGISTER (Middle Octave) - Lowercase letters (D5-C6)
  // ============================================================

  // c5 is at the end of otsu register
  '=c': { step: 'ri', octave: 0 }, // ri (リ) - natural
  c: { step: 'ri', octave: 0 }, // ri (リ)

  // Ro kan (ロ甲) - D5 base note
  '^c': { step: 'ro', octave: 1, meri: true }, // ro meri kan
  _d: { step: 'ro', octave: 1, meri: true }, // ro meri kan
  '=d': { step: 'ro', octave: 1 }, // ro kan (ロ甲) - natural
  d: { step: 'ro', octave: 1 }, // ro kan (ロ甲)

  // Tsu kan (ツ甲) - F5 base note
  '^d': { step: 'tsu', octave: 1, meri: true }, // tsu meri kan
  _e: { step: 'tsu', octave: 1, meri: true }, // tsu meri kan
  e: { step: 'tsu', octave: 1, chu_meri: true }, // tsu chu-meri kan
  '=f': { step: 'tsu', octave: 1 }, // tsu kan (ツ甲) - natural
  f: { step: 'tsu', octave: 1 }, // tsu kan (ツ甲)

  // Re kan (レ甲) - G5 base note
  '^f': { step: 're', octave: 1, meri: true }, // re meri kan
  _g: { step: 're', octave: 1, meri: true }, // re meri kan
  '=g': { step: 're', octave: 1 }, // re kan (レ甲) - natural
  g: { step: 're', octave: 1 }, // re kan (レ甲)

  // Chi kan (チ甲) - A5 base note
  '^g': { step: 'chi', octave: 1, meri: true }, // chi meri kan
  _a: { step: 'chi', octave: 1, meri: true }, // chi meri kan
  '=a': { step: 'chi', octave: 1 }, // chi kan (チ甲) - natural
  a: { step: 'chi', octave: 1 }, // chi kan (チ甲)
  '^a': { step: 'chi', octave: 1, chu_meri: true }, // chi chu-meri kan
  _b: { step: 'chi', octave: 1, chu_meri: true }, // chi chu-meri kan

  // Ri/Hi kan (リ/ヒ甲) - B5/C6
  '=b': { step: 'ri', octave: 1 }, // ri kan (リ甲) - natural
  b: { step: 'ri', octave: 1 }, // ri kan (リ甲)

  // ============================================================
  // DAI-KAN REGISTER (Upper Octave) - Apostrophe notation (D6+)
  // ============================================================

  // Hi kan (ヒ甲) - C6
  "=c'": { step: 'hi', octave: 1 }, // hi kan (ヒ甲) - natural
  "c'": { step: 'hi', octave: 1 }, // hi kan (ヒ甲)

  // Ro dai-kan (ロ大甲) - D6
  "^c'": { step: 'ro', octave: 2, meri: true }, // ro meri dai-kan
  "_d'": { step: 'ro', octave: 2, meri: true }, // ro meri dai-kan
  "=d'": { step: 'ro', octave: 2 }, // ro dai-kan (ロ大甲) - natural
  "d'": { step: 'ro', octave: 2 }, // ro dai-kan (ロ大甲)

  // Tsu dai-kan (ツ大甲) - F6
  "^d'": { step: 'tsu', octave: 2, meri: true }, // tsu meri dai-kan
  "_e'": { step: 'tsu', octave: 2, meri: true }, // tsu meri dai-kan
  "e'": { step: 'tsu', octave: 2, chu_meri: true }, // tsu chu-meri dai-kan
  "=f'": { step: 'tsu', octave: 2 }, // tsu dai-kan (ツ大甲) - natural
  "f'": { step: 'tsu', octave: 2 }, // tsu dai-kan (ツ大甲)

  // Re dai-kan (レ大甲) - G6
  "^f'": { step: 're', octave: 2, meri: true }, // re meri dai-kan
  "_g'": { step: 're', octave: 2, meri: true }, // re meri dai-kan
  "=g'": { step: 're', octave: 2 }, // re dai-kan (レ大甲) - natural
  "g'": { step: 're', octave: 2 }, // re dai-kan (レ大甲)

  // Chi dai-kan (チ大甲) - A6
  "^g'": { step: 'chi', octave: 2, meri: true }, // chi meri dai-kan
  "_a'": { step: 'chi', octave: 2, meri: true }, // chi meri dai-kan
  "=a'": { step: 'chi', octave: 2 }, // chi dai-kan (チ大甲) - natural
  "a'": { step: 'chi', octave: 2 }, // chi dai-kan (チ大甲)

  // Hi dai-kan (ヒ大甲) - B6 (upper limit)
  "^a'": { step: 'hi', octave: 2, meri: true }, // hi meri dai-kan
  "_b'": { step: 'hi', octave: 2, meri: true }, // hi meri dai-kan
  "=b'": { step: 'hi', octave: 2 }, // hi dai-kan (ヒ大甲) - natural
  "b'": { step: 'hi', octave: 2 }, // hi dai-kan (ヒ大甲)
};

/**
 * Create reverse mapping for serialization (shakuhachi → ABC)
 * Returns a map from "step-octave-meri-chu_meri-dai_meri" to ABC notation
 */
export function createReverseABCMap(): Map<string, string> {
  const reverseMap = new Map<string, string>();

  for (const [abcPitch, mapping] of Object.entries(ABC_TO_KINKO_MAP)) {
    // Create key from mapping properties
    const key = `${mapping.step}-${mapping.octave}-${mapping.meri || false}-${mapping.chu_meri || false}-${mapping.dai_meri || false}`;

    // Prefer shorter notation (without accidentals/naturals) when multiple options exist
    if (
      !reverseMap.has(key) ||
      abcPitch.length < (reverseMap.get(key)?.length || Infinity)
    ) {
      reverseMap.set(key, abcPitch);
    }
  }

  return reverseMap;
}
