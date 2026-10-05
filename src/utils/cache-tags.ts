/**
 * The score page tags its cached response; the purge endpoint clears that tag.
 * The two must spell it the same way — a mismatch would fail silently, leaving
 * edits invisible until the TTL expired — so neither builds the string by hand.
 *
 * Slugs keep Unicode letters (src/utils/slug.ts), but a header value must be a
 * ByteString, so a raw Japanese slug made setting the header throw (#425).
 * encodeURIComponent leaves ASCII slugs unchanged, so their existing cached
 * entries keep their tags.
 */
export function cacheTagForScore(slug: string): string {
  return `score-${encodeURIComponent(slug)}`;
}
