import { describe, it, expect } from 'vitest';
import { embedJson } from './embed-json';

describe('embedJson', () => {
  it('leaves no literal < that could close a script element', () => {
    const output = embedJson({
      title: '</script><img src=x onerror=alert(1)>',
    });

    expect(output).not.toContain('<');
    expect(output).not.toContain('>');
  });

  it('round-trips through JSON.parse unchanged', () => {
    const score = {
      title: 'Akatombo',
      composer: 'Traditional',
      description: 'A folk song about red dragonflies (赤とんぼ)',
      data_format: 'json',
      data: { notes: [{ pitch: { step: 'ro', octave: 0 }, duration: 1 }] },
    };

    expect(JSON.parse(embedJson(score))).toEqual(score);
  });

  it('preserves a breakout payload verbatim after parsing', () => {
    const title = '</script><img src=x onerror=alert(1)>';

    expect(JSON.parse(embedJson({ title })).title).toBe(title);
  });

  it('escapes ampersands so HTML entities cannot be smuggled in', () => {
    // MusicXML payloads are full of entities; an unescaped & lets an attacker
    // build markup the HTML parser decodes before JSON.parse ever sees it.
    const output = embedJson({ data: '<?xml version="1.0"?>&amp;' });

    expect(output).not.toContain('&');
    expect(JSON.parse(output).data).toBe('<?xml version="1.0"?>&amp;');
  });
});
