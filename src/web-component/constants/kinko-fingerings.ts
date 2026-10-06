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

import {
  MERI_KARI,
  PITCH_STEPS,
  type MeriKari,
  type PitchStep,
} from '../types/ScoreData';
import { kinkoMap, pitchToMidi } from './kinko-symbols';

/** What a score writes for a fingering */
export interface WrittenFingering {
  step: PitchStep;
  octave: number;
  meriKari?: MeriKari;
}

export interface Fingering {
  /** Column number in Koga's chart. Absent for a row from another chart */
  koga?: number;
  /** The chart a row comes from, where it isn't Koga's */
  source?: string;
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
 * Koga's 84 fingerings, in his order, then fingerings other charts name
 * where Koga doesn't, then other charts' holes for fingerings Koga names. A
 * fingering with several rows has several sets of holes, all at one pitch. Chin positions come from Koga's
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
  { koga: 38, pitch: 'E5', holes: '●●●●○', chin: 'chu-meri', written: { step: 'tsu', octave: 1, meriKari: 'chu-meri' } },
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
  { koga: 61, pitch: 'C6', holes: '●○○○●', chin: 'neutral', written: { step: 'hi', octave: 1 } },
  { koga: 62, pitch: 'C6', holes: '◐○○●●', chin: 'meri' },
  { koga: 63, pitch: 'C#6', holes: '◐○○●●', chin: 'meri', written: { step: 'go-no-hi', octave: 1, meriKari: 'meri' }, default: true },
  { koga: 64, pitch: 'C#6', holes: '◐○○○○', chin: undefined },
  { koga: 65, pitch: 'C#6', holes: '●○○●○', chin: undefined },
  { koga: 66, pitch: 'D6', holes: '◐●●●●', chin: 'meri', written: { step: 'go-no-ha', octave: 1 } },
  { koga: 67, pitch: 'D6', holes: '○○○●●', chin: 'neutral', written: { step: 'go-no-hi', octave: 1 }, default: true },
  { koga: 68, pitch: 'D6', holes: '○○○○●', chin: 'neutral', written: { step: 'go-no-hi', octave: 1 } },
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
  // From other charts, where Koga doesn't name a fingering
  { source: 'Nyokai-An', pitch: 'C#4', holes: '●●●●●', chin: 'chu-meri', written: { step: 'ro', octave: 0, meriKari: 'chu-meri' } },
  // Other holes for fingerings Koga names, from other charts
  { source: 'Nyokai-An', pitch: 'E4', holes: '●●●●○', chin: 'chu-meri', written: { step: 'tsu', octave: 0, meriKari: 'chu-meri' } },
  { source: 'Nyokai-An', pitch: 'G4', holes: '●●◐●○', chin: 'meri', written: { step: 'u', octave: 0, meriKari: 'meri' } },
  { source: 'Nyokai-An', pitch: 'G4', holes: '●●○●●', chin: 'meri', written: { step: 'u', octave: 0, meriKari: 'meri' } },
  { source: 'Nyokai-An', pitch: 'G#4', holes: '●●◐●○', chin: 'meri', written: { step: 'u', octave: 0 } },
  { source: 'Nyokai-An', pitch: 'G#4', holes: '●●◐○○', chin: 'meri', written: { step: 'u', octave: 0 } },
  { source: 'Nyokai-An, fingchart6', pitch: 'A#4', holes: '●◐○●●', chin: 'meri', written: { step: 'ri', octave: 0, meriKari: 'meri' } },
  { source: 'Nyokai-An, fingchart6, shak-fingering', pitch: 'B4', holes: '●◐○●●', chin: 'chu-meri', written: { step: 'ri', octave: 0, meriKari: 'chu-meri' } },
  { source: 'shak-fingering', pitch: 'D5', holes: '●◐●●●', chin: 'neutral', written: { step: 'ro', octave: 1 } },
  { source: 'Nyokai-An, fingchart6', pitch: 'D5', holes: '○○○○●', chin: 'neutral', written: { step: 'go-no-hi', octave: 0 } },
  { source: 'Nyokai-An, fingchart6', pitch: 'A#5', holes: '●◐○●●', chin: 'meri', written: { step: 'hi', octave: 1, meriKari: 'meri' } },
  { source: 'Nyokai-An, fingchart6', pitch: 'A#5', holes: '●◐○○●', chin: 'meri', written: { step: 'hi', octave: 1, meriKari: 'meri' } },
  { source: 'Nyokai-An, fingchart6, shak-fingering', pitch: 'B5', holes: '●◐○●●', chin: 'chu-meri', written: { step: 'hi', octave: 1, meriKari: 'chu-meri' } },
  { source: 'Nyokai-An, fingchart6', pitch: 'B5', holes: '●◐○○●', chin: 'chu-meri', written: { step: 'hi', octave: 1, meriKari: 'chu-meri' } },
  { source: 'Nyokai-An, fingchart6', pitch: 'C#6', holes: '◐○○○●', chin: 'meri', written: { step: 'go-no-hi', octave: 1, meriKari: 'meri' } },
  { source: 'Nyokai-An', pitch: 'D6', holes: '○●●●●', chin: 'meri', written: { step: 'go-no-ha', octave: 1 } },
  { source: 'shak-fingering', pitch: 'D6', holes: '●◐●●●', chin: 'meri', written: { step: 'go-no-ha', octave: 1 } },
  { source: 'Nyokai-An, fingchart6', pitch: 'E6', holes: '○●○○●', chin: undefined, written: { step: 'shi-no-ha', octave: 1 } },
  { source: 'Nyokai-An', pitch: 'F6', holes: '●●●●○', chin: 'neutral', written: { step: 'tsu', octave: 2 } },
  { source: 'shak-fingering', pitch: 'F6', holes: '●●●●◐', chin: 'neutral', written: { step: 'tsu', octave: 2 } },
  { source: 'Nyokai-An', pitch: 'G6', holes: '●◐●○○', chin: 'neutral', written: { step: 're', octave: 2 } },
  { source: 'Nyokai-An, shak-fingering', pitch: 'A#6', holes: '○●●●○', chin: 'meri', written: { step: 'hi', octave: 2, meriKari: 'meri' } },
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
  // A fingering may have several rows, one per set of holes, but export
  // relies on all of them giving it one pitch
  const known = PITCH_BY_WRITTEN.get(writtenKey(fingering.written));
  if (known && midiNumber(known) !== midiNumber(pitch)) {
    throw new Error(`Two pitches for ${writtenKey(fingering.written)}`);
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
 * How far a mark moves a note, in semitones, for a step and mark no chart
 * lists in any octave. Chosen with the owner (#430): the commonest offset in
 * the charts, and +1 for dai-kari as Nyokai-An gives chi dai-kari.
 *
 * These are part of the export format. Import finds an unlisted fingering's
 * octave by recomputing its pitch, so changing an offset would make files
 * exported before the change read back as the pitch's default. Add offsets
 * for new marks; never change existing ones.
 */
const MARK_OFFSETS: Record<MeriKari, number> = {
  'dai-meri': -2,
  meri: -1,
  'chu-meri': -1,
  'chu-kari': 1,
  kari: 1,
  'dai-kari': 1,
};

const NOTE_NAMES: [NoteLetter, number][] = [
  ['C', 0],
  ['C', 1],
  ['D', 0],
  ['D', 1],
  ['E', 0],
  ['F', 0],
  ['F', 1],
  ['G', 0],
  ['G', 1],
  ['A', 0],
  ['A', 1],
  ['B', 0],
];

/** A MIDI note number as a written note, altered notes spelled sharp */
function fromMidi(midi: number): WrittenPitch {
  const [letter, alter] = NOTE_NAMES[midi % 12];
  return { letter, alter, octave: Math.floor(midi / 12) - 1 };
}

/** The pitch of a step's plain character in an octave, e.g. kan ri: C6 */
function plainMidi(step: PitchStep, octave: number): number {
  return pitchToMidi(kinkoMap[step].pitch) + 12 * octave;
}

/** How far a mark moves this step: from the table if any octave lists it */
function markOffset(step: PitchStep, meriKari: MeriKari): number {
  const listed = NAMED.find(
    (f) => f.written.step === step && f.written.meriKari === meriKari,
  );
  if (!listed) return MARK_OFFSETS[meriKari];
  const { pitch, written } = listed;
  return midiNumber(parseTablePitch(pitch)) - plainMidi(step, written.octave);
}

/**
 * The written note export uses for a fingering. A listed fingering has its
 * table pitch. Any other is estimated from its character's pitch, moved by
 * its mark as the same mark moves that step in another octave, or else by
 * MARK_OFFSETS. Undefined for a step, octave or mark this table doesn't know.
 */
export function pitchForFingering(
  written: WrittenFingering,
): WrittenPitch | undefined {
  const listed = PITCH_BY_WRITTEN.get(writtenKey(written));
  if (listed) return listed;
  const { step, octave, meriKari } = written;
  if (
    !Object.hasOwn(kinkoMap, step) ||
    ![0, 1, 2].includes(octave) ||
    (meriKari !== undefined && !Object.hasOwn(MARK_OFFSETS, meriKari))
  ) {
    return undefined;
  }
  const offset = meriKari ? markOffset(step, meriKari) : 0;
  return fromMidi(plainMidi(step, octave) + offset);
}

/** Reads a fingering name, e.g. "ri-chu-meri", into its step and mark */
function parseFingeringName(
  name: string,
): Omit<WrittenFingering, 'octave'> | undefined {
  // Longest first, so "ri-chu-meri" isn't read as ri-chu with meri
  const meriKari = [...MERI_KARI]
    .sort((a, b) => b.length - a.length)
    .find((mark) => name.endsWith(`-${mark}`));
  const step = meriKari ? name.slice(0, -meriKari.length - 1) : name;
  if (!(PITCH_STEPS as readonly string[]).includes(step)) return undefined;
  return { step: step as PitchStep, ...(meriKari && { meriKari }) };
}

/**
 * The fingering a name gives a written note, if export would have written
 * that fingering as that note. The octave is the one whose pitch matches.
 * Undefined when none does, e.g. when the note was edited after export, so
 * import falls back to the pitch's default.
 */
export function namedFingering(
  written: WrittenPitch,
  name: string,
): WrittenFingering | undefined {
  const parsed = parseFingeringName(name);
  if (!parsed) return undefined;
  const midi = midiNumber(written);
  for (const octave of [0, 1, 2]) {
    const candidate = { ...parsed, octave };
    const pitch = pitchForFingering(candidate);
    if (pitch && midiNumber(pitch) === midi) return candidate;
  }
  return undefined;
}

/** Whether import gives this fingering without being told which */
export function isDefaultFingering(written: WrittenFingering): boolean {
  const pitch = pitchForFingering(written);
  const fallback = pitch && defaultFingering(pitch);
  return fallback !== undefined && writtenKey(fallback) === writtenKey(written);
}
