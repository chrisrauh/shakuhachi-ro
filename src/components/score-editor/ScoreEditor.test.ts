import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ScoreEditor } from './ScoreEditor';
import type { Score } from '../../api/scores';

vi.mock('../../api/scores');
vi.mock('../../api/auth');
vi.mock('../../api/purge');
vi.mock('../Toast');
vi.mock('../../utils/init-header', () => ({
  confirmDialog: { show: vi.fn() },
}));
// Class mocks must use `function` (not an arrow) so they remain constructible
// with `new` — Vitest 5 rejects arrow-function implementations there.
vi.mock('../../utils/editor-autosave', () => ({
  EditorAutosave: vi.fn().mockImplementation(function () {
    return { save: vi.fn(), clear: vi.fn(), checkAndOfferRestore: vi.fn() };
  }),
}));

const OWNER = 'user-1';
const JSON_DATA = { title: '', style: 'kinko', notes: [] };
const TWO_NOTES = {
  title: '',
  style: 'kinko',
  notes: [
    { pitch: { step: 'ro', octave: 0 }, duration: 2 },
    { pitch: { step: 'tsu', octave: 0 }, duration: 2 },
  ],
};

function makeScore(overrides: Partial<Score> = {}): Score {
  return {
    id: 'score-123',
    slug: 'test-slug',
    user_id: OWNER,
    title: 'Test Score',
    composer: null,
    description: null,
    data_format: 'json',
    data: JSON_DATA,
    license: 'CC-BY-SA-4.0',
    parent: null,
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  } as Score;
}

/** The markup edit.astro and DetailsDialog.astro render, reduced to what the editor reads. */
function renderPage(): void {
  document.body.innerHTML = `
    <button id="details-btn"></button>
    <button id="source-toggle"><span class="btn-text">Source</span></button>
    <span id="save-status"></span>
    <button id="save-btn"><span class="btn-text">Save</span></button>
    <div id="score-area">
      <shakuhachi-score id="score-renderer"></shakuhachi-score>
      <p id="score-empty-hint" hidden></p>
    </div>
    <section id="source-view" hidden>
      <input type="radio" name="format" value="json" />
      <input type="radio" name="format" value="musicxml" />
      <input type="radio" name="format" value="abc" />
      <div id="validation-error" hidden><span id="validation-message"></span></div>
      <textarea id="score-data-input"></textarea>
    </section>
    <button id="palette-side-toggle"></button>
    <div id="editor-workspace">
      <div id="palette-panel">
        <div id="palette-columns">
          <div data-column="marks"></div>
          <div data-column="length"></div>
          <div data-column="notes"></div>
        </div>
        <div id="palette-edit-row">
          <button data-key="undo"></button>
          <button data-key="redo"></button>
          <button data-key="delete"></button>
        </div>
      </div>
    </div>
    <dialog id="details-dialog">
      <input id="title-input" value="Test Score" />
      <input id="composer-input" />
      <textarea id="description-input"></textarea>
      <div id="license-summary"><button id="license-change"></button></div>
      <select id="license-select" hidden>
        <option value="CC-BY-SA-4.0" selected>CC BY-SA 4.0</option>
        <option value="CC0-1.0">CC0 1.0</option>
        <option value="CC-BY-NC-SA-4.0">CC BY-NC-SA 4.0</option>
      </select>
      <p id="license-description"></p>
    </dialog>
  `;
}

const $ = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;

function typeSource(text: string): void {
  const textarea = $<HTMLTextAreaElement>('score-data-input');
  textarea.value = text;
  textarea.dispatchEvent(new Event('input'));
}

function renderedScore(): unknown {
  return JSON.parse($('score-renderer').getAttribute('data-score') ?? 'null');
}

