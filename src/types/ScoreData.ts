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
 * Valid shakuhachi pitch steps (Kinko-ryū fingerings) plus rest
 */
export type PitchStep = 'ro' | 'tsu' | 're' | 'chi' | 'ri' | 'u' | 'hi' | 'rest';

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
  /** Pitch information */
  pitch: Pitch;

  /** Duration (relative timing units) */
  duration: number;

  /** Optional meri pitch alteration (slightly flat) */
  meri?: boolean;
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
