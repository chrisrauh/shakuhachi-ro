import { describe, it, expect } from 'vitest';
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

/** A note drawn on the column line at x, 30px wide and 32px tall, its top at y. */
function box(centerX: number, y: number): NoteBox {
  return {
    x: centerX - 15,
    y,
    width: 30,
    height: 32,
    centerX,
    centerY: y + 16,
    cell: { x: centerX - 32, y: y - 5, width: 64, height: 42 },
  };
}

/** Three notes down one column at x 70, 44px apart: tops at 10, 54 and 98. */
const COLUMN = [box(70, 10), box(70, 54), box(70, 98)];
const CURSOR_AT_END: Selection = { type: 'cursor', position: 3 };

describe('selectAt', () => {
  it("highlights a note tapped inside its cell, away from the cell's top and bottom", () => {
    // The second note's cell is 49 to 91, 64px wide around x 70
    expect(selectAt(COLUMN, 40, 60, CURSOR_AT_END)).toEqual({
      type: 'highlight',
      index: 1,
    });
  });

  it('puts the cursor where a tap is between two notes, in the bands along a cell edge', () => {
    // Near the bottom of the second note's cell, and the top of the third's
    expect(selectAt(COLUMN, 70, 89, CURSOR_AT_END)).toEqual({
      type: 'cursor',
      position: 2,
    });
    expect(selectAt(COLUMN, 70, 95, { type: 'highlight', index: 0 })).toEqual({
      type: 'cursor',
      position: 2,
    });
    // Near the top of the first note's cell
    expect(selectAt(COLUMN, 70, 7, CURSOR_AT_END)).toEqual({
      type: 'cursor',
      position: 0,
    });
  });

  it('puts the cursor after the highlighted note when it is tapped again', () => {
    expect(selectAt(COLUMN, 70, 70, { type: 'highlight', index: 1 })).toEqual({
      type: 'cursor',
      position: 2,
    });
  });

  it('puts the cursor before the first note whose centre is below the tap', () => {
    // Far to the side, level with the gap between the first two notes
    expect(selectAt(COLUMN, 0, 48, CURSOR_AT_END)).toEqual({
      type: 'cursor',
      position: 1,
    });
    // Below the column's last note
    expect(selectAt(COLUMN, 70, 400, CURSOR_AT_END)).toEqual(CURSOR_AT_END);
  });

  it('uses the column nearest the tap', () => {
    const twoColumns = [box(70, 10), box(70, 54), box(200, 10), box(200, 54)];
    expect(selectAt(twoColumns, 160, 48, CURSOR_AT_END)).toEqual({
      type: 'cursor',
      position: 3,
    });
  });

  it('puts the cursor at the start of an empty score', () => {
    expect(selectAt([], 70, 40, { type: 'cursor', position: 0 })).toEqual({
      type: 'cursor',
      position: 0,
    });
  });
});

describe('moving and fitting the selection', () => {
  it('moves the cursor and the highlight one step, within the score', () => {
    expect(moveSelection({ type: 'cursor', position: 3 }, 1, 3)).toEqual(
      CURSOR_AT_END,
    );
    expect(moveSelection({ type: 'cursor', position: 3 }, -1, 3)).toEqual({
      type: 'cursor',
      position: 2,
    });
    expect(moveSelection({ type: 'highlight', index: 2 }, 1, 3)).toEqual({
      type: 'highlight',
      index: 2,
    });
  });

  it('keeps the selection inside a shorter score', () => {
    expect(fitSelection({ type: 'highlight', index: 4 }, 2)).toEqual({
      type: 'cursor',
      position: 2,
    });
    expect(fitSelection({ type: 'cursor', position: 5 }, 2)).toEqual({
      type: 'cursor',
      position: 2,
    });
    expect(fitSelection({ type: 'highlight', index: 1 }, 2)).toEqual({
      type: 'highlight',
      index: 1,
    });
  });
});

describe('cursor geometry', () => {
  it("puts the cursor on the bottom edge of the note before it, as wide as the note's cell whatever its marks", () => {
    // A note whose marks make its box wider, with the same cell
    const marked = { ...box(70, 54), x: 40, width: 80 };
    // The first note's cell is 38 to 102, and ends at 5 + 42
    expect(cursorLine([box(70, 10), marked], 1, { x: 0, y: 0 })).toEqual({
      left: 38,
      top: 47,
      width: 64,
    });
    expect(cursorLine([marked], 1, { x: 0, y: 0 }).width).toBe(64);
  });

  it('puts the cursor on the bottom edge of the last note, the top edge of the first, and at the centre when empty', () => {
    expect(cursorLine(COLUMN, 3, { x: 0, y: 0 })).toEqual({
      left: 38,
      top: 135,
      width: 64,
    });
    expect(cursorLine(COLUMN, 0, { x: 0, y: 0 }).top).toBe(5);
    expect(cursorLine([], 0, { x: 70, y: 27 })).toEqual({
      left: 38,
      top: 27,
      width: 64,
    });
  });
});

describe('describeSelection', () => {
  const notes: ScoreNote[] = [
    { pitch: { step: 'ro', octave: 0 }, duration: 2 },
    { rest: true, duration: 2 },
    { pitch: { step: 'go-no-hi', octave: 1 }, duration: 2, meriKari: 'meri' },
  ];

  it('says what the cursor is after, and where', () => {
    expect(describeSelection(notes, { type: 'cursor', position: 3 })).toEqual({
      mode: 'Inserting',
      detail: 'after ヒ五 go no hi meri, kan · 3 of 3',
    });
    expect(
      describeSelection(notes, { type: 'cursor', position: 2 }).detail,
    ).toBe('after rest · 2 of 3');
    expect(
      describeSelection(notes, { type: 'cursor', position: 0 }).detail,
    ).toBe('at the start · of 3');
    expect(describeSelection([], { type: 'cursor', position: 0 }).detail).toBe(
      'empty score',
    );
  });

  it('says which note is highlighted', () => {
    expect(describeSelection(notes, { type: 'highlight', index: 0 })).toEqual({
      mode: 'Changing',
      detail: 'ロ ro, otsu · 1 of 3',
    });
  });
});
