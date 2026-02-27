/**
 * DurationDotModifier - Duration dot indicator for dotted notes
 *
 * In Kinko shakuhachi notation, small dots positioned to the right/below
 * notes indicate dotted durations (similar to Western notation).
 * These dots extend the note duration by half its value.
 *
 * Following VexFlow's Modifier pattern - positions itself relative to note.
 */

import { Modifier } from './Modifier';
import type { SVGRenderer } from '../renderer/SVGRenderer';

export class DurationDotModifier extends Modifier {
  /** Radius of the duration dot */
  private dotRadius: number = 2.5;

  /** Color of the dot */
  private color: string = '#000';

  /**
   * Creates a duration dot modifier
   *
   * @param position - 'right' for horizontal layout, 'below' for vertical layout
   */
  constructor(position: 'right' | 'below' = 'right') {
    super(position);
    this.setDefaultOffsets();
  }

  /**
   * Set default offsets based on position
   */
  private setDefaultOffsets(): void {
    if (this.position === 'right') {
      // Position to the right of the note (horizontal layout)
      this.offsetX = 15;
      this.offsetY = 0;
    } else {
      // Position below the note (vertical layout)
      this.offsetX = 0;
      this.offsetY = 12;
    }
  }

  /**
   * Renders the duration dot
   *
   * @param renderer - SVGRenderer instance
   * @param noteX - X coordinate of the note center
   * @param noteY - Y coordinate of the note baseline
   */
  render(renderer: SVGRenderer, noteX: number, noteY: number): void {
    const x = noteX + this.offsetX;
    const y = noteY + this.offsetY;
    renderer.drawCircle(x, y, this.dotRadius, this.color);
  }

  /**
   * Sets the dot radius
   */
  setDotRadius(radius: number): this {
    this.dotRadius = radius;
    return this;
  }

  /**
   * Sets the color of the dot
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
    return this.dotRadius * 2;
  }
}
