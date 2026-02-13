/**
 * Visual Regression Tests for Score Detail Page Height
 *
 * These tests verify that the score renderer properly fills the viewport height
 * and prevents regressions where the renderer doesn't use full-height layout.
 *
 * Key aspects tested:
 * - Score renderer fills viewport height (below header)
 * - Flex layout properties are applied correctly
 * - Body has full-height class when fullHeight prop is enabled
 * - Works across different viewport sizes
 */

import { test, expect } from '@playwright/test';

test.describe('Score Detail Page - Height', () => {
  test('score renderer fills full viewport height', async ({ page }) => {
    // Navigate to a score detail page
    await page.goto('/score/akatombo');
    await page.waitForLoadState('networkidle');

    // Get viewport and score renderer dimensions
    const viewportHeight = page.viewportSize()!.height;
    const headerHeight = await page.locator('header[data-astro-cid-sckkx6r4]').first().boundingBox();
    const rendererBox = await page.locator('#score-renderer-container').boundingBox();

    // Verify renderer exists and has dimensions
    expect(rendererBox).not.toBeNull();

    // Calculate expected minimum height (viewport - header - margin/padding buffer)
    const expectedMinHeight = viewportHeight - (headerHeight?.height || 0) - 100; // 100px buffer for spacing

    // Verify renderer fills most of available space
    expect(rendererBox!.height).toBeGreaterThan(expectedMinHeight);

    // Verify renderer container has flex properties
    const rendererStyles = await page.locator('#score-renderer-container').evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        flex: computed.flex,
        minHeight: computed.minHeight,
        overflow: computed.overflow,
      };
    });

    expect(rendererStyles.flex).toBe('1 1 0%'); // flex: 1
    expect(rendererStyles.minHeight).toBe('0px');
  });

  test('score detail container has full-height flex layout', async ({ page }) => {
    await page.goto('/score/akatombo');
    await page.waitForLoadState('networkidle');

    // Verify score-detail-container has flex properties
    const containerStyles = await page.locator('.score-detail-container').evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        flexDirection: computed.flexDirection,
        flex: computed.flex,
      };
    });

    expect(containerStyles.display).toBe('flex');
    expect(containerStyles.flexDirection).toBe('column');
    expect(containerStyles.flex).toBe('1 1 0%');
  });

  test('body has full-height class when fullHeight enabled', async ({ page }) => {
    await page.goto('/score/akatombo');
    await page.waitForLoadState('networkidle');

    // Verify body has the full-height class
    const bodyClasses = await page.locator('body').evaluate((el) => el.className);
    expect(bodyClasses).toContain('full-height');

    // Verify body has correct height and flex properties
    const bodyStyles = await page.locator('body').evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        height: computed.height,
        display: computed.display,
        flexDirection: computed.flexDirection,
      };
    });

    // Body should be 100vh (or close to viewport height)
    const viewportHeight = page.viewportSize()!.height;
    expect(parseInt(bodyStyles.height)).toBe(viewportHeight);
    expect(bodyStyles.display).toBe('flex');
    expect(bodyStyles.flexDirection).toBe('column');
  });

  test('score renderer fills viewport on desktop (1280x720)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/score/akatombo');
    await page.waitForLoadState('networkidle');

    const viewportHeight = 720;
    const headerHeight = await page.locator('header[data-astro-cid-sckkx6r4]').first().boundingBox();
    const rendererBox = await page.locator('#score-renderer-container').boundingBox();

    expect(rendererBox).not.toBeNull();
    const expectedMinHeight = viewportHeight - (headerHeight?.height || 0) - 100;
    expect(rendererBox!.height).toBeGreaterThan(expectedMinHeight);
  });

  test('score renderer fills viewport on tablet (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/score/akatombo');
    await page.waitForLoadState('networkidle');

    const viewportHeight = 1024;
    const headerHeight = await page.locator('header[data-astro-cid-sckkx6r4]').first().boundingBox();
    const rendererBox = await page.locator('#score-renderer-container').boundingBox();

    expect(rendererBox).not.toBeNull();
    const expectedMinHeight = viewportHeight - (headerHeight?.height || 0) - 100;
    expect(rendererBox!.height).toBeGreaterThan(expectedMinHeight);
  });

  test('score renderer fills viewport on mobile (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/score/akatombo');
    await page.waitForLoadState('networkidle');

    const viewportHeight = 667;
    const headerHeight = await page.locator('header[data-astro-cid-sckkx6r4]').first().boundingBox();
    const rendererBox = await page.locator('#score-renderer-container').boundingBox();

    expect(rendererBox).not.toBeNull();
    const expectedMinHeight = viewportHeight - (headerHeight?.height || 0) - 100;
    expect(rendererBox!.height).toBeGreaterThan(expectedMinHeight);
  });
});
