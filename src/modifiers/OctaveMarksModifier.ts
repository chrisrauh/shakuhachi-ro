/**
 * OctaveMarksModifier - Octave indicator for shakuhachi notation
 *
 * In Kinko shakuhachi notation, octave changes are indicated by small stroke marks:
 * - No mark: otsu (base octave)
 * - 1 small stroke to upper-left: kan (first overtone, +1 octave)
 * - 2 small strokes to upper-left: daikan (second overtone, +2 octaves)
 *
 * Following VexFlow's Modifier pattern - positions itself relative to note.
 */

import { Modifier, type ModifierPosition } from './Modifier';
import type { SVGRenderer } from '../renderer/SVGRenderer';

export class OctaveMarksModifier extends Modifier {
  /** Number of marks to render (1 or 2) */
  private count: 1 | 2;

  /** Length of each stroke mark */
  private strokeLength: number = 6;

  /** Spacing between strokes (when count = 2) */
  private strokeSpacing: number = 6;

  /** Color of the strokes */
  private color: string = '#000';

  /** Stroke width */
  private strokeWidth: number = 1.5;

  /**
   * Creates an octave marks modifier
   *
   * @param count - Number of stroke marks (1 or 2)
   * @param position - 'above' for higher octaves, 'below' for lower octave
   */
  constructor(count: 1 | 2 = 1, position: 'above' | 'below' = 'above') {
    super(position);
    this.count = count;
    this.setDefaultOffsets();
  }

  /**
   * Set default offsets based on position
   */
  private setDefaultOffsets(): void {
    if (this.position === 'above') {
      // Position to the left and above the note (traditional Kinko style)
      if (this.count === 1) {
        this.offsetX = -12; // Left of character
        this.offsetY = -20; // Single mark above
      } else {
        this.offsetX = -12; // Left of character
        this.offsetY = -25; // Two marks, start higher
      }
    } else {
      // Position below the note
      this.offsetX = -12;
      this.offsetY = 12; // Below the note
    }
  }

  /**
   * Renders the octave mark(s) as short diagonal strokes
   *
   * @param renderer - SVGRenderer instance
   * @param noteX - X coordinate of the note center
   * @param noteY - Y coordinate of the note baseline
   */
  render(renderer: SVGRenderer, noteX: number, noteY: number): void {
    if (this.count === 1) {
      // Single diagonal stroke to upper-left
      const x = noteX + this.offsetX;
      const y = noteY + this.offsetY;
      renderer.drawLine(
        x, y,
        x + this.strokeLength, y - this.strokeLength,
        this.color,
        this.strokeWidth
      );
    } else {
      // Two diagonal strokes (stacked vertically)
      const x = noteX + this.offsetX;
      const y1 = noteY + this.offsetY;
      const y2 = y1 + this.strokeSpacing;

      renderer.drawLine(
        x, y1,
        x + this.strokeLength, y1 - this.strokeLength,
        this.color,
        this.strokeWidth
      );
      renderer.drawLine(
        x, y2,
        x + this.strokeLength, y2 - this.strokeLength,
        this.color,
        this.strokeWidth
      );
    }
  }

  /**
   * Sets the stroke length
   */
  setStrokeLength(length: number): this {
    this.strokeLength = length;
    return this;
  }

  /**
   * Sets the spacing between strokes (for 2-stroke variant)
   */
  setStrokeSpacing(spacing: number): this {
    this.strokeSpacing = spacing;
    return this;
  }

  /**
   * Sets the stroke width
   */
  setStrokeWidth(width: number): this {
    this.strokeWidth = width;
    return this;
  }

  /**
   * Sets the color of the strokes
   */
  setColor(color: string): this {
    this.color = color;
    return this;
  }

  /**
   * Gets the width occupied by this modifier
   */
  getWidth(): number {
    return this.strokeLength;
  }

  /**
   * Gets the height occupied by this modifier
   */
  getHeight(): number {
    if (this.count === 1) {
      return this.strokeLength;
    } else {
      return this.strokeLength + this.strokeSpacing;
    }
  }

  /**
   * Gets the number of strokes
   */
  getCount(): number {
    return this.count;
  }
}
