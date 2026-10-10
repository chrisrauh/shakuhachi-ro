/**
 * MusicXMLSerializer - Converts shakuhachi JSON format to MusicXML
 *
 * Serializes ScoreData to MusicXML string for exporting to Western notation.
 * For D shakuhachi (1.8 shaku) in Kinko style.
 */

import type { ScoreData, ScoreNote } from '../types/ScoreData';
import { formatBeats, noteBeats, writtenLength } from '../types/Duration';
import { PARSER_STRINGS } from '../constants/parser-strings';
import {
  fingeringName,
  isDefaultFingering,
  pitchForFingering,
  type WrittenFingering,
  type WrittenPitch,
} from '../constants/kinko-fingerings';

/**
 * Divisions per quarter note, which is one beat.
 *
 * MusicXML defines no standard value; exporters derive one per score from the
 * shortest note present. The shortest length notation shows is a quarter of a
 * beat, so 4 keeps every supported length a whole number of divisions. Well
 * under the 16383 ceiling the spec names for MIDI compatibility.
 */
const DIVISIONS_PER_QUARTER = 4;

/** The MusicXML note type for each written length in beats */
const NOTE_TYPES: Record<string, string> = {
  '4': 'whole',
  '2': 'half',
  '1': 'quarter',
  '1/2': 'eighth',
  '1/4': '16th',
};

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
    scoreData.notes.forEach((note, index) => {
      parts.push(this.serializeNote(note, index));
    });

    parts.push('    </measure>');
    parts.push('  </part>');
    parts.push('</score-partwise>');

    return parts.join('\n');
  }

  /**
   * Serialize a single note to MusicXML
   */
  private static serializeNote(note: ScoreNote, index: number): string {
    const parts: string[] = [];
    const fingering: WrittenFingering | undefined = note.pitch && {
      ...note.pitch,
      meriKari: note.meriKari,
    };

    parts.push('      <note>');

    if (note.rest) {
      // Rest
      parts.push('        <rest/>');
    } else if (fingering) {
      const westernPitch = this.convertToWesternPitch(fingering, index);

      parts.push('        <pitch>');
      parts.push(`          <step>${westernPitch.letter}</step>`);

      if (westernPitch.alter !== 0) {
        parts.push(`          <alter>${westernPitch.alter}</alter>`);
      }

      parts.push(`          <octave>${westernPitch.octave}</octave>`);
      parts.push('        </pitch>');
    }

    // <duration> is the sounding length, so it includes the dot, as
    // `duration` does. One beat is a quarter note.
    const beats = noteBeats(note);
    parts.push(
      `        <duration>${(beats.num * DIVISIONS_PER_QUARTER) / beats.den}</duration>`,
    );

    // <type> is the written note value; the dot is carried by <dot/> beside
    // it. A length no single note value shows, such as 3 beats, has no type,
    // which MusicXML allows. The DTD orders these children `type?, dot*`.
    const type = NOTE_TYPES[formatBeats(writtenLength(beats, note.dotted))];
    if (type) {
      parts.push(`        <type>${type}</type>`);
    }

    if (note.dotted) {
      parts.push('        <dot/>');
    }

    // Several fingerings can share a pitch. One that import wouldn't choose
    // for its pitch is named, so it reads back as itself. Other software
    // shows <fingering> as text by the note.
    if (fingering && !isDefaultFingering(fingering)) {
      parts.push('        <notations>');
      parts.push('          <technical>');
      parts.push(
        `            <fingering>${fingeringName(fingering)}</fingering>`,
      );
      parts.push('          </technical>');
      parts.push('        </notations>');
    }

    parts.push('      </note>');

    return parts.join('\n');
  }

  /**
   * The written note for a fingering: its pitch in the fingering table, or an
   * estimate for one the table doesn't list (see pitchForFingering). Fails
   * only for a step, octave or mark that isn't valid.
   */
  private static convertToWesternPitch(
    fingering: WrittenFingering,
    index: number,
  ): WrittenPitch {
    const written = pitchForFingering(fingering);
    if (!written) {
      throw new Error(PARSER_STRINGS.ERRORS.Serializer.invalidFingering(index));
    }
    return written;
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
