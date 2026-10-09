import { expect, type Page } from '@playwright/test';

/**
 * Set page theme via data-theme attribute and color scheme media emulation.
 * Uses the same mechanism as the site's theme toggle script.
 * No timeout needed — data-theme is set synchronously and animations are
 * disabled in the Playwright config.
 */
export async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.emulateMedia({ colorScheme: theme });
  await page.evaluate((t: string) => {
    document.documentElement.setAttribute('data-theme', t);
    // Hide dev-only controls — they appear in dev server but should not
    // appear in visual regression screenshots.
    const devControls = document.querySelector<HTMLElement>('.dev-controls');
    if (devControls) devControls.style.display = 'none';
  }, theme);
}

/** The clock, and every score's last update, as fixDates sets them. */
const FIXED_NOW = new Date('2026-06-15T12:00:00Z');
const FIXED_UPDATED_AT = '2026-02-14T12:00:00Z';

/**
 * Fixes the "Updated on Feb 14" dates on score cards and score pages, which
 * would otherwise change with the passing days and whenever a fixture is
 * saved. Both halves are needed: the page's clock, and each date's
 * `datetime`, which comes from the score in the database. The dates are
 * rewritten as their elements appear, so this covers server-rendered pages
 * and cards fetched after load. Call before `page.goto`.
 */
export async function fixDates(page: Page) {
  await page.clock.setFixedTime(FIXED_NOW);
  await page.addInitScript((datetime: string) => {
    new MutationObserver(() => {
      for (const el of document.querySelectorAll(
        `relative-time:not([datetime="${datetime}"])`,
      )) {
        el.setAttribute('datetime', datetime);
      }
    }).observe(document, { childList: true, subtree: true });
  }, FIXED_UPDATED_AT);
}

/**
 * Wait for every shakuhachi-score on the page to finish rendering its SVG.
 *
 * The component only draws after its bundle loads, the element upgrades and
 * the score data parses, so the SVG landing in the shadow root is the real
 * readiness signal. Playwright's CSS engine pierces open shadow DOM, so the
 * SVG can be located directly rather than traversing `shadowRoot` by hand.
 *
 * Written as assertions rather than a `waitForFunction` predicate on purpose.
 * A predicate that is accidentally true passes silently and the caller
 * screenshots a page that never rendered — a hand-written version of this
 * check returned immediately on a 404 and wrote it as a baseline. Requiring
 * an element to be attached cannot succeed vacuously, and it reports what was
 * missing instead of timing out anonymously.
 *
 * Waits for all components, not just the first: the renderer test page holds
 * six, and stopping at the first leaves the rest possibly still blank.
 */
export async function waitForScoreRendered(page: Page) {
  const scores = page.locator('shakuhachi-score');
  await expect(scores.first()).toBeAttached();

  for (const score of await scores.all()) {
    await expect(score.locator('svg')).toBeAttached();
  }
}
