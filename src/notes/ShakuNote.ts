/**
 * ShakuNote - Core shakuhachi note class
 *
 * Represents a single shakuhachi note with its symbol (kana), position,
 * and attached modifiers (octave dots, pitch alterations, techniques).
 *
 * Inspired by VexFlow's Note architecture - notes know how to render
 * themselves and manage their modifiers.
 */

import type { SVGRenderer } from '../renderer/SVGRenderer';
import type { Modifier } from '../modifiers/Modifier';
import { getSymbolByRomaji, type KinkoSymbol, type Octave } from '../data/mappings';

/**
 * Duration for spacing calculations
 * Mirrors VexFlow's duration notation
 */
export type NoteDuration = 'w' | 'h' | 'q' | '8' | '16' | '32';

/**
 * ShakuNote properties
 */
export interface ShakuNoteOptions {
  /** Symbol identifier (romaji like 'ro', 'tsu') or kana ('ロ', 'ツ') */
  symbol: string;

  /** X coordinate for rendering */
  x?: number;

  /** Y coordinate for rendering (baseline) */
  y?: number;

  /** Duration for spacing (default: 'q' = quarter note) */
  duration?: NoteDuration;

  /** Font size in pixels (default: 32) */
  fontSize?: number;

  /** Font weight (default: 400) */
  fontWeight?: number;

  /** Font family (default: 'Noto Sans JP, sans-serif') */
  fontFamily?: string;

  /** Text color (default: '#000') */
  color?: string;

  /** Array of modifiers to attach */
  modifiers?: Modifier[];

  /** Whether this note is a rest */
  isRest?: boolean;
}

