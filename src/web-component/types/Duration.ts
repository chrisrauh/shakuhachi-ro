/**
 * Note lengths in beats
 *
 * A note's `duration` is its length in beats, as an exact fraction written as
 * a string: "1" is one beat, "1/2" half a beat, "3" three beats. Whole beats
 * have no denominator, and fractions are in lowest terms. This module reads
 * those strings and defines which lengths shakuhachi notation can show.
 */

/** A length in beats: num / den, in lowest terms, den 1 for whole beats */
export interface Beats {
  readonly num: number;
  readonly den: number;
}

/**
 * Lengths other than whole beats that notation can show: one line (1/2), two
 * lines (1/4), and a half added to one beat or to half a beat (3/2, 3/4).
 */
const SUPPORTED_FRACTIONS = ['1/2', '1/4', '3/2', '3/4'];

/** Lengths with a half, which can be written with a dot */
const WITH_HALF = ['3/2', '3/4'];

const FRACTION = /^([1-9]\d*)(?:\/([1-9]\d*))?$/;

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * Reads a `duration` string. Returns null unless it is a positive whole number
 * ("3") or a fraction in lowest terms with a denominator above 1 ("3/2").
 */
export function parseBeats(text: string): Beats | null {
  const match = FRACTION.exec(text);
  if (!match) return null;

  const num = Number(match[1]);
  if (match[2] === undefined) return { num, den: 1 };

  const den = Number(match[2]);
  if (den === 1 || gcd(num, den) !== 1) return null;
  return { num, den };
}

/** Writes a length as a `duration` string: "3", "3/2" */
export function formatBeats({ num, den }: Beats): string {
  return den === 1 ? String(num) : `${num}/${den}`;
}

/** Whether notation can show the length (see SUPPORTED_FRACTIONS) */
export function isSupported(beats: Beats): boolean {
  return beats.den === 1 || SUPPORTED_FRACTIONS.includes(formatBeats(beats));
}

/** Whether the length has a half that can be written as a dot: 3/2 or 3/4 */
export function hasHalf(beats: Beats): boolean {
  return WITH_HALF.includes(formatBeats(beats));
}

/** Multiplies a length by n/d, in lowest terms */
function scale({ num, den }: Beats, n: number, d: number): Beats {
  const divisor = gcd(num * n, den * d);
  return { num: (num * n) / divisor, den: (den * d) / divisor };
}

/**
 * The length written before the dot: two thirds of a dotted length, so a
 * dotted 3/2 is written as one beat and its dot. An undotted length is
 * written as itself.
 */
export function writtenLength(beats: Beats, dotted?: boolean): Beats {
  return dotted ? scale(beats, 2, 3) : beats;
}

/** The length of a written length with a dot added: half as long again */
export function dottedLength(written: Beats): Beats {
  return scale(written, 3, 2);
}

/**
 * The `duration` string for a legacy numeric duration, where 2 is one beat
 * and a dot adds half. Null when the result isn't a length notation can show,
 * or is dotted without a half. Goes once stored scores are migrated (#438).
 */
export function beatsFromLegacy(
  duration: number,
  dotted?: boolean,
): string | null {
  // Legacy values are binary fractions (0.5, 0.25…) of the old unit
  let den = 1;
  while (!Number.isInteger(duration * den) && den < 1024) den *= 2;
  if (!(duration > 0) || !Number.isInteger(duration * den)) return null;

  const written = scale({ num: duration * den, den }, 1, 2);
  const beats = dotted ? dottedLength(written) : written;
  if (!isSupported(beats) || (dotted && !hasHalf(beats))) return null;
  return formatBeats(beats);
}

/**
 * A note's duration in the legacy numeric form, where 2 is one beat and a
 * dot adds half. The importers and exporters still work in that form; they
 * move to beats and this goes in the next steps of #438.
 */
export function legacyDuration(note: {
  duration: string | number;
  dotted?: boolean;
}): number {
  if (typeof note.duration === 'number') return note.duration;

  const beats = parseBeats(note.duration);
  if (!beats) throw new Error(`Invalid duration: ${note.duration}`);
  const value = (2 * beats.num) / beats.den;
  return note.dotted ? (value * 2) / 3 : value;
}
