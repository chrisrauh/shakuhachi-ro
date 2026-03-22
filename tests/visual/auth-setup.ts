/**
 * Auth Setup for Visual Regression Tests
 *
 * Runs once before any tests in the 'auth' project.
 * Logs in with the test account and saves the browser storage state
 * so all auth tests can reuse the session without re-authenticating.
 */

import * as fs from 'fs';
import * as path from 'path';

import { test as setup } from '@playwright/test';

const TEST_EMAIL = process.env.TEST_EMAIL || '';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '';
export const AUTH_FILE = 'tests/visual/.auth/user.json';

setup('authenticate', async ({ page }) => {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error('TEST_EMAIL and TEST_PASSWORD must be set in .env file');
  }

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  await page.goto('/');
  await page.waitForSelector('button:has-text("Log In")', { state: 'visible' });
  await page.locator('button:has-text("Log In")').first().click();

  await page.waitForSelector('#auth-email', { state: 'visible' });
  await page.fill('#auth-email', TEST_EMAIL);
  await page.fill('#auth-password', TEST_PASSWORD);
  await page.click('#auth-submit');

  // Wait for modal to close and auth state to propagate
  await page.waitForSelector('.auth-modal', {
    state: 'hidden',
    timeout: 10000,
  });
  await page.waitForTimeout(500);

  await page.context().storageState({ path: AUTH_FILE });
});
