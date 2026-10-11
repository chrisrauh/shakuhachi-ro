/**
 * ScoreParser - Parses JSON score data into ShakuNote objects
 *
 * Converts the minimal JSON score format into renderable ShakuNote objects
 * with appropriate modifiers (octave dots, meri marks, etc.).
 *
 * Following KISS principle - simple, focused parser without over-engineering.
 */

import { ShakuNote } from '../notes/ShakuNote';
import {
  OctaveMarksModifier,
  type OctaveRegister,
} from '../modifiers/OctaveMarksModifier';
import { MeriKariModifier } from '../modifiers/MeriKariModifier';
import {
  DurationMarksModifier,
  durationSlots,
} from '../modifiers/DurationMarksModifier';
import {
  MERI_KARI,
  PITCH_STEPS,
  type ScoreData,
  type ScoreNote,
} from '../types/ScoreData';
import { hasHalf, isSupported, parseBeats } from '../types/Duration';
import { getNoteMidi } from '../constants/kinko-symbols';
import { PARSER_STRINGS } from '../constants/parser-strings';

/** Register for each `pitch.octave` value validate() accepts: 0, 1, 2 */
export const OCTAVE_REGISTERS: readonly OctaveRegister[] = [
  'otsu',
  'kan',
  'daikan',
];

/**
 * Which octave (0, 1 or 2) of a note is closest to a reference pitch: the
 * octave a reader assumes when a note has no octave mark. The editor inserts
 * notes in this octave, so most melodies need no octave changes.
 *
 * @param romaji - Note to find the closest octave for
 * @param referenceMidi - MIDI pitch to measure the distance from
 */
export function closestOctave(romaji: string, referenceMidi: number): number {
  let closest = 0;
  let smallestDistance = Infinity;

  for (let octave = 0; octave <= 2; octave++) {
    const distance = Math.abs(getNoteMidi(romaji, octave) - referenceMidi);
    if (distance < smallestDistance) {
      smallestDistance = distance;
      closest = octave;
    }
  }

  return closest;
}

/**
 * The strokes, dot and lines that show a note's length, or none for a note of
 * one beat, which is the note alone. The lines run on into the next note's
 * when it starts with lines too.
 *
 * Expects validated notes.
 */
function durationMarks(
  notes: ScoreNote[],
  i: number,
): DurationMarksModifier | null {
  const slotsOf = (note: ScoreNote) =>
    durationSlots(parseBeats(note.duration)!);
  const slots = slotsOf(notes[i]);
  if (!DurationMarksModifier.marksAnything(slots)) return null;
  const next = notes[i + 1];
  return new DurationMarksModifier(
    slots,
    next !== undefined && slotsOf(next)[0].lines > 0,
  );
}

/**
 * ScoreParser class
 */
export class ScoreParser {
  /**
   * Parses score data JSON into an array of ShakuNote objects
   *
   * Implements the closest-note principle for contextual octave marking:
   * - First note defaults to otsu (mark if different)
   * - Each subsequent note is assumed to be the closest octave to previous note
   * - Octave marks are only added when violating this assumption
   * - Rests carry octave context through (don't reset)
   *
   * @param scoreData - The score data to parse
   * @param noteColor - Optional color for notes (defaults to '#000')
   * @returns Array of ShakuNote objects ready for rendering
   */
  static parse(scoreData: ScoreData, noteColor: string = '#000'): ShakuNote[] {
    this.validate(scoreData);

    const shakuNotes: ShakuNote[] = [];
    let previousNoteMidi: number | null = null; // Track previous pitch for closest-note calculation

    // Process each note sequentially to maintain context
    for (let i = 0; i < scoreData.notes.length; i++) {
      const note = scoreData.notes[i];

      // Handle rests - they maintain context but don't change previousNoteMidi
      if (note.rest) {
        const restNote = new ShakuNote({
          symbol: 'rest',
          isRest: true,
          color: noteColor,
        });

        // Rests show their length as notes do
        const marks = durationMarks(scoreData.notes, i);
        if (marks) restNote.addModifier(marks);

        shakuNotes.push(restNote);
        // Don't update previousNoteMidi - rests carry context through
        continue;
      }

      // Ensure pitch exists for non-rest notes
      if (!note.pitch) {
        throw new Error(
          PARSER_STRINGS.ERRORS.ScoreParser.noteIndexPitchWhenNotRest(i),
        );
      }

      // Calculate which octave would be "expected" based on closest-note principle
      const needsOctaveMark = this.needsOctaveMark(
        note.pitch.step,
        note.pitch.octave,
        previousNoteMidi,
        i === 0 || previousNoteMidi === null,
      );

      // Create the base note
      const shakuNote = new ShakuNote({
        symbol: note.pitch.step,
        color: noteColor,
      });

      // Add octave mark only if needed (violates closest-note rule)
      if (needsOctaveMark) {
        const octaveModifier = new OctaveMarksModifier(
          OCTAVE_REGISTERS[note.pitch.octave],
        );
        shakuNote.addModifier(octaveModifier);
      }

      if (note.meriKari) {
        shakuNote.addModifier(new MeriKariModifier(note.meriKari));
      }

      const marks = durationMarks(scoreData.notes, i);
      if (marks) shakuNote.addModifier(marks);

      shakuNotes.push(shakuNote);

      // Update previous note MIDI for next iteration
      previousNoteMidi = getNoteMidi(note.pitch.step, note.pitch.octave);
    }

    return shakuNotes;
  }

