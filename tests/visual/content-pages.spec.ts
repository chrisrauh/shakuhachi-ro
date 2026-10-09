/**
 * Visual Regression Tests for Content Pages
 *
 * Covers the /about and /ai pages across viewports and themes.
 *
 * Coverage:
 *   - /about — desktop (1280x720) and mobile (375x667), light and dark
 *   - /ai    — desktop (1280x720) and mobile (375x667), light and dark
 *
 * No authentication required.
 */

import { test, expect, type Page } from '@playwright/test';

import { setTheme, waitForScoreRendered } from './helpers';

async function waitForStaticPage(page: Page) {
  await page.waitForLoadState('load');
  await page.waitForSelector('main');
}

/**
 * The about page's live score, and the handwriting its annotation is written
 * in. Caveat swaps in once it arrives, and a screenshot taken before then
 * shows a fallback font, two pixels shorter. Loading it by name waits for it;
 * it resolves with no faces if Caveat isn't declared, rather than passing.
 */
async function waitForAboutPage(page: Page) {
  await waitForScoreRendered(page);
  const loaded = await page.evaluate(
    async () => (await document.fonts.load('28px Caveat')).length,
  );
  expect(loaded, 'Caveat, the annotation font, loaded').toBeGreaterThan(0);
}

const pages = [
  { name: 'about', path: '/about', waitFor: waitForAboutPage },
  { name: 'ai', path: '/ai' },
];

const themes = ['light', 'dark'] as const;

const viewports = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'mobile', width: 375, height: 667 },
];

test.describe('Content Pages Visual Regression', () => {
  for (const pageConfig of pages) {
    for (const theme of themes) {
      for (const viewport of viewports) {
        const testName = `${pageConfig.name} - ${theme} - ${viewport.name}`;
        const screenshotName = `${pageConfig.name}-${theme}-${viewport.name}.png`;

        test(testName, async ({ page }) => {
          await page.setViewportSize({
            width: viewport.width,
            height: viewport.height,
          });

          await page.goto(pageConfig.path);
          await waitForStaticPage(page);
          await pageConfig.waitFor?.(page);
          await setTheme(page, theme);

          await expect(page).toHaveScreenshot(screenshotName, {
            fullPage: true,
          });
        });
      }
    }
  }
});
