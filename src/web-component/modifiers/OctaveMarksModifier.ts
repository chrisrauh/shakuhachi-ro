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
 * - 大甲 (daikan) - indicates note is in the top register (when unexpected)
 *
 * Position: Top-right of note character. A two-character mark (大甲) is
 * stacked vertically, like the notation itself.
 *
 * Following VexFlow's Modifier pattern - positions itself relative to note.
 */

import { Modifier } from './Modifier';
import type { RenderingBackend } from '../renderer/RenderingBackend';
import { DEFAULT_RENDER_OPTIONS } from '../renderer/RenderOptions';
import { MARK_WIDTH_RATIO, OCTAVE_MARK_OFFSET } from './mark-geometry';

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
    daikan: '大甲',
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
    // works the same way. They live in mark-geometry, which the top margin
    // and the note cell are derived from.
    this.offsetX = OCTAVE_MARK_OFFSET.x; // To the right of note
    this.offsetY = OCTAVE_MARK_OFFSET.y; // Above the note
  }

  /**
   * Renders the octave mark as a small kanji character
   *
   * @param renderer - Backend to draw with
   * @param noteX - X coordinate of the note center
   * @param noteY - Y coordinate of the note baseline
   */
  render(renderer: RenderingBackend, noteX: number, noteY: number): void {
    const x = noteX + this.offsetX;
    const y = noteY + this.offsetY;
    const chars = [...OctaveMarksModifier.registerSymbols[this.register]];

    // The first character takes the single-character position and the rest
    // stack below it, so 大甲 reads top to bottom and reaches no higher than
    // 乙 or 甲 (the top margin only clears one character)
    chars.forEach((char, i) => {
      renderer.drawText(
        char,
        x,
        y + i * this.fontSize,
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
    return this.fontSize * MARK_WIDTH_RATIO;
  }

  /**
   * Gets the height occupied by this modifier
   */
  getHeight(): number {
    return this.fontSize;
  }
}
