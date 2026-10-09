import { describe, it, expect } from 'vitest';
import type { ScoreNote } from '../../web-component/types/ScoreData';
import {
  chooseNote,
  deleteNote,
  setDuration,
  setMark,
  shiftOctave,
  toggleDot,
  type EditorState,
} from './editing';

const ro: ScoreNote = { pitch: { step: 'ro', octave: 0 }, duration: 2 };
// Ri is C5: the ro closest to it is kan ro (D5), not otsu ro (D4)
const ri: ScoreNote = { pitch: { step: 'ri', octave: 0 }, duration: 1 };
const rest: ScoreNote = { rest: true, duration: 4 };

const cursorAt = (notes: ScoreNote[], position: number): EditorState => ({
  notes,
  selection: { type: 'cursor', position },
});
const highlight = (notes: ScoreNote[], index: number): EditorState => ({
  notes,
  selection: { type: 'highlight', index },
});

describe('chooseNote at a cursor', () => {
  it('inserts with the previous note’s duration, and moves the cursor after it', () => {
    const before = cursorAt([{ ...ro, dotted: true, meriKari: 'meri' }], 1);

    expect(chooseNote(before, 'tsu')).toEqual({
      notes: [
        before.notes[0],
        { pitch: { step: 'tsu', octave: 0 }, duration: 2 },
      ],
      selection: { type: 'cursor', position: 2 },
    });
  });

  it('starts an empty score with a one-beat note in the lowest octave', () => {
    expect(chooseNote(cursorAt([], 0), 're')!.notes).toEqual([
      { pitch: { step: 're', octave: 0 }, duration: 2 },
    ]);
  });

  it('picks the octave closest to the previous pitched note, past rests', () => {
    const { notes } = chooseNote(cursorAt([ri, rest], 2), 'ro')!;
    expect(notes[2]).toEqual({ pitch: { step: 'ro', octave: 1 }, duration: 4 });
  });

  it('inserts a rest with the same duration rule', () => {
    expect(chooseNote(cursorAt([ri], 1), 'rest')!.notes[1]).toEqual({
      rest: true,
      duration: 1,
    });
  });
});

describe('chooseNote on a highlight', () => {
  it('changes the fingering, keeping duration, dot, octave and mark', () => {
    const note: ScoreNote = {
      pitch: { step: 'ri', octave: 1 },
      duration: 1,
      dotted: true,
      meriKari: 'kari',
    };

    expect(chooseNote(highlight([note], 0), 'chi')).toEqual({
      notes: [{ ...note, pitch: { step: 'chi', octave: 1 } }],
      selection: { type: 'highlight', index: 0 },
    });
  });

  it('gives a rest turned into a note the closest octave', () => {
    const { notes } = chooseNote(highlight([ri, rest], 1), 'ro')!;
    expect(notes[1]).toEqual({ pitch: { step: 'ro', octave: 1 }, duration: 4 });
  });

  it('drops the mark when a note becomes a rest', () => {
    const note: ScoreNote = { ...ro, dotted: true, meriKari: 'meri' };
    expect(chooseNote(highlight([note], 0), 'rest')!.notes).toEqual([
      { rest: true, duration: 2, dotted: true },
    ]);
  });

  it('changes nothing when the note already is that note', () => {
    expect(chooseNote(highlight([ro], 0), 'ro')).toBeNull();
    expect(chooseNote(highlight([rest], 0), 'rest')).toBeNull();
  });
});

describe('length, dot, mark and octave', () => {
  it('act on the note before the cursor, and need one', () => {
    expect(setDuration(cursorAt([ro], 1), 1)?.notes).toEqual([
      { ...ro, duration: 1 },
    ]);
    expect(setDuration(cursorAt([ro], 0), 1)).toBeNull();
  });

  it('toggle the dot and the mark off again', () => {
    const dotted = toggleDot(highlight([ro], 0))!;
    expect(dotted.notes[0].dotted).toBe(true);
    expect(toggleDot(dotted)!.notes[0]).toEqual(ro);

    const meri = setMark(highlight([ro], 0), 'meri')!;
    expect(setMark(meri, 'dai-meri')!.notes[0].meriKari).toBe('dai-meri');
    expect(setMark(meri, 'meri')!.notes[0]).toEqual(ro);
  });

  it('change nothing when the note already has that length', () => {
    expect(setDuration(highlight([ro], 0), 2)).toBeNull();
  });

  it('move the octave within otsu to daikan, and not on a rest', () => {
    expect(shiftOctave(highlight([ro], 0), 1)!.notes[0].pitch!.octave).toBe(1);
    expect(shiftOctave(highlight([ro], 0), -1)).toBeNull();
    expect(setMark(highlight([rest], 0), 'meri')).toBeNull();
    expect(shiftOctave(highlight([rest], 0), 1)).toBeNull();
  });
});

describe('deleteNote', () => {
  it('removes the note before the cursor, and moves the cursor back', () => {
    expect(deleteNote(cursorAt([ro, ri], 2))).toEqual({
      notes: [ro],
      selection: { type: 'cursor', position: 1 },
    });
    expect(deleteNote(cursorAt([ro], 0))).toBeNull();
  });

  it('removes the highlighted note, leaving a cursor where it was', () => {
    expect(deleteNote(highlight([ro, ri, rest], 1))).toEqual({
      notes: [ro, rest],
      selection: { type: 'cursor', position: 1 },
    });
  });
});
