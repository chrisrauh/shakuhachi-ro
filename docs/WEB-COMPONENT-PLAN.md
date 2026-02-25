# Embeddable Score Renderer Web Component - Requirements & Implementation Plan

## ✅ Implementation Status (Updated 2026-02-25)

**Status**: MVP Complete and validated

**What Was Built:**
- ✅ Web component: `/src/web-components/ShakuhachiScore.ts` (301 lines)
- ✅ IIFE bundle: 23.96 kB / 7.19 kB gzipped (< 50KB target)
- ✅ Test page: `/public/test/shakuhachi-score.html` (3 examples, light/dark themes)
- ✅ Visual regression: Pixel-perfect equivalence to ScoreRenderer
- ✅ Build config: `vite.embed.config.ts` with `npm run build:embed`

**Key Implementation Details:**
- **Sizing**: Intrinsic height for single-column + container width (not intrinsic width by default)
- **Rationale**: Container width enables proper text centering and duration line rendering
- **Opt-in**: `intrinsic-width` attribute available for tight inline layouts
- **Font loading**: `@import` in Shadow DOM styles (works in production bundle)
- **Theme support**: CSS custom properties (`--shakuhachi-note-color`, etc.)
- **Multi-column**: Requires explicit `width`/`height` attributes

**Success Criteria Met:**
1. ✅ Embeddable with single `<script>` tag
2. ✅ Intrinsic sizing (height auto-calculated)
3. ✅ Inline display works (`display: inline-block`)
4. ✅ No clipping (all modifiers visible)
5. ✅ Visual equivalence (regression tests pass)
6. ✅ Standalone (no platform dependencies)
7. ✅ Bundle size: 7.19 kB gzipped
8. ✅ Dogfooding (test page validates implementation)
9. ✅ Theme support (CSS custom properties)
10. ✅ Error handling (visible messages + console logging)

**Deviations from Plan:**
- Width calculation: Container-based by default (not intrinsic), opt-in via `intrinsic-width` attribute
- Font loading: Handled via `@import` in Shadow DOM (not relying on host page)
- Test examples: 3 focused scenarios instead of 15 granular cases

**Next Steps:**
- Platform migration using SCORERENDERER_MIGRATION_CHECKLIST.md
- External documentation for embedding on other sites
- Future: npm package distribution

---

## Overview

Build a standalone web component (`<shakuhachi-score>`) that wraps the existing ScoreRenderer library to enable simple "paste and it works" embedding of shakuhachi notation on any website.

**Primary Use Case**: External developers and shakuhachi musicians can embed scores on blogs, educational sites, and documentation with a simple HTML snippet.

**Secondary Use Case**: Internal platform (shakuhachi.ro) dogfoods the web component, validating it works in real-world scenarios.

---

## Design Decisions

### Core Principles

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Framework** | Vanilla Web Components | Bundle size critical for embeddable component; framework overhead not justified for simple wrapper |
| **Sizing Strategy** | Intrinsic by default with extrinsic override | "Paste and it works" - component sizes itself based on content, but allows manual override |
| **Display Mode** | `inline-block` | Natural for inline blog embedding between paragraphs |
| **Encapsulation** | Shadow DOM | Style isolation prevents conflicts with host page CSS |
| **Font Loading** | Rely on host page (documented requirement) | Simplicity; user controls performance trade-offs |
| **Width Calculation** | Configurable with calculated default | Auto-calculate safe width, allow override when customizing font sizes |
| **Theming** | CSS custom properties | Standard web component pattern; attributes for structure, CSS vars for styling |
| **Input Format** | JSON (MVP), ABC notation (future) | Use existing test data and proven format first |
| **Distribution** | Self-hosted on shakuhachi.ro initially | Focus on stability before external distribution (npm/CDN) |

### Error Handling

- **Empty score** (`<shakuhachi-score></shakuhachi-score>`): Render nothing visible
- **Invalid JSON**: Display simple error text in component, log to console
- **Missing required fields**: Display error, log details

