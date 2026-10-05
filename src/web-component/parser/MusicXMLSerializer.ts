/**
 * MusicXMLSerializer - Converts shakuhachi JSON format to MusicXML
 *
 * Serializes ScoreData to MusicXML string for exporting to Western notation.
 * For D shakuhachi (1.8 shaku) in Kinko style.
 */

import type { ScoreData, ScoreNote } from '../types/ScoreData';
import { PARSER_STRINGS } from '../constants/parser-strings';
import {
  pitchForFingering,
  type WrittenPitch,
} from '../constants/kinko-pitch-map';

/**
 * Divisions per quarter note.
 *
 * MusicXML defines no standard value; exporters derive one per score from the
 * shortest note present. 8 is that value for this format — the shortest
 * duration is a sixteenth (0.25) and dotting it gives 0.375, so divisions must
 * be a multiple of 8 for every duration to stay a whole number. Being a power
 * of two also keeps a parse/serialize round trip exact in binary floating
 * point. Well under the 16383 ceiling the spec names for MIDI compatibility.
 */
const DIVISIONS_PER_QUARTER = 8;

export class MusicXMLSerializer {
  /**
   * Serializes ScoreData to MusicXML string
   *
   * @param scoreData - The score data to serialize
   * @returns MusicXML string
   */
  static serialize(scoreData: ScoreData): string {
    const parts: string[] = [];

    // XML declaration
    parts.push('<?xml version="1.0" encoding="UTF-8"?>');
    parts.push(
      '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">',
    );
    parts.push('<score-partwise version="3.1">');

    // Work (title)
    parts.push('  <work>');
    parts.push(
      `    <work-title>${this.escapeXml(scoreData.title || 'Untitled')}</work-title>`,
    );
    parts.push('  </work>');

    // Identification (composer)
    if (scoreData.composer) {
      parts.push('  <identification>');
      parts.push(
        '    <creator type="composer">' +
          this.escapeXml(scoreData.composer) +
          '</creator>',
      );
      parts.push('  </identification>');
    }

    // Part list
    parts.push('  <part-list>');
    parts.push('    <score-part id="P1">');
    parts.push('      <part-name>Shakuhachi</part-name>');
    parts.push('    </score-part>');
    parts.push('  </part-list>');

    // Part
    parts.push('  <part id="P1">');

    // Measure with attributes
    parts.push('    <measure number="1">');
    parts.push('      <attributes>');
    parts.push(`        <divisions>${DIVISIONS_PER_QUARTER}</divisions>`);
    parts.push('        <key>');
    parts.push('          <fifths>2</fifths>'); // D major (2 sharps)
    parts.push('        </key>');
    parts.push('        <time>');
    parts.push('          <beats>4</beats>');
    parts.push('          <beat-type>4</beat-type>');
    parts.push('        </time>');
    parts.push('        <clef>');
    parts.push('          <sign>G</sign>');
    parts.push('          <line>2</line>');
    parts.push('        </clef>');
    parts.push('      </attributes>');

    // Serialize notes
    for (const note of scoreData.notes) {
      parts.push(this.serializeNote(note));
    }

    parts.push('    </measure>');
    parts.push('  </part>');
    parts.push('</score-partwise>');

    return parts.join('\n');
  }

  /**
   * Serialize a single note to MusicXML
   */
  private static serializeNote(note: ScoreNote): string {
    const parts: string[] = [];

    parts.push('      <note>');

    if (note.rest) {
      // Rest
      parts.push('        <rest/>');
    } else if (note.pitch) {
      // Convert shakuhachi pitch to Western pitch
      const westernPitch = this.convertToWesternPitch(note);

      parts.push('        <pitch>');
      parts.push(`          <step>${westernPitch.letter}</step>`);

      if (westernPitch.alter !== 0) {
        parts.push(`          <alter>${westernPitch.alter}</alter>`);
      }

      parts.push(`          <octave>${westernPitch.octave}</octave>`);
      parts.push('        </pitch>');
    }

    // <duration> is the sounding length, so it includes the dot. ScoreNote
    // keeps the two apart: `duration` is the base value and `dotted` extends
    // it by half. Every supported value lands on a whole number of divisions,
    // so there is nothing to round.
    const sounding = note.duration * (note.dotted ? 1.5 : 1);
    parts.push(
      `        <duration>${sounding * DIVISIONS_PER_QUARTER}</duration>`,
    );

    // <type> is the base note value; the dot is carried by <dot/> beside it.
    // The DTD orders these children `type?, dot*`, so type must come first.
    const type = this.getDurationType(note.duration);
    parts.push(`        <type>${type}</type>`);

    if (note.dotted) {
      parts.push('        <dot/>');
    }

    parts.push('      </note>');

    return parts.join('\n');
  }

  /**
   * The written note for a fingering, from the pitch table in reverse. A
   * fingering the table has no note for fails rather than being written as a
   * nearby note, which would read back as a different fingering.
   */
  private static convertToWesternPitch(note: ScoreNote): WrittenPitch {
    if (!note.pitch) {
      throw new Error('Cannot convert rest to Western pitch');
    }

    const written = pitchForFingering({
      step: note.pitch.step,
      octave: note.pitch.octave,
      meriKari: note.meriKari,
    });
    if (!written) {
      throw new Error(
        PARSER_STRINGS.ERRORS.MusicXMLSerializer.unknownFingering(
          note.pitch.step,
          note.pitch.octave,
          note.meriKari,
        ),
      );
    }
    return written;
  }

  /**
   * Get MusicXML note type from duration
   */
  private static getDurationType(duration: number): string {
    if (duration >= 4) {
      return 'whole';
    }
    if (duration >= 2) {
      return 'half';
    }
    if (duration >= 1) {
      return 'quarter';
    }
    if (duration >= 0.5) {
      return 'eighth';
    }
    return 'sixteenth';
  }

  /**
   * Escape XML special characters
   */
  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
