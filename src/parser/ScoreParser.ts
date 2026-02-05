/**
 * ScoreParser - Parses JSON score data into ShakuNote objects
 *
 * Converts the minimal JSON score format into renderable ShakuNote objects
 * with appropriate modifiers (octave dots, meri marks, etc.).
 *
 * Following KISS principle - simple, focused parser without over-engineering.
 */

import { ShakuNote, type NoteDuration } from '../notes/ShakuNote';
import { OctaveMarksModifier } from '../modifiers/OctaveMarksModifier';
import { MeriKariModifier } from '../modifiers/MeriKariModifier';
import { DurationDotModifier } from '../modifiers/DurationDotModifier';
import { DurationLineModifier } from '../modifiers/DurationLineModifier';
import type { ScoreData } from '../types/ScoreData';
import { getNoteMidi } from '../constants/kinko-symbols';

/**
 * Maps numeric duration to NoteDuration
 *
 * Simple mapping for now:
 * - 1 = quarter note (q)
 * - 2 = half note (h)
 * - 4 = whole note (w)
 */
function mapDuration(duration: number): NoteDuration {
  switch (duration) {
    case 1:
      return 'q';
    case 2:
      return 'h';
    case 4:
      return 'w';
    default:
      return 'q'; // Default to quarter note
  }
}

/**
 * Maps numeric duration to number of horizontal duration lines
 *
 * In shakuhachi notation:
 * - Whole note (4): 0 lines
 * - Half note (2): 0 lines
 * - Quarter note (1): 1 line
 * - Eighth note (0.5): 2 lines
 */
function getDurationLineCount(duration: number): number {
  if (duration >= 2) return 0; // Half note or longer (no lines)
  if (duration >= 1) return 1; // Quarter note (1 line)
  if (duration >= 0.5) return 2; // Eighth note (2 lines)
  return 3; // Sixteenth or shorter (very rare)
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
   * @returns Array of ShakuNote objects ready for rendering
   */
  static parse(scoreData: ScoreData): ShakuNote[] {
    // Validate score data
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
          duration: mapDuration(note.duration),
          isRest: true,
        });

        // Add duration lines to rests as well
        const lineCount = getDurationLineCount(note.duration);
        if (lineCount > 0) {
          // Check if this is the last note in a continuous duration line sequence
          const isLastInSequence =
            i === scoreData.notes.length - 1 ||
            getDurationLineCount(scoreData.notes[i + 1].duration) === 0;
          const durationLines = new DurationLineModifier(
            lineCount,
            isLastInSequence,
            'right',
          );
          restNote.addModifier(durationLines);
        }

        shakuNotes.push(restNote);
        // Don't update previousNoteMidi - rests carry context through
        continue;
      }

      // Ensure pitch exists for non-rest notes
      if (!note.pitch) {
        throw new Error(
          `Note at index ${i} must have pitch when rest is not set`,
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
        duration: mapDuration(note.duration),
      });

      // Add octave mark only if needed (violates closest-note rule)
      if (needsOctaveMark) {
        const octaveType = note.pitch.octave === 0 ? 'otsu' : 'kan';
        const octaveModifier = new OctaveMarksModifier(octaveType);
        shakuNote.addModifier(octaveModifier);
      }

      // Add meri modifier if needed
      if (note.meri) {
        const meriModifier = new MeriKariModifier('meri');
        shakuNote.addModifier(meriModifier);
      }

      // Add chu-meri modifier if needed
      if (note.chu_meri) {
        const chuMeriModifier = new MeriKariModifier('chu-meri');
        shakuNote.addModifier(chuMeriModifier);
      }

      // Add dai-meri modifier if needed
      if (note.dai_meri) {
        const daiMeriModifier = new MeriKariModifier('dai-meri');
        shakuNote.addModifier(daiMeriModifier);
      }

      // Add duration dot if needed
      if (note.dotted) {
        const durationDot = new DurationDotModifier('below');
        shakuNote.addModifier(durationDot);
      }

      // Add duration lines based on note duration
      const lineCount = getDurationLineCount(note.duration);
      if (lineCount > 0) {
        // Check if this is the last note in a continuous duration line sequence
        // by checking if the next note also has a duration line
        const isLastInSequence =
          i === scoreData.notes.length - 1 ||
          getDurationLineCount(scoreData.notes[i + 1].duration) === 0;
        const durationLines = new DurationLineModifier(
          lineCount,
          isLastInSequence,
          'right',
        );
        shakuNote.addModifier(durationLines);
      }

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

    // Find which octave of this note is closest to previous note
    const expectedOctave = this.findClosestOctave(romaji, previousNoteMidi);

    // Mark needed if actual octave differs from expected
    return actualOctave !== expectedOctave;
  }

  /**
   * Finds which octave (0, 1, or 2) of a note is closest to a reference MIDI pitch
   *
   * @param romaji - Note to find closest octave for
   * @param referenceMidi - Reference MIDI pitch to measure distance from
   * @returns Octave number (0, 1, or 2) that is closest
   */
  private static findClosestOctave(
    romaji: string,
    referenceMidi: number,
  ): number {
    let closestOctave = 0;
    let smallestDistance = Infinity;

    // Check all three possible octaves
    for (let octave = 0; octave <= 2; octave++) {
      const midi = getNoteMidi(romaji, octave);
      const distance = Math.abs(midi - referenceMidi);

      if (distance < smallestDistance) {
        smallestDistance = distance;
        closestOctave = octave;
      }
    }

    return closestOctave;
  }

  /**
   * Validates score data structure
   *
   * @param scoreData - The score data to validate
   * @throws Error if validation fails
   */
  private static validate(scoreData: ScoreData): void {
    if (!scoreData) {
      throw new Error('Score data is required');
    }

    if (!scoreData.title) {
      throw new Error('Score title is required');
    }

    if (!scoreData.style) {
      throw new Error('Score style is required');
    }

    if (!Array.isArray(scoreData.notes)) {
      throw new Error('Score notes must be an array');
    }

    if (scoreData.notes.length === 0) {
      throw new Error('Score must contain at least one note');
    }

    // Validate each note
    scoreData.notes.forEach((note, index) => {
      // Rest notes don't need pitch
      if (note.rest) {
        if (!note.duration) {
          throw new Error(`Rest at index ${index} is missing duration`);
        }
        return;
      }

      // Regular notes need pitch
      if (!note.pitch) {
        throw new Error(`Note at index ${index} is missing pitch`);
      }

      if (!note.pitch.step) {
        throw new Error(`Note at index ${index} is missing pitch.step`);
      }

      if (note.pitch.octave === undefined || note.pitch.octave === null) {
        throw new Error(`Note at index ${index} is missing pitch.octave`);
      }

      if (note.duration === undefined || note.duration === null) {
        throw new Error(`Note at index ${index} is missing duration`);
      }

      // Validate octave range
      if (note.pitch.octave < 0 || note.pitch.octave > 2) {
        throw new Error(
          `Note at index ${index} has invalid octave: ${note.pitch.octave}. Must be 0-2.`,
        );
      }

      // Validate duration is positive
      if (note.duration <= 0) {
        throw new Error(
          `Note at index ${index} has invalid duration: ${note.duration}. Must be > 0.`,
        );
      }
    });
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
        throw new Error(`Invalid JSON: ${error.message}`);
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
        throw new Error(`Failed to load score: ${response.statusText}`);
      }

      const scoreData = (await response.json()) as ScoreData;
      return this.parse(scoreData);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load score from URL: ${error.message}`);
      }
      throw error;
    }
  }
}
