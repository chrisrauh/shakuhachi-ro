# ScoreRenderer → Web Component Migration Tracker

## Purpose

Track the gradual migration from direct `ScoreRenderer` usage to the `<shakuhachi-score>` web component across the shakuhachi.ro platform.

**Why migrate?**
- **Dogfooding**: Platform validates the web component works in real-world scenarios
- **Consistency**: Single rendering implementation across platform and external embeds
- **Simplification**: Declarative `<shakuhachi-score>` tags vs imperative ScoreRenderer setup
- **Testing**: Platform usage provides comprehensive test coverage

---

## Migration Strategy

1. **Low-risk first**: Start with static pages (About, documentation)
2. **One page per PR**: Each migration is isolated and reviewable
3. **Visual validation**: Verify rendering unchanged (compare before/after screenshots)
4. **Gradual rollout**: Don't rush; validate each step

---

## Usage Audit

### Files Using ScoreRenderer

**Test Pages:**
- [x] `/public/test/shakuhachi-score.html` - Test page (migrated, baseline established)

**Public Pages:**
- [ ] `/src/pages/about.astro` - About page examples (if applicable)
- [x] `/src/pages/score/[slug].astro` - Score detail viewer (migrated PR #126)
- [x] `/src/pages/score/[slug]/edit.astro` - Score editor page (migrated PR #127)
- [ ] `/src/pages/index.astro` - Homepage (if applicable)

**Components:**
- [ ] `/src/components/ScorePreview.astro` - Library score cards
- [x] `/src/components/ScoreDetailClient.ts` - Score detail interactions (migrated PR #126)
- [x] `/src/components/ScoreEditor.ts` - Editor preview (migrated PR #127)
- [ ] (Add more as discovered via `grep -r "ScoreRenderer" src/`)

---

## Migration Progress

### ✅ Completed

#### Test Page Migration (`/public/test/shakuhachi-score.html`) ✅

**Pre-migration:**
- [x] Take screenshot (before state)
- [x] Identify all ScoreRenderer instances on page (3 examples)
- [x] Note custom options (singleColumn, noteColor, intrinsic height)

**Migration:**
- [x] Replace ScoreRenderer import with web component script
- [x] Convert each instance to `<shakuhachi-score>` tag
- [x] Pass score data via data-score attribute with JSON.stringify
- [x] Migrate options to attributes/CSS variables
- [x] Test in dev server

**Validation:**
- [x] Take screenshot (after state)
- [x] Compare before/after visually (pixel-perfect match)
- [x] Test light/dark themes (side-by-side layout)
- [x] Test responsive behavior (single baseline at 1280×2000px)
- [x] Verify no console errors
- [x] Run visual regression tests (shakuhachi-score-full-page.png)

**Deployment:**
- [x] Create PR with screenshots (PR #123)
- [x] Get review approval
- [x] Merge and deploy
- [x] Verify in production

**Notes:**
- Fixed alignment and duration line rendering during migration
- Single-column uses intrinsic height + container width (not intrinsic width)
- Multi-column requires explicit width/height attributes

### 🚧 In Progress

#### About Page Migration (`/src/content/pages/about.mdx` + `/src/pages/about.astro`)

**Pre-migration:**
- [x] Take screenshot (before state)
- [x] Identify ScoreRenderer usage (code example in MDX)
- [x] Note custom options (none - just example code)

**Migration:**
- [x] Replace ScoreRenderer code example with web component example
- [x] Add "Live Example" section with Akatombo first phrase
- [x] Load web component script in about.astro with `is:inline` directive
- [x] Add CSS styling for score example (side-by-side layout)
- [x] Test in dev server

**Validation:**
- [x] Take screenshot (after state)
- [x] Compare before/after visually
- [x] Test light/dark themes
- [x] Test responsive behavior (mobile stacks vertically)
- [x] Verify no console errors (clean!)
- [ ] User review and approval
- [ ] Run visual regression tests

**Deployment:**
- [ ] Create PR with before/after screenshots
- [ ] Get review approval
- [ ] Merge and deploy
- [ ] Verify in production

**Notes:**
- Used `data-score` attribute with inline JSON for simplicity
- Added `single-column="true"` attribute for vertical layout
- Score example shows opening phrase of Akatombo (9 notes)
- Includes educational comments explaining notation features
- Mobile layout stacks score above comments (flexbox column direction)

#### Score Detail Page Migration (`/src/pages/score/[slug].astro`) ✅

**Pre-migration:**
- [x] Take screenshot (before state)
- [x] Identify ScoreRenderer usage (ScoreDetailClient.ts)

**Migration:**
- [x] Replaced ScoreRenderer with web component in ScoreDetailClient.ts
- [x] Added web component script tag to score detail page
- [x] Updated theme listener to watch data-theme attribute
- [x] Fixed dimension reading to use parent container (PR #126)

**Validation:**
- [x] Verified light/dark themes
- [x] Tested with chrome-devtools-mcp
- [x] Verified no console errors
- [x] Ran visual regression tests

**Deployment:**
- [x] Created PR #126
- [x] Merged and deployed

**Notes:**
- Fixed dimension reading bug: read from `.score-detail-container` parent instead of web component

#### Score Editor Page Migration (`/src/pages/score/[slug]/edit.astro`) ✅

**Pre-migration:**
- [x] Take screenshot (before state)
- [x] Identify ScoreRenderer usage (ScoreEditor.ts - both external and internal preview modes)

**Migration:**
- [x] Replaced ScoreRenderer with web component in ScoreEditor.ts
- [x] Added web component script tag to edit page
- [x] Updated theme listener to watch data-theme attribute
- [x] Fixed dimension reading for both preview modes (PR #127)

**Validation:**
- [x] Verified light/dark themes
- [x] Tested both external (desktop) and internal (mobile) preview modes
- [x] Tested with chrome-devtools-mcp and test account
- [x] Verified no console errors

**Deployment:**
- [x] Created PR #127
- [x] Merged and deployed

**Notes:**
- Fixed dimension reading bug: read from parent containers (`externalPreview`, `previewContainer`) instead of web component
- Authenticated using test credentials to create test score for verification

### 📋 TODO

- [ ] All other pages listed in "Usage Audit" above

---

## Migration Checklist (Per Page)

Use this checklist for each page migration:

```markdown
### Page: [Page Name] (`/path/to/file`)

**Pre-migration:**
- [ ] Take screenshot (before state)
- [ ] Identify all ScoreRenderer instances on page
- [ ] Note any custom options/configuration

**Migration:**
- [ ] Replace ScoreRenderer import with web component script
- [ ] Convert each instance to `<shakuhachi-score>` tag
- [ ] Pass score data via JSON.stringify or data-score attribute
- [ ] Migrate options to attributes/CSS variables
- [ ] Test in dev server

**Validation:**
- [ ] Take screenshot (after state)
- [ ] Compare before/after visually
- [ ] Test light/dark themes (if applicable)
- [ ] Test responsive behavior (mobile/desktop)
- [ ] Verify no console errors
- [ ] Run visual regression tests (if exist for this page)

**Deployment:**
- [ ] Create PR with before/after screenshots
- [ ] Get review approval
- [ ] Merge and deploy
- [ ] Verify in production

**Notes:**
- (Any special considerations, issues encountered, etc.)
```

### Quick Reference Checklist

When migrating TypeScript components (not static pages):

1. **Add web component script** - Include `<script is:inline src="/embed/shakuhachi-score.js">` in the Astro page
2. **Build web component** - Run `npm run build:wc` before testing
3. **Update theme listener** - Watch `data-theme` attribute, not class changes
4. **Fix dimension reading** - Read from parent container, not the web component (see Common Issues below)
5. **Test both modes** - Verify light and dark themes with chrome-devtools-mcp
6. **Verify console** - Check `list_console_messages()` for JavaScript errors
7. **Run visual tests** - Execute `npm run test:visual` and verify no regressions

---

## Script Loading Strategy

**Decision**: Load web component script globally in base layout (for now)

```astro
<!-- src/layouts/Layout.astro -->
<script src="/embed/shakuhachi-score.js"></script>
```

**Rationale:**
- Simple: All pages have access without per-component imports
- Cached: Script loads once, cached for all pages
- Trade-off: Loaded even on pages without scores (acceptable for now)

**Alternative** (if needed): Per-component loading with Astro optimization

---

## Common Migration Patterns

### Pattern 1: Basic Score Display

**Before (ScoreRenderer):**
```astro
---
import { ScoreRenderer } from '../renderer/ScoreRenderer';
const scoreData = { notes: [...] };
---
<div id="score-container"></div>

<script>
  const container = document.getElementById('score-container');
  const renderer = new ScoreRenderer(container, { singleColumn: true });
  renderer.renderFromScoreData(scoreData);
</script>
```

**After (Web Component):**
```astro
---
const scoreData = { notes: [...] };
---
<shakuhachi-score single-column="true">
  {JSON.stringify(scoreData)}
</shakuhachi-score>
```

### Pattern 2: Custom Styling

**Before:**
```typescript
new ScoreRenderer(container, {
  noteColor: '#2c3e50',
  noteFontSize: 32,
  singleColumn: true
});
```

**After:**
```html
<shakuhachi-score single-column="true">
  {JSON.stringify(scoreData)}
</shakuhachi-score>

<style>
  shakuhachi-score {
    --shakuhachi-note-color: #2c3e50;
    --shakuhachi-note-font-size: 32px;
  }
</style>
```

### Pattern 3: Dynamic/Reactive Scores (React/Preact)

**Before:**
```tsx
import { useEffect, useRef } from 'react';
import { ScoreRenderer } from '../renderer/ScoreRenderer';

function ScoreView({ scoreData }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const renderer = new ScoreRenderer(containerRef.current);
    renderer.renderFromScoreData(scoreData);
  }, [scoreData]);

  return <div ref={containerRef}></div>;
}
```

**After:**
```tsx
function ScoreView({ scoreData }) {
  return (
    <shakuhachi-score>
      {JSON.stringify(scoreData)}
    </shakuhachi-score>
  );
}
```

---

## Common Issues

### Dimension Reading Pattern

**Problem:** Custom elements return `clientWidth/clientHeight = 0` until laid out by the browser.

**Why this happens:** The web component's `connectedCallback()` fires before CSS layout. The parent container already has dimensions from CSS, but the newly created web component doesn't yet.

**Solution:** Always read dimensions from the PARENT container, never from the web component itself.

**Example:**
```typescript
// ❌ WRONG - reads from web component (returns 0)
const container = document.createElement('shakuhachi-score');
const width = container.clientWidth; // Returns 0

// ✅ CORRECT - reads from parent container
const parent = document.getElementById('preview-panel');
const width = parent.clientWidth; // Returns actual width from CSS
```

**Pattern applies to:**
- Score detail page: Read from `.score-detail-container`
- Score editor: Read from `.preview-panel` or internal preview container
- Any page using the web component: Read from the parent DIV that has CSS dimensions

**Encountered in:**
- PR #126 (Score Detail)
- PR #127 (Score Editor)

---

## Issues & Resolutions

### Issue 1: [Example Issue]
**Description**: (What went wrong)
**Resolution**: (How it was fixed)
**Prevention**: (How to avoid in future)

---

## Metrics

**Progress:**
- Total pages with ScoreRenderer: 5+ (from usage audit)
- Migrated: 3 (test page, score detail, score editor)
- Remaining: 2+ (About, components)

**Completed Migrations:**
- Test page (PR #123)
- Score detail page (PR #126)
- Score editor page (PR #127)

**Bundle Impact:**
- Web component bundle: 23.96 kB / 7.19 kB gzipped
- Target: <50 kB gzipped ✅

**Test Coverage:**
- Visual regression: 1 full-page baseline (score-renderer-tests)
- Test examples: 3 (short/medium/long scores)
- Themes covered: Light + Dark (side-by-side)
- Layout modes: Single-column + Multi-column

---

## Notes

- All migrations should preserve visual appearance (pixel-perfect)
- Use visual regression tests where available
- Document any rendering differences or regressions
- If migration reveals web component bugs, fix component first, then retry migration
