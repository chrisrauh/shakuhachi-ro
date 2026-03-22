/**
 * Visual Regression Tests — Landing Page (/)
 *
 * The landing page renders score cards fetched from Supabase via ScoreLibrary.
 * We wait for `.score-library` (the loaded grid state) rather than `main`,
 * because `main` appears before the async API call settles.
 *
 * Note: score cards show relative timestamps ("2 weeks ago") that drift over
 * time. Baselines will need updating periodically as scores are added/renamed.
 */

import { test, expect, type Page } from '@playwright/test';

import { setTheme } from './helpers';

const colorSchemes = ['light', 'dark'] as const;
const viewports = [
  { name: 'desktop', width: 1280, height: 780 },
  { name: 'mobile', width: 375, height: 1450 },
];

async function waitForLanding(page: Page) {
  await page.waitForLoadState('load');
  await page.waitForSelector('.score-library');
}

test.describe('Landing Page Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Date.now = () => 1609459200000; // 2021-01-01 — freeze timestamps
    });
  });

  for (const colorScheme of colorSchemes) {
    for (const viewport of viewports) {
      test(`${colorScheme} - ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });
        await page.emulateMedia({ colorScheme });
        await page.goto('/');
        await waitForLanding(page);
        await setTheme(page, colorScheme);

        await expect(page).toHaveScreenshot(
          `landing-${colorScheme}-${viewport.name}.png`,
          {
            fullPage: false,
          },
        );
      });
    }
  }
});