  /**
   * Determines if a note needs an octave mark based on the closest-note principle
   *
   * @param romaji - Current note's romaji name
   * @param actualOctave - Actual octave of current note (0, 1, or 2)
   * @param previousNoteMidi - MIDI pitch of previous note (null if first/after reset)
   * @param isFirst - True if this is the first note or after a context reset
   * @returns True if octave mark is needed
   */
  private static needsOctaveMark(
    romaji: string,
    actualOctave: number,
    previousNoteMidi: number | null,
    isFirst: boolean,
  ): boolean {
    // First note: default is otsu (0), mark if different
    if (isFirst || previousNoteMidi === null) {
      return actualOctave !== 0;
    }

    // Mark needed if actual octave differs from the closest one
    return actualOctave !== closestOctave(romaji, previousNoteMidi);
  }

  /**
   * Validates score data structure. An empty notes array is valid: new
   * scores start that way, and it renders as an empty score.
   *
   * Takes `unknown` because it also checks JSON the user typed in the editor.
   *
   * @param scoreData - The score data to validate
   * @throws Error if validation fails
   */
  static validate(scoreData: unknown): asserts scoreData is ScoreData {
    const S = PARSER_STRINGS.ERRORS.ScoreParser;

    if (!scoreData) {
      throw new Error(S.scoreDataRequired);
    }

    const { notes } = scoreData as ScoreData;
    if (!Array.isArray(notes)) {
      throw new Error(S.notesArrayRequired);
    }

    // Validate each note
    notes.forEach((note, index) => {
      // Rest notes don't need pitch
      if (note.rest) {
        if (!note.duration) {
          throw new Error(S.restIndexDuration(index));
        }
        this.validateDuration(note, index);
        return;
      }

      // Regular notes need pitch
      if (!note.pitch) {
        throw new Error(S.noteIndexPitchRequired(index));
      }

      if (!note.pitch.step) {
        throw new Error(S.noteIndexPitchStep(index));
      }

      if (!(PITCH_STEPS as readonly string[]).includes(note.pitch.step)) {
        throw new Error(S.noteIndexStepInvalid(index, note.pitch.step));
      }

      if (note.pitch.octave === undefined || note.pitch.octave === null) {
        throw new Error(S.noteIndexPitchOctave(index));
      }

      if (note.duration === undefined || note.duration === null) {
        throw new Error(S.noteIndexDuration(index));
      }

      // Validate octave range
      if (note.pitch.octave < 0 || note.pitch.octave > 2) {
        throw new Error(S.noteIndexOctaveInvalid(index, note.pitch.octave));
      }

      this.validateDuration(note, index);

      if (
        note.meriKari !== undefined &&
        !(MERI_KARI as readonly string[]).includes(note.meriKari)
      ) {
        throw new Error(S.noteIndexMeriKariInvalid(index, note.meriKari));
      }
    });
  }

  /**
   * Checks a note's duration and dot: a supported length in beats, dotted
   * only if it has a half. A number is not a duration, though it once was.
   */
  private static validateDuration(note: ScoreNote, index: number): void {
    const S = PARSER_STRINGS.ERRORS.ScoreParser;
    const { duration } = note;

    const beats = typeof duration === 'string' ? parseBeats(duration) : null;
    if (!beats) {
      throw new Error(S.noteIndexDurationInvalid(index, duration));
    }
    if (!isSupported(beats)) {
      throw new Error(S.noteIndexDurationUnsupported(index, duration));
    }
    if (note.dotted && !hasHalf(beats)) {
      throw new Error(S.noteIndexDottedWithoutHalf(index, duration));
    }
  }

  /**
   * Loads and parses a score from JSON string
   *
   * @param jsonString - JSON string containing score data
   * @returns Array of ShakuNote objects
   * @throws Error if JSON is invalid
   */
  static parseJSON(jsonString: string): ShakuNote[] {
    try {
      const scoreData = JSON.parse(jsonString) as ScoreData;
      return this.parse(scoreData);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(
          PARSER_STRINGS.ERRORS.ScoreParser.invalidJSON(error.message),
          { cause: error },
        );
      }
      throw error;
    }
  }

  /**
   * Loads and parses a score from a URL
   *
   * @param url - URL to fetch score JSON from
   * @returns Promise resolving to array of ShakuNote objects
   */
  static async loadFromURL(url: string): Promise<ShakuNote[]> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          PARSER_STRINGS.ERRORS.ScoreParser.loadFailed(response.statusText),
        );
      }

      const scoreData = (await response.json()) as ScoreData;
      return this.parse(scoreData);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          PARSER_STRINGS.ERRORS.ScoreParser.loadFailedFromURL(error.message),
          { cause: error },
        );
      }
      throw error;
    }
  }
}
