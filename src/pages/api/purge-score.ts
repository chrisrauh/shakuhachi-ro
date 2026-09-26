import type { APIRoute } from 'astro';
import { purgeCache } from '@netlify/functions';
import { supabase } from '../../api/supabase';
import { getScoreBySlug } from '../../api/scores';
import { cacheTagForScore } from '../../utils/cache-tags';

export const prerender = false;

/**
 * Invalidates a score page's CDN cache entry.
 *
 * Score pages are cached at Netlify's edge (see `src/pages/score/[slug].astro`).
 * Edits must be visible immediately, so every write purges the score's tag —
 * without this, a save would sit behind the cache until its TTL expired.
 *
 * This is the only server endpoint in the codebase. Writes otherwise go straight
 * from the browser to Supabase under RLS, so there is no existing server request
 * to hang a purge on.
 *
 * Purging cannot disclose or damage anything — it only forces a re-render — but
 * an open endpoint would let anyone defeat the cache this work exists to add, so
 * callers must prove they had a reason to change the page.
 */

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Who may purge a score's page, and why:
 *
 * - its owner, who is the only one who can edit or delete it;
 * - whoever just forked it, because the parent page renders a fork count that
 *   their fork has changed, and they do not own the parent;
 * - anyone signed in, when no such score exists — a score that was just deleted
 *   cannot prove its former owner, and a tag for a score that never existed has
 *   nothing cached under it.
 */
async function mayPurge(slug: string, userId: string): Promise<boolean> {
  const { score } = await getScoreBySlug(slug);
  if (!score) return true;
  if (score.user_id === userId) return true;

  const { data } = await supabase
    .from('scores')
    .select('id')
    .eq('user_id', userId)
    .eq('forked_from', score.id)
    .limit(1);

  return !!data?.length;
}

export const POST: APIRoute = async ({ request }) => {
  const token = request.headers.get('Authorization')?.replace(/^Bearer /, '');
  if (!token) return json({ error: 'Not signed in' }, 401);

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return json({ error: 'Not signed in' }, 401);

  let slug: unknown;
  try {
    ({ slug } = await request.json());
  } catch {
    return json({ error: 'Expected a JSON body' }, 400);
  }
  if (typeof slug !== 'string' || !slug) {
    return json({ error: 'Expected a slug' }, 400);
  }

  if (!(await mayPurge(slug, data.user.id))) {
    return json({ error: 'Not yours to purge' }, 403);
  }

  // No Netlify CDN to purge in local dev, and purgeCache has no function context
  // to authenticate with. Report success so saving still works offline.
  if (import.meta.env.DEV) return json({ purged: false, reason: 'dev' }, 200);

  try {
    // Always pass tags: purgeCache() with no tags clears the whole site, from any
    // deploy context. No deploy scope, though — this tag is meant to clear in every
    // context, because they all read one database. See "Caching" in
    // docs/ARCHITECTURE-PLATFORM.MD before changing that.
    await purgeCache({ tags: [cacheTagForScore(slug)] });
  } catch (cause) {
    // The only durable record of a purge failing. Nobody is watching the page
    // go stale, and the browser only learns a status code, so without this the
    // cause is lost. console.error lands in the Netlify function log.
    console.error(`Could not purge ${cacheTagForScore(slug)}:`, cause);
    return json(
      { error: cause instanceof Error ? cause.message : 'Purge failed' },
      502,
    );
  }

  return json({ purged: true }, 200);
};
