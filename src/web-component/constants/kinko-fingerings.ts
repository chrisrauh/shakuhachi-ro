/**
 * Kinko-ryū fingering table for a D shakuhachi (1.8 shaku)
 *
 * Every fingering in Koga's chart (Masayuki Koga, "Shakuhachi: Japanese
 * Bamboo Flute", vol. II, pp. 107–108), transcribed in
 * reference/fingering-charts/koga-inventory.md. Each row gives the written
 * Western note, the holes and the chin position. Named fingerings also give
 * what a score writes for them: step, octave and meri/kari mark. Unnamed rows
 * are alternative fingerings for their pitch, kept for fingering diagrams.
 *
 * MusicXML and ABC import and export all read this table. Import gives each
 * pitch its default fingering; export writes each named fingering as its
 * pitch, so our own files read back exactly. Meri and kari only approximate
 * Western pitches, and players choose fingerings by school, piece and
 * context, so an imported score is a starting point its author corrects.
 * Community review of the table is #423.
 */

import type { MeriKari, PitchStep } from '../types/ScoreData';

/** What a score writes for a fingering */
export interface WrittenFingering {
  step: PitchStep;
  octave: number;
  meriKari?: MeriKari;
}

export interface Fingering {
  /** Column number in Koga's chart */
  koga: number;
  /** Written Western note, e.g. 'C#5' */
  pitch: string;
  /**
   * Holes from the back (thumb) hole 5 to the front holes 4, 3, 2 and 1:
   * ● closed, ○ open, ◐ half, ◕ mostly and ◔ slightly covered
   */
  holes: string;
  /**
   * How far the chin lowers (meri) or raises (kari) the pitch. Undefined
   * where no chart says. Not always the written mark: u is played meri.
   */
  chin?: MeriKari | 'neutral';
  /** What a score writes. Absent for Koga's unnamed alternatives */
  written?: WrittenFingering;
  /** The fingering import gives this pitch. One per pitch */
  default?: true;
}

/**
 * Koga's 84 fingerings, in his order. Chin positions come from Koga's
 * "Meri" and "Kari" labels (vol. I, pp. 37 and 39), from the name, or are
 * inferred; the inventory says which. #76 is unnamed in Koga and takes its
 * name, re meri in daikan, from the Nyokai-An chart.
 */
