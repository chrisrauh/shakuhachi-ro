/**
 * OctaveMarksModifier - Octave indicator for shakuhachi notation
 *
 * In Kinko shakuhachi notation, octave marks are **contextual** and follow
 * the "closest-note principle". They are only added when a note violates
 * the expectation that it would be in the closest octave to the previous note.
 *
 * Visual representation:
 * - 乙 (otsu) - indicates note is in base register (when unexpected)
 * - 甲 (kan) - indicates note is in upper register (when unexpected)
 *
 * Position: Top-right of note character (initially; 8-position system planned)
 *
 * Following VexFlow's Modifier pattern - positions itself relative to note.
 */

import { Modifier } from './Modifier';
import type { SVGRenderer } from '../renderer/SVGRenderer';
import { DEFAULT_RENDER_OPTIONS } from '../renderer/RenderOptions';

export type OctaveRegister = 'otsu' | 'kan' | 'daikan';

export class OctaveMarksModifier extends Modifier {
  /** Octave register indicator */
  private register: OctaveRegister;

  /** Font size — overridden by ModifierConfigurator from render options */
  private fontSize: number = DEFAULT_RENDER_OPTIONS.octaveMarkFontSize;

  /** Font weight — overridden by ModifierConfigurator from render options */
  private fontWeight: number = DEFAULT_RENDER_OPTIONS.octaveMarkFontWeight;

  /** Font family — overridden by ModifierConfigurator from render options */
  private fontFamily: string = DEFAULT_RENDER_OPTIONS.noteFontFamily;

  /** Color of the mark */
  private color: string = '#000';

  /** Kanji characters for each register */
  private static readonly registerSymbols: Record<OctaveRegister, string> = {
    otsu: '乙',
    kan: '甲',
    daikan: '大甲', // Future: daikan support
  };

  /**
   * Creates an octave marks modifier
   *
   * @param register - Octave register: 'otsu', 'kan', or 'daikan'
   */
  constructor(register: OctaveRegister = 'kan') {
    // Position at top-right for now (future: smart positioning in 8-position system)
    super('above');
    this.register = register;
    this.setDefaultOffsets();
  }

  /**
   * Set default offsets for top-right position
   */
  private setDefaultOffsets(): void {
    // Offsets belong to the modifier, not to render options — MeriKariModifier
    // works the same way. DEFAULT_RENDER_OPTIONS.topMargin is derived from
    // these two values, so changing them means changing that as well.
    this.offsetX = 18; // To the right of note
    this.offsetY = -22; // Above the note
  }

  /**
   * Renders the octave mark as a small kanji character
   *
   * @param renderer - SVGRenderer instance
   * @param noteX - X coordinate of the note center
   * @param noteY - Y coordinate of the note baseline
   */
  render(renderer: SVGRenderer, noteX: number, noteY: number): void {
    const x = noteX + this.offsetX;
    const y = noteY + this.offsetY;
    const symbol = OctaveMarksModifier.registerSymbols[this.register];

    renderer.drawText(
      symbol,
      x,
      y,
      this.fontSize,
      this.fontFamily,
      this.color,
      'middle',
      this.fontWeight,
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
   * Gets the octave register
   */
  getRegister(): OctaveRegister {
    return this.register;
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
