/**
 * ShakuNote - Core shakuhachi note class
 *
 * Represents a single shakuhachi note with its symbol (kana), position,
 * and attached modifiers (octave dots, pitch alterations, techniques).
 *
 * Inspired by VexFlow's Note architecture - notes know how to render
 * themselves and manage their modifiers.
 */

import type { RenderingBackend } from '../renderer/RenderingBackend';
import type { Modifier, ModifierLayout } from '../modifiers/Modifier';
import {
  DurationMarksModifier,
  type SlotSpacing,
} from '../modifiers/DurationMarksModifier';
import {
  getSymbolByRomaji,
  type KinkoSymbol,
} from '../constants/kinko-symbols';
import { DEFAULT_RENDER_OPTIONS } from '../renderer/RenderOptions';

/**
 * Where a kana glyph's optical centre sits above its baseline, as a fraction of
 * the font size. Used to align the rest circle with the surrounding characters.
 *
 * Measured for the notation fonts at fontSize 32; not the same as the 0.25 in
 * DurationLineModifier, which aligns line ends rather than glyph centres.
 */
const KANA_OPTICAL_CENTER_RATIO = 0.4;

/**
 * Size of the small numerals some fingerings write with their kana (ヒ with
 * 五 for go no hi), as a fraction of the font size. Several stacked (ハ with
 * 二四五) are smaller, to stay within the kana's height.
 */
const NUMERAL_SIZE_RATIO = 0.36;
const STACKED_NUMERAL_SIZE_RATIO = 0.26;

/**
 * Where the numerals sit inside each kana, as in Koga's chart: between the
 * strokes of ハ, inside ウ, in the open lower right of ヒ, at the upper right
 * of レ (as the B.C. chart writes レ二). Offsets of the
 * lowest numeral from the kana's centre and baseline, as fractions of the
 * font size.
 */
const NUMERAL_OFFSET_RATIO: Record<string, { x: number; y: number }> = {
  ハ: { x: 0, y: 0 },
  ウ: { x: 0.04, y: -0.16 },
  ヒ: { x: 0.16, y: 0 },
  レ: { x: 0.24, y: -0.42 },
};

/**
 * ShakuNote properties
 */
export interface ShakuNoteOptions {
  /** Symbol identifier (romaji like 'ro', 'tsu') or kana ('ロ', 'ツ') */
  symbol: string;

  /** Font size in pixels (default: 32) */
  fontSize?: number;

  /** Font weight (default: 400) */
  fontWeight?: number;

  /** Font family (default: DEFAULT_RENDER_OPTIONS.noteFontFamily) */
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

  /** X position where the note was last drawn, (0, 0) until then */
  private x: number = 0;

  /** Y position (baseline) where the note was last drawn */
  private y: number = 0;

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

  /**
   * Where the note sat in the score when last drawn, which sizes some of its
   * modifiers in the bounding box. Default spacing until then, as the
   * position is (0, 0) until set.
   */
  private layout: ModifierLayout;

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

    this.fontSize = options.fontSize ?? 32;
    this.fontWeight = options.fontWeight ?? 400;
    this.fontFamily =
      options.fontFamily ?? DEFAULT_RENDER_OPTIONS.noteFontFamily;
    this.color = options.color ?? '#000';
    this.isRest = options.isRest ?? false;
    this.layout = {
      distanceToNext: DEFAULT_RENDER_OPTIONS.noteVerticalSpacing,
      noteFontSize: this.fontSize,
      noteSpacing: DEFAULT_RENDER_OPTIONS.noteVerticalSpacing,
      dotSpacing: DEFAULT_RENDER_OPTIONS.durationDotExtraSpacing,
    };

    if (options.modifiers) {
      this.modifiers = [...options.modifiers];
    }
  }

  /**
   * Renders the note and all its modifiers
   *
   * @param renderer - Backend to draw with
   * @param x - X coordinate of the note centre
   * @param y - Y coordinate of the note baseline
   * @param layout - Where the note sits in the score, for its modifiers
   */
  render(
    renderer: RenderingBackend,
    x: number,
    y: number,
    layout: ModifierLayout,
  ): void {
    // Kept for getPosition() and getBBox() after drawing
    this.x = x;
    this.y = y;
    this.layout = layout;
    if (this.isRest) {
      // Draw rest as a small hollow circle
      // Radius is about 1/8 of fontSize (for fontSize 32, radius ~4px)
      const radius = this.fontSize / 8;
      // Stroke width proportional to the circle size
      const strokeWidth = Math.max(1.5, radius / 1.9);
      // Center circle vertically with the note characters
      const circleY = this.y - this.fontSize * KANA_OPTICAL_CENTER_RATIO;

      renderer.drawCircle(
        this.x,
        circleY,
        radius,
        undefined, // no fill
        this.color, // stroke color
        strokeWidth,
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
        this.fontWeight,
      );
      this.renderNumerals(renderer);
    }

    // Render all modifiers
    this.modifiers.forEach((modifier) => {
      modifier.render(renderer, this.x, this.y, layout);
    });

    // Invalidate cached bbox after rendering
    this.bbox = null;
  }

  /** Draws the kana's numerals inside it, stacked upwards from its baseline */
  private renderNumerals(renderer: RenderingBackend): void {
    const numerals = [...(this.symbolInfo?.numerals ?? '')];
    const size =
      this.fontSize *
      (numerals.length > 1 ? STACKED_NUMERAL_SIZE_RATIO : NUMERAL_SIZE_RATIO);
    const offset = NUMERAL_OFFSET_RATIO[this.kana] ?? { x: 0, y: 0 };
    numerals.forEach((numeral, i) => {
      renderer.drawText(
        numeral,
        this.x + this.fontSize * offset.x,
        this.y + this.fontSize * offset.y - (numerals.length - 1 - i) * size,
        size,
        this.fontFamily,
        this.color,
        'middle',
        this.fontWeight,
      );
    });
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
   * Space this note needs below it in a column, past its own: the strokes and
   * dot of its length
   */
  extraHeight(spacing: SlotSpacing): number {
    const marks = this.modifiers.find(
      (mod) => mod instanceof DurationMarksModifier,
    );
    return marks ? marks.extraHeight(spacing) : 0;
  }

  /**
   * Sets the modifiers for this note
   *
   * @param modifiers - Array of modifiers to set
   */
  setModifiers(modifiers: Modifier[]): void {
    this.modifiers = modifiers;
  }

  /**
   * Where the note was last drawn
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
    this.modifiers.forEach((modifier) => {
      const modOffset = modifier.getOffset();
      const modWidth = modifier.getWidth();
      const modHeight = modifier.getHeight(this.layout);

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
      height: maxY - minY,
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
   * Sets the font family
   * @returns this for chaining
   */
  setFontFamily(fontFamily: string): this {
    this.fontFamily = fontFamily;
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
