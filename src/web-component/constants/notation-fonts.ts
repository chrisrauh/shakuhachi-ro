/**
 * Notation font stacks
 *
 * Single source of truth for the fonts the notation can be rendered in.
 * Consumers pass a keyword (`sans` | `serif`); the stack stays inside the
 * renderer package so embedders never spell font names themselves.
 */

export const NOTATION_FONTS = {
  sans: 'Noto Sans JP, sans-serif',
  serif: 'Noto Serif JP, serif',
} as const;

export type NotationFontKey = keyof typeof NOTATION_FONTS;

export const DEFAULT_NOTATION_FONT: NotationFontKey = 'sans';

/**
 * Type guard verifying that a normalized string is one of the known
 * notation font keys, so the compiler enforces the own-property check
 * instead of trusting an unverified cast.
 */
function isNotationFontKey(key: string): key is NotationFontKey {
  return Object.prototype.hasOwnProperty.call(NOTATION_FONTS, key);
}

/**
 * Resolves a keyword to a font stack, falling back to the default for
 * absent or unrecognised values.
 *
 * Matching is ASCII case-insensitive and tolerant of surrounding
 * whitespace, mirroring how enumerated HTML attributes (e.g. `dir`,
 * `loading`) are matched.
 */
export function resolveNotationFont(key: string | null | undefined): string {
  const normalized = key?.trim().toLowerCase();
  if (normalized && isNotationFontKey(normalized)) {
    return NOTATION_FONTS[normalized];
  }
  return NOTATION_FONTS[DEFAULT_NOTATION_FONT];
}
