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
 * The ideographic character face of the notation fonts, in em above the
 * baseline: the box that the type designer says CJK ink fills. Read from the
 * BASE table (icft, icfb) of Noto Sans JP; Noto Serif JP differs by 1/1000 em.
 * Kana ink sits inside it. See docs/TYPOGRAPHY.MD.
 */
export const IDEOGRAPHIC_FACE_TOP = 0.838;
export const IDEOGRAPHIC_FACE_BOTTOM = -0.078;

/**
 * The middle of a note glyph, in em above the baseline: the centre of the
 * ideographic face. Strokes, rests and centre duration lines align to it.
 */
export const GLYPH_CENTRE =
  (IDEOGRAPHIC_FACE_TOP + IDEOGRAPHIC_FACE_BOTTOM) / 2;

/**
 * How far a duration line on the column's centre line runs past the
 * ideographic face at a column break, in em: below the last note of one
 * column, and above the first note of the next, the same at both ends (#507).
 * Half an em: 16px at the default 32px font. Chosen by eye, from 18px.
 */
const COLUMN_BREAK_LINE_REACH_RATIO = 0.5;

/** How far above a note's baseline a centre line from the previous column starts. */
export function columnBreakLineReachAbove(fontSize: number): number {
  return fontSize * (IDEOGRAPHIC_FACE_TOP + COLUMN_BREAK_LINE_REACH_RATIO);
}

/** How far below a note's baseline a centre line to the next column ends. */
export function columnBreakLineReachBelow(fontSize: number): number {
  return fontSize * (COLUMN_BREAK_LINE_REACH_RATIO - IDEOGRAPHIC_FACE_BOTTOM);
}
