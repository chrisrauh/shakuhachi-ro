import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ScoreEditor } from './ScoreEditor';
import type { Score } from '../../api/scores';
import type { ScoreData } from '../../web-component/types/ScoreData';

vi.mock('../../api/scores');
vi.mock('../../api/auth');
vi.mock('../../api/purge');
vi.mock('../Toast');
// Class mocks must use `function` (not an arrow) so they remain constructible
// with `new` — Vitest 5 rejects arrow-function implementations there.
vi.mock('../../utils/editor-autosave', () => ({
  EditorAutosave: vi.fn().mockImplementation(function () {
    return { save: vi.fn(), clear: vi.fn(), checkAndOfferRestore: vi.fn() };
  }),
}));

const OWNER = 'user-1';
const JSON_DATA = { title: '', style: 'kinko', notes: [] };
const TWO_NOTES: ScoreData = {
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
    school: null,
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
    <p id="editor-status"><strong id="status-mode"></strong><span id="status-detail"></span></p>
    <div id="score-area">
      <div id="score-canvas">
        <div id="score-highlight" hidden></div>
        <shakuhachi-score id="score-renderer"></shakuhachi-score>
        <div id="score-cursor" hidden></div>
      </div>
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
          <div data-column="marks">
            <button class="palette-key" data-mark="meri" aria-label="meri"></button>
            <button class="palette-key" data-key="octave-up" aria-label="octave up"></button>
          </div>
          <div data-column="length">
            <button class="palette-key" data-duration="1" aria-label="half"></button>
            <button class="palette-key" data-duration="2" aria-label="beat"></button>
            <button class="palette-key" data-key="dot" aria-label="dot"></button>
          </div>
          <div data-column="notes">
            <div class="palette-keys">
              <button class="palette-key" data-step="re" aria-label="re"></button>
              <button class="palette-key" data-step="rest" aria-label="rest"></button>
            </div>
          </div>
        </div>
        <div id="palette-edit-row">
          <button class="palette-key" data-key="undo" aria-label="undo" disabled></button>
          <button class="palette-key" data-key="redo" aria-label="redo" disabled></button>
          <button class="palette-key" data-key="delete" aria-label="delete"></button>
        </div>
      </div>
    </div>
    <dialog id="details-dialog">
      <input id="title-input" value="Test Score" />
      <input id="composer-input" />
      <select id="school-select">
        <option value="">None</option>
        <option value="kinko">Kinko-ryū</option>
      </select>
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

/**
 * Stands in for the embed script's element: each note drawn 30 × 32 on a
 * column line at x 70, 44px apart from the top. (jsdom lays nothing out, so
 * the score's pixels are the page's.)
 */
customElements.define(
  'shakuhachi-score',
  class extends HTMLElement {
    getNoteBoxes() {
      const { notes } = JSON.parse(this.getAttribute('data-score')!);
      return notes.map((_: unknown, i: number) => ({
        x: 55,
        y: 10 + 44 * i,
        width: 30,
        height: 32,
        centerX: 70,
        centerY: 26 + 44 * i,
        cell: { x: 38, y: 5 + 44 * i, width: 64, height: 42 },
      }));
    }
  },
);

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
    expect($('status-detail').textContent).toBe('empty score');
    expect($('source-view').hidden).toBe(true);
  });

  it('shows the source as stored, and re-renders from it on switching back', () => {
    new ScoreEditor(makeScore());

    $('source-toggle').click();
    expect($('source-view').hidden).toBe(false);
    expect($('score-area').hidden).toBe(true);
    expect($('palette-panel').hidden).toBe(true);
    expect($('editor-status').hidden).toBe(true);
    expect($('source-toggle').textContent).toBe('Score');
    expect($<HTMLTextAreaElement>('score-data-input').value).toBe(
      JSON.stringify(JSON_DATA, null, 2),
    );

    typeSource(JSON.stringify(TWO_NOTES));
    $('source-toggle').click();

    expect(renderedScore()).toEqual(TWO_NOTES);
    expect($('score-empty-hint').hidden).toBe(true);
    expect($('palette-panel').hidden).toBe(false);
    expect($('save-status').textContent).toBe('Unsaved');
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

  it('says why a format switch failed in the validation line, and keeps the source and its format', async () => {
    new ScoreEditor(
      makeScore({
        data: {
          title: '',
          style: 'kinko',
          notes: [
            { pitch: { step: 'ro', octave: 0 }, duration: 1 },
            { pitch: { step: 'go', octave: 0 }, duration: 1 } as any,
          ],
        },
      }),
    );
    const source = $<HTMLTextAreaElement>('score-data-input');
    const before = source.value;
    // Validation and conversion number the same note the same way
    expect($('validation-message').textContent).toMatch(/^Note 2 /);

    const musicxml = document.querySelector<HTMLInputElement>(
      'input[value="musicxml"]',
    )!;
    musicxml.checked = true;
    musicxml.dispatchEvent(new Event('change'));

    await vi.waitFor(() =>
      expect($('validation-message').textContent).toBe(
        "Can't switch to MusicXML. Note 2 has a step, octave or meri/kari mark that isn't valid. Fix that note, or keep the score in its current format.",
      ),
    );
    expect(
      document.querySelector<HTMLInputElement>('input[value="json"]')!.checked,
    ).toBe(true);
    expect(source.value).toBe(before);

    // Editing shows the source's own state again
    source.dispatchEvent(new Event('input'));
    expect($('validation-message').textContent).toMatch(/^Note 2 has invalid/);
  });

  it('says why a readable score cannot switch format', async () => {
    new ScoreEditor(makeScore({ data: { ...TWO_NOTES, key: 'H' } }));
    expect($('validation-error').hidden).toBe(true);

    const abc = document.querySelector<HTMLInputElement>('input[value="abc"]')!;
    abc.checked = true;
    abc.dispatchEvent(new Event('change'));

    await vi.waitFor(() => expect($('validation-error').hidden).toBe(false));
    expect($('validation-message').textContent).toMatch(
      /^Can't switch to ABC\. The score's key, "H", isn't one ABC defines/,
    );
  });
});

