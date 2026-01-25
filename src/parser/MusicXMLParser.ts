/**
 * MusicXMLParser - Converts MusicXML files to shakuhachi JSON format
 *
 * Parses MusicXML and maps Western pitches to shakuhachi notation.
 * For D shakuhachi (1.8 shaku) in Kinko style.
 */

import type { ScoreData, ScoreNote } from '../types/ScoreData';

/**
 * Pitch mapping for D shakuhachi (Kinko-ryū)
 * Maps Western pitch names to shakuhachi fingerings
 */
const PITCH_MAP: Record<string, { step: string; octave: number; meri?: boolean }> = {
  // Base octave (otsu 乙)
  'D4': { step: 'ro', octave: 0 },
  'E4': { step: 'ro', octave: 0, meri: true }, // ro-meri
  'F4': { step: 'tsu', octave: 0 },
  'G4': { step: 're', octave: 0 },
  'A4': { step: 'chi', octave: 0 },
  'B4': { step: 'ri', octave: 0 },
  'C5': { step: 'ri', octave: 0 }, // ri-kari or upper ri

  // First octave (kan 甲)
  'D5': { step: 'ro', octave: 1 },
  'E5': { step: 'tsu', octave: 1 }, // E5 maps to tsu kan (special fingering)
  'F5': { step: 'tsu', octave: 1 },
  'G5': { step: 're', octave: 1 },
  'A5': { step: 'chi', octave: 1 },
  'B5': { step: 'ri', octave: 1 },

  // Second octave (daikan 大甲)
  'D6': { step: 'ro', octave: 2 },
  'E6': { step: 'tsu', octave: 2 },
  'F6': { step: 'tsu', octave: 2 },
  'G6': { step: 're', octave: 2 },
  'A6': { step: 'chi', octave: 2 },
};

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

    // Extract all notes from all measures
    const notes: ScoreNote[] = [];
    const noteElements = xmlDoc.querySelectorAll('note');

    noteElements.forEach(noteElement => {
      // Skip rests
      const restElement = noteElement.querySelector('rest');
      if (restElement) {
        return;
      }

      // Extract pitch
      const pitchElement = noteElement.querySelector('pitch');
      if (!pitchElement) {
        return;
      }

      const step = pitchElement.querySelector('step')?.textContent || '';
      const octave = pitchElement.querySelector('octave')?.textContent || '4';
      const alter = pitchElement.querySelector('alter')?.textContent || '0';

      // Build pitch name (e.g., "D4", "G5")
      const pitchName = `${step}${octave}`;

      // Map to shakuhachi notation
      const shakuPitch = PITCH_MAP[pitchName];
      if (!shakuPitch) {
        console.warn(`Unknown pitch: ${pitchName}, skipping`);
        return;
      }

      // Extract duration (simplified - just map to basic durations)
      const durationElement = noteElement.querySelector('duration')?.textContent || '1';
      const duration = parseInt(durationElement, 10);

      // Simple duration mapping (can be refined)
      // 1 = eighth, 2 = quarter, 3 = dotted quarter, 4 = half
      let shakuDuration = 1;
      if (duration >= 4) {
        shakuDuration = 4; // whole
      } else if (duration >= 2) {
        shakuDuration = 2; // half
      } else {
        shakuDuration = 1; // quarter or eighth
      }

      // Create note
      const note: ScoreNote = {
        pitch: {
          step: shakuPitch.step,
          octave: shakuPitch.octave,
        },
        duration: shakuDuration,
      };

      // Add meri modifier if needed
      if (shakuPitch.meri) {
        note.meri = true;
      }

      notes.push(note);
    });

    return {
      title,
      style: 'kinko',
      notes,
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
      throw new Error(`Failed to load MusicXML file: ${response.statusText}`);
    }
    const xmlContent = await response.text();
    return this.parse(xmlContent);
  }

  /**
   * Converts ScoreData to JSON string
   *
   * @param scoreData - The score data to convert
   * @param pretty - Whether to pretty-print the JSON (default: true)
   * @returns JSON string
   */
  static toJSON(scoreData: ScoreData, pretty: boolean = true): string {
    return JSON.stringify(scoreData, null, pretty ? 2 : 0);
  }

  /**
   * Parses MusicXML and saves to JSON format
   *
   * @param xmlContent - The MusicXML content
   * @returns JSON string ready to save
   */
  static convertToJSON(xmlContent: string): string {
    const scoreData = this.parse(xmlContent);
    return this.toJSON(scoreData);
  }
}