/** Clicks Save and waits for it: the mocked calls it awaits all resolve at once. */
async function save(): Promise<void> {
  $('save-btn').click();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(async () => {
  vi.clearAllMocks();
  renderPage();
  const { getCurrentUser } = await import('../../api/auth');
  vi.mocked(getCurrentUser).mockResolvedValue({
    user: { id: OWNER } as any,
    error: null,
  });
  const { updateScore } = await import('../../api/scores');
  vi.mocked(updateScore).mockResolvedValue({
    score: { id: 'score-123' } as any,
    error: null,
  });
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('ScoreEditor score and source', () => {
  it('renders the score, and the empty-score hint when it has no notes', () => {
    new ScoreEditor(makeScore());

    expect(renderedScore()).toEqual(JSON_DATA);
    expect($('score-empty-hint').hidden).toBe(false);
    expect($('source-view').hidden).toBe(true);
  });

  it('shows the source as stored, and re-renders from it on switching back', () => {
    new ScoreEditor(makeScore());

    $('source-toggle').click();
    expect($('source-view').hidden).toBe(false);
    expect($('score-area').hidden).toBe(true);
    expect($('palette-panel').hidden).toBe(true);
    expect($('source-toggle').textContent).toBe('Score');
    expect($<HTMLTextAreaElement>('score-data-input').value).toBe(
      JSON.stringify(JSON_DATA, null, 2),
    );

    typeSource(JSON.stringify(TWO_NOTES));
    $('source-toggle').click();

    expect(renderedScore()).toEqual(TWO_NOTES);
    expect($('score-empty-hint').hidden).toBe(true);
    expect($('palette-panel').hidden).toBe(false);
    expect($('save-status').textContent).toBe('Unsaved changes');
  });

  it('keeps the last readable score, and says why, when the source is invalid', () => {
    new ScoreEditor(makeScore());
    $('source-toggle').click();

    typeSource('{"notes": [<b>broken</b>');
    expect($('validation-error').hidden).toBe(false);
    // Set as text: the message can quote the source
    expect($('validation-message').querySelector('b')).toBeNull();

    $('source-toggle').click();
    expect(renderedScore()).toEqual(JSON_DATA);
  });

  it('opens on the source when the stored score cannot be read', () => {
    new ScoreEditor(makeScore({ data_format: 'abc', data: 'not abc' }));

    expect($('source-view').hidden).toBe(false);
    expect($('validation-error').hidden).toBe(false);
  });

  it('says why a format switch failed, and keeps the radio on the old format', async () => {
    const { confirmDialog } = await import('../../utils/init-header');
    new ScoreEditor(
      makeScore({
        data: {
          title: '',
          style: 'kinko',
          notes: [{ pitch: { step: 'go', octave: 0 }, duration: 1 } as any],
        },
      }),
    );

    const musicxml = document.querySelector<HTMLInputElement>(
      'input[value="musicxml"]',
    )!;
    musicxml.checked = true;
    musicxml.dispatchEvent(new Event('change'));

    await vi.waitFor(() => expect(confirmDialog.show).toHaveBeenCalled());
    const options = vi.mocked(confirmDialog.show).mock.calls[0][0];
    expect(options.message).toContain(
      "Note 1 has a step, octave or meri/kari mark that isn't valid",
    );
    options.onCancel!();
    expect(
      document.querySelector<HTMLInputElement>('input[value="json"]')!.checked,
    ).toBe(true);
  });
});

describe('ScoreEditor.save', () => {
  it('saves the score and its details, and stays on the page', async () => {
    const { updateScore } = await import('../../api/scores');
    const { purgeScoreCache } = await import('../../api/purge');
    const { EditorAutosave } = await import('../../utils/editor-autosave');
    new ScoreEditor(makeScore());

    const title = $<HTMLInputElement>('title-input');
    title.value = 'My Score';
    title.dispatchEvent(new Event('input'));
    await save();

    expect(updateScore).toHaveBeenCalledWith(
      'score-123',
      expect.objectContaining({
        title: 'My Score',
        data_format: 'json',
        data: JSON_DATA,
      }),
    );
    expect(purgeScoreCache).toHaveBeenCalledWith('test-slug');
    expect(
      vi.mocked(EditorAutosave).mock.results[0].value.clear,
    ).toHaveBeenCalled();
    expect($('save-status').textContent).toBe('Saved');
  });

  it('saves ABC as the text the author typed, so it reopens as ABC', async () => {
    const { updateScore } = await import('../../api/scores');
    const abc = 'X:1\nT:Akatombo\n% a comment the parser drops\nK:D\nD F G|';
    new ScoreEditor(makeScore({ data_format: 'abc', data: abc }));

    await save();

    expect(updateScore).toHaveBeenCalledWith(
      'score-123',
      expect.objectContaining({ data_format: 'abc', data: abc }),
    );
  });

  it('does not save when signed out', async () => {
    const { getCurrentUser } = await import('../../api/auth');
    const { updateScore } = await import('../../api/scores');
    const { toast } = await import('../Toast');
    vi.mocked(getCurrentUser).mockResolvedValue({ user: null, error: null });
    new ScoreEditor(makeScore());

    await save();

    expect(toast.error).toHaveBeenCalled();
    expect(updateScore).not.toHaveBeenCalled();
  });

  it('does not save an invalid source, and shows it', async () => {
    const { updateScore } = await import('../../api/scores');
    const { toast } = await import('../Toast');
    new ScoreEditor(makeScore());
    typeSource('{');

    await save();

    expect(toast.error).toHaveBeenCalled();
    expect(updateScore).not.toHaveBeenCalled();
    expect($('source-view').hidden).toBe(false);
  });

  it('reports a failed save and keeps the changes unsaved', async () => {
    const { updateScore } = await import('../../api/scores');
    const { toast } = await import('../Toast');
    vi.mocked(updateScore).mockResolvedValue({
      score: null,
      error: new Error('DB fail'),
    });
    new ScoreEditor(makeScore());
    typeSource(JSON.stringify(TWO_NOTES));

    await save();

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('DB fail'),
    );
    expect($('save-status').textContent).toBe('Unsaved changes');
    expect($('save-btn').querySelector('.btn-text')?.textContent).toBe('Save');
  });
});

describe('ScoreEditor licence', () => {
  // Naming the column fires the fork-licence trigger, which can reject an
  // otherwise unrelated save.
  it('leaves the licence out of a save that did not change it', async () => {
    const { updateScore } = await import('../../api/scores');
    new ScoreEditor(makeScore());

    await save();

    expect(vi.mocked(updateScore).mock.calls[0][1]).not.toHaveProperty(
      'license',
    );
  });

  it('saves the licence picked, and explains it', async () => {
    const { updateScore } = await import('../../api/scores');
    new ScoreEditor(makeScore());

    $('license-change').click();
    expect($('license-select').hidden).toBe(false);
    expect($('license-summary')).toBeNull();

    const select = $<HTMLSelectElement>('license-select');
    select.value = 'CC-BY-NC-SA-4.0';
    select.dispatchEvent(new Event('change'));
    await save();

    expect($('license-description').querySelector('strong')?.textContent).toBe(
      'not commercially',
    );
    expect(updateScore).toHaveBeenCalledWith(
      'score-123',
      expect.objectContaining({ license: 'CC-BY-NC-SA-4.0' }),
    );
  });
});

describe('ScoreEditor draft restore', () => {
  it('puts a restored draft in the details and the source', async () => {
    const { EditorAutosave } = await import('../../utils/editor-autosave');
    new ScoreEditor(makeScore());
    const restore =
      vi.mocked(EditorAutosave).mock.results[0].value.checkAndOfferRestore.mock
        .calls[0][1];

    restore({
      scoreData: JSON.stringify(TWO_NOTES),
      dataFormat: 'json',
      metadata: {
        title: 'Draft title',
        composer: '',
        description: '',
        license: 'CC0-1.0',
      },
      savedAt: '2024-01-02T00:00:00Z',
    });

    expect($<HTMLInputElement>('title-input').value).toBe('Draft title');
    expect($<HTMLSelectElement>('license-select').value).toBe('CC0-1.0');
    expect(renderedScore()).toEqual(TWO_NOTES);
    expect($('save-status').textContent).toBe('Unsaved changes');
  });
});
