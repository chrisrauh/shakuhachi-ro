/**
 * Visual Regression Tests for the Score Editor (/score/[slug]/edit)
 *
 * Coverage:
 * - The score with the palette panel on either side, the cursor (in every
 *   score screenshot), a highlighted note, an empty score, the source view
 *   and the details dialog
 * - Desktop (1280x720) and mobile (375x667) viewports, light and dark themes
 * - Validation and format conversion in the source view
 *
 * Authentication:
 * - Session provided by auth-setup.ts via project storageState
 * - Test score at /score/test/edit (MusicXML, three notes; see CLAUDE.md)
 */

import { test, expect, type Page } from '@playwright/test';

import { setTheme, waitForScoreRendered } from './helpers';

const TEST_SCORE_SLUG = 'test'; // Test score fixture (see CLAUDE.md)

/** Opens the editor on the test score, in the given theme, and waits for the score. */
async function openEditor(page: Page, theme: 'light' | 'dark') {
  await page.goto(`/score/${TEST_SCORE_SLUG}/edit`);
  await setTheme(page, theme);

  // The editor's auth gate is client-side: an unauthenticated visit still gets
  // HTTP 200, then `onAuthReady` redirects to the score view page, and the
  // editor never appears. Say so, rather than failing as a broken editor. The
  // timeout must stay under the 30s test timeout for this diagnosis to run.
  try {
    await page.waitForSelector('.editor-toolbar', {
      state: 'visible',
      timeout: 15000,
    });
  } catch (error) {
    if (!page.url().endsWith('/edit')) {
      throw new Error(
        `Editor never loaded: the page redirected to ${page.url()}, which means ` +
          'the test session is not authenticated. Check tests/visual/auth-setup.ts ' +
          'and the session it writes to tests/visual/.auth/user.json.',
        { cause: error },
      );
    }
    throw error;
  }

  await waitForScoreRendered(page);
}

async function openSource(page: Page) {
  await page.click('#source-toggle');
  await expect(page.locator('#source-view')).toBeVisible();
}

/** Moves the palettes to the left with ⇄, the way a viewer does. */
async function movePalettesLeft(page: Page) {
  await page.click('#palette-side-toggle');
  await expect(page.locator('#editor-workspace')).toHaveAttribute(
    'data-palette-side',
    'left',
  );
}

/** Taps a note, the way a viewer does, which highlights it. */
async function tapNote(page: Page, index: number) {
  const renderer = page.locator('#score-renderer');
  const box = await renderer.evaluate(
    (el, i) =>
      (
        el as HTMLElement & {
          getNoteBoxes(): { centerX: number; y: number; height: number }[];
        }
      ).getNoteBoxes()[i],
    index,
  );
  await renderer.click({
    position: { x: box.centerX, y: box.y + box.height / 2 },
  });
  await expect(page.locator('#score-highlight')).toBeVisible();
}

/** Empties the score through the source view, without saving. */
async function emptyScore(page: Page) {
  await openSource(page);
  await page.click('input[type="radio"][value="json"]');
  await page
    .locator('#score-data-input')
    .fill('{"title": "", "style": "kinko", "notes": []}');
  await page.click('#source-toggle');
  await expect(page.locator('#score-empty-hint')).toBeVisible();
}

async function openDetails(page: Page) {
  await page.click('#details-btn');
  await expect(page.locator('#details-dialog')).toBeVisible();
  // Let the dialog and its backdrop finish fading in, so no screenshot of the
  // page, including the one taken on failure, catches them part-way
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((a) => a.finished)),
  );
}

test.describe('Score Editor Visual Regression', () => {
  test.describe('Desktop (1280x720)', () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test('Score - light', async ({ page }) => {
      await openEditor(page, 'light');
      await expect(page).toHaveScreenshot('desktop-score-light.png');
    });

    test('Score - dark', async ({ page }) => {
      await openEditor(page, 'dark');
      await expect(page).toHaveScreenshot('desktop-score-dark.png');
    });

    test('Palettes on the left - light', async ({ page }) => {
      await openEditor(page, 'light');
      await movePalettesLeft(page);
      await expect(page).toHaveScreenshot('desktop-palettes-left-light.png');
    });

    test('Highlight - light', async ({ page }) => {
      await openEditor(page, 'light');
      await tapNote(page, 1);
      await expect(page.locator('#status-mode')).toHaveText('Changing');
      await expect(page).toHaveScreenshot('desktop-highlight-light.png');
    });

    test('Source - light', async ({ page }) => {
      await openEditor(page, 'light');
      await openSource(page);
      await expect(page.locator('#score-area')).toBeHidden();
      await expect(page.locator('#source-toggle')).toHaveText('Score');
      await expect(page).toHaveScreenshot('desktop-source-light.png');
    });

    test('Details - light', async ({ page }) => {
      await openEditor(page, 'light');
      await openDetails(page);
      await expect(page).toHaveScreenshot('desktop-details-light.png');
    });

    test('Invalid source shows the reason, and keeps the score', async ({
      page,
    }) => {
      await openEditor(page, 'light');
      await openSource(page);

      await page.locator('#score-data-input').fill('<unclosed');
      await expect(page.locator('#validation-error')).toContainText(
        'Invalid MusicXML',
      );
      await expect(page).toHaveScreenshot('desktop-source-invalid-light.png');

      await page.click('#source-toggle');
      await expect(page.locator('#score-area')).toBeVisible();
      await waitForScoreRendered(page);
    });

    test('Switching format converts the source', async ({ page }) => {
      await openEditor(page, 'light');
      await openSource(page);

      await page.click('input[type="radio"][value="abc"]');
      await expect(page.locator('#score-data-input')).toHaveValue(/^X:/);
    });
  });

  test.describe('Mobile (375x667)', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('Score - light', async ({ page }) => {
      await openEditor(page, 'light');
      await expect(page).toHaveScreenshot('mobile-score-light.png');
    });

    test('Score - dark', async ({ page }) => {
      await openEditor(page, 'dark');
      await expect(page).toHaveScreenshot('mobile-score-dark.png');
    });

    test('Palettes on the left - dark', async ({ page }) => {
      await openEditor(page, 'dark');
      await movePalettesLeft(page);
      await expect(page).toHaveScreenshot('mobile-palettes-left-dark.png');
    });

    test('Highlight - dark', async ({ page }) => {
      await openEditor(page, 'dark');
      await tapNote(page, 1);
      await expect(page).toHaveScreenshot('mobile-highlight-dark.png');
    });

    test('Empty score - light', async ({ page }) => {
      await openEditor(page, 'light');
      await emptyScore(page);
      await expect(page.locator('#status-detail')).toHaveText('empty score');
      await expect(page).toHaveScreenshot('mobile-empty-light.png');
    });

    test('Source - dark', async ({ page }) => {
      await openEditor(page, 'dark');
      await openSource(page);
      await expect(page).toHaveScreenshot('mobile-source-dark.png');
    });

    test('Details - dark', async ({ page }) => {
      await openEditor(page, 'dark');
      await openDetails(page);
      await expect(page).toHaveScreenshot('mobile-details-dark.png');
    });
  });
});
