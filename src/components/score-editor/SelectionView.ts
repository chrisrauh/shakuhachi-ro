import type { NoteBox } from '../../web-component/renderer/ScoreRenderer';
import type { ScoreNote } from '../../web-component/types/ScoreData';
import type { EditorCommand } from './editing';
import {
  cursorLine,
  describeSelection,
  fitSelection,
  moveSelection,
  selectAt,
  type Selection,
} from './selection';

/** The <shakuhachi-score> element, defined by the embed script the page loads. */
interface ScoreElement extends HTMLElement {
  getNoteBoxes(): NoteBox[];
}

/** The cursor starts blinking this long after it last moved. */
const CURSOR_IDLE_DELAY = 700;

/**
 * How far the cursor or highlight is kept from the score area's top and
 * bottom edges, scrolling the score if needed.
 */
const VIEW_MARGIN = { top: 24, bottom: 32 };

/**
 * The cursor and highlight over the score on the edit page. Draws them as
 * elements over the score, from where the renderer reports drawing each note,
 * moves them on taps and keys, and says where they are in the status line.
 * Passes on the keyboard's delete, undo and redo, which act on the selection.
 */
export class SelectionView {
  private notes: ScoreNote[] = [];
  /** Null until the first score is shown. */
  private current: Selection | null = null;
  private idleTimer: number | undefined;

  private readonly scoreArea: HTMLElement;
  private readonly canvas: HTMLElement;
  private readonly renderer: ScoreElement;
  private readonly cursor: HTMLElement;
  private readonly highlight: HTMLElement;
  private readonly status: HTMLElement;
  private readonly statusMode: HTMLElement;
  private readonly statusDetail: HTMLElement;

  constructor(
    private readonly handlers: {
      /** After every change of selection, including by an edit. */
      onChange: () => void;
      onCommand: (command: EditorCommand) => void;
    },
  ) {
    this.scoreArea = byId('score-area');
    this.canvas = byId('score-canvas');
    this.renderer = byId<ScoreElement>('score-renderer');
    this.cursor = byId('score-cursor');
    this.highlight = byId('score-highlight');
    this.status = byId('editor-status');
    this.statusMode = byId('status-mode');
    this.statusDetail = byId('status-detail');

    // Taps anywhere in the score area count, not only on the column
    this.scoreArea.addEventListener('click', (e) => this.handleTap(e));
    document.addEventListener('keydown', (e) => this.handleKey(e));
  }

  /** Shows the status line with the score, and hides it with the source. */
  set visible(visible: boolean) {
    this.status.hidden = !visible;
  }

  /** Where the cursor or highlight is. Read only once a score is shown. */
  get selection(): Selection {
    return this.current!;
  }

  /**
   * Draws a selection over a newly rendered score: the one an edit leaves, or
   * without one, the one before, kept inside the score's new length. Entering
   * the editor puts the cursor after the last note.
   */
  show(notes: ScoreNote[], selection?: Selection): void {
    this.notes = notes;
    this.select(
      selection ??
        (this.current
          ? fitSelection(this.current, notes.length)
          : { type: 'cursor', position: notes.length }),
    );
  }

  private select(selection: Selection): void {
    this.current = selection;
    this.draw();
    this.handlers.onChange();
  }

  private draw(): void {
    const selection = this.current!;
    const boxes = this.renderer.getNoteBoxes();
    let top: number;
    let bottom: number;

    this.highlight.hidden = selection.type !== 'highlight';
    this.cursor.hidden = selection.type !== 'cursor';
    // Reading a size has the browser style whichever was just shown where it
    // was parked while hidden, so that it moves from there to its new place
    const empty = {
      x: this.canvas.offsetWidth / 2,
      y: this.canvas.offsetHeight / 2,
    };

    // Each parks the other where it would be on the same note: the cursor on
    // the highlight's bottom edge, the highlight around the note the cursor
    // is after (or before, at the start). Switching between them on one note
    // then doesn't move, and to another note moves from this one.
    if (selection.type === 'highlight') {
      const { cell } = boxes[selection.index];
      this.placeHighlight(cell);
      top = cell.y;
      bottom = cell.y + cell.height;
      place(this.cursor, cursorLine(boxes, selection.index + 1, empty));
    } else {
      const line = cursorLine(boxes, selection.position, empty);
      place(this.cursor, line);
      this.restartBlink();
      top = line.top;
      bottom = line.top;
      const note = boxes[selection.position - 1] ?? boxes[selection.position];
      if (note) this.placeHighlight(note.cell);
    }

    const { mode, detail } = describeSelection(this.notes, selection);
    this.statusMode.textContent = mode;
    this.statusDetail.textContent = detail;
    this.keepInView(top, bottom);
  }

  /** Puts the highlight on a note's cell, which the renderer sizes. */
  private placeHighlight(cell: NoteBox['cell']): void {
    place(this.highlight, { left: cell.x, top: cell.y, width: cell.width });
    this.highlight.style.height = `${cell.height}px`;
  }

  /** The cursor stays solid while it moves, and blinks once it rests. */
  private restartBlink(): void {
    delete this.cursor.dataset.idle;
    clearTimeout(this.idleTimer);
    this.idleTimer = window.setTimeout(() => {
      this.cursor.dataset.idle = '';
    }, CURSOR_IDLE_DELAY);
  }

  /**
   * Scrolls the score area so the selection, from top to bottom in the
   * canvas's pixels, is clear of its edges. Uses where the selection is going,
   * not where it is drawn, which lags behind while it moves.
   */
  private keepInView(top: number, bottom: number): void {
    const canvasTop = this.canvas.getBoundingClientRect().top;
    const area = this.scoreArea.getBoundingClientRect();
    const above = area.top + VIEW_MARGIN.top - (canvasTop + top);
    const below = canvasTop + bottom - (area.bottom - VIEW_MARGIN.bottom);
    if (above > 0) this.scoreArea.scrollTop -= above;
    else if (below > 0) this.scoreArea.scrollTop += below;
  }

  private handleTap(e: MouseEvent): void {
    const canvas = this.canvas.getBoundingClientRect();
    this.select(
      selectAt(
        this.renderer.getNoteBoxes(),
        e.clientX - canvas.left,
        e.clientY - canvas.top,
        this.selection,
      ),
    );
  }

  private handleKey(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;
    if (
      this.scoreArea.hidden ||
      e.altKey ||
      target.closest('input, textarea, select, dialog, [contenteditable]')
    ) {
      return;
    }
    const selection = this.selection;

    // Ctrl or ⌘ is only for undo and redo
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        this.handlers.onCommand({ type: e.shiftKey ? 'redo' : 'undo' });
      }
      return;
    }

    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      this.handlers.onCommand({ type: 'delete' });
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const step = e.key === 'ArrowUp' ? -1 : 1;
      this.select(moveSelection(selection, step, this.notes.length));
    } else if (e.key === 'Escape' && selection.type === 'highlight') {
      this.select({ type: 'cursor', position: selection.index + 1 });
    } else if (
      e.key === 'Enter' &&
      selection.type === 'cursor' &&
      selection.position > 0 &&
      !target.closest('button, a')
    ) {
      this.select({ type: 'highlight', index: selection.position - 1 });
    }
  }
}

function place(
  element: HTMLElement,
  { left, top, width }: { left: number; top: number; width: number },
): void {
  element.style.left = `${left}px`;
  element.style.top = `${top}px`;
  element.style.width = `${width}px`;
}

function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`SelectionView: #${id} not found`);
  return el as T;
}
