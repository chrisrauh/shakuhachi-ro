/**
 * Kinko-ryū Pitch Mapping Constants
 *
 * Maps Western written notes to shakuhachi fingerings, for a D shakuhachi
 * (1.8 shaku). MusicXML and ABC import and export both read this one table.
 *
 * This is a sensible default for import, not the truth. Meri and chu-meri are
 * approximations of Western pitches, and which fingering a player uses for a
 * given pitch depends on school, piece and context. An imported score is a
 * starting point its author corrects in the editor. The defaults are under
 * review with players in #423.
 *
 * Every fingering here has its own Western note, so our own export reads back
 * exactly. Notes are looked up by sounding pitch, so F#4 and Gb4 import the
 * same way; the spelling in each key is the one export writes.
 */

import type { MeriKari, PitchStep } from '../types/ScoreData';

export interface PitchMapping {
  step: PitchStep;
  octave: number;
  meriKari?: MeriKari;
}

export type NoteLetter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

/** A written Western note. `alter` is in semitones: -1 flat, 1 sharp */
export interface WrittenPitch {
  letter: NoteLetter;
  alter: number;
  octave: number;
}

/**
 * Pitch table for D shakuhachi (Kinko-ryū), one entry per Western note
 */
export const KINKO_PITCH_MAP: Record<string, PitchMapping> = {
  // ============================================================
  // OTSU REGISTER (Lower Octave) - C4 to C5
  // ============================================================

  C4: { step: 'ro', octave: 0, meriKari: 'dai-meri' }, // ro dai-meri (大メ)
  'C#4': { step: 'ro', octave: 0, meriKari: 'meri' }, // ro meri (メ)
  D4: { step: 'ro', octave: 0 }, // ro (ロ) - fundamental note
  'D#4': { step: 'tsu', octave: 0, meriKari: 'meri' }, // tsu meri (ツメ)
  E4: { step: 'tsu', octave: 0, meriKari: 'chu-meri' }, // tsu chu-meri (ツ中メ)
  F4: { step: 'tsu', octave: 0 }, // tsu (ツ)
  'F#4': { step: 're', octave: 0, meriKari: 'meri' }, // re meri (レメ)
  G4: { step: 're', octave: 0 }, // re (レ)
  'G#4': { step: 'u', octave: 0 }, // u (ウ)
  A4: { step: 'chi', octave: 0 }, // chi (チ)
  'A#4': { step: 'chi', octave: 0, meriKari: 'meri' }, // chi meri (チメ) - under review, #423
  B4: { step: 'ri', octave: 0, meriKari: 'chu-meri' }, // ri chu-meri (リ中メ)
  C5: { step: 'ri', octave: 0 }, // ri (リ)

  // ============================================================
  // KAN REGISTER (Middle Octave) - C#5 to C6
  // ============================================================

  'C#5': { step: 'ro', octave: 1, meriKari: 'meri' }, // ro meri kan
  D5: { step: 'ro', octave: 1 }, // ro kan (ロ甲)
  'D#5': { step: 'tsu', octave: 1, meriKari: 'meri' }, // tsu meri kan
  E5: { step: 'tsu', octave: 1, meriKari: 'chu-meri' }, // tsu chu-meri kan
  F5: { step: 'tsu', octave: 1 }, // tsu kan (ツ甲)
  'F#5': { step: 're', octave: 1, meriKari: 'meri' }, // re meri kan
  G5: { step: 're', octave: 1 }, // re kan (レ甲)
  'G#5': { step: 'chi', octave: 1, meriKari: 'meri' }, // chi meri kan - under review, #423
  A5: { step: 'chi', octave: 1 }, // chi kan (チ甲)
  'A#5': { step: 'chi', octave: 1, meriKari: 'chu-meri' }, // chi chu-meri kan - under review, #423
  B5: { step: 'ri', octave: 1 }, // ri kan (リ甲) - under review, #423
  C6: { step: 'hi', octave: 1 }, // hi kan (ヒ甲) - under review, #423

  // ============================================================
  // DAI-KAN REGISTER (Upper Octave) - C#6 to B6
  // ============================================================

  'C#6': { step: 'ro', octave: 2, meriKari: 'meri' }, // ro meri dai-kan
  D6: { step: 'ro', octave: 2 }, // ro dai-kan (ロ大甲)
  'D#6': { step: 'tsu', octave: 2, meriKari: 'meri' }, // tsu meri dai-kan
  E6: { step: 'tsu', octave: 2, meriKari: 'chu-meri' }, // tsu chu-meri dai-kan
  F6: { step: 'tsu', octave: 2 }, // tsu dai-kan (ツ大甲)
  'F#6': { step: 're', octave: 2, meriKari: 'meri' }, // re meri dai-kan
  G6: { step: 're', octave: 2 }, // re dai-kan (レ大甲)
  'G#6': { step: 'chi', octave: 2, meriKari: 'meri' }, // chi meri dai-kan
  A6: { step: 'chi', octave: 2 }, // chi dai-kan (チ大甲)
  'A#6': { step: 'hi', octave: 2, meriKari: 'meri' }, // hi meri dai-kan
  B6: { step: 'hi', octave: 2 }, // hi dai-kan (ヒ大甲) - upper limit
};

