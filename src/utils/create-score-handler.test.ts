import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createEmptyScore } from './create-score-handler';

// Mock dependencies
vi.mock('../api/scores');
vi.mock('../api/authState');
vi.mock('./slug');

describe('createEmptyScore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error when user is not authenticated', async () => {
    const { authState } = await import('../api/authState');
    vi.spyOn(authState, 'isAuthenticated').mockReturnValue(false);

    const { slug, error } = await createEmptyScore();

    expect(slug).toBe('');
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toContain('log in');
  });

  it('returns error when slug generation fails', async () => {
    const { authState } = await import('../api/authState');
    const { generateUniqueRandomSlug } = await import('./slug');

    vi.spyOn(authState, 'isAuthenticated').mockReturnValue(true);
    vi.mocked(generateUniqueRandomSlug).mockResolvedValue({
      slug: '',
      error: new Error('Slug generation failed'),
    });

    const { slug, error } = await createEmptyScore();

    expect(slug).toBe('');
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toContain('Slug generation failed');
  });

  it('returns error when score creation fails', async () => {
    const { authState } = await import('../api/authState');
    const { generateUniqueRandomSlug } = await import('./slug');
    const { createScore } = await import('../api/scores');

    vi.spyOn(authState, 'isAuthenticated').mockReturnValue(true);
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
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toContain('Database error');
  });

  it('creates empty score successfully and returns slug', async () => {
    const { authState } = await import('../api/authState');
    const { generateUniqueRandomSlug } = await import('./slug');
    const { createScore } = await import('../api/scores');

    vi.spyOn(authState, 'isAuthenticated').mockReturnValue(true);
    vi.mocked(generateUniqueRandomSlug).mockResolvedValue({
      slug: 'flowing-peaceful-crane',
      error: null,
    });
    vi.mocked(createScore).mockResolvedValue({
      score: { slug: 'flowing-peaceful-crane', id: 'test-id' } as any,
      error: null,
    });

    const { slug, error } = await createEmptyScore();

    expect(error).toBeNull();
    expect(slug).toBe('flowing-peaceful-crane');

    // Verify createScore was called with correct data
    expect(createScore).toHaveBeenCalledWith({
      title: 'flowing-peaceful-crane',
      data_format: 'json',
      data: { title: '', style: 'kinko', notes: [] },
    });
  });
});