/**
 * Bounding box for layout calculations
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class ShakuNote {
  /** The kana symbol to render */
  private kana: string;

  /** Symbol metadata from kinkoMap */
  private symbolInfo: KinkoSymbol | undefined;

  /** X position */
  private x: number = 0;

  /** Y position (baseline) */
  private y: number = 0;

  /** Duration for spacing */
  private duration: NoteDuration;

  /** Font size */
  private fontSize: number;

  /** Font weight */
  private fontWeight: number;

  /** Font family */
  private fontFamily: string;

  /** Text color */
  private color: string;

  /** Attached modifiers */
  private modifiers: Modifier[] = [];

  /** Cached bounding box */
  private bbox: BoundingBox | null = null;

  /** Whether this note is a rest */
  private isRest: boolean;

  /**
   * Creates a new shakuhachi note
   */
  constructor(options: ShakuNoteOptions) {
    // Try to get symbol info from kinkoMap
    this.symbolInfo = getSymbolByRomaji(options.symbol);

    // Use kana from symbol info if available, otherwise use provided symbol
    this.kana = this.symbolInfo?.kana || options.symbol;

    this.x = options.x ?? 0;
    this.y = options.y ?? 0;
    this.duration = options.duration ?? 'q';
    this.fontSize = options.fontSize ?? 32;
    this.fontWeight = options.fontWeight ?? 400;
    this.fontFamily = options.fontFamily ?? 'Noto Sans JP, sans-serif';
    this.color = options.color ?? '#000';
    this.isRest = options.isRest ?? false;

    if (options.modifiers) {
      this.modifiers = [...options.modifiers];
    }
  }

  /**
   * Renders the note and all its modifiers
   *
   * @param renderer - SVGRenderer instance
   */
  render(renderer: SVGRenderer): void {
    if (this.isRest) {
      // Draw rest as a small hollow circle
      // Radius is about 1/8 of fontSize (for fontSize 32, radius ~4px)
      const radius = this.fontSize / 8;
      // Stroke width proportional to the circle size
      const strokeWidth = Math.max(1.5, radius / 1.9);
      // Center circle vertically with the note characters
      // Japanese characters are typically centered around y - fontSize * 0.4
      const circleY = this.y - this.fontSize * 0.4;

      renderer.drawCircle(
        this.x,
        circleY,
        radius,
        undefined, // no fill
        this.color, // stroke color
        strokeWidth
      );
    } else {
      // Draw the kana symbol
      renderer.drawText(
        this.kana,
        this.x,
        this.y,
        this.fontSize,
        this.fontFamily,
        this.color,
        'middle',
        this.fontWeight
      );
    }

    // Render all modifiers
    this.modifiers.forEach(modifier => {
      modifier.render(renderer, this.x, this.y);
    });

    // Invalidate cached bbox after rendering
    this.bbox = null;
  }

  /**
   * Adds a modifier to this note
   * @returns this for chaining
   */
  addModifier(modifier: Modifier): this {
    this.modifiers.push(modifier);
    this.bbox = null; // Invalidate bbox
    return this;
  }

  /**
   * Adds multiple modifiers
   * @returns this for chaining
   */
  addModifiers(modifiers: Modifier[]): this {
    this.modifiers.push(...modifiers);
    this.bbox = null;
    return this;
  }

  /**
   * Gets all modifiers attached to this note
   */
  getModifiers(): Modifier[] {
    return [...this.modifiers];
  }

  /**
   * Sets the position of this note
   * @returns this for chaining
   */
  setPosition(x: number, y: number): this {
    this.x = x;
    this.y = y;
    this.bbox = null;
    return this;
  }

  /**
   * Gets the current position
   */
  getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  /**
   * Gets the kana symbol
   */
  getKana(): string {
    return this.kana;
  }

  /**
   * Gets the symbol info from kinkoMap (if available)
   */
  getSymbolInfo(): KinkoSymbol | undefined {
    return this.symbolInfo;
  }

  /**
   * Gets the duration
   */
  getDuration(): NoteDuration {
    return this.duration;
  }

  /**
   * Sets the duration
   * @returns this for chaining
   */
  setDuration(duration: NoteDuration): this {
    this.duration = duration;
    return this;
  }

  /**
   * Gets the bounding box for this note (including modifiers)
   *
   * This is an approximation based on font size and modifier positions.
   * For more accurate measurements, you'd need to query the actual SVG elements.
   */
  getBBox(): BoundingBox {
    if (this.bbox) {
      return this.bbox;
    }

    // Approximate dimensions based on font size
    const charWidth = this.fontSize * 0.8;
    const charHeight = this.fontSize;

    // Start with the note's own bbox
    let minX = this.x - charWidth / 2;
    let minY = this.y - charHeight;
    let maxX = this.x + charWidth / 2;
    let maxY = this.y;

    // Expand bbox to include all modifiers
    this.modifiers.forEach(modifier => {
      const modOffset = modifier.getOffset();
      const modWidth = modifier.getWidth();
      const modHeight = modifier.getHeight();

      const modX = this.x + modOffset.x;
      const modY = this.y + modOffset.y;

      minX = Math.min(minX, modX - modWidth / 2);
      minY = Math.min(minY, modY - modHeight / 2);
      maxX = Math.max(maxX, modX + modWidth / 2);
      maxY = Math.max(maxY, modY + modHeight / 2);
    });

    this.bbox = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };

    return this.bbox;
  }

  /**
   * Gets the width of this note (including modifiers)
   */
  getWidth(): number {
    return this.getBBox().width;
  }

  /**
   * Gets the height of this note (including modifiers)
   */
  getHeight(): number {
    return this.getBBox().height;
  }

  /**
   * Sets the font size
   * @returns this for chaining
   */
  setFontSize(size: number): this {
    this.fontSize = size;
    this.bbox = null;
    return this;
  }

  /**
   * Sets the font weight
   * @returns this for chaining
   */
  setFontWeight(weight: number): this {
    this.fontWeight = weight;
    this.bbox = null;
    return this;
  }

  /**
   * Sets the color
   * @returns this for chaining
   */
  setColor(color: string): this {
    this.color = color;
    return this;
  }
}
