import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

// Score pages are cached at Netlify's edge and one cached copy is served to
// every viewer (#390), so their server-rendered HTML must not depend on who is
// asking. Reading cookies, request headers, locals or the query string while
// rendering would serve one viewer's page to another (#398). See "Cache
// safety" in docs/ARCHITECTURE-PLATFORM.MD.
//
// This checks the source, not the rendered output: it follows the page's own
// .astro imports and looks for the Astro APIs that expose the request.

const SRC = resolve(__dirname, '../..');
const SCORE_PAGE = join(__dirname, '[slug].astro');

const PER_REQUEST_APIS =
  /Astro\.(cookies|request|locals|session|clientAddress|url\.search)/;

function astroFilesRenderedBy(file: string, seen = new Set<string>()) {
  if (seen.has(file)) return seen;
  seen.add(file);
  const source = readFileSync(file, 'utf8');
  for (const [, path] of source.matchAll(/from '(\.[^']+\.astro)'/g)) {
    astroFilesRenderedBy(resolve(dirname(file), path), seen);
  }
  return seen;
}

describe('score page', () => {
  it('renders the same HTML for every viewer', () => {
    const files = [...astroFilesRenderedBy(SCORE_PAGE)];
    const readers = files
      .filter((file) => PER_REQUEST_APIS.test(readFileSync(file, 'utf8')))
      .map((file) => relative(SRC, file));

    // Sanity check that the import walk found the layout and header
    expect(files.length).toBeGreaterThan(3);
    expect(readers).toEqual([]);
  });

  it('has no middleware that could personalise the response', () => {
    const middleware = ['middleware.ts', 'middleware.js', 'middleware'].filter(
      (name) => existsSync(join(SRC, name)),
    );

    // Middleware runs before every cached page. Adding some is fine, but
    // check it keeps score pages viewer-independent, then update this test.
    expect(middleware).toEqual([]);
  });
});
