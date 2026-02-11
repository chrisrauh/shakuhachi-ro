const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // Go to browse page
  await page.goto('http://localhost:3002/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Take light mode screenshot
  await page.screenshot({ path: 'screenshots/browse-light.png', fullPage: true });
  console.log('Browse light mode saved');

  // Switch to dark mode
  await page.click('#theme-toggle');
  await page.waitForTimeout(500);

  // Take dark mode screenshot
  await page.screenshot({ path: 'screenshots/browse-dark.png', fullPage: true });
  console.log('Browse dark mode saved');

  await browser.close();
})();