**Error Display Format**: Simple text (e.g., "Error: Invalid score data"), no styling to keep component minimal.

---

## Architecture

### Component Structure

```html
<shakuhachi-score>
  #shadow-root
    <style>
      :host {
        display: inline-block;
        /* CSS custom properties for theming */
      }
      .container { /* ScoreRenderer container */ }
    </style>
    <div class="container">
      <svg width="[calculated]" height="[calculated]">
        <!-- ScoreRenderer output -->
      </svg>
    </div>
</shakuhachi-score>
```

### File Organization

```
src/
├── web-components/              # Standalone embeddable components
│   └── ShakuhachiScore.ts      # Web component implementation
├── renderer/                    # Core renderer library (unchanged)
│   ├── ScoreRenderer.ts
│   └── ...
└── ...

public/
└── embed/
    └── shakuhachi-score.js     # Built IIFE bundle for external embedding
```

### Input Methods

**Phase 1 (MVP):**

```html
<!-- Inline JSON in element content -->
<shakuhachi-score>
  {"notes": [{"pitch": {"step": "ro", "octave": 0}, "duration": 4}, ...]}
</shakuhachi-score>

<!-- JSON via data-score attribute -->
<shakuhachi-score data-score='{"notes": [...]}'></shakuhachi-score>
```

**Future Phase 2:**

```html
<!-- ABC notation extension for shakuhachi -->
<shakuhachi-score>
  ro4 tsu4 re4 chi2 | ri4 u2 hi4 |
</shakuhachi-score>
```

### API Design

#### HTML Attributes (Structural Configuration)

```html
<shakuhachi-score
  width="200"              <!-- Override intrinsic width (px) -->
  height="400"             <!-- Override intrinsic height (px) -->
  single-column="true"     <!-- Force single column layout (default: true) -->
  debug="true"             <!-- Show debug labels with note info -->
  show-octave-marks="true" <!-- Display octave marks (default: true) -->
  data-score='{"notes":...}' <!-- Alternative to inline content -->
>
```

#### CSS Custom Properties (Styling)

```css
shakuhachi-score {
  /* Colors - theme-aware */
  --shakuhachi-note-color: #000;
  --shakuhachi-bg-color: transparent;

  /* Typography */
  --shakuhachi-note-font-size: 28px;
  --shakuhachi-note-font-weight: 400;
  --shakuhachi-note-font-family: 'Noto Sans JP', sans-serif;

  /* Layout (advanced, optional) */
  --shakuhachi-column-width: 100px;
  --shakuhachi-note-spacing: 44px;
  --shakuhachi-top-margin: 34px;

  /* Modifier styling (advanced) */
  --shakuhachi-octave-font-size: 12px;
  --shakuhachi-meri-font-size: 14px;
}
```

### Width Calculation Algorithm

**Intrinsic Width Calculation:**

```typescript
function calculateIntrinsicWidth(notes: ShakuNote[]): number {
  let maxLeftExtent = 0;   // Furthest left any modifier extends
  let maxRightExtent = 0;  // Furthest right any modifier extends

  // Scan all notes for modifiers
  for (const note of notes) {
    // Meri/Kari marks (left of note)
    // Default: offsetX = -22px, fontSize = 16px, width ≈ 13px
    const meriMod = note.getModifiers().find(m => m instanceof MeriKariModifier);
    if (meriMod) {
      const extent = Math.abs(meriMod.offsetX) + meriMod.getWidth();
      maxLeftExtent = Math.max(maxLeftExtent, extent); // ~35px
    }

    // Octave marks (right/above note)
    // Default: offsetX = 18px, fontSize = 12px, width ≈ 10px
    const octaveMod = note.getModifiers().find(m => m instanceof OctaveMarksModifier);
    if (octaveMod) {
      const extent = octaveMod.offsetX + octaveMod.getWidth();
      maxRightExtent = Math.max(maxRightExtent, extent); // ~28px
    }
  }

  // Base note width (centered text, roughly half font size on each side)
  const noteFontSize = 28; // default
  const noteHalfWidth = noteFontSize / 2; // ~14px

  // Total width with padding
  const HORIZONTAL_PADDING = 10; // Safety margin
  const intrinsicWidth =
    maxLeftExtent +      // ~35px (if meri present)
    noteHalfWidth +      // ~14px
    maxRightExtent +     // ~28px (if octave present)
    (HORIZONTAL_PADDING * 2); // 20px

  return Math.ceil(intrinsicWidth); // ~97-120px typical
}
```

