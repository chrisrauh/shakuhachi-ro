# TODO - Shakuhachi Score Library Platform

This file tracks active tasks for the shakuhachi score library platform. Complete tasks in order, complete one task at a time, check if the task hasn't already been implemented, finish a task before starting the next, following the dev workflow defined in `CLAUDE.md`.

**Project Vision**: A web platform for sharing shakuhachi scores. Primary use case is discovering and sharing scores via links (most often opened on mobile devices). Secondary use case is using the platform to practice/perform from shared scores.

## Remaining Tasks

### Critical: Mobile Support

- [x] **Mobile responsive score rendering**
  - [x] Single-column vertical scroll layout for mobile (< 768px breakpoint)
  - [x] Optimize touch interactions (no hover states, larger tap targets)
  - [ ] Test on actual mobile devices (iOS Safari, Android Chrome)
  - [x] Ensure high-quality rendering on retina displays
  - [x] Verify score legibility on small screens
  - **Rationale**: Shared score links are primarily opened on mobile. Without mobile support, the core use case (sharing scores) is broken.

### Bug Fixes

- [ ] Fix score editor preview error
  - [ ] Preview shows "Score title is required" error even when title is filled
  - [ ] Investigate why preview validation isn't working correctly
  - [ ] Verify updatePreview() is being called after title changes

### API Improvements & Refactoring

**Reference**: See [docs/API-IMPROVEMENTS.MD](./docs/API-IMPROVEMENTS.MD) for detailed rationale and implementation examples.

#### High Priority (Non-Breaking)

- [ ] **Add options validation with warnings**
  - [ ] Validate `notesPerColumn >= 1`
  - [ ] Validate `columnSpacing >= 0`
  - [ ] Validate font sizes in reasonable range (1-200)
  - [ ] Log warnings for invalid values, use defaults
  - **Rationale**: Prevent silent failures and broken rendering states

- [ ] **Add typed error classes**
  - [ ] Create `RendererError` base class
  - [ ] Add `ParseError` for MusicXML parsing failures
  - [ ] Add `NetworkError` for fetch failures
  - [ ] Add `ValidationError` for invalid options
  - **Rationale**: Better error handling and debugging in user applications

- [ ] **Document autoResize lifecycle** ✓ (DONE)
  - [x] Add `destroy()` method to API docs
  - [x] Add responsive rendering section
  - [x] Add React/Vue cleanup examples
  - **Rationale**: Prevent memory leaks from ResizeObserver

#### High Priority (Breaking - Plan for v2.0)

- [ ] **Clean up public API surface**
  - [ ] Audit all exports in `src/index.ts` (currently 55+ exports)
  - [ ] Keep only high-level API: `ScoreRenderer`, `renderScoreFromURL`, `renderScore`, `RenderOptions`
  - [ ] Move advanced APIs to separate import path: `shakuhachi-ro/advanced`
  - [ ] Remove internal exports: `TestModifier`, `ScoreParser`, kinko-symbols utilities
  - [ ] Remove experimental exports: `Formatter`, `VerticalSystem` (not used by main API)
  - **Rationale**: Clearer API boundaries, better tree-shaking, signals stability

- [ ] **Fix async API consistency**
  - [ ] Make `renderFromScoreData()` synchronous (no async work happening)
  - [ ] Keep `renderFromURL()` async (actually fetches data)
  - [ ] Add deprecation warning for old async signature
  - [ ] Update all call sites
  - **Rationale**: Better performance, more predictable API

- [ ] **Add fluent API pattern**
  - [ ] Return `this` from `setOptions()`
  - [ ] Return `this` from `resize()`
  - [ ] Return `this` from `clear()`
  - [ ] Enable method chaining: `renderer.setOptions(...).resize(...).refresh()`
  - **Rationale**: Better ergonomics, matches VexFlow pattern

#### Medium Priority (Breaking - Plan for v2.0)

- [ ] **Replace getter methods with property getters**
  - [ ] Replace `getOptions()` with `get options()`
  - [ ] Replace `getNotes()` with `get notes()`
  - [ ] Replace `getScoreData()` with `get scoreData()`
  - [ ] Update documentation with new syntax
  - **Rationale**: More idiomatic JavaScript, better DX

- [ ] **Improve naming consistency**
  - [ ] Rename `ColumnLayoutCalculator` → `LayoutCalculator` (simpler)
  - [ ] Rename `ModifierConfigurator` → `ModifierManager` (more conventional)
  - [ ] Rename `mergeWithDefaults()` → `mergeOptions()` (more descriptive)
  - **Rationale**: Consistent naming patterns across codebase

#### Low Priority (Nice to Have)

- [ ] **Add event system for lifecycle hooks**
  - [ ] Design event types: `render:start`, `render:complete`, `render:error`, `options:change`, `resize`
  - [ ] Implement `on(listener)` method
  - [ ] Emit events during rendering lifecycle
  - [ ] Add documentation and examples
  - **Rationale**: Enables performance monitoring, loading states, error handling in frameworks

