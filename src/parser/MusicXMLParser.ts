/**
 * MusicXMLParser - Converts MusicXML files to shakuhachi JSON format
 *
 * Parses MusicXML and maps Western pitches to shakuhachi notation.
 * For D shakuhachi (1.8 shaku) in Kinko style.
 */

import type { ScoreData, ScoreNote } from '../types/ScoreData';

/**
 * Comprehensive pitch mapping for D shakuhachi (Kinko-ryū)
 * Maps Western pitch names to shakuhachi fingerings
 * Based on fingering charts: kinko-chart.pdf, fingerchart.pdf, shak-fingering.png
 *
 * Note: Shakuhachi is microtonal - pitches often differ from Western equal temperament.
 * This mapping provides approximate equivalents for standard MusicXML conversion.
 */
const PITCH_MAP: Record<string, { step: string; octave: number; meri?: boolean; chu_meri?: boolean; dai_meri?: boolean }> = {
  // ============================================================
  // OTSU REGISTER (Lower Octave) - D4 to C5
  // ============================================================

  // Ro (ロ) - D4 base note
  'C4': { step: 'ro', octave: 0, dai_meri: true },    // ro dai-meri (大メ)
  'C#4': { step: 'ro', octave: 0, meri: true },       // ro meri (メ)
  'Db4': { step: 'ro', octave: 0, meri: true },       // ro meri (メ)
  'D4': { step: 'ro', octave: 0 },                    // ro (ロ) - fundamental note

  // Tsu (ツ) - F4 base note
  'D#4': { step: 'tsu', octave: 0, meri: true },      // tsu meri (ツメ)
  'Eb4': { step: 'tsu', octave: 0, meri: true },      // tsu meri (ツメ)
  'E4': { step: 'tsu', octave: 0, chu_meri: true },   // tsu chu-meri (ツ中メ)
  'F4': { step: 'tsu', octave: 0 },                   // tsu (ツ)

  // Re (レ) - G4 base note
  'F#4': { step: 're', octave: 0, meri: true },       // re meri (レメ)
  'Gb4': { step: 're', octave: 0, meri: true },       // re meri (レメ)
  'G4': { step: 're', octave: 0 },                    // re (レ)

  // U/Chi (ウ/チ) - G#4/A4 base notes
  'G#4': { step: 'u', octave: 0 },                    // u (ウ) - also called "chi meri"
  'Ab4': { step: 'u', octave: 0 },                    // u (ウ)
  'A4': { step: 'chi', octave: 0 },                   // chi (チ)
  'A#4': { step: 'chi', octave: 0, meri: true },      // chi meri (チメ) - raised via kari technique
  'Bb4': { step: 'chi', octave: 0, meri: true },      // chi meri (チメ)

  // Ri (リ) - C5 base note
  'B4': { step: 'ri', octave: 0, chu_meri: true },    // ri chu-meri (リ中メ)
  'C5': { step: 'ri', octave: 0 },                    // ri (リ)

  // ============================================================
  // KAN REGISTER (Middle Octave) - D5 to B5
  // ============================================================

  // Ro kan (ロ甲) - D5 base note
  'C#5': { step: 'ro', octave: 1, meri: true },       // ro meri (メ)
  'Db5': { step: 'ro', octave: 1, meri: true },       // ro meri (メ)
  'D5': { step: 'ro', octave: 1 },                    // ro kan (ロ甲)

  // Tsu kan (ツ甲) - F5 base note (E5 also maps here with special fingering)
  'D#5': { step: 'tsu', octave: 1, meri: true },      // tsu meri (ツメ)
  'Eb5': { step: 'tsu', octave: 1, meri: true },      // tsu meri (ツメ)
  'E5': { step: 'tsu', octave: 1, chu_meri: true },   // tsu chu-meri (ツ中メ) - special fingering
  'F5': { step: 'tsu', octave: 1 },                   // tsu kan (ツ甲)

  // Re kan (レ甲) - G5 base note
  'F#5': { step: 're', octave: 1, meri: true },       // re meri (レメ)
  'Gb5': { step: 're', octave: 1, meri: true },       // re meri (レメ)
  'G5': { step: 're', octave: 1 },                    // re kan (レ甲)

  // Chi kan (チ甲) - A5 base note
  'G#5': { step: 'chi', octave: 1, meri: true },      // chi meri (チメ)
  'Ab5': { step: 'chi', octave: 1, meri: true },      // chi meri (チメ)
  'A5': { step: 'chi', octave: 1 },                   // chi kan (チ甲)
  'A#5': { step: 'chi', octave: 1, chu_meri: true },  // chi chu-meri (チ中メ)
  'Bb5': { step: 'chi', octave: 1, chu_meri: true },  // chi chu-meri (チ中メ)

  // Ri/Hi kan (リ/ヒ甲) - B5/C6
  'B5': { step: 'ri', octave: 1 },                    // ri kan (リ甲)
  'C6': { step: 'hi', octave: 1 },                    // hi kan (ヒ甲)

  // ============================================================
  // DAI-KAN REGISTER (Upper Octave) - D6 and above
  // ============================================================

  'C#6': { step: 'ro', octave: 2, meri: true },       // ro meri dai-kan
  'Db6': { step: 'ro', octave: 2, meri: true },       // ro meri dai-kan
  'D6': { step: 'ro', octave: 2 },                    // ro dai-kan (ロ大甲)
  'D#6': { step: 'tsu', octave: 2, meri: true },      // tsu meri dai-kan
  'Eb6': { step: 'tsu', octave: 2, meri: true },      // tsu meri dai-kan
  'E6': { step: 'tsu', octave: 2, chu_meri: true },   // tsu chu-meri dai-kan
  'F6': { step: 'tsu', octave: 2 },                   // tsu dai-kan (ツ大甲)
  'F#6': { step: 're', octave: 2, meri: true },       // re meri dai-kan
  'Gb6': { step: 're', octave: 2, meri: true },       // re meri dai-kan
  'G6': { step: 're', octave: 2 },                    // re dai-kan (レ大甲)
  'G#6': { step: 'chi', octave: 2, meri: true },      // chi meri dai-kan
  'Ab6': { step: 'chi', octave: 2, meri: true },      // chi meri dai-kan
  'A6': { step: 'chi', octave: 2 },                   // chi dai-kan (チ大甲)
  'A#6': { step: 'hi', octave: 2, meri: true },       // hi meri dai-kan
  'Bb6': { step: 'hi', octave: 2, meri: true },       // hi meri dai-kan
  'B6': { step: 'hi', octave: 2 },                    // hi dai-kan (ヒ大甲) - upper limit
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
      const shakuPitch = PITCH_MAP[pitchName];
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
