/**
 * Layout constants for shakuhachi notation rendering
 *
 * Fixed values used directly by renderer code. Configurable defaults
 * (font sizes, offsets, spacing) live in DEFAULT_RENDER_OPTIONS in
 * renderer/RenderOptions.ts instead.
 */

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
