import { getCurrentSession } from './auth';

/** Long enough for a normal round trip, short enough not to hold up a redirect. */
const PURGE_TIMEOUT_MS = 3000;

/**
 * Asks the server to drop a score page's cached copy after changing it.
 *
 * Never throws and never reports failure to the caller. A purge that does not
 * land costs at most a few minutes of staleness, bounded by the page's max-age,
 * which is not worth failing a save the database already accepted.
 */
export async function purgeScoreCache(slug: string): Promise<void> {
  try {
    const { session } = await getCurrentSession();
    if (!session) return;

    const response = await fetch('/api/purge-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ slug }),
      signal: AbortSignal.timeout(PURGE_TIMEOUT_MS),
    });

    // fetch rejects only when the request never completed, so a failure the
    // server reported arrives here as a resolved response and would otherwise
    // pass unnoticed. The cause is in the function log; the status says where
    // to look — 502 means purging broke, anything else means we called it wrong.
    if (!response.ok) {
      console.warn(
        `Could not purge the cache for ${slug}: HTTP ${response.status}`,
      );
    }
  } catch (error) {
    // Deliberately swallowed — see above. Logged so a systematic failure is
    // visible to whoever is looking for stale pages.
    console.warn(`Could not purge the cache for ${slug}:`, error);
  }
}
