import type { Page } from '@playwright/test';

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
 * Wait for a shakuhachi-score web component to finish rendering its SVG.
 */
export async function waitForScoreRendered(page: Page) {
  await page.waitForFunction(() => {
    const c = document.querySelector('shakuhachi-score');
    return c?.shadowRoot?.querySelector('svg') !== null;
  });
}
