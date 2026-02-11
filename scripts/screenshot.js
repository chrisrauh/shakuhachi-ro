import { chromium } from 'playwright';
import { rename } from 'fs/promises';
import { existsSync } from 'fs';

async function takeScreenshot() {
  // Parse arguments: port, optional --debug flag, and optional --path=<url>
  const args = process.argv.slice(2);
  const port = args.find((arg) => !arg.startsWith('--')) || '3002';
  const debugMode = args.includes('--debug');
  const pathArg = args.find((arg) => arg.startsWith('--path='));
  const urlPath = pathArg ? pathArg.replace('--path=', '') : '/';
  const baseUrl = `http://localhost:${port}${urlPath}`;

  // Rename existing screenshots before taking new ones
  const screenshotsToRename = [
    'screenshots/current.png',
    'screenshots/current-dark.png',
  ];
  if (debugMode) {
    screenshotsToRename.push(
      'screenshots/current-debug.png',
      'screenshots/current-dark-debug.png',
    );
  }

  for (const screenshot of screenshotsToRename) {
    if (existsSync(screenshot)) {
      const beforePath = screenshot.replace('current', 'before');
      try {
        await rename(screenshot, beforePath);
        console.log(`Renamed ${screenshot} → ${beforePath}`);
      } catch (error) {
        console.warn(`Could not rename ${screenshot}:`, error.message);
      }
    }
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Light mode screenshots
    await page.goto(baseUrl, {
      waitUntil: 'networkidle',
    });

    await page.screenshot({
      path: 'screenshots/current.png',
      fullPage: true,
    });

    if (debugMode) {
      await page.goto(`${baseUrl}?debug=true`, {
        waitUntil: 'networkidle',
      });

      await page.screenshot({
        path: 'screenshots/current-debug.png',
        fullPage: true,
      });
    }

    // Switch to dark mode
    await page.goto(baseUrl, {
      waitUntil: 'networkidle',
    });

    // Wait for theme switcher and toggle to dark mode
    await page.waitForSelector('#theme-toggle');
    await page.click('#theme-toggle');
    // Wait for localStorage to be written and theme to apply
    await page.waitForTimeout(500);

    // Dark mode screenshots - theme should persist from localStorage
    await page.screenshot({
      path: 'screenshots/current-dark.png',
      fullPage: true,
    });

    if (debugMode) {
      await page.goto(`${baseUrl}?debug=true`, {
        waitUntil: 'networkidle',
      });

      await page.screenshot({
        path: 'screenshots/current-dark-debug.png',
        fullPage: true,
      });
    }

    console.log('\nScreenshots saved to screenshots/');
    console.log(`URL: ${baseUrl}`);
    console.log('Light mode: current.png');
    console.log('Dark mode: current-dark.png');
    if (debugMode) {
      console.log('Debug mode: current-debug.png, current-dark-debug.png');
    }
  } catch (error) {
    console.error('Error taking screenshot:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

takeScreenshot();
