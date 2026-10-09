import type { NoteBox } from '../../web-component/renderer/ScoreRenderer';
import type { ScoreNote } from '../../web-component/types/ScoreData';
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

/** Where an empty score's cursor goes, unused when there are notes. */
const NO_NOTES = { x: 0, y: 0 };

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
 */
export class SelectionView {
  private notes: ScoreNote[] = [];
  /** Null until the first score is shown. */
  private selection: Selection | null = null;
  private idleTimer: number | undefined;

  private readonly scoreArea: HTMLElement;
  private readonly canvas: HTMLElement;
  private readonly renderer: ScoreElement;
  private readonly cursor: HTMLElement;
  private readonly highlight: HTMLElement;
  private readonly status: HTMLElement;
  private readonly statusMode: HTMLElement;
  private readonly statusDetail: HTMLElement;

  constructor() {
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

  /**
   * Draws the selection over a newly rendered score. Entering the editor puts
   * the cursor after the last note; after that, the selection is kept, inside
   * the score's new length.
   */
  show(notes: ScoreNote[]): void {
    this.notes = notes;
    this.select(
      this.selection
        ? fitSelection(this.selection, notes.length)
        : { type: 'cursor', position: notes.length },
    );
  }

  private select(selection: Selection): void {
    this.selection = selection;
    this.draw();
  }

  private draw(): void {
    const selection = this.selection!;
    const boxes = this.renderer.getNoteBoxes();
    let top: number;
    let bottom: number;

    this.highlight.hidden = selection.type !== 'highlight';
    this.cursor.hidden = selection.type !== 'cursor';
    if (selection.type === 'highlight') {
      // The renderer sizes the cell, the same for every note
      const { x, y, width, height } = boxes[selection.index].cell;
      place(this.highlight, { left: x, top: y, width });
      this.highlight.style.height = `${height}px`;
      top = y;
      bottom = y + height;
      // Park the hidden cursor where it goes after this note, on the
      // highlight's bottom edge, so that it moves from there when it replaces
      // the highlight, and doesn't move at all when it's after this note
      place(this.cursor, cursorLine(boxes, selection.index + 1, NO_NOTES));
    } else {
      // Reading the size has the browser style the cursor, now shown, where it
      // was parked, so that it moves to the line from there
      const line = cursorLine(boxes, selection.position, {
        x: this.canvas.offsetWidth / 2,
        y: this.canvas.offsetHeight / 2,
      });
      place(this.cursor, line);
      this.restartBlink();
      top = line.top;
      bottom = line.top;
    }

    const { mode, detail } = describeSelection(this.notes, selection);
    this.statusMode.textContent = mode;
    this.statusDetail.textContent = detail;
    this.keepInView(top, bottom);
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
        this.selection!,
      ),
    );
  }

  private handleKey(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;
    if (
      this.scoreArea.hidden ||
      e.altKey ||
      e.ctrlKey ||
      e.metaKey ||
      target.closest('input, textarea, select, dialog, [contenteditable]')
    ) {
      return;
    }
    const selection = this.selection!;

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
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