- [ ] **Flexible constructor overloads**
  - [ ] Allow `new ScoreRenderer(options)` without container
  - [ ] Add `attachTo(container)` method for deferred attachment
  - [ ] Support rendering before container is available
  - **Rationale**: Better framework integration (React refs, Vue $refs)

- [ ] **Multi-container support**
  - [ ] Allow `attachTo()` multiple containers
  - [ ] Add `detachFrom(container)` method
  - [ ] Render same score to multiple places
  - **Rationale**: Reuse renderer across components

- [ ] **Subpath exports for better tree-shaking**
  - [ ] Add `package.json` exports map
  - [ ] Create `shakuhachi-ro/renderer`, `shakuhachi-ro/modifiers`, `shakuhachi-ro/utils`
  - [ ] Update build configuration
  - **Rationale**: Better tree-shaking, clearer API boundaries

#### Migration Strategy

- [ ] **Prepare v2.0 release**
  - [ ] Create migration guide document
  - [ ] Add deprecation warnings to v1.x for breaking changes
  - [ ] Maintain v1.x branch for 6-12 months after v2.0 release
  - [ ] Document all breaking changes with before/after examples
  - [ ] Provide automated migration tooling (codemod) if possible

### Visual Regression Testing

- [ ] Update existing visual tests to capture both light and dark mode
  - [ ] Browse page - light & dark mode screenshots
  - [ ] Editor page - light & dark mode screenshots
  - [ ] Score detail page - light & dark mode screenshots
  - [ ] Add appropriate wait times for theme transitions
  - [ ] Ensure score rendering completes before capturing
- [ ] Add visual regression tests for Editor page (/editor)
  - [ ] Test default empty state
  - [ ] Test with score data entered
  - [ ] Test viewport and full page screenshots
- [ ] Add visual regression tests for Score page (/score)
  - [ ] Test score rendering (full page and viewport)
  - [ ] Test debug mode
  - [ ] Test different viewport sizes (desktop, tablet, mobile)
- [ ] Update Browse page visual tests to properly test library view
  - [ ] Test empty state (no scores)
  - [ ] Test with scores displayed
  - [ ] Test search/filter interactions
- [ ] Add cross-viewport testing (desktop 1280x720, tablet 768x1024, mobile 375x667)
- [ ] Add visual tests for different auth states (logged in vs logged out)


### Phase 8: Navigation & UI Polish

- [ ] Create site header component (logo, navigation)
- [ ] Add navigation links: Home | Create Score | My Scores | Profile
- [ ] Add auth UI: Login/Signup or Username/Logout
- [ ] Create footer with attribution
- [ ] Add consistent styling (CSS framework or custom)
- [ ] Implement responsive design (mobile, tablet, desktop)
- [ ] Add loading spinners and error states
- [ ] Polish form validation and error messages
- [ ] Test across browsers (Chrome, Firefox, Safari)

## Renderer Enhancements (Future)

- [ ] Enable musicians to read through long scores without scrolling (when score exceeds viewport height, allow "page turn" navigation with keyboard/UI controls so players can advance through the score while performing)
- [ ] Add score selector dropdown
- [ ] Load different score files dynamically
- [ ] Add JSDoc comments to public APIs
- [ ] Write usage guide in reference/README.md
- [ ] Document score data format

### Additional Modifiers

- [ ] YuriModifier (vibrato)
- [ ] MuraikiModifier (breathy tone)
- [ ] SuriModifier (sliding)
- [ ] OriModifier (pitch bend)
- [ ] Centered duration line style (line passes horizontally through middle of note, alternative to current right-aligned style)

### Performance & Optimization

- [ ] Profile rendering performance
- [ ] Optimize frequent operations
- [ ] Add caching where appropriate
- [ ] Revisit column breaking with TeX-inspired badness algorithm
  - [ ] Implement badness metric for column height variance
  - [ ] Add demerits for orphans (single notes in columns)
  - [ ] Add penalties for breaking at certain notation points
  - [ ] Implement global optimization across score (Knuth-Plass approach)

### Advanced Features (Post-MVP)

- [ ] Visual score editor (point-and-click note entry)
- [ ] OCR tool (scan physical scores to MusicXML/JSON)
- [ ] Collections (curated score groups)
- [ ] Version history (track edits over time)
- [ ] Comments/discussions on scores
- [ ] Pull request workflow (suggest changes to others' scores)
- [ ] Private scores (unlisted or private visibility)
- [ ] Export/download scores as files
- [ ] Print optimization (CSS for clean printouts)
- [ ] Advanced search (filter by tags, difficulty, date ranges)
- [ ] Multiple score input formats (import from ABC, etc.)
- [ ] MIDI playback mapping
- [ ] Western staff intermixing
- [ ] Custom font support for traditional glyphs
- [ ] Score transposition tool
