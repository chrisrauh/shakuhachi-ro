/**
 * Tests for the visual-test helpers themselves.
 *
 * A readiness helper that passes when it should not is worse than a missing
 * one: the caller screenshots a page that never rendered and stores it as a
 * baseline, so the suite then asserts the wrong thing and stays green. That
 * happened — an earlier `waitForScoreRendered` compared an optional-chained
 * lookup against `null`, returned immediately on a 404, and a 404 page was
 * written as a serif baseline.
 */

import { test, expect } from '@playwright/test';

import { waitForScoreRendered } from './helpers';

test.describe('waitForScoreRendered', () => {
  test('rejects on a page with no score rather than passing silently', async ({
    page,
  }) => {
    await page.goto('/this-route-does-not-exist');

    await expect(waitForScoreRendered(page)).rejects.toThrow();
  });

  test('resolves once a score has rendered', async ({ page }) => {
    await page.goto('/score/akatombo');

    await expect(waitForScoreRendered(page)).resolves.toBeUndefined();
  });
});
