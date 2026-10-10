/**
 * MusicXMLParser Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MusicXMLParser } from './MusicXMLParser';

// Minimal valid MusicXML wrapper
function makeXML(
  bodyXML: string,
  title = 'Test Score',
  composer?: string,
): string {
  const workTitle = `<work><work-title>${title}</work-title></work>`;
  const creatorEl = composer
    ? `<identification><creator type="composer">${composer}</creator></identification>`
    : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise>
  ${workTitle}
  ${creatorEl}
  <part id="P1">
    <measure number="1">
      ${bodyXML}
    </measure>
  </part>
</score-partwise>`;
}

function makeAlteredNote(step: string, alter: number, octave: number): string {
  return `<note>
    <pitch><step>${step}</step><alter>${alter}</alter><octave>${octave}</octave></pitch>
    <duration>2</duration>
  </note>`;
}

function makeNote(
  step: string,
  octave: number,
  duration = 2,
  extras = '',
): string {
  return `<note>
    <pitch><step>${step}</step><octave>${octave}</octave></pitch>
    <duration>${duration}</duration>
    ${extras}
  </note>`;
}

function makeRest(duration = 2, extras = ''): string {
  return `<note><rest/><duration>${duration}</duration>${extras}</note>`;
}

/** An <attributes> block declaring divisions-per-quarter-note, and a time signature */
function makeAttributes(divisions: number, time = ''): string {
  const timeXML = time
    ? `<time><beats>${time.split('/')[0]}</beats><beat-type>${time.split('/')[1]}</beat-type></time>`
    : '';
  return `<attributes><divisions>${divisions}</divisions>${timeXML}</attributes>`;
}

