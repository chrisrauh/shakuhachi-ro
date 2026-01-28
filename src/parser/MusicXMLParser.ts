/**
 * MusicXMLParser - Converts MusicXML files to shakuhachi JSON format
 *
 * Parses MusicXML and maps Western pitches to shakuhachi notation.
 * For D shakuhachi (1.8 shaku) in Kinko style.
 */

import type { ScoreData, ScoreNote } from '../types/ScoreData';
import { KINKO_PITCH_MAP } from '../constants/kinko-pitch-map';

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

    // Extract all notes from all measures
    const notes: ScoreNote[] = [];
    const noteElements = xmlDoc.querySelectorAll('note');

    noteElements.forEach(noteElement => {
      // Check for rests
      const restElement = noteElement.querySelector('rest');
      if (restElement) {
        // Extract duration for rest
        const durationElement = noteElement.querySelector('duration')?.textContent || '1';
        const duration = parseInt(durationElement, 10);

        // Create rest note (following MusicXML structure)
        notes.push({
          rest: true,
          duration,
        });
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
      const shakuPitch = KINKO_PITCH_MAP[pitchName];
      if (!shakuPitch) {
        console.warn(`Unknown pitch: ${pitchName}, skipping`);
        return;
      }

      // Extract duration (simplified - just map to basic durations)
      const durationElement = noteElement.querySelector('duration')?.textContent || '1';
      const duration = parseInt(durationElement, 10);

      // Check if note is dotted
      const dotElement = noteElement.querySelector('dot');
      const isDotted = dotElement !== null;

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
