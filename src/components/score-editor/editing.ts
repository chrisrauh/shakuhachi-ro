import type {
  Accidental,
  Character,
  ScoreNote,
} from '../../web-component/types/ScoreData';
import { getNoteMidi } from '../../web-component/constants/kinko-symbols';
import { closestOctave } from '../../web-component/parser/ScoreParser';
import {
  dottedLength,
  formatBeats,
  hasHalf,
  isSupported,
  parseBeats,
  writtenLength,
} from '../../web-component/types/Duration';
import type { Selection } from './selection';

/**
 * The notes being edited and the selection, together: an edit changes both,
 * and undo restores both.
 */
export interface EditorState {
  notes: ScoreNote[];
  selection: Selection;
}

/** What a palette key or shortcut asks for: an edit, or undo or redo. */
export type EditAction =
  | { type: 'note'; step: Character | 'rest' }
  | { type: 'duration'; duration: string }
  | { type: 'stroke' }
  | { type: 'dot' }
  | { type: 'mark'; mark: Accidental }
  | { type: 'octave'; step: -1 | 1 }
  | { type: 'delete' };
export type EditorCommand = EditAction | { type: 'undo' } | { type: 'redo' };

/** The duration of the first note in an empty score: one beat. */
const FIRST_NOTE_DURATION = '1';

/** Daikan, the highest octave the score data has. */
const HIGHEST_OCTAVE = 2;

/*
 * Each edit returns the new state, or null where it doesn't apply, which is
 * where its key is disabled. None changes the state it's given.
 */

export function applyEdit(
  state: EditorState,
  action: EditAction,
): EditorState | null {
  switch (action.type) {
    case 'note':
      return chooseNote(state, action.step);
    case 'duration':
      return setDuration(state, action.duration);
    case 'stroke':
      return addStroke(state);
    case 'dot':
      return toggleDot(state);
    case 'mark':
      return setMark(state, action.mark);
    case 'octave':
      return shiftOctave(state, action.step);
    case 'delete':
      return deleteNote(state);
  }
}

/**
 * The note lengths, the dot, marks and octave act on: the highlighted note, or
 * the note before the cursor. -1 with the cursor at the start.
 */
export function targetIndex(selection: Selection): number {
  return selection.type === 'highlight'
    ? selection.index
    : selection.position - 1;
}

/**
 * A note key: inserts the note at the cursor, which moves after it, or changes
 * the highlighted note to it. An inserted note takes the length the note
 * before it is written with, without its dot, and the octave closest to the
 * last pitched note. A changed note keeps its length, dot, octave and mark; a
 * rest has no mark to keep. Changing a note to what it already is changes
 * nothing.
 */
export function chooseNote(
  { notes, selection }: EditorState,
  step: Character | 'rest',
): EditorState | null {
  if (selection.type === 'cursor') {
    const { position } = selection;
    const previous = notes[position - 1];
    const duration = previous ? writtenDuration(previous) : FIRST_NOTE_DURATION;
    const note: ScoreNote =
      step === 'rest'
        ? { rest: true, duration }
        : {
            character: step,
            register: octaveAfter(notes, position, step),
            duration,
          };
    return {
      notes: notes.toSpliced(position, 0, note),
      selection: { type: 'cursor', position: position + 1 },
    };
  }

  const { index } = selection;
  const old = notes[index];
  if (step === (isRest(old) ? 'rest' : old.character)) return null;
  let note: ScoreNote;
  if (step === 'rest') {
    note = { rest: true, duration: old.duration };
  } else {
    const octave = isRest(old)
      ? octaveAfter(notes, index, step)
      : old.register!;
    note = {
      character: step,
      register: octave,
      ...(old.accidental && { accidental: old.accidental }),
      duration: old.duration,
    };
  }
  return { notes: notes.with(index, note), selection };
}

/**
 * The length a note is written with before any dot, as a Length key's value:
 * "1" for 3/2.
 */
export function writtenDuration(note: ScoreNote): string {
  return formatBeats(writtenLength(parseBeats(note.duration)!));
}