/** A score with one part per entry, each named and holding one measure. */
function makeMultiPartXML(parts: { name: string; body: string }[]): string {
  const ids = parts.map((_, i) => `P${i + 1}`);
  const partList = parts
    .map(
      (p, i) =>
        `<score-part id="${ids[i]}"><part-name>${p.name}</part-name></score-part>`,
    )
    .join('');
  const partElements = parts
    .map(
      (p, i) =>
        `<part id="${ids[i]}"><measure number="1">${p.body}</measure></part>`,
    )
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise>
  <part-list>${partList}</part-list>
  ${partElements}
</score-partwise>`;
}

describe('MusicXMLParser', () => {
  describe('parse()', () => {
    it('should parse valid MusicXML → correct ScoreData', () => {
      // D4 = ro, F4 = tsu, G4 = re
      const xml = makeXML(
        makeNote('D', 4) + makeNote('F', 4) + makeNote('G', 4),
        'My Score',
        'My Composer',
      );

      const score = MusicXMLParser.parse(xml);

      expect(score.title).toBe('My Score');
      expect(score.composer).toBe('My Composer');
      expect(score.style).toBe('kinko');
      expect(score.notes).toHaveLength(3);
      expect(score.notes[0].pitch?.step).toBe('ro');
      expect(score.notes[0].pitch?.octave).toBe(0);
      expect(score.notes[1].pitch?.step).toBe('tsu');
      expect(score.notes[2].pitch?.step).toBe('re');
    });

    it('should produce rest: true for <rest> element', () => {
      const xml = makeXML(makeRest(4));

      const score = MusicXMLParser.parse(xml);

      expect(score.notes).toHaveLength(1);
      expect(score.notes[0].rest).toBe(true);
      expect(score.notes[0].duration).toBe('4');
    });

    it('should scale duration by <divisions>', () => {
      // 4 divisions at 4-per-quarter is one quarter note, not a whole note.
      const xml = makeXML(makeAttributes(4) + makeNote('D', 4, 4));

      const score = MusicXMLParser.parse(xml);

      expect(score.notes[0].duration).toBe('1');
    });

    it('should default to 1 division per quarter when <divisions> is absent', () => {
      const xml = makeXML(makeNote('D', 4, 2));

      const score = MusicXMLParser.parse(xml);

      expect(score.notes[0].duration).toBe('2');
    });

    it('should keep a dotted beat dotted, with the dot in its length', () => {
      // How other notation software writes a dotted quarter: <duration> is the
      // sounding length (3 half-quarters), with the dot carried separately.
      const xml = makeXML(makeAttributes(2) + makeNote('D', 4, 3, '<dot/>'));

      const score = MusicXMLParser.parse(xml);

      expect(score.notes[0].duration).toBe('3/2');
      expect(score.notes[0].dotted).toBe(true);
    });

    it('should read a dotted half in 4/4 as 3 beats, which have no dot', () => {
      const xml = makeXML(makeAttributes(2) + makeRest(6, '<dot/>'));

      const score = MusicXMLParser.parse(xml);

      expect(score.notes[0].rest).toBe(true);
      expect(score.notes[0].duration).toBe('3');
      expect(score.notes[0].dotted).toBeUndefined();
    });

    it('should read a note whose type and dots match its duration', () => {
      const xml = makeXML(
        makeAttributes(4) +
          makeNote('D', 4, 6, '<type>quarter</type><dot/>') +
          makeNote('F', 4, 3, '<type>eighth</type><dot/>'),
      );

      const notes = MusicXMLParser.parse(xml).notes;

      expect(notes.map((n) => n.duration)).toEqual(['3/2', '3/4']);
    });

    it('should fail where the duration contradicts the type and dots', () => {
      // A dotted half written as two beats long, as in a stored score
      const xml = makeXML(
        makeAttributes(2, '4/4') +
          makeNote('D', 4, 4, '<dot/><type>half</type>'),
      );

      expect(() => MusicXMLParser.parse(xml)).toThrow(
        "Measure 1, note 1: the note's duration is 2 beats, but its note type and dots make it 3 beats",
      );
    });

    it("should take the beat from the time signature's beat type", () => {
      // In 6/8 an eighth note is one beat, and a dotted quarter three
      const xml = makeXML(
        makeAttributes(2, '6/8') +
          makeNote('D', 4, 1) +
          makeNote('F', 4, 3, '<dot/>'),
      );

      const notes = MusicXMLParser.parse(xml).notes;

      expect(notes.map((n) => n.duration)).toEqual(['1', '3']);
      expect(notes[1].dotted).toBeUndefined();
    });

    it('should fail on a length notation cannot show, such as a triplet', () => {
      const xml = makeXML(makeAttributes(3) + makeNote('D', 4, 1));

      expect(() => MusicXMLParser.parse(xml)).toThrow(
        'Measure 1, note 1: the note is 1/3 beats long',
      );
    });

    it('should apply a <divisions> change from the measure that makes it', () => {
      const xml = `<?xml version="1.0"?>
<score-partwise>
  <part id="P1">
    <measure number="1">${makeAttributes(1) + makeNote('D', 4, 1)}</measure>
    <measure number="2">${makeAttributes(4) + makeNote('F', 4, 4)}</measure>
  </part>
</score-partwise>`;

      const durations = MusicXMLParser.parse(xml).notes.map((n) => n.duration);

      expect(durations).toEqual(['1', '1']);
    });

    it('should import only the part named shakuhachi from a multi-part file', () => {
      const xml = makeMultiPartXML([
        { name: 'Koto', body: makeNote('A', 4) + makeNote('B', 4) },
        { name: 'Shakuhachi', body: makeNote('D', 4) + makeNote('F', 4) },
      ]);

      const steps = MusicXMLParser.parse(xml).notes.map((n) => n.pitch?.step);

      expect(steps).toEqual(['ro', 'tsu']);
    });

    it('should fail on a multi-part file with no part named shakuhachi', () => {
      const xml = makeMultiPartXML([
        { name: 'Flute', body: makeNote('D', 4) },
        { name: 'Koto', body: makeNote('A', 4) },
      ]);

      expect(() => MusicXMLParser.parse(xml)).toThrow(
        'The file has 2 parts, and none is named shakuhachi',
      );
    });

    it('should fail on a chord, saying where', () => {
      const xml = makeXML(
        makeNote('D', 4) + makeNote('F', 4) + makeNote('A', 4, 2, '<chord/>'),
      );

      expect(() => MusicXMLParser.parse(xml)).toThrow(
        'Measure 1, note 3: the note is part of a chord, and the shakuhachi plays one note at a time.',
      );
    });

    it('should fail on a part with more than one voice, saying where', () => {
      const xml = makeXML(
        makeNote('D', 4, 2, '<voice>1</voice>') +
          '<backup><duration>2</duration></backup>' +
          makeNote('A', 4, 2, '<voice>2</voice>'),
      );

      expect(() => MusicXMLParser.parse(xml)).toThrow(
        'Measure 1: the part has more than one voice',
      );
    });

    it('should fail on timewise MusicXML rather than import nothing', () => {
      const xml = `<?xml version="1.0"?>
<score-timewise>
  <measure number="1"><part id="P1">${makeNote('D', 4)}</part></measure>
</score-timewise>`;

      expect(() => MusicXMLParser.parse(xml)).toThrow('timewise MusicXML');
    });

    it('should fail on a note with no <pitch>, such as percussion', () => {
      const xml = makeXML(
        makeNote('D', 4) + '<note><unpitched/><duration>2</duration></note>',
      );

      expect(() => MusicXMLParser.parse(xml)).toThrow(
        'Measure 1, note 2: the note has no pitch',
      );
    });

    it('should fail on a note outside the range, saying where, why and what to do', () => {
      const xml = makeXML(makeNote('D', 4) + makeNote('A', 3));

      expect(() => MusicXMLParser.parse(xml)).toThrow(
        "Measure 1, note 2: A3 is below the shakuhachi's range (C4–D7). Change or transpose it in the source and import again.",
      );
    });

    it('should count every note that cannot be imported', () => {
      const xml = makeXML(
        makeNote('D', 3) +
          makeNote('E', 3) +
          makeNote('F', 3) +
          makeNote('E', 7),
      );

      expect(() => MusicXMLParser.parse(xml)).toThrow(
        "Measure 1, note 1: D3 is below the shakuhachi's range (C4–D7), and 3 other notes can't be imported either.",
      );
    });

    it('should say when a note is above the range', () => {
      const xml = makeXML(makeNote('E', 7));

      expect(() => MusicXMLParser.parse(xml)).toThrow(
        "E7 is above the shakuhachi's range",
      );
    });

    it('should import every semitone at the top of the range', () => {
      const xml = makeXML(makeAlteredNote('C', 1, 7) + makeNote('D', 7));

      expect(MusicXMLParser.parse(xml).notes.map((n) => n.pitch)).toEqual([
        { step: 'go-no-hi', octave: 2 },
        { step: 'ha', octave: 2 },
      ]);
    });

    it('should keep a fingering named in <technical>, and ignore finger numbers', () => {
      const withFingering = (name: string) =>
        makeAlteredNote('B', -1, 5).replace(
          '</note>',
          `<notations><technical><fingering>${name}</fingering></technical></notations></note>`,
        );
      const xml = makeXML(withFingering('san-no-u') + withFingering('2'));

      expect(MusicXMLParser.parse(xml).notes.map((n) => n.pitch)).toEqual([
        { step: 'san-no-u', octave: 1 },
        { step: 'hi', octave: 1 },
      ]);
    });

    it('should not quote an unrecognised step in the error', () => {
      const xml = makeXML(makeNote('&lt;img src=x&gt;', 4));

      expect(() => MusicXMLParser.parse(xml)).toThrow(
        'Measure 1, note 1: the pitch has no valid step.',
      );
    });

    it('should fail on a quarter-tone alter rather than round it', () => {
      const xml = makeXML(makeAlteredNote('D', -0.5, 4));

      expect(() => MusicXMLParser.parse(xml)).toThrow(
        "D is altered by -0.5 semitones, and microtones can't be imported",
      );
    });

    it('should read sharps and flats through the pitch table', () => {
      const xml = makeXML(
        makeAlteredNote('F', 1, 4) + // F#4 → re meri
          makeAlteredNote('B', -1, 4) + // Bb4 → ri meri
          makeAlteredNote('D', 1, 4) + // D#4 → tsu meri
          makeNote('C', 4), // C4 → ro dai-meri
      );

      const fingerings = MusicXMLParser.parse(xml).notes.map((n) => [
        n.pitch?.step,
        n.meriKari,
      ]);

      expect(fingerings).toEqual([
        ['re', 'meri'],
        ['ri', 'meri'],
        ['tsu', 'meri'],
        ['ro', 'dai-meri'],
      ]);
    });

    it('should give enharmonic spellings the same fingering', () => {
      const sharp = MusicXMLParser.parse(makeXML(makeAlteredNote('F', 1, 4)));
      const flat = MusicXMLParser.parse(makeXML(makeAlteredNote('G', -1, 4)));

      expect(flat.notes).toEqual(sharp.notes);
    });

    it('should default title to "Untitled" when <work-title> is missing', () => {
      const xml = `<?xml version="1.0"?>
<score-partwise>
  <part id="P1">
    <measure number="1">
      ${makeNote('D', 4)}
    </measure>
  </part>
</score-partwise>`;

      const score = MusicXMLParser.parse(xml);

      expect(score.title).toBe('Untitled');
    });

    it('should return empty notes array when no <note> elements exist', () => {
      const xml = makeXML('');

      const score = MusicXMLParser.parse(xml);

      expect(score.title).toBe('Test Score');
      expect(score.notes).toEqual([]);
    });
  });

  describe('parseFromURL()', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('should throw with descriptive message when fetch returns non-ok status', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        new Response(null, { status: 404, statusText: 'Not Found' }),
      );

      await expect(
        MusicXMLParser.parseFromURL('http://example.com/score.xml'),
      ).rejects.toThrow('Not Found');
    });

    it('should throw when fetch rejects (network error)', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

      await expect(
        MusicXMLParser.parseFromURL('http://example.com/score.xml'),
      ).rejects.toThrow('Network error');
    });
  });
});
