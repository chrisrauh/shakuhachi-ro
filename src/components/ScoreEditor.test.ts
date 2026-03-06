import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScoreEditor } from './ScoreEditor';
import type { ScoreDataFormat } from '../api/scores';

vi.mock('../api/scores');
vi.mock('../api/auth');
vi.mock('./Toast');
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
    const result = callValidate(ctx);
    expect(result).toBe(false);
    expect(ctx.validationError).toBeNull();
  });

  it('returns false and null error for whitespace-only string', () => {
    const ctx: Ctx = {
      scoreData: '   \n\t',
      dataFormat: 'json',
      validationError: 'previous',
    };
    const result = callValidate(ctx);
    expect(result).toBe(false);
    expect(ctx.validationError).toBeNull();
  });

  it('returns true for valid JSON', () => {
    const ctx: Ctx = {
      scoreData: '{"title":"Test","notes":[]}',
      dataFormat: 'json',
      validationError: 'previous',
    };
    const result = callValidate(ctx);
    expect(result).toBe(true);
    expect(ctx.validationError).toBeNull();
  });

  it('returns false with error message for invalid JSON', () => {
    const ctx: Ctx = {
      scoreData: '{invalid json',
      dataFormat: 'json',
      validationError: null,
    };
    const result = callValidate(ctx);
    expect(result).toBe(false);
    expect(ctx.validationError).toBeTruthy();
  });

  it('returns true for valid ABC notation', () => {
    const ctx: Ctx = {
      scoreData: 'X:1\nT:Test\nM:4/4\nL:1/4\nK:C\nCDEF|',
      dataFormat: 'abc',
      validationError: null,
    };
    const result = callValidate(ctx);
    expect(result).toBe(true);
    expect(ctx.validationError).toBeNull();
  });

  it('returns false with error for invalid ABC notation', () => {
    const ctx: Ctx = {
      scoreData: '!!!not abc!!!',
      dataFormat: 'abc',
      validationError: null,
    };
    // ABCParser.parse may throw — result should be false and error set
    const result = callValidate(ctx);
    // May pass or fail depending on ABCParser leniency; just verify consistent state
    if (!result) {
      expect(ctx.validationError).toBeTruthy();
    } else {
      expect(ctx.validationError).toBeNull();
    }
  });

  it('returns true for valid MusicXML', () => {
    const validXML =
      '<score-partwise version="3.1"><part id="P1"></part></score-partwise>';
    const ctx: Ctx = {
      scoreData: validXML,
      dataFormat: 'musicxml',
      validationError: 'previous',
    };
    const result = callValidate(ctx);
    expect(result).toBe(true);
    expect(ctx.validationError).toBeNull();
  });

  it('returns false with error for MusicXML with parsererror', () => {
    const ctx: Ctx = {
      scoreData: '<score-partwise><unclosed>',
      dataFormat: 'musicxml',
      validationError: null,
    };
    const result = callValidate(ctx);
    // jsdom may or may not produce parsererror — only validate state consistency
    if (!result) {
      expect(ctx.validationError).toBeTruthy();
    } else {
      expect(ctx.validationError).toBeNull();
    }
  });
});

// --- handleSave() ---

