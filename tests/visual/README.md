# Visual Regression Testing

This directory contains visual regression tests for the Shakuhachi Score Renderer using Playwright Test Framework.

## Purpose

Visual regression tests ensure that refactoring doesn't introduce unintended visual changes to the score rendering. After each refactoring phase, these tests compare screenshots against baseline images to detect any differences.

## Setup

### Prerequisites

1. **Install @playwright/test** (required):
   ```bash
   npm install --save-dev @playwright/test
   ```

2. **Install Playwright browsers** (one-time setup):
   ```bash
   npx playwright install chromium
   ```

### Configuration

- **Viewport:** Desktop 1280x720
- **Threshold:** 0.1 (strict - 10% tolerance for pixel differences)
- **Max Diff Pixels:** 100 (allows minor anti-aliasing differences)
- **Browser:** Chromium only (desktop)

## Test Scenarios

The test suite covers these scenarios:

1. **Full Akatombo score** - Default rendering (full page)
2. **Viewport rendering** - What user sees without scrolling
3. **Debug mode (full page)** - With romanji labels enabled
4. **Debug mode (viewport)** - Debug labels in viewport
5. **Sanity checks** - SVG element presence, title display

## Running Tests

### First Time: Generate Baseline Images

```bash
npm run test:visual
```

On first run, Playwright will:
- Start the dev server (localhost:3001)
- Generate baseline screenshots
- Store them in `tests/visual/__screenshots__/`
- All tests will PASS (no comparison yet)

### Subsequent Runs: Visual Regression Testing

```bash
npm run test:visual
```

Playwright will:
- Take new screenshots
- Compare against baselines
- Report any visual differences
- Generate HTML report with diff images

### Update Baselines (After Intentional Changes)

When you make intentional visual changes:

```bash
npm run test:visual:update
```

This regenerates all baseline images with the current rendering.

### View Diff Report

```bash
npm run test:visual:report
```

Opens an HTML report showing:
- Which tests passed/failed
- Side-by-side comparison of baseline vs. actual
- Diff highlighting showing exact pixel differences

### Debug Mode

```bash
npm run test:visual:debug
```

Runs tests with Playwright Inspector for debugging.

## Workflow

### During Refactoring

1. **Before starting a phase:**
   ```bash
   npm run test:visual  # Ensure all tests pass
   ```

2. **After completing changes:**
   ```bash
   npm run test:visual  # Check for visual regressions
   ```

3. **If tests fail:**
   ```bash
   npm run test:visual:report  # View diff report
   ```

4. **If differences are intentional:**
   ```bash
   npm run test:visual:update  # Update baselines
   ```

### Example: Phase 2 Workflow

```bash
# Before starting Phase 2
npm run test:visual                    # ✓ All pass

# Implement Phase 2 changes...

# After Phase 2 implementation
npm run test:visual                    # Check for regressions

# If visual changes detected
npm run test:visual:report             # Review differences

# If differences are bugs
# Fix the bugs and re-run tests

# If differences are expected (shouldn't happen in refactoring)
npm run test:visual:update             # Update baselines
```

## Baseline Images

Baseline screenshots are stored in:
```
tests/visual/
  visual-regression.spec.ts-snapshots/
    chromium/
      akatombo-full-page.png
      akatombo-viewport.png
      akatombo-debug-full.png
      akatombo-debug-viewport.png
```

**These files are committed to the repository** so that:
- Everyone has the same baselines
- CI/CD can run visual regression tests
- Visual changes are tracked in git history

## Threshold Configuration

Current settings (in `playwright.config.ts`):

```typescript
threshold: 0.1,           // 10% pixel color tolerance
maxDiffPixels: 100,       // Allow 100 pixels to differ
maxDiffPixelRatio: 0.01,  // Max 1% of pixels can differ
```

These strict settings ensure high fidelity but allow for:
- Minor anti-aliasing differences
- Font rendering variations across systems
- Small floating-point rounding differences

## Troubleshooting

### Tests fail on first run
- This is expected! First run generates baselines.
- Run `npm run test:visual` again to compare.

### Tests fail with small differences
- Check the diff report: `npm run test:visual:report`
- If differences are from font rendering, consider:
  - Increasing `maxDiffPixels` slightly
  - Using Docker for consistent rendering

### Dev server doesn't start
- Ensure port 3001 is available
- Check `npm run dev` works independently

### Baselines look wrong
- Delete `tests/visual/__screenshots__/` directory
- Run `npm run test:visual` to regenerate

## CI/CD Integration

In GitHub Actions, visual tests run automatically:

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install chromium

- name: Run visual regression tests
  run: npm run test:visual
```

Tests will fail the CI build if visual regressions are detected.

## Best Practices

1. **Always run visual tests before committing** refactoring changes
2. **Review diff reports carefully** - understand every pixel difference
3. **Update baselines deliberately** - only when visual changes are intentional
4. **Commit baseline updates** with clear commit messages explaining why
5. **Run tests on same OS** - rendering can vary slightly across platforms

## Files

- `visual-regression.spec.ts` - Test suite
- `playwright.config.ts` (repo root) - Playwright configuration
- `__screenshots__/` - Baseline images (auto-generated)
- `reports/` - HTML reports with diffs (auto-generated)
- `README.md` - This file

## Resources

- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots)
- [Playwright Test Configuration](https://playwright.dev/docs/test-configuration)
- [Playwright Assertions](https://playwright.dev/docs/test-assertions)
