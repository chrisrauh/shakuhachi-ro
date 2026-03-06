import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createScore,
  getScoreBySlug,
  updateScore,
  deleteScore,
  forkScore,
} from './scores';

vi.mock('./supabase', () => ({ supabase: { from: vi.fn() } }));
vi.mock('./auth');
vi.mock('../utils/slug');

type ChainResult = { data: unknown; error: unknown };

function makeChain(result: ChainResult) {
  const promise = Promise.resolve(result);
  const chain: Record<string, unknown> = {
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
  };
  [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'ilike',
    'or',
    'order',
  ].forEach((m) => {
    chain[m] = vi.fn(() => chain);
  });
  chain.single = vi.fn(() => promise);
  return chain;
}

const scoreFixture = {
  id: 'score-123',
  user_id: 'user-123',
  title: 'Test Score',
  slug: 'test-score',
  composer: null,
  description: null,
  data_format: 'json' as const,
  data: { notes: [] },
  forked_from: null,
  fork_count: 2,
  source_url: null,
  rights: null,
  source_description: null,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

const userFixture = { id: 'user-123' };

describe('createScore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error when user is not authenticated', async () => {
    const { getCurrentUser } = await import('./auth');
    const { supabase } = await import('./supabase');
    vi.mocked(getCurrentUser).mockResolvedValue({ user: null, error: null });

    const result = await createScore({
      title: 'Test',
      data_format: 'json',
      data: {},
    });

    expect(result.score).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toContain('logged in');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('returns error when slug generation fails', async () => {
    const { getCurrentUser } = await import('./auth');
    const { generateSlug, generateUniqueRandomSlug } =
      await import('../utils/slug');
    vi.mocked(getCurrentUser).mockResolvedValue({
      user: userFixture as any,
      error: null,
    });
    vi.mocked(generateSlug).mockReturnValue('');
    vi.mocked(generateUniqueRandomSlug).mockResolvedValue({
      slug: '',
      error: new Error('Slug gen failed'),
    });

    const result = await createScore({
      title: '!!!',
      data_format: 'json',
      data: {},
    });

    expect(result.score).toBeNull();
    expect(result.error?.message).toContain('Slug gen failed');
  });

  it('returns error when DB insert fails', async () => {
    const { getCurrentUser } = await import('./auth');
    const { generateSlug, ensureUniqueSlug } = await import('../utils/slug');
    const { supabase } = await import('./supabase');
    vi.mocked(getCurrentUser).mockResolvedValue({
      user: userFixture as any,
      error: null,
    });
    vi.mocked(generateSlug).mockReturnValue('test-score');
    vi.mocked(ensureUniqueSlug).mockReturnValue('test-score');
    vi.mocked(supabase.from)
      .mockReturnValueOnce(makeChain({ data: [], error: null }) as any)
      .mockReturnValueOnce(
        makeChain({ data: null, error: { message: 'DB error' } }) as any,
      );

    const result = await createScore({
      title: 'Test',
      data_format: 'json',
      data: {},
    });

    expect(result.score).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toContain('DB error');
  });

  it('returns score on success with correct insert shape', async () => {
    const { getCurrentUser } = await import('./auth');
    const { generateSlug, ensureUniqueSlug } = await import('../utils/slug');
    const { supabase } = await import('./supabase');
    vi.mocked(getCurrentUser).mockResolvedValue({
      user: userFixture as any,
      error: null,
    });
    vi.mocked(generateSlug).mockReturnValue('test-score');
    vi.mocked(ensureUniqueSlug).mockReturnValue('test-score');
    vi.mocked(supabase.from)
      .mockReturnValueOnce(makeChain({ data: [], error: null }) as any)
      .mockReturnValueOnce(
        makeChain({ data: scoreFixture, error: null }) as any,
      );

    const result = await createScore({
      title: 'Test Score',
      data_format: 'json',
      data: { notes: [] },
    });

    expect(result.error).toBeNull();
    expect(result.score).toEqual(scoreFixture);
  });
});

describe('getScoreBySlug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns score when found', async () => {
    const { supabase } = await import('./supabase');
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeChain({ data: scoreFixture, error: null }) as any,
    );

    const result = await getScoreBySlug('test-score');

    expect(result.error).toBeNull();
    expect(result.score).toEqual(scoreFixture);
  });

  it('returns error when score not found (PGRST116)', async () => {
    const { supabase } = await import('./supabase');
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeChain({ data: null, error: { code: 'PGRST116' } }) as any,
    );

    const result = await getScoreBySlug('missing-score');

    expect(result.score).toBeNull();
    expect(result.error?.message).toBe('Score not found');
  });

  it('returns error on other DB failure', async () => {
    const { supabase } = await import('./supabase');
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeChain({ data: null, error: { message: 'conn fail' } }) as any,
    );

    const result = await getScoreBySlug('test-score');

    expect(result.score).toBeNull();
    expect(result.error?.message).toContain('conn fail');
  });
});