// prettier-ignore
export const FINGERINGS: readonly Fingering[] = [
  { koga: 1, pitch: 'C4', holes: '●●●●●', chin: 'dai-meri', written: { step: 'ro', octave: 0, meriKari: 'dai-meri' }, default: true },
  { koga: 2, pitch: 'C#4', holes: '●●●●●', chin: 'meri', written: { step: 'ro', octave: 0, meriKari: 'meri' }, default: true },
  { koga: 3, pitch: 'D4', holes: '●●●●●', chin: 'neutral', written: { step: 'ro', octave: 0 }, default: true },
  { koga: 4, pitch: 'D4', holes: '●●●●◕', chin: 'dai-meri', written: { step: 'tsu', octave: 0, meriKari: 'dai-meri' } },
  { koga: 5, pitch: 'D#4', holes: '●●●●◕', chin: 'meri', written: { step: 'tsu', octave: 0, meriKari: 'meri' }, default: true },
  { koga: 6, pitch: 'E4', holes: '●●●●◐', chin: 'chu-meri', written: { step: 'tsu', octave: 0, meriKari: 'chu-meri' }, default: true },
  { koga: 7, pitch: 'F4', holes: '●●●●○', chin: 'neutral', written: { step: 'tsu', octave: 0 }, default: true },
  { koga: 8, pitch: 'F4', holes: '●●●◐◔', chin: 'dai-meri', written: { step: 're', octave: 0, meriKari: 'dai-meri' } },
  { koga: 9, pitch: 'F#4', holes: '●●●◐○', chin: 'meri', written: { step: 're', octave: 0, meriKari: 'meri' }, default: true },
  { koga: 10, pitch: 'G4', holes: '●●●○○', chin: 'neutral', written: { step: 're', octave: 0 }, default: true },
  { koga: 11, pitch: 'G4', holes: '●●◐○○', chin: 'meri', written: { step: 'u', octave: 0, meriKari: 'meri' } },
  { koga: 12, pitch: 'G#4', holes: '●●○●●', chin: 'meri', written: { step: 'u', octave: 0 }, default: true },
  { koga: 13, pitch: 'G#4', holes: '●●◕○○', chin: undefined },
  { koga: 14, pitch: 'G#4', holes: '●●◕●○', chin: undefined },
  { koga: 15, pitch: 'G#4', holes: '●●◔●●', chin: undefined },
  { koga: 16, pitch: 'A4', holes: '●●○○○', chin: 'neutral', written: { step: 'chi', octave: 0 }, default: true },
  { koga: 17, pitch: 'A4', holes: '●◕○○○', chin: 'meri' },
  { koga: 18, pitch: 'A4', holes: '●●○○●', chin: undefined },
  { koga: 19, pitch: 'A#4', holes: '●◕○○○', chin: 'meri', written: { step: 'ri', octave: 0, meriKari: 'meri' }, default: true },
  { koga: 20, pitch: 'A#4', holes: '●◕○●●', chin: undefined },
  { koga: 21, pitch: 'B4', holes: '●◔○○○', chin: 'chu-meri', written: { step: 'ri', octave: 0, meriKari: 'chu-meri' }, default: true },
  { koga: 22, pitch: 'B4', holes: '●○○●●', chin: 'meri' },
  { koga: 23, pitch: 'C5', holes: '●○○●●', chin: 'neutral', written: { step: 'ri', octave: 0 }, default: true },
  { koga: 24, pitch: 'C5', holes: '◐○○○●', chin: undefined },
  { koga: 25, pitch: 'C5', holes: '●○○○○', chin: undefined },
  { koga: 26, pitch: 'C#5', holes: '◐○○●●', chin: 'meri', written: { step: 'go-no-hi', octave: 0, meriKari: 'meri' } },
  { koga: 27, pitch: 'C#5', holes: '○○●●○', chin: undefined },
  { koga: 28, pitch: 'C#5', holes: '○○○○○', chin: undefined },
  { koga: 29, pitch: 'C#5', holes: '●●●●●', chin: 'meri', written: { step: 'ro', octave: 1, meriKari: 'meri' }, default: true },
  { koga: 30, pitch: 'D5', holes: '●●●●●', chin: 'neutral', written: { step: 'ro', octave: 1 }, default: true },
  { koga: 31, pitch: 'D5', holes: '○○○●●', chin: 'neutral', written: { step: 'go-no-hi', octave: 0 } },
  { koga: 32, pitch: 'D5', holes: '○○○○○', chin: undefined },
  { koga: 33, pitch: 'D5', holes: '●●●●◕', chin: 'meri' },
  { koga: 34, pitch: 'D#5', holes: '●●●●◕', chin: 'meri', written: { step: 'tsu', octave: 1, meriKari: 'meri' }, default: true },
  { koga: 35, pitch: 'D#5', holes: '◐●●●◕', chin: undefined },
  { koga: 36, pitch: 'D#5', holes: '○○●●●', chin: undefined },
  { koga: 37, pitch: 'E5', holes: '●●●●◐', chin: 'chu-meri', written: { step: 'tsu', octave: 1, meriKari: 'chu-meri' }, default: true },
  { koga: 38, pitch: 'E5', holes: '●●●●○', chin: 'meri' },
  { koga: 39, pitch: 'F5', holes: '●●●●○', chin: 'neutral', written: { step: 'tsu', octave: 1 }, default: true },
  { koga: 40, pitch: 'F5', holes: '●●●◕◐', chin: undefined },
  { koga: 41, pitch: 'F#5', holes: '●●●◐○', chin: 'meri', written: { step: 're', octave: 1, meriKari: 'meri' }, default: true },
  { koga: 42, pitch: 'F#5', holes: '●●●○●', chin: undefined },
  { koga: 43, pitch: 'G5', holes: '●●●○○', chin: 'neutral', written: { step: 're', octave: 1 }, default: true },
  { koga: 44, pitch: 'G5', holes: '●●◐●○', chin: undefined },
  { koga: 45, pitch: 'G#5', holes: '●●◐○○', chin: 'meri', written: { step: 'chi', octave: 1, meriKari: 'meri' }, default: true },
  { koga: 46, pitch: 'G#5', holes: '●●○●○', chin: undefined },
  { koga: 47, pitch: 'G#5', holes: '●●◔○○', chin: undefined },
  { koga: 48, pitch: 'G#5', holes: '●●◔●○', chin: undefined },
  { koga: 49, pitch: 'A5', holes: '●●○○○', chin: 'neutral', written: { step: 'chi', octave: 1 }, default: true },
  { koga: 50, pitch: 'A5', holes: '●●○●●', chin: 'kari' },
  { koga: 51, pitch: 'A5', holes: '●◕○○○', chin: 'meri' },
  { koga: 52, pitch: 'A#5', holes: '●◕○○○', chin: 'meri', written: { step: 'hi', octave: 1, meriKari: 'meri' }, default: true },
  { koga: 53, pitch: 'A#5', holes: '●●○●●', chin: 'kari', written: { step: 'san-no-u', octave: 1 } },
  { koga: 54, pitch: 'A#5', holes: '●◕○●●', chin: undefined },
  { koga: 55, pitch: 'A#5', holes: '●◕○○●', chin: undefined },
  { koga: 56, pitch: 'B5', holes: '●◔○●●', chin: 'chu-meri', written: { step: 'hi', octave: 1, meriKari: 'chu-meri' }, default: true },
  { koga: 57, pitch: 'B5', holes: '●○○●●', chin: 'meri' },
  { koga: 58, pitch: 'B5', holes: '●○○○○', chin: undefined },
  { koga: 59, pitch: 'B5', holes: '●○●●●', chin: undefined },
  { koga: 60, pitch: 'C6', holes: '●○○●●', chin: 'neutral', written: { step: 'hi', octave: 1 }, default: true },
  { koga: 61, pitch: 'C6', holes: '●○○○●', chin: undefined },
  { koga: 62, pitch: 'C6', holes: '◐○○●●', chin: 'meri' },
  { koga: 63, pitch: 'C#6', holes: '◐○○●●', chin: 'meri', written: { step: 'go-no-hi', octave: 1, meriKari: 'meri' }, default: true },
  { koga: 64, pitch: 'C#6', holes: '◐○○○○', chin: undefined },
  { koga: 65, pitch: 'C#6', holes: '●○○●○', chin: undefined },
  { koga: 66, pitch: 'D6', holes: '◐●●●●', chin: 'meri', written: { step: 'go-no-ha', octave: 1 } },
  { koga: 67, pitch: 'D6', holes: '○○○●●', chin: 'neutral', written: { step: 'go-no-hi', octave: 1 }, default: true },
  { koga: 68, pitch: 'D6', holes: '○○○○●', chin: undefined },
  { koga: 69, pitch: 'D#6', holes: '○●○●●', chin: 'meri', written: { step: 'san-no-ha', octave: 1 }, default: true },
  { koga: 70, pitch: 'D#6', holes: '◐●◐○●', chin: undefined },
  { koga: 71, pitch: 'D#6', holes: '○○●○●', chin: undefined, written: { step: 'ni-shi-go-no-ha', octave: 1 } },
  { koga: 72, pitch: 'E6', holes: '●●○○○', chin: 'kari', written: { step: 'shi-no-ha', octave: 1 }, default: true },
  { koga: 73, pitch: 'E6', holes: '○●○○○', chin: undefined },
  { koga: 74, pitch: 'E6', holes: '◐●○○●', chin: undefined },
  { koga: 75, pitch: 'F6', holes: '●●○○●', chin: 'neutral', written: { step: 'tsu', octave: 2 }, default: true },
  { koga: 76, pitch: 'F#6', holes: '●●●●○', chin: 'meri', written: { step: 're', octave: 2, meriKari: 'meri' }, default: true },
  { koga: 77, pitch: 'G6', holes: '●●●○○', chin: 'neutral', written: { step: 're', octave: 2 }, default: true },
  { koga: 78, pitch: 'G#6', holes: '●○●○○', chin: 'meri', written: { step: 'chi', octave: 2, meriKari: 'meri' }, default: true },
  { koga: 79, pitch: 'A6', holes: '●○●●●', chin: 'neutral', written: { step: 'chi', octave: 2 }, default: true },
  { koga: 80, pitch: 'A#6', holes: '○●○●●', chin: 'meri', written: { step: 'hi', octave: 2, meriKari: 'meri' }, default: true },
  { koga: 81, pitch: 'B6', holes: '○●○○○', chin: 'chu-meri', written: { step: 'hi', octave: 2, meriKari: 'chu-meri' }, default: true },
  { koga: 82, pitch: 'C7', holes: '●●●○●', chin: 'neutral', written: { step: 'hi', octave: 2 }, default: true },
  { koga: 83, pitch: 'D7', holes: '●○○●●', chin: 'neutral', written: { step: 'ha', octave: 2 }, default: true },
  { koga: 84, pitch: 'D7', holes: '○○○○○', chin: undefined },
];

