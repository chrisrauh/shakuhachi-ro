/**
 * Score Data Type Definitions
 *
 * TypeScript types for the minimal JSON score data format. A note records
 * what the score writes, not what sounds: the fingering table gives the
 * sound. Fields use MusicXML meanings where MusicXML has them
 * (docs/SCORE-DATA-FORMAT.MD).
 *
 * Note: Column layout is determined dynamically by the renderer
 * based on available space. Score data contains only the sequence of notes.
 */

/**
 * The main notation character of a note (譜字 fuji), by name (Kinko-ryū): the
 * five basic notes, u, hi and ha, the characters written with a small hole
 * number, such as go no hi (ヒ with 五), and characters other Kinko charts use
 * (i, a, ru). The name is not the glyph: `style` picks how it is drawn. Which
 * pitch each gives, and how it is fingered, is in the fingering table
 * (constants/kinko-fingerings.ts).
 */
export const CHARACTERS = [
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
export type Character = (typeof CHARACTERS)[number];

/**
 * Notation style
 */
export type NotationStyle = 'kinko' | 'tozan';

/**
 * The meri or kari mark written beside a note. The same meaning as MusicXML
 * <accidental>: the written mark, not the change in sound. Meri lowers a note
 * and kari raises it, played by changing the angle of the lips to the blowing
 * edge. Meri also changes the tone colour.
 *
 * The exact pitch change varies with school, piece and player, so the values
 * name the marks, not intervals. Pitch that moves within a note (yuri, ori,
 * suri) is a separate technique, not an accidental.
 *
 * Some fingerings are played meri or kari without a mark (u, san no u); the
 * fingering table records that.
 */
export const ACCIDENTALS = [
  'dai-meri',
  'meri',
  'chu-meri',
  'chu-kari',
  'kari',
  'dai-kari',
] as const;
export type Accidental = (typeof ACCIDENTALS)[number];

/**
 * Individual note within a score
 */
export interface ScoreNote {
  /** The main notation character (undefined for rests) */
  character?: Character;

  /** 0 otsu (the low register), 1 kan, 2 daikan (undefined for rests) */
  register?: number;

  /** The meri or kari mark written beside the note, if any */
  accidental?: Accidental;

  /**
   * Length in beats, as an exact fraction: "1" is one beat, "1/2" half a
   * beat, "3" three beats. A length with a half ("3/2", "5/2"…, "3/4") is
   * drawn with a dot. See types/Duration.ts for the lengths notation can
   * show.
   */
  duration: string;

  /** Rest indicator (a rest has no character, register or accidental) */
  rest?: boolean;
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
