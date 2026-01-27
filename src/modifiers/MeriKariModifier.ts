/**
 * MeriKariModifier - Pitch alteration marks for shakuhachi notation
 *
 * In shakuhachi notation, meri/kari indicate pitch alterations:
 * - Meri (メリ): Lowering pitch by tilting head downward (~half step)
 * - Dai-meri (大メリ): Lowering pitch further (~whole step)
 * - Kari (カリ): Raising pitch by tilting head upward (~half step)
 *
 * Visual representation in Kinko notation:
 * - Meri: メ (katakana "me") to the left of note
 * - Dai-meri: 大 (kanji "dai" meaning "big/great") to the left of note
 * - Kari: カ (katakana "ka") to the left of note
 *
 * Position: Left of note character
 *
 * Following VexFlow's Modifier pattern.
 */

import { Modifier, type ModifierPosition } from './Modifier';
import type { SVGRenderer } from '../renderer/SVGRenderer';

export type MeriKariType = 'meri' | 'dai-meri' | 'kari';

export class MeriKariModifier extends Modifier {
  /** Type of pitch alteration */
  private type: MeriKariType;

  /** Font size for the meri/kari mark (slightly smaller than main note) */
  private fontSize: number = 16;

  /** Font family */
  private fontFamily: string = 'Noto Sans JP, sans-serif';

  /** Color of the mark */
  private color: string = '#000'; // Black, like traditional notation

  /** Katakana/Kanji characters for each alteration type */
  private static readonly symbols: Record<MeriKariType, string> = {
    'meri': 'メ',      // Katakana "me"
    'dai-meri': '大',  // Kanji "dai" (big/great)
    'kari': 'カ'       // Katakana "ka"
  };

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
   * Set default offsets for left position
   */
  private setDefaultOffsets(): void {
    if (this.position === 'left') {
      this.offsetX = -22; // To the left of note
      this.offsetY = 0;   // Centered vertically with note
    } else if (this.position === 'right') {
      this.offsetX = 22; // To the right of note
      this.offsetY = 0;
    } else {
      // Above or below
      this.offsetX = 0;
      this.offsetY = this.position === 'above' ? -30 : 20;
    }
  }

  /**
   * Renders the meri/kari mark as katakana/kanji character
   *
   * @param renderer - SVGRenderer instance
   * @param noteX - X coordinate of the note center
   * @param noteY - Y coordinate of the note baseline
   */
  render(renderer: SVGRenderer, noteX: number, noteY: number): void {
    const x = noteX + this.offsetX;
    const y = noteY + this.offsetY;
    const symbol = MeriKariModifier.symbols[this.type];

    renderer.drawText(
      symbol,
      x,
      y,
      this.fontSize,
      this.fontFamily,
      this.color
    );
  }

  /**
   * Sets the font size
   */
  setFontSize(size: number): this {
    this.fontSize = size;
    return this;
  }

  /**
   * Sets the font family
   */
  setFontFamily(family: string): this {
    this.fontFamily = family;
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
   * Gets the type of alteration
   */
  getType(): MeriKariType {
    return this.type;
  }

  /**
   * Gets the width occupied by this modifier
   * Approximate based on font size
   */
  getWidth(): number {
    return this.fontSize * 0.8;
  }

  /**
   * Gets the height occupied by this modifier
   */
  getHeight(): number {
    return this.fontSize;
  }
}
