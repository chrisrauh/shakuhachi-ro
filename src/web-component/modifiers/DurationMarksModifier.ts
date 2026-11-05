/**
 * DurationMarksModifier - How long a note is, in Kinko notation
 *
 * A note's length is written down the column as slots: the note itself, a
 * stroke under it for each extra beat, then a dot for a half. Lines to the
 * right of a slot halve it (one line) or quarter it (two), and run on into the
 * lines of the next slot or note, so a line marks the notes that share a beat.
 * A dot after whole beats is half a beat with no line, as in Koga's Dawn in the
 * Forest: ロ・ リ, the line starting at リ. A dot after half a beat is a
 * quarter, inside the note's line, as in Gyoson: リ レ・ under one line (#438).
 * Koga's scores draw the same lines on the column's centre line instead, over
 * the notes; the render option durationLines picks where they go (#507).
 *
 * The layout gives each stroke a note's height, which it reads from
 * extraHeight(). A dot hangs a fixed gap below the mark above it, and takes
 * only the space it reaches below that mark, so the next note keeps its usual
 * distance from the dot (#488).
 */

import { Modifier, type ModifierLayout, type SlotSpacing } from './Modifier';
import type { RenderingBackend } from '../renderer/RenderingBackend';
import type { Beats } from '../types/Duration';
import { hasHalf, writtenLength } from '../types/Duration';
import {
  columnBreakLineReachAbove,
  columnBreakLineReachBelow,
  GLYPH_CENTRE,
} from './mark-geometry';

/** One slot of a note's length in the column, and the lines beside it */
export interface DurationSlot {
  kind: 'note' | 'stroke' | 'dot';
  lines: number;
}

/**
 * Where a duration line meets a note, as a fraction of the font size above the
 * baseline. Tuned so consecutive segments join cleanly; this is not the glyph's
 * centre (GLYPH_CENTRE).
 */
const NOTE_VERTICAL_MIDDLE_RATIO = 0.25;

/** Where a slot's lines start relative to its baseline: just above the note */
const LINE_START_OFFSET_Y = -22;

/** Lines sit right of the note, a little past its meri and kari marks */
const LINE_OFFSET_X = 26;

/**
 * The gap between the lines of a quarter note on the column's centre line, as
 * a fraction of the font size: 4px at 32px. Matched to Koga's Kurokami, where
 * the gap is about 0.19 of the glyph's height (#507). Beside the note, the gap
 * stays lineSpacing.
 */
const CENTRE_LINE_SPACING_RATIO = 0.125;

/** A stroke's length as a fraction of the font size, as in the Koga duet */
const STROKE_LENGTH_RATIO = 0.4;

const DOT_RADIUS = 2.5;

/** Number of lines that halve a length `num / den` of a beat until it fits */
function linesFor(num: number, den: number): number {
  let lines = 0;
  while (num * 2 ** lines < den) lines++;
  return lines;
}

/**
 * The slots a note of `beats` takes. Whole beats come first, the note and a
 * stroke for each extra one, then a half as a dot. Kinko scores write a half
 * as a dot; no example of a stroke for it has been found (#438). A note that
 * starts off the beat is written the same way, as the score doesn't know
 * where its beats fall until it has bars (#465).
 *
 * Expects a supported length (isSupported).
 */
export function durationSlots(beats: Beats): DurationSlot[] {
  const dotted = hasHalf(beats);
  const written = writtenLength(beats);
  const whole = Math.floor(written.num / written.den);
  const slots: DurationSlot[] = [];

  if (whole > 0) {
    slots.push({ kind: 'note', lines: 0 });
    for (let i = 1; i < whole; i++) slots.push({ kind: 'stroke', lines: 0 });
  } else {
    slots.push({ kind: 'note', lines: linesFor(written.num, written.den) });
  }

  if (dotted) {
    // Half a beat after whole beats, with no line; a quarter after half a
    // beat, the note's line running on beside it
    slots.push({ kind: 'dot', lines: whole > 0 ? 0 : 1 });
  }
  return slots;
}

export class DurationMarksModifier extends Modifier {
  private readonly slots: DurationSlot[];

  /** Whether the next note has lines, so the last slot's lines run on to it */
  private readonly linesContinue: boolean;

  /** Whether the previous note's lines run on into this note */
  private readonly linesFromPrevious: boolean;

  private lineSpacing = 8;
  private lineWidth = 1.5;
  private strokeWidth = 2;
  private color = '#000';

  /**
   * @param slots - The note's slots, from durationSlots()
   * @param linesContinue - Whether the next note starts with lines
   * @param linesFromPrevious - Whether the previous note's lines run on into
   * this one
   */
  constructor(
    slots: DurationSlot[],
    linesContinue: boolean,
    linesFromPrevious = false,
  ) {
    super('right');
    this.slots = slots;
    this.linesContinue = linesContinue;
    this.linesFromPrevious = linesFromPrevious;
    this.offsetX = LINE_OFFSET_X;
    this.offsetY = LINE_START_OFFSET_Y;
  }

  /** Whether a note of these slots needs this modifier at all */
  static marksAnything(slots: DurationSlot[]): boolean {
    return slots.length > 1 || slots[0].lines > 0;
  }

  getSlots(): readonly DurationSlot[] {
    return this.slots;
  }

  /** Space the slots after the note take in the column */
  extraHeight(spacing: SlotSpacing): number {
    let sum = 0;
    for (let s = 1; s < this.slots.length; s++) {
      sum += slotHeight(this.slots, s, spacing);
    }
    return sum;
  }

