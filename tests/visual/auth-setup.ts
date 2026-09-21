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

  // Wait for confirmed authentication, not for the modal to close: the modal
  // hides on submit whether or not the credentials were accepted, so it says
  // nothing about the session. The avatar must also be *enabled* — AuthWidget
  // speculatively renders a disabled avatar from a localStorage hint before
  // auth resolves (`showLoggedIn(initials, true)`), so visibility alone is
  // satisfied while the session is still missing.
  await page
    .locator('#auth-avatar:not([disabled])')
    .waitFor({ state: 'visible', timeout: 15000 });

  const state = await page.context().storageState({ path: AUTH_FILE });

  // Verify a session was actually captured. This previously failed silently:
  // the old code slept 500ms and saved whatever happened to be there, which
  // under `workers: 3` was routinely an empty state. Every test in the `auth`
  // project then ran logged out and hit the editor's client-side redirect,
  // surfacing 30s at a time as "waitForSelector timed out" rather than as an
  // auth problem. Failing here reports the real cause once.
  const hasSession = state.origins.some((origin) =>
    origin.localStorage.some((item) => /^sb-.+-auth-token$/.test(item.name)),
  );

  if (!hasSession) {
    throw new Error(
      `Login reported success but no Supabase session was saved to ${AUTH_FILE}. ` +
        'Every test in the "auth" project would run unauthenticated.',
    );
  }
});
