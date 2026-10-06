/**
 * ABC Notation Pitch Spelling
 *
 * Converts between ABC pitch notation and written Western notes. Which
 * fingering a note gets is decided by the shared pitch table in
 * kinko-fingerings.ts, the same one MusicXML uses.
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
 * A note without its own accidental takes the key signature's, unless an
 * earlier note in the same bar, at the same letter and octave, had one: that
 * accidental lasts to the bar line, as in staff notation.
 */

import type { NoteLetter, WrittenPitch } from './kinko-fingerings';

const ACCIDENTAL_ALTER: Record<string, number> = {
  '=': 0,
  '^': 1,
  '^^': 2,
  _: -1,
  __: -2,
};

/** The alteration a key gives each letter it changes, e.g. D → F and C +1 */
export type KeySignature = Partial<Record<NoteLetter, number>>;

/** Sharps in the major key on each natural tonic; negative for flats */
const TONIC_FIFTHS: Record<NoteLetter, number> = {
  F: -1,
  C: 0,
  G: 1,
  D: 2,
  A: 3,
  E: 4,
  B: 5,
};

/** How far each mode's key signature is from the major key of its tonic */
const MODE_FIFTHS: Record<string, number> = {
  maj: 0,
  ion: 0,
  min: -3,
  aeo: -3,
  mix: -1,
  dor: -2,
  phr: -4,
  lyd: 1,
  loc: -5,
};

/** Letters in the order a key signature adds sharps; flats are the reverse */
const SHARP_ORDER: NoteLetter[] = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];

/**
 * Reads the key signature of a K: field: a tonic and mode ("D", "Dm",
 * "D dorian", "Bbmix"), or "none", then optional accidentals ("^g _b") that
 * add to it, or replace it after "exp". Settings such as clef=bass are
 * skipped. Undefined when the field isn't a key ABC defines.
 */
export function keySignature(key: string): KeySignature | undefined {
  const tokens = key
    .trim()
    .split(/\s+/)
    .filter((token) => token && !/^[a-z-]+=/i.test(token));
  let signature: KeySignature = {};
  let rest: string[];

  if (tokens[0] && tokens[0].toLowerCase() !== 'none') {
    const tonic = tokens[0].match(/^([A-G])([#b]?)([A-Za-z]*)$/);
    if (!tonic) return undefined;
    let modeName = tonic[3];
    rest = tokens.slice(1);
    if (!modeName && /^[a-z]+$/i.test(rest[0] ?? '') && rest[0] !== 'exp') {
      modeName = rest[0];
      rest = rest.slice(1);
    }
    const mode =
      modeName.toLowerCase() === 'm'
        ? 'min'
        : modeName.toLowerCase().slice(0, 3);
    const modeFifths = MODE_FIFTHS[mode || 'maj'];
    if (modeFifths === undefined) return undefined;
    const sharps =
      TONIC_FIFTHS[tonic[1] as NoteLetter] +
      (tonic[2] === '#' ? 7 : tonic[2] === 'b' ? -7 : 0) +
      modeFifths;
    // More than 7 would need double sharps or flats, which no key has
    if (Math.abs(sharps) > 7) return undefined;
    for (let i = 0; i < Math.abs(sharps); i++) {
      if (sharps > 0) signature[SHARP_ORDER[i]] = 1;
      else signature[SHARP_ORDER[6 - i]] = -1;
    }
  } else {
    rest = tokens.slice(1);
  }

  for (const token of rest) {
    if (token === 'exp') {
      signature = {};
      continue;
    }
    const accidental = token.match(/^(\^\^|\^|__|_|=)([a-g])$/i);
    if (!accidental) return undefined;
    signature[accidental[2].toUpperCase() as NoteLetter] =
      ACCIDENTAL_ALTER[accidental[1]];
  }
  return signature;
}

/**
 * The accidentals in force at a point in a tune: the key signature, and
 * those written earlier in the bar. Import and export both use it, so a
 * note reads back as the pitch it was written for.
 */
export class ABCAccidentals {
  private inBar = new Map<string, number>();

  constructor(private readonly signature: KeySignature) {}

  /** The alteration a note written without an accidental gets */
  implied(letter: NoteLetter, octave: number): number {
    return this.inBar.get(`${letter}${octave}`) ?? this.signature[letter] ?? 0;
  }

  /** Records an accidental written on a note, for the rest of the bar */
  write(letter: NoteLetter, octave: number, alter: number): void {
    this.inBar.set(`${letter}${octave}`, alter);
  }

  barLine(): void {
    this.inBar.clear();
  }
}

/**
 * Reads an ABC pitch from its parts, e.g. ("^", "c", "'") → C#6. A note
 * without an accidental takes the one in force. Undefined when the
 * accidental is not one ABC defines.
 */
export function parseABCPitch(
  accidental: string,
  letter: string,
  octaveMarks: string,
  accidentals: ABCAccidentals,
): WrittenPitch | undefined {
  const isLower = letter === letter.toLowerCase();
  const ups = octaveMarks.split("'").length - 1;
  const downs = octaveMarks.split(',').length - 1;
  const noteLetter = letter.toUpperCase() as NoteLetter;
  const octave = (isLower ? 5 : 4) + ups - downs;
  if (!accidental) {
    return {
      letter: noteLetter,
      alter: accidentals.implied(noteLetter, octave),
      octave,
    };
  }
  const alter = ACCIDENTAL_ALTER[accidental];
  if (alter === undefined) {
    return undefined;
  }
  accidentals.write(noteLetter, octave, alter);
  return { letter: noteLetter, alter, octave };
}

/**
 * Writes a note as ABC, e.g. C#6 → "^c'", with an accidental only where the
 * one in force differs
 */
export function toABCPitch(
  { letter, alter, octave }: WrittenPitch,
  accidentals: ABCAccidentals,
): string {
  let accidental = '';
  if (alter !== accidentals.implied(letter, octave)) {
    accidental =
      alter > 0 ? '^'.repeat(alter) : alter < 0 ? '_'.repeat(-alter) : '=';
    accidentals.write(letter, octave, alter);
  }
  if (octave >= 5) {
    return `${accidental}${letter.toLowerCase()}${"'".repeat(octave - 5)}`;
  }
  return `${accidental}${letter}${','.repeat(4 - octave)}`;
}