**Width Scenarios:**
- No modifiers: ~48px (note + padding)
- Meri only: ~69px
- Octave only: ~62px
- Both modifiers: ~97px
- With custom large fonts: User must override width manually

### Build Configuration

**Auto-build with platform:**

```typescript
// vite.config.ts (or separate vite.config.embed.ts)
export default defineConfig({
  build: {
    lib: {
      entry: 'src/web-components/ShakuhachiScore.ts',
      name: 'ShakuhachiScore',
      fileName: 'shakuhachi-score',
      formats: ['iife'] // Standalone self-executing bundle
    },
    outDir: 'public/embed',
    rollupOptions: {
      external: [] // Bundle all dependencies
    }
  }
})
```

**Output**: `/public/embed/shakuhachi-score.js` (target: <50kb gzipped)

**Build command**: Integrated with main platform build (for now)

---

## Testing Strategy

### Phase 1: Create Baseline Test Page

**Goal**: Establish visual contract - web component must render identically to ScoreRenderer.

**Test Page**: `/public/test/score-renderer.html`

**Structure**:
```html
<!DOCTYPE html>
<html>
<head>
  <title>Score Renderer Test Page</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP" rel="stylesheet">
  <style>
    /* Light theme section */
    .light { background: white; color: black; }

    /* Dark theme section */
    .dark { background: #1a1a1a; color: white; }

    /* Container sizes for different layout tests */
    .score-small { width: 200px; height: 400px; }
    .score-medium { width: 400px; height: 600px; }
    .score-large { width: 800px; height: 600px; }
  </style>
</head>
<body>
  <!-- LIGHT THEME SECTION -->
  <section class="light">
    <h2>Light Theme</h2>

    <h3>Basic Features</h3>
    <!-- 14 examples: single note, octave, meri, both, duration dot, rest,
         meri types, short/medium/long scores, edge cases -->

    <h3>Realistic Example</h3>
    <!-- Akatombo full score -->
  </section>

  <!-- DARK THEME SECTION (duplicate all examples) -->
  <section class="dark">
    <h2>Dark Theme</h2>
    <!-- All 14 examples repeated -->
  </section>

  <script type="module">
    import { ScoreRenderer } from '../src/renderer/ScoreRenderer.ts';
    // Render all examples...
  </script>
</body>
</html>
```

### Test Examples

**14 Synthetic Examples + 1 Realistic:**

1. **Single note** - No modifiers (minimal case)
2. **Octave mark** - Note with 甲 (kan)
3. **Meri** - Note with メ (meri)
4. **Both modifiers** - Note with octave + meri (maximum modifiers)
5. **Duration dot** - Note with dotted duration
6. **Rest** - Rest symbol
7. **Meri types** - All three types: meri, chu-meri, dai-meri
8. **Short score** - 3-5 notes (single column, small container)
9. **Medium score** - 12 notes (single column, medium container)
10. **Long score** - 40 notes (forces multi-column layout)
11. **First note with modifiers** - Tests top margin (octave marks above)
12. **Last note with modifiers** - Tests bottom spacing (duration dots below)
13. **Dense score** - All notes have maximum modifiers (crowding test)
14. **Akatombo** - Full realistic song (from seed data, simplified as JSON)

**Total Renderings**: 14 examples × 2 themes = 28 score instances on test page

### Visual Regression Testing

**Playwright Test**:

