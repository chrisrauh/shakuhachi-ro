/**
 * Visual Regression Tests — Button Component (/test/buttons)
 *
 * Strategy: one full-page screenshot per theme per viewport. The /test/buttons
 * page shows all button variants, sizes, and states side-by-side — a single
 * screenshot captures everything. No per-variant tests needed.
 */

import { test, expect, type Page } from '@playwright/test';

import { setTheme } from './helpers';

async function waitForButtonsPage(page: Page) {
  await page.waitForLoadState('load');
  await page.waitForSelector('main');
}

test.describe('Button Component Visual Regression', () => {
  test.describe('Desktop (1280x780)', () => {
    test.use({ viewport: { width: 1280, height: 780 } });

    test('light mode', async ({ page }) => {
      await page.goto('/test/buttons');
      await waitForButtonsPage(page);
      await setTheme(page, 'light');

      await expect(page).toHaveScreenshot('buttons-light.png', {
        fullPage: false,
      });
    });

    test('dark mode', async ({ page }) => {
      await page.goto('/test/buttons');
      await waitForButtonsPage(page);
      await setTheme(page, 'dark');

      await expect(page).toHaveScreenshot('buttons-dark.png', {
        fullPage: false,
      });
    });
  });

  test.describe('Mobile (375x667)', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('light mode', async ({ page }) => {
      await page.goto('/test/buttons');
      await waitForButtonsPage(page);
      await setTheme(page, 'light');

      await expect(page).toHaveScreenshot('mobile-buttons-light.png', {
        fullPage: true,
      });
    });

    test('dark mode', async ({ page }) => {
      await page.goto('/test/buttons');
      await waitForButtonsPage(page);
      await setTheme(page, 'dark');

      await expect(page).toHaveScreenshot('mobile-buttons-dark.png', {
        fullPage: true,
      });
    });
  });
});