/** Whether the note is drawn with a dot: its length has a half. */
export function isDotted(note: ScoreNote): boolean {
  return hasHalf(parseBeats(note.duration)!);
}

/**
 * A Length key: sets the length written before any dot, so a dotted note stays
 * dotted. The dot goes where the dotted length isn't one notation can show,
 * such as a dotted quarter beat.
 */
export function setDuration(
  state: EditorState,
  duration: string,
): EditorState | null {
  const note = target(state);
  if (!note) return null;
  const dottedBeats = dottedLength(parseBeats(duration)!);
  const next =
    isDotted(note) && hasHalf(dottedBeats)
      ? formatBeats(dottedBeats)
      : duration;
  if (next === note.duration) return null;
  return withTarget(state, { ...note, duration: next });
}

/**
 * The Stroke key: adds a beat after the note's whole beats, keeping its dot,
 * so 1 becomes 2 and a dotted 3/2 a dotted 5/2. A note under a beat has no
 * whole beats to add to: half a beat and one more is 3/2, a note and a dot.
 */
export function addStroke(state: EditorState): EditorState | null {
  const note = target(state);
  if (!note) return null;
  const beats = parseBeats(note.duration)!;
  const written = writtenLength(beats);
  if (written.num < written.den) return null;
  return withTarget(state, {
    ...note,
    duration: formatBeats({ num: beats.num + beats.den, den: beats.den }),
  });
}

/**
 * The Dot key: adds a dot after the note, half a beat after one beat and a
 * quarter after half a beat, or takes the dot away with its length. A quarter
 * beat can't be dotted.
 */
export function toggleDot(state: EditorState): EditorState | null {
  const note = target(state);
  if (!note) return null;
  const beats = parseBeats(note.duration)!;
  if (hasHalf(beats)) {
    return withTarget(state, {
      ...note,
      duration: formatBeats(writtenLength(beats)),
    });
  }
  const withDot = dottedLength(beats);
  if (!isSupported(withDot) || !hasHalf(withDot)) return null;
  return withTarget(state, { ...note, duration: formatBeats(withDot) });
}

/** Marks exclude each other: choosing one replaces another, or removes itself. */
export function setMark(
  state: EditorState,
  mark: Accidental,
): EditorState | null {
  const note = target(state);
  if (!note || isRest(note)) return null;
  const { accidental, ...unmarked } = note;
  return withTarget(
    state,
    accidental === mark ? unmarked : { ...note, accidental: mark },
  );
}

export function shiftOctave(
  state: EditorState,
  step: -1 | 1,
): EditorState | null {
  const note = target(state);
  if (!note || isRest(note)) return null;
  const register = note.register! + step;
  if (register < 0 || register > HIGHEST_OCTAVE) return null;
  return withTarget(state, { ...note, register });
}

/**
 * Removes the highlighted note, leaving a cursor where it was, or the note
 * before the cursor, which moves back, as Backspace does.
 */
export function deleteNote({
  notes,
  selection,
}: EditorState): EditorState | null {
  const index = targetIndex(selection);
  if (index < 0) return null;
  return {
    notes: notes.toSpliced(index, 1),
    selection: { type: 'cursor', position: index },
  };
}

function target({ notes, selection }: EditorState): ScoreNote | undefined {
  return notes[targetIndex(selection)];
}

function withTarget(state: EditorState, note: ScoreNote): EditorState {
  return {
    notes: state.notes.with(targetIndex(state.selection), note),
    selection: state.selection,
  };
}

function isRest(note: ScoreNote): boolean {
  return note.rest === true || !note.character;
}

/**
 * The octave a note takes after the notes before `index`: the one closest to
 * the last pitched note, or the lowest with none. Rests are passed over, as
 * when the score decides where octave marks are needed.
 */
function octaveAfter(
  notes: ScoreNote[],
  index: number,
  step: Character,
): number {
  const previous = notes.slice(0, index).findLast((note) => !isRest(note));
  if (!previous) return 0;
  return closestOctave(
    step,
    getNoteMidi(previous.character!, previous.register!),
  );
}
