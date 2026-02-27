/**
 * Layout constants for shakuhachi notation rendering
 *
 * This file centralizes all layout configuration values to ensure consistency
 * and make it easy to adjust the visual appearance of the score.
 */

/**
 * Octave mark configuration
 * Values from OctaveMarksModifier.ts
 */
export const OCTAVE_MARK = {
  /** Font size for octave marks (smaller than main note) */
  fontSize: 12,
  /** Vertical offset from note baseline (negative = above) */
  offsetY: -22,
  /** Horizontal offset from note center */
  offsetX: 18,
  /** Font weight (heavier than notes to maintain stroke proportion) */
  fontWeight: 500,
} as const;

/**
 * Note configuration
 */
export const NOTE = {
  /** Font size for note characters */
  fontSize: 32,
  /** Vertical spacing between notes (baseline to baseline) */
  verticalSpacing: 44,
  /** Font weight for main note characters */
  fontWeight: 400,
} as const;

/**
 * Meri/Kari mark configuration
 */
export const MERI_KARI = {
  /** Font size for meri/kari marks */
  fontSize: 14,
  /** Font weight (heavier to maintain stroke proportion) */
  fontWeight: 500,
} as const;

/**
 * Duration dot configuration
 */
export const DURATION_DOT = {
  /** Additional spacing when a note has a duration dot */
  extraSpacing: 12,
} as const;

/**
 * Column layout configuration
 */
export const COLUMN = {
  /** Width allocated for each column */
  width: 100,
  /** Horizontal spacing between columns */
  spacing: 35,
  /** Number of notes to display per column */
  notesPerColumn: 10,
} as const;

/**
 * Minimum top margin needed to prevent octave mark clipping
 *
 * Computed dynamically based on octave mark positioning:
 * - Octave marks are positioned at offsetY above the note
 * - They need fontSize vertical space to render
 * - Therefore: Math.abs(offsetY) + fontSize gives the minimum margin
 *
 * This ensures octave marks on the first note never get clipped.
 */
export const MIN_TOP_MARGIN =
  Math.abs(OCTAVE_MARK.offsetY) + OCTAVE_MARK.fontSize;

/**
 * Debug label configuration (when romanji debug mode is enabled)
 */
export const DEBUG_LABEL = {
  /** Font size for debug labels */
  fontSize: 7,
  /** Horizontal offset from note center */
  offsetX: 25,
  /** Vertical offset from note baseline */
  offsetY: -6,
  /** Font family for debug labels */
  fontFamily: 'monospace',
  /** Color for debug labels */
  color: '#999',
} as const;
