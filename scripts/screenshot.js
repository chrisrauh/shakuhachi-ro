import { chromium } from 'playwright';

async function takeScreenshot() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to the dev server
    await page.goto('http://localhost:3002?debug=true', { waitUntil: 'networkidle' });

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/current.png',
      fullPage: true
    });

    console.log('Screenshot saved to screenshots/current.png');
  } catch (error) {
    console.error('Error taking screenshot:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

takeScreenshot();
