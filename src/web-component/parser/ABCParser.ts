/**
 * ABCParser - Converts ABC notation to shakuhachi JSON format
 *
 * Parses ABC notation and maps pitches to shakuhachi notation.
 * For D shakuhachi (1.8 shaku) in Kinko style.
 *
 * What is saved is the JSON, so the parser imports what JSON can hold, drops
 * only what leaves the music unchanged, and fails on anything else (#464).
 *
 * ABC Notation Reference:
 * - Header fields: X: (index), T: (title), C: (composer), M: (meter), L: (unit length), K: (key)
 *   All are optional; a tune can be just its notes
 * - Notes: A-G (uppercase = octave 4), a-g (lowercase = octave 5), ' (upper octave), , (lower octave)
 * - Accidentals: ^ (sharp), ^^ (double sharp), _ (flat), __ (double flat), = (natural)
 * - Duration: 2 (double), /2 (half), 3/2 (dotted), default is L: value.
 *   Lengths are counted in the tune's first unit length, so 1 is one unit
 * - Broken rhythm: A>B dots A and halves B; A<B halves A and dots B
 * - Rests: z and x (with duration modifiers); Z and X are whole bars of rest,
 *   from M:
 * - Key: K: sets the accidentals of notes written without one. Without K:,
 *   notes read as written. A K: line or inline [K:…] in the body changes the
 *   key from there on
 * - L: and M: in the body change the unit length and the meter from there on.
 *   Other fields in the body (w: lyrics, N:, P:, inline [P:…]) are skipped
 * - Bar lines: | ends the accidentals written in a bar; not kept in output
 * - Repeats (|: :| ::) and first and second endings (|1 :|2 [1 [2) are
 *   played out, as JSON has no repeats
 * - Ties (D2-D2) become one note; tuplets ((3, (p:q:r) scale their notes
 * - Decorations: !name! before a note. One naming a fingering (as our export
 *   writes, e.g. !ri-meri!) chooses it; others are ignored
 * - Chord symbols and annotations ("Am") and slurs ( ) are dropped
 * - Grace notes, chords, a second voice and anything else fail
 * - Lengths must be ones JSON can show: a power of two units, or one and a
 *   half times one. When ScoreData gains lengths (#357), this changes too
 */

import type { ScoreData, ScoreNote } from '../types/ScoreData';
import {
  ABCAccidentals,
  keySignature,
  parseABCPitch,
} from '../constants/abc-pitch-map';
import {
  defaultFingering,
  namedFingering,
} from '../constants/kinko-fingerings';
import { PARSER_STRINGS } from '../constants/parser-strings';

/** A piece of the tune body, as the tokenizer reads it */
type Token =
  | { type: 'bar'; startRepeat: boolean; endRepeat: boolean }
  | { type: 'ending'; number: number }
  | { type: 'field'; name: string; value: string }
  | { type: 'decoration'; name: string }
  | { type: 'tuplet'; p: number; q?: number; r?: number }
  | { type: 'tie' }
  | {
      type: 'note';
      text: string;
      accidental: string;
      letter: string;
      octaveMarks: string;
      length: string;
      broken: string;
    }
  | { type: 'multiRest'; text: string; bars: number };

/** The tokens left once repeats are played out, which drops the endings */
type PlayedToken = Exclude<Token, { type: 'ending' }>;

/**
 * One reader per kind of token, tried in order at each position. Whatever
 * matches none of them fails, so nothing in a tune is skipped unread.
 */
