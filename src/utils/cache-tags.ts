/**
 * The score page tags its cached response; the purge endpoint clears that tag.
 * The two must spell it the same way — a mismatch would fail silently, leaving
 * edits invisible until the TTL expired — so neither builds the string by hand.
 */
export function cacheTagForScore(slug: string): string {
  return `score-${slug}`;
}
