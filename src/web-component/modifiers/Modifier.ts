/**
 * Base Modifier Class
 *
 * Abstract base class for all shakuhachi notation modifiers (octave dots,
 * meri/kari marks, technique indicators, etc.).
 *
 * Inspired by VexFlow's Modifier architecture - modifiers are visual elements
 * that attach to notes and position themselves relative to the note.
 */

import type { RenderingBackend } from '../renderer/RenderingBackend';

/**
 * Position of modifier relative to note
 */
export type ModifierPosition = 'above' | 'below' | 'left' | 'right';

/**
 * Where a note sits in the laid-out score, for modifiers whose size depends
 * on it (a duration line runs to the next note). Known only once the notes
 * are placed, so it's passed when drawing rather than stored on the modifier.
 */
export interface ModifierLayout {
  /**
   * Distance from this note's baseline to the next note's, including any
   * extra spacing after a dotted note
   */
  distanceToNext: number;
  /** Font size of the note glyph */
  noteFontSize: number;
}

/**
 * Abstract base class for all modifiers
 *
 * Following VexFlow's pattern:
 * - Modifiers know how to render themselves
 * - They position themselves relative to a note position
 * - They can be composed/combined on a single note
 */
export abstract class Modifier {
  /** Horizontal offset from note position */
  protected offsetX: number = 0;

  /** Vertical offset from note position */
  protected offsetY: number = 0;

  /** General position hint (above/below/left/right) */
  protected position: ModifierPosition;

  /**
   * Creates a new modifier
   * @param position - Where this modifier should be positioned relative to note
   */
  constructor(position: ModifierPosition = 'above') {
    this.position = position;
  }

  /**
   * Renders the modifier at the specified note position
   *
   * @param renderer - Backend to draw with
   * @param noteX - X coordinate of the note
   * @param noteY - Y coordinate of the note (baseline)
   * @param layout - Where the note sits in the score
   */
  abstract render(
    renderer: RenderingBackend,
    noteX: number,
    noteY: number,
    layout: ModifierLayout,
  ): void;

  /**
   * Sets the offset for this modifier
   * @param x - Horizontal offset in pixels
   * @param y - Vertical offset in pixels
   */
  setOffset(x: number, y: number): this {
    this.offsetX = x;
    this.offsetY = y;
    return this;
  }

  /**
   * Gets the current position
   */
  getPosition(): ModifierPosition {
    return this.position;
  }

  /**
   * Sets the position
   */
  setPosition(position: ModifierPosition): this {
    this.position = position;
    return this;
  }

  /**
   * Gets the offset
   */
  getOffset(): { x: number; y: number } {
    return { x: this.offsetX, y: this.offsetY };
  }

  /**
   * Optional: Calculate width needed by this modifier
   * Can be used for layout calculations
   */
  getWidth(): number {
    return 0;
  }

  /**
   * Height needed by this modifier, for the note's bounding box
   *
   * @param layout - Where the note sits in the score
   */
  abstract getHeight(layout: ModifierLayout): number;
}
