const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // Go to editor page
  await page.goto('http://localhost:3002/editor');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Fill in title to pass validation
  await page.fill('input[placeholder="Score title"]', 'Test Score');
  await page.waitForTimeout(200);

  // Switch to JSON format
  await page.click('input[value="json"]');
  await page.waitForTimeout(200);

  // Enter sample score data
  const sampleScore = JSON.stringify({
    notes: [
      { pitch: 're', octave: 'otsu' },
      { pitch: 'ro', octave: 'otsu' },
      { pitch: 'tsu', octave: 'otsu' },
      { pitch: 're', octave: 'otsu', meri: 'chu' },
      { pitch: 'chi', octave: 'kan' }
    ]
  }, null, 2);

  await page.fill('#score-data-input', sampleScore);
  await page.waitForTimeout(1500);

  // Take light mode screenshot with score
  await page.screenshot({ path: 'screenshots/score-render-light.png', fullPage: true });
  console.log('Light mode with score saved');

  // Switch to dark mode
  await page.click('#theme-toggle');
  await page.waitForTimeout(1500);

  // Take dark mode screenshot with score
  await page.screenshot({ path: 'screenshots/score-render-dark.png', fullPage: true });
  console.log('Dark mode with score saved');

  await browser.close();
})();
