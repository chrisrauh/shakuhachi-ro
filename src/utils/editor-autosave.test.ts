import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EditorAutosave } from './editor-autosave';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { ConfirmDialogOptions } from '../components/ConfirmDialog';

vi.mock('../components/ConfirmDialog', () => ({
  ConfirmDialog: vi.fn().mockImplementation(() => ({
    show: vi.fn(),
  })),
}));

describe('EditorAutosave', () => {
  const SLUG = 'test-slug';
  const KEY = `shakuhachi-editor-${SLUG}`;

  let autosave: EditorAutosave;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    localStorage.clear();
    autosave = new EditorAutosave(SLUG);
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  // --- save() debounce behavior ---

  it('saves to localStorage after debounce period', () => {
    autosave.save({
      scoreData: 'data',
      dataFormat: 'json',
      metadata: { title: 'T', composer: '', description: '' },
    });
    expect(localStorage.getItem(KEY)).toBeNull();

    vi.advanceTimersByTime(2000);

    expect(localStorage.getItem(KEY)).not.toBeNull();
  });

  it('saves with latest data when called multiple times before debounce fires', () => {
    autosave.save({
      scoreData: 'first',
      dataFormat: 'json',
      metadata: { title: 'T', composer: '', description: '' },
    });
    autosave.save({
      scoreData: 'second',
      dataFormat: 'json',
      metadata: { title: 'T', composer: '', description: '' },
    });

    vi.advanceTimersByTime(2000);

    const saved = JSON.parse(localStorage.getItem(KEY)!);
    expect(saved.scoreData).toBe('second');
  });

  it('includes savedAt timestamp in saved data', () => {
    autosave.save({
      scoreData: 'data',
      dataFormat: 'json',
      metadata: { title: 'T', composer: '', description: '' },
    });

    vi.advanceTimersByTime(2000);

    const saved = JSON.parse(localStorage.getItem(KEY)!);
    expect(saved.savedAt).toBeDefined();
    expect(typeof saved.savedAt).toBe('string');
  });

  // --- checkAndOfferRestore() ---

  it('does nothing when no draft exists', () => {
    autosave.checkAndOfferRestore('2024-01-01T00:00:00Z', vi.fn());

    expect(vi.mocked(ConfirmDialog)).not.toHaveBeenCalled();
  });

  it('does nothing when draft is older than loadedAt', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        savedAt: '2023-12-31T00:00:00Z',
        scoreData: '',
        dataFormat: 'json',
        metadata: { title: '', composer: '', description: '' },
      }),
    );

    autosave.checkAndOfferRestore('2024-01-01T00:00:00Z', vi.fn());

    expect(vi.mocked(ConfirmDialog)).not.toHaveBeenCalled();
  });

  it('does nothing when draft savedAt equals loadedAt', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        savedAt: '2024-01-01T00:00:00Z',
        scoreData: '',
        dataFormat: 'json',
        metadata: { title: '', composer: '', description: '' },
      }),
    );

    autosave.checkAndOfferRestore('2024-01-01T00:00:00Z', vi.fn());

    expect(vi.mocked(ConfirmDialog)).not.toHaveBeenCalled();
  });

  it('does nothing and does not clear when draft is missing savedAt field', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        scoreData: 'data',
        dataFormat: 'json',
        metadata: { title: '', composer: '', description: '' },
      }),
    );

    autosave.checkAndOfferRestore('2024-01-01T00:00:00Z', vi.fn());

    expect(vi.mocked(ConfirmDialog)).not.toHaveBeenCalled();
    expect(localStorage.getItem(KEY)).not.toBeNull();
  });

  it('shows ConfirmDialog when draft is newer than loadedAt', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        savedAt: '2024-01-02T00:00:00Z',
        scoreData: '',
        dataFormat: 'json',
        metadata: { title: '', composer: '', description: '' },
      }),
    );

    autosave.checkAndOfferRestore('2024-01-01T00:00:00Z', vi.fn());

    expect(vi.mocked(ConfirmDialog)).toHaveBeenCalledOnce();
    const mockInstance = vi.mocked(ConfirmDialog).mock.results[0].value;
    expect(mockInstance.show).toHaveBeenCalledOnce();
  });

  it('calls onRestore with draft data when user confirms', () => {
    const draft = {
      savedAt: '2024-01-02T00:00:00Z',
      scoreData: 'abc',
      dataFormat: 'json' as const,
      metadata: { title: 'T', composer: '', description: '' },
    };
    localStorage.setItem(KEY, JSON.stringify(draft));
    const onRestore = vi.fn();

    vi.mocked(ConfirmDialog).mockImplementationOnce(
      () =>
        ({
          show: (opts: ConfirmDialogOptions) => opts.onConfirm(),
        }) as unknown as ConfirmDialog,
    );

    autosave.checkAndOfferRestore('2024-01-01T00:00:00Z', onRestore);

    expect(onRestore).toHaveBeenCalledWith(draft);
  });

  it('calls clear() when user discards', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        savedAt: '2024-01-02T00:00:00Z',
        scoreData: '',
        dataFormat: 'json',
        metadata: { title: '', composer: '', description: '' },
      }),
    );

    vi.mocked(ConfirmDialog).mockImplementationOnce(
      () =>
        ({
          show: (opts: ConfirmDialogOptions) => opts.onCancel?.(),
        }) as unknown as ConfirmDialog,
    );

    autosave.checkAndOfferRestore('2024-01-01T00:00:00Z', vi.fn());

    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('clears and skips when saved JSON is malformed', () => {
    localStorage.setItem(KEY, 'not-valid-json');

    autosave.checkAndOfferRestore('2024-01-01T00:00:00Z', vi.fn());

    expect(localStorage.getItem(KEY)).toBeNull();
    expect(vi.mocked(ConfirmDialog)).not.toHaveBeenCalled();
  });

  // --- clear() ---

  it('removes the key from localStorage', () => {
    localStorage.setItem(KEY, 'some-data');

    autosave.clear();

    expect(localStorage.getItem(KEY)).toBeNull();
  });
});
