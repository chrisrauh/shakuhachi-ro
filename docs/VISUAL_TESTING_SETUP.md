# Visual Regression Testing Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
# Install Playwright Test framework
npm install --save-dev @playwright/test

# Install Chromium browser
npx playwright install chromium
```

### 2. Generate Baseline Screenshots

```bash
# Start dev server and generate baselines
npm run test:visual
```

**Note:** First run creates baseline images - all tests will pass.

### 3. Verify Setup

```bash
# Run tests again to verify comparison works
npm run test:visual
```

Should see: "6 passed" ✓

## Usage

### Run Visual Tests

```bash
npm run test:visual
```

### Update Baselines (after intentional visual changes)

```bash
npm run test:visual:update
```

### View Diff Report

```bash
npm run test:visual:report
```

### Debug Tests

```bash
npm run test:visual:debug
```

## Integration with Refactoring

### Before Each Phase

```bash
npm run test:visual  # Ensure baseline is clean
```

### After Each Phase

```bash
npm run test:visual  # Check for visual regressions
```

### If Tests Fail

1. View the diff report:
   ```bash
   npm run test:visual:report
   ```

2. Investigate differences:
   - **Bug:** Fix the code, re-run tests
   - **Expected:** Investigate why refactoring changed visuals (shouldn't happen!)
   - **Font/anti-aliasing:** Review if threshold needs adjustment

3. Only update baselines if absolutely necessary:
   ```bash
   npm run test:visual:update
   ```

## Configuration

All visual test configuration is in:
- `playwright.config.ts` - Playwright settings
- `tests/visual/visual-regression.spec.ts` - Test scenarios
- `tests/visual/README.md` - Detailed documentation

## Test Scenarios

1. **Full Akatombo score** (default, full page)
2. **Viewport rendering** (what user sees)
3. **Debug mode** (with romanji labels)
4. **Sanity checks** (SVG present, title displayed)

## Baseline Storage

Baselines are stored in `tests/visual/__screenshots__/` and **committed to git**.

This ensures:
- Everyone uses same baselines
- CI/CD can run visual tests
- Visual changes are tracked in git history

## Troubleshooting

### npm authentication error

If you see authentication errors during `npm install`:

```bash
# Option 1: Use CI flag to skip optional deps
npm install --save-dev @playwright/test --prefer-offline

# Option 2: Login to npm
npm login

# Option 3: Clear npm cache
npm cache clean --force
npm install --save-dev @playwright/test
```

### Tests fail on first run

Expected behavior! Run `npm run test:visual` twice:
1. First run: generates baselines
2. Second run: compares against baselines

### Visual differences detected

1. Run `npm run test:visual:report`
2. Review diff images carefully
3. Determine if difference is acceptable
4. Fix bugs or update baselines as appropriate

## Files Created

```
playwright.config.ts                           # Playwright configuration
tests/visual/
  visual-regression.spec.ts                   # Test suite
  README.md                                    # Detailed documentation
  __screenshots__/                            # Baselines (committed)
    chromium/
      akatombo-full-page.png
      akatombo-viewport.png
      akatombo-debug-full.png
      akatombo-debug-viewport.png
  reports/                                    # HTML reports (gitignored)
```

## Next Steps

After setup is complete:

1. ✅ Generate baselines
2. ✅ Verify tests pass
3. Start Phase 2 refactoring
4. Run visual tests after Phase 2
5. Repeat for each phase

## Resources

- [Playwright Visual Testing Docs](https://playwright.dev/docs/test-snapshots)
- [tests/visual/README.md](../tests/visual/README.md) - Detailed documentation
- [REFACTORING_PLAN.md](./REFACTORING_PLAN.md) - Overall refactoring plan
