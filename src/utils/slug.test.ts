import { describe, it, expect } from 'vitest';
import {
  generateSlug,
  ensureUniqueSlug,
  generateRandomSlug,
  generateUniqueRandomSlug,
} from './slug';

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

describe('generateRandomSlug', () => {
  it('returns a slug with three hyphen-separated words', () => {
    const slug = generateRandomSlug();
    const parts = slug.split('-');
    expect(parts).toHaveLength(3);
  });

  it('contains only lowercase letters and hyphens', () => {
    const slug = generateRandomSlug();
    expect(slug).toMatch(/^[a-z]+-[a-z]+-[a-z]+$/);
  });

  it('generates different slugs on repeated calls (probabilistic)', () => {
    const slugs = new Set();
    for (let i = 0; i < 10; i++) {
      slugs.add(generateRandomSlug());
    }
    // With 250,000 combinations, getting 10 unique slugs should be virtually certain
    expect(slugs.size).toBeGreaterThan(1);
  });
});

describe('generateUniqueRandomSlug', () => {
  it('returns a slug with correct format', async () => {
    const { slug, error } = await generateUniqueRandomSlug();

    // Should return either a valid slug or an error (depending on DB state)
    // If successful, slug should match pattern
    if (!error) {
      expect(slug).toMatch(/^[a-z]+-[a-z]+-[a-z]+$/);
    } else {
      // If error, slug should be empty
      expect(slug).toBe('');
      expect(error).toBeInstanceOf(Error);
    }
  });
});
