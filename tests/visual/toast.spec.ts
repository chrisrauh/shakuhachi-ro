import { test, expect } from '@playwright/test';

/**
 * Visual regression tests for Toast notification system
 *
 * Tests the static visual regression reference examples from /test/toasts
 * to ensure consistent rendering across all variants, themes, and viewports.
 *
 * Strategy: one "all variants" screenshot per theme per viewport — same
 * approach used for the button component. Individual per-variant screenshots
 * add maintenance overhead without catching regressions that the grid view
 * misses. Only add per-variant tests if a variant has layout behaviour that
 * the full grid cannot capture (e.g. a variant that only appears on a
 * specific viewport).
 */

import { setTheme } from './helpers';

const TOAST_TEST_PAGE = '/test/toasts';

/**
 * Wait for fonts to finish loading before taking screenshots.
 * Faster than waitForTimeout(500) — resolves immediately if fonts are cached.
 */
async function waitForFonts(page: any) {
  await page.waitForFunction(() => document.fonts.ready);
}

test.describe('Toast Visual Regression', () => {
  test.describe('Desktop', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('Light mode - All variants', async ({ page }) => {
      await page.goto(TOAST_TEST_PAGE);
      await setTheme(page, 'light');
      await page.locator('.regression-grid').scrollIntoViewIfNeeded();
      await waitForFonts(page);

      const regressionSection = page.locator('.regression-grid').first();
      await expect(regressionSection).toHaveScreenshot(
        'desktop-light-all-variants.png',
        { maxDiffPixels: 100 },
      );
    });

    test('Dark mode - All variants', async ({ page }) => {
      await page.goto(TOAST_TEST_PAGE);
      await setTheme(page, 'dark');
      await page.locator('.regression-grid').scrollIntoViewIfNeeded();
      await waitForFonts(page);

      const regressionSection = page.locator('.regression-grid').first();
      await expect(regressionSection).toHaveScreenshot(
        'desktop-dark-all-variants.png',
        { maxDiffPixels: 100 },
      );
    });
  });

  test.describe('Mobile', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('Light mode - All variants', async ({ page }) => {
      await page.goto(TOAST_TEST_PAGE);
      await setTheme(page, 'light');
      await page.locator('.regression-grid').scrollIntoViewIfNeeded();
      await waitForFonts(page);

      const regressionSection = page.locator('.regression-grid').first();
      await expect(regressionSection).toHaveScreenshot(
        'mobile-light-all-variants.png',
        { maxDiffPixels: 100 },
      );
    });

    test('Dark mode - All variants', async ({ page }) => {
      await page.goto(TOAST_TEST_PAGE);
      await setTheme(page, 'dark');
      await page.locator('.regression-grid').scrollIntoViewIfNeeded();
      await waitForFonts(page);

      const regressionSection = page.locator('.regression-grid').first();
      await expect(regressionSection).toHaveScreenshot(
        'mobile-dark-all-variants.png',
        { maxDiffPixels: 100 },
      );
    });
  });

  test.describe('Interactive Toasts', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('Animated toast appears and dismisses', async ({ page }) => {
      await page.goto(TOAST_TEST_PAGE);
      await setTheme(page, 'light');

      await page.click('button[data-toast="success"]');
      await page.waitForTimeout(300);

      const toast = page.locator('.toast-container .toast--success').first();
      await expect(toast).toBeVisible();

      await expect(toast).toHaveScreenshot('interactive-success-toast.png', {
        maxDiffPixels: 50,
      });

      await toast.locator('.toast-close').click();
      await page.waitForTimeout(300);
      await expect(toast).toHaveCount(0);
    });

    test('Multiple toasts stack correctly', async ({ page }) => {
      await page.goto(TOAST_TEST_PAGE);
      await setTheme(page, 'light');

      await page.click('#stack-test');
      await page.waitForTimeout(500);

      const container = page.locator('.toast-container');
      await expect(container).toHaveScreenshot(
        'interactive-stacked-toasts.png',
        { maxDiffPixels: 100 },
      );
    });
  });
});
