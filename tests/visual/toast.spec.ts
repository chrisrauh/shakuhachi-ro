import { test, expect } from '@playwright/test';

/**
 * Visual regression tests for Toast notification system
 *
 * Tests the static visual regression reference examples from /test/toasts
 * to ensure consistent rendering across all variants, themes, and viewports.
 */

const TOAST_TEST_PAGE = '/test/toasts';

/**
 * Helper to set theme via data attribute (site uses data-theme, not just media query)
 */
async function setTheme(page: any, theme: 'light' | 'dark') {
  await page.emulateMedia({ colorScheme: theme });
  await page.evaluate((theme: string) => {
    document.documentElement.setAttribute('data-theme', theme);
  }, theme);
  // Wait a bit for theme transition
  await page.waitForTimeout(100);
}

test.describe('Toast Visual Regression', () => {
  test.describe('Desktop', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('Light mode - All variants', async ({ page }) => {
      await page.goto(TOAST_TEST_PAGE);
      await setTheme(page, 'light');

      // Scroll to visual regression section
      await page.locator('.regression-grid').scrollIntoViewIfNeeded();

      // Wait for fonts and styles to load
      await page.waitForTimeout(500);

      // Screenshot the entire visual regression section
      const regressionSection = page.locator('.regression-grid').first();
      await expect(regressionSection).toHaveScreenshot(
        'desktop-light-all-variants.png',
        {
          maxDiffPixels: 100,
        },
      );
    });

    test('Dark mode - All variants', async ({ page }) => {
      await page.goto(TOAST_TEST_PAGE);
      await setTheme(page, 'dark');

      // Scroll to visual regression section
      await page.locator('.regression-grid').scrollIntoViewIfNeeded();

      // Wait for fonts and styles to load
      await page.waitForTimeout(500);

      // Screenshot the entire visual regression section
      const regressionSection = page.locator('.regression-grid').first();
      await expect(regressionSection).toHaveScreenshot(
        'desktop-dark-all-variants.png',
        {
          maxDiffPixels: 100,
        },
      );
    });

    test('Light mode - Individual variants', async ({ page }) => {
      await page.goto(TOAST_TEST_PAGE);
      await setTheme(page, 'light');

      await page.locator('.regression-grid').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Get all regression items
      const items = page.locator('.regression-item');
      const count = await items.count();

      for (let i = 0; i < count; i++) {
        const item = items.nth(i);
        const heading = await item.locator('h3').textContent();
        const screenshotName = `desktop-light-${heading?.toLowerCase().replace(/\s+/g, '-')}.png`;

        await expect(item).toHaveScreenshot(screenshotName, {
          maxDiffPixels: 50,
        });
      }
    });

    test('Dark mode - Individual variants', async ({ page }) => {
      await page.goto(TOAST_TEST_PAGE);
      await setTheme(page, 'dark');

      await page.locator('.regression-grid').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Get all regression items
      const items = page.locator('.regression-item');
      const count = await items.count();

      for (let i = 0; i < count; i++) {
        const item = items.nth(i);
        const heading = await item.locator('h3').textContent();
        const screenshotName = `desktop-dark-${heading?.toLowerCase().replace(/\s+/g, '-')}.png`;

        await expect(item).toHaveScreenshot(screenshotName, {
          maxDiffPixels: 50,
        });
      }
    });

    test('Stacked toasts gap verification', async ({ page }) => {
      await page.goto(TOAST_TEST_PAGE);
      await setTheme(page, 'light');

      // Find the stacked toasts preview
      const stackedSection = page
        .locator('.regression-item')
        .filter({ hasText: 'Stacked Toasts' });
      await stackedSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Screenshot stacked toasts to verify 14px gap
      await expect(stackedSection).toHaveScreenshot(
        'desktop-light-stacked-toasts-gaps.png',
        {
          maxDiffPixels: 50,
        },
      );
    });
  });

  test.describe('Mobile', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('Light mode - All variants', async ({ page }) => {
      await page.goto(TOAST_TEST_PAGE);
      await setTheme(page, 'light');

      // Scroll to visual regression section
      await page.locator('.regression-grid').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Screenshot the entire visual regression section
      const regressionSection = page.locator('.regression-grid').first();
      await expect(regressionSection).toHaveScreenshot(
        'mobile-light-all-variants.png',
        {
          maxDiffPixels: 100,
        },
      );
    });

    test('Dark mode - All variants', async ({ page }) => {
      await page.goto(TOAST_TEST_PAGE);
      await setTheme(page, 'dark');

      // Scroll to visual regression section
      await page.locator('.regression-grid').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Screenshot the entire visual regression section
      const regressionSection = page.locator('.regression-grid').first();
      await expect(regressionSection).toHaveScreenshot(
        'mobile-dark-all-variants.png',
        {
          maxDiffPixels: 100,
        },
      );
    });

    test('Light mode - Success variant', async ({ page }) => {
      await page.goto(TOAST_TEST_PAGE);
      await setTheme(page, 'light');

      const successItem = page
        .locator('.regression-item')
        .filter({ hasText: 'Success' })
        .first();
      await successItem.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      await expect(successItem).toHaveScreenshot('mobile-light-success.png', {
        maxDiffPixels: 50,
      });
    });

    test('Light mode - Error variant', async ({ page }) => {
      await page.goto(TOAST_TEST_PAGE);
      await setTheme(page, 'light');

      const errorItem = page
        .locator('.regression-item')
        .filter({ hasText: 'Error' })
        .first();
      await errorItem.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      await expect(errorItem).toHaveScreenshot('mobile-light-error.png', {
        maxDiffPixels: 50,
      });
    });

    test('Light mode - Warning variant', async ({ page }) => {
      await page.goto(TOAST_TEST_PAGE);
      await setTheme(page, 'light');

      const warningItem = page
        .locator('.regression-item')
        .filter({ hasText: 'Warning' })
        .first();
      await warningItem.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      await expect(warningItem).toHaveScreenshot('mobile-light-warning.png', {
        maxDiffPixels: 50,
      });
    });

    test('Light mode - Info variant', async ({ page }) => {
      await page.goto(TOAST_TEST_PAGE);
      await setTheme(page, 'light');

      const infoItem = page
        .locator('.regression-item')
        .filter({ hasText: 'Info' })
        .first();
      await infoItem.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      await expect(infoItem).toHaveScreenshot('mobile-light-info.png', {
        maxDiffPixels: 50,
      });
    });

    test('Multi-line message wrapping', async ({ page }) => {
      await page.goto(TOAST_TEST_PAGE);
      await setTheme(page, 'light');

      const multilineItem = page
        .locator('.regression-item')
        .filter({ hasText: 'Multi-line Message' });
      await multilineItem.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      await expect(multilineItem).toHaveScreenshot(
        'mobile-light-multiline.png',
        {
          maxDiffPixels: 50,
        },
      );
    });

    test('Dark mode - Multi-line message wrapping', async ({ page }) => {
      await page.goto(TOAST_TEST_PAGE);
      await setTheme(page, 'dark');

      const multilineItem = page
        .locator('.regression-item')
        .filter({ hasText: 'Multi-line Message' });
      await multilineItem.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      await expect(multilineItem).toHaveScreenshot(
        'mobile-dark-multiline.png',
        {
          maxDiffPixels: 50,
        },
      );
    });

    test('Stacked toasts on mobile', async ({ page }) => {
      await page.goto(TOAST_TEST_PAGE);
      await setTheme(page, 'light');

      const stackedSection = page
        .locator('.regression-item')
        .filter({ hasText: 'Stacked Toasts' });
      await stackedSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      await expect(stackedSection).toHaveScreenshot(
        'mobile-light-stacked-toasts.png',
        {
          maxDiffPixels: 50,
        },
      );
    });
  });

  test.describe('Tablet', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('Light mode - All variants', async ({ page }) => {
      await page.goto(TOAST_TEST_PAGE);
      await setTheme(page, 'light');

      await page.locator('.regression-grid').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      const regressionSection = page.locator('.regression-grid').first();
      await expect(regressionSection).toHaveScreenshot(
        'tablet-light-all-variants.png',
        {
          maxDiffPixels: 100,
        },
      );
    });

    test('Dark mode - All variants', async ({ page }) => {
      await page.goto(TOAST_TEST_PAGE);
      await setTheme(page, 'dark');

      await page.locator('.regression-grid').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      const regressionSection = page.locator('.regression-grid').first();
      await expect(regressionSection).toHaveScreenshot(
        'tablet-dark-all-variants.png',
        {
          maxDiffPixels: 100,
        },
      );
    });
  });

  test.describe('Interactive Toasts', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('Animated toast appears and dismisses', async ({ page }) => {
      await page.goto(TOAST_TEST_PAGE);
      await setTheme(page, 'light');

      // Click success button to trigger toast
      await page.click('button[data-toast="success"]');

      // Wait for animation to complete
      await page.waitForTimeout(300);

      // Verify toast appears (select from toast-container, not static examples)
      const toast = page.locator('.toast-container .toast--success').first();
      await expect(toast).toBeVisible();

      // Screenshot the live toast
      await expect(toast).toHaveScreenshot('interactive-success-toast.png', {
        maxDiffPixels: 50,
      });

      // Click close button
      await toast.locator('.toast-close').click();

      // Wait for dismissal animation
      await page.waitForTimeout(300);

      // Verify toast is removed
      await expect(toast).toHaveCount(0);
    });

    test('Multiple toasts stack correctly', async ({ page }) => {
      await page.goto(TOAST_TEST_PAGE);
      await setTheme(page, 'light');

      // Trigger stack test (3 toasts)
      await page.click('#stack-test');

      // Wait for all toasts to appear
      await page.waitForTimeout(500);

      // Screenshot the stacked toasts
      const container = page.locator('.toast-container');
      await expect(container).toHaveScreenshot(
        'interactive-stacked-toasts.png',
        {
          maxDiffPixels: 100,
        },
      );
    });
  });
});
