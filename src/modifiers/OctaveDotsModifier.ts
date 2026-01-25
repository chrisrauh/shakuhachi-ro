/**
 * OctaveDotsModifier - Octave indicator for shakuhachi notation
 *
 * In shakuhachi notation, dots indicate octave changes:
 * - 1 dot above: kan (first overtone, +1 octave)
 * - 2 dots above: daikan (second overtone, +2 octaves)
 * - 1 dot below: lower octave (less common)
 *
 * Following VexFlow's Modifier pattern - positions itself relative to note.
 */

import { Modifier, type ModifierPosition } from './Modifier';
import type { SVGRenderer } from '../renderer/SVGRenderer';

export class OctaveDotsModifier extends Modifier {
  /** Number of dots to render (1 or 2) */
  private count: 1 | 2;

  /** Radius of each dot */
  private dotRadius: number = 3;

  /** Spacing between dots (when count = 2) */
  private dotSpacing: number = 8;

  /** Color of the dots */
  private color: string = '#000';

  /**
   * Creates an octave dots modifier
   *
   * @param count - Number of dots (1 or 2)
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
      // Position above the note
      if (this.count === 1) {
        this.offsetX = 0;
        this.offsetY = -20; // Single dot above
      } else {
        this.offsetX = 0;
        this.offsetY = -25; // Two dots, start higher
      }
    } else {
      // Position below the note
      this.offsetX = 0;
      this.offsetY = 12; // Below the note
    }
  }

  /**
   * Renders the octave dot(s)
   *
   * @param renderer - SVGRenderer instance
   * @param noteX - X coordinate of the note center
   * @param noteY - Y coordinate of the note baseline
   */
  render(renderer: SVGRenderer, noteX: number, noteY: number): void {
    if (this.count === 1) {
      // Single dot
      const x = noteX + this.offsetX;
      const y = noteY + this.offsetY;
      renderer.drawCircle(x, y, this.dotRadius, this.color);
    } else {
      // Two dots (stacked vertically)
      const x = noteX + this.offsetX;
      const y1 = noteY + this.offsetY;
      const y2 = y1 + this.dotSpacing;

      renderer.drawCircle(x, y1, this.dotRadius, this.color);
      renderer.drawCircle(x, y2, this.dotRadius, this.color);
    }
  }

  /**
   * Sets the dot radius
   */
  setDotRadius(radius: number): this {
    this.dotRadius = radius;
    return this;
  }

  /**
   * Sets the spacing between dots (for 2-dot variant)
   */
  setDotSpacing(spacing: number): this {
    this.dotSpacing = spacing;
    return this;
  }

  /**
   * Sets the color of the dots
   */
  setColor(color: string): this {
    this.color = color;
    return this;
  }

  /**
   * Gets the width occupied by this modifier
   */
  getWidth(): number {
    return this.dotRadius * 2;
  }

  /**
   * Gets the height occupied by this modifier
   */
  getHeight(): number {
    if (this.count === 1) {
      return this.dotRadius * 2;
    } else {
      return this.dotRadius * 2 + this.dotSpacing;
    }
  }

  /**
   * Gets the number of dots
   */
  getCount(): number {
    return this.count;
  }
}