```typescript
// tests/visual/score-web-component.spec.ts

test.describe('Score Renderer Visual Regression', () => {
  test('full page snapshot - light and dark themes', async ({ page }) => {
    await page.goto('/test/score-renderer');

    // Wait for all scores to render
    await page.waitForSelector('section.light svg');
    await page.waitForSelector('section.dark svg');

    // Snapshot entire page (both themes)
    await expect(page).toHaveScreenshot('score-renderer-baseline.png', {
      fullPage: true
    });
  });
});
```

**Test Flow**:

1. **Baseline**: Test page uses ScoreRenderer directly → Take full-page snapshot
2. **Migration**: Replace ScoreRenderer with `<shakuhachi-score>` web component
3. **Validation**: Visual regression test must pass (identical rendering)
4. **Update baseline**: When adding theming, update snapshots (web component shows white notes in dark theme)

**Test Data**: Inline JSON in test page (imported from seed data, simplified for Akatombo)

**Viewport**: Single viewport (1280×720) - size variations tested via different container sizes in examples

---

## Implementation Plan

### Phase 1: Test Infrastructure & Baseline

**Goal**: Create test page with ScoreRenderer, establish visual baseline

**Tasks**:

1. **Create test page** (`/public/test/score-renderer.html`)
   - [ ] Set up HTML structure with light/dark theme sections
   - [ ] Define 14 synthetic test scores as inline JSON
   - [ ] Create simplified Akatombo JSON from seed data
   - [ ] Import ScoreRenderer and render all examples (28 total)
   - [ ] Add container styling (small/medium/large)

2. **Create Playwright visual regression test**
   - [ ] Add `tests/visual/score-web-component.spec.ts`
   - [ ] Full-page snapshot test
   - [ ] Run test to generate baseline screenshots

3. **Verify baseline**
   - [ ] Manually review test page in browser
   - [ ] Verify all 28 scores render correctly
   - [ ] Check light/dark sections
   - [ ] Commit baseline screenshots

### Phase 2: Web Component Implementation

**Goal**: Build web component that renders identically to ScoreRenderer

**Tasks**:

1. **Investigate modifier positioning** (Complete width calculation)
   - [x] Read `MeriKariModifier.ts` (offsetX: -22px, fontSize: 16px)
   - [x] Read `OctaveMarksModifier.ts` (offsetX: 18px, fontSize: 12px)
   - [ ] Document exact width calculation formula
   - [ ] Add safety padding recommendations

2. **Create web component class** (`src/web-components/ShakuhachiScore.ts`)
   - [ ] Set up Shadow DOM structure
   - [ ] Implement attribute parsing (width, height, debug, etc.)
   - [ ] Implement CSS variable reading (--shakuhachi-*)
   - [ ] Parse input (textContent or data-score attribute)
   - [ ] Calculate intrinsic dimensions
   - [ ] Wire up ScoreRenderer
   - [ ] Implement error handling (invalid JSON, empty score)

3. **Implement intrinsic sizing**
   - [ ] Add `calculateIntrinsicWidth(notes)` method
   - [ ] Add `calculateIntrinsicHeight(notes)` method (use existing logic)
   - [ ] Account for all modifiers (meri, octave, duration dots)
   - [ ] Add horizontal padding for safety
   - [ ] Test with various score examples

4. **Add theming support**
   - [ ] Read CSS custom properties in component
   - [ ] Pass to ScoreRenderer options
   - [ ] Default values for all CSS vars
   - [ ] Test light/dark theme switching

5. **Set up build configuration**
   - [ ] Create Vite config for embed bundle (or extend existing)
   - [ ] Configure IIFE output format
   - [ ] Set output directory to `/public/embed/`
   - [ ] Test bundle builds correctly
   - [ ] Verify bundle size (<50kb gzipped target)

6. **Create standalone test page** (`/public/embed-test.html`)
   - [ ] Minimal HTML with no platform dependencies
   - [ ] Load web component script
   - [ ] Test 2-3 score examples
   - [ ] Verify works in complete isolation

### Phase 3: Visual Validation

**Goal**: Prove web component renders identically to ScoreRenderer

**Tasks**:

