/**
 * ABCSerializer - Converts shakuhachi JSON format to ABC notation
 *
 * Serializes ScoreData to ABC notation string.
 * For D shakuhachi (1.8 shaku) in Kinko style.
 */

import type { ScoreData, ScoreNote } from '../types/ScoreData';
import { createReverseABCMap } from '../constants/abc-pitch-map';

export class ABCSerializer {
  /**
   * Serializes ScoreData to ABC notation string
   *
   * @param scoreData - The score data to serialize
   * @returns ABC notation string
   */
  static serialize(scoreData: ScoreData): string {
    // Generate header
    const header = this.generateHeader(scoreData);

    // Convert notes to ABC notation
    const abcNotes = this.serializeNotes(scoreData.notes);

    // Combine header and notes
    return `${header}\n\n${abcNotes}\n`;
  }

  /**
   * Generate ABC header from ScoreData metadata
   */
  private static generateHeader(scoreData: ScoreData): string {
    const lines: string[] = [];

    // X: field (index, required) - always use 1
    lines.push('X:1');

    // T: field (title, required)
    lines.push(`T:${scoreData.title}`);

    // C: field (composer, optional)
    if (scoreData.composer) {
      lines.push(`C:${scoreData.composer}`);
    }

    // M: field (meter, optional) - default to 4/4
    lines.push('M:4/4');

    // L: field (unit note length) - determine from notes
    const unitLength = this.determineUnitLength();
    lines.push(`L:${unitLength}`);

    // Q: field (tempo, optional)
    if (scoreData.tempo) {
      lines.push(`Q:${scoreData.tempo}`);
    }

    // K: field (key, required) - default to D for D shakuhachi
    const key = scoreData.key || 'D';
    lines.push(`K:${key}`);

    return lines.join('\n');
  }

  /**
   * Determine optimal unit note length based on most common duration
   * For now, just use 1/8 as default
   */
  private static determineUnitLength(): string {
    // Simple default - could be enhanced to analyze note durations
    return '1/8';
  }

  /**
   * Serialize notes array to ABC notation string
   */
  private static serializeNotes(notes: ScoreNote[]): string {
    const reverseMap = createReverseABCMap();
    const abcNotes: string[] = [];

    for (const note of notes) {
      if (note.rest) {
        // Rest: "z" + duration
        const durationStr = this.formatDuration(note.duration);
        abcNotes.push(`z${durationStr}`);
      } else if (note.pitch) {
        // Build key for reverse map lookup
        const key = `${note.pitch.step}-${note.pitch.octave}-${note.meri || false}-${note.chu_meri || false}-${note.dai_meri || false}`;

        // Find ABC pitch notation
        let abcPitch = reverseMap.get(key);

        if (!abcPitch) {
          // Fallback: construct basic ABC pitch without meri
          const baseKey = `${note.pitch.step}-${note.pitch.octave}-false-false-false`;
          abcPitch = reverseMap.get(baseKey);

          if (!abcPitch) {
            throw new Error(
              `Cannot serialize pitch: ${note.pitch.step} octave ${note.pitch.octave}`,
            );
          }
        }

        // Format duration
        const durationStr = this.formatDuration(note.duration);

        // Add dotted marker if needed
        const dottedMarker = note.dotted ? '>' : '';

        // Combine: pitch + duration + dotted
        abcNotes.push(`${abcPitch}${durationStr}${dottedMarker}`);
      }
    }

    // Join notes with spaces (could add bar lines based on meter)
    return abcNotes.join(' ');
  }

  /**
   * Format duration value as ABC duration suffix
   *
   * @param duration - Duration value from ScoreNote
   * @returns ABC duration string (e.g., "", "2", "/2", "3/2")
   */
  private static formatDuration(duration: number): string {
    // Default duration (1 unit) = no suffix
    if (duration === 1) {
      return '';
    }

    // Check if it's an integer
    if (Number.isInteger(duration)) {
      return duration.toString();
    }

    // Check if it's a simple fraction
    // Common cases: 0.5 = /2, 1.5 = 3/2, 0.25 = /4, etc.
    if (duration === 0.5) {
      return '/2';
    }
    if (duration === 0.25) {
      return '/4';
    }
    if (duration === 1.5) {
      return '3/2';
    }
    if (duration === 0.75) {
      return '3/4';
    }

    // For other fractions, try to find simple numerator/denominator
    // This is a simplified approach - could be enhanced
    const denominator = 8; // Common denominator for most durations
    const numerator = Math.round(duration * denominator);

    if (numerator === denominator) {
      return ''; // 1 unit
    }
    if (numerator < denominator) {
      // Fraction less than 1: try to simplify
      const gcd = this.gcd(numerator, denominator);
      const simpleNum = numerator / gcd;
      const simpleDenom = denominator / gcd;

      if (simpleNum === 1) {
        return `/${simpleDenom}`;
      }
      return `${simpleNum}/${simpleDenom}`;
    }

    // Fraction greater than 1
    const gcd = this.gcd(numerator, denominator);
    const simpleNum = numerator / gcd;
    const simpleDenom = denominator / gcd;

    if (simpleDenom === 1) {
      return simpleNum.toString();
    }
    return `${simpleNum}/${simpleDenom}`;
  }

  /**
   * Calculate greatest common divisor
   */
  private static gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b);
  }
}
