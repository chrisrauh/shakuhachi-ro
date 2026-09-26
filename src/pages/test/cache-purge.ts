import type { APIRoute } from 'astro';
import { purgeCache } from '@netlify/functions';

export const prerender = false;

/**
 * Probe for #388, part 2 of 2: can a cached response be invalidated on demand?
 *
 * This is the half that decides whether edge caching is usable at all. Score
 * pages must show an owner's edit immediately (docs/ARCHITECTURE-PLATFORM.MD),
 * so a cache we cannot purge on save is not an option — it would trade latency
 * for stale scores.
 *
 * Deliberately exercises the production path: `purgeCache()` called from inside
 * a deployed function authenticates through the function context, so no token is
 * shipped anywhere. Purges are scoped to this deploy, so running it cannot touch
 * the production cache.
 *
 * The alias comes from the request's own hostname, which on a preview looks like
 * `deploy-preview-393--shakuhachi-ro.netlify.app`. Netlify's CONTEXT and
 * REVIEW_ID are build-time variables and are empty at runtime, so they cannot
 * serve as the guard. Without an alias the purge would target production.
 *
 * Throwaway — delete both routes once #388 records an answer.
 */
const PREVIEW_HOST = /^(deploy-preview-\d+)--/;

export const GET: APIRoute = async ({ url }) => {
  const alias = PREVIEW_HOST.exec(url.hostname)?.[1];

  if (!alias) {
    return new Response(
      JSON.stringify(
        {
          error: 'Refusing to purge: this host is not a deploy preview.',
          hostname: url.hostname,
        },
        null,
        2,
      ),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const deployAlias = alias;

  try {
    await purgeCache({ tags: ['cache-probe'], deployAlias });
    return new Response(
      JSON.stringify({ purged: 'cache-probe', deployAlias }, null, 2),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify(
        {
          purged: false,
          deployAlias,
          error: error instanceof Error ? error.message : String(error),
        },
        null,
        2,
      ),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