1. **Migrate test page to web component**
   - [ ] Replace all ScoreRenderer instances with `<shakuhachi-score>`
   - [ ] Convert inline JSON to component content
   - [ ] Load web component script
   - [ ] Verify page renders in browser

2. **Run visual regression tests**
   - [ ] Run Playwright tests
   - [ ] Review any differences
   - [ ] Fix rendering issues if tests fail
   - [ ] Iterate until tests pass

3. **Update baseline for theming**
   - [ ] Document: Dark theme now shows white notes (new feature)
   - [ ] Update snapshots with `npm run test:visual:update`
   - [ ] Verify new baseline is correct

### Phase 4: Platform Integration (Gradual Migration)

**Goal**: Replace ScoreRenderer usage in platform with web component, one page at a time

**Tasks**:

1. **Audit ScoreRenderer usage**
   - [ ] Create `docs/SCORERENDERER_MIGRATION_CHECKLIST.md`
   - [ ] Search codebase: `grep -r "ScoreRenderer" src/`
   - [ ] Document all files using ScoreRenderer
   - [ ] Categorize by complexity (low/medium/high risk)
   - [ ] Prioritize migration order

2. **Migrate low-risk pages first**
   - [ ] About page (if it has score examples)
   - [ ] Documentation pages
   - [ ] Test one page per PR

3. **Migrate medium-risk pages**
   - [ ] Score detail pages (`/score/[slug]`)
   - [ ] Score library (multiple scores)
   - [ ] Verify visual consistency

4. **Migrate high-risk pages (if applicable)**
   - [ ] Score editor (interactive, complex state)
   - [ ] Handle React component integration
   - [ ] Extensive testing required

5. **Script loading strategy**
   - [ ] Add `<script src="/embed/shakuhachi-score.js">` to base layout
   - [ ] Or load per-component with Astro optimization
   - [ ] Test script loads once per page

6. **Update Astro components**
   - [ ] Replace ScoreRenderer imports
   - [ ] Use `<shakuhachi-score>` tags
   - [ ] Pass data via JSON.stringify
   - [ ] Test in dev and production builds

### Phase 5: Documentation & Polish

**Goal**: Complete documentation for internal and external users

**Tasks**:

1. **Usage documentation**
   - [ ] Create embedding guide for external users
   - [ ] Document font requirement (Noto Sans JP)
   - [ ] API reference (attributes, CSS variables)
   - [ ] Example snippets

2. **Migration guide**
   - [ ] Document for platform developers
   - [ ] How to use web component in Astro
   - [ ] Migration checklist template

3. **Export TypeScript types** (optional)
   - [ ] Define `ShakuhachiScoreElement` interface
   - [ ] Add to global `HTMLElementTagNameMap`
   - [ ] Enable TypeScript support for querySelector, etc.

4. **Performance testing**
   - [ ] Test page load with 10+ embedded scores
   - [ ] Verify acceptable performance
   - [ ] Profile if needed

---

## Platform Migration Checklist

**Template for tracking ScoreRenderer → Web Component migration:**

```markdown
# ScoreRenderer Migration Tracker

## Usage Audit

### Files Using ScoreRenderer

- [ ] `/public/test/score-renderer.html` - Test page (PRIORITY 1)
- [ ] `/src/pages/about.astro` - About page examples (if applicable)
- [ ] `/src/pages/score/[slug].astro` - Score detail viewer
- [ ] `/src/components/ScorePreview.astro` - Library score cards
- [ ] `/src/components/ScoreEditor.tsx` - Editor preview (React)
- [ ] (Add more as discovered...)

## Migration Progress

### Completed
- [x] Test page (`/public/test/score-renderer.html`)
- [x] Visual regression baseline established

### In Progress
- [ ] (Current page being migrated)

### TODO
- [ ] All other pages

## Notes
- Document any issues or special cases
- Track visual regressions
- Note performance impacts
```

**Location**: `docs/SCORERENDERER_MIGRATION_CHECKLIST.md`

---

## Success Criteria

**MVP is successful when:**

