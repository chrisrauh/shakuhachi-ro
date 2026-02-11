import { chromium } from 'playwright';

async function takeScreenshot() {
  // Get port from command-line argument, default to 3002
  const port = process.argv[2] || '3002';
  const baseUrl = `http://localhost:${port}`;

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

    await page.goto(`${baseUrl}?debug=true`, {
      waitUntil: 'networkidle',
    });

    await page.screenshot({
      path: 'screenshots/current-debug.png',
      fullPage: true,
    });

    await page.goto(`${baseUrl}?octaveDots=false`, {
      waitUntil: 'networkidle',
    });

    await page.screenshot({
      path: 'screenshots/current-no-octave-dots.png',
      fullPage: true,
    });

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

    await page.goto(`${baseUrl}?debug=true`, {
      waitUntil: 'networkidle',
    });

    await page.screenshot({
      path: 'screenshots/current-dark-debug.png',
      fullPage: true,
    });

    await page.goto(`${baseUrl}?octaveDots=false`, {
      waitUntil: 'networkidle',
    });

    await page.screenshot({
      path: 'screenshots/current-dark-no-octave-dots.png',
      fullPage: true,
    });

    console.log('Screenshots saved to screenshots/');
    console.log(
      'Light mode: current.png, current-debug.png, current-no-octave-dots.png',
    );
    console.log(
      'Dark mode: current-dark.png, current-dark-debug.png, current-dark-no-octave-dots.png',
    );
  } catch (error) {
    console.error('Error taking screenshot:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

takeScreenshot();
