import type { MeriKari, PitchStep } from '../../web-component/types/ScoreData';
import { parseBeats } from '../../web-component/types/Duration';
import {
  addStroke,
  targetIndex,
  toggleDot,
  writtenDuration,
  type EditorCommand,
  type EditorState,
} from './editing';

export type PaletteSide = 'left' | 'right';

/** Per viewer, in this browser only: a convenience, so the page works without it. */
const SIDE_STORAGE_KEY = 'shakuhachi-palette-side';

/** Daikan: octave up is disabled on a note already there. */
const HIGHEST_OCTAVE = 2;

/** What the keys show: the notes and selection, and what can be done to them. */
export interface PaletteState extends EditorState {
  canUndo: boolean;
  canRedo: boolean;
  /** False for a score that can't be edited from the palette yet. */
  editable: boolean;
}

/**
 * The palette panel rendered by PalettePanel.astro, and the ⇄ button that
 * moves it to the other side of the score. The notes column and the delete key
 * stay on the outer edge, where the thumb rests, so moving the panel reverses
 * its columns and edit row.
 *
 * A key press is passed on as a command; update() shows which keys apply to
 * the selection, and which match the note it acts on.
 */
export class PalettePanel {
  private readonly panel: HTMLElement;
  private readonly workspace: HTMLElement;
  private readonly sideToggle: HTMLButtonElement;
  private readonly keys: HTMLButtonElement[];
  /** The note key last scrolled into view, so it's revealed only once. */
  private revealedKey: HTMLButtonElement | undefined;
  private side: PaletteSide;

  constructor(onCommand: (command: EditorCommand) => void) {
    this.panel = byId('palette-panel');
    this.workspace = byId('editor-workspace');
    this.sideToggle = byId<HTMLButtonElement>('palette-side-toggle');
    this.keys = [
      ...this.panel.querySelectorAll<HTMLButtonElement>('.palette-key'),
    ];
    this.side = readSide();

    this.panel.addEventListener('click', (e) => {
      const key = (e.target as Element).closest<HTMLButtonElement>(
        '.palette-key',
      );
      if (key && !key.disabled) onCommand(commandFor(key));
    });

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

  /**
   * Shows which keys apply: lengths and the dot need a note to act on, the
   * stroke one of a beat or more, marks and octave a pitched one, and delete a
   * note to remove. A key whose value that note already has is pressed. Note
   * and delete titles follow the mode; the stroke's says how long the note is.
   *
   * Note keys are pressed only for a highlighted note, which they change; at
   * the cursor they insert, so none is pressed. The highlighted note's key is
   * scrolled into view in its column.
   */
  update({ notes, selection, canUndo, canRedo, editable }: PaletteState): void {
    const index = targetIndex(selection);
    const note = notes[index];
    const pitch = note && !note.rest ? note.pitch : undefined;
    const changing = selection.type === 'highlight';
    let noteKey: HTMLButtonElement | undefined;

    for (const key of this.keys) {
      const command = commandFor(key);
      let applies = editable;
      let pressed: boolean | undefined;

      switch (command.type) {
        case 'note': {
          const name =
            command.step === 'rest' ? 'a rest' : key.getAttribute('aria-label');
          key.title = `${changing ? 'Change to' : 'Insert'} ${name}`;
          if (changing) {
            pressed = command.step === (pitch ? pitch.step : 'rest');
            if (pressed) noteKey = key;
          }
          break;
        }
        case 'duration':
          applies &&= !!note;
          pressed = !!note && writtenDuration(note) === command.duration;
          break;
        case 'stroke':
          applies &&= addStroke({ notes, selection }) !== null;
          key.title = applies
            ? `Add a beat after the note, now ${beatCount(note!.duration)}`
            : 'Add a beat after the note';
          break;
        case 'dot':
          applies &&= toggleDot({ notes, selection }) !== null;
          pressed = !!note?.dotted;
          break;
        case 'mark':
          applies &&= !!pitch;
          pressed = !!pitch && note.meriKari === command.mark;
          break;
        case 'octave':
          applies &&=
            !!pitch &&
            (command.step > 0
              ? pitch.octave < HIGHEST_OCTAVE
              : pitch.octave > 0);
          break;
        case 'delete':
          applies &&= index >= 0;
          key.title = changing
            ? 'Delete the highlighted note'
            : 'Delete the note before the cursor';
          break;
        case 'undo':
          applies = canUndo;
          break;
        case 'redo':
          applies = canRedo;
          break;
      }

      key.disabled = !applies;
      if (pressed === undefined) key.removeAttribute('aria-pressed');
      else key.setAttribute('aria-pressed', `${pressed}`);
    }

    // Only when it changes, so a column scrolled by hand stays put while the
    // same note is edited
    if (noteKey && noteKey !== this.revealedKey) reveal(noteKey);
    this.revealedKey = noteKey;
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

/** A length of a beat or more as said: "1 beat", "2½ beats" */
function beatCount(duration: string): string {
  const { num, den } = parseBeats(duration)!;
  const whole = Math.floor(num / den);
  const half = den === 2 ? '½' : '';
  return `${whole}${half} ${whole === 1 && !half ? 'beat' : 'beats'}`;
}

/** Scrolls a key's column just enough to bring the key into view. */
function reveal(key: HTMLButtonElement): void {
  const column = key.closest<HTMLElement>('.palette-keys')!;
  const keyBox = key.getBoundingClientRect();
  const columnBox = column.getBoundingClientRect();
  if (keyBox.top < columnBox.top) {
    column.scrollTop -= columnBox.top - keyBox.top;
  } else if (keyBox.bottom > columnBox.bottom) {
    column.scrollTop += keyBox.bottom - columnBox.bottom;
  }
}

/** The command a key gives, from the data attributes PalettePanel.astro sets. */
function commandFor(key: HTMLButtonElement): EditorCommand {
  const { step, duration, mark, key: name } = key.dataset;
  if (step) return { type: 'note', step: step as PitchStep | 'rest' };
  if (duration) return { type: 'duration', duration };
  if (mark) return { type: 'mark', mark: mark as MeriKari };
  switch (name) {
    case 'stroke':
      return { type: 'stroke' };
    case 'dot':
      return { type: 'dot' };
    case 'octave-up':
      return { type: 'octave', step: 1 };
    case 'octave-down':
      return { type: 'octave', step: -1 };
    case 'undo':
    case 'redo':
    case 'delete':
      return { type: name };
  }
  throw new Error(`PalettePanel: a key with no command: ${key.outerHTML}`);
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