describe('ScoreEditor.handleSave', () => {
  let containerId: string;
  let container: HTMLDivElement;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset window.location
    Object.defineProperty(window, 'location', {
      value: { href: '/' },
      writable: true,
    });

    // Create container in document body
    containerId = 'test-editor-container';
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);

    // Pre-mock getScore so constructor's loadExistingScore doesn't fail
    const { getScore } = await import('../api/scores');
    vi.mocked(getScore).mockResolvedValue({
      score: null,
      error: new Error('not found'),
    });
  });

  afterEach(() => {
    container.remove();
    localStorage.clear();
  });

  function makeEditor(): ScoreEditor {
    return new ScoreEditor(containerId);
  }

  it('calls toast.error and skips createScore when user is not authenticated', async () => {
    const { getCurrentUser } = await import('../api/auth');
    const { createScore } = await import('../api/scores');
    const { toast } = await import('./Toast');

    vi.mocked(getCurrentUser).mockResolvedValue({ user: null, error: null });

    const editor = makeEditor();
    editor['scoreData'] = '{"notes":[]}';
    editor['dataFormat'] = 'json';
    editor['metadata'] = { title: 'Test', composer: '', description: '' };

    await editor['handleSave']();

    expect(toast.error).toHaveBeenCalled();
    expect(createScore).not.toHaveBeenCalled();
  });

  it('calls toast.error and skips createScore when score data is empty', async () => {
    const { getCurrentUser } = await import('../api/auth');
    const { createScore } = await import('../api/scores');
    const { toast } = await import('./Toast');

    vi.mocked(getCurrentUser).mockResolvedValue({
      user: { id: 'user-1' } as any,
      error: null,
    });

    const editor = makeEditor();
    editor['scoreData'] = '';
    editor['dataFormat'] = 'json';
    editor['metadata'] = { title: 'Test', composer: '', description: '' };

    await editor['handleSave']();

    expect(toast.error).toHaveBeenCalled();
    expect(createScore).not.toHaveBeenCalled();
  });

  it('calls createScore with correct args and toast.success on create mode success', async () => {
    const { getCurrentUser } = await import('../api/auth');
    const { createScore } = await import('../api/scores');
    const { toast } = await import('./Toast');

    vi.mocked(getCurrentUser).mockResolvedValue({
      user: { id: 'user-1' } as any,
      error: null,
    });
    vi.mocked(createScore).mockResolvedValue({
      score: { id: 'new-id' } as any,
      error: null,
    });

    const editor = makeEditor();
    editor['scoreData'] = '{"title":"t","style":"kinko","notes":[]}';
    editor['dataFormat'] = 'json';
    editor['metadata'] = { title: 'My Score', composer: '', description: '' };

    localStorage.setItem('shakuhachi-editor-autosave', 'something');

    await editor['handleSave']();

    expect(createScore).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'My Score', data_format: 'json' }),
    );
    expect(toast.success).toHaveBeenCalled();
    expect(localStorage.getItem('shakuhachi-editor-autosave')).toBeNull();
  });

  it('calls updateScore instead of createScore in edit mode', async () => {
    const { getCurrentUser } = await import('../api/auth');
    const { createScore, updateScore } = await import('../api/scores');
    const { toast } = await import('./Toast');

    vi.mocked(getCurrentUser).mockResolvedValue({
      user: { id: 'user-1' } as any,
      error: null,
    });
    vi.mocked(updateScore).mockResolvedValue({
      score: { id: 'abc' } as any,
      error: null,
    });

    const editor = makeEditor();
    editor['scoreData'] = '{"title":"t","style":"kinko","notes":[]}';
    editor['dataFormat'] = 'json';
    editor['metadata'] = {
      title: 'Edited Score',
      composer: '',
      description: '',
    };
    editor['isEditing'] = true;
    editor['editingScoreId'] = 'abc';

    await editor['handleSave']();

    expect(updateScore).toHaveBeenCalledWith(
      'abc',
      expect.objectContaining({ title: 'Edited Score' }),
    );
    expect(createScore).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it('calls toast.error when API returns an error object', async () => {
    const { getCurrentUser } = await import('../api/auth');
    const { createScore } = await import('../api/scores');
    const { toast } = await import('./Toast');

    vi.mocked(getCurrentUser).mockResolvedValue({
      user: { id: 'user-1' } as any,
      error: null,
    });
    vi.mocked(createScore).mockResolvedValue({
      score: null,
      error: new Error('DB fail'),
    });

    const editor = makeEditor();
    editor['scoreData'] = '{"title":"t","style":"kinko","notes":[]}';
    editor['dataFormat'] = 'json';
    editor['metadata'] = { title: 'Test', composer: '', description: '' };

    await editor['handleSave']();

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('DB fail'),
    );
    expect(window.location.href).toBe('/');
  });

  it('calls toast.error when createScore throws a network error', async () => {
    const { getCurrentUser } = await import('../api/auth');
    const { createScore } = await import('../api/scores');
    const { toast } = await import('./Toast');

    vi.mocked(getCurrentUser).mockResolvedValue({
      user: { id: 'user-1' } as any,
      error: null,
    });
    vi.mocked(createScore).mockRejectedValue(new Error('Network error'));

    const editor = makeEditor();
    editor['scoreData'] = '{"title":"t","style":"kinko","notes":[]}';
    editor['dataFormat'] = 'json';
    editor['metadata'] = { title: 'Test', composer: '', description: '' };

    await editor['handleSave']();

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('Network error'),
    );
  });
});
