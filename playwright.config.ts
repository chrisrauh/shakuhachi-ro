import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Playwright configuration for visual regression testing
 *
 * See https://playwright.dev/docs/test-configuration
 *
 * Projects:
 *   setup      — runs auth-setup.ts once, saves session to .auth/user.json
 *   no-auth    — unauthenticated tests (visual-regression, toast, content-pages, etc.)
 *   auth       — authenticated tests (score-editor), depends on setup
 *
 * All three projects run in parallel (workers: 3), and within each project
 * tests run in parallel too (fullyParallel: true). This eliminates the main
 * bottleneck where slow auth-dependent editor tests blocked everything else.
 */
export default defineConfig({
  // Test directory
  testDir: './tests/visual',

  // Output directory for test artifacts
  outputDir: './tests/visual/test-results',

  // Timeout for each test
  timeout: 30000,

  // Test settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI, // Fail if test.only in CI
  retries: process.env.CI ? 2 : 0, // Retry failed tests in CI
  workers: 3, // Parallel: setup + no-auth + auth run concurrently

  // Reporter configuration
  reporter: [['html', { outputFolder: 'tests/visual/reports' }], ['list']],

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

  // Configure projects
  projects: [
    // Auth setup — runs once, saves session to .auth/user.json
    {
      name: 'setup',
      testMatch: /auth-setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },

    // Unauthenticated tests — no dependency on setup
    {
      name: 'no-auth',
      testMatch: [
        /landing\.spec\.ts/,
        /score-detail\.spec\.ts/,
        /buttons\.spec\.ts/,
        /shakuhachi-score\.spec\.ts/,
        /toast\.spec\.ts/,
        /web-component-columns\.spec\.ts/,
        /score-detail-layout\.spec\.ts/,
        /content-pages\.spec\.ts/,
      ],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },

    // Authenticated tests — depend on setup completing first
    {
      name: 'auth',
      testMatch: [/score-editor\.spec\.ts/],
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        storageState: 'tests/visual/.auth/user.json',
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