  render(
    renderer: RenderingBackend,
    noteX: number,
    noteY: number,
    layout: ModifierLayout,
  ): void {
    const { noteFontSize, distanceToNext } = layout;

    // Beside the note, lines go right from the offset, from just above the
    // note. On the centre line, they are spread evenly about it, and start and
    // end at the middle of the glyph, as in Koga's Kurokami.
    const centered = layout.durationLines === 'center';
    const lineX = (i: number, lines: number) =>
      centered
        ? noteX +
          (i - (lines - 1) / 2) * noteFontSize * CENTRE_LINE_SPACING_RATIO
        : noteX + this.offsetX + i * this.lineSpacing;
    const glyphMiddle = -noteFontSize * GLYPH_CENTRE;
    const lineStartOffsetY = centered ? glyphMiddle : LINE_START_OFFSET_Y;
    const lineEndOffsetY = centered
      ? glyphMiddle
      : -noteFontSize * NOTE_VERTICAL_MIDDLE_RATIO;

    // Each slot's baseline, as if a note sat there
    const baselines: number[] = [];
    let baseline = noteY;
    this.slots.forEach((_, s) => {
      baselines.push(baseline);
      baseline += slotHeight(this.slots, s, layout);
    });

    // A stroke sits on the centre of the glyph its slot stands in
    // for. A dot hangs the gap below the mark above it.
    const markY = (s: number) =>
      this.slots[s].kind === 'dot'
        ? baselines[s - 1] +
          markBottom(this.slots[s - 1], noteFontSize) +
          layout.dotGap +
          DOT_RADIUS
        : baselines[s] - noteFontSize * GLYPH_CENTRE;

    // Where a slot's lines start. The slot before runs its lines to here, so
    // segments meet without overlapping: overlaps show as two colours on the
    // line in dark mode, from anti-aliasing.
    const lineTop = (s: number) =>
      this.slots[s].kind === 'dot'
        ? markY(s) - DOT_RADIUS * 3
        : baselines[s] + lineStartOffsetY;

    this.slots.forEach((slot, s) => {
      if (slot.kind === 'stroke') {
        const half = (noteFontSize * STROKE_LENGTH_RATIO) / 2;
        renderer.drawLine(
          noteX,
          markY(s) - half,
          noteX,
          markY(s) + half,
          this.color,
          this.strokeWidth,
        );
      } else if (slot.kind === 'dot') {
        renderer.drawCircle(noteX, markY(s), DOT_RADIUS, this.color);
      }

      if (slot.lines === 0) return;
      const next = this.slots[s + 1];
      const runsOn = next ? next.lines > 0 : this.linesContinue;
      let top = lineTop(s);
      let end: number;
      if (
        centered &&
        s === 0 &&
        this.linesFromPrevious &&
        layout.firstInColumn
      ) {
        // The line comes on from the previous column, so it starts above the
        // glyph, as far past its ink as it ran past the last glyph there
        top = baselines[s] - columnBreakLineReachAbove(noteFontSize);
      }
      if (centered && s === 0 && !runsOn && !this.linesFromPrevious) {
        // A note alone under its line would get a line from its middle to its
        // middle, which is nothing. It gets a line centred on the middle of
        // the glyph that reaches half way to the next note each way: past the
        // glyph, so it shows, but not into the next note's line. Kurokami has
        // no example of this.
        top = baselines[s] + glyphMiddle - distanceToNext / 2;
        end = baselines[s] + glyphMiddle + distanceToNext / 2;
      } else if (
        centered &&
        runsOn &&
        !next &&
        layout.lastInColumn &&
        slot.kind === 'note'
      ) {
        // The line goes on in the next column, so it runs past the glyph's
        // ink, as far as it comes in above the first glyph there
        end = baselines[s] + columnBreakLineReachBelow(noteFontSize);
      } else if (runsOn) {
        end = next ? lineTop(s + 1) : noteY + distanceToNext + lineStartOffsetY;
      } else if (slot.kind === 'dot') {
        end = markY(s) + DOT_RADIUS * 3;
      } else {
        end = baselines[s] + lineEndOffsetY;
      }
      for (let i = 0; i < slot.lines; i++) {
        const x = lineX(i, slot.lines);
        renderer.drawLine(x, top, x, end, this.color, this.lineWidth);
      }
    });
  }

  setColor(color: string): this {
    this.color = color;
    return this;
  }

  /** Width of the lines beside the note */
  getWidth(): number {
    const lines = Math.max(...this.slots.map((slot) => slot.lines));
    if (lines === 0) return 0;
    return this.lineWidth + (lines - 1) * this.lineSpacing;
  }

  /** Height of the column the marks span, down to the next note */
  getHeight(layout: ModifierLayout): number {
    return layout.distanceToNext;
  }
}

/**
 * Height of slot `s` in the column. A note or stroke takes a note's. A dot
 * takes how far it reaches below the mark above it, so the next note stands
 * as far below the dot as it would below that mark.
 */
function slotHeight(
  slots: DurationSlot[],
  s: number,
  spacing: SlotSpacing,
): number {
  if (slots[s].kind !== 'dot') return spacing.noteSpacing;
  return (
    markBottom(slots[s - 1], spacing.noteFontSize) +
    spacing.dotGap +
    DOT_RADIUS * 2
  );
}

/**
 * Where a slot's mark ends, below its baseline: a kana sits on the baseline,
 * and a stroke, centred on the kana's centre, ends above it
 */
function markBottom(slot: DurationSlot, noteFontSize: number): number {
  if (slot.kind !== 'stroke') return 0;
  return -noteFontSize * (GLYPH_CENTRE - STROKE_LENGTH_RATIO / 2);
}
