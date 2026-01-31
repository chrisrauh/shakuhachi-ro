/**
 * DurationLineModifier - Vertical duration lines for shakuhachi notation
 *
 * In Kinko shakuhachi notation, short vertical lines positioned to the right
 * of notes indicate note duration:
 * - Whole note (duration=4): 0 lines
 * - Half note (duration=2): 1 line
 * - Quarter note (duration=1): 2 lines
 * - Eighth note (duration=0.5): 3 lines
 *
 * The shorter the note value, the more lines appear.
 * Following VexFlow's Modifier pattern - positions itself relative to note.
 */

import { Modifier } from './Modifier';
import type { SVGRenderer } from '../renderer/SVGRenderer';

export class DurationLineModifier extends Modifier {
  /** Number of lines to render */
  private lineCount: number;

  /** Length of each line */
  private lineLength: number = 15;

  /** Spacing between lines */
  private lineSpacing: number = 3;

  /** Line width/thickness */
  private lineWidth: number = 1.5;

  /** Color of the lines */
  private color: string = '#000';

  /**
   * Creates a duration line modifier
   *
   * @param lineCount - Number of lines to render
   * @param position - 'right' for horizontal layout, 'below' for vertical layout
   */
  constructor(lineCount: number, position: 'right' | 'below' = 'right') {
    super(position);
    this.lineCount = lineCount;
    this.setDefaultOffsets();
  }

  /**
   * Set default offsets based on position
   */
  private setDefaultOffsets(): void {
    if (this.position === 'right') {
      // Position to the right of the note (horizontal layout)
      this.offsetX = 12;
      this.offsetY = 0;
    } else {
      // Position below the note (vertical layout)
      this.offsetX = 0;
      this.offsetY = 15;
    }
  }

  /**
   * Renders the duration lines (vertical lines to the right of notes)
   *
   * @param renderer - SVGRenderer instance
   * @param noteX - X coordinate of the note center
   * @param noteY - Y coordinate of the note baseline
   */
  render(renderer: SVGRenderer, noteX: number, noteY: number): void {
    const startX = noteX + this.offsetX;
    const startY = noteY + this.offsetY;

    // Draw each vertical line, spaced horizontally
    for (let i = 0; i < this.lineCount; i++) {
      const lineX = startX + (i * this.lineSpacing);
      renderer.drawLine(
        lineX,
        startY,
        lineX,
        startY + this.lineLength,
        this.color,
        this.lineWidth
      );
    }
  }

  /**
   * Sets the length of each line
   */
  setLineLength(length: number): this {
    this.lineLength = length;
    return this;
  }

  /**
   * Sets the spacing between lines
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
   * Gets the height occupied by this modifier
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
