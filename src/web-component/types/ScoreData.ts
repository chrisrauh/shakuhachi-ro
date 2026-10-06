/**
 * Score Data Type Definitions
 *
 * TypeScript types for the minimal JSON score data format.
 * This format follows MusicXML-like structure for familiarity.
 *
 * Note: Column layout is determined dynamically by the renderer
 * based on available space. Score data contains only the sequence of notes.
 */

/**
 * Shakuhachi pitch steps (Kinko-ryū). Each names a written character: the five
 * basic notes, u, hi and ha, the fingerings written with small hole numbers
 * inside the character, such as go no hi (ヒ with 五), and characters other
 * Kinko charts use (i, a, ru). Which pitch each
 * gives, and how it is fingered, is in the fingering table
 * (constants/kinko-fingerings.ts).
 */
export const PITCH_STEPS = [
  'ro',
  'tsu',
  're',
  'u',
  'chi',
  'ri',
  'hi',
  'ha',
  'go-no-hi',
  'go-no-ha',
  'san-no-u',
  'san-no-ha',
  'shi-no-ha',
  'ni-shi-go-no-ha',
  'i',
  'a',
  'ru',
  'yon-go-no-ha',
  'ni-no-ha',
  'yon-no-hi',
  'ni-no-re',
  'ichi-san-no-u',
] as const;
export type PitchStep = (typeof PITCH_STEPS)[number];

/**
 * Notation style
 */
export type NotationStyle = 'kinko' | 'tozan';

/**
 * Pitch information (similar to MusicXML <pitch>)
 */
export interface Pitch {
  /** Fingering step */
  step: PitchStep;

  /** Octave: 0=otsu (base), 1=kan, 2=daikan */
  octave: number;
}

/**
 * Meri or kari: a fixed lowering (meri) or raising (kari) of a note, played by
 * changing the angle of the lips to the blowing edge.
 *
 * The exact pitch change varies with school, piece and player, so this names
 * the technique rather than an interval. Pitch that moves within a note (yuri,
 * ori, suri) is a separate technique, not a meri or kari.
 *
 * On a note, this is the mark the score writes. Some fingerings are played
 * meri or kari without a mark (u, san no u); the fingering table records that.
 */
export const MERI_KARI = [
  'dai-meri',
  'meri',
  'chu-meri',
  'chu-kari',
  'kari',
  'dai-kari',
] as const;
export type MeriKari = (typeof MERI_KARI)[number];

/**
 * Individual note within a score
 */
export interface ScoreNote {
  /** Pitch information (undefined for rests) */
  pitch?: Pitch;

  /** Duration (relative timing units) */
  duration: number;

  /** Rest indicator (mutually exclusive with pitch) */
  rest?: boolean;

  /** Meri or kari, if the note is played with one */
  meriKari?: MeriKari;

  /** Dotted duration indicator (extends duration by half) */
  dotted?: boolean;
}

/**
 * Complete score data structure
 */
export interface ScoreData {
  /** Score title (optional metadata) */
  title?: string;

  /** Notation style (optional metadata) */
  style?: NotationStyle;

  /** Flat array of notes in performance order */
  notes: ScoreNote[];

  /** Optional metadata */
  composer?: string;
  tempo?: string;
  key?: string;
}
