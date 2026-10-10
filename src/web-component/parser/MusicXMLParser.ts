/**
 * MusicXMLParser - Converts MusicXML files to shakuhachi JSON format
 *
 * Parses MusicXML and maps Western pitches to shakuhachi notation.
 * For D shakuhachi (1.8 shaku) in Kinko style.
 */

import type { ScoreData, ScoreNote } from '../types/ScoreData';
import {
  defaultFingering,
  isNoteLetter,
  namedFingering,
  PITCH_RANGE,
  rangePosition,
  type WrittenPitch,
} from '../constants/kinko-fingerings';
import { PARSER_STRINGS } from '../constants/parser-strings';
import {
  beatsOf,
  formatBeats,
  hasHalf,
  isSupported,
  type Beats,
} from '../types/Duration';

/**
 * A note's length in beats, from its <duration>: the sounding length, in
 * divisions per quarter note. The time signature's beat type is the beat, so
 * a quarter note is one beat in 4/4 and an eighth note one beat in 6/8.
 */
function toBeats(raw: number, divisions: number, beatType: number): Beats {
  return beatsOf(raw * beatType, 4 * divisions);
}

/** Each note type's length in quarter notes, as [numerator, denominator] */
const TYPE_QUARTERS: Record<string, [number, number]> = {
  breve: [8, 1],
  whole: [4, 1],
  half: [2, 1],
  quarter: [1, 1],
  eighth: [1, 2],
  '16th': [1, 4],
  '32nd': [1, 8],
  '64th': [1, 16],
};

/**
 * A note's length in beats as its <type> and <dot/>s write it, or undefined
 * where they don't say: no type, or a tuplet, whose notes are shorter than
 * they are written. Each dot adds half of what the one before it added.
 */
function writtenBeats(
  noteElement: Element,
  beatType: number,
): Beats | undefined {
  const quarters =
    TYPE_QUARTERS[noteElement.querySelector('type')?.textContent?.trim() ?? ''];
  if (!quarters || noteElement.querySelector('time-modification')) {
    return undefined;
  }
  const dots = noteElement.querySelectorAll('dot').length;
  return beatsOf(
    quarters[0] * beatType * (2 ** (dots + 1) - 1),
    quarters[1] * 4 * 2 ** dots,
  );
}

const MESSAGES = PARSER_STRINGS.ERRORS.MusicXMLParser;

/** Where a note is, as a reader of the source would find it */
function locate(noteElement: Element): string {
  const measure = noteElement.closest('measure');
  const notes = measure ? [...measure.querySelectorAll('note')] : [];
  return MESSAGES.noteLocation(
    measure?.getAttribute('number') ?? '?',
    notes.indexOf(noteElement) + 1,
  );
}

/**
 * Says why a note cannot be imported. Quotes only validated values: the
 * message can be shown in a page, and the source is user content.
 */
function describeUnplayable(
  noteElement: Element,
  written: WrittenPitch | undefined,
  alter: number,
): string {
  const where = locate(noteElement);
  if (!written) return MESSAGES.invalidStep(where);
  if (!Number.isInteger(alter)) {
    return MESSAGES.microtone(where, written.letter, alter);
  }
  const accidentals = alter > 0 ? '#'.repeat(alter) : 'b'.repeat(-alter);
  const name = `${written.letter}${accidentals}${written.octave}`;
  const position = rangePosition(written);
  // Every semitone in range has a fingering today; this guards against a
  // review removing one
  if (position === 'within') return MESSAGES.notInTable(where, name);
  return MESSAGES.outOfRange(where, name, position, PITCH_RANGE);
}

/** Matches a part's name, abbreviation, instrument name or instrument sound */
const SHAKUHACHI = /shakuhachi|尺八/i;

/**
 * The part to import. A file with one part is taken as it is; with several,
 * the one part named shakuhachi, because koto or piano interleaved into the
 * shakuhachi line would import wrong without an error.
 */
function choosePart(xmlDoc: Document): Element | undefined {
  const parts = [...xmlDoc.querySelectorAll('score-partwise > part')];
  if (parts.length <= 1) return parts[0];

  const scoreParts = [...xmlDoc.querySelectorAll('part-list > score-part')];
  const shakuhachiParts = parts.filter((part) => {
    const id = part.getAttribute('id');
    const scorePart = scoreParts.find((sp) => sp.getAttribute('id') === id);
    return SHAKUHACHI.test(scorePart?.textContent ?? '');
  });
  if (shakuhachiParts.length === 1) return shakuhachiParts[0];
  // Part names are user content, so the message counts parts, not names
  throw new Error(MESSAGES.partNotChosen(parts.length, shakuhachiParts.length));
}

