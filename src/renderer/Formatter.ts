/**
 * Formatter - Handles automatic spacing of shakuhachi notes
 *
 * Inspired by VexFlow's Formatter - calculates horizontal positions for notes
 * based on their durations and applies spacing to create visually balanced layout.
 *
 * Following KISS principle: simple duration-based spacing.
 */

import type { ShakuNote, NoteDuration } from '../notes/ShakuNote';

/**
 * Duration values in "ticks" for spacing calculation
 * Following VexFlow's convention: quarter note = 1024 ticks
 */
const DURATION_TICKS: Record<NoteDuration, number> = {
  w: 4096, // Whole note = 4 quarters
  h: 2048, // Half note = 2 quarters
  q: 1024, // Quarter note (base unit)
  '8': 512, // Eighth note = 1/2 quarter
  '16': 256, // Sixteenth note = 1/4 quarter
  '32': 128, // Thirty-second note = 1/8 quarter
};

/**
 * Formatter options
 */
export interface FormatterOptions {
  /** Starting X position (default: 0) */
  startX?: number;

  /** Starting Y position (default: 100) */
  startY?: number;

  /** Pixels per tick (controls overall spacing, default: 0.04) */
  pixelsPerTick?: number;

  /** Minimum space between notes in pixels (default: 40) */
  minNoteSpacing?: number;
}

export class Formatter {
  private startX: number;
  private startY: number;
  private pixelsPerTick: number;
  private minNoteSpacing: number;

  /**
   * Creates a new formatter
   */
  constructor(options: FormatterOptions = {}) {
    this.startX = options.startX ?? 0;
    this.startY = options.startY ?? 100;
    this.pixelsPerTick = options.pixelsPerTick ?? 0.04;
    this.minNoteSpacing = options.minNoteSpacing ?? 40;
  }

  /**
   * Formats an array of notes by calculating and applying positions
   *
   * @param notes - Array of ShakuNote objects to format
   * @param startX - Optional override for start X position
   * @param y - Optional override for Y position
   * @returns The formatted notes (for chaining)
   */
  format(notes: ShakuNote[], startX?: number, y?: number): ShakuNote[] {
    if (notes.length === 0) {
      return notes;
    }

    const x = startX ?? this.startX;
    const noteY = y ?? this.startY;

    let currentX = x;

    notes.forEach((note, index) => {
      // Set position for this note
      note.setPosition(currentX, noteY);

      // Calculate space to next note
      if (index < notes.length - 1) {
        const duration = note.getDuration();
        const ticks = DURATION_TICKS[duration];
        const spacing = Math.max(
          ticks * this.pixelsPerTick,
          this.minNoteSpacing,
        );

        currentX += spacing;
      }
    });

    return notes;
  }

  /**
   * Calculates the total width needed for a formatted group of notes
   *
   * @param notes - Array of notes
   * @returns Total width in pixels
   */
  calculateWidth(notes: ShakuNote[]): number {
    if (notes.length === 0) {
      return 0;
    }

    let totalWidth = 0;

    notes.forEach((note, index) => {
      if (index < notes.length - 1) {
        const duration = note.getDuration();
        const ticks = DURATION_TICKS[duration];
        const spacing = Math.max(
          ticks * this.pixelsPerTick,
          this.minNoteSpacing,
        );
        totalWidth += spacing;
      }
    });

    // Add space for the last note
    totalWidth += this.minNoteSpacing;

    return totalWidth;
  }

  /**
   * Sets the pixels per tick (controls overall spacing density)
   *
   * @param pixelsPerTick - New value
   * @returns this for chaining
   */
  setPixelsPerTick(pixelsPerTick: number): this {
    this.pixelsPerTick = pixelsPerTick;
    return this;
  }

  /**
   * Sets the minimum note spacing
   *
   * @param spacing - Minimum spacing in pixels
   * @returns this for chaining
   */
  setMinNoteSpacing(spacing: number): this {
    this.minNoteSpacing = spacing;
    return this;
  }

  /**
   * Gets the current pixels per tick setting
   */
  getPixelsPerTick(): number {
    return this.pixelsPerTick;
  }

  /**
   * Gets the minimum note spacing
   */
  getMinNoteSpacing(): number {
    return this.minNoteSpacing;
  }
}
