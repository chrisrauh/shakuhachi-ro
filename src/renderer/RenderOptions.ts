/**
 * RenderOptions - Configuration interface for ScoreRenderer
 *
 * Provides type-safe configuration for all aspects of shakuhachi score rendering.
 * All options are optional - defaults will be applied from layout-constants.ts.
 *
 * Following "Explicit Over Implicit" principle - all configuration is visible
 * and documented in one place.
 */

/**
 * Configuration options for rendering shakuhachi scores
 */
export interface RenderOptions {
  // =========================================================================
  // Display Options
  // =========================================================================

  /**
   * Whether to show octave marks (乙, 甲)
   * @default true
   */
  showOctaveMarks?: boolean;

  /**
   * Whether to show debug labels (romanji, note numbers)
   * Useful for development and debugging
   * @default false
   */
  showDebugLabels?: boolean;

  // =========================================================================
  // Layout Options
  // =========================================================================

  /**
   * Number of notes to display per column before breaking to next column
   * @default 10
   */
  notesPerColumn?: number;

  /**
   * Horizontal spacing between columns in pixels
   * @default 35
   */
  columnSpacing?: number;

  /**
   * Width allocated for each column in pixels
   * @default 100
   */
  columnWidth?: number;

  /**
   * Top margin in pixels to prevent octave mark clipping
   * If not specified, calculated dynamically based on octave mark size
   * @default Math.abs(OCTAVE_MARK.offsetY) + OCTAVE_MARK.fontSize
   */
  topMargin?: number;

  // =========================================================================
  // Note Typography
  // =========================================================================

  /**
   * Font size for main note characters in pixels
   * @default 28
   */
  noteFontSize?: number;

  /**
   * Font weight for main note characters
   * Uses CSS font-weight values (100-900)
   * @default 400
   */
  noteFontWeight?: number;

  /**
   * Vertical spacing between notes (baseline to baseline) in pixels
   * @default 44
   */
  noteVerticalSpacing?: number;

  /**
   * Font family for note characters
   * @default 'Noto Sans JP, sans-serif'
   */
  noteFontFamily?: string;

  /**
   * Color for note characters
   * @default '#000'
   */
  noteColor?: string;

  // =========================================================================
  // Octave Mark Configuration
  // =========================================================================

  /**
   * Font size for octave marks (乙, 甲) in pixels
   * @default 12
   */
  octaveMarkFontSize?: number;

  /**
   * Font weight for octave marks
   * Heavier than notes to maintain stroke proportion at smaller size
   * @default 500
   */
  octaveMarkFontWeight?: number;

  /**
   * Horizontal offset from note center for octave marks
   * @default 18
   */
  octaveMarkOffsetX?: number;

  /**
   * Vertical offset from note baseline for octave marks (negative = above)
   * @default -22
   */
  octaveMarkOffsetY?: number;

  // =========================================================================
  // Meri/Kari Mark Configuration
  // =========================================================================

  /**
   * Font size for meri/kari marks (メ, 中, 大) in pixels
   * @default 14
   */
  meriKariFontSize?: number;

  /**
   * Font weight for meri/kari marks
   * Heavier to maintain stroke proportion at smaller size
   * @default 500
   */
  meriKariFontWeight?: number;

  // =========================================================================
  // Duration Dot Configuration
  // =========================================================================

  /**
   * Additional vertical spacing when a note has a duration dot
   * Added to maintain consistent visual gaps
   * @default 12
   */
  durationDotExtraSpacing?: number;

  // =========================================================================
  // Debug Label Configuration
  // =========================================================================

  /**
   * Font size for debug labels (romanji, note info) in pixels
   * @default 7
   */
  debugLabelFontSize?: number;

  /**
   * Horizontal offset from note center for debug labels
   * @default 25
   */
  debugLabelOffsetX?: number;

  /**
   * Vertical offset from note baseline for debug labels
   * @default -6
   */
  debugLabelOffsetY?: number;

  /**
   * Font family for debug labels
   * @default 'monospace'
   */
  debugLabelFontFamily?: string;

  /**
   * Color for debug labels
   * @default '#999'
   */
  debugLabelColor?: string;

  // =========================================================================
  // Viewport Options
  // =========================================================================

  /**
   * SVG viewport width in pixels
   * If not specified, uses container element dimensions
   * @default undefined (auto-detect from container)
   */
  width?: number;

  /**
   * SVG viewport height in pixels
   * If not specified, uses container element dimensions
   * @default undefined (auto-detect from container)
   */
  height?: number;

  /**
   * Automatically re-render when container size changes.
   * Uses ResizeObserver to detect viewport changes and trigger re-rendering.
   * @default true
   */
  autoResize?: boolean;
}

/**
 * Default values for all render options
 * Sourced from layout-constants.ts
 */
export const DEFAULT_RENDER_OPTIONS: Required<RenderOptions> = {
  // Display options
  showOctaveMarks: true,
  showDebugLabels: false,

  // Layout options
  notesPerColumn: 10,
  columnSpacing: 35,
  columnWidth: 100,
  topMargin: 34, // Math.abs(-22) + 12

  // Note typography
  noteFontSize: 28,
  noteFontWeight: 400,
  noteVerticalSpacing: 44,
  noteFontFamily: 'Noto Sans JP, sans-serif',
  noteColor: '#000',

  // Octave mark configuration
  octaveMarkFontSize: 12,
  octaveMarkFontWeight: 500,
  octaveMarkOffsetX: 18,
  octaveMarkOffsetY: -22,

  // Meri/Kari mark configuration
  meriKariFontSize: 14,
  meriKariFontWeight: 500,

  // Duration dot configuration
  durationDotExtraSpacing: 12,

  // Debug label configuration
  debugLabelFontSize: 7,
  debugLabelOffsetX: 25,
  debugLabelOffsetY: -6,
  debugLabelFontFamily: 'monospace',
  debugLabelColor: '#999',

  // Viewport options
  width: undefined as any, // Will be auto-detected
  height: undefined as any, // Will be auto-detected
  autoResize: true,
};

/**
 * Merges user-provided options with defaults
 *
 * @param options - User-provided options (partial)
 * @returns Complete options object with all values defined
 */
export function mergeWithDefaults(options: RenderOptions = {}): Required<RenderOptions> {
  return {
    ...DEFAULT_RENDER_OPTIONS,
    ...options,
  };
}
