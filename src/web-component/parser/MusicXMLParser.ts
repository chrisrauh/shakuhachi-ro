/**
 * MusicXMLParser - Converts MusicXML files to shakuhachi JSON format
 *
 * Parses MusicXML and maps Western pitches to shakuhachi notation.
 * For D shakuhachi (1.8 shaku) in Kinko style.
 */

import type { ScoreData, ScoreNote } from '../types/ScoreData';
import { KINKO_PITCH_MAP } from '../constants/kinko-pitch-map';
import { PARSER_STRINGS } from '../constants/parser-strings';

/**
 * Converts a MusicXML <duration> to a ScoreNote duration (1 = quarter note).
 *
 * <duration> is counted in divisions, and it is the *sounding* length, so it
 * already includes the dot. ScoreNote splits those apart: `duration` holds the
 * base value and `dotted` extends it by half. A dotted note therefore divides
 * back out by 1.5 to recover its base.
 */
function toBaseDuration(
  raw: number,
  divisions: number,
  dotted: boolean,
): number {
  const sounding = raw / divisions;
  return dotted ? sounding / 1.5 : sounding;
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

    // <divisions> is divisions-per-quarter-note. Absent means 1. A score may
    // redefine it per measure; we read the first and apply it throughout,
    // which matches how this parser already flattens every measure into one
    // note list.
    const divisionsValue = parseInt(
      xmlDoc.querySelector('divisions')?.textContent ?? '',
      10,
    );
    const divisions =
      Number.isFinite(divisionsValue) && divisionsValue > 0
        ? divisionsValue
        : 1;

    // Extract all notes from all measures
    const notes: ScoreNote[] = [];
    const noteElements = xmlDoc.querySelectorAll('note');

    noteElements.forEach((noteElement, i) => {
      const rawDuration = parseInt(
        noteElement.querySelector('duration')?.textContent || '1',
        10,
      );
      const isDotted = noteElement.querySelector('dot') !== null;
      const duration = toBaseDuration(rawDuration, divisions, isDotted);

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
        console.warn(`Skipping note at index ${i}: no <pitch> element`);
        return;
      }

      const step = pitchElement.querySelector('step')?.textContent || '';
      const octave = pitchElement.querySelector('octave')?.textContent || '4';
      // const alter = pitchElement.querySelector('alter')?.textContent || '0'; // TODO: Use for accidentals

      // Build pitch name (e.g., "D4", "G5")
      const pitchName = `${step}${octave}`;

      // Map to shakuhachi notation
      const shakuPitch = KINKO_PITCH_MAP[pitchName];
      if (!shakuPitch) {
        console.warn(`Unknown pitch: ${pitchName}, skipping`);
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

      // Add meri modifier if needed
      if (shakuPitch.meri) {
        note.meri = true;
      }

      // Add chu-meri modifier if needed
      if (shakuPitch.chu_meri) {
        note.chu_meri = true;
      }

      // Add dai-meri modifier if needed
      if (shakuPitch.dai_meri) {
        note.dai_meri = true;
      }

      // Add dotted flag if needed
      if (isDotted) {
        note.dotted = true;
      }

      notes.push(note);
    });

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
