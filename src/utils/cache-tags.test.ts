import { describe, it, expect } from 'vitest';
import { cacheTagForScore } from './cache-tags';

describe('cacheTagForScore', () => {
  it('produces a valid header value for a non-ASCII slug', () => {
    const tag = cacheTagForScore('akatombo-赤とんぼ');

    expect(() => new Headers().set('Netlify-Cache-Tag', tag)).not.toThrow();
  });

  it('leaves an ASCII slug unchanged, so existing cached tags still match', () => {
    expect(cacheTagForScore('akatombo')).toBe('score-akatombo');
  });

  it('keeps distinct slugs distinct', () => {
    expect(cacheTagForScore('赤とんぼ')).not.toBe(cacheTagForScore('とんぼ'));
  });
});
