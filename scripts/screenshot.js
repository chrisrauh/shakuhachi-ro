import { chromium } from 'playwright';

async function takeScreenshot() {
  // Get port from command-line argument, default to 3002
  const port = process.argv[2] || '3002';
  const baseUrl = `http://localhost:${port}`;

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to the dev server
    await page.goto(baseUrl, {
      waitUntil: 'networkidle',
    });

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/current.png',
      fullPage: true,
    });

    // Navigate to the dev server
    await page.goto(`${baseUrl}?debug=true`, {
      waitUntil: 'networkidle',
    });

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/current-debug.png',
      fullPage: true,
    });

    // Navigate with octave dots disabled
    await page.goto(`${baseUrl}?octaveDots=false`, {
      waitUntil: 'networkidle',
    });

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/current-no-octave-dots.png',
      fullPage: true,
    });

    console.log('Screenshots saved to screenshots/');
  } catch (error) {
    console.error('Error taking screenshot:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

takeScreenshot();
