import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

// Astro turns every .ts file under src/pages into a route, test files
// included: purge-score.test.ts once shipped to production as
// /api/purge-score.test, with its vitest import. A leading underscore is how
// Astro excludes a file ("Excluding pages" in the routing docs).
const PAGES = join(__dirname);

function testFilesIn(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('_')) return [];
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return testFilesIn(path);
    return /\.(test|spec)\.[jt]s$/.test(entry.name) ? [path] : [];
  });
}

describe('src/pages', () => {
  it('has no test file that Astro would build as a route', () => {
    const routed = testFilesIn(PAGES).map((path) => relative(PAGES, path));
    expect(routed).toEqual([]);
  });
});
