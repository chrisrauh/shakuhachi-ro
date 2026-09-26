import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * Probe for #388: does Netlify CDN caching work on this account's plan?
 *
 * The question is whether the caching primitives edge-cached score pages would
 * need are plan-gated. Netlify's docs gate the *function region* control to
 * Pro/Enterprise but state no restriction on caching, and the pricing page
 * enumerates neither — so the only way to know is to ask the CDN.
 *
 * This route returns a timestamp generated at render time and asks Netlify to
 * cache it. Request it twice: if the timestamp is unchanged and `Cache-Status`
 * reports a hit, the response was served from the edge and caching works here.
 * A changing timestamp means every request reached the function.
 *
 * Deliberately short-lived — delete this route once #388 is answered.
 */
export const GET: APIRoute = () => {
  const body = JSON.stringify(
    {
      renderedAt: new Date().toISOString(),
      note: 'Request twice. An unchanged renderedAt means the edge served it.',
    },
    null,
    2,
  );

  return new Response(body, {
    headers: {
      'Content-Type': 'application/json',
      // Netlify's CDN only; browsers are told not to cache, so a repeated
      // request actually reaches the edge instead of the browser's own cache.
      'Netlify-CDN-Cache-Control': 'public, max-age=120, must-revalidate',
      'Cache-Control': 'no-store',
      // The second primitive purge-on-save would need.
      'Cache-Tag': 'cache-probe',
    },
  });
};
