/**
 * Visual Regression Tests for the Score Editor (/score/[slug]/edit)
 *
 * Coverage:
 * - The score with the palette panel on either side, the cursor (in every
 *   score screenshot), a highlighted note, an empty score, the source view
 *   and the details dialog
 * - Editing from the palette
 * - Desktop (1280x720) and mobile (375x667) viewports, light and dark themes
 * - Validation, format conversion and the line under MusicXML and ABC that
 *   says what they don't keep, in the source view
 *
 * Authentication:
 * - Session provided by auth-setup.ts via project storageState
 * - Test score at /score/test/edit (nine notes, tsu second; see CLAUDE.md)
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

/** Taps the second note, tsu, and checks that its key is pressed. */
async function highlightTsu(page: Page) {
  await tapNote(page, 1);
  await expect(page.locator('#status-mode')).toHaveText('Changing');
  await expect(page.locator('.palette-key[data-step="tsu"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
}

/**
 * Edits the second note from the palette, the way a viewer does: the keys the
 * note now matches are pressed.
 */
async function editNote(page: Page) {
  await tapNote(page, 1);
  await page.click('.palette-key[data-mark="chu-meri"]');
  await page.click('.palette-key[data-duration="1"]'); // 1 beat
  await expect(
    page.locator('.palette-key[data-mark="chu-meri"]'),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#status-detail')).toContainText('chu-meri');
  await expect(page.locator('.palette-key[data-key="undo"]')).toBeEnabled();
}

/** Empties the score through the source view, without saving. */
async function emptyScore(page: Page) {
  await openSource(page);
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
  // page, including the one taken on failure, catches them part-way. Only
  // animations that end: the cursor blinks forever once it has rested 700ms
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished),
    ),
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
      await highlightTsu(page);
      await expect(page).toHaveScreenshot('desktop-highlight-light.png');
    });

    test('Editing a note - light', async ({ page }) => {
      await openEditor(page, 'light');
      await editNote(page);
      await expect(page).toHaveScreenshot('desktop-editing-light.png');
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
      await page.click('input[type="radio"][value="musicxml"]');

      await page.locator('#score-data-input').fill('<unclosed');
      await expect(page.locator('#validation-error')).toContainText(
        'Invalid MusicXML',
      );
      await expect(page).toHaveScreenshot('desktop-source-invalid-light.png');

      await page.click('#source-toggle');
      await expect(page.locator('#score-area')).toBeVisible();
      await waitForScoreRendered(page);
    });

    test('Switching format converts the source, and says what is not kept', async ({
      page,
    }) => {
      await openEditor(page, 'light');
      await openSource(page);
      await expect(page.locator('#score-data-input')).toHaveValue(/"notes"/);
      await expect(page.locator('#format-note')).toBeHidden();

      await page.click('input[type="radio"][value="abc"]');
      await expect(page.locator('#score-data-input')).toHaveValue(/^X:/);
      await expect(page.locator('#format-note')).toHaveText(/^Saved as JSON\./);
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
      await highlightTsu(page);
      await expect(page).toHaveScreenshot('mobile-highlight-dark.png');
    });

    test('Editing a note - dark', async ({ page }) => {
      await openEditor(page, 'dark');
      await editNote(page);
      await expect(page).toHaveScreenshot('mobile-editing-dark.png');
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
