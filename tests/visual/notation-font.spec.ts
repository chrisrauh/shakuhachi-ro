/**
 * Visual Regression Tests — Notation Font Toggle
 *
 * Covers the serif notation face. The sans face is already the default
 * everywhere else in this suite, so those baselines are the sans coverage;
 * this spec exists so a regression in serif rendering (missing font, wrong
 * family on marks, clipped modifiers) is caught.
 *
 * The preference is seeded into localStorage before the document runs, which
 * is what the inline head script in Layout.astro reads to set
 * `data-notation-font` before first paint.
 */

import { test, expect } from '@playwright/test';

import { setTheme, waitForScoreRendered } from './helpers';

const colorSchemes = ['light', 'dark'] as const;

test.describe('Notation Font Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('notation-font', 'serif');
    });
  });

  for (const colorScheme of colorSchemes) {
    test(`serif notation - ${colorScheme}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 780 });
      await page.emulateMedia({ colorScheme });
      await page.goto('/score/akatombo');
      await waitForScoreRendered(page);
      await setTheme(page, colorScheme);

      await expect(page).toHaveScreenshot(
        `notation-font-serif-${colorScheme}.png`,
        {
          fullPage: false,
        },
      );
    });
  }

  /**
   * The component test page is the only fixture that exercises every base
   * symbol, all three meri levels, both octaves, rests, duration dots and a
   * column break at once. Serif metrics differ from sans, and the modifier
   * offsets were tuned against sans — this is the baseline that would catch
   * clipping or overlap introduced by the serif face.
   */
  test('serif notation - all symbols and modifiers', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 2000 });
    await page.goto('/test/shakuhachi-score.html');
    await waitForScoreRendered(page);

    await page.evaluate(() => {
      document
        .querySelectorAll('shakuhachi-score')
        .forEach((el) => el.setAttribute('notation-font', 'serif'));
    });
    await waitForScoreRendered(page);
    // The attribute change re-renders; confirm the new face actually landed
    // before screenshotting, or a stale sans render could be captured.
    await page.waitForFunction(() =>
      [...document.querySelectorAll('shakuhachi-score')].every((el) =>
        el.shadowRoot
          ?.querySelector('text')
          ?.getAttribute('font-family')
          ?.includes('Serif'),
      ),
    );

    await expect(page).toHaveScreenshot('notation-font-serif-symbols.png', {
      fullPage: true,
    });
  });
});
