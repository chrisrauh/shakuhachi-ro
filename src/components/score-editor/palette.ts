import {
  MERI_KARI,
  PITCH_STEPS,
  type MeriKari,
  type PitchStep,
} from '../../web-component/types/ScoreData';

/** The seven notes of the basic scale, listed first; the rest key follows them. */
export const MAIN_NOTES: readonly PitchStep[] = [
  'ro',
  'tsu',
  're',
  'chi',
  'ri',
  'u',
  'hi',
];

/** Every other fingering, after the rest key, in the order the score data lists them. */
export const OTHER_NOTES: readonly PitchStep[] = PITCH_STEPS.filter(
  (step) => !MAIN_NOTES.includes(step),
);

/**
 * The Length keys: the length in beats written before any dot, the duration
 * lines the score draws for it, and the key's caption.
 */
export const LENGTHS = [
  { duration: '2', lines: 0, caption: '2 beats' },
  { duration: '1', lines: 0, caption: '1 beat' },
  { duration: '1/2', lines: 1, caption: '½ beat' },
  { duration: '1/4', lines: 2, caption: '¼ beat' },
] as const;

/** The mark each meri and kari is written with, as the score draws it. */
const MARK_GLYPHS: Record<MeriKari, string> = {
  'dai-meri': '大メ',
  meri: 'メ',
  'chu-meri': '中',
  'chu-kari': '中カ',
  kari: 'カ',
  'dai-kari': '大カ',
};

export const MARKS = MERI_KARI.map((mark) => ({
  mark,
  glyph: MARK_GLYPHS[mark],
}));

/** A fingering's name as said and labelled: go-no-hi is "go no hi". */
export function stepName(step: PitchStep): string {
  return step.replaceAll('-', ' ');
}
