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
 * Resolves a keyword to a font stack, falling back to the default for
 * absent or unrecognised values.
 */
export function resolveNotationFont(key: string | null | undefined): string {
  if (key && key in NOTATION_FONTS) {
    return NOTATION_FONTS[key as NotationFontKey];
  }
  return NOTATION_FONTS[DEFAULT_NOTATION_FONT];
}
