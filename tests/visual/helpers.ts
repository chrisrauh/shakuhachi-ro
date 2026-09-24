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
