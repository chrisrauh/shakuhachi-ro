import { describe, it, expect } from 'vitest';
import type { ScoreNote } from '../../web-component/types/ScoreData';
import type { EditorState } from './editing';
import { EditHistory } from './history';

const ro: ScoreNote = { pitch: { step: 'ro', octave: 0 }, duration: 2 };

/** A state with n notes, the cursor after them. */
const state = (n: number): EditorState => ({
  notes: Array(n).fill(ro),
  selection: { type: 'cursor', position: n },
});

describe('EditHistory', () => {
  it('undoes and redoes, giving back the notes and the selection', () => {
    const history = new EditHistory();
    expect(history.canUndo).toBe(false);

    history.record(state(0));
    expect(history.undo(state(1))).toEqual(state(0));
    expect(history.canUndo).toBe(false);
    expect(history.redo(state(0))).toEqual(state(1));
    expect(history.redo(state(1))).toBeNull();
  });

  it('forgets what could be redone once there is a new edit', () => {
    const history = new EditHistory();
    history.record(state(0));
    history.undo(state(1));

    history.record(state(0));
    expect(history.canRedo).toBe(false);
  });

  it('keeps the last 200 steps', () => {
    const history = new EditHistory();
    for (let n = 0; n < 201; n++) history.record(state(n));

    let undone = 0;
    let current: EditorState | null = state(201);
    while ((current = history.undo(current))) undone++;
    expect(undone).toBe(200);
  });

  it('forgets everything when cleared', () => {
    const history = new EditHistory();
    history.record(state(0));
    history.clear();
    expect(history.canUndo).toBe(false);
  });
});
