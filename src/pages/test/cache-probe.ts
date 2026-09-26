import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * Probe for #388, part 1 of 2: is the response cached, and is it tagged?
 *
 * Returns a timestamp generated at render time and asks Netlify to cache it.
 * An unchanged timestamp across requests means the edge served them without
 * running the function. `/test/cache-purge` then invalidates the tag set here,
 * which should make the next request render a fresh timestamp.
 *
 * `Netlify-Cache-Tag` rather than `Cache-Tag`: Netlify prefers the former when
 * both are present, and it stays internal instead of being passed downstream.
 *
 * Throwaway — delete both routes once #388 records an answer.
 */
export const GET: APIRoute = () => {
  const body = JSON.stringify(
    {
      renderedAt: new Date().toISOString(),
      note: 'Unchanged renderedAt means the edge served it without rendering.',
    },
    null,
    2,
  );

  return new Response(body, {
    headers: {
      'Content-Type': 'application/json',
      // Netlify's CDN only. Browsers are told not to store, so a repeated
      // request reaches the edge rather than the browser's own cache.
      'Netlify-CDN-Cache-Control': 'public, max-age=300, must-revalidate',
      'Cache-Control': 'no-store',
      'Netlify-Cache-Tag': 'cache-probe',
    },
  });
};