describe('updateScore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error when user is not authenticated', async () => {
    const { getCurrentUser } = await import('./auth');
    vi.mocked(getCurrentUser).mockResolvedValue({ user: null, error: null });

    const result = await updateScore('score-123', { title: 'New Title' });

    expect(result.score).toBeNull();
    expect(result.error?.message).toContain('logged in');
  });

  it('returns error when DB update fails', async () => {
    const { getCurrentUser } = await import('./auth');
    const { supabase } = await import('./supabase');
    vi.mocked(getCurrentUser).mockResolvedValue({
      user: userFixture as any,
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeChain({ data: null, error: { message: 'Update failed' } }) as any,
    );

    const result = await updateScore('score-123', { title: 'New Title' });

    expect(result.score).toBeNull();
    expect(result.error?.message).toContain('Update failed');
  });

  it('returns updated score on success', async () => {
    const { getCurrentUser } = await import('./auth');
    const { supabase } = await import('./supabase');
    const updated = { ...scoreFixture, title: 'New Title' };
    vi.mocked(getCurrentUser).mockResolvedValue({
      user: userFixture as any,
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeChain({ data: updated, error: null }) as any,
    );

    const result = await updateScore('score-123', { title: 'New Title' });

    expect(result.error).toBeNull();
    expect(result.score?.title).toBe('New Title');
  });
});

describe('deleteScore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error when user is not authenticated', async () => {
    const { getCurrentUser } = await import('./auth');
    vi.mocked(getCurrentUser).mockResolvedValue({ user: null, error: null });

    const result = await deleteScore('score-123');

    expect(result.error?.message).toContain('logged in');
  });

  it('returns null error on success', async () => {
    const { getCurrentUser } = await import('./auth');
    const { supabase } = await import('./supabase');
    vi.mocked(getCurrentUser).mockResolvedValue({
      user: userFixture as any,
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeChain({ data: null, error: null }) as any,
    );

    const result = await deleteScore('score-123');

    expect(result.error).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('scores');
  });
});

describe('forkScore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error when user is not authenticated', async () => {
    const { getCurrentUser } = await import('./auth');
    vi.mocked(getCurrentUser).mockResolvedValue({ user: null, error: null });

    const result = await forkScore('score-123');

    expect(result.score).toBeNull();
    expect(result.error?.message).toContain('logged in');
  });

  it('returns error when source score is not found', async () => {
    const { getCurrentUser } = await import('./auth');
    const { supabase } = await import('./supabase');
    vi.mocked(getCurrentUser).mockResolvedValue({
      user: userFixture as any,
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeChain({ data: null, error: { message: 'not found' } }) as any,
    );

    const result = await forkScore('score-123');

    expect(result.score).toBeNull();
    expect(result.error?.message).toContain('Failed to fetch score to fork');
  });

  it('returns error when fork insert fails', async () => {
    const { getCurrentUser } = await import('./auth');
    const { generateSlug, ensureUniqueSlug } = await import('../utils/slug');
    const { supabase } = await import('./supabase');
    vi.mocked(getCurrentUser).mockResolvedValue({
      user: userFixture as any,
      error: null,
    });
    vi.mocked(generateSlug).mockReturnValue('test-score');
    vi.mocked(ensureUniqueSlug).mockReturnValue('test-score');
    vi.mocked(supabase.from)
      .mockReturnValueOnce(
        makeChain({ data: scoreFixture, error: null }) as any,
      ) // fetch original
      .mockReturnValueOnce(makeChain({ data: [], error: null }) as any) // slug query in createScore
      .mockReturnValueOnce(
        makeChain({ data: null, error: { message: 'Insert failed' } }) as any,
      ); // insert fork

    const result = await forkScore('score-123');

    expect(result.score).toBeNull();
    expect(result.error?.message).toContain('Insert failed');
  });

  it('returns forked score and increments fork_count on success', async () => {
    const { getCurrentUser } = await import('./auth');
    const { generateSlug, ensureUniqueSlug } = await import('../utils/slug');
    const { supabase } = await import('./supabase');
    const forkedScore = {
      ...scoreFixture,
      id: 'fork-456',
      forked_from: 'score-123',
    };
    vi.mocked(getCurrentUser).mockResolvedValue({
      user: userFixture as any,
      error: null,
    });
    vi.mocked(generateSlug).mockReturnValue('test-score');
    vi.mocked(ensureUniqueSlug).mockReturnValue('test-score');
    vi.mocked(supabase.from)
      .mockReturnValueOnce(
        makeChain({ data: scoreFixture, error: null }) as any,
      ) // fetch original
      .mockReturnValueOnce(makeChain({ data: [], error: null }) as any) // slug query in createScore
      .mockReturnValueOnce(makeChain({ data: forkedScore, error: null }) as any) // insert fork
      .mockReturnValueOnce(makeChain({ data: null, error: null }) as any); // update fork_count

    const result = await forkScore('score-123');

    expect(result.error).toBeNull();
    expect(result.score).toEqual(forkedScore);
    expect(supabase.from).toHaveBeenCalledTimes(4);
  });
});
