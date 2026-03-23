import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ScoreEditor } from './ScoreEditor';

vi.mock('../api/scores');
vi.mock('../api/auth');
vi.mock('./Toast');
vi.mock('./ConfirmDialog', () => ({
  ConfirmDialog: vi.fn().mockImplementation(() => ({
    show: vi.fn(),
  })),
}));
vi.mock('./LoadingSpinner', () => ({
  buildSpinnerSVG: vi.fn(() => '<svg class="spinner"></svg>'),
}));
vi.mock('../utils/icons', () => ({
  renderIcon: vi.fn(() => ''),
  initIcons: vi.fn(),
}));

/** Flush microtask queue so loadExistingScore completes. */
function flushLoadScore(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// --- loading state ---

describe('ScoreEditor loading state', () => {
  const SCORE_ID = 'score-123';
  const SLUG = 'test-slug';

  let containerId: string;
  let container: HTMLDivElement;

  beforeEach(async () => {
    vi.clearAllMocks();

    containerId = 'loading-editor-container';
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);

    const { getScore } = await import('../api/scores');
    vi.mocked(getScore).mockResolvedValue({
      score: {
        id: SCORE_ID,
        slug: SLUG,
        title: 'Test',
        data_format: 'json',
        data: { notes: [] },
        updated_at: '2024-01-01T00:00:00Z',
      } as any,
      error: null,
    });
  });

  afterEach(() => {
    container.remove();
    localStorage.clear();
  });

  it('shows loading placeholder before data loads', () => {
    new ScoreEditor(containerId, SCORE_ID, SLUG);

    expect(container.querySelector('.editor-loading')).not.toBeNull();
    expect(container.querySelector('#score-data-input')).toBeNull();
  });

  it('replaces loading placeholder with editor after data loads', async () => {
    new ScoreEditor(containerId, SCORE_ID, SLUG);
    await flushLoadScore();

    expect(container.querySelector('.editor-loading')).toBeNull();
    expect(container.querySelector('#score-data-input')).not.toBeNull();
  });
});

// --- handleSave() ---

describe('ScoreEditor.handleSave', () => {
  const SCORE_ID = 'score-123';
  const SLUG = 'test-slug';
  const LOCAL_KEY = `shakuhachi-editor-${SLUG}`;

  let containerId: string;
  let container: HTMLDivElement;

  beforeEach(async () => {
    vi.clearAllMocks();

    Object.defineProperty(window, 'location', {
      value: { href: '/' },
      writable: true,
    });

    containerId = 'test-editor-container';
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);

    const { getScore } = await import('../api/scores');
    vi.mocked(getScore).mockResolvedValue({
      score: {
        id: SCORE_ID,
        slug: SLUG,
        title: 'Test Score',
        composer: null,
        description: null,
        data_format: 'json',
        data: { title: '', style: 'kinko', notes: [] },
        updated_at: '2024-01-01T00:00:00Z',
      } as any,
      error: null,
    });
  });

  afterEach(() => {
    container.remove();
    localStorage.clear();
  });

  async function makeEditorLoaded(): Promise<ScoreEditor> {
    const editor = new ScoreEditor(containerId, SCORE_ID, SLUG);
    await flushLoadScore();
    return editor;
  }

  it('calls toast.error and skips updateScore when user is not authenticated', async () => {
    const { getCurrentUser } = await import('../api/auth');
    const { updateScore } = await import('../api/scores');
    const { toast } = await import('./Toast');

    vi.mocked(getCurrentUser).mockResolvedValue({ user: null, error: null });

    const editor = await makeEditorLoaded();
    editor['scoreData'] = '{"notes":[]}';
    editor['dataFormat'] = 'json';
    editor['metadata'] = { title: 'Test', composer: '', description: '' };

    await editor['handleSave']();

    expect(toast.error).toHaveBeenCalled();
    expect(updateScore).not.toHaveBeenCalled();
  });

  it('calls toast.error and skips updateScore when score data is empty', async () => {
    const { getCurrentUser } = await import('../api/auth');
    const { updateScore } = await import('../api/scores');
    const { toast } = await import('./Toast');

    vi.mocked(getCurrentUser).mockResolvedValue({
      user: { id: 'user-1' } as any,
      error: null,
    });

    const editor = await makeEditorLoaded();
    editor['scoreData'] = '';
    editor['dataFormat'] = 'json';
    editor['metadata'] = { title: 'Test', composer: '', description: '' };

    await editor['handleSave']();

    expect(toast.error).toHaveBeenCalled();
    expect(updateScore).not.toHaveBeenCalled();
  });

  it('calls updateScore with correct args and toast.success on save', async () => {
    const { getCurrentUser } = await import('../api/auth');
    const { updateScore } = await import('../api/scores');
    const { toast } = await import('./Toast');

    vi.mocked(getCurrentUser).mockResolvedValue({
      user: { id: 'user-1' } as any,
      error: null,
    });
    vi.mocked(updateScore).mockResolvedValue({
      score: { id: SCORE_ID } as any,
      error: null,
    });

    const editor = await makeEditorLoaded();
    editor['scoreData'] = '{"title":"t","style":"kinko","notes":[]}';
    editor['dataFormat'] = 'json';
    editor['metadata'] = { title: 'My Score', composer: '', description: '' };

    localStorage.setItem(LOCAL_KEY, 'draft-data');

    await editor['handleSave']();

    expect(updateScore).toHaveBeenCalledWith(
      SCORE_ID,
      expect.objectContaining({ title: 'My Score', data_format: 'json' }),
    );
    expect(toast.success).toHaveBeenCalled();
    expect(localStorage.getItem(LOCAL_KEY)).toBeNull();
  });

  it('calls toast.error when API returns an error', async () => {
    const { getCurrentUser } = await import('../api/auth');
    const { updateScore } = await import('../api/scores');
    const { toast } = await import('./Toast');

    vi.mocked(getCurrentUser).mockResolvedValue({
      user: { id: 'user-1' } as any,
      error: null,
    });
    vi.mocked(updateScore).mockResolvedValue({
      score: null,
      error: new Error('DB fail'),
    });

    const editor = await makeEditorLoaded();
    editor['scoreData'] = '{"title":"t","style":"kinko","notes":[]}';
    editor['dataFormat'] = 'json';
    editor['metadata'] = { title: 'Test', composer: '', description: '' };

    await editor['handleSave']();

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('DB fail'),
    );
  });

  it('calls toast.error when updateScore throws a network error', async () => {
    const { getCurrentUser } = await import('../api/auth');
    const { updateScore } = await import('../api/scores');
    const { toast } = await import('./Toast');

    vi.mocked(getCurrentUser).mockResolvedValue({
      user: { id: 'user-1' } as any,
      error: null,
    });
    vi.mocked(updateScore).mockRejectedValue(new Error('Network error'));

    const editor = await makeEditorLoaded();
    editor['scoreData'] = '{"title":"t","style":"kinko","notes":[]}';
    editor['dataFormat'] = 'json';
    editor['metadata'] = { title: 'Test', composer: '', description: '' };

    await editor['handleSave']();

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('Network error'),
    );
  });
});