const TOKEN_READERS: [RegExp, (m: RegExpExecArray) => Token[]][] = [
  // Spaces, and ` and \, which ABC uses to group notes and join lines
  [/[\s`\\]+/y, () => []],
  // Chord symbols and annotations are accompaniment, not the melody
  [/"[^"]*"/y, () => []],
  [
    /(:*)(\[\||\|\]|\|\||\|)(:*)(\d*)/y,
    (m) => [
      { type: 'bar', endRepeat: m[1] !== '', startRepeat: m[3] !== '' },
      ...(m[4] ? [ending(m[4])] : []),
    ],
  ],
  [/::/y, () => [{ type: 'bar', endRepeat: true, startRepeat: true }]],
  [/\[(\d+)/y, (m) => [ending(m[1])]],
  [/\[([A-Za-z]):([^\]]*)\]/y, (m) => [field(m[1], m[2])]],
  [/!([^!]*)!/y, (m) => [{ type: 'decoration', name: m[1] }]],
  [
    /\{[^}]*\}?/y,
    (m) => {
      throw new Error(PARSER_STRINGS.ERRORS.ABCParser.graceNotes(m[0]));
    },
  ],
  [
    /\[[^\]]*\]?/y,
    (m) => {
      throw new Error(PARSER_STRINGS.ERRORS.ABCParser.chord(m[0]));
    },
  ],
  [
    /\((\d+)(?::(\d*))?(?::(\d*))?/y,
    (m) => [
      {
        type: 'tuplet',
        p: Number(m[1]),
        q: m[2] ? Number(m[2]) : undefined,
        r: m[3] ? Number(m[3]) : undefined,
      },
    ],
  ],
  // Slurs don't change which notes are played
  [/[()]/y, () => []],
  [/-/y, () => [{ type: 'tie' }]],
  [
    /([ZX])(\d*)/y,
    (m) => [{ type: 'multiRest', text: m[0], bars: Number(m[2] || 1) }],
  ],
  // Any letter, so one that isn't a note fails as an unknown pitch
  [
    /([_=^]{1,2})?([A-Za-z])([',]*)(\/?\d*\/?\d*)([><]?)/y,
    (m) => [
      {
        type: 'note',
        text: m[0],
        accidental: m[1] ?? '',
        letter: m[2],
        octaveMarks: m[3],
        length: m[4],
        broken: m[5],
      },
    ],
  ],
];

function ending(number: string): Token {
  const n = Number(number);
  // Only two passes are played out; see expandRepeats()
  if (n !== 1 && n !== 2) {
    throw new Error(PARSER_STRINGS.ERRORS.ABCParser.laterEnding(number));
  }
  return { type: 'ending', number: n };
}

function field(name: string, value: string): Token {
  return { type: 'field', name, value: value.trim() };
}

/** A fraction such as 1/8 or 3, or undefined when it isn't one */
function parseFraction(value: string): number | undefined {
  const match = value.trim().match(/^(\d+)(?:\/(\d+))?$/);
  if (!match) return undefined;
  const fraction = Number(match[1]) / Number(match[2] ?? 1);
  return fraction > 0 ? fraction : undefined;
}

/**
 * The length of a bar in whole notes, from an M: field: 3/4, 2+3/8, C (4/4)
 * or C| (2/2). Undefined for M:none, or a meter that can't be read.
 */
function parseMeter(value: string): number | undefined {
  const meter = value.trim();
  if (meter === 'C') return 1;
  if (meter === 'C|') return 1;
  const match = meter.match(/^(\d+(?:\+\d+)*)\/(\d+)$/);
  if (!match) return undefined;
  const beats = match[1].split('+').reduce((sum, n) => sum + Number(n), 0);
  return beats / Number(match[2]);
}

/**
 * The unit length a tune gets without L:, from its meter: 1/16 below 3/4,
 * 1/8 otherwise and without M:
 */
function defaultUnitLength(meter: number | undefined): number {
  return meter !== undefined && meter < 0.75 ? 1 / 16 : 1 / 8;
}

/** Whether a field (from the header, a body line or inline) changes the notes */
const NOTE_FIELDS = new Set(['K', 'L', 'M', 'V']);

/**
 * The lengths JSON shows: a power of two units, or one and a half times one
 * (a dotted note). The length snapped to that value, as ties and tuplets add
 * floating point error, or undefined when it is neither.
 */
function renderableLength(length: number): number | undefined {
  const powerOfTwo = (x: number) => {
    const power = 2 ** Math.round(Math.log2(x));
    return Math.abs(x - power) < 1e-9 ? power : undefined;
  };
  const plain = powerOfTwo(length);
  if (plain !== undefined) return plain;
  const base = powerOfTwo(length / 1.5);
  return base === undefined ? undefined : base * 1.5;
}

export class ABCParser {
  /**
   * Parses ABC notation and converts to shakuhachi JSON format
   *
   * @param abcContent - The ABC notation content as string
   * @returns ScoreData object ready for rendering
   */
  static parse(abcContent: string): ScoreData {
    if (!abcContent || !abcContent.trim()) {
      throw new Error(PARSER_STRINGS.ERRORS.ABCParser.contentRequired);
    }

    const lines = abcContent.split('\n');
    let title = 'Untitled';
    let composer: string | undefined;
    let tempo: string | undefined;
    let key: string | undefined;
    let meter: string | undefined;
    let unitLength: string | undefined;
    const voices = new Set<string>();
    let inBody = false;
    const noteLines: string[] = [];

    // Parse header and body
    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('%')) {
        continue;
      }

      // The header is fields such as T:Title. It ends at K:, or, when a
      // tune has no K:, at the first line that isn't a field
      if (!inBody && !/^[A-Za-z]:/.test(trimmed)) {
        inBody = true;
      }

      if (!inBody) {
        if (trimmed.startsWith('X:')) {
          // Index field (not used)
          continue;
        } else if (trimmed.startsWith('T:')) {
          title = trimmed.substring(2).trim() || 'Untitled';
        } else if (trimmed.startsWith('C:')) {
          composer = trimmed.substring(2).trim() || undefined;
        } else if (trimmed.startsWith('M:')) {
          meter = trimmed.substring(2);
        } else if (trimmed.startsWith('L:')) {
          unitLength = trimmed.substring(2);
        } else if (trimmed.startsWith('V:')) {
          voices.add(this.voiceId(trimmed.substring(2)));
        } else if (trimmed.startsWith('Q:')) {
          tempo = trimmed.substring(2).trim();
        } else if (trimmed.startsWith('K:')) {
          key = trimmed.substring(2).trim();
          inBody = true; // K: field marks end of header
        }
      } else {
        // A comment can end any line of the body
        const content = trimmed.replace(/%.*$/, '').trim();
        if (/^[A-Za-z+]:/.test(content)) {
          // A field in the body. Those that change the notes after them are
          // kept as the inline fields they are equivalent to. The rest
          // (lyrics, notes, parts) don't change the notes read
          if (NOTE_FIELDS.has(content[0])) {
            noteLines.push(`[${content}]`);
          }
        } else if (content) {
          noteLines.push(content);
        }
      }
    }

    if (voices.size > 1) {
      throw new Error(PARSER_STRINGS.ERRORS.ABCParser.multipleVoices);
    }

    // Without K:, notes read as written
    const signature = keySignature(key ?? '');
    if (!signature) {
      throw new Error(PARSER_STRINGS.ERRORS.ABCParser.unknownKey(key ?? ''));
    }

    const barLength = meter === undefined ? undefined : parseMeter(meter);
    const unit =
      unitLength === undefined
        ? defaultUnitLength(barLength)
        : this.readUnitLength(unitLength);

    // Parse notes from body
    const tokens = this.expandRepeats(this.tokenize(noteLines.join(' ')));
    const notes = this.readNotes(tokens, {
      accidentals: new ABCAccidentals(signature),
      unit,
      barLength,
      voices,
    });

    return {
      title,
      style: 'kinko',
      notes,
      composer,
      tempo,
      key,
    };
  }

  /** A voice's ID, the first word of its V: field */
  private static voiceId(value: string): string {
    return value.trim().split(/\s+/)[0];
  }

  /** The unit length of an L: field, in whole notes */
  private static readUnitLength(value: string): number {
    const unit = parseFraction(value);
    if (unit === undefined) {
      throw new Error(
        PARSER_STRINGS.ERRORS.ABCParser.invalidUnitLength(value.trim()),
      );
    }
    return unit;
  }

  /**
   * Splits the tune body into tokens, failing on anything that isn't one
   *
   * @param body - The note lines of the tune, joined
   */
  private static tokenize(body: string): Token[] {
    const tokens: Token[] = [];
    let position = 0;
    while (position < body.length) {
      const reader = TOKEN_READERS.find(([regex]) => {
        regex.lastIndex = position;
        return regex.test(body);
      });
      if (!reader) {
        throw new Error(
          PARSER_STRINGS.ERRORS.ABCParser.unknownCharacter(body[position]),
        );
      }
      const [regex, read] = reader;
      regex.lastIndex = position;
      const match = regex.exec(body)!;
      tokens.push(...read(match));
      position = regex.lastIndex;
    }
    return tokens;
  }

  /**
   * Plays out repeats and first and second endings, as JSON has no repeats:
   * |: A :| becomes A A, and |: A |1 B :|2 C | becomes A B A C. A repeat
   * without |: goes back to the start of the tune, or to the end of the last
   * repeat. Bar lines are kept, as they end accidentals.
   */
  private static expandRepeats(tokens: Token[]): PlayedToken[] {
    const played: PlayedToken[] = [];
    let sectionStart = 0;
    let pass = 1;
    // Passing over an ending that isn't this pass's
    let skipping = false;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (skipping) {
        skipping = !(token.type === 'ending' && token.number === pass);
        continue;
      }
      if (token.type === 'ending') {
        skipping = token.number !== pass;
        continue;
      }
      played.push(token);
      if (token.type !== 'bar') continue;

      if (token.endRepeat) {
        if (pass === 1) {
          pass = 2;
          i = sectionStart - 1;
          continue;
        }
        pass = 1;
        sectionStart = i + 1;
      }
      if (token.startRepeat) {
        pass = 1;
        sectionStart = i + 1;
      }
    }
    return played;
  }

  /**
   * Reads the notes from the played-out tokens
   *
   * @param tokens - The tune body, with repeats played out
   * @param context - What is in force at the start of the tune: the key,
   *   the unit length and bar length in whole notes, and the voices declared
   *   in the header
   * @returns Array of ScoreNote objects
   */
  private static readNotes(
    tokens: PlayedToken[],
    context: {
      accidentals: ABCAccidentals;
      unit: number;
      barLength: number | undefined;
      voices: Set<string>;
    },
  ): ScoreNote[] {
    let { accidentals, barLength } = context;
    const { voices } = context;
    // Lengths are counted in the first unit length, so a change scales those
    // after it
    let lengthScale = 1;
    const notes: ScoreNote[] = [];
    // By note index: the ABC it was read from, its broken-rhythm marker
    // (> or <), and whether it is tied to the next note
    const sources: string[] = [];
    const brokenRhythm: string[] = [];
    const tied: boolean[] = [];
    // Decorations seen since the last note
    let decorations: string[] = [];
    // The tuplet the next notes are in: how much each is scaled, and how
    // many notes it has left
    let tuplet = { scale: 1, notesLeft: 0 };

    const push = (note: ScoreNote, source: string, broken = '') => {
      if (tuplet.notesLeft > 0) {
        note.duration *= tuplet.scale;
        tuplet.notesLeft--;
      }
      sources.push(source);
      brokenRhythm.push(broken);
      notes.push(note);
    };

    for (const token of tokens) {
      switch (token.type) {
        case 'bar':
          accidentals.barLine();
          continue;

        case 'field':
          if (token.name === 'K') {
            const signature = keySignature(token.value);
            if (!signature) {
              throw new Error(
                PARSER_STRINGS.ERRORS.ABCParser.unknownKey(token.value),
              );
            }
            accidentals = new ABCAccidentals(signature);
          } else if (token.name === 'L') {
            lengthScale = this.readUnitLength(token.value) / context.unit;
          } else if (token.name === 'M') {
            barLength = parseMeter(token.value);
          } else if (token.name === 'V') {
            voices.add(this.voiceId(token.value));
            if (voices.size > 1) {
              throw new Error(PARSER_STRINGS.ERRORS.ABCParser.multipleVoices);
            }
          }
          // The rest (such as [P:A]) don't change the notes
          continue;

        case 'decoration':
          decorations.push(token.name);
          continue;

        case 'tuplet':
          tuplet = {
            scale: (token.q ?? this.tupletTime(token.p, barLength)) / token.p,
            notesLeft: token.r ?? token.p,
          };
          continue;

        case 'tie':
          if (notes.length === 0) {
            throw new Error(
              PARSER_STRINGS.ERRORS.ABCParser.unknownCharacter('-'),
            );
          }
          tied[notes.length - 1] = true;
          continue;

        case 'multiRest':
          if (barLength === undefined) {
            throw new Error(
              PARSER_STRINGS.ERRORS.ABCParser.multiRestNeedsMeter(token.text),
            );
          }
          push(
            { rest: true, duration: (token.bars * barLength) / context.unit },
            token.text,
          );
          continue;

        case 'note':
          break;
      }

      const noteDecorations = decorations;
      decorations = [];
      const { letter, accidental, octaveMarks } = token;
      const duration = this.calculateDuration(token.length) * lengthScale;

      if (letter === 'z' || letter === 'x') {
        push({ rest: true, duration }, token.text, token.broken);
        continue;
      }
      if (!/^[A-Ga-g]$/.test(letter)) {
        throw new Error(PARSER_STRINGS.ERRORS.ABCParser.unknownPitch(letter));
      }

      // Map to shakuhachi
      const written = parseABCPitch(
        accidental,
        letter,
        octaveMarks,
        accidentals,
      );
      const shakuPitch =
        written &&
        (noteDecorations
          .map((name) => namedFingering(written, name))
          .find(Boolean) ??
          defaultFingering(written));
      if (!shakuPitch) {
        throw new Error(
          PARSER_STRINGS.ERRORS.ABCParser.unknownPitch(
            `${accidental}${letter}${octaveMarks}`,
          ),
        );
      }

      // Sounding length for now; toBaseAndDot() splits out the dot below
      const note: ScoreNote = {
        pitch: {
          step: shakuPitch.step,
          octave: shakuPitch.octave,
        },
        duration,
      };
      if (shakuPitch.meriKari) {
        note.meriKari = shakuPitch.meriKari;
      }
      push(note, token.text, token.broken);
    }

    if (notes.length === 0) {
      throw new Error(PARSER_STRINGS.ERRORS.ABCParser.noNotesFound);
    }

    this.applyBrokenRhythm(notes, brokenRhythm);
    const merged = this.mergeTies(notes, sources, tied);
    merged.forEach(({ note, source }, i) => {
      const length = renderableLength(note.duration);
      if (length === undefined) {
        throw new Error(
          PARSER_STRINGS.ERRORS.ABCParser.unrenderableLength(
            i,
            source,
            note.duration,
          ),
        );
      }
      note.duration = length;
      if (!note.rest) this.toBaseAndDot(note);
    });

    return merged.map(({ note }) => note);
  }

  /**
   * How many notes' time a tuplet of p notes takes when (p:q doesn't say: 3
   * in the time of 2, 2 or 4 in the time of 3, and 5, 7 or 9 in the time of
   * 3 in compound meters such as 6/8, or of 2 otherwise
   */
  private static tupletTime(p: number, barLength: number | undefined): number {
    const times: Record<number, number> = { 2: 3, 3: 2, 4: 3, 6: 2, 8: 3 };
    if (times[p] !== undefined) return times[p];
    // 6/8, 9/8 and 12/8 are compound: bars of three eighths, at least two
    const eighths = (barLength ?? 0) * 8;
    return Number.isInteger(eighths) && eighths % 3 === 0 && eighths > 3
      ? 3
      : 2;
  }

  /**
   * Joins tied notes into one with their lengths added. A tie between notes
   * of different pitches doesn't hold either, so it leaves them as they are.
   */
  private static mergeTies(
    notes: ScoreNote[],
    sources: string[],
    tied: boolean[],
  ): { note: ScoreNote; source: string }[] {
    const merged: { note: ScoreNote; source: string }[] = [];
    notes.forEach((note, i) => {
      const previous = merged[merged.length - 1];
      if (tied[i - 1] && previous && this.samePitch(previous.note, note)) {
        previous.note.duration += note.duration;
        previous.source += `-${sources[i]}`;
      } else {
        merged.push({ note, source: sources[i] });
      }
    });
    return merged;
  }

  private static samePitch(a: ScoreNote, b: ScoreNote): boolean {
    return (
      !a.rest &&
      !b.rest &&
      a.pitch?.step === b.pitch?.step &&
      a.pitch?.octave === b.pitch?.octave &&
      a.meriKari === b.meriKari
    );
  }

  /**
   * Applies ABC broken rhythm to sounding lengths: A>B makes A one and a half
   * times as long and B half as long, so the pair keeps its total; A<B is the
   * reverse. A marker on the last note has no partner, so it only lengthens
   * that note, which keeps older ABC written with a trailing > readable.
   */
  private static applyBrokenRhythm(
    notes: ScoreNote[],
    markers: string[],
  ): void {
    notes.forEach((note, i) => {
      const marker = markers[i];
      if (!marker) return;
      const next = notes[i + 1];
      if (!next) {
        note.duration *= 1.5;
        return;
      }
      const [first, second] = marker === '>' ? [note, next] : [next, note];
      first.duration *= 1.5;
      second.duration *= 0.5;
    });
  }

  /**
   * Splits a sounding length into a base length plus a dot, the way ScoreNote
   * stores it (as MusicXMLParser does): 3/2 becomes a dotted 1, 3 a dotted 2.
   * Lengths that aren't one and a half times a power of two stay as they are.
   */
  private static toBaseAndDot(note: ScoreNote): void {
    const base = note.duration / 1.5;
    if (Number.isInteger(Math.log2(base))) {
      note.duration = base;
      note.dotted = true;
    }
  }

  /**
   * Calculate note duration from ABC suffix
   *
   * @param durationSuffix - ABC duration suffix (e.g., "", "2", "/2", "3/2")
   * @returns Duration value for ScoreNote
   */
  private static calculateDuration(durationSuffix: string): number {
    if (!durationSuffix || durationSuffix.trim() === '') {
      // No suffix = use unit length (typically 1/8 = 1 unit)
      return 1;
    }

    // Handle fraction: "3/2", "/2", "/4"
    if (durationSuffix.includes('/')) {
      const parts = durationSuffix.split('/');

      if (parts[0] === '') {
        // "/2" format = divide unit by denominator
        const divisor = parseInt(parts[1], 10);
        if (isNaN(divisor)) {
          throw new Error(
            PARSER_STRINGS.ERRORS.ABCParser.invalidDuration(durationSuffix),
          );
        }
        return 1 / divisor;
      } else {
        // "3/2" format = multiply by numerator, divide by denominator
        const numerator = parseInt(parts[0], 10);
        const denominator = parseInt(parts[1], 10);
        if (isNaN(numerator) || isNaN(denominator)) {
          throw new Error(
            PARSER_STRINGS.ERRORS.ABCParser.invalidDuration(durationSuffix),
          );
        }
        return numerator / denominator;
      }
    }

    // Handle integer: "2", "3", "4"
    const multiplier = parseInt(durationSuffix, 10);
    if (isNaN(multiplier)) {
      throw new Error(
        PARSER_STRINGS.ERRORS.ABCParser.invalidDuration(durationSuffix),
      );
    }

    return multiplier;
  }

  /**
   * Parses ABC notation from a URL
   *
   * @param url - URL to the ABC file
   * @returns Promise resolving to ScoreData
   */
  static async parseFromURL(url: string): Promise<ScoreData> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        PARSER_STRINGS.ERRORS.ABCParser.loadFailed(response.statusText),
      );
    }
    const abcContent = await response.text();
    return this.parse(abcContent);
  }
}
