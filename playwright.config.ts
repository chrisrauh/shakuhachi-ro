import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for visual regression testing
 *
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './tests/visual',

  // Timeout for each test
  timeout: 30000,

  // Test settings
  fullyParallel: false, // Run tests sequentially for visual stability
  forbidOnly: !!process.env.CI, // Fail if test.only in CI
  retries: process.env.CI ? 2 : 0, // Retry failed tests in CI
  workers: 1, // Single worker for visual consistency

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'tests/visual/reports' }],
    ['list'],
  ],

  // Shared settings for all tests
  use: {
    // Base URL for tests
    baseURL: 'http://localhost:3001',

    // Screenshot settings
    screenshot: 'only-on-failure',

    // Video settings
    video: 'retain-on-failure',

    // Trace settings
    trace: 'retain-on-failure',
  },

  // Configure projects for different browsers (desktop only)
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  // Web server configuration
  webServer: {
    command: 'npm run dev',
    port: 3001,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  // Visual comparison settings
  expect: {
    toHaveScreenshot: {
      // Strict threshold for pixel differences (0.1 = 10% tolerance)
      threshold: 0.1,

      // Maximum number of pixels that can differ
      maxDiffPixels: 100,

      // Maximum allowed difference ratio
      maxDiffPixelRatio: 0.01,

      // Animation settings
      animations: 'disabled',

      // Screenshot settings
      scale: 'css', // Use CSS pixels
    },
  },
});
