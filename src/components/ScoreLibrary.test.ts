import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { ScoreLibrary } from './ScoreLibrary';
import { getAllScores, getUserScores } from '../api/scores';
import type { Score } from '../api/scores';
import { onAuthReady } from '../api/auth';

// vi.mock must be at top level for Vitest hoisting to work
vi.mock('../api/scores');
vi.mock('../api/auth', () => ({
  onAuthReady: vi.fn(() => ({ unsubscribe: vi.fn() })),
}));
vi.mock('../utils/icons', () => ({
  getIconHTML: vi.fn(() => '<svg></svg>'),
}));
vi.mock('../constants/strings', () => ({
  STRING_FACTORIES: {
    containerNotFound: (id: string) => `Container not found: ${id}`,
  },
}));

// Helpers

function makeScore(overrides: Partial<Score> = {}): Score {
  // Cast: spreading a Partial<Score> loses the data_format/data pairing
  return {
    id: '1',
    user_id: 'u1',
    title: 'Akatombo',
    slug: 'akatombo',
    composer: 'Traditional',
    description: null,
    data_format: 'json',
    data: { notes: [] },
    forked_from: null,
    parent: null,
    fork_count: 0,
    source_url: null,
    source_description: null,
    composition_copyright_status: 'not_evaluated',
    composition_copyright_basis: null,
    composition_copyright_source: null,
    composition_year_author_died: null,
    composition_year_published: null,
    license: 'CC-BY-SA-4.0',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  } as Score;
}

const realEscapeHtml = ScoreLibrary.prototype['escapeHtml'];

/** The library the last mount() made. */
let mounted: ScoreLibrary;

/**
 * Mounts a library with the given user and scores, and waits for it to load.
 * `mine` is what getUserScores returns for the logged-in user.
 */
async function mount({
  user = null as { id: string } | null,
  library = [] as Score[],
  mine = [] as Score[],
  holdLoading = false,
} = {}): Promise<HTMLElement> {
  document.body.innerHTML = '<div id="score-library"></div>';
  vi.mocked(onAuthReady).mockImplementation((cb) => {
    cb(user as User | null);
    return { unsubscribe: vi.fn() } as unknown as ReturnType<
      typeof onAuthReady
    >;
  });
  vi.mocked(getAllScores).mockResolvedValue({ scores: library, error: null });
  vi.mocked(getUserScores).mockResolvedValue({ scores: mine, error: null });
  mounted = new ScoreLibrary('score-library', { holdLoading });
  await new Promise((resolve) => setTimeout(resolve, 0));
  return document.getElementById('score-library')!;
}

function rowTitles(container: HTMLElement): string[] {
  return [...container.querySelectorAll('.library-row-title-text')].map(
    (el) => el.textContent ?? '',
  );
}

function type(container: HTMLElement, query: string): void {
  const input = container.querySelector('#search-input') as HTMLInputElement;
  input.value = query;
  input.dispatchEvent(new Event('input'));
}

beforeEach(() => {
  vi.clearAllMocks();
});

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

// --- Rows ---

describe('ScoreLibrary rows', () => {
  it('links each row to its score page', async () => {
    const container = await mount({ library: [makeScore()] });
    const row = container.querySelector('a.library-row') as HTMLAnchorElement;
    expect(row.getAttribute('href')).toBe('/score/akatombo');
    expect(row.textContent).toContain('Akatombo');
  });

  it('draws the first note of the score with its marks, skipping rests', async () => {
    const container = await mount({
      library: [
        makeScore({
          data: {
            notes: [
              { rest: true, duration: '1' },
              {
                character: 'tsu',
                register: 1,
                accidental: 'meri',
                duration: '1',
              },
              { character: 'ro', register: 0, duration: '1' },
            ],
          },
        }),
      ],
    });
    const texts = [
      ...container.querySelectorAll('.library-row-note svg text'),
    ].map((el) => el.textContent);
    expect(texts).toEqual(expect.arrayContaining(['ツ', 'メ', '甲']));
    expect(texts).not.toContain('ロ');
  });

  it('shows the composer, school and fork count as columns', async () => {
    const container = await mount({
      library: [
        makeScore({ composer: 'Traditional', school: 'kinko', fork_count: 3 }),
      ],
    });
    const cells = [...container.querySelectorAll('.library-row-cell')].map(
      (el) => el.textContent?.trim(),
    );
    expect(cells).toContain('Traditional');
    expect(cells).toContain('Kinko-ryū');
    expect(container.querySelector('.library-row-count')?.textContent).toBe(
      '3',
    );
  });

  it('dates the row by its last update, not its creation', async () => {
    const container = await mount({
      library: [
        makeScore({
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-06-01T00:00:00Z',
        }),
      ],
    });
    const times = [...container.querySelectorAll('relative-time')].map((el) =>
      el.getAttribute('datetime'),
    );
    expect(times.length).toBeGreaterThan(0);
    expect(times.every((t) => t === '2024-06-01T00:00:00Z')).toBe(true);
  });

  it('escapes HTML in the title and description', async () => {
    const container = await mount({
      library: [
        makeScore({
          title: '<img src=x onerror=alert(1)>',
          description: '<script>alert(1)</script>',
        }),
      ],
    });
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
    expect(rowTitles(container)).toEqual(['<img src=x onerror=alert(1)>']);
  });
});

// --- Tabs ---

