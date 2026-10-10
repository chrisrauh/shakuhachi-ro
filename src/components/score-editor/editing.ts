import type {
  MeriKari,
  PitchStep,
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
  | { type: 'note'; step: PitchStep | 'rest' }
  | { type: 'duration'; duration: string }
  | { type: 'dot' }
  | { type: 'mark'; mark: MeriKari }
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
  step: PitchStep | 'rest',
): EditorState | null {
  if (selection.type === 'cursor') {
    const { position } = selection;
    const previous = notes[position - 1];
    const duration = previous ? writtenDuration(previous) : FIRST_NOTE_DURATION;
    const note: ScoreNote =
      step === 'rest'
        ? { rest: true, duration }
        : {
            pitch: { step, octave: octaveAfter(notes, position, step) },
            duration,
          };
    return {
      notes: notes.toSpliced(position, 0, note),
      selection: { type: 'cursor', position: position + 1 },
    };
  }

  const { index } = selection;
  const old = notes[index];
  if (step === (isRest(old) ? 'rest' : old.pitch!.step)) return null;
  let note: ScoreNote;
  if (step === 'rest') {
    note = { rest: true, duration: old.duration };
  } else {
    const octave = isRest(old)
      ? octaveAfter(notes, index, step)
      : old.pitch!.octave;
    note = { pitch: { step, octave }, duration: old.duration };
    if (old.meriKari) note.meriKari = old.meriKari;
  }
  if (old.dotted) note.dotted = true;
  return { notes: notes.with(index, note), selection };
}

/**
 * The length a note is written with before any dot, as a Length key's value:
 * "1" for a dotted 3/2.
 */
export function writtenDuration(note: ScoreNote): string {
  return formatBeats(writtenLength(parseBeats(note.duration)!, note.dotted));
}

/**
 * A Length key: sets the length written before any dot, so a dotted note stays
 * dotted. The dot goes where the dotted length isn't one notation can show,
 * such as a dotted 2 beats.
 */
export function setDuration(
  state: EditorState,
  duration: string,
): EditorState | null {
  const note = target(state);
  if (!note) return null;
  const { dotted, ...undotted } = note;
  const dottedBeats = dottedLength(parseBeats(duration)!);
  const next: ScoreNote =
    dotted && hasHalf(dottedBeats)
      ? { ...note, duration: formatBeats(dottedBeats) }
      : { ...undotted, duration };
  if (next.duration === note.duration && !!next.dotted === !!dotted) {
    return null;
  }
  return withTarget(state, next);
}

/**
 * The Dot key: adds a dot after the note, half a beat after one beat and a
 * quarter after half a beat, or takes the dot away with its length. A length
 * that already has a half (written with a stroke) keeps its length and is
 * written with a dot instead. Only one beat and half a beat can be dotted
 * for now.
 */
export function toggleDot(state: EditorState): EditorState | null {
  const note = target(state);
  if (!note) return null;
  const { dotted, ...undotted } = note;
  const beats = parseBeats(note.duration)!;

  if (dotted) {
    return withTarget(state, {
      ...undotted,
      duration: formatBeats(writtenLength(beats, true)),
    });
  }
  if (hasHalf(beats)) return withTarget(state, { ...note, dotted: true });

  const withDot = dottedLength(beats);
  if (!isSupported(withDot) || !hasHalf(withDot)) return null;
  return withTarget(state, {
    ...note,
    duration: formatBeats(withDot),
    dotted: true,
  });
}

/** Marks exclude each other: choosing one replaces another, or removes itself. */
export function setMark(
  state: EditorState,
  mark: MeriKari,
): EditorState | null {
  const note = target(state);
  if (!note || isRest(note)) return null;
  const { meriKari, ...unmarked } = note;
  return withTarget(
    state,
    meriKari === mark ? unmarked : { ...note, meriKari: mark },
  );
}

export function shiftOctave(
  state: EditorState,
  step: -1 | 1,
): EditorState | null {
  const note = target(state);
  if (!note || isRest(note)) return null;
  const octave = note.pitch!.octave + step;
  if (octave < 0 || octave > HIGHEST_OCTAVE) return null;
  return withTarget(state, { ...note, pitch: { ...note.pitch!, octave } });
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
  return note.rest === true || !note.pitch;
}

/**
 * The octave a note takes after the notes before `index`: the one closest to
 * the last pitched note, or the lowest with none. Rests are passed over, as
 * when the score decides where octave marks are needed.
 */
function octaveAfter(
  notes: ScoreNote[],
  index: number,
  step: PitchStep,
): number {
  const previous = notes.slice(0, index).findLast((note) => !isRest(note));
  if (!previous) return 0;
  const { pitch } = previous;
  return closestOctave(step, getNoteMidi(pitch!.step, pitch!.octave));
}
