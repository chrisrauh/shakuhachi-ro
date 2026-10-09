import type { NoteBox } from '../../web-component/renderer/ScoreRenderer';
import type { ScoreNote } from '../../web-component/types/ScoreData';
import { getSymbolByRomaji } from '../../web-component/constants/kinko-symbols';
import { OCTAVE_REGISTERS } from '../../web-component/parser/ScoreParser';
import { stepName } from './palette';

/**
 * What the palettes act on. A cursor is a position between notes, from before
 * the first (0) to after the last (notes.length), where notes are inserted. A
 * highlight is one note (0 … notes.length − 1), which is changed.
 */
export type Selection =
  | { type: 'cursor'; position: number }
  | { type: 'highlight'; index: number };

/**
 * The bands at the top and bottom of a note's cell where a tap is between
 * notes, not on one, as fractions of the cell's height. The cursor goes on
 * the cell's edges, so they're where it's expected.
 */
const BETWEEN_NOTES_RATIO = 1 / 8;

/**
 * The cursor's width in an empty score, where there's no note cell to take it
 * from: the width of a cell at the renderer's defaults.
 */
const EMPTY_CURSOR_WIDTH = 64;

/**
 * The selection a tap at (x, y) makes, in the score element's pixels. A tap on
 * a note's cell, away from its top and bottom edges, highlights the note, and
 * on the highlighted note puts the cursor after it. Anywhere else, including
 * the bands along a cell's edges, the cursor goes in the nearest column,
 * before the first note whose centre is below the tap, or after the column's
 * last note.
 */
export function selectAt(
  boxes: NoteBox[],
  x: number,
  y: number,
  current: Selection,
): Selection {
  const hit = boxes.findIndex(({ cell }) => {
    const band = cell.height * BETWEEN_NOTES_RATIO;
    return (
      x >= cell.x &&
      x <= cell.x + cell.width &&
      y >= cell.y + band &&
      y <= cell.y + cell.height - band
    );
  });
  if (hit >= 0) {
    return current.type === 'highlight' && current.index === hit
      ? { type: 'cursor', position: hit + 1 }
      : { type: 'highlight', index: hit };
  }
  if (boxes.length === 0) return { type: 'cursor', position: 0 };

  const columnX = boxes.reduce(
    (nearest, box) =>
      Math.abs(box.centerX - x) < Math.abs(nearest - x) ? box.centerX : nearest,
    boxes[0].centerX,
  );
  const column = boxes.flatMap((box, i) =>
    sameColumn(box, columnX) ? [i] : [],
  );
  const below = column.find((i) => boxes[i].y + boxes[i].height / 2 > y);
  return { type: 'cursor', position: below ?? column[column.length - 1] + 1 };
}

/** Up (−1) and Down (+1): the cursor by one position, the highlight by one note. */
export function moveSelection(
  selection: Selection,
  step: -1 | 1,
  noteCount: number,
): Selection {
  return selection.type === 'highlight'
    ? {
        type: 'highlight',
        index: clamp(selection.index + step, 0, noteCount - 1),
      }
    : {
        type: 'cursor',
        position: clamp(selection.position + step, 0, noteCount),
      };
}

/**
 * Keeps a selection inside a score that has changed length. A highlight on a
 * note that is gone becomes the cursor at the end.
 */
export function fitSelection(
  selection: Selection,
  noteCount: number,
): Selection {
  if (selection.type === 'highlight' && selection.index < noteCount) {
    return selection;
  }
  const position = selection.type === 'cursor' ? selection.position : Infinity;
  return { type: 'cursor', position: Math.min(position, noteCount) };
}

/**
 * Where the cursor line is drawn: its left end, the y of its centre and its
 * width. It's as wide as a note's highlight, the same for every note. After a
 * note it's on the bottom edge of that note's highlight, so it lands where the
 * highlight was when a note is deselected; at the start, on the top edge of the
 * first note's. With no notes it's at `empty`, the centre of the empty score.
 */
export function cursorLine(
  boxes: NoteBox[],
  position: number,
  empty: { x: number; y: number },
): { left: number; top: number; width: number } {
  const before = boxes[position - 1];
  const after = boxes[position];
  const note = before ?? after;
  if (!note) {
    return {
      left: empty.x - EMPTY_CURSOR_WIDTH / 2,
      top: empty.y,
      width: EMPTY_CURSOR_WIDTH,
    };
  }
  // As wide as the note's cell, so it's the line of the highlight's edge
  return {
    left: note.cell.x,
    top: before ? before.cell.y + before.cell.height : after.cell.y,
    width: note.cell.width,
  };
}

/**
 * The status line: the mode, and where the selection is, as in "after ツ tsu
 * meri, kan · 4 of 12".
 */
export function describeSelection(
  notes: ScoreNote[],
  selection: Selection,
): { mode: string; detail: string } {
  const total = notes.length;
  if (selection.type === 'highlight') {
    const { index } = selection;
    return {
      mode: 'Changing',
      detail: `${describeNote(notes[index])} · ${index + 1} of ${total}`,
    };
  }
  const { position } = selection;
  let detail = 'empty score';
  if (position > 0) {
    detail = `after ${describeNote(notes[position - 1])} · ${position} of ${total}`;
  } else if (total > 0) {
    detail = `at the start · of ${total}`;
  }
  return { mode: 'Inserting', detail };
}

/** A note as the status line says it: "ヒ五 go no hi meri, kan", or "rest". */
function describeNote(note: ScoreNote): string {
  if (note.rest || !note.pitch) return 'rest';
  // The score was validated before it rendered, so every step has a symbol
  const symbol = getSymbolByRomaji(note.pitch.step)!;
  const glyph = `${symbol.kana}${symbol.numerals ?? ''}`;
  const mark = note.meriKari ? ` ${note.meriKari}` : '';
  return `${glyph} ${stepName(note.pitch.step)}${mark}, ${OCTAVE_REGISTERS[note.pitch.octave]}`;
}

/** Whether a note is drawn on the column line at x. */
function sameColumn(box: NoteBox, x: number): boolean {
  return Math.abs(box.centerX - x) < 1;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
