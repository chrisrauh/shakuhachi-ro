/**
 * MeriKariModifier - Pitch alteration marks for shakuhachi notation
 *
 * In shakuhachi notation, meri/kari indicate pitch alterations:
 * - Meri (メリ): Lowering pitch by tilting head downward (~half step)
 * - Dai-meri (大メリ): Lowering pitch further (~whole step)
 * - Kari (カリ): Raising pitch by tilting head upward (~half step)
 *
 * These are typically shown as marks to the left of the note.
 *
 * Visual representations:
 * - Meri: Single slash or arrow pointing down (/)
 * - Dai-meri: Double slash (//)
 * - Kari: Single slash or arrow pointing up (\)
 *
 * Following VexFlow's Modifier pattern.
 */

import { Modifier, type ModifierPosition } from './Modifier';
import type { SVGRenderer } from '../renderer/SVGRenderer';

export type MeriKariType = 'meri' | 'dai-meri' | 'kari';

export class MeriKariModifier extends Modifier {
  /** Type of pitch alteration */
  private type: MeriKariType;

  /** Length of the mark */
  private markLength: number = 20;

  /** Width/thickness of the mark */
  private strokeWidth: number = 2;

  /** Color of the mark */
  private color: string = '#E91E63'; // Pink to stand out

  /** Spacing between double marks (for dai-meri) */
  private doubleSpacing: number = 5;

  /**
   * Creates a meri/kari modifier
   *
   * @param type - Type of alteration: 'meri', 'dai-meri', or 'kari'
   * @param position - Where to position relative to note (default: 'left')
   */
  constructor(type: MeriKariType = 'meri', position: ModifierPosition = 'left') {
    super(position);
    this.type = type;
    this.setDefaultOffsets();
  }

  /**
   * Set default offsets based on position
   */
  private setDefaultOffsets(): void {
    if (this.position === 'left') {
      this.offsetX = -15; // To the left of note
      this.offsetY = -10; // Centered vertically
    } else if (this.position === 'right') {
      this.offsetX = 15; // To the right of note
      this.offsetY = -10;
    } else {
      // Above or below
      this.offsetX = 0;
      this.offsetY = this.position === 'above' ? -30 : 20;
    }
  }

  /**
   * Renders the meri/kari mark
   *
   * @param renderer - SVGRenderer instance
   * @param noteX - X coordinate of the note center
   * @param noteY - Y coordinate of the note baseline
   */
  render(renderer: SVGRenderer, noteX: number, noteY: number): void {
    const x = noteX + this.offsetX;
    const y = noteY + this.offsetY;

    switch (this.type) {
      case 'meri':
        this.renderMeri(renderer, x, y);
        break;
      case 'dai-meri':
        this.renderDaiMeri(renderer, x, y);
        break;
      case 'kari':
        this.renderKari(renderer, x, y);
        break;
    }
  }

  /**
   * Renders a meri mark (single slash downward)
   * Visual: /
   */
  private renderMeri(renderer: SVGRenderer, x: number, y: number): void {
    // Single diagonal line (top-left to bottom-right)
    const x1 = x;
    const y1 = y;
    const x2 = x + 6;
    const y2 = y + this.markLength;

    renderer.drawLine(x1, y1, x2, y2, this.color, this.strokeWidth);
  }

  /**
   * Renders a dai-meri mark (double slash downward)
   * Visual: //
   */
  private renderDaiMeri(renderer: SVGRenderer, x: number, y: number): void {
    // Two parallel diagonal lines
    const x1a = x - this.doubleSpacing / 2;
    const y1 = y;
    const x2a = x1a + 6;
    const y2 = y + this.markLength;

    const x1b = x + this.doubleSpacing / 2;
    const x2b = x1b + 6;

    renderer.drawLine(x1a, y1, x2a, y2, this.color, this.strokeWidth);
    renderer.drawLine(x1b, y1, x2b, y2, this.color, this.strokeWidth);
  }

  /**
   * Renders a kari mark (single slash upward)
   * Visual: \
   */
  private renderKari(renderer: SVGRenderer, x: number, y: number): void {
    // Single diagonal line (top-right to bottom-left)
    const x1 = x + 6;
    const y1 = y;
    const x2 = x;
    const y2 = y + this.markLength;

    renderer.drawLine(x1, y1, x2, y2, this.color, this.strokeWidth);
  }

  /**
   * Sets the mark length
   */
  setMarkLength(length: number): this {
    this.markLength = length;
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
   * Sets the spacing for double marks (dai-meri)
   */
  setDoubleSpacing(spacing: number): this {
    this.doubleSpacing = spacing;
    return this;
  }

  /**
   * Gets the type of alteration
   */
  getType(): MeriKariType {
    return this.type;
  }

  /**
   * Gets the width occupied by this modifier
   */
  getWidth(): number {
    if (this.type === 'dai-meri') {
      return this.doubleSpacing + 6;
    }
    return 6;
  }

  /**
   * Gets the height occupied by this modifier
   */
  getHeight(): number {
    return this.markLength;
  }
}
