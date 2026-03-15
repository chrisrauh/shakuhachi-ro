import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createEmptyScore, startNewScore } from './create-score-handler';

vi.mock('../api/scores');
vi.mock('../api/auth');
vi.mock('./slug');
vi.mock('../components/Toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

describe('createEmptyScore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error when slug generation fails', async () => {
    const { generateUniqueRandomSlug } = await import('./slug');
    vi.mocked(generateUniqueRandomSlug).mockResolvedValue({
      slug: '',
      error: new Error('Slug generation failed'),
    });

    const { slug, error } = await createEmptyScore();

    expect(slug).toBe('');
    expect(error?.message).toContain('Slug generation failed');
  });

  it('returns error when score creation fails', async () => {
    const { generateUniqueRandomSlug } = await import('./slug');
    const { createScore } = await import('../api/scores');

    vi.mocked(generateUniqueRandomSlug).mockResolvedValue({
      slug: 'test-slug',
      error: null,
    });
    vi.mocked(createScore).mockResolvedValue({
      score: null,
      error: new Error('Database error'),
    });

    const { slug, error } = await createEmptyScore();

    expect(slug).toBe('');
    expect(error?.message).toContain('Database error');
  });

  it('creates empty score and returns slug', async () => {
    const { generateUniqueRandomSlug } = await import('./slug');
    const { createScore } = await import('../api/scores');

    vi.mocked(generateUniqueRandomSlug).mockResolvedValue({
      slug: 'flowing-crane',
      error: null,
    });
    vi.mocked(createScore).mockResolvedValue({
      score: { slug: 'flowing-crane', id: 'test-id' } as any,
      error: null,
    });

    const { slug, error } = await createEmptyScore();

    expect(error).toBeNull();
    expect(slug).toBe('flowing-crane');
    expect(createScore).toHaveBeenCalledWith({
      title: 'flowing-crane',
      data_format: 'json',
      data: { title: '', style: 'kinko', notes: [] },
    });
  });

  it('does not call getCurrentUser', async () => {
    const { generateUniqueRandomSlug } = await import('./slug');
    const { createScore } = await import('../api/scores');
    const { getCurrentUser } = await import('../api/auth');

    vi.mocked(generateUniqueRandomSlug).mockResolvedValue({
      slug: 'test-slug',
      error: null,
    });
    vi.mocked(createScore).mockResolvedValue({
      score: { slug: 'test-slug', id: 'id' } as any,
      error: null,
    });

    await createEmptyScore();

    expect(getCurrentUser).not.toHaveBeenCalled();
  });
});

describe('startNewScore', () => {
  const mockAuthModal = { show: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: { href: '/' },
      writable: true,
    });
  });

  it('opens auth modal and does not call createEmptyScore when unauthenticated', async () => {
    const { getCurrentUser } = await import('../api/auth');
    const { generateUniqueRandomSlug } = await import('./slug');

    vi.mocked(getCurrentUser).mockResolvedValue({ user: null, error: null });

    await startNewScore(mockAuthModal);

    expect(mockAuthModal.show).toHaveBeenCalledWith('login');
    expect(generateUniqueRandomSlug).not.toHaveBeenCalled();
  });

  it('shows toast and does not navigate when createEmptyScore fails', async () => {
    const { getCurrentUser } = await import('../api/auth');
    const { generateUniqueRandomSlug } = await import('./slug');
    const { toast } = await import('../components/Toast');

    vi.mocked(getCurrentUser).mockResolvedValue({
      user: { id: 'u1' } as any,
      error: null,
    });
    vi.mocked(generateUniqueRandomSlug).mockResolvedValue({
      slug: '',
      error: new Error('Slug failed'),
    });

    await startNewScore(mockAuthModal);

    expect(toast.error).toHaveBeenCalled();
    expect(window.location.href).toBe('/');
  });

  it('navigates to real slug on success', async () => {
    const { getCurrentUser } = await import('../api/auth');
    const { generateUniqueRandomSlug } = await import('./slug');
    const { createScore } = await import('../api/scores');

    vi.mocked(getCurrentUser).mockResolvedValue({
      user: { id: 'u1' } as any,
      error: null,
    });
    vi.mocked(generateUniqueRandomSlug).mockResolvedValue({
      slug: 'flowing-crane',
      error: null,
    });
    vi.mocked(createScore).mockResolvedValue({
      score: { slug: 'flowing-crane', id: 'id' } as any,
      error: null,
    });

    await startNewScore(mockAuthModal);

    expect(mockAuthModal.show).not.toHaveBeenCalled();
    expect(window.location.href).toBe('/score/flowing-crane/edit');
  });
});
