import { describe, it, expect } from 'vitest';
import {
  FINGERINGS,
  PITCH_RANGE,
  defaultFingering,
  parseTablePitch,
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
});
