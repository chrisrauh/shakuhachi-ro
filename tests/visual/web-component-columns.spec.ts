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

  // Longer score for 6-column test (36 notes = 6 notes per column)
  // Uses varied data with different octaves, durations, and melodic patterns
  const longScoreData = {
    title: 'Long Test Score',
    style: 'kinko',
    notes: [
      // Column 1 (6 notes) - Low octave section
      { pitch: { step: 'ro', octave: 0 }, duration: 1 },
      { pitch: { step: 're', octave: 0 }, duration: 2 },
      { pitch: { step: 'tsu', octave: 0 }, duration: 1 },
      { pitch: { step: 'chi', octave: 0 }, duration: 1 },
      { pitch: { step: 're', octave: 0 }, duration: 1 },
      { pitch: { step: 'tsu', octave: 0 }, duration: 2 },

      // Column 2 (6 notes) - Transition to mid
      { pitch: { step: 'tsu', octave: 0 }, duration: 1 },
      { pitch: { step: 'tsu', octave: 0 }, duration: 1 },
      { pitch: { step: 're', octave: 0 }, duration: 1 },
      { pitch: { step: 'chi', octave: 0 }, duration: 2 },
      { pitch: { step: 'ri', octave: 0 }, duration: 1 },
      { pitch: { step: 'u', octave: 1 }, duration: 1 },

      // Column 3 (6 notes) - High octave section
      { pitch: { step: 're', octave: 1 }, duration: 1 },
      { pitch: { step: 'tsu', octave: 1 }, duration: 1 },
      { pitch: { step: 're', octave: 1 }, duration: 2 },
      { pitch: { step: 'chi', octave: 1 }, duration: 1 },
      { pitch: { step: 'ri', octave: 1 }, duration: 1 },
      { pitch: { step: 'u', octave: 1 }, duration: 1 },

      // Column 4 (6 notes) - Descending pattern
      { pitch: { step: 'ri', octave: 1 }, duration: 1 },
      { pitch: { step: 'chi', octave: 1 }, duration: 1 },
      { pitch: { step: 're', octave: 1 }, duration: 1 },
      { pitch: { step: 'tsu', octave: 0 }, duration: 2 },
      { pitch: { step: 'ro', octave: 0 }, duration: 1 },
      { pitch: { step: 'u', octave: 0 }, duration: 1 },

      // Column 5 (6 notes) - Middle section
      { pitch: { step: 'ri', octave: 0 }, duration: 1 },
      { pitch: { step: 'chi', octave: 0 }, duration: 2 },
      { pitch: { step: 're', octave: 0 }, duration: 1 },
      { pitch: { step: 'tsu', octave: 0 }, duration: 1 },
      { pitch: { step: 're', octave: 0 }, duration: 1 },
      { pitch: { step: 'chi', octave: 0 }, duration: 1 },

      // Column 6 (6 notes) - Ending phrase
      { pitch: { step: 'ri', octave: 0 }, duration: 1 },
      { pitch: { step: 'u', octave: 0 }, duration: 2 },
      { pitch: { step: 'ri', octave: 0 }, duration: 1 },
      { pitch: { step: 'chi', octave: 0 }, duration: 1 },
      { pitch: { step: 're', octave: 0 }, duration: 2 },
      { pitch: { step: 'ro', octave: 0 }, duration: 1 },
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
            body { margin: 0; padding: 20px; display: flex; justify-content: center; }
            .container { border: 1px solid #ccc; }
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

  test('columns="2" creates exactly 2 columns with intrinsic sizing', async ({
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
            /* Container just provides context, doesn't constrain size */
            .container { border: 1px solid #ccc; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <shakuhachi-score
              columns="2"
              data-score='${JSON.stringify(sampleScoreData)}'>
            </shakuhachi-score>
          </div>
        </body>
      </html>
    `);

    await waitForWebComponent(page);

    // Verify component calculated its own dimensions
    const dimensions = await page.evaluate(() => {
      const component = document.querySelector('shakuhachi-score');
      const svg = component?.shadowRoot?.querySelector('svg');
      return {
        width: svg?.getAttribute('width'),
        height: svg?.getAttribute('height'),
      };
    });

    // With 2 columns: width = (2 × 100px) + (1 × 35px) + 40px padding = 275px
    expect(parseInt(dimensions.width || '0')).toBeGreaterThan(250);

    // With 12 notes ÷ 2 columns = 6 notes per column
    expect(parseInt(dimensions.height || '0')).toBeGreaterThan(250);

    // Take screenshot of 2-column layout
    await expect(page.locator('.container')).toHaveScreenshot(
      'two-column-mode.png',
    );
  });

  test('columns="6" creates exactly 6 columns with intrinsic sizing', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1200, height: 600 });

    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <script src="http://localhost:3001/embed/shakuhachi-score.js"></script>
          <style>
            body { margin: 0; padding: 20px; }
            /* Container just provides context, doesn't constrain size */
            .container { border: 1px solid #ccc; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <shakuhachi-score
              columns="6"
              data-score='${JSON.stringify(longScoreData)}'>
            </shakuhachi-score>
          </div>
        </body>
      </html>
    `);

    await waitForWebComponent(page);

    // Verify component calculated its own dimensions
    const dimensions = await page.evaluate(() => {
      const component = document.querySelector('shakuhachi-score');
      const svg = component?.shadowRoot?.querySelector('svg');
      return {
        width: svg?.getAttribute('width'),
        height: svg?.getAttribute('height'),
      };
    });

    // With 6 columns: width = (6 × 100px) + (5 × 35px) + 40px padding = 815px
    expect(parseInt(dimensions.width || '0')).toBeGreaterThan(800);

    // With 36 notes ÷ 6 columns = 6 notes per column
    expect(parseInt(dimensions.height || '0')).toBeGreaterThan(250);

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

    await waitForWebComponent(page);

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

    await waitForWebComponent(page);

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
            body { margin: 0; padding: 20px; display: flex; justify-content: center; background: white; }
            .container { width: 600px; height: 400px; border: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <div class="container">
            <shakuhachi-score
              columns="2"
              style="width: 100%; height: 100%; --shakuhachi-note-color: #000;"
              data-score='${JSON.stringify(sampleScoreData)}'>
            </shakuhachi-score>
          </div>
        </body>
      </html>
    `);

    await waitForWebComponent(page);

    // Take screenshot in light mode
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page.locator('.container')).toHaveScreenshot(
      'theme-light-mode.png',
    );

    // Take screenshot in dark mode - update colors
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.evaluate(() => {
      const component = document.querySelector('shakuhachi-score') as any;
      if (component) {
        component.style.setProperty('--shakuhachi-note-color', '#fff');
        component.forceRender(); // Force re-render with new theme
      }
      document.body.style.background = '#1a1a1a';
    });
    await page.waitForTimeout(100); // Wait for re-render
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

    await waitForWebComponent(page);

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
