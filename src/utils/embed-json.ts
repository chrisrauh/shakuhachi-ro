/**
 * Serializes a value for embedding inside a `<script type="application/json">` block.
 *
 * `JSON.stringify` does not escape `<`, so user-supplied content containing the
 * sequence `</script>` terminates the script element early and everything after it
 * is parsed as HTML — a stored XSS vector wherever score titles, descriptions or
 * notation data are embedded in a page.
 *
 * Escaping `<`, `>` and `&` as `\uXXXX` makes that breakout impossible. The escapes
 * are valid JSON string syntax, so `JSON.parse` returns the original value unchanged
 * and consumers need no special handling.
 *
 * @param value - The value to serialize (must be JSON-serializable)
 * @returns A JSON string safe to place inside a script element
 *
 * @example
 * // In an .astro page:
 * // <script type="application/json" is:inline set:html={embedJson({ score })}></script>
 * embedJson({ title: '</script><img src=x onerror=alert(1)>' });
 * // => '{"title":"\\u003c/script\\u003e\\u003cimg src=x onerror=alert(1)\\u003e"}'
 */
export function embedJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}
