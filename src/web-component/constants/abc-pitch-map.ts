/**
 * ABC Notation Pitch Spelling
 *
 * Converts between ABC pitch notation and written Western notes. Which
 * fingering a note gets is decided by the shared pitch table in
 * kinko-pitch-map.ts, the same one MusicXML uses.
 *
 * ABC Notation Octave System:
 * - Uppercase letters (C-B) = octave 4 (middle C to B4)
 * - Lowercase letters (c-b) = octave 5 (C5 to B5)
 * - Apostrophe after lowercase (c', d') = octave 6+
 * - Comma after uppercase (C, D,) = octave 3 and below
 *
 * ABC Accidentals:
 * - ^ (sharp) raises pitch by half step
 * - ^^ (double sharp) raises pitch by whole step
 * - _ (flat) lowers pitch by half step
 * - __ (double flat) lowers pitch by whole step
 * - = (natural) cancels previous accidentals
 *
 * Key signatures are not applied: "F" is always F natural.
 */

import type { NoteLetter, WrittenPitch } from './kinko-pitch-map';

const ACCIDENTAL_ALTER: Record<string, number> = {
  '': 0,
  '=': 0,
  '^': 1,
  '^^': 2,
  _: -1,
  __: -2,
};

/**
 * Reads an ABC pitch from its parts, e.g. ("^", "c", "'") → C#6.
 * Undefined when the accidental is not one ABC defines.
 */
export function parseABCPitch(
  accidental: string,
  letter: string,
  octaveMarks: string,
): WrittenPitch | undefined {
  const alter = ACCIDENTAL_ALTER[accidental];
  if (alter === undefined) {
    return undefined;
  }
  const isLower = letter === letter.toLowerCase();
  const ups = octaveMarks.split("'").length - 1;
  const downs = octaveMarks.split(',').length - 1;
  return {
    letter: letter.toUpperCase() as NoteLetter,
    alter,
    octave: (isLower ? 5 : 4) + ups - downs,
  };
}

/** Writes a note as ABC, e.g. C#6 → "^c'" */
export function toABCPitch({ letter, alter, octave }: WrittenPitch): string {
  const accidental = alter > 0 ? '^'.repeat(alter) : '_'.repeat(-alter);
  if (octave >= 5) {
    return `${accidental}${letter.toLowerCase()}${"'".repeat(octave - 5)}`;
  }
  return `${accidental}${letter}${','.repeat(4 - octave)}`;
}