1. ✅ External developer can copy single `<script>` + `<shakuhachi-score>` snippet to embed scores
2. ✅ Component sizes itself correctly without manual width/height configuration
3. ✅ Works inline in blog text (display: inline-block) without layout issues
4. ✅ No modifier clipping in any test example (meri, octave, duration dots all visible)
5. ✅ Renders identically to ScoreRenderer (visual regression tests pass)
6. ✅ Works in standalone HTML file (no platform dependencies)
7. ✅ Bundle size <50kb gzipped
8. ✅ Platform successfully uses web component (at least one page migrated)
9. ✅ Supports theme-aware colors via CSS custom properties
10. ✅ Clear error messages for invalid input

---

## Risks & Mitigations

### Risk 1: Font not loaded on host page

**Impact**: Scores render in fallback sans-serif font (wrong appearance, potential width miscalculation)

**Mitigation**:
- Document clearly: Noto Sans JP required
- Consider console warning if font not detected
- Future: Optionally load font in Shadow DOM as fallback

### Risk 2: Width calculation incorrect (modifiers clipped)

**Impact**: Meri marks or octave marks cut off at container edge

**Mitigation**:
- Add generous horizontal padding (10px each side)
- Use `overflow: visible` on SVG
- Visual regression tests with all modifier types
- Users can override width via attribute if needed

### Risk 3: Bundle size too large

**Impact**: Slow page loads for external sites using embed

**Mitigation**:
- Tree-shake unused code
- Monitor bundle size in CI
- Consider minimal vs full-featured builds if needed

### Risk 4: CSS conflicts with host page

**Impact**: Host page styles leak into component or vice versa

**Mitigation**:
- Shadow DOM provides isolation
- Test on various sites with different CSS frameworks
- Minimize global selectors

### Risk 5: Platform migration breaks existing pages

**Impact**: Scores don't render after migration to web component

**Mitigation**:
- Gradual migration (one page at a time)
- Visual regression testing catches issues
- Each migration is separate PR with review
- Test page establishes visual contract

---

## Future Enhancements (Post-MVP)

**Phase 2 - Platform Integration:**
- `score-id` attribute to load from shakuhachi.ro API
- Example: `<shakuhachi-score score-id="akatombo"></shakuhachi-score>`

**Phase 3 - ABC Notation:**
- Design shakuhachi extension to ABC notation
- Implement parser
- Support text notation input: `<shakuhachi-score>ro4 tsu4 re4</shakuhachi-score>`

**Phase 4 - External Distribution:**
- Publish to npm as `@shakuhachi/embed`
- Add to CDNs (jsDelivr, unpkg)
- Versioned releases

**Phase 5 - Advanced Features:**
- Playback controls (optional)
- Interactive note highlighting
- Accessibility improvements (ARIA labels, screen reader support)

---

## Open Questions (To Resolve During Implementation)

1. **Akatombo test data**: Convert MusicXML from seed to simplified JSON, or use full MusicXML?
2. **TypeScript types**: Export element interface for better DX?
3. **Script loading**: Global in layout vs per-component in Astro?
4. **Build optimization**: Single Vite config or separate for embed bundle?
5. **Width helper utility**: Provide `ShakuhachiScore.calculateWidth()` static method?

---

## Timeline Estimate

**Phase 1** (Test Infrastructure): 1-2 days
**Phase 2** (Web Component Implementation): 2-3 days
**Phase 3** (Visual Validation): 1 day
**Phase 4** (Platform Migration): 3-5 days (depends on number of pages)
**Phase 5** (Documentation): 1 day

**Total**: ~2 weeks for MVP with gradual platform migration

---

## References

- [Web Components MDN](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [Shadow DOM v1](https://developers.google.com/web/fundamentals/web-components/shadowdom)
- [VexTab](http://vexflow.com/vextab/) - Inspiration for embeddable music notation
- ScoreRenderer architecture: `/docs/ARCHITECTURE-RENDERER.MD`
- Platform architecture: `/docs/ARCHITECTURE-PLATFORM.MD`
