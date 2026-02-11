const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // Go to editor page
  await page.goto('http://localhost:3002/editor');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Click the theme toggle button
  await page.click('#theme-toggle');
  await page.waitForTimeout(1000);

  // Take dark mode screenshot
  await page.screenshot({ path: 'screenshots/editor-dark.png', fullPage: true });
  console.log('Dark mode screenshot saved to screenshots/editor-dark.png');

  await browser.close();
})();
