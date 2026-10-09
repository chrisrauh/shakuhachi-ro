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