// --- localStorage autosave ---

describe('ScoreEditor localStorage autosave', () => {
  const SCORE_ID = 'score-123';
  const SLUG = 'test-slug';
  const LOCAL_KEY = `shakuhachi-editor-${SLUG}`;

  let containerId: string;
  let container: HTMLDivElement;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    containerId = 'ls-editor-container';
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);

    const { getScore } = await import('../api/scores');
    vi.mocked(getScore).mockResolvedValue({
      score: {
        id: SCORE_ID,
        slug: SLUG,
        title: 'Test',
        data_format: 'json',
        data: {},
        updated_at: '2024-01-01T00:00:00Z',
      } as any,
      error: null,
    });
  });

  afterEach(() => {
    container.remove();
    localStorage.clear();
    vi.useRealTimers();
  });

  it('saves to per-slug key after 2s of inactivity', async () => {
    const editor = new ScoreEditor(containerId, SCORE_ID, SLUG);
    await vi.advanceTimersByTimeAsync(0);
    editor['scoreData'] = '{"notes":[]}';
    editor['handleDataChange']('{"notes":[]}');

    vi.advanceTimersByTime(2000);

    const saved = localStorage.getItem(LOCAL_KEY);
    expect(saved).not.toBeNull();
    const parsed = JSON.parse(saved!);
    expect(parsed.scoreData).toBe('{"notes":[]}');
    expect(parsed.savedAt).toBeDefined();
  });

  it('does not save to old global key', async () => {
    const editor = new ScoreEditor(containerId, SCORE_ID, SLUG);
    await vi.advanceTimersByTimeAsync(0);
    editor['handleDataChange']('{"notes":[]}');
    vi.advanceTimersByTime(2000);

    expect(localStorage.getItem('shakuhachi-editor-autosave')).toBeNull();
  });
});

// --- unsaved changes indicator ---

describe('ScoreEditor unsaved changes indicator', () => {
  const SCORE_ID = 'score-123';
  const SLUG = 'test-slug';

  let containerId: string;
  let container: HTMLDivElement;

  beforeEach(async () => {
    vi.clearAllMocks();

    containerId = 'indicator-editor-container';
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);

    const { getScore } = await import('../api/scores');
    vi.mocked(getScore).mockResolvedValue({
      score: {
        id: SCORE_ID,
        slug: SLUG,
        title: 'Test',
        data_format: 'json',
        data: {},
        updated_at: '2024-01-01T00:00:00Z',
      } as any,
      error: null,
    });
  });

  afterEach(() => {
    container.remove();
    localStorage.clear();
  });

  it('shows unsaved indicator after a data change', async () => {
    const editor = new ScoreEditor(containerId, SCORE_ID, SLUG);
    await flushLoadScore();
    editor['hasUnsavedChanges'] = false;
    editor['handleDataChange']('new data');

    const indicator = container.querySelector('#save-status-indicator');
    expect(indicator?.textContent).toContain('Unsaved');
  });
});
