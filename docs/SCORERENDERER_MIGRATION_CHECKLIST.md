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
- [ ] `/src/pages/score/[slug].astro` - Score detail viewer
- [ ] `/src/pages/index.astro` - Homepage (if applicable)

**Components:**
- [ ] `/src/components/ScorePreview.astro` - Library score cards
- [ ] `/src/components/ScoreEditor.tsx` - Editor preview (React)
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
- [ ] Create PR with screenshots
- [ ] Get review approval
- [ ] Merge and deploy
- [ ] Verify in production

**Notes:**
- Fixed alignment and duration line rendering during migration
- Single-column uses intrinsic height + container width (not intrinsic width)
- Multi-column requires explicit width/height attributes

### 🚧 In Progress

- [ ] (None currently)

### 📋 TODO

- [ ] All pages listed in "Usage Audit" above

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

## Issues & Resolutions

### Issue 1: [Example Issue]
**Description**: (What went wrong)
**Resolution**: (How it was fixed)
**Prevention**: (How to avoid in future)

---

## Metrics

**Progress:**
- Total pages with ScoreRenderer: 5+ (from usage audit)
- Migrated: 1 (test page)
- Remaining: 4+ (About, score detail, components)

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
