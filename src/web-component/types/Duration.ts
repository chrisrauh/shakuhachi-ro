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

/*
 * Notation shows whole beats (the note and a stroke for each extra beat), one
 * line for half a beat, two for a quarter, and a half after any of these:
 * 3/2, 5/2 and up after whole beats, 3/4 after half a beat. The half is
 * written as a dot.
 */

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

/** Whether notation can show the length: whole beats, halves, 1/4 or 3/4 */
export function isSupported({ num, den }: Beats): boolean {
  return den === 1 || den === 2 || (den === 4 && num < 4);
}

/**
 * Whether the length has a half that can be written as a dot: 3/2, 5/2 and up,
 * or 3/4
 */
export function hasHalf({ num, den }: Beats): boolean {
  return (den === 2 && num > 1) || (den === 4 && num === 3);
}

/** Multiplies a length by n/d, in lowest terms */
function scale({ num, den }: Beats, n: number, d: number): Beats {
  const divisor = gcd(num * n, den * d);
  return { num: (num * n) / divisor, den: (den * d) / divisor };
}

/** Adds two lengths, in lowest terms */
function add(a: Beats, b: Beats): Beats {
  return scale(
    { num: a.num * b.den + b.num * a.den, den: a.den * b.den },
    1,
    1,
  );
}

const HALF_BEAT: Beats = { num: 1, den: 2 };

/*
 * A dot fills a slot of the beat it falls in, as a note would: half a beat
 * after a note of a beat or more (a dotted 1 is 3/2, a dotted 2 is 5/2), and a
 * quarter after a half-beat note (3/4). It is not "half as long again": Kinko
 * sources write two and a half beats as a note, a stroke and a dot (#470).
 */

/**
 * The length written before the dot: a dotted 3/2 is written as one beat and
 * its dot, a dotted 3/4 as half a beat and its dot. An undotted length is
 * written as itself.
 */
export function writtenLength(beats: Beats, dotted?: boolean): Beats {
  if (!dotted) return beats;
  return beats.num > beats.den
    ? scale({ num: 2 * beats.num - beats.den, den: beats.den }, 1, 2)
    : scale(beats, 2, 3);
}

/** The length of a written length with a dot added after it */
export function dottedLength(written: Beats): Beats {
  return written.num >= written.den
    ? add(written, HALF_BEAT)
    : scale(written, 3, 2);
}

/**
 * Reduces a whole number of beats over a whole number to lowest terms: the
 * length of `num` divisions when there are `den` to the beat
 */
export function beatsOf(num: number, den: number): Beats {
  return scale({ num, den: 1 }, 1, den);
}

/** A note's length in beats. Fails on a duration it can't read. */
export function noteBeats(note: { duration: string }): Beats {
  const beats = parseBeats(note.duration);
  if (!beats) throw new Error(`Invalid duration: ${note.duration}`);
  return beats;
}
