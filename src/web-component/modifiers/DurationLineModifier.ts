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

import { Modifier } from './Modifier';
import type { SVGRenderer } from '../renderer/SVGRenderer';
import { DEFAULT_RENDER_OPTIONS } from '../renderer/RenderOptions';

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

  /**
   * Length of line extending downward.
   * - For last note in sequence: ends at middle of current note
   * - For non-last notes: extends to the start of the next note's segment
   *   to create a continuous line
   */
  private lineLength: number;

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

    // Default length assumes the default note spacing; fitToLayout() replaces
    // it with the actual distance once note positions are known.
    this.lineLength = this.computeLineLength(
      DEFAULT_RENDER_OPTIONS.noteVerticalSpacing,
      DEFAULT_RENDER_OPTIONS.noteFontSize,
    );
  }

  /**
   * Sizes the line from the actual layout.
   *
   * A non-last segment runs exactly the distance to the next note, where the
   * next segment starts (both share the same offsetY), so consecutive
   * segments meet without a gap. They must not overlap either: overlapping
   * segments cause anti-aliasing artifacts (visible as two colors on the line
   * in dark mode).
   *
   * @param distanceToNext - Distance from this note's baseline to the next
   *   note's baseline, including any extra spacing after a dotted note
   * @param noteFontSize - Font size of the note glyph
   */
  fitToLayout(distanceToNext: number, noteFontSize: number): this {
    this.lineLength = this.computeLineLength(distanceToNext, noteFontSize);
    return this;
  }

  private computeLineLength(
    distanceToNext: number,
    noteFontSize: number,
  ): number {
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
   * @param renderer - SVGRenderer instance
   * @param noteX - X coordinate of the note center
   * @param noteY - Y coordinate of the note baseline
   */
  render(renderer: SVGRenderer, noteX: number, noteY: number): void {
    const startX = noteX + this.offsetX;
    const startY = noteY + this.offsetY;

    // Draw each line (multiple lines side-by-side for eighth notes, etc.)
    for (let i = 0; i < this.lineCount; i++) {
      // Horizontal offset for multiple lines
      const lineXOffset = i * this.lineSpacing;

      // Draw single vertical line extending downward
      renderer.drawLine(
        startX + lineXOffset,
        startY,
        startX + lineXOffset,
        startY + this.lineLength,
        this.color,
        this.lineWidth,
      );
    }
  }

  /**
   * Sets the length of the line extending downward
   */
  setLineLength(length: number): this {
    this.lineLength = length;
    return this;
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
  getHeight(): number {
    return this.lineLength;
  }

  /**
   * Gets the number of lines
   */
  getLineCount(): number {
    return this.lineCount;
  }
}
