/**
 * ABCParser - Converts ABC notation to shakuhachi JSON format
 *
 * Parses ABC notation and maps pitches to shakuhachi notation.
 * For D shakuhachi (1.8 shaku) in Kinko style.
 *
 * ABC Notation Reference:
 * - Header fields: X: (index), T: (title), C: (composer), M: (meter), L: (unit length), K: (key)
 * - Notes: A-G (uppercase = octave 4), a-g (lowercase = octave 5), ' (upper octave), , (lower octave)
 * - Accidentals: ^ (sharp), ^^ (double sharp), _ (flat), __ (double flat), = (natural)
 * - Duration: 2 (double), /2 (half), 3/2 (dotted), default is L: value
 * - Dotted: > (dotted note), < (less common dotted syntax)
 * - Rests: z (with duration modifiers)
 * - Bar lines: | (measure separator, ignored in output)
 */

import type { ScoreData, ScoreNote } from '../types/ScoreData';
import { ABC_TO_KINKO_MAP } from '../constants/abc-pitch-map';

export class ABCParser {
  /**
   * Parses ABC notation and converts to shakuhachi JSON format
   *
   * @param abcContent - The ABC notation content as string
   * @returns ScoreData object ready for rendering
   */
  static parse(abcContent: string): ScoreData {
    if (!abcContent || !abcContent.trim()) {
      throw new Error('ABC notation content is required');
    }

    const lines = abcContent.split('\n');
    let title = 'Untitled';
    let composer: string | undefined;
    let tempo: string | undefined;
    let key: string | undefined;
    let inBody = false;
    const noteLines: string[] = [];

    // Parse header and body
    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('%')) {
        continue;
      }

