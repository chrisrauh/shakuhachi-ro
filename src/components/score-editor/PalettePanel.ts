export type PaletteSide = 'left' | 'right';

/** Per viewer, in this browser only: a convenience, so the page works without it. */
const SIDE_STORAGE_KEY = 'shakuhachi-palette-side';

/**
 * The palette panel rendered by PalettePanel.astro, and the ⇄ button that
 * moves it to the other side of the score. The notes column and the delete key
 * stay on the outer edge, where the thumb rests, so moving the panel reverses
 * its columns and edit row.
 */
export class PalettePanel {
  private readonly panel: HTMLElement;
  private readonly workspace: HTMLElement;
  private readonly sideToggle: HTMLButtonElement;
  private side: PaletteSide;

  constructor() {
    this.panel = byId('palette-panel');
    this.workspace = byId('editor-workspace');
    this.sideToggle = byId<HTMLButtonElement>('palette-side-toggle');
    this.side = readSide();

    this.sideToggle.addEventListener('click', () => {
      // Lets the score glide to its new centre; see score-editor.css
      this.workspace.dataset.paletteMoved = '';
      this.side = this.side === 'right' ? 'left' : 'right';
      writeSide(this.side);
      this.applySide();
    });
    this.applySide();
  }

  set visible(visible: boolean) {
    this.panel.hidden = !visible;
  }

  private applySide(): void {
    this.workspace.dataset.paletteSide = this.side;

    // Reordered in the DOM, not only drawn reversed, so the tab order follows
    const columns = byId('palette-columns');
    const columnOrder = ['notes', 'length', 'marks'];
    if (this.side === 'right') columnOrder.reverse();
    columns.append(
      ...columnOrder.map(
        (name) => columns.querySelector(`[data-column="${name}"]`)!,
      ),
    );

    const editRow = byId('palette-edit-row');
    const keyOrder =
      this.side === 'right'
        ? ['undo', 'redo', 'delete']
        : ['delete', 'undo', 'redo'];
    editRow.append(
      ...keyOrder.map((key) => editRow.querySelector(`[data-key="${key}"]`)!),
    );

    const other = this.side === 'right' ? 'left' : 'right';
    this.sideToggle.setAttribute('aria-label', `Move palettes to the ${other}`);
    this.sideToggle.title = `Move the palettes to the ${other} side`;
  }
}

function readSide(): PaletteSide {
  try {
    return localStorage.getItem(SIDE_STORAGE_KEY) === 'left' ? 'left' : 'right';
  } catch {
    return 'right';
  }
}

function writeSide(side: PaletteSide): void {
  try {
    localStorage.setItem(SIDE_STORAGE_KEY, side);
  } catch {
    // Storage blocked: the side holds for this visit only
  }
}

function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`PalettePanel: #${id} not found`);
  return el as T;
}