export class MusicXMLParser {
  /**
   * Parses a MusicXML file and converts to shakuhachi JSON format
   *
   * @param xmlContent - The MusicXML file content as string
   * @returns ScoreData object ready for rendering
   */
  static parse(xmlContent: string): ScoreData {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

    // Extract title
    const titleElement = xmlDoc.querySelector('work-title');
    const title = titleElement?.textContent || 'Untitled';

    // Extract composer
    const composerElement = xmlDoc.querySelector('creator[type="composer"]');
    const composer = composerElement?.textContent || undefined;

    if (xmlDoc.querySelector('score-timewise')) {
      throw new Error(MESSAGES.timewise);
    }
    const part = choosePart(xmlDoc);

    // <divisions> is divisions-per-quarter-note. Absent means 1. A score may
    // redefine it in any measure, and it applies from there on.
    let divisions = 1;
    // The time signature's <beat-type>, which is the beat. Without one, a
    // quarter note is the beat. It changes with the time signature.
    let beatType = 4;
    // The voice of the part's first note. Shakuhachi plays one note at a
    // time, so a second voice fails the import rather than interleaving.
    // A note without <voice> is in voice 1.
    let voice: string | undefined;

    const notes: ScoreNote[] = [];
    // Notes that can't be played: no fingering in the table, or part of a
    // chord. Import fails rather than dropping them, which would change the
    // piece without telling anyone; all of them are counted so a score
    // written in the wrong octave reads as such.
    const unplayable: string[] = [];

    // A measure's children in order, so a <divisions> change in <attributes>
    // applies to the notes after it
    const elements = [...(part?.querySelectorAll('measure') ?? [])].flatMap(
      (measure) => [...measure.children],
    );

    elements.forEach((element) => {
      if (element.tagName === 'attributes') {
        const value = parseInt(
          element.querySelector('divisions')?.textContent ?? '',
          10,
        );
        if (Number.isFinite(value) && value > 0) divisions = value;
        const beat = parseInt(
          element.querySelector('time > beat-type')?.textContent ?? '',
          10,
        );
        if (Number.isFinite(beat) && beat > 0) beatType = beat;
        return;
      }
      if (element.tagName !== 'note') return;
      const noteElement = element;

      const noteVoice =
        noteElement.querySelector('voice')?.textContent?.trim() || '1';
      voice ??= noteVoice;
      if (noteVoice !== voice) {
        throw new Error(
          MESSAGES.multipleVoices(
            noteElement.closest('measure')?.getAttribute('number') ?? '?',
          ),
        );
      }

      if (noteElement.querySelector('chord')) {
        unplayable.push(MESSAGES.chord(locate(noteElement)));
        return;
      }

      const rawDuration = parseInt(
        noteElement.querySelector('duration')?.textContent || '1',
        10,
      );
      const beats = toBeats(rawDuration, divisions, beatType);
      // Where <duration> and the written note disagree, either may be the
      // mistake, so the import fails rather than guess
      const typed = noteElement.querySelector('duration')
        ? writtenBeats(noteElement, beatType)
        : undefined;
      if (typed && formatBeats(typed) !== formatBeats(beats)) {
        throw new Error(
          MESSAGES.contradictoryLength(
            locate(noteElement),
            formatBeats(beats),
            formatBeats(typed),
          ),
        );
      }
      if (!isSupported(beats)) {
        throw new Error(
          MESSAGES.unsupportedLength(locate(noteElement), formatBeats(beats)),
        );
      }
      const duration = formatBeats(beats);
      // A dot is kept where the length has a half to write as one. A dotted
      // half note in 4/4 is three beats, which Kinko writes with strokes.
      const isDotted =
        noteElement.querySelector('dot') !== null && hasHalf(beats);

      // Check for rests
      const restElement = noteElement.querySelector('rest');
      if (restElement) {
        const rest: ScoreNote = { rest: true, duration };
        if (isDotted) {
          rest.dotted = true;
        }
        notes.push(rest);
        return;
      }

      // Extract pitch
      const pitchElement = noteElement.querySelector('pitch');
      if (!pitchElement) {
        unplayable.push(MESSAGES.noPitch(locate(noteElement)));
        return;
      }

      const step = pitchElement.querySelector('step')?.textContent?.trim();
      const octave = Number(
        pitchElement.querySelector('octave')?.textContent ?? '4',
      );
      const alter = Number(
        pitchElement.querySelector('alter')?.textContent ?? '0',
      );

      const written = isNoteLetter(step)
        ? { letter: step, alter, octave }
        : undefined;
      // A fingering our export named wins over the pitch's default. Other
      // software's fingerings (finger numbers) don't match a name, and fall
      // back to the default.
      const named = noteElement
        .querySelector('technical > fingering')
        ?.textContent?.trim();
      const shakuPitch =
        written &&
        ((named && namedFingering(written, named)) ||
          defaultFingering(written));
      if (!shakuPitch) {
        unplayable.push(describeUnplayable(noteElement, written, alter));
        return;
      }

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

      // Add dotted flag if needed
      if (isDotted) {
        note.dotted = true;
      }

      notes.push(note);
    });

    if (unplayable.length > 0) {
      throw new Error(
        PARSER_STRINGS.ERRORS.MusicXMLParser.unplayableNotes(
          unplayable[0],
          unplayable.length - 1,
        ),
      );
    }

    return {
      title,
      style: 'kinko',
      notes,
      composer,
    };
  }

  /**
   * Parses a MusicXML file from a URL
   *
   * @param url - URL to the MusicXML file
   * @returns Promise resolving to ScoreData
   */
  static async parseFromURL(url: string): Promise<ScoreData> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        PARSER_STRINGS.ERRORS.MusicXMLParser.loadFailed(response.statusText),
      );
    }
    const xmlContent = await response.text();
    return this.parse(xmlContent);
  }
}
