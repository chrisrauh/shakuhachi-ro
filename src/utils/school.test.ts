import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SCHOOLS, composerLine } from './school';

describe('SCHOOLS', () => {
  // A key the enum lacks is rejected on save; a value the map lacks has no name.
  it('has exactly the keys of the database enum', () => {
    const migration = readFileSync(
      'database/migrations/add_school_to_scores.sql',
      'utf8',
    );
    const enumBody = migration.match(/create type school as enum \(([^)]*)\)/);
    const keys = [...enumBody![1].matchAll(/'([a-z]+)'/g)].map((m) => m[1]);

    expect(Object.keys(SCHOOLS).sort()).toEqual(keys.sort());
  });
});

describe('composerLine', () => {
  it('shows the school alone when it stands in for "Traditional"', () => {
    expect(composerLine('Traditional', 'kinko')).toBe('Kinko-ryū');
    expect(composerLine(null, 'kinko')).toBe('Kinko-ryū');
  });

  it('keeps a named composer next to the school', () => {
    expect(composerLine('Nakao Tozan', 'tozan')).toBe(
      'Nakao Tozan · Tozan-ryū',
    );
  });

  it('is unchanged without a school', () => {
    expect(composerLine('Traditional', null)).toBe('Traditional');
    expect(composerLine(null, null)).toBe('Unknown composer');
  });
});