const LETTER_SEMITONES: Record<NoteLetter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/** Sounding pitch as a MIDI note number, so enharmonic spellings compare equal */
function midiNumber({ letter, alter, octave }: WrittenPitch): number {
  return (octave + 1) * 12 + LETTER_SEMITONES[letter] + alter;
}

export function isNoteLetter(value: unknown): value is NoteLetter {
  return typeof value === 'string' && value in LETTER_SEMITONES;
}

function fingeringKey({ step, octave, meriKari }: PitchMapping): string {
  return `${step}-${octave}-${meriKari ?? ''}`;
}

function parseTableKey(key: string): WrittenPitch {
  const match = /^([A-G])(#?)(\d)$/.exec(key);
  if (!match) {
    throw new Error(`Malformed pitch table key: ${key}`);
  }
  return {
    letter: match[1] as NoteLetter,
    alter: match[2] ? 1 : 0,
    octave: Number(match[3]),
  };
}

const BY_PITCH = new Map<number, PitchMapping>();
const BY_FINGERING = new Map<string, WrittenPitch>();

for (const [key, fingering] of Object.entries(KINKO_PITCH_MAP)) {
  const written = parseTableKey(key);
  // Export relies on each fingering having exactly one note, and import on
  // each note having exactly one fingering
  if (BY_FINGERING.has(fingeringKey(fingering))) {
    throw new Error(`Pitch table has two notes for one fingering: ${key}`);
  }
  if (BY_PITCH.has(midiNumber(written))) {
    throw new Error(`Pitch table has two entries for one pitch: ${key}`);
  }
  BY_PITCH.set(midiNumber(written), fingering);
  BY_FINGERING.set(fingeringKey(fingering), written);
}

const PITCHES = Object.keys(KINKO_PITCH_MAP).map((key) => ({
  key,
  midi: midiNumber(parseTableKey(key)),
}));
const LOWEST = PITCHES.reduce((a, b) => (b.midi < a.midi ? b : a));
const HIGHEST = PITCHES.reduce((a, b) => (b.midi > a.midi ? b : a));

/** The table's range as written, e.g. "C4–B6" */
export const PITCH_RANGE = `${LOWEST.key}–${HIGHEST.key}`;

/** Whether a note lies below or above the table, or within it */
export function rangePosition(
  written: WrittenPitch,
): 'below' | 'above' | 'within' {
  const midi = midiNumber(written);
  if (midi < LOWEST.midi) return 'below';
  if (midi > HIGHEST.midi) return 'above';
  return 'within';
}

/**
 * The default fingering for a written note, matched by sounding pitch.
 * Undefined when the note is outside the table (out of range, or a
 * fractional alter such as a quarter tone).
 */
export function fingeringForPitch(
  written: WrittenPitch,
): PitchMapping | undefined {
  return BY_PITCH.get(midiNumber(written));
}

/** The written note export uses for a fingering, if the table has one */
export function pitchForFingering(
  fingering: PitchMapping,
): WrittenPitch | undefined {
  return BY_FINGERING.get(fingeringKey(fingering));
}
