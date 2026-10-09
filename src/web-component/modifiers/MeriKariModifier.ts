/**
 * MeriKariModifier - Meri and kari marks for shakuhachi notation
 *
 * Meri lowers a note and kari raises it, by changing the angle of the lips to
 * the blowing edge. Kinko notation marks them beside the note, following
 * Koga's chart (and Nyokai-An's for the kari marks Koga doesn't use):
 * - Meri メ, chu-meri 中, dai-meri 大メ
 * - Kari カ, chu-kari 中カ, dai-kari 大カ
 *
 * A two-character mark is stacked, the first above the second.
 *
 * Position: Left of note character
 *
 * Following VexFlow's Modifier pattern.
 */

import { Modifier, type ModifierPosition } from './Modifier';
import type { RenderingBackend } from '../renderer/RenderingBackend';
import { DEFAULT_RENDER_OPTIONS } from '../renderer/RenderOptions';
import type { MeriKari } from '../types/ScoreData';
import { MARK_WIDTH_RATIO, MERI_KARI_SIDE_OFFSET } from './mark-geometry';

export class MeriKariModifier extends Modifier {
  /** Type of pitch alteration */
  private type: MeriKari;

  /** Font size — overridden by ModifierConfigurator from render options */
  private fontSize: number = DEFAULT_RENDER_OPTIONS.meriKariFontSize;

  /** Font weight — overridden by ModifierConfigurator from render options */
  private fontWeight: number = DEFAULT_RENDER_OPTIONS.meriKariFontWeight;

  /** Font family — overridden by ModifierConfigurator from render options */
  private fontFamily: string = DEFAULT_RENDER_OPTIONS.noteFontFamily;

  /** Color of the mark */
  private color: string = '#000'; // Black, like traditional notation

  /** The mark for each meri and kari */
  private static readonly symbols: Record<MeriKari, string> = {
    meri: 'メ',
    'chu-meri': '中',
    'dai-meri': '大メ',
    kari: 'カ',
    'chu-kari': '中カ',
    'dai-kari': '大カ',
  };

  /**
   * Creates a meri modifier
   *
   * @param type - Which meri or kari
   * @param position - Where to position relative to note (default: 'left')
   */
  constructor(type: MeriKari = 'meri', position: ModifierPosition = 'left') {
    super(position);
    this.type = type;
    this.setDefaultOffsets();
  }

  /**
   * Set default offsets for left position
   */
  private setDefaultOffsets(): void {
    if (this.position === 'left') {
      this.offsetX = -MERI_KARI_SIDE_OFFSET; // To the left of note
      this.offsetY = 0; // Centered vertically with note
    } else if (this.position === 'right') {
      this.offsetX = MERI_KARI_SIDE_OFFSET; // To the right of note
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
   * @param renderer - Backend to draw with
   * @param noteX - X coordinate of the note center
   * @param noteY - Y coordinate of the note baseline
   */
  render(renderer: RenderingBackend, noteX: number, noteY: number): void {
    const x = noteX + this.offsetX;
    const y = noteY + this.offsetY;
    const characters = [...MeriKariModifier.symbols[this.type]];

    // Stacked upwards from the note's baseline, last character lowest
    characters.forEach((character, i) => {
      renderer.drawText(
        character,
        x,
        y - (characters.length - 1 - i) * this.fontSize,
        this.fontSize,
        this.fontFamily,
        this.color,
        'middle',
        this.fontWeight,
      );
    });
  }

  /**
   * Sets the font size
   */
  setFontSize(size: number): this {
    this.fontSize = size;
    return this;
  }

  /**
   * Sets the font weight
   */
  setFontWeight(weight: number): this {
    this.fontWeight = weight;
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
  getType(): MeriKari {
    return this.type;
  }

  /**
   * Gets the width occupied by this modifier
   * Approximate based on font size
   */
  getWidth(): number {
    return this.fontSize * MARK_WIDTH_RATIO;
  }

  /**
   * Gets the height occupied by this modifier
   */
  getHeight(): number {
    return this.fontSize * [...MeriKariModifier.symbols[this.type]].length;
  }
}
