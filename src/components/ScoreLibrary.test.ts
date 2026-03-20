import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScoreLibrary } from './ScoreLibrary';
import type { Score } from '../api/scores';

// vi.mock must be at top level for Vitest hoisting to work
vi.mock('../api/scores');
vi.mock('../api/auth', () => ({
  onAuthReady: vi.fn(() => ({ unsubscribe: vi.fn() })),
}));
vi.mock('../utils/icons', () => ({
  renderIcon: vi.fn(() => '<svg data-icon="git-fork"></svg>'),
  initIcons: vi.fn(),
  getIconHTML: vi.fn(() => '<svg data-icon="search"></svg>'),
}));
vi.mock('./LoadingSpinner', () => ({
  buildSpinnerSVG: vi.fn(() => '<svg class="spinner"></svg>'),
}));
vi.mock('../constants/strings', () => ({
  STRING_FACTORIES: {
    containerNotFound: (id: string) => `Container not found: ${id}`,
  },
}));

// Helpers

function makeScore(overrides: Partial<Score> = {}): Score {
  return {
    id: '1',
    user_id: 'u1',
    title: 'Akatombo',
    slug: 'akatombo',
    composer: 'Traditional',
    description: null,
    data_format: 'json',
    data: {},
    forked_from: null,
    fork_count: 0,
    source_url: null,
    rights: null,
    source_description: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// Bind the real private helper methods for use in test contexts.
// escapeHtml uses document.createElement which is available in jsdom.
const realEscapeHtml = ScoreLibrary.prototype['escapeHtml'];
const realRenderNoScores = ScoreLibrary.prototype['renderNoScores'];
const realRenderScoreCard = ScoreLibrary.prototype['renderScoreCard'];

// --- escapeHtml() ---

describe('ScoreLibrary.escapeHtml', () => {
  function call(text: string): string {
    return realEscapeHtml.call({}, text) as string;
  }

  it('passes plain text through unchanged', () => {
    expect(call('Akatombo')).toBe('Akatombo');
  });

  it('escapes < and > to prevent XSS', () => {
    expect(call('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
  });

  it('escapes & character', () => {
    expect(call('A & B')).toBe('A &amp; B');
  });
});

// --- renderNoScores() ---

describe('ScoreLibrary.renderNoScores', () => {
  it('renders a no-scores div containing the message', () => {
    const html = realRenderNoScores.call(
      {},
      'No scores found matching "test"',
    ) as string;
    expect(html).toContain('class="no-scores"');
    expect(html).toContain('No scores found matching "test"');
  });
});

// --- renderScoreCard() ---

describe('ScoreLibrary.renderScoreCard', () => {
  // The method calls this.escapeHtml and this.renderIcon (module-level import)
  const ctx = { escapeHtml: realEscapeHtml };

  function call(score: Score): string {
    return realRenderScoreCard.call(ctx, score) as string;
  }

  it('includes the score title and slug', () => {
    const html = call(makeScore());
    expect(html).toContain('Akatombo');
    expect(html).toContain('data-score-slug="akatombo"');
  });

  it('includes the composer', () => {
    expect(call(makeScore())).toContain('Traditional');
  });

  it('shows "Unknown composer" when composer is null', () => {
    expect(call(makeScore({ composer: null }))).toContain('Unknown composer');
  });

  it('includes description when present', () => {
    const html = call(makeScore({ description: 'A peaceful melody' }));
    expect(html).toContain('A peaceful melody');
  });

  it('shows forked-indicator when score is a fork', () => {
    const html = call(makeScore({ forked_from: 'original-slug' }));
    expect(html).toContain('forked-indicator');
  });

  it('omits forked-indicator when score is not a fork', () => {
    expect(call(makeScore({ forked_from: null }))).not.toContain(
      'forked-indicator',
    );
  });

  it('escapes HTML in title to prevent XSS', () => {
    const html = call(makeScore({ title: '<script>alert(1)</script>' }));
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

// --- applyFilters() ---

describe('ScoreLibrary.applyFilters', () => {
  const scores = [
    makeScore({ id: '1', title: 'Akatombo', composer: 'Traditional' }),
    makeScore({ id: '2', title: 'Sakura Sakura', composer: 'Traditional' }),
    makeScore({ id: '3', title: 'Love Story', composer: 'Modern' }),
  ];

  function callApplyFilters(
    searchQuery: string,
    myScores = scores,
    libraryScores = scores,
  ) {
    const ctx = {
      searchQuery,
      myScores,
      libraryScores,
      filteredMyScores: [] as Score[],
      filteredLibraryScores: [] as Score[],
      renderGrid: vi.fn(),
    };
    ScoreLibrary.prototype['applyFilters'].call(ctx);
    return ctx;
  }

  it('returns all scores when query is empty', () => {
    const ctx = callApplyFilters('');
    expect(ctx.filteredMyScores).toHaveLength(3);
    expect(ctx.filteredLibraryScores).toHaveLength(3);
  });

  it('filters by title (case-insensitive)', () => {
    const ctx = callApplyFilters('akatombo');
    expect(ctx.filteredMyScores).toHaveLength(1);
    expect(ctx.filteredMyScores[0].title).toBe('Akatombo');
  });

  it('filters by composer', () => {
    const ctx = callApplyFilters('modern');
    expect(ctx.filteredMyScores).toHaveLength(1);
    expect(ctx.filteredMyScores[0].title).toBe('Love Story');
  });

  it('returns empty arrays when no scores match', () => {
    const ctx = callApplyFilters('zzznomatch');
    expect(ctx.filteredMyScores).toHaveLength(0);
    expect(ctx.filteredLibraryScores).toHaveLength(0);
  });

  it('calls renderGrid after filtering', () => {
    const ctx = callApplyFilters('');
    expect(ctx.renderGrid).toHaveBeenCalledOnce();
  });
});

// --- renderGridContent() ---

describe('ScoreLibrary.renderGridContent', () => {
  const score = makeScore();

  function makeCtx(overrides: object) {
    return {
      escapeHtml: realEscapeHtml,
      renderNoScores: realRenderNoScores,
      renderScoreCard: vi.fn(() => '<div class="score-card"></div>'),
      currentUser: null,
      myScores: [],
      libraryScores: [],
      filteredMyScores: [],
      filteredLibraryScores: [],
      searchQuery: '',
      ...overrides,
    };
  }

  function call(ctx: object): string {
    return ScoreLibrary.prototype['renderGridContent'].call(ctx) as string;
  }

  it('shows My Scores and Library sections when logged in with scores', () => {
    const ctx = makeCtx({
      currentUser: { id: 'u1' },
      myScores: [score],
      filteredMyScores: [score],
      filteredLibraryScores: [score],
    });
    const html = call(ctx);
    expect(html).toContain('My Scores');
    expect(html).toContain('Library');
  });

  it('shows empty-state onboarding (not no-scores) when logged in with zero ever-created scores', () => {
    const ctx = makeCtx({
      currentUser: { id: 'u1' },
      myScores: [],
      libraryScores: [],
    });
    const html = call(ctx);
    expect(html).toContain('empty-state');
    expect(html).not.toContain('no-scores');
  });

  it('shows no-scores message with query when searching and logged out', () => {
    const ctx = makeCtx({
      searchQuery: 'zzz',
      filteredLibraryScores: [],
    });
    const html = call(ctx);
    expect(html).toContain('no-scores');
    expect(html).toContain('No scores found matching');
    expect(html).toContain('zzz');
  });

  it('shows generic empty message when no query and logged out', () => {
    const ctx = makeCtx({
      searchQuery: '',
      filteredLibraryScores: [],
    });
    const html = call(ctx);
    expect(html).toContain('No scores in the library yet');
  });
});

// --- Constructor ---

describe('ScoreLibrary constructor', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="score-library"></div>';
  });

  it('throws when container element is not found', () => {
    expect(() => new ScoreLibrary('nonexistent')).toThrow(
      'Container not found: nonexistent',
    );
  });

  it('renders the search bar into the container on first render', () => {
    new ScoreLibrary('score-library');
    expect(document.getElementById('score-library')!.innerHTML).toContain(
      'search-input',
    );
  });
});