      // Check for header fields (before K: field)
      if (!inBody) {
        if (trimmed.startsWith('X:')) {
          // Index field (required but we don't use it)
          continue;
        } else if (trimmed.startsWith('T:')) {
          title = trimmed.substring(2).trim() || 'Untitled';
        } else if (trimmed.startsWith('C:')) {
          composer = trimmed.substring(2).trim() || undefined;
        } else if (trimmed.startsWith('M:')) {
          // Meter field (currently not used in ScoreData)
          continue;
        } else if (trimmed.startsWith('L:')) {
          // Unit length field (currently not used - durations are relative)
          continue;
        } else if (trimmed.startsWith('Q:')) {
          tempo = trimmed.substring(2).trim();
        } else if (trimmed.startsWith('K:')) {
          key = trimmed.substring(2).trim();
          inBody = true; // K: field marks end of header
        }
      } else {
        // Body: collect note lines (after K: field)
        noteLines.push(trimmed);
      }
    }

    // Validate required headers
    if (!inBody) {
      throw new Error('ABC notation must include K: (key) field');
    }

    // Parse notes from body
    const notes = this.parseNotes(noteLines.join(' '));

    return {
      title,
      style: 'kinko',
      notes,
      composer,
      tempo,
      key,
    };
  }

  /**
   * Parse note sequence from ABC body
   *
   * @param noteString - ABC note sequence (e.g., "D2 F G3/2 z/2 A>B c")
   * @returns Array of ScoreNote objects
   */
  private static parseNotes(noteString: string): ScoreNote[] {
    const notes: ScoreNote[] = [];

    // Remove bar lines and extra whitespace
    const cleaned = noteString.replace(/\|/g, ' ').replace(/\s+/g, ' ').trim();

    // Tokenize: split into note tokens (pitch + optional duration + optional dotted marker)
    // Regex matches: optional accidental + ANY letter (we'll validate later) + optional octave marks + optional duration + optional dotted
    // Examples: "D", "^D2", "d'", "_a/2", "G>", "X", "Q", "z"
    const tokenRegex = /([_=^]{1,2})?([A-Za-z])([',]*)(\/?\d*\/?\d*)([><]?)/g;
    let match: RegExpExecArray | null;

    // Valid ABC note letters and rest
    const validLetters = new Set([
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g',
      'z',
    ]);

    while ((match = tokenRegex.exec(cleaned)) !== null) {
      const [
        fullMatch,
        accidental,
        pitch,
        octaveMarks,
        durationSuffix,
        dottedMarker,
      ] = match;

      // Skip if empty match or whitespace
      if (!fullMatch.trim()) {
        continue;
      }

      // Validate letter first
      if (!validLetters.has(pitch)) {
        throw new Error(
          `Unknown ABC pitch: "${pitch}". Valid pitches: D, F, G, A, C (uppercase/lowercase) with optional ^, _, =, ', or ,`,
        );
      }

      // Handle rest
      if (pitch === 'z') {
        const duration = this.calculateDuration(durationSuffix);
        notes.push({
          rest: true,
          duration,
        });
        continue;
      }

      // Build ABC pitch notation (with accidental and octave marks)
      const abcPitch = `${accidental || ''}${pitch}${octaveMarks}`;

      // Map to shakuhachi
      const shakuPitch = ABC_TO_KINKO_MAP[abcPitch];
      if (!shakuPitch) {
        throw new Error(
          `Unknown ABC pitch: "${abcPitch}". Valid pitches: D, F, G, A, C (uppercase/lowercase) with optional ^, _, =, ', or ,`,
        );
      }

      // Calculate duration
      const duration = this.calculateDuration(durationSuffix);

      // Check for dotted note (> or < syntax)
      const isDotted = dottedMarker === '>' || dottedMarker === '<';

      // Create note
      const note: ScoreNote = {
        pitch: {
          step: shakuPitch.step,
          octave: shakuPitch.octave,
        },
        duration,
      };

      // Add meri modifiers
      if (shakuPitch.meri) {
        note.meri = true;
      }
      if (shakuPitch.chu_meri) {
        note.chu_meri = true;
      }
      if (shakuPitch.dai_meri) {
        note.dai_meri = true;
      }

      // Add dotted flag
      if (isDotted) {
        note.dotted = true;
      }

      notes.push(note);
    }

    if (notes.length === 0) {
      throw new Error(
        'No notes found in ABC notation. Ensure K: field is followed by note data.',
      );
    }

    return notes;
  }

  /**
   * Calculate note duration from ABC suffix
   *
   * @param durationSuffix - ABC duration suffix (e.g., "", "2", "/2", "3/2")
   * @returns Duration value for ScoreNote
   */
  private static calculateDuration(durationSuffix: string): number {
    if (!durationSuffix || durationSuffix.trim() === '') {
      // No suffix = use unit length (typically 1/8 = 1 unit)
      return 1;
    }

    // Handle fraction: "3/2", "/2", "/4"
    if (durationSuffix.includes('/')) {
      const parts = durationSuffix.split('/');

      if (parts[0] === '') {
        // "/2" format = divide unit by denominator
        const divisor = parseInt(parts[1], 10);
        if (isNaN(divisor)) {
          throw new Error(`Invalid duration: ${durationSuffix}`);
        }
        return 1 / divisor;
      } else {
        // "3/2" format = multiply by numerator, divide by denominator
        const numerator = parseInt(parts[0], 10);
        const denominator = parseInt(parts[1], 10);
        if (isNaN(numerator) || isNaN(denominator)) {
          throw new Error(`Invalid duration: ${durationSuffix}`);
        }
        return numerator / denominator;
      }
    }

    // Handle integer: "2", "3", "4"
    const multiplier = parseInt(durationSuffix, 10);
    if (isNaN(multiplier)) {
      throw new Error(`Invalid duration: ${durationSuffix}`);
    }

    return multiplier;
  }

  /**
   * Parses ABC notation from a URL
   *
   * @param url - URL to the ABC file
   * @returns Promise resolving to ScoreData
   */
  static async parseFromURL(url: string): Promise<ScoreData> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load ABC file: ${response.statusText}`);
    }
    const abcContent = await response.text();
    return this.parse(abcContent);
  }
}
