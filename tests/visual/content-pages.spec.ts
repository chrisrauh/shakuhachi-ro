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

import { setTheme } from './helpers';

async function waitForStaticPage(page: Page) {
  await page.waitForLoadState('load');
  await page.waitForSelector('main');
}

const pages = [
  { name: 'about', path: '/about' },
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
          await setTheme(page, theme);

          await expect(page).toHaveScreenshot(screenshotName, {
            fullPage: true,
          });
        });
      }
    }
  }
});
