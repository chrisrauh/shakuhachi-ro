/**
 * ABCParser Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { ABCParser } from './ABCParser';
import { ABCSerializer } from './ABCSerializer';
import type { ScoreData } from '../types/ScoreData';

describe('ABCParser', () => {
  describe('parse()', () => {
    it('should parse valid ABC with all headers', () => {
      const abc = `
X:1
T:Test Score
C:Test Composer
M:4/4
L:1/8
Q:120
K:D

D2 F G A
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.title).toBe('Test Score');
      expect(scoreData.composer).toBe('Test Composer');
      expect(scoreData.tempo).toBe('120');
      expect(scoreData.key).toBe('D');
      expect(scoreData.style).toBe('kinko');
      expect(scoreData.notes).toHaveLength(4);
    });

    it('should parse notes with octave modifiers (uppercase = otsu)', () => {
      const abc = `
X:1
T:Octave Test
K:C

D F G A
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.notes).toHaveLength(4);
      expect(scoreData.notes[0].pitch?.step).toBe('ro'); // D → ro
      expect(scoreData.notes[0].pitch?.octave).toBe(0); // Uppercase = otsu
      expect(scoreData.notes[1].pitch?.step).toBe('tsu'); // F → tsu
      expect(scoreData.notes[1].pitch?.octave).toBe(0);
      expect(scoreData.notes[2].pitch?.step).toBe('re'); // G → re
      expect(scoreData.notes[2].pitch?.octave).toBe(0);
      expect(scoreData.notes[3].pitch?.step).toBe('chi'); // A → chi
      expect(scoreData.notes[3].pitch?.octave).toBe(0);
    });

    it('should parse notes with octave modifiers (lowercase = kan)', () => {
      const abc = `
X:1
T:Octave Test
K:C

d f g a c
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.notes).toHaveLength(5);
      expect(scoreData.notes[0].pitch?.step).toBe('ro'); // d → ro kan
      expect(scoreData.notes[0].pitch?.octave).toBe(1); // Lowercase = kan
      expect(scoreData.notes[1].pitch?.step).toBe('tsu'); // f → tsu kan
      expect(scoreData.notes[1].pitch?.octave).toBe(1);
      expect(scoreData.notes[4].pitch?.step).toBe('ri'); // c → ri
      expect(scoreData.notes[4].pitch?.octave).toBe(0); // c is end of otsu
    });

    it('should parse notes with apostrophe (dai-kan)', () => {
      const abc = `
X:1
T:Octave Test
K:C

d' f' g'
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.notes).toHaveLength(3);
      expect(scoreData.notes[0].pitch?.step).toBe('go-no-hi'); // d' → kan go no hi
      expect(scoreData.notes[0].pitch?.octave).toBe(1);
      expect(scoreData.notes[1].pitch?.step).toBe('tsu'); // f' → tsu dai-kan
      expect(scoreData.notes[1].pitch?.octave).toBe(2);
    });

    it('should parse duration fractions correctly', () => {
      const abc = `
X:1
T:Duration Test
L:1/8
K:C

D2 D/2 D3/2 D
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.notes).toHaveLength(4);
      expect(scoreData.notes[0].duration).toBe(2); // D2 = double unit
      expect(scoreData.notes[1].duration).toBe(0.5); // D/2 = half unit
      // D3/2 = 1.5 units, stored as a dotted 1 like MusicXML dotted notes
      expect(scoreData.notes[2]).toMatchObject({ duration: 1, dotted: true });
      expect(scoreData.notes[3].duration).toBe(1); // D = default unit
    });

    it('should read > as broken rhythm: dot the first note, halve the second', () => {
      const abc = `
X:1
T:Dotted Test
K:C

D> D
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.notes).toHaveLength(2);
      expect(scoreData.notes[0]).toMatchObject({ duration: 1, dotted: true });
      expect(scoreData.notes[1]).toEqual(
        expect.objectContaining({ duration: 0.5 }),
      );
      expect(scoreData.notes[1].dotted).toBeUndefined();
    });

    it('should read < as broken rhythm: halve the first note, dot the second', () => {
      const abc = `
X:1
T:Dotted Test
K:C

D< D
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.notes).toHaveLength(2);
      expect(scoreData.notes[0].duration).toBe(0.5);
      expect(scoreData.notes[0].dotted).toBeUndefined();
      expect(scoreData.notes[1]).toMatchObject({ duration: 1, dotted: true });
    });

    it('should dot a last note that carries >, since it has no partner', () => {
      const scoreData = ABCParser.parse('X:1\nK:C\nD D>');

      expect(scoreData.notes[1]).toMatchObject({ duration: 1, dotted: true });
    });

    it('should parse accidentals (sharp → meri)', () => {
      const abc = `
X:1
T:Accidental Test
K:C

^D ^F
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.notes).toHaveLength(2);
      expect(scoreData.notes[0].pitch?.step).toBe('tsu'); // ^D → tsu
      expect(scoreData.notes[0].meriKari).toBe('meri'); // Sharp maps to meri
      expect(scoreData.notes[1].pitch?.step).toBe('re'); // ^F → re
      expect(scoreData.notes[1].meriKari).toBe('meri');
    });

    it('should parse accidentals (flat → meri)', () => {
      const abc = `
X:1
T:Accidental Test
K:C

_E
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.notes).toHaveLength(1);
      expect(scoreData.notes[0].pitch?.step).toBe('tsu'); // _E → tsu
      expect(scoreData.notes[0].meriKari).toBe('meri'); // Flat maps to meri
    });

    it('should parse accidentals (natural = no meri)', () => {
      const abc = `
X:1
T:Accidental Test
K:C

=D =F
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.notes).toHaveLength(2);
      expect(scoreData.notes[0].pitch?.step).toBe('ro'); // =D → ro
      expect(scoreData.notes[0].meriKari).toBeUndefined(); // Natural = no meri
      expect(scoreData.notes[1].pitch?.step).toBe('tsu'); // =F → tsu
      expect(scoreData.notes[1].meriKari).toBeUndefined();
    });

    it('should parse rests with duration', () => {
      const abc = `
X:1
T:Rest Test
L:1/8
K:C

z2 z/2 z
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.notes).toHaveLength(3);
      expect(scoreData.notes[0].rest).toBe(true);
      expect(scoreData.notes[0].duration).toBe(2); // z2 = double rest
      expect(scoreData.notes[1].rest).toBe(true);
      expect(scoreData.notes[1].duration).toBe(0.5); // z/2 = half rest
      expect(scoreData.notes[2].rest).toBe(true);
      expect(scoreData.notes[2].duration).toBe(1); // z = default rest
    });

    it('should handle bar lines (ignored)', () => {
      const abc = `
X:1
T:Bar Line Test
K:C

D F | G A | C
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.notes).toHaveLength(5); // Bar lines don't create notes
    });

    it('should parse minimal ABC (only required headers)', () => {
      const abc = `
X:1
T:Minimal
K:C

D
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.title).toBe('Minimal');
      expect(scoreData.composer).toBe(undefined);
      expect(scoreData.notes).toHaveLength(1);
    });

    it('should default title to "Untitled" if T: is missing', () => {
      const abc = `
X:1
K:C

D
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.title).toBe('Untitled');
    });

    it('should handle mixed notes and rests', () => {
      const abc = `
X:1
T:Mixed Test
K:C

D2 z F z/2 G
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.notes).toHaveLength(5);
      expect(scoreData.notes[0].pitch?.step).toBe('ro'); // D
      expect(scoreData.notes[1].rest).toBe(true); // z
      expect(scoreData.notes[2].pitch?.step).toBe('tsu'); // F
      expect(scoreData.notes[3].rest).toBe(true); // z/2
      expect(scoreData.notes[4].pitch?.step).toBe('re'); // G
    });

    it('should parse notes with both accidental and duration', () => {
      const abc = `
X:1
T:Combined Test
K:C

^D2 _E/2
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.notes).toHaveLength(2);
      expect(scoreData.notes[0].pitch?.step).toBe('tsu'); // ^D → tsu
      expect(scoreData.notes[0].meriKari).toBe('meri');
      expect(scoreData.notes[0].duration).toBe(2);
      expect(scoreData.notes[1].pitch?.step).toBe('tsu'); // _E → tsu
      expect(scoreData.notes[1].meriKari).toBe('meri');
      expect(scoreData.notes[1].duration).toBe(0.5);
    });

    it('should parse notes with accidental, duration, and dotted', () => {
      const abc = `
X:1
T:Full Test
K:C

^D2>
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.notes).toHaveLength(1);
      expect(scoreData.notes[0].pitch?.step).toBe('tsu'); // ^D → tsu
      expect(scoreData.notes[0].meriKari).toBe('meri');
      expect(scoreData.notes[0].duration).toBe(2);
      expect(scoreData.notes[0].dotted).toBe(true);
    });

    it('should ignore comments and empty lines', () => {
      const abc = `
X:1
T:Comment Test
% This is a comment
K:C

% Another comment
D F
% More comments
G
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.notes).toHaveLength(3);
    });
  });

  describe('parse() - key signatures', () => {
    const fingerings = (abc: string) =>
      ABCParser.parse(abc).notes.map((n) =>
        [n.pitch?.step, n.pitch?.octave, n.meriKari].filter(Boolean).join(' '),
      );

    it('applies the key to notes without an accidental', () => {
      // In D major, F is F♯ and c is C♯
      expect(fingerings('X:1\nK:D\nD F c')).toEqual([
        'ro',
        're meri',
        'ro 1 meri',
      ]);
    });

    it("lets a note's own accidental override the key", () => {
      expect(fingerings('X:1\nK:D\n=F ^D')).toEqual(['tsu', 'tsu meri']);
    });

    it('carries an accidental to the same note until the bar line', () => {
      expect(fingerings('X:1\nK:C\n^F F | F')).toEqual([
        're meri',
        're meri',
        'tsu',
      ]);
    });

    it('carries an accidental only within its octave', () => {
      expect(fingerings('X:1\nK:C\n^F f')).toEqual(['re meri', 'tsu 1']);
    });

    it('reads minor keys and modes', () => {
      // D minor has B♭; D dorian has no sharps or flats; B♭ major has B♭ and E♭
      expect(fingerings('X:1\nK:Dm\nB F')).toEqual(['ri meri', 'tsu']);
      expect(fingerings('X:1\nK:D dorian\nB F c')).toEqual([
        'ri chu-meri',
        'tsu',
        'ri',
      ]);
      expect(fingerings('X:1\nK:Bb\nB E')).toEqual(['ri meri', 'tsu meri']);
    });

    it('reads accidentals listed after the key', () => {
      // exp: only the listed accidentals, here B♭
      expect(fingerings('X:1\nK:D exp _b\nF B')).toEqual(['tsu', 'ri meri']);
      // Without exp they are added to the key's
      expect(fingerings('X:1\nK:D ^g\nF G')).toEqual(['re meri', 'u']);
    });

    it('reads notes as written for K:none, and ignores clef settings', () => {
      expect(fingerings('X:1\nK:none\nF')).toEqual(['tsu']);
      expect(fingerings('X:1\nK:D clef=treble\nF')).toEqual(['re meri']);
    });

    it('reads notes as written when there is no K: field', () => {
      const scoreData = ABCParser.parse('D F G A d');

      expect(scoreData.key).toBeUndefined();
      expect(fingerings('D F G A d')).toEqual([
        'ro',
        'tsu',
        're',
        'chi',
        'ro 1',
      ]);
    });

    it('starts the notes at the first line that is not a header field', () => {
      const scoreData = ABCParser.parse('X:1\nT:No Key\n\nD F');

      expect(scoreData.title).toBe('No Key');
      expect(fingerings('X:1\nT:No Key\n\nD F')).toEqual(['ro', 'tsu']);
    });

    it('fails on a key it cannot read', () => {
      expect(() => ABCParser.parse('X:1\nK:Q\nD')).toThrow(
        'The K: field\'s key, "Q", isn\'t one ABC defines',
      );
    });
  });

  describe('parse() - fields in the tune body', () => {
    const fingerings = (abc: string) =>
      ABCParser.parse(abc).notes.map((n) =>
        [n.pitch?.step, n.pitch?.octave, n.meriKari].filter(Boolean).join(' '),
      );

    it('changes the key from a K: line in the body', () => {
      // D major has C♯, G major doesn't
      expect(fingerings('X:1\nK:D\nc\nK:G\nc')).toEqual(['ro 1 meri', 'ri']);
    });

    it('changes the key from an inline [K:] mid-line', () => {
      expect(fingerings('X:1\nK:D\nc [K:G] c')).toEqual(['ro 1 meri', 'ri']);
    });

    it('skips lyrics and other fields that do not change the notes', () => {
      expect(
        fingerings('X:1\nK:C\nD F\nw: la la\nN:a note\nM:3/4\n[P:A] G'),
      ).toEqual(['ro', 'tsu', 're']);
    });

    // Lengths are read relative to one unit, so the notes after a change
    // would come out the wrong length
    it('fails on a unit length change, as a line or inline', () => {
      const error = "Changing the unit length (L:) after the tune's notes";
      expect(() => ABCParser.parse('X:1\nK:C\nD F\nL:1/4\nG')).toThrow(error);
      expect(() => ABCParser.parse('X:1\nK:C\nD [L:1/4] F')).toThrow(error);
    });

    it('fails on a key change it cannot read', () => {
      expect(() => ABCParser.parse('X:1\nK:D\nD [K:Q] F')).toThrow(
        'The K: field\'s key, "Q", isn\'t one ABC defines',
      );
    });
  });

  describe('parse() - error handling', () => {
    it('should keep a fingering named in a decoration, and ignore other decorations', () => {
      const abc = 'X:1\nK:C\n!san-no-u!_b !trill!_b\n';

      expect(ABCParser.parse(abc).notes.map((n) => n.pitch)).toEqual([
        { step: 'san-no-u', octave: 1 },
        { step: 'hi', octave: 1 },
      ]);
    });

    it('should throw error for empty input', () => {
      expect(() => ABCParser.parse('')).toThrow(
        'ABC notation content is required',
      );
    });

    it('should throw error for whitespace-only input', () => {
      expect(() => ABCParser.parse('   \n  \n  ')).toThrow(
        'ABC notation content is required',
      );
    });

    it('should throw error for unknown pitch', () => {
      const abc = `
X:1
T:Invalid Pitch
K:C

X Y Z
`;

      expect(() => ABCParser.parse(abc)).toThrow(/Unknown ABC pitch/);
    });

    it('should throw error for invalid duration format', () => {
      const abc = `
X:1
T:Invalid Duration
K:C

D/abc
`;

      expect(() => ABCParser.parse(abc)).toThrow(/Invalid duration/);
    });

    it('should throw error if no notes found after K: field', () => {
      const abc = `
X:1
T:No Notes
K:C

`;

      expect(() => ABCParser.parse(abc)).toThrow(
        'No notes found in ABC notation',
      );
    });

    it('should provide helpful error message for invalid pitch', () => {
      const abc = `
X:1
T:Test
K:C

Q
`;

      expect(() => ABCParser.parse(abc)).toThrow(
        /Valid pitches: D, F, G, A, C \(uppercase\/lowercase\)/,
      );
    });
  });

  describe('parseFromURL()', () => {
    it('should throw error for failed fetch', async () => {
      await expect(
        ABCParser.parseFromURL(
          'https://invalid-url-that-does-not-exist.com/score.abc',
        ),
      ).rejects.toThrow();
    });
  });

  describe('ABCSerializer', () => {
    describe('serialize()', () => {
      it('should serialize simple ScoreData to valid ABC', () => {
        const scoreData: ScoreData = {
          title: 'Test Score',
          style: 'kinko',
          notes: [
            { pitch: { step: 'ro', octave: 0 }, duration: 1 }, // D
            { pitch: { step: 'tsu', octave: 0 }, duration: 1 }, // F
            { pitch: { step: 're', octave: 0 }, duration: 1 }, // G
          ],
        };

        const abc = ABCSerializer.serialize(scoreData);

        expect(abc).toContain('T:Test Score');
        expect(abc).toContain('K:D');
        expect(abc).toContain('D =F G');
      });

      it('writes notes relative to the key, and reads them back', () => {
        const notes: ScoreData['notes'] = [
          { pitch: { step: 'tsu', octave: 0 }, duration: 1 },
          { pitch: { step: 're', octave: 0 }, duration: 1, meriKari: 'meri' },
          { pitch: { step: 'tsu', octave: 0 }, duration: 1 },
          { pitch: { step: 'ri', octave: 0 }, duration: 1 },
        ];
        const scoreData: ScoreData = { title: 'T', style: 'kinko', notes };

        const abc = ABCSerializer.serialize(scoreData);

        // K:D makes F sharp, and an accidental lasts to the end of the bar
        expect(abc).toContain('K:D');
        expect(abc).toContain('=F ^F =F =c');
        expect(ABCParser.parse(abc).notes).toEqual(notes);
        expect(
          ABCParser.parse(ABCSerializer.serialize({ ...scoreData, key: 'Dm' }))
            .notes,
        ).toEqual(notes);
      });

      it('fails on a key ABC cannot write', () => {
        const scoreData: ScoreData = {
          title: 'T',
          style: 'kinko',
          key: 'Hirajoshi',
          notes: [{ pitch: { step: 'ro', octave: 0 }, duration: 1 }],
        };

        expect(() => ABCSerializer.serialize(scoreData)).toThrow(
          'The score\'s key, "Hirajoshi", isn\'t one ABC defines',
        );
      });

      it('should serialize ScoreData with composer', () => {
        const scoreData: ScoreData = {
          title: 'Test Score',
          composer: 'Test Composer',
          style: 'kinko',
          notes: [{ pitch: { step: 'ro', octave: 0 }, duration: 1 }],
        };

        const abc = ABCSerializer.serialize(scoreData);

        expect(abc).toContain('C:Test Composer');
      });

      it('should serialize ScoreData with tempo', () => {
        const scoreData: ScoreData = {
          title: 'Test Score',
          tempo: '120',
          style: 'kinko',
          notes: [{ pitch: { step: 'ro', octave: 0 }, duration: 1 }],
        };

        const abc = ABCSerializer.serialize(scoreData);

        expect(abc).toContain('Q:120');
      });

      it('should serialize notes with meri modifier', () => {
        const scoreData: ScoreData = {
          title: 'Test',
          style: 'kinko',
          notes: [
            {
              pitch: { step: 'tsu', octave: 0 },
              duration: 1,
              meriKari: 'meri',
            }, // ^D
          ],
        };

        const abc = ABCSerializer.serialize(scoreData);

        expect(abc).toContain('^D');
      });

      it('should serialize notes with different octaves', () => {
        const scoreData: ScoreData = {
          title: 'Test',
          style: 'kinko',
          notes: [
            { pitch: { step: 'ro', octave: 0 }, duration: 1 }, // D (uppercase)
            { pitch: { step: 'ro', octave: 1 }, duration: 1 }, // d (lowercase)
            { pitch: { step: 'tsu', octave: 2 }, duration: 1 }, // =f' (apostrophe; natural, as K:D makes f sharp)
          ],
        };

        const abc = ABCSerializer.serialize(scoreData);

        expect(abc).toContain("D d =f'");
      });

      it('should fail on a note whose step is not valid', () => {
        const scoreData = {
          title: 'Test',
          notes: [
            { pitch: { step: 'ro', octave: 0 }, duration: 1 },
            { pitch: { step: 'go', octave: 0 }, duration: 1 },
          ],
        } as unknown as ScoreData;

        expect(() => ABCSerializer.serialize(scoreData)).toThrow(
          "Note 2 has a step, octave or meri/kari mark that isn't valid.",
        );
      });

      it('should serialize notes with dotted flag', () => {
        const scoreData: ScoreData = {
          title: 'Test',
          style: 'kinko',
          notes: [
            { pitch: { step: 'ro', octave: 0 }, duration: 1, dotted: true },
          ],
        };

        const abc = ABCSerializer.serialize(scoreData);

        // Written as its sounding length: > would also halve the next note
        expect(abc).toContain('D3/2');
        expect(abc).not.toContain('>');
      });

      it('keeps each note length and dot through ABC and back', () => {
        const notes: ScoreData['notes'] = [
          { pitch: { step: 'ro', octave: 0 }, duration: 1, dotted: true },
          { pitch: { step: 'tsu', octave: 0 }, duration: 0.5 },
          { pitch: { step: 're', octave: 0 }, duration: 2, dotted: true },
          { pitch: { step: 'chi', octave: 0 }, duration: 0.5, dotted: true },
          { pitch: { step: 'ri', octave: 0 }, duration: 1 },
        ];

        const back = ABCParser.parse(
          ABCSerializer.serialize({ title: 'T', style: 'kinko', notes }),
        );

        expect(back.notes).toEqual(notes);
      });

      it('should serialize rests', () => {
        const scoreData: ScoreData = {
          title: 'Test',
          style: 'kinko',
          notes: [
            { rest: true, duration: 2 },
            { rest: true, duration: 0.5 },
          ],
        };

        const abc = ABCSerializer.serialize(scoreData);

        expect(abc).toContain('z2');
        expect(abc).toContain('z/2');
      });

      it('should serialize durations correctly', () => {
        const scoreData: ScoreData = {
          title: 'Test',
          style: 'kinko',
          notes: [
            { pitch: { step: 'ro', octave: 0 }, duration: 2 }, // D2
            { pitch: { step: 'tsu', octave: 0 }, duration: 0.5 }, // F/2
            { pitch: { step: 're', octave: 0 }, duration: 1.5 }, // G3/2
            { pitch: { step: 'chi', octave: 0 }, duration: 1 }, // A (no suffix)
          ],
        };

        const abc = ABCSerializer.serialize(scoreData);

        expect(abc).toContain('D2');
        expect(abc).toContain('F/2');
        expect(abc).toContain('G3/2');
        expect(abc).toMatch(/A(?!\d)/); // A with no digit after
      });

      it('should round-trip: ABC → ScoreData → ABC preserves notes', () => {
        const originalAbc = `
X:1
T:Round Trip Test
K:D

D2 F G/2 A>
`;

        const scoreData = ABCParser.parse(originalAbc);
        const serializedAbc = ABCSerializer.serialize(scoreData);

        // Parse serialized ABC
        const reparsed = ABCParser.parse(serializedAbc);

        // Should have same number of notes
        expect(reparsed.notes).toHaveLength(scoreData.notes.length);

        // Should have same pitches
        expect(reparsed.notes[0].pitch?.step).toBe('ro'); // D
        expect(reparsed.notes[1].pitch?.step).toBe('re'); // F is F♯ in D
        expect(reparsed.notes[1].meriKari).toBe('meri');
        expect(reparsed.notes[2].pitch?.step).toBe('re'); // G
        expect(reparsed.notes[3].pitch?.step).toBe('chi'); // A

        // Should have same durations
        expect(reparsed.notes[0].duration).toBe(2); // D2
        expect(reparsed.notes[1].duration).toBe(1); // F
        expect(reparsed.notes[2].duration).toBe(0.5); // G/2
        expect(reparsed.notes[3].duration).toBe(1); // A

        // Should preserve dotted flag
        expect(reparsed.notes[3].dotted).toBe(true); // A>
      });

      it('should round-trip with meri notes', () => {
        const originalAbc = `
X:1
T:Meri Test
K:D

^D _E
`;

        const scoreData = ABCParser.parse(originalAbc);
        const serializedAbc = ABCSerializer.serialize(scoreData);
        const reparsed = ABCParser.parse(serializedAbc);

        // Both should have meri flag
        expect(reparsed.notes[0].meriKari).toBe('meri');
        expect(reparsed.notes[1].meriKari).toBe('meri');
      });

      it('should round-trip with rests', () => {
        const originalAbc = `
X:1
T:Rest Test
K:D

D z2 F z/2
`;

        const scoreData = ABCParser.parse(originalAbc);
        const serializedAbc = ABCSerializer.serialize(scoreData);
        const reparsed = ABCParser.parse(serializedAbc);

        expect(reparsed.notes).toHaveLength(4);
        expect(reparsed.notes[0].pitch?.step).toBe('ro'); // D
        expect(reparsed.notes[1].rest).toBe(true); // z2
        expect(reparsed.notes[1].duration).toBe(2);
        expect(reparsed.notes[2].pitch?.step).toBe('re'); // F is F♯ in D
        expect(reparsed.notes[3].rest).toBe(true); // z/2
        expect(reparsed.notes[3].duration).toBe(0.5);
      });
    });
  });
});
