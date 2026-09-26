import { describe, it, expect, vi, beforeEach } from 'vitest';
import { purgeScoreCache } from './purge';

vi.mock('./auth');

describe('purgeScoreCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  async function signedIn(token: string | null) {
    const { getCurrentSession } = await import('./auth');
    vi.mocked(getCurrentSession).mockResolvedValue({
      session: token ? ({ access_token: token } as never) : null,
      error: null,
    });
  }

  it('sends the slug with the caller’s token', async () => {
    await signedIn('jwt-123');

    await purgeScoreCache('test-score');

    expect(fetch).toHaveBeenCalledWith(
      '/api/purge-score',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ slug: 'test-score' }),
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt-123',
        }),
      }),
    );
  });

  it('does not call the endpoint when nobody is signed in', async () => {
    await signedIn(null);

    await purgeScoreCache('test-score');

    expect(fetch).not.toHaveBeenCalled();
  });

  // The save already succeeded by the time this runs. A failed purge costs a few
  // minutes of staleness; throwing here would surface it as a failed save.
  it('swallows a failed request rather than breaking the caller', async () => {
    await signedIn('jwt-123');
    vi.mocked(fetch).mockRejectedValue(new Error('offline'));

    await expect(purgeScoreCache('test-score')).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalled();
  });
});
