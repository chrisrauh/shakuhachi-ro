/**
 * Layout constants for shakuhachi notation rendering
 *
 * Fixed values used directly by renderer code. Configurable defaults
 * (font sizes, offsets, spacing) live in DEFAULT_RENDER_OPTIONS in
 * renderer/RenderOptions.ts instead.
 */

/**
 * Note configuration
 */
export const NOTE = {
  /** Font size for note characters */
  fontSize: 32,
  /** Vertical spacing between notes (baseline to baseline) */
  verticalSpacing: 44,
} as const;

/**
 * Separator lines drawn between columns
 */
export const COLUMN_SEPARATOR = {
  /** How far the line extends past the column, top and bottom */
  extension: 20,
  /** Light gray — the separator must not compete with the notes */
  color: '#ccc',
  /** Line thickness */
  width: 1,
} as const;
