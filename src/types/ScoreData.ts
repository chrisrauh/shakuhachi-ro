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
 * Individual note within a score
 */
export interface ScoreNote {
  /** Pitch information (undefined for rests) */
  pitch?: Pitch;

  /** Duration (relative timing units) */
  duration: number;

  /** Rest indicator (mutually exclusive with pitch) */
  rest?: boolean;

  /** Optional meri pitch alteration (lowers pitch ~half step) */
  meri?: boolean;

  /** Optional kari pitch alteration (raises pitch ~half step) */
  kari?: boolean;

  /** Dotted duration indicator (extends duration by half) */
  dotted?: boolean;
}

/**
 * Complete score data structure
 */
export interface ScoreData {
  /** Score title */
  title: string;

  /** Notation style */
  style: NotationStyle;

  /** Flat array of notes in performance order */
  notes: ScoreNote[];

  /** Optional metadata */
  composer?: string;
  tempo?: string;
  key?: string;
}
