import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './purge-score';

vi.mock('@netlify/functions', () => ({ purgeCache: vi.fn() }));
vi.mock('../../api/supabase', () => ({
  supabase: { auth: { getUser: vi.fn() }, from: vi.fn() },
}));
vi.mock('../../api/scores');

// DEV is true under vitest, which would short-circuit before purgeCache. These
// tests are about who is allowed through, so the route has to believe it is
// deployed.
vi.stubEnv('DEV', false);

const OWNER = 'user-owner';
const OTHER = 'user-other';

const score = {
  id: 'score-123',
  user_id: OWNER,
  slug: 'test-score',
} as never;

function request(body: unknown, token: string | null = 'jwt') {
  return new Request('https://example.com/api/purge-score', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(body),
  });
}

function call(req: Request) {
  return POST({ request: req } as never) as Promise<Response>;
}

/** Stands in for the "did this user fork that score" lookup. */
function forksByCaller(rows: unknown[]) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    limit: vi.fn(() => Promise.resolve({ data: rows, error: null })),
  };
  return chain;
}

async function signedInAs(userId: string | null) {
  const { supabase } = await import('../../api/supabase');
  vi.mocked(supabase.auth.getUser).mockResolvedValue({
    data: { user: userId ? { id: userId } : null },
    error: userId ? null : { message: 'bad token' },
  } as never);
  return supabase;
}

async function scoreExists(exists: boolean) {
  const { getScoreBySlug } = await import('../../api/scores');
  vi.mocked(getScoreBySlug).mockResolvedValue({
    score: exists ? score : null,
    error: null,
  });
}

describe('POST /api/purge-score', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects a request with no token', async () => {
    const response = await call(request({ slug: 'test-score' }, null));
    expect(response.status).toBe(401);
  });

  it('rejects a token Supabase does not recognise', async () => {
    await signedInAs(null);
    const response = await call(request({ slug: 'test-score' }));
    expect(response.status).toBe(401);
  });

  it('rejects a request without a slug', async () => {
    await signedInAs(OWNER);
    const response = await call(request({}));
    expect(response.status).toBe(400);
  });

  it('purges for the score owner', async () => {
    await signedInAs(OWNER);
    await scoreExists(true);
    const { purgeCache } = await import('@netlify/functions');

    const response = await call(request({ slug: 'test-score' }));

    expect(response.status).toBe(200);
    expect(purgeCache).toHaveBeenCalledWith({ tags: ['score-test-score'] });
  });

  // A fork changes the parent's rendered fork count, and the forker does not
  // own the parent — so ownership alone would leave that page stale.
  it('purges for someone who has forked the score', async () => {
    const supabase = await signedInAs(OTHER);
    await scoreExists(true);
    vi.mocked(supabase.from).mockReturnValue(
      forksByCaller([{ id: 'fork-1' }]) as never,
    );
    const { purgeCache } = await import('@netlify/functions');

    const response = await call(request({ slug: 'test-score' }));

    expect(response.status).toBe(200);
    expect(purgeCache).toHaveBeenCalledWith({ tags: ['score-test-score'] });
  });

  it('refuses a stranger with no claim on the score', async () => {
    const supabase = await signedInAs(OTHER);
    await scoreExists(true);
    vi.mocked(supabase.from).mockReturnValue(forksByCaller([]) as never);
    const { purgeCache } = await import('@netlify/functions');

    const response = await call(request({ slug: 'test-score' }));

    expect(response.status).toBe(403);
    expect(purgeCache).not.toHaveBeenCalled();
  });

  // A deleted score cannot prove who owned it, and its page must still go.
  it('purges when the score no longer exists', async () => {
    await signedInAs(OTHER);
    await scoreExists(false);
    const { purgeCache } = await import('@netlify/functions');

    const response = await call(request({ slug: 'deleted-score' }));

    expect(response.status).toBe(200);
    expect(purgeCache).toHaveBeenCalledWith({ tags: ['score-deleted-score'] });
  });

  // The log is the only lasting record: the page just goes quietly stale, and
  // the browser is told a status code and nothing about the cause.
  it('reports a failed purge rather than claiming success, and logs why', async () => {
    await signedInAs(OWNER);
    await scoreExists(true);
    const { purgeCache } = await import('@netlify/functions');
    vi.mocked(purgeCache).mockRejectedValue(new Error('Netlify says no'));
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await call(request({ slug: 'test-score' }));

    expect(response.status).toBe(502);
    expect(logged).toHaveBeenCalledWith(
      expect.stringContaining('score-test-score'),
      expect.any(Error),
    );
  });
});
