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
 * Valid shakuhachi pitch steps (Kinko-ryū fingerings)
 */
export type PitchStep = 'ro' | 'tsu' | 're' | 'chi' | 'ri' | 'u' | 'hi';

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
 * ori, suri) is a separate technique, not a meri or kari. 'kari' will be added
 * when the renderer can draw it.
 */
export const MERI_KARI = ['dai-meri', 'meri', 'chu-meri'] as const;
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
