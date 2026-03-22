/**
 * Visual Regression Tests — Score Detail Page (/score/akatombo)
 *
 * Uses the akatombo score as the canonical visual baseline for score detail
 * pages. Waits for the shakuhachi-score web component to finish rendering its
 * SVG before taking a screenshot.
 */

import { test, expect } from '@playwright/test';

import { setTheme, waitForScoreRendered } from './helpers';

const colorSchemes = ['light', 'dark'] as const;
const viewports = [
  { name: 'desktop', width: 1280, height: 780 },
  { name: 'mobile', width: 375, height: 1450 },
];

test.describe('Score Detail Page Visual Regression', () => {
  for (const colorScheme of colorSchemes) {
    for (const viewport of viewports) {
      test(`${colorScheme} - ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });
        await page.emulateMedia({ colorScheme });
        await page.goto('/score/akatombo');
        await waitForScoreRendered(page);
        await setTheme(page, colorScheme);

        await expect(page).toHaveScreenshot(
          `score-detail-${colorScheme}-${viewport.name}.png`,
          {
            fullPage: false,
          },
        );
      });
    }
  }
});
