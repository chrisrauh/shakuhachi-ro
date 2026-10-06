/**
 * ABCParser - Converts ABC notation to shakuhachi JSON format
 *
 * Parses ABC notation and maps pitches to shakuhachi notation.
 * For D shakuhachi (1.8 shaku) in Kinko style.
 *
 * ABC Notation Reference:
 * - Header fields: X: (index), T: (title), C: (composer), M: (meter), L: (unit length), K: (key)
 *   All are optional; a tune can be just its notes
 * - Notes: A-G (uppercase = octave 4), a-g (lowercase = octave 5), ' (upper octave), , (lower octave)
 * - Accidentals: ^ (sharp), ^^ (double sharp), _ (flat), __ (double flat), = (natural)
 * - Duration: 2 (double), /2 (half), 3/2 (dotted), default is L: value
 * - Broken rhythm: A>B dots A and halves B; A<B halves A and dots B
 * - Rests: z (with duration modifiers)
 * - Key: K: sets the accidentals of notes written without one. Without K:,
 *   notes read as written
 * - Bar lines: | ends the accidentals written in a bar; not kept in output
 * - Decorations: !name! before a note. One naming a fingering (as our export
 *   writes, e.g. !ri-meri!) chooses it; others are ignored
 */

import type { ScoreData, ScoreNote } from '../types/ScoreData';
import {
  ABCAccidentals,
  keySignature,
  parseABCPitch,
} from '../constants/abc-pitch-map';
import {
  defaultFingering,
  namedFingering,
} from '../constants/kinko-fingerings';
import { PARSER_STRINGS } from '../constants/parser-strings';

export class ABCParser {
  /**
   * Parses ABC notation and converts to shakuhachi JSON format
   *
   * @param abcContent - The ABC notation content as string
   * @returns ScoreData object ready for rendering
   */
  static parse(abcContent: string): ScoreData {
    if (!abcContent || !abcContent.trim()) {
      throw new Error(PARSER_STRINGS.ERRORS.ABCParser.contentRequired);
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

      // The header is fields such as T:Title. It ends at K:, or, when a
      // tune has no K:, at the first line that isn't a field
      if (!inBody && !/^[A-Za-z]:/.test(trimmed)) {
        inBody = true;
      }

      if (!inBody) {
        if (trimmed.startsWith('X:')) {
          // Index field (not used)
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
        noteLines.push(trimmed);
      }
    }

    // Without K:, notes read as written
    const signature = keySignature(key ?? '');
    if (!signature) {
      throw new Error(PARSER_STRINGS.ERRORS.ABCParser.unknownKey(key ?? ''));
    }

    // Parse notes from body
    const notes = this.parseNotes(
      noteLines.join(' '),
      new ABCAccidentals(signature),
    );

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
   * @param accidentals - The key signature, and accidentals as they're written
   * @returns Array of ScoreNote objects
   */
  private static parseNotes(
    noteString: string,
    accidentals: ABCAccidentals,
  ): ScoreNote[] {
    const notes: ScoreNote[] = [];
    // The broken-rhythm marker (> or <) after each note, by note index
    const brokenRhythm: string[] = [];

    const cleaned = noteString.replace(/\s+/g, ' ').trim();

    // Tokenize: split into note tokens (pitch + optional duration + optional dotted marker)
    // Regex matches: optional accidental + ANY letter (we'll validate later) + optional octave marks + optional duration + optional dotted
    // Examples: "D", "^D2", "d'", "_a/2", "G>", "X", "Q", "z"
    const tokenRegex =
      /(\|)|!([^!]*)!|([_=^]{1,2})?([A-Za-z])([',]*)(\/?\d*\/?\d*)([><]?)/g;
    // Decorations seen since the last note
    let decorations: string[] = [];
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
        barLine,
        decoration,
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

      if (barLine) {
        accidentals.barLine();
        continue;
      }

      if (decoration !== undefined) {
        decorations.push(decoration);
        continue;
      }
      const noteDecorations = decorations;
      decorations = [];

      // Validate letter first
      if (!validLetters.has(pitch)) {
        throw new Error(PARSER_STRINGS.ERRORS.ABCParser.unknownPitch(pitch));
      }

      brokenRhythm[notes.length] = dottedMarker;

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
      const written = parseABCPitch(
        accidental || '',
        pitch,
        octaveMarks,
        accidentals,
      );
      const shakuPitch =
        written &&
        (noteDecorations
          .map((name) => namedFingering(written, name))
          .find(Boolean) ??
          defaultFingering(written));
      if (!shakuPitch) {
        throw new Error(PARSER_STRINGS.ERRORS.ABCParser.unknownPitch(abcPitch));
      }

      // Sounding length for now; toBaseAndDot() splits out the dot below
      const duration = this.calculateDuration(durationSuffix);

      // Create note
      const note: ScoreNote = {
        pitch: {
          step: shakuPitch.step,
          octave: shakuPitch.octave,
        },
        duration,
      };

      if (shakuPitch.meriKari) {
        note.meriKari = shakuPitch.meriKari;
      }

      notes.push(note);
    }

    this.applyBrokenRhythm(notes, brokenRhythm);
    for (const note of notes) {
      if (!note.rest) this.toBaseAndDot(note);
    }

    if (notes.length === 0) {
      throw new Error(PARSER_STRINGS.ERRORS.ABCParser.noNotesFound);
    }

    return notes;
  }

  /**
   * Applies ABC broken rhythm to sounding lengths: A>B makes A one and a half
   * times as long and B half as long, so the pair keeps its total; A<B is the
   * reverse. A marker on the last note has no partner, so it only lengthens
   * that note, which keeps older ABC written with a trailing > readable.
   */
  private static applyBrokenRhythm(
    notes: ScoreNote[],
    markers: string[],
  ): void {
    notes.forEach((note, i) => {
      const marker = markers[i];
      if (!marker) return;
      const next = notes[i + 1];
      if (!next) {
        note.duration *= 1.5;
        return;
      }
      const [first, second] = marker === '>' ? [note, next] : [next, note];
      first.duration *= 1.5;
      second.duration *= 0.5;
    });
  }

  /**
   * Splits a sounding length into a base length plus a dot, the way ScoreNote
   * stores it (as MusicXMLParser does): 3/2 becomes a dotted 1, 3 a dotted 2.
   * Lengths that aren't one and a half times a power of two stay as they are.
   */
  private static toBaseAndDot(note: ScoreNote): void {
    const base = note.duration / 1.5;
    if (Number.isInteger(Math.log2(base))) {
      note.duration = base;
      note.dotted = true;
    }
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
          throw new Error(
            PARSER_STRINGS.ERRORS.ABCParser.invalidDuration(durationSuffix),
          );
        }
        return 1 / divisor;
      } else {
        // "3/2" format = multiply by numerator, divide by denominator
        const numerator = parseInt(parts[0], 10);
        const denominator = parseInt(parts[1], 10);
        if (isNaN(numerator) || isNaN(denominator)) {
          throw new Error(
            PARSER_STRINGS.ERRORS.ABCParser.invalidDuration(durationSuffix),
          );
        }
        return numerator / denominator;
      }
    }

    // Handle integer: "2", "3", "4"
    const multiplier = parseInt(durationSuffix, 10);
    if (isNaN(multiplier)) {
      throw new Error(
        PARSER_STRINGS.ERRORS.ABCParser.invalidDuration(durationSuffix),
      );
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
      throw new Error(
        PARSER_STRINGS.ERRORS.ABCParser.loadFailed(response.statusText),
      );
    }
    const abcContent = await response.text();
    return this.parse(abcContent);
  }
}
