/**
 * Visual Regression Tests for Score Editor Page
 *
 * Tests the score editor (/score/[slug]/edit) across viewports, themes, and data formats.
 *
 * Coverage:
 * - Desktop (1280x720) and mobile (375x667) viewports
 * - Light and dark themes
 * - All three notation formats (JSON, MusicXML, ABC)
 * - Mobile panel toggle (editor vs preview — mobile-only behaviour)
 * - Authenticated state (editor requires login)
 *
 * Authentication:
 * - Session provided by auth-setup.ts via project storageState
 * - TEST_EMAIL and TEST_PASSWORD must be set in .env file
 * - Test score available at /score/test/edit
 */

import { test, expect } from '@playwright/test';

import { setTheme } from './helpers';

const TEST_SCORE_SLUG = 'test'; // Test score fixture (see CLAUDE.md)

/**
 * Wait for the editor to be fully loaded.
 * Uses `attached` for #score-preview so it works on both desktop (visible)
 * and mobile (hidden until toggled). The SVG check is the real readiness gate.
 */
async function waitForEditor(page: any) {
  await page.waitForSelector('#score-editor', { state: 'visible' });
  await page.waitForSelector('input[placeholder="Score title"]', {
    state: 'visible',
  });
  await page.waitForSelector('#score-preview', { state: 'attached' });
  await page.waitForFunction(() => {
    const c = document.querySelector('shakuhachi-score');
    return c?.shadowRoot?.querySelector('svg') !== null;
  });
}

