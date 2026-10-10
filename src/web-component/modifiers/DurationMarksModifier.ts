/**
 * DurationMarksModifier - How long a note is, in Kinko notation
 *
 * A note's length is written down the column as slots: the note itself, a
 * stroke under it for each extra beat, then a dot or a stroke for a half.
 * Lines to the right of a slot halve it (one line) or quarter it (two), and
 * run on into the lines of the next slot or note, so a line marks the notes
 * that share a beat. A dot after whole beats is half a beat with no line, as
 * in Koga's Dawn in the Forest: ロ・ リ, the line starting at リ (#438).
 *
 * The layout gives each stroke a note's height and each dot a smaller one,
 * which it reads from extraHeight().
 */

import { Modifier, type ModifierLayout } from './Modifier';
import type { RenderingBackend } from '../renderer/RenderingBackend';
import type { Beats } from '../types/Duration';
import { writtenLength } from '../types/Duration';

/** One slot of a note's length in the column, and the lines beside it */
export interface DurationSlot {
  kind: 'note' | 'stroke' | 'dot';
  lines: number;
}

/** Heights of the slots in the column */
export interface SlotSpacing {
  /** A note's, which a stroke takes too */
  noteSpacing: number;
  /** A dot's */
  dotSpacing: number;
}

/**
 * Where a duration line meets a note, as a fraction of the font size above the
 * baseline. Tuned so consecutive segments join cleanly; this is not the glyph's
 * optical centre (KANA_OPTICAL_CENTER_RATIO).
 */
const NOTE_VERTICAL_MIDDLE_RATIO = 0.25;

/** Where a slot's lines start relative to its baseline: just above the note */
const LINE_START_OFFSET_Y = -22;

/** Lines sit right of the note, a little past its meri and kari marks */
const LINE_OFFSET_X = 26;

/** Optical centre of a kana glyph above the baseline, as in ShakuNote */
const KANA_OPTICAL_CENTER_RATIO = 0.4;

/** A stroke's length as a fraction of the font size, as in the Koga duet */
const STROKE_LENGTH_RATIO = 0.4;

/** Number of lines that halve a length `num / den` of a beat until it fits */
function linesFor(num: number, den: number): number {
  let lines = 0;
  while (num * 2 ** lines < den) lines++;
  return lines;
}

/**
 * The slots a note of `beats` takes, dotted or not. Whole beats come first,
 * the note and a stroke for each extra one, then the half: a dot, or a stroke
 * with its line. A note that starts off the beat is written the same way, as
 * the score doesn't know where its beats fall until it has bars (#465).
 *
 * Expects a supported length (isSupported), and a dot only with a half.
 */
export function durationSlots(beats: Beats, dotted = false): DurationSlot[] {
  const written = writtenLength(beats, dotted);
  const whole = Math.floor(written.num / written.den);
  const part = written.num - whole * written.den;
  const slots: DurationSlot[] = [];

  if (whole > 0) {
    slots.push({ kind: 'note', lines: 0 });
    for (let i = 1; i < whole; i++) slots.push({ kind: 'stroke', lines: 0 });
    if (part > 0) {
      slots.push({ kind: 'stroke', lines: linesFor(part, written.den) });
    }
  } else if (written.num === 3) {
    // Three quarters with no dot: half a beat, then a quarter
    slots.push({ kind: 'note', lines: 1 }, { kind: 'stroke', lines: 2 });
  } else {
    slots.push({ kind: 'note', lines: linesFor(part, written.den) });
  }

  if (dotted) {
    // Half a beat after whole beats, with no line; a quarter after half a beat
    slots.push({ kind: 'dot', lines: whole > 0 ? 0 : 2 });
  }
  return slots;
}

export class DurationMarksModifier extends Modifier {
  private readonly slots: DurationSlot[];

  /** Whether the next note has lines, so the last slot's lines run on to it */
  private readonly linesContinue: boolean;

  private lineSpacing = 8;
  private lineWidth = 1.5;
  private strokeWidth = 2;
  private dotRadius = 2.5;
  private color = '#000';

  /**
   * @param slots - The note's slots, from durationSlots()
   * @param linesContinue - Whether the next note starts with lines
   */
  constructor(slots: DurationSlot[], linesContinue: boolean) {
    super('right');
    this.slots = slots;
    this.linesContinue = linesContinue;
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
    return this.slots
      .slice(1)
      .reduce((sum, slot) => sum + slotHeight(slot, spacing), 0);
  }

  render(
    renderer: RenderingBackend,
    noteX: number,
    noteY: number,
    layout: ModifierLayout,
  ): void {
    const { noteFontSize, distanceToNext } = layout;

    // Each slot's baseline, as if a note sat there
    const baselines: number[] = [];
    let baseline = noteY;
    for (const slot of this.slots) {
      baselines.push(baseline);
      baseline += slotHeight(slot, layout);
    }

    // A stroke or dot sits midway between the optical centres of the glyphs
    // before and after it
    const markY = (s: number) =>
      baselines[s] +
      (slotHeight(this.slots[s], layout) - layout.noteSpacing) / 2 -
      noteFontSize * KANA_OPTICAL_CENTER_RATIO;

    // Where a slot's lines start. The slot before runs its lines to here, so
    // segments meet without overlapping: overlaps show as two colours on the
    // line in dark mode, from anti-aliasing.
    const lineTop = (s: number) =>
      this.slots[s].kind === 'dot'
        ? markY(s) - this.dotRadius * 3
        : baselines[s] + LINE_START_OFFSET_Y;

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
        renderer.drawCircle(noteX, markY(s), this.dotRadius, this.color);
      }

      if (slot.lines === 0) return;
      const next = this.slots[s + 1];
      const runsOn = next ? next.lines > 0 : this.linesContinue;
      let end: number;
      if (runsOn) {
        end = next
          ? lineTop(s + 1)
          : noteY + distanceToNext + LINE_START_OFFSET_Y;
      } else if (slot.kind === 'dot') {
        end = markY(s) + this.dotRadius * 3;
      } else {
        end = baselines[s] - noteFontSize * NOTE_VERTICAL_MIDDLE_RATIO;
      }
      for (let i = 0; i < slot.lines; i++) {
        const x = noteX + this.offsetX + i * this.lineSpacing;
        renderer.drawLine(x, lineTop(s), x, end, this.color, this.lineWidth);
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

function slotHeight(slot: DurationSlot, spacing: SlotSpacing): number {
  return slot.kind === 'dot' ? spacing.dotSpacing : spacing.noteSpacing;
}
