/**
 * DurationLineModifier - Horizontal duration lines for shakuhachi notation
 *
 * In Kinko shakuhachi notation, horizontal lines positioned to the right
 * of notes indicate note duration:
 * - Whole note (duration=4): 0 lines
 * - Half note (duration=2): 0 lines
 * - Quarter note (duration=1): 1 line
 * - Eighth note (duration=0.5): 2 lines
 *
 * The lines are horizontal, span the full height of the note, and connect
 * to adjacent notes that also have lines.
 * Following VexFlow's Modifier pattern - positions itself relative to note.
 */

import { Modifier, type ModifierLayout } from './Modifier';
import type { RenderingBackend } from '../renderer/RenderingBackend';

/**
 * Where a duration line meets a note, as a fraction of the font size above the
 * baseline. Tuned so consecutive segments join cleanly; this is not the glyph's
 * optical centre (see KANA_OPTICAL_CENTER_RATIO in ShakuNote).
 */
const NOTE_VERTICAL_MIDDLE_RATIO = 0.25;

/** Where the line starts relative to the note baseline: just above the note */
const LINE_START_OFFSET_Y = -22;

export class DurationLineModifier extends Modifier {
  /** Number of lines to render */
  private lineCount: number;

  /** Whether this is the last note in a continuous duration line sequence */
  private lastInSequence: boolean;

  /** Horizontal spacing between multiple lines (when lineCount > 1) */
  private lineSpacing: number = 8;

  /** Line width/thickness */
  private lineWidth: number = 1.5;

  /** Color of the lines */
  private color: string = '#000';

  /**
   * Creates a duration line modifier
   *
   * @param lineCount - Number of lines to render
   * @param isLastInSequence - Whether this is the last note in a continuous duration line sequence
   * @param position - 'right' for horizontal layout, 'below' for vertical layout
   */
  constructor(
    lineCount: number,
    isLastInSequence: boolean = false,
    position: 'right' | 'below' = 'right',
  ) {
    super(position);
    this.lineCount = lineCount;

    this.lastInSequence = isLastInSequence;
    this.setDefaultOffsets();
  }

  /**
   * Length of the line extending downward, from the layout.
   *
   * The last segment in a sequence ends at the middle of its note. Any other
   * runs exactly the distance to the next note, where the next segment starts
   * (both share the same offsetY), so consecutive segments meet without a
   * gap. They must not overlap either: overlapping segments cause
   * anti-aliasing artifacts (visible as two colors on the line in dark mode).
   */
  private lineLength({ distanceToNext, noteFontSize }: ModifierLayout): number {
    if (this.lastInSequence) {
      // Last note: line ends at the vertical middle of the current note
      const verticalMiddleOfCurrentNote =
        -noteFontSize * NOTE_VERTICAL_MIDDLE_RATIO;
      return verticalMiddleOfCurrentNote - LINE_START_OFFSET_Y;
    }
    return distanceToNext;
  }

  /**
   * Set default offsets based on position
   */
  private setDefaultOffsets(): void {
    if (this.position === 'right') {
      // Position to the right of the note, with small margin past modifiers
      // (modifiers at offsetX=22, so duration line at 26 for 4px margin)
      this.offsetX = 26;
      this.offsetY = LINE_START_OFFSET_Y;
    } else {
      // Position below the note (horizontal layout - not typically used for duration lines)
      this.offsetX = 0;
      this.offsetY = 15;
    }
  }

  /**
   * Renders the duration lines (vertical lines to the right of notes)
   *
   * Lines extend downward from each note and connect when consecutive
   * notes both have duration lines.
   *
   * @param renderer - Backend to draw with
   * @param noteX - X coordinate of the note center
   * @param noteY - Y coordinate of the note baseline
   * @param layout - Where the note sits in the score, which sets the length
   */
  render(
    renderer: RenderingBackend,
    noteX: number,
    noteY: number,
    layout: ModifierLayout,
  ): void {
    const startX = noteX + this.offsetX;
    const startY = noteY + this.offsetY;
    const lineLength = this.lineLength(layout);

    // Draw each line (multiple lines side-by-side for eighth notes, etc.)
    for (let i = 0; i < this.lineCount; i++) {
      // Horizontal offset for multiple lines
      const lineXOffset = i * this.lineSpacing;

      // Draw single vertical line extending downward
      renderer.drawLine(
        startX + lineXOffset,
        startY,
        startX + lineXOffset,
        startY + lineLength,
        this.color,
        this.lineWidth,
      );
    }
  }

  /**
   * Sets the spacing between multiple lines (for eighth notes, etc.)
   */
  setLineSpacing(spacing: number): this {
    this.lineSpacing = spacing;
    return this;
  }

  /**
   * Sets the line width/thickness
   */
  setLineWidth(width: number): this {
    this.lineWidth = width;
    return this;
  }

  /**
   * Sets the color of the lines
   */
  setColor(color: string): this {
    this.color = color;
    return this;
  }

  /**
   * Gets the width occupied by this modifier
   */
  getWidth(): number {
    if (this.lineCount === 0) return 0;
    return this.lineWidth + (this.lineCount - 1) * this.lineSpacing;
  }

  /**
   * Gets the height occupied by this modifier (length of vertical line)
   */
  getHeight(layout: ModifierLayout): number {
    return this.lineLength(layout);
  }

  /**
   * Gets the number of lines
   */
  getLineCount(): number {
    return this.lineCount;
  }
}