describe('ScoreLibrary tabs', () => {
  it('shows a heading in place of the tabs when logged out', async () => {
    const container = await mount({ library: [makeScore()] });
    expect(container.querySelector('.library-tabs')).toBeNull();
    expect(container.querySelector('.library-heading')?.textContent).toBe(
      'Library',
    );
  });

  it('switches between the whole library and the user’s own scores', async () => {
    const own = makeScore({ id: '2', title: 'Mine', slug: 'mine' });
    const container = await mount({
      user: { id: 'u1' },
      library: [makeScore(), own],
      mine: [own],
    });
    const search = container.querySelector('#search-input')!;
    expect(rowTitles(container)).toEqual(['Akatombo', 'Mine']);
    expect(search.getAttribute('placeholder')).toBe('Search the library');

    (container.querySelector('[data-tab="mine"]') as HTMLButtonElement).click();
    expect(rowTitles(container)).toEqual(['Mine']);
    expect(search.getAttribute('placeholder')).toBe('Search my scores');
    expect(
      container
        .querySelector('[data-tab="mine"]')
        ?.getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('offers to create a score when the user has none', async () => {
    const container = await mount({
      user: { id: 'u1' },
      library: [makeScore()],
    });
    (container.querySelector('[data-tab="mine"]') as HTMLButtonElement).click();
    expect(
      container.querySelector('.library-empty a')?.getAttribute('href'),
    ).toBe('/score/new/edit');
  });
});

// --- Search and sort ---

describe('ScoreLibrary search and sort', () => {
  const scores = [
    makeScore({
      id: '1',
      title: 'Sakura Sakura',
      composer: 'Traditional',
      updated_at: '2024-03-01T00:00:00Z',
    }),
    makeScore({
      id: '2',
      title: 'Akatombo',
      composer: 'Kosaku Yamada',
      updated_at: '2024-01-01T00:00:00Z',
    }),
    makeScore({
      id: '3',
      title: 'Shika no Tone',
      composer: null,
      school: 'kinko',
      updated_at: '2024-02-01T00:00:00Z',
    }),
  ];

  it('lists the most recently updated first', async () => {
    const container = await mount({ library: scores });
    expect(rowTitles(container)).toEqual([
      'Sakura Sakura',
      'Shika no Tone',
      'Akatombo',
    ]);
  });

  it('sorts by title when chosen', async () => {
    const container = await mount({ library: scores });
    const select = container.querySelector('#sort-select') as HTMLSelectElement;
    select.value = 'title';
    select.dispatchEvent(new Event('change'));
    expect(rowTitles(container)).toEqual([
      'Akatombo',
      'Sakura Sakura',
      'Shika no Tone',
    ]);
  });

  it('filters by title, composer or school, ignoring case', async () => {
    const container = await mount({ library: scores });
    type(container, 'sakura');
    expect(rowTitles(container)).toEqual(['Sakura Sakura']);
    type(container, 'YAMADA');
    expect(rowTitles(container)).toEqual(['Akatombo']);
    type(container, 'kinko');
    expect(rowTitles(container)).toEqual(['Shika no Tone']);
  });

  it('says what matched nothing, and shows the clear button', async () => {
    const container = await mount({ library: scores });
    const clear = container.querySelector('#search-clear-btn')!;
    expect(clear.hasAttribute('hidden')).toBe(true);

    type(container, 'zzz');
    expect(container.querySelector('.no-scores')?.textContent).toContain(
      'No scores found matching "zzz"',
    );
    expect(clear.hasAttribute('hidden')).toBe(false);
  });

  it('restores the query as a property rather than a markup attribute', async () => {
    const container = await mount({ library: scores });
    // A quote in the query would break out of value="..." if it were
    // interpolated into the markup — escapeHtml does not escape quotes.
    const query = '" onfocus="alert(1)';
    type(container, query);
    // A reload redraws the toolbar, with the query put back in the field
    mounted.refresh();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const input = container.querySelector('#search-input') as HTMLInputElement;
    expect(input.value).toBe(query);
    expect(input.getAttribute('onfocus')).toBeNull();
  });
});

// --- Constructor, error and loading states ---

describe('ScoreLibrary states', () => {
  it('throws when container element is not found', () => {
    document.body.innerHTML = '';
    expect(() => new ScoreLibrary('nonexistent')).toThrow(
      'Container not found: nonexistent',
    );
  });

  it('shows page-error with retry button when getAllScores fails', async () => {
    document.body.innerHTML = '<div id="score-library"></div>';
    vi.mocked(onAuthReady).mockImplementation((cb) => {
      cb(null);
      return { unsubscribe: vi.fn() } as unknown as ReturnType<
        typeof onAuthReady
      >;
    });
    vi.mocked(getAllScores).mockResolvedValue({
      scores: [],
      error: new Error('Network error'),
    });

    new ScoreLibrary('score-library');
    await new Promise((resolve) => setTimeout(resolve, 0));

    const container = document.getElementById('score-library')!;
    expect(container.querySelector('.page-error')?.textContent).toContain(
      'Network error',
    );
    expect(container.querySelector('#retry-btn')).not.toBeNull();
  });

  it('holds the skeleton and never fetches scores', async () => {
    const container = await mount({ holdLoading: true });
    expect(container.querySelector('.library-skeleton')).not.toBeNull();
    expect(getAllScores).not.toHaveBeenCalled();
  });
});