test.describe('Score Editor Visual Regression', () => {
  test.describe('Desktop (1280x720)', () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test('Light mode - Existing score (JSON format)', async ({ page }) => {
      await page.goto(`/score/${TEST_SCORE_SLUG}/edit`);
      await setTheme(page, 'light');
      await waitForEditor(page);

      await expect(page).toHaveScreenshot('desktop-light-existing-score.png', {
        fullPage: false,
      });
    });

    test('Dark mode - Existing score (JSON format)', async ({ page }) => {
      await page.goto(`/score/${TEST_SCORE_SLUG}/edit`);
      await setTheme(page, 'dark');
      await waitForEditor(page);

      await expect(page).toHaveScreenshot('desktop-dark-existing-score.png', {
        fullPage: false,
      });
    });

    test('Side-by-side layout (editor and preview)', async ({ page }) => {
      await page.goto(`/score/${TEST_SCORE_SLUG}/edit`);
      await setTheme(page, 'light');
      await waitForEditor(page);

      await expect(page.locator('#editor-panel')).toBeVisible();
      await expect(page.locator('#preview-panel')).toBeVisible();

      await expect(page).toHaveScreenshot('desktop-side-by-side-layout.png', {
        fullPage: false,
      });
    });

    test('JSON format - Syntax highlighting and preview', async ({ page }) => {
      await page.goto(`/score/${TEST_SCORE_SLUG}/edit`);
      await setTheme(page, 'light');
      await waitForEditor(page);

      await expect(page).toHaveScreenshot('format-json-editor.png', {
        fullPage: false,
      });
    });

    test('MusicXML format selection', async ({ page }) => {
      await page.goto(`/score/${TEST_SCORE_SLUG}/edit`);
      await setTheme(page, 'light');
      await waitForEditor(page);

      await page.click('input[type="radio"][value="musicxml"]');
      await page.waitForTimeout(300);

      await expect(page).toHaveScreenshot('format-musicxml-editor.png', {
        fullPage: false,
      });
    });

    test('ABC notation format selection', async ({ page }) => {
      await page.goto(`/score/${TEST_SCORE_SLUG}/edit`);
      await setTheme(page, 'light');
      await waitForEditor(page);

      await page.click('input[type="radio"][value="abc"]');
      await page.waitForTimeout(300);

      await expect(page).toHaveScreenshot('format-abc-editor.png', {
        fullPage: false,
      });
    });

    test('Empty notation - Minimal score data', async ({ page }) => {
      await page.goto(`/score/${TEST_SCORE_SLUG}/edit`);
      await setTheme(page, 'light');
      await waitForEditor(page);

      const notationTextarea = page.locator('#score-data-input');
      await notationTextarea.clear();
      await notationTextarea.fill('{"notes":[]}');
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('editor-empty-notation.png', {
        fullPage: false,
      });
    });

    test('Metadata fields visible', async ({ page }) => {
      await page.goto(`/score/${TEST_SCORE_SLUG}/edit`);
      await setTheme(page, 'light');
      await waitForEditor(page);

      await expect(
        page.locator('input[placeholder="Score title"]'),
      ).toBeVisible();
      await expect(
        page.locator('input[placeholder="Composer name"]'),
      ).toBeVisible();
      await expect(
        page.locator('textarea[placeholder="Brief description of the score"]'),
      ).toBeVisible();

      const metadataSection = page.locator('#score-editor').first();
      await expect(metadataSection).toHaveScreenshot(
        'editor-metadata-fields.png',
      );
    });

    test('Preview renders score notation', async ({ page }) => {
      await page.goto(`/score/${TEST_SCORE_SLUG}/edit`);
      await setTheme(page, 'light');
      await waitForEditor(page);

      const previewPanel = page.locator('#preview-panel');
      await expect(previewPanel).toHaveScreenshot('editor-preview-panel.png');
    });

    test('Preview updates on content change', async ({ page }) => {
      await page.goto(`/score/${TEST_SCORE_SLUG}/edit`);
      await setTheme(page, 'light');
      await waitForEditor(page);

      const titleInput = page.locator('input[placeholder="Score title"]');
      await titleInput.clear();
      await titleInput.fill('Modified Test Score');
      await page.waitForTimeout(500);

      await expect(
        page.locator('#preview-panel shakuhachi-score'),
      ).toBeVisible();
    });

    test('Dark mode - Full editor UI', async ({ page }) => {
      await page.goto(`/score/${TEST_SCORE_SLUG}/edit`);
      await setTheme(page, 'dark');
      await waitForEditor(page);

      const bgColor = await page.evaluate(() => {
        return getComputedStyle(document.body).backgroundColor;
      });
      expect(bgColor).not.toBe('rgb(255, 255, 255)');

      await expect(page).toHaveScreenshot('editor-dark-theme-full.png', {
        fullPage: false,
      });
    });

    test('Light to dark theme transition', async ({ page }) => {
      await page.goto(`/score/${TEST_SCORE_SLUG}/edit`);
      await setTheme(page, 'light');
      await waitForEditor(page);

      await setTheme(page, 'dark');
      await page.waitForTimeout(200);

      await expect(page).toHaveScreenshot('editor-theme-transition.png', {
        fullPage: false,
      });
    });
  });

  test.describe('Mobile (375x667)', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('Light mode - Editor panel default', async ({ page }) => {
      await page.goto(`/score/${TEST_SCORE_SLUG}/edit`);
      await setTheme(page, 'light');
      await waitForEditor(page);

      await expect(page.locator('#editor-panel')).toBeVisible();
      await expect(page.locator('#preview-panel')).toBeHidden();

      await expect(page).toHaveScreenshot('mobile-light-editor-panel.png', {
        fullPage: false,
      });
    });

    test('Dark mode - Editor panel default', async ({ page }) => {
      await page.goto(`/score/${TEST_SCORE_SLUG}/edit`);
      await setTheme(page, 'dark');
      await waitForEditor(page);

      await expect(page).toHaveScreenshot('mobile-dark-editor-panel.png', {
        fullPage: false,
      });
    });

    // Mobile-only: editor has a toggle to switch between editor and preview panels
    test('Toggle to preview panel', async ({ page }) => {
      await page.goto(`/score/${TEST_SCORE_SLUG}/edit`);
      await setTheme(page, 'light');
      await waitForEditor(page);

      await page.click('#toggle-preview');
      await page.waitForTimeout(200);

      await expect(page.locator('#preview-panel')).toBeVisible();
      await expect(page.locator('#editor-panel')).toBeHidden();

      await expect(page).toHaveScreenshot('mobile-light-preview-panel.png', {
        fullPage: false,
      });
    });

    test('Toggle buttons state', async ({ page }) => {
      await page.goto(`/score/${TEST_SCORE_SLUG}/edit`);
      await setTheme(page, 'light');
      await waitForEditor(page);

      const toggleButtons = page.locator('.mobile-toggle');
      await expect(toggleButtons).toHaveScreenshot('mobile-toggle-buttons.png');
    });
  });
});