describe('ScoreEditor selection', () => {
  const status = () =>
    `${$('status-mode').textContent} ${$('status-detail').textContent}`;
  const press = (key: string, target: HTMLElement = document.body) =>
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  const tap = (clientX: number, clientY: number) =>
    $('score-area').dispatchEvent(
      new MouseEvent('click', { clientX, clientY, bubbles: true }),
    );

  it('opens with the cursor after the last note', () => {
    new ScoreEditor(makeScore({ data: TWO_NOTES }));

    expect($('score-cursor').hidden).toBe(false);
    expect($('score-highlight').hidden).toBe(true);
    // On the bottom edge of the second note's cell, which ends at 49 + 42
    expect($('score-cursor').style.top).toBe('91px');
    expect(status()).toBe('Inserting after ツ tsu, otsu · 2 of 2');
  });

  it('highlights a tapped note, and moves with Up, Down and Esc', () => {
    new ScoreEditor(makeScore({ data: TWO_NOTES }));

    tap(70, 20);
    expect($('score-highlight').hidden).toBe(false);
    expect($('score-cursor').hidden).toBe(true);
    expect(status()).toBe('Changing ロ ro, otsu · 1 of 2');

    press('ArrowDown');
    expect(status()).toBe('Changing ツ tsu, otsu · 2 of 2');

    press('Escape');
    expect(status()).toBe('Inserting after ツ tsu, otsu · 2 of 2');

    press('ArrowUp');
    press('ArrowUp');
    expect(status()).toBe('Inserting at the start · of 2');
  });

  it('keeps whichever is hidden on the same note, so switching on one note does not move it', () => {
    new ScoreEditor(makeScore({ data: TWO_NOTES }));

    // The cursor is after the second note: the hidden highlight is around it
    expect($('score-highlight').style.top).toBe('49px');
    press('ArrowUp');
    expect($('score-highlight').style.top).toBe('5px');

    // The highlight is on the first note: the hidden cursor is on its bottom
    // edge, where Esc puts it
    tap(70, 20);
    expect($('score-cursor').style.top).toBe('47px');
    press('Escape');
    expect($('score-cursor').style.top).toBe('47px');
  });

  it('leaves keys typed in a text field alone', () => {
    new ScoreEditor(makeScore({ data: TWO_NOTES }));

    press('ArrowUp', $('title-input'));
    expect(status()).toBe('Inserting after ツ tsu, otsu · 2 of 2');
  });

  it('keeps the selection inside a score shortened in the source', () => {
    new ScoreEditor(makeScore({ data: TWO_NOTES }));
    tap(70, 60);
    expect(status()).toBe('Changing ツ tsu, otsu · 2 of 2');

    $('source-toggle').click();
    typeSource(
      JSON.stringify({ ...TWO_NOTES, notes: TWO_NOTES.notes.slice(1) }),
    );
    $('source-toggle').click();

    expect(status()).toBe('Inserting after ツ tsu, otsu · 1 of 1');
  });
});

