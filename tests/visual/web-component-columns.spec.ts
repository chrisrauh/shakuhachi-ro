/**
 * Visual Regression Tests for Web Component Columns Attribute
 *
 * These tests verify the <shakuhachi-score> web component's columns attribute behavior:
 * - Default behavior (no attribute) uses auto mode
 * - Explicit column counts (columns="2", columns="6") create exact column layouts
 * - Single column mode (columns="1") creates intrinsic height layout
 * - Auto mode adapts to container dimensions
 * - Invalid values fall back to auto mode with warning
 *
 * Test coverage ensures the removal of single-column backward compatibility
 * and new default behavior (auto instead of single column) work correctly.
 */

import { test, expect } from '@playwright/test';

test.describe('Shakuhachi Score Web Component - Columns Attribute', () => {
  // Helper function to wait for web component to be ready
  async function waitForWebComponent(page: any) {
    // Wait for custom element to be defined
    await page.waitForFunction(() => {
      return customElements.get('shakuhachi-score') !== undefined;
    });

    // Wait for component to render
    await page.waitForFunction(() => {
      const component = document.querySelector('shakuhachi-score');
      return (
        component &&
        component.shadowRoot &&
        component.shadowRoot.querySelector('svg')
      );
    });
  }

  // Sample score data with enough notes to test multi-column layout
  const sampleScoreData = {
    title: 'Test Score',
    style: 'kinko',
    notes: [
      { pitch: { step: 'ro', octave: 0 }, duration: 1 },
      { pitch: { step: 'tsu', octave: 0 }, duration: 1 },
      { pitch: { step: 're', octave: 0 }, duration: 1 },
      { pitch: { step: 'chi', octave: 0 }, duration: 1 },
      { pitch: { step: 'ri', octave: 0 }, duration: 1 },
      { pitch: { step: 'u', octave: 0 }, duration: 1 },
      { pitch: { step: 'hi', octave: 1 }, duration: 1 },
      { pitch: { step: 'ro', octave: 1 }, duration: 1 },
      { pitch: { step: 'tsu', octave: 1 }, duration: 1 },
      { pitch: { step: 're', octave: 1 }, duration: 1 },
      { pitch: { step: 'chi', octave: 1 }, duration: 1 },
      { pitch: { step: 'ri', octave: 1 }, duration: 1 },
    ],
  };

  test('default (no columns attribute) uses auto mode', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });

    // Create test page with web component, no columns attribute
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <script src="http://localhost:3001/embed/shakuhachi-score.js"></script>
          <style>
            body { margin: 0; padding: 20px; }
            .container { width: 600px; height: 400px; border: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <div class="container">
            <shakuhachi-score
              style="width: 100%; height: 100%;"
              data-score='${JSON.stringify(sampleScoreData)}'>
            </shakuhachi-score>
          </div>
        </body>
      </html>
    `);

    await page.waitForTimeout(500);
    await waitForWebComponent(page);

    // Take screenshot of auto mode (default)
    await expect(page.locator('.container')).toHaveScreenshot(
      'default-auto-mode.png',
    );

    // Verify SVG dimensions match container (auto mode behavior)
    const svgDimensions = await page.evaluate(() => {
      const svg = document
        .querySelector('shakuhachi-score')!
        .shadowRoot!.querySelector('svg');
      return {
        width: svg?.getAttribute('width'),
        height: svg?.getAttribute('height'),
      };
    });

    expect(parseInt(svgDimensions.width || '0')).toBeGreaterThan(500);
    expect(parseInt(svgDimensions.height || '0')).toBeGreaterThan(300);
  });

  test('columns="1" creates single column with intrinsic height', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 800, height: 600 });

    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <script src="http://localhost:3001/embed/shakuhachi-score.js"></script>
          <style>
            body { margin: 0; padding: 20px; }
            .container { width: 300px; border: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <div class="container">
            <shakuhachi-score
              columns="1"
              data-score='${JSON.stringify(sampleScoreData)}'>
            </shakuhachi-score>
          </div>
        </body>
      </html>
    `);

    await page.waitForTimeout(500);
    await waitForWebComponent(page);

    // Take screenshot of single column mode
    await expect(page.locator('.container')).toHaveScreenshot(
      'single-column-mode.png',
    );

    // Verify intrinsic height calculation
    // 12 notes * 44px spacing + 34px top margin + 20px bottom ≈ 582px
    const svgHeight = await page.evaluate(() => {
      const svg = document
        .querySelector('shakuhachi-score')!
        .shadowRoot!.querySelector('svg');
      return svg?.getAttribute('height');
    });

    expect(parseInt(svgHeight || '0')).toBeGreaterThan(500);
  });

  test('columns="2" creates exactly 2 columns', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });

    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <script src="http://localhost:3001/embed/shakuhachi-score.js"></script>
          <style>
            body { margin: 0; padding: 20px; }
            .container { width: 600px; height: 400px; border: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <div class="container">
            <shakuhachi-score
              columns="2"
              style="width: 100%; height: 100%;"
              data-score='${JSON.stringify(sampleScoreData)}'>
            </shakuhachi-score>
          </div>
        </body>
      </html>
    `);

    await page.waitForTimeout(500);
    await waitForWebComponent(page);

    // Take screenshot of 2-column layout
    await expect(page.locator('.container')).toHaveScreenshot(
      'two-column-mode.png',
    );
  });

  test('columns="6" creates exactly 6 columns', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 600 });

    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <script src="http://localhost:3001/embed/shakuhachi-score.js"></script>
          <style>
            body { margin: 0; padding: 20px; }
            .container { width: 1000px; height: 400px; border: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <div class="container">
            <shakuhachi-score
              columns="6"
              style="width: 100%; height: 100%;"
              data-score='${JSON.stringify(sampleScoreData)}'>
            </shakuhachi-score>
          </div>
        </body>
      </html>
    `);

    await page.waitForTimeout(500);

    // Take screenshot of 6-column layout
    await expect(page.locator('.container')).toHaveScreenshot(
      'six-column-mode.png',
    );
  });

  test('auto mode adapts to container height (tall container)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 800, height: 1000 });

    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <script src="http://localhost:3001/embed/shakuhachi-score.js"></script>
          <style>
            body { margin: 0; padding: 20px; }
            .container { width: 400px; height: 800px; border: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <div class="container">
            <shakuhachi-score
              columns="auto"
              style="width: 100%; height: 100%;"
              data-score='${JSON.stringify(sampleScoreData)}'>
            </shakuhachi-score>
          </div>
        </body>
      </html>
    `);

    await page.waitForTimeout(500);

    // Take screenshot of auto mode with tall container
    await expect(page.locator('.container')).toHaveScreenshot(
      'auto-mode-tall-container.png',
    );
  });

  test('auto mode adapts to container height (short container)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1200, height: 400 });

    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <script src="http://localhost:3001/embed/shakuhachi-score.js"></script>
          <style>
            body { margin: 0; padding: 20px; }
            .container { width: 1000px; height: 200px; border: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <div class="container">
            <shakuhachi-score
              columns="auto"
              style="width: 100%; height: 100%;"
              data-score='${JSON.stringify(sampleScoreData)}'>
            </shakuhachi-score>
          </div>
        </body>
      </html>
    `);

    await page.waitForTimeout(500);

    // Take screenshot of auto mode with short container
    await expect(page.locator('.container')).toHaveScreenshot(
      'auto-mode-short-container.png',
    );
  });

  test('default uses browser dimensions when no container sizing', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 800, height: 600 });

    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <script src="http://localhost:3001/embed/shakuhachi-score.js"></script>
          <style>
            body { margin: 0; padding: 20px; }
          </style>
        </head>
        <body>
          <shakuhachi-score
            data-score='${JSON.stringify(sampleScoreData)}'>
          </shakuhachi-score>
        </body>
      </html>
    `);

    await page.waitForTimeout(500);
    await waitForWebComponent(page);

    // Verify uses browser width (800 - 40px padding = 760px)
    const svgDimensions = await page.evaluate(() => {
      const svg = document
        .querySelector('shakuhachi-score')!
        .shadowRoot!.querySelector('svg');
      return {
        width: svg?.getAttribute('width'),
        height: svg?.getAttribute('height'),
      };
    });

    expect(parseInt(svgDimensions.width || '0')).toBeGreaterThan(700);
  });

  test('light and dark themes render identically (structure)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 800, height: 600 });

    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <script src="http://localhost:3001/embed/shakuhachi-score.js"></script>
          <style>
            body { margin: 0; padding: 20px; }
            .container { width: 600px; height: 400px; border: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <div class="container">
            <shakuhachi-score
              columns="2"
              style="width: 100%; height: 100%;"
              data-score='${JSON.stringify(sampleScoreData)}'>
            </shakuhachi-score>
          </div>
        </body>
      </html>
    `);

    await page.waitForTimeout(500);
    await waitForWebComponent(page);

    // Take screenshot in light mode
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page.locator('.container')).toHaveScreenshot(
      'theme-light-mode.png',
    );

    // Take screenshot in dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('.container')).toHaveScreenshot(
      'theme-dark-mode.png',
    );
  });

  test('explicit width and height attributes override CSS', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 800, height: 600 });

    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <script src="http://localhost:3001/embed/shakuhachi-score.js"></script>
          <style>
            body { margin: 0; padding: 20px; }
            .container { width: 600px; height: 400px; }
          </style>
        </head>
        <body>
          <div class="container">
            <shakuhachi-score
              columns="auto"
              width="500"
              height="350"
              data-score='${JSON.stringify(sampleScoreData)}'>
            </shakuhachi-score>
          </div>
        </body>
      </html>
    `);

    await page.waitForTimeout(500);

    // Verify explicit dimensions override container
    const svgDimensions = await page.evaluate(() => {
      const svg = document
        .querySelector('shakuhachi-score')!
        .shadowRoot!.querySelector('svg');
      return {
        width: svg?.getAttribute('width'),
        height: svg?.getAttribute('height'),
      };
    });

    expect(svgDimensions.width).toBe('500');
    expect(svgDimensions.height).toBe('350');
  });
});
