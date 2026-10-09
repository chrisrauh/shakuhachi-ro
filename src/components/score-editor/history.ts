import type { EditorState } from './editing';

/** How many edits can be undone. */
const MAX_STEPS = 200;

/**
 * The edits that can be undone and redone, until the page is left. Each step
 * is the notes and the selection as they were, so undoing puts the cursor or
 * highlight back too. Moving the selection is not a step.
 */
export class EditHistory {
  private undoStack: EditorState[] = [];
  private redoStack: EditorState[] = [];

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /** Records the state before an edit. A new edit can't be followed by a redo. */
  record(before: EditorState): void {
    this.undoStack.push(before);
    if (this.undoStack.length > MAX_STEPS) this.undoStack.shift();
    this.redoStack = [];
  }

  /** The state to go back to from `current`, or null with nothing to undo. */
  undo(current: EditorState): EditorState | null {
    const previous = this.undoStack.pop();
    if (!previous) return null;
    this.redoStack.push(current);
    return previous;
  }

  /** The state to go forward to from `current`, or null with nothing to redo. */
  redo(current: EditorState): EditorState | null {
    const next = this.redoStack.pop();
    if (!next) return null;
    this.undoStack.push(current);
    return next;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
