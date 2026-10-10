/**
 * ABCSerializer - Converts shakuhachi JSON format to ABC notation
 *
 * Serializes ScoreData to ABC notation string.
 * For D shakuhachi (1.8 shaku) in Kinko style.
 */

import type { ScoreData, ScoreNote } from '../types/ScoreData';
import { noteBeats, type Beats } from '../types/Duration';
import {
  ABCAccidentals,
  keySignature,
  toABCPitch,
} from '../constants/abc-pitch-map';
import {
  fingeringName,
  isDefaultFingering,
  pitchForFingering,
} from '../constants/kinko-fingerings';
import { PARSER_STRINGS } from '../constants/parser-strings';

export class ABCSerializer {
  /**
   * Serializes ScoreData to ABC notation string
   *
   * @param scoreData - The score data to serialize
   * @returns ABC notation string
   */
  static serialize(scoreData: ScoreData): string {
    // K: field (key, required) - default to D for D shakuhachi
    const key = scoreData.key || 'D';
    const signature = keySignature(key);
    if (!signature) {
      throw new Error(PARSER_STRINGS.ERRORS.Serializer.unknownABCKey(key));
    }

    // Generate header
    const header = this.generateHeader(scoreData, key);

    // Convert notes to ABC notation
    const abcNotes = this.serializeNotes(
      scoreData.notes,
      new ABCAccidentals(signature),
    );

    // Combine header and notes
    return `${header}\n\n${abcNotes}\n`;
  }

  /**
   * Generate ABC header from ScoreData metadata
   */
  private static generateHeader(scoreData: ScoreData, key: string): string {
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

    // L: field (unit note length): one beat, a quarter note in 4/4
    lines.push('L:1/4');

    // Q: field (tempo, optional)
    if (scoreData.tempo) {
      lines.push(`Q:${scoreData.tempo}`);
    }

    lines.push(`K:${key}`);

    return lines.join('\n');
  }

  /**
   * Serialize notes array to ABC notation string. Notes are written relative
   * to the key and to accidentals earlier in the bar, which here is the whole
   * tune, since no bar lines are written.
   */
  private static serializeNotes(
    notes: ScoreNote[],
    accidentals: ABCAccidentals,
  ): string {
    const abcNotes: string[] = [];

    notes.forEach((note, index) => {
      if (note.rest) {
        // Rest: "z" + duration
        abcNotes.push(`z${this.formatDuration(noteBeats(note))}`);
      } else if (note.pitch) {
        const fingering = { ...note.pitch, meriKari: note.meriKari };
        const written = pitchForFingering(fingering);
        if (!written) {
          throw new Error(
            PARSER_STRINGS.ERRORS.Serializer.invalidFingering(index),
          );
        }
        // A fingering import wouldn't choose for its pitch is named in a
        // decoration, so it reads back as itself. ABC software that doesn't
        // know the decoration ignores it.
        const decoration = isDefaultFingering(fingering)
          ? ''
          : `!${fingeringName(fingering)}!`;
        const abcPitch = decoration + toABCPitch(written, accidentals);

        // The length is written as it sounds, dot included (a dotted beat is
        // 3/2), not as >, which in ABC is broken rhythm and would also halve
        // the next note
        abcNotes.push(`${abcPitch}${this.formatDuration(noteBeats(note))}`);
      }
    });

    // Join notes with spaces (could add bar lines based on meter)
    return abcNotes.join(' ');
  }

  /**
   * The ABC length suffix for a length in beats, with one beat the unit
   * length: "" for 1, "2", "/2", "3/2"
   */
  private static formatDuration({ num, den }: Beats): string {
    if (den === 1) return num === 1 ? '' : String(num);
    return num === 1 ? `/${den}` : `${num}/${den}`;
  }
}
