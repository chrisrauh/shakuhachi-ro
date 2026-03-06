/**
 * Visual Regression Tests for Score Editor Page - Mobile Viewport
 *
 * Tests the score editor (/score/[slug]/edit) on mobile viewport (375x667).
 *
 * Coverage:
 * - Mobile viewport (375x667)
 * - Light and dark themes
 * - Mobile panel toggle (editor vs preview)
 * - Authenticated state (editor requires login)
 *
 * Authentication Strategy:
 * - Authenticate through mobile hamburger menu
 * - Tests use real mobile user flow (no viewport switching)
 * - Mobile menu now includes "Log In" and "Sign Up" buttons
 */

import * as fs from 'fs';
import * as path from 'path';

import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.TEST_EMAIL || '';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '';
const TEST_SCORE_SLUG = 'test'; // Test score fixture (see CLAUDE.md)
const AUTH_FILE = 'tests/visual/.auth/user.json';

/**
 * Helper to set theme via data attribute
 */
async function setTheme(page: any, theme: 'light' | 'dark') {
  await page.emulateMedia({ colorScheme: theme });
  await page.evaluate((theme: string) => {
    document.documentElement.setAttribute('data-theme', theme);
  }, theme);
  // Wait for theme transition
  await page.waitForTimeout(100);
}

/**
 * Helper to authenticate with test account
 * Works on both mobile and desktop viewports
 */
async function authenticate(page: any) {
  // Navigate to a page that has auth widget
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Try mobile menu first (if visible)
  const mobileMenuButton = page.locator('#mobile-menu-toggle');
  if (await mobileMenuButton.isVisible()) {
    // Mobile flow
    await mobileMenuButton.click();
    await page.waitForSelector('.mobile-menu-dropdown', { state: 'visible' });
    await page.click('button.mobile-menu-item:has-text("Log In")');
  } else {
    // Desktop flow
    const loginButton = page.locator('button:has-text("Log In")').first();
    await loginButton.click();
  }

  // Rest is the same for both flows
  await page.waitForSelector('#auth-email', { state: 'visible' });
  await page.fill('#auth-email', TEST_EMAIL);
  await page.fill('#auth-password', TEST_PASSWORD);
  await page.click('#auth-submit');
  await page.waitForSelector('.auth-modal', { state: 'hidden', timeout: 5000 });
  await page.waitForTimeout(500);
}

/**
 * Helper to wait for editor to be fully loaded
 */
async function waitForEditor(page: any) {
  // Wait for ScoreEditor component to render
  await page.waitForSelector('#score-editor', { state: 'visible' });

  // Wait for form elements to be present
  await page.waitForSelector('input[placeholder="Score title"]', {
    state: 'visible',
  });

  // Wait for preview panel to exist (may be hidden on mobile)
  await page.waitForSelector('#score-preview', { state: 'attached' });

  // Wait for web component to render in shadow root
  await page.waitForFunction(() => {
    const c = document.querySelector('shakuhachi-score');
    return c?.shadowRoot?.querySelector('svg') !== null;
  });
}

test.describe('Score Editor Mobile Viewport (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 }, storageState: AUTH_FILE });

  test.beforeAll(async ({ browser }) => {
    if (!TEST_EMAIL || !TEST_PASSWORD) {
      throw new Error('TEST_EMAIL and TEST_PASSWORD must be set in .env file');
    }
    fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
    // Use empty storage state to bypass test.use({ storageState: AUTH_FILE })
    // (the file doesn't exist yet — we're about to create it)
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();
    await authenticate(page);
    await context.storageState({ path: AUTH_FILE });
    await page.close();
    await context.close();
  });

  test('Light mode - Editor panel default', async ({ page }) => {
    await page.goto(`/score/${TEST_SCORE_SLUG}/edit`);
    await setTheme(page, 'light');
    await waitForEditor(page);

    // On mobile, editor panel visible by default
    const editorPanel = page.locator('#editor-panel');
    const previewPanel = page.locator('#preview-panel');

    await expect(editorPanel).toBeVisible();
    await expect(previewPanel).toBeHidden();

    await expect(page).toHaveScreenshot('mobile-light-editor-panel.png', {
      fullPage: false,
    });
  });

  test('Dark mode - Editor panel default', async ({ page }) => {
    await page.goto(`/score/${TEST_SCORE_SLUG}/edit`);
    await setTheme(page, 'dark');
    await waitForEditor(page);

    await expect(page).toHaveScreenshot('mobile-dark-editor-panel.png', {
      fullPage: false,
    });
  });

  test('Toggle to preview panel', async ({ page }) => {
    await page.goto(`/score/${TEST_SCORE_SLUG}/edit`);
    await setTheme(page, 'light');
    await waitForEditor(page);

    // Click preview toggle button
    await page.click('#toggle-preview');
    await page.waitForTimeout(200);

    // Preview visible, editor hidden
    const editorPanel = page.locator('#editor-panel');
    const previewPanel = page.locator('#preview-panel');

    await expect(previewPanel).toBeVisible();
    await expect(editorPanel).toBeHidden();

    await expect(page).toHaveScreenshot('mobile-light-preview-panel.png', {
      fullPage: false,
    });
  });

  test('Toggle buttons state', async ({ page }) => {
    await page.goto(`/score/${TEST_SCORE_SLUG}/edit`);
    await setTheme(page, 'light');
    await waitForEditor(page);

    // Screenshot toggle buttons
    const toggleButtons = page.locator('.mobile-toggle');
    await expect(toggleButtons).toHaveScreenshot('mobile-toggle-buttons.png');
  });
});
