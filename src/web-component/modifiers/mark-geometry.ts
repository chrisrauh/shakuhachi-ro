/**
 * Where marks sit around a note. The modifiers that draw them and the layout
 * that leaves room for them read the same values, so changing a mark's offset
 * or size moves the layout with it.
 *
 * Offsets are in pixels from the note's x-centre and baseline.
 */

/** An octave mark: to the right of the note, above it. */
export const OCTAVE_MARK_OFFSET = { x: 18.5, y: -20 } as const;

/** A meri or kari mark, centred beside the note on its left (or right). */
export const MERI_KARI_SIDE_OFFSET = 22;

/** A mark character's box is this wide, as a fraction of its font size. */
export const MARK_WIDTH_RATIO = 0.8;

/**
 * How far above a note's baseline an octave mark reaches: its offset plus its
 * font size, which is room for the character and its ascent.
 */
export function octaveMarkReachAbove(fontSize: number): number {
  return -OCTAVE_MARK_OFFSET.y + fontSize;
}

/** How far to the right of a note's centre an octave mark reaches. */
export function octaveMarkReachRight(fontSize: number): number {
  return OCTAVE_MARK_OFFSET.x + (fontSize * MARK_WIDTH_RATIO) / 2;
}

/** How far to the left of a note's centre a meri or kari mark reaches. */
export function meriKariReachLeft(fontSize: number): number {
  return MERI_KARI_SIDE_OFFSET + (fontSize * MARK_WIDTH_RATIO) / 2;
}

/**
 * How far a kana's ink reaches above and below its baseline, as fractions of
 * its font size. Measured in Noto Sans JP: at 32px, ツ, チ and リ reach 25px
 * above the baseline and 2px below it. Other kana differ by a pixel or two.
 */
export const KANA_INK_ABOVE_RATIO = 25 / 32;
export const KANA_INK_BELOW_RATIO = 2 / 32;

/**
 * How far a duration line on the column's centre line runs past the ink at a
 * column break, as a fraction of the font size: below the last note of one
 * column, and above the first note of the next, the same at both ends (#507).
 * At 32px, 18px: the line then ends inside the column's bottom padding.
 */
const COLUMN_BREAK_LINE_REACH_RATIO = 18 / 32;

/** How far above a note's baseline a centre line from the previous column starts. */
export function columnBreakLineReachAbove(fontSize: number): number {
  return fontSize * (KANA_INK_ABOVE_RATIO + COLUMN_BREAK_LINE_REACH_RATIO);
}

/** How far below a note's baseline a centre line to the next column ends. */
export function columnBreakLineReachBelow(fontSize: number): number {
  return fontSize * (KANA_INK_BELOW_RATIO + COLUMN_BREAK_LINE_REACH_RATIO);
}
