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
import { NOTE } from '../constants/layout-constants';

export class DurationLineModifier extends Modifier {
  /** Number of lines to render */
  private lineCount: number;

  /** Whether this is the last note in a continuous duration line sequence */
  private isLastInSequence: boolean;

  /**
   * Length of line extending downward.
   * - For last note in sequence: ends at middle of current note
   * - For non-last notes: extends to middle of next note to create continuous line
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
  constructor(lineCount: number, isLastInSequence: boolean = false, position: 'right' | 'below' = 'right') {
    super(position);
    this.lineCount = lineCount;
    this.isLastInSequence = isLastInSequence;

    // Calculate line length based on position in sequence
    // For Japanese characters with fontSize=32, the vertical center is
    // approximately 25% above the baseline (around y=-8)
    const verticalMiddleOfCurrentNote = -NOTE.fontSize * 0.25; // ≈ -8px
    const startOffsetY = -22;

    if (isLastInSequence) {
      // Last note: line ends at middle of current note
      this.lineLength = verticalMiddleOfCurrentNote - startOffsetY; // ≈ 14px
    } else {
      // Non-last note: line extends to middle of next note
      // Next note is NOTE.verticalSpacing (44px) below
      const verticalMiddleOfNextNote = NOTE.verticalSpacing + verticalMiddleOfCurrentNote; // ≈ 36px
      this.lineLength = verticalMiddleOfNextNote - startOffsetY; // ≈ 58px
    }

    this.setDefaultOffsets();
  }

  /**
   * Set default offsets based on position
   */
  private setDefaultOffsets(): void {
    if (this.position === 'right') {
      // Position to the right of the note, with small margin past modifiers
      // (modifiers at offsetX=22, so duration line at 26 for 4px margin)
      this.offsetX = 26;
      this.offsetY = -22; // Start just above the note
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
        this.lineWidth
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
    return this.lineWidth + ((this.lineCount - 1) * this.lineSpacing);
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
