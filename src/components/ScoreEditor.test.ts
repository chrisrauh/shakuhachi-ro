import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ScoreEditor } from './ScoreEditor';
import type { ScoreDataFormat } from '../api/scores';

vi.mock('../api/scores');
vi.mock('../api/auth');
vi.mock('./Toast');
vi.mock('./ConfirmDialog', () => ({
  ConfirmDialog: vi.fn().mockImplementation(() => ({
    show: vi.fn(),
  })),
}));
vi.mock('../utils/icons', () => ({
  renderIcon: vi.fn(() => ''),
  initIcons: vi.fn(),
}));

// --- validateScoreData() ---

describe('ScoreEditor.validateScoreData', () => {
  type Ctx = {
    scoreData: string;
    dataFormat: ScoreDataFormat;
    validationError: string | null;
  };

  function callValidate(ctx: Ctx): boolean {
    return ScoreEditor.prototype['validateScoreData'].call(ctx) as boolean;
  }

  it('returns false and null error for empty string', () => {
    const ctx: Ctx = {
      scoreData: '',
      dataFormat: 'json',
      validationError: 'previous',
    };
    expect(callValidate(ctx)).toBe(false);
    expect(ctx.validationError).toBeNull();
  });

  it('returns false and null error for whitespace-only string', () => {
    const ctx: Ctx = {
      scoreData: '   \n\t',
      dataFormat: 'json',
      validationError: 'previous',
    };
    expect(callValidate(ctx)).toBe(false);
    expect(ctx.validationError).toBeNull();
  });

  it('returns true for valid JSON', () => {
    const ctx: Ctx = {
      scoreData: '{"title":"Test","notes":[]}',
      dataFormat: 'json',
      validationError: 'previous',
    };
    expect(callValidate(ctx)).toBe(true);
    expect(ctx.validationError).toBeNull();
  });

  it('returns false with error for invalid JSON', () => {
    const ctx: Ctx = {
      scoreData: '{invalid json',
      dataFormat: 'json',
      validationError: null,
    };
    expect(callValidate(ctx)).toBe(false);
    expect(ctx.validationError).toBeTruthy();
  });

  it('returns true for valid ABC notation', () => {
    const ctx: Ctx = {
      scoreData: 'X:1\nT:Test\nM:4/4\nL:1/4\nK:C\nCDEF|',
      dataFormat: 'abc',
      validationError: null,
    };
    expect(callValidate(ctx)).toBe(true);
    expect(ctx.validationError).toBeNull();
  });

  it('returns true for valid MusicXML', () => {
    const validXML =
      '<score-partwise version="3.1"><part id="P1"></part></score-partwise>';
    const ctx: Ctx = {
      scoreData: validXML,
      dataFormat: 'musicxml',
      validationError: 'previous',
    };
    expect(callValidate(ctx)).toBe(true);
    expect(ctx.validationError).toBeNull();
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
    // Flush microtasks so loadExistingScore completes before test manipulates state
    await Promise.resolve();
    await Promise.resolve();
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

  it('shows unsaved indicator after a data change', () => {
    const editor = new ScoreEditor(containerId, SCORE_ID, SLUG);
    editor['hasUnsavedChanges'] = false;
    editor['handleDataChange']('new data');

    const indicator = container.querySelector('#save-status-indicator');
    expect(indicator?.textContent).toContain('Unsaved');
  });
});
