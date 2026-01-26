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
import type { ScoreData, ScoreNote } from '../types/ScoreData';

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
 * ScoreParser class
 */
export class ScoreParser {
  /**
   * Parses score data JSON into an array of ShakuNote objects
   *
   * @param scoreData - The score data to parse
   * @returns Array of ShakuNote objects ready for rendering
   */
  static parse(scoreData: ScoreData): ShakuNote[] {
    // Validate score data
    this.validate(scoreData);

    // Convert each note to a ShakuNote object
    return scoreData.notes.map(note => this.parseNote(note));
  }

  /**
   * Parses a single note from score data
   *
   * @param note - Score note data
   * @returns ShakuNote object with modifiers
   */
  private static parseNote(note: ScoreNote): ShakuNote {
    // Handle rests (ma 間 - space/pause in Kinko notation)
    if (note.rest) {
      return new ShakuNote({
        symbol: 'rest', // Symbol doesn't matter for rests
        duration: mapDuration(note.duration),
        isRest: true
      });
    }

    // Ensure pitch exists for non-rest notes
    if (!note.pitch) {
      throw new Error('Note must have pitch when rest is not set');
    }

    // Create the base note
    const shakuNote = new ShakuNote({
      symbol: note.pitch.step,
      duration: mapDuration(note.duration)
    });

    // Add octave marks if needed
    if (note.pitch.octave > 0) {
      const count = note.pitch.octave as 1 | 2;
      const octaveModifier = new OctaveMarksModifier(count, 'above');
      shakuNote.addModifier(octaveModifier);
    }

    // Add meri modifier if needed
    if (note.meri) {
      const meriModifier = new MeriKariModifier('meri');
      shakuNote.addModifier(meriModifier);
    }

    // Add duration dot if needed
    if (note.dotted) {
      const durationDot = new DurationDotModifier('below'); // 'below' for vertical layout
      shakuNote.addModifier(durationDot);
    }

    return shakuNote;
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
          `Note at index ${index} has invalid octave: ${note.pitch.octave}. Must be 0-2.`
        );
      }

      // Validate duration is positive
      if (note.duration <= 0) {
        throw new Error(
          `Note at index ${index} has invalid duration: ${note.duration}. Must be > 0.`
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

      const scoreData = await response.json() as ScoreData;
      return this.parse(scoreData);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load score from URL: ${error.message}`);
      }
      throw error;
    }
  }
}
