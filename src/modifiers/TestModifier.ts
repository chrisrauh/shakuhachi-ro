/**
 * TestModifier - Simple test implementation of Modifier base class
 *
 * Draws a colored circle to verify the modifier system works.
 * This will be removed once real modifiers are implemented.
 */

import { Modifier, type ModifierPosition } from './Modifier';
import type { SVGRenderer } from '../renderer/SVGRenderer';

export class TestModifier extends Modifier {
  private color: string;
  private radius: number;

  /**
   * Creates a test modifier that draws a colored circle
   * @param position - Where to position relative to note
   * @param color - Circle color
   * @param radius - Circle radius
   */
  constructor(
    position: ModifierPosition = 'above',
    color: string = '#FF5722',
    radius: number = 6
  ) {
    super(position);
    this.color = color;
    this.radius = radius;

    // Set default offsets based on position
    this.setDefaultOffsets();
  }

  /**
   * Set sensible default offsets based on position
   */
  private setDefaultOffsets(): void {
    switch (this.position) {
      case 'above':
        this.offsetY = -25; // Above the note
        this.offsetX = 0;
        break;
      case 'below':
        this.offsetY = 15; // Below the note
        this.offsetX = 0;
        break;
      case 'left':
        this.offsetX = -15; // Left of note
        this.offsetY = -5;
        break;
      case 'right':
        this.offsetX = 15; // Right of note
        this.offsetY = -5;
        break;
    }
  }

  /**
   * Renders the test modifier (a colored circle)
   */
  render(renderer: SVGRenderer, noteX: number, noteY: number): void {
    const x = noteX + this.offsetX;
    const y = noteY + this.offsetY;

    renderer.drawCircle(x, y, this.radius, this.color);
  }

  /**
   * Returns the width occupied by this modifier
   */
  getWidth(): number {
    return this.radius * 2;
  }

  /**
   * Returns the height occupied by this modifier
   */
  getHeight(): number {
    return this.radius * 2;
  }
}
