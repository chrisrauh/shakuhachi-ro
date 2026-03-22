/**
 * Visual Regression Tests — shakuhachi-score Web Component
 *
 * Full-page screenshot of /test/shakuhachi-score.html, which renders both
 * light and dark themes side-by-side across multiple test cases. A single
 * full-page screenshot is sufficient — the test page is designed so that all
 * variants are visible without scrolling interaction.
 *
 * Column layout behaviour is covered separately in web-component-columns.spec.ts.
 */

import { test, expect } from '@playwright/test';

import { waitForScoreRendered } from './helpers';

test.describe('shakuhachi-score Web Component Visual Regression', () => {
  test('full page — all test cases', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 2000 });
    await page.goto('/test/shakuhachi-score.html');
    await waitForScoreRendered(page);

    await expect(page).toHaveScreenshot('shakuhachi-score-full-page.png', {
      fullPage: true,
    });
  });
});
