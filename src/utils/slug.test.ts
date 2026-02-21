import { describe, it, expect } from 'vitest';
import { generateSlug, ensureUniqueSlug } from './slug';

describe('generateSlug', () => {
  it('converts to lowercase and replaces spaces with hyphens', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
    expect(generateSlug('Love Story')).toBe('love-story');
  });

  it('removes apostrophes and special characters', () => {
    expect(generateSlug("San'ya Sugagaki")).toBe('sanya-sugagaki');
    expect(generateSlug('Akatombo (赤とんぼ)')).toBe('akatombo');
  });

  it('collapses multiple hyphens and trims', () => {
    expect(generateSlug('--hello---world--')).toBe('hello-world');
  });

  it('produces empty slug for non-ASCII-only input', () => {
    expect(generateSlug('赤とんぼ')).toBe('');
    expect(generateSlug('!@#$%')).toBe('');
  });
});

describe('ensureUniqueSlug', () => {
  it('returns original slug when unique', () => {
    expect(ensureUniqueSlug('akatombo', [])).toBe('akatombo');
    expect(ensureUniqueSlug('akatombo', ['love-story'])).toBe('akatombo');
  });

  it('appends -2 for first conflict', () => {
    expect(ensureUniqueSlug('akatombo', ['akatombo'])).toBe('akatombo-2');
  });

  it('increments counter until unique', () => {
    expect(ensureUniqueSlug('test', ['test', 'test-2', 'test-3'])).toBe(
      'test-4',
    );
  });
});