describe('ScoreEditor editing', () => {
  const key = (selector: string) =>
    document.querySelector<HTMLButtonElement>(`.palette-key[${selector}]`)!;
  const press = (init: KeyboardEventInit) =>
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, ...init }),
    );
  const source = () =>
    JSON.parse($<HTMLTextAreaElement>('score-data-input').value) as ScoreData;
  const status = () => $('status-detail').textContent;

  it('inserts a note at the cursor into the source, and undo takes it out', () => {
    new ScoreEditor(makeScore({ data: { ...TWO_NOTES, title: 'Kept' } }));

    key('data-step="re"').click();
    expect(source()).toEqual({
      ...TWO_NOTES,
      title: 'Kept',
      notes: [
        ...TWO_NOTES.notes,
        { pitch: { step: 're', octave: 0 }, duration: 2 },
      ],
    });
    expect(renderedScore()).toEqual(source());
    expect(status()).toBe('after レ re, otsu · 3 of 3');
    expect($('save-status').textContent).toBe('Unsaved');

    key('data-key="undo"').click();
    expect(source().notes).toEqual(TWO_NOTES.notes);
    expect(status()).toBe('after ツ tsu, otsu · 2 of 2');
    expect(key('data-key="redo"').disabled).toBe(false);
  });

  it('deletes with Backspace and undoes with Ctrl+Z, putting the highlight back', () => {
    new ScoreEditor(makeScore({ data: TWO_NOTES }));
    press({ key: 'ArrowUp' });
    press({ key: 'Enter' });
    expect($('status-mode').textContent).toBe('Changing');

    press({ key: 'Backspace' });
    expect(source().notes).toEqual(TWO_NOTES.notes.slice(1));
    expect($('status-mode').textContent).toBe('Inserting');

    press({ key: 'z', ctrlKey: true });
    expect(source().notes).toEqual(TWO_NOTES.notes);
    expect($('status-mode').textContent).toBe('Changing');

    press({ key: 'z', metaKey: true, shiftKey: true });
    expect(source().notes).toEqual(TWO_NOTES.notes.slice(1));
  });

  it('presses the keys the target note matches, and disables those that do not apply', () => {
    new ScoreEditor(makeScore({ data: TWO_NOTES }));

    expect(key('data-duration="2"').getAttribute('aria-pressed')).toBe('true');
    expect(key('data-duration="1"').getAttribute('aria-pressed')).toBe('false');
    expect(key('data-step="re"').title).toBe('Insert re');

    key('data-step="rest"').click();
    expect(key('data-mark="meri"').disabled).toBe(true);
    expect(key('data-key="octave-up"').disabled).toBe(true);
    expect(key('data-key="dot"').disabled).toBe(false);

    press({ key: 'ArrowUp' });
    press({ key: 'ArrowUp' });
    press({ key: 'ArrowUp' });
    expect(key('data-key="delete"').disabled).toBe(true);
    expect(key('data-duration="2"').disabled).toBe(true);
  });

  it('presses the highlighted note’s key, and scrolls its column just enough to show it, once', () => {
    new ScoreEditor(makeScore({ data: TWO_NOTES }));
    const re = key('data-step="re"');
    const column = re.closest<HTMLElement>('.palette-keys')!;
    // jsdom lays nothing out: the column shows 0–100, and re is drawn at 120–166
    vi.spyOn(column, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      bottom: 100,
    } as DOMRect);
    vi.spyOn(re, 'getBoundingClientRect').mockReturnValue({
      top: 120,
      bottom: 166,
    } as DOMRect);

    // At the cursor, note keys insert: none is pressed
    re.click();
    expect(re.hasAttribute('aria-pressed')).toBe(false);
    expect(column.scrollTop).toBe(0);

    press({ key: 'Enter' });
    expect(re.getAttribute('aria-pressed')).toBe('true');
    expect(key('data-step="rest"').getAttribute('aria-pressed')).toBe('false');
    expect(column.scrollTop).toBe(66);

    // Editing the same note leaves a column scrolled by hand where it is
    column.scrollTop = 0;
    key('data-key="dot"').click();
    expect(column.scrollTop).toBe(0);
  });

  it('leaves the editing keys off for a MusicXML score', () => {
    const musicxml = `<?xml version="1.0"?>
<score-partwise><part id="P1"><measure number="1">
<note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
</measure></part></score-partwise>`;
    new ScoreEditor(makeScore({ data_format: 'musicxml', data: musicxml }));

    expect(key('data-step="re"').disabled).toBe(true);
    expect(key('data-key="delete"').disabled).toBe(true);
    press({ key: 'Backspace' });
    expect($<HTMLTextAreaElement>('score-data-input').value).toBe(musicxml);
  });

  it('forgets what could be undone after an edit to the source', () => {
    new ScoreEditor(makeScore({ data: TWO_NOTES }));
    key('data-step="re"').click();
    expect(key('data-key="undo"').disabled).toBe(false);

    $('source-toggle').click();
    typeSource(JSON.stringify(TWO_NOTES));
    $('source-toggle').click();

    expect(key('data-key="undo"').disabled).toBe(true);
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

  it('saves None as no school, clearing the stored one', async () => {
    const { updateScore } = await import('../../api/scores');
    new ScoreEditor(makeScore({ school: 'kinko' }));

    const school = $<HTMLSelectElement>('school-select');
    school.value = '';
    school.dispatchEvent(new Event('change'));
    await save();

    expect(updateScore).toHaveBeenCalledWith(
      'score-123',
      expect.objectContaining({ school: null }),
    );
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
    expect($('save-status').textContent).toBe('Unsaved');
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
        school: 'kinko',
        description: '',
        license: 'CC0-1.0',
      },
      savedAt: '2024-01-02T00:00:00Z',
    });

    expect($<HTMLInputElement>('title-input').value).toBe('Draft title');
    expect($<HTMLSelectElement>('school-select').value).toBe('kinko');
    expect($<HTMLSelectElement>('license-select').value).toBe('CC0-1.0');
    expect(renderedScore()).toEqual(TWO_NOTES);
    expect($('save-status').textContent).toBe('Unsaved');
  });
});
