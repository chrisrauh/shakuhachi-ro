/**
 * AtariModifier - Finger-pop technique indicator for shakuhachi notation
 *
 * Atari (アタリ) is a percussive attack technique where the player pops
 * their finger(s) on/off the holes to create a sharp, percussive sound.
 * It's similar to a finger slap or key click on other woodwinds.
 *
 * Visual representation: typically shown as a ">" mark or small arrow
 * pointing toward the note, indicating a sharp attack.
 *
 * Following VexFlow's Modifier pattern.
 */

import { Modifier, type ModifierPosition } from './Modifier';
import type { SVGRenderer } from '../renderer/SVGRenderer';

export type AtariStyle = 'arrow' | 'chevron' | 'dot';

export class AtariModifier extends Modifier {
  /** Visual style of the atari mark */
  private style: AtariStyle;

  /** Size of the mark */
  private size: number = 10;

  /** Stroke width for lines */
  private strokeWidth: number = 2;

  /** Color of the mark */
  private color: string = '#FF5722'; // Deep orange to stand out

  /**
   * Creates an atari (finger-pop) modifier
   *
   * @param style - Visual style: 'arrow', 'chevron', or 'dot'
   * @param position - Where to position relative to note (default: 'left')
   */
  constructor(style: AtariStyle = 'chevron', position: ModifierPosition = 'left') {
    super(position);
    this.style = style;
    this.setDefaultOffsets();
  }

  /**
   * Set default offsets based on position
   */
  private setDefaultOffsets(): void {
    if (this.position === 'left') {
      this.offsetX = -15; // To the left of note
      this.offsetY = -5; // Centered vertically
    } else if (this.position === 'right') {
      this.offsetX = 15; // To the right of note
      this.offsetY = -5;
    } else if (this.position === 'above') {
      this.offsetX = 0;
      this.offsetY = -25;
    } else {
      this.offsetX = 0;
      this.offsetY = 15;
    }
  }

  /**
   * Renders the atari mark
   *
   * @param renderer - SVGRenderer instance
   * @param noteX - X coordinate of the note center
   * @param noteY - Y coordinate of the note baseline
   */
  render(renderer: SVGRenderer, noteX: number, noteY: number): void {
    const x = noteX + this.offsetX;
    const y = noteY + this.offsetY;

    switch (this.style) {
      case 'arrow':
        this.renderArrow(renderer, x, y);
        break;
      case 'chevron':
        this.renderChevron(renderer, x, y);
        break;
      case 'dot':
        this.renderDot(renderer, x, y);
        break;
    }
  }

  /**
   * Renders an arrow pointing at the note
   * Visual: →
   */
  private renderArrow(renderer: SVGRenderer, x: number, y: number): void {
    const halfSize = this.size / 2;

    // Arrow pointing right (toward note if on left side)
    // Horizontal line
    renderer.drawLine(
      x - this.size,
      y,
      x,
      y,
      this.color,
      this.strokeWidth
    );

    // Arrowhead (two lines forming >)
    renderer.drawLine(
      x,
      y,
      x - halfSize,
      y - halfSize,
      this.color,
      this.strokeWidth
    );
    renderer.drawLine(
      x,
      y,
      x - halfSize,
      y + halfSize,
      this.color,
      this.strokeWidth
    );
  }

  /**
   * Renders a simple chevron/angle bracket
   * Visual: >
   */
  private renderChevron(renderer: SVGRenderer, x: number, y: number): void {
    const halfSize = this.size / 2;

    // Two lines forming > shape
    renderer.drawLine(
      x - halfSize,
      y - halfSize,
      x,
      y,
      this.color,
      this.strokeWidth
    );
    renderer.drawLine(
      x,
      y,
      x - halfSize,
      y + halfSize,
      this.color,
      this.strokeWidth
    );
  }

  /**
   * Renders a solid dot (alternative style)
   * Visual: ●
   */
  private renderDot(renderer: SVGRenderer, x: number, y: number): void {
    renderer.drawCircle(x, y, this.size / 2, this.color);
  }

  /**
   * Sets the size of the mark
   */
  setSize(size: number): this {
    this.size = size;
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
   * Sets the color of the mark
   */
  setColor(color: string): this {
    this.color = color;
    return this;
  }

  /**
   * Sets the visual style
   */
  setStyle(style: AtariStyle): this {
    this.style = style;
    return this;
  }

  /**
   * Gets the visual style
   */
  getStyle(): AtariStyle {
    return this.style;
  }

  /**
   * Gets the width occupied by this modifier
   */
  getWidth(): number {
    return this.size;
  }

  /**
   * Gets the height occupied by this modifier
   */
  getHeight(): number {
    return this.size;
  }
}
