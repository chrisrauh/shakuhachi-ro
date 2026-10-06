import { describe, it, expect } from 'vitest';
import {
  FINGERINGS,
  PITCH_RANGE,
  defaultFingering,
  namedFingering,
  parseTablePitch,
  pitchForFingering,
  type WrittenFingering,
} from './kinko-fingerings';
import { MusicXMLSerializer } from '../parser/MusicXMLSerializer';
import { MusicXMLParser } from '../parser/MusicXMLParser';
import { ABCSerializer } from '../parser/ABCSerializer';
import { ABCParser } from '../parser/ABCParser';
import type { ScoreNote } from '../types/ScoreData';

const LETTERS = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

/** Every semitone from C4 to D7, as table pitches */
const RANGE = Array.from({ length: 39 }, (_, i) => {
  return `${LETTERS[i % 12]}${4 + Math.floor(i / 12)}`;
});

const toNote = ({ step, octave, meriKari }: WrittenFingering): ScoreNote => ({
  pitch: { step, octave },
  duration: 1,
  ...(meriKari && { meriKari }),
});

const named = FINGERINGS.flatMap((f) => (f.written ? [f.written] : []));

describe('fingering table', () => {
  it("lists Koga's 84 fingerings, in order, with five holes each", () => {
    const koga = FINGERINGS.filter((f) => f.koga !== undefined);
    expect(koga.map((f) => f.koga)).toEqual(
      Array.from({ length: 84 }, (_, i) => i + 1),
    );
    for (const { holes } of FINGERINGS) {
      expect(holes).toMatch(/^[●○◐◕◔]{5}$/);
    }
  });

  it('spans C4–D7', () => {
    expect(PITCH_RANGE).toBe('C4–D7');
  });

  it('gives every pitch in range one default, except D♭7, which no chart names', () => {
    const missing = RANGE.filter(
      (pitch) => !defaultFingering(parseTablePitch(pitch)),
    );
    expect(missing).toEqual(['C#7']);
  });

  it('says where every row that is not from Koga comes from', () => {
    for (const f of FINGERINGS) {
      if (f.koga === undefined) expect(f.source).toBeTruthy();
    }
  });

  it('can store several sets of holes for one fingering, all at one pitch', () => {
    const kanHi = FINGERINGS.filter(
      ({ written }) =>
        written?.step === 'hi' && written.octave === 1 && !written.meriKari,
    );

    expect(kanHi.map((f) => f.holes)).toEqual(['●○○●●', '●○○○●']);
    expect(new Set(kanHi.map((f) => f.pitch))).toEqual(new Set(['C6']));
  });

  it('marks only named fingerings as defaults', () => {
    for (const f of FINGERINGS) {
      if (f.default) expect(f.written).toBeDefined();
    }
  });

  it('keeps every named fingering through MusicXML and back', () => {
    const notes = named.map(toNote);
    const xml = MusicXMLSerializer.serialize({ title: 'All', notes });
    expect(MusicXMLParser.parse(xml).notes).toEqual(notes);
  });

  it('keeps every named fingering through ABC and back', () => {
    const notes = named.map(toNote);
    const abc = ABCSerializer.serialize({ title: 'All', notes });
    expect(ABCParser.parse(abc).notes).toEqual(notes);
  });

  describe('fingerings no chart lists', () => {
    const unlisted: WrittenFingering[] = [
      { step: 'ri', octave: 1 }, // kan ri
      { step: 'ri', octave: 1, meriKari: 'meri' }, // as otsu ri meri, a tone down
      { step: 'ro', octave: 0, meriKari: 'kari' }, // no ro kari anywhere
      { step: 're', octave: 0, meriKari: 'chu-meri' },
      { step: 'chi', octave: 0, meriKari: 'dai-kari' },
    ];

    it('estimates a pitch from the character, the octave and the mark', () => {
      expect(unlisted.map(pitchForFingering)).toEqual([
        { letter: 'C', alter: 0, octave: 6 },
        { letter: 'A', alter: 1, octave: 5 },
        { letter: 'D', alter: 1, octave: 4 },
        { letter: 'F', alter: 1, octave: 4 },
        { letter: 'A', alter: 1, octave: 4 },
      ]);
    });

    it('keeps them through MusicXML and ABC, and back', () => {
      const notes = unlisted.map(toNote);
      const xml = MusicXMLSerializer.serialize({ title: 'Unlisted', notes });
      const abc = ABCSerializer.serialize({ title: 'Unlisted', notes });

      expect(MusicXMLParser.parse(xml).notes).toEqual(notes);
      expect(ABCParser.parse(abc).notes).toEqual(notes);
    });

    it("gives the pitch's default when the note was changed after export", () => {
      // Exported as C6, then moved to D6 in other software
      expect(
        namedFingering({ letter: 'D', alter: 0, octave: 6 }, 'ri'),
      ).toBeUndefined();
    });
  });
});
