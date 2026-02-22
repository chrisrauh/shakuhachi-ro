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
K:D

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
K:D

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
K:D

d' f' g'
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.notes).toHaveLength(3);
      expect(scoreData.notes[0].pitch?.step).toBe('ro'); // d' → ro dai-kan
      expect(scoreData.notes[0].pitch?.octave).toBe(2); // Apostrophe = dai-kan
      expect(scoreData.notes[1].pitch?.step).toBe('tsu'); // f' → tsu dai-kan
      expect(scoreData.notes[1].pitch?.octave).toBe(2);
    });

    it('should parse duration fractions correctly', () => {
      const abc = `
X:1
T:Duration Test
L:1/8
K:D

D2 D/2 D3/2 D
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.notes).toHaveLength(4);
      expect(scoreData.notes[0].duration).toBe(2); // D2 = double unit
      expect(scoreData.notes[1].duration).toBe(0.5); // D/2 = half unit
      expect(scoreData.notes[2].duration).toBe(1.5); // D3/2 = 1.5 unit
      expect(scoreData.notes[3].duration).toBe(1); // D = default unit
    });

    it('should parse dotted notes with > syntax', () => {
      const abc = `
X:1
T:Dotted Test
K:D

D> D
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.notes).toHaveLength(2);
      expect(scoreData.notes[0].dotted).toBe(true); // D> = dotted
      expect(scoreData.notes[1].dotted).toBe(undefined); // D = not dotted
    });

    it('should parse dotted notes with < syntax', () => {
      const abc = `
X:1
T:Dotted Test
K:D

D< D
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.notes).toHaveLength(2);
      expect(scoreData.notes[0].dotted).toBe(true); // D< = dotted
    });

    it('should parse accidentals (sharp → meri)', () => {
      const abc = `
X:1
T:Accidental Test
K:D

^D ^F
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.notes).toHaveLength(2);
      expect(scoreData.notes[0].pitch?.step).toBe('tsu'); // ^D → tsu
      expect(scoreData.notes[0].meri).toBe(true); // Sharp maps to meri
      expect(scoreData.notes[1].pitch?.step).toBe('re'); // ^F → re
      expect(scoreData.notes[1].meri).toBe(true);
    });

    it('should parse accidentals (flat → chu_meri)', () => {
      const abc = `
X:1
T:Accidental Test
K:D

_E
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.notes).toHaveLength(1);
      expect(scoreData.notes[0].pitch?.step).toBe('tsu'); // _E → tsu
      expect(scoreData.notes[0].meri).toBe(true); // Flat maps to meri
    });

    it('should parse accidentals (natural = no meri)', () => {
      const abc = `
X:1
T:Accidental Test
K:D

=D =F
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.notes).toHaveLength(2);
      expect(scoreData.notes[0].pitch?.step).toBe('ro'); // =D → ro
      expect(scoreData.notes[0].meri).toBe(undefined); // Natural = no meri
      expect(scoreData.notes[1].pitch?.step).toBe('tsu'); // =F → tsu
      expect(scoreData.notes[1].meri).toBe(undefined);
    });

    it('should parse rests with duration', () => {
      const abc = `
X:1
T:Rest Test
L:1/8
K:D

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
K:D

D F | G A | C
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.notes).toHaveLength(5); // Bar lines don't create notes
    });

    it('should parse minimal ABC (only required headers)', () => {
      const abc = `
X:1
T:Minimal
K:D

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
K:D

D
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.title).toBe('Untitled');
    });

    it('should handle mixed notes and rests', () => {
      const abc = `
X:1
T:Mixed Test
K:D

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
K:D

^D2 _E/2
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.notes).toHaveLength(2);
      expect(scoreData.notes[0].pitch?.step).toBe('tsu'); // ^D → tsu
      expect(scoreData.notes[0].meri).toBe(true);
      expect(scoreData.notes[0].duration).toBe(2);
      expect(scoreData.notes[1].pitch?.step).toBe('tsu'); // _E → tsu
      expect(scoreData.notes[1].meri).toBe(true);
      expect(scoreData.notes[1].duration).toBe(0.5);
    });

    it('should parse notes with accidental, duration, and dotted', () => {
      const abc = `
X:1
T:Full Test
K:D

^D2>
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.notes).toHaveLength(1);
      expect(scoreData.notes[0].pitch?.step).toBe('tsu'); // ^D → tsu
      expect(scoreData.notes[0].meri).toBe(true);
      expect(scoreData.notes[0].duration).toBe(2);
      expect(scoreData.notes[0].dotted).toBe(true);
    });

    it('should ignore comments and empty lines', () => {
      const abc = `
X:1
T:Comment Test
% This is a comment
K:D

% Another comment
D F
% More comments
G
`;

      const scoreData = ABCParser.parse(abc);

      expect(scoreData.notes).toHaveLength(3);
    });
  });

  describe('parse() - error handling', () => {
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

    it('should throw error if K: field is missing', () => {
      const abc = `
X:1
T:No Key

D F G
`;

      expect(() => ABCParser.parse(abc)).toThrow(
        'ABC notation must include K: (key) field',
      );
    });

    it('should throw error for unknown pitch', () => {
      const abc = `
X:1
T:Invalid Pitch
K:D

X Y Z
`;

      expect(() => ABCParser.parse(abc)).toThrow(/Unknown ABC pitch/);
    });

    it('should throw error for invalid duration format', () => {
      const abc = `
X:1
T:Invalid Duration
K:D

D/abc
`;

      expect(() => ABCParser.parse(abc)).toThrow(/Invalid duration/);
    });

    it('should throw error if no notes found after K: field', () => {
      const abc = `
X:1
T:No Notes
K:D

`;

      expect(() => ABCParser.parse(abc)).toThrow(
        'No notes found in ABC notation',
      );
    });

    it('should provide helpful error message for invalid pitch', () => {
      const abc = `
X:1
T:Test
K:D

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
        expect(abc).toContain('D F G');
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
            { pitch: { step: 'tsu', octave: 0 }, duration: 1, meri: true }, // ^D
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
            { pitch: { step: 'ro', octave: 2 }, duration: 1 }, // d' (apostrophe)
          ],
        };

        const abc = ABCSerializer.serialize(scoreData);

        expect(abc).toContain('D d');
        expect(abc).toContain("d'");
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

        expect(abc).toContain('D>');
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
        expect(reparsed.notes[1].pitch?.step).toBe('tsu'); // F
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
        expect(reparsed.notes[0].meri).toBe(true);
        expect(reparsed.notes[1].meri).toBe(true);
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
        expect(reparsed.notes[2].pitch?.step).toBe('tsu'); // F
        expect(reparsed.notes[3].rest).toBe(true); // z/2
        expect(reparsed.notes[3].duration).toBe(0.5);
      });
    });
  });
});
