import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PalettePanel } from './PalettePanel';

/** The markup edit.astro and PalettePanel.astro render, reduced to what the panel reads. */
function renderPage(): void {
  document.body.innerHTML = `
    <button id="palette-side-toggle"></button>
    <div id="editor-workspace" data-palette-side="right">
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
  `;
}

const $ = (id: string) => document.getElementById(id)!;
/** Its keys pass on commands, which these tests don't press. */
const panel = () => new PalettePanel(() => {});
const columnOrder = () =>
  [...document.querySelectorAll<HTMLElement>('[data-column]')].map(
    (column) => column.dataset.column,
  );
const editRowOrder = () =>
  [...document.querySelectorAll<HTMLElement>('[data-key]')].map(
    (key) => key.dataset.key,
  );

beforeEach(() => {
  localStorage.clear();
  renderPage();
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('PalettePanel', () => {
  it('starts on the right, with the notes column and delete on the outer edge', () => {
    panel();

    expect($('editor-workspace').dataset.paletteSide).toBe('right');
    expect(columnOrder()).toEqual(['marks', 'length', 'notes']);
    expect(editRowOrder()).toEqual(['undo', 'redo', 'delete']);
    expect($('palette-side-toggle').getAttribute('aria-label')).toBe(
      'Move palettes to the left',
    );
  });

  it('moves to the other side, keeping the notes column and delete outermost', () => {
    panel();
    $('palette-side-toggle').click();

    expect($('editor-workspace').dataset.paletteSide).toBe('left');
    expect(columnOrder()).toEqual(['notes', 'length', 'marks']);
    expect(editRowOrder()).toEqual(['delete', 'undo', 'redo']);
    expect($('palette-side-toggle').getAttribute('aria-label')).toBe(
      'Move palettes to the right',
    );
    expect($('palette-side-toggle').title).toBe(
      'Move the palettes to the right side',
    );
  });

  it('opens on the side chosen last time', () => {
    panel();
    $('palette-side-toggle').click();

    renderPage();
    panel();

    expect($('editor-workspace').dataset.paletteSide).toBe('left');
    expect(columnOrder()).toEqual(['notes', 'length', 'marks']);
  });

  it('still moves when the browser blocks storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    panel();
    expect($('editor-workspace').dataset.paletteSide).toBe('right');

    $('palette-side-toggle').click();
    expect($('editor-workspace').dataset.paletteSide).toBe('left');
  });
});
