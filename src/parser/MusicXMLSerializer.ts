/**
 * MusicXMLSerializer - Converts shakuhachi JSON format to MusicXML
 *
 * Serializes ScoreData to MusicXML string for exporting to Western notation.
 * For D shakuhachi (1.8 shaku) in Kinko style.
 */

import type { ScoreData, ScoreNote, PitchStep } from '../types/ScoreData';

interface WesternPitch {
  step: string; // C, D, E, F, G, A, B
  octave: number; // 4, 5, 6
  alter?: number; // -1 = flat, 0 = natural, 1 = sharp
}

export class MusicXMLSerializer {
  /**
   * Map shakuhachi pitch steps to Western pitch equivalents (for D shakuhachi)
   * Based on KINKO_PITCH_MAP reverse mapping
   */
  private static readonly SHAKU_TO_WESTERN_MAP: Record<
    PitchStep,
    { step: string; baseOctave: number }
  > = {
    ro: { step: 'D', baseOctave: 4 }, // ro otsu = D4
    tsu: { step: 'F', baseOctave: 4 }, // tsu otsu = F4
    re: { step: 'G', baseOctave: 4 }, // re otsu = G4
    u: { step: 'G', baseOctave: 4 }, // u otsu = G#4/Ab4
    chi: { step: 'A', baseOctave: 4 }, // chi otsu = A4
    ri: { step: 'C', baseOctave: 5 }, // ri otsu = C5
    hi: { step: 'C', baseOctave: 6 }, // hi kan = C6
  };

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
      `    <work-title>${this.escapeXml(scoreData.title)}</work-title>`,
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
    parts.push('        <divisions>2</divisions>'); // 2 divisions per quarter note
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
      parts.push(`          <step>${westernPitch.step}</step>`);

      if (westernPitch.alter !== undefined && westernPitch.alter !== 0) {
        parts.push(`          <alter>${westernPitch.alter}</alter>`);
      }

      parts.push(`          <octave>${westernPitch.octave}</octave>`);
      parts.push('        </pitch>');
    }

    // Duration (in divisions - 2 divisions per quarter note)
    // ScoreNote duration: 1 = quarter, 2 = half, 4 = whole
    const divisions = Math.round(note.duration * 2);
    parts.push(`        <duration>${divisions}</duration>`);

    // Dotted note
    if (note.dotted) {
      parts.push('        <dot/>');
    }

    // Note type
    const type = this.getDurationType(note.duration);
    parts.push(`        <type>${type}</type>`);

    parts.push('      </note>');

    return parts.join('\n');
  }

  /**
   * Convert shakuhachi pitch to Western pitch
   */
  private static convertToWesternPitch(note: ScoreNote): WesternPitch {
    if (!note.pitch) {
      throw new Error('Cannot convert rest to Western pitch');
    }

    const mapping = this.SHAKU_TO_WESTERN_MAP[note.pitch.step];
    if (!mapping) {
      throw new Error(`Unknown shakuhachi pitch step: ${note.pitch.step}`);
    }

    // Calculate octave: base octave + shakuhachi octave offset
    // Shakuhachi octave: 0=otsu, 1=kan (+1 octave), 2=daikan (+2 octaves)
    let octave = mapping.baseOctave + note.pitch.octave;

    // Determine alteration based on meri
    let alter: number | undefined;

    if (note.dai_meri) {
      // Dai-meri lowers pitch by ~whole step
      alter = -2;
    } else if (note.chu_meri) {
      // Chu-meri lowers pitch by ~half step (between normal and meri)
      alter = -1;
    } else if (note.meri) {
      // Meri lowers pitch by ~half step
      alter = -1;
    }

    // Special case: 'u' (chi meri) is G# or Ab
    if (note.pitch.step === 'u') {
      alter = 1; // Sharp (G#)
    }

    return {
      step: mapping.step,
      octave,
      alter,
    };
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