export type NoteLetter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

/** A written Western note. `alter` is in semitones: -1 flat, 1 sharp */
export interface WrittenPitch {
  letter: NoteLetter;
  alter: number;
  octave: number;
}

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

/** Reads a table pitch such as 'C#5' */
export function parseTablePitch(pitch: string): WrittenPitch {
  const match = /^([A-G])(#?)(\d)$/.exec(pitch);
  if (!match) {
    throw new Error(`Malformed pitch in the fingering table: ${pitch}`);
  }
  return {
    letter: match[1] as NoteLetter,
    alter: match[2] ? 1 : 0,
    octave: Number(match[3]),
  };
}

/**
 * Names a written fingering in exported files, e.g. "ri-meri", "san-no-u".
 * One word, so it also works as an ABC decoration.
 */
export function fingeringName({ step, meriKari }: WrittenFingering): string {
  return meriKari ? `${step}-${meriKari}` : step;
}

function writtenKey(written: WrittenFingering): string {
  return `${fingeringName(written)} ${written.octave}`;
}

const NAMED = FINGERINGS.filter(
  (f): f is Fingering & { written: WrittenFingering } =>
    f.written !== undefined,
);
const DEFAULTS = new Map<number, WrittenFingering>();
const PITCH_BY_WRITTEN = new Map<string, WrittenPitch>();

for (const fingering of NAMED) {
  const pitch = parseTablePitch(fingering.pitch);
  // Export relies on each written fingering having exactly one pitch
  if (PITCH_BY_WRITTEN.has(writtenKey(fingering.written))) {
    throw new Error(`Two rows write ${writtenKey(fingering.written)}`);
  }
  PITCH_BY_WRITTEN.set(writtenKey(fingering.written), pitch);
  if (fingering.default) {
    if (DEFAULTS.has(midiNumber(pitch))) {
      throw new Error(`Two defaults for ${fingering.pitch}`);
    }
    DEFAULTS.set(midiNumber(pitch), fingering.written);
  }
}

const PITCHES = FINGERINGS.map(({ pitch }) => ({
  pitch,
  midi: midiNumber(parseTablePitch(pitch)),
}));
const LOWEST = PITCHES.reduce((a, b) => (b.midi < a.midi ? b : a));
const HIGHEST = PITCHES.reduce((a, b) => (b.midi > a.midi ? b : a));

/** The table's range as written, e.g. "C4–D7" */
export const PITCH_RANGE = `${LOWEST.pitch}–${HIGHEST.pitch}`;

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
 * The fingering import gives a written note, matched by sounding pitch.
 * Undefined when the table has none: out of range, a pitch no chart names
 * (D♭7), or a fractional alter such as a quarter tone.
 */
export function defaultFingering(
  written: WrittenPitch,
): WrittenFingering | undefined {
  return DEFAULTS.get(midiNumber(written));
}

/**
 * The named fingering for a written note, if the table has one by that name
 * at that pitch. Lets import keep a fingering that isn't the pitch's default.
 */
export function namedFingering(
  written: WrittenPitch,
  name: string,
): WrittenFingering | undefined {
  const midi = midiNumber(written);
  return NAMED.find(
    (f) =>
      fingeringName(f.written) === name &&
      midiNumber(parseTablePitch(f.pitch)) === midi,
  )?.written;
}

/** The written note for a fingering, if the table has one */
export function pitchForFingering(
  written: WrittenFingering,
): WrittenPitch | undefined {
  return PITCH_BY_WRITTEN.get(writtenKey(written));
}

/** Whether import gives this fingering without being told which */
export function isDefaultFingering(written: WrittenFingering): boolean {
  const pitch = pitchForFingering(written);
  const fallback = pitch && defaultFingering(pitch);
  return fallback !== undefined && writtenKey(fallback) === writtenKey(written);
}
