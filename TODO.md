# TODO - Shakuhachi Score Library Platform

## How to Work with This File

**IMPORTANT: Follow these rules strictly:**

- **Work in strict top-to-bottom order** - Start with the first unchecked task, then move to the next
- **One task at a time** - Never work on multiple tasks simultaneously
- **Verify before starting** - Check if the task is already implemented before beginning work
- **Follow the dev workflow** - See [CLAUDE.md](./CLAUDE.md)

## Alpha Release (Must-Haves)

- [x] Support abc notation on the score editor
  - Convert between notaiton formats (this should be an decoupled utility)
  - Only implement the notation features currently in use (YAGNI)
  - Docs: https://abcnotation.com/

- [ ] Create new score flow
  - Generate random slug (e.g., "flying-circus-catnip")
  - Create empty score in database
  - Redirect to `/score/[slug]/edit`
  - User fills in title, notation, etc.

- [ ] Landing page: My Scores section
  - When user is logged in, show their scores first
  - Then show library scores below
  - Clear visual separation between sections

- [ ] 404 page for nonexistent scores
  - When `/score/[slug]` doesn't exist
  - Friendly error message
  - Link back to library

- [ ] Fix dialog form fields overflow
  - Form fields in auth dialog are overflowing to the right
  - Likely box-model issue (padding/border not accounted for in width)
  - Ensure form inputs fit within dialog width with proper spacing

- [ ] Standardize Fix login and fork confirmation dialog layout

- [ ] Edit About page content
  - Review and refine content for clarity
  - Ensure explanations are clear for shakuhachi musicians
  - Check tone and messaging
  - Verify all information is accurate

## Fast Follow (Post-Alpha)

- [ ] Investigate button text vertical alignment
  - Button labels appear ~1px lower than ideal
  - `text-box-trim: trim-both` and `text-box-edge: cap alphabetic` are applied but have no effect
  - These properties ARE supported in Chrome (per MDN) and have worked in other contexts (e.g., PageHeader title)
  - Root cause: Surrounding CSS conditions (flexbox, line-height, padding, or other properties) are preventing text-box-trim from taking effect
  - Need to identify what's blocking the trim behavior and adjust surrounding styles
  - Test page for visual verification: http://localhost:3003/test/buttons

- [ ] Improve button test page visual regression coverage
  - Redesign `/test/buttons` layout to be more condensed
  - Ensure all button variants are visible in a single viewport
  - Adjust viewport size in visual regression tests to capture all variations
  - Goal: Single screenshot should show all button types (icon, small, standard) with all color variants (primary, secondary, success, neutral, ghost) and states (default, hover, disabled)

- [ ] Investigate web component framweworks

- [ ] Delete score with confirmation
  - Owner can delete their own scores
  - Confirmation dialog: "Delete '[title]'? This cannot be undone."
  - Remove from database and redirect to landing page

- [ ] Loading states and spinners
  - During save operations
  - During score creation
  - During fork operations
  - During delete operations

- [ ] Notation format help in editor
  - Examples of valid notation
  - Links to documentation
  - Format validation and helpful error messages

- [ ] Unsaved changes warning
  - Detect unsaved changes in editor
  - Warn before navigating away
  - "You have unsaved changes. Are you sure you want to leave?"

## Future Enhancements (Post-Alpha)

These are important improvements but not needed for initial alpha release.

### API & Architecture Improvements

**Reference**: See [docs/API-IMPROVEMENTS.MD](./docs/API-IMPROVEMENTS.MD) for detailed rationale and implementation examples.

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

- [ ] Test geometricPrecision on shakuhachi SVG notes
- [ ] Create site header component (logo, navigation)
- [ ] Add navigation links: Home | Create Score | My Scores | Profile
- [ ] Add auth UI: Login/Signup or Username/Logout
- [ ] Create footer with attribution
- [ ] Add consistent styling (CSS framework or custom)
- [ ] Implement responsive design (mobile, tablet, desktop)
- [ ] Add loading spinners and error states
- [ ] Polish form validation and error messages
- [ ] Test across browsers (Chrome, Firefox, Safari)

### Code Quality — Engineering Principles

Tasks identified by auditing `src/` against the engineering principles in CLAUDE.md.

#### Fail Fast, Fail Loud

- [ ] SVGRenderer.closeGroup(): throw on unmatched group instead of console.warn
  - `src/renderer/SVGRenderer.ts:228-231` — `closeGroup()` logs `console.warn` and returns silently when called with no open groups. This is a programmer error (mismatched open/close calls) that corrupts the SVG group hierarchy. Change to `throw new Error(...)` so the bug surfaces immediately during development instead of producing silently broken SVG output.

- [ ] MusicXMLParser: warn on skipped notes instead of silent return
  - `src/parser/MusicXMLParser.ts:53-54` — When a `<note>` element has no `<pitch>` child (and is not a rest), the parser silently `return`s, dropping the note from the score. The user sees a rendered score with missing notes and no explanation. Add `console.warn(`Skipping note at index ${i}: no <pitch> element`)` before the return.
  - Same issue at line 67 for unknown pitch mappings — already warns, which is good, but consider collecting warnings and surfacing them to the caller.

- [ ] ScoreRenderer.renderDebugLabel(): replace silent null check with assertion
  - `src/renderer/ScoreRenderer.ts:154` — `if (!this.renderer) return;` silently skips rendering. After construction, `this.renderer` should always exist when `renderDebugLabel` is called (it's only called inside `renderNotes` which creates the renderer). Replace with a dev assertion or remove the guard since the invariant is guaranteed by the calling code.

- [ ] ScoreDetailClient: show error UI instead of console.error on failed data parse
  - `src/components/ScoreDetailClient.ts:20-27` — When `JSON.parse(dataEl.textContent)` fails, it logs `console.error` and sets `this.score = null`. Then `init()` at line 31-33 returns silently. The user sees a blank page with no explanation. Render an error message in the container instead.

- [ ] ScoreEditor: notify user when autosave restore fails
  - `src/components/ScoreEditor.ts:97-99` — When `loadFromLocalStorage()` catches a parse error, it logs `console.error` silently. The user's auto-saved work is lost with no notification. Show a brief inline warning like "Could not restore auto-saved draft" so the user knows their previous session data was corrupted.

- [ ] AuthStateManager: document or fix the async initialization race condition
  - `src/api/authState.ts:12-14` — The constructor calls `this.initialize()` which is async, but constructors can't await. Any code that calls `authState.getUser()` synchronously right after import gets `null` even if the user is logged in, because `getCurrentUser()` hasn't resolved yet. Either (a) document this behavior with a JSDoc warning, (b) provide an `onReady()` promise, or (c) have components always use `subscribe()` which fires on resolution.

- [ ] forkScore: check error on fork count increment
  - `src/api/scores.ts:411-414` — After creating a forked score, the parent's `fork_count` is incremented via `supabase.from('scores').update(...)` but the result is never checked. If the update fails, the fork count silently drifts out of sync. Check the error and at minimum log a warning.

- [ ] forkScore: handle slug query error in createScore
  - `src/api/scores.ts:69-74` — When generating a unique slug, the Supabase query `supabase.from('scores').select('slug').ilike(...)` has no error checking. If the query fails, `existingScores` is undefined, `existingSlugs` becomes `[]`, and a potentially duplicate slug is used. Check the error before proceeding.

- [ ] ScoreDetailClient.handleFork: preserve error context in catch block
  - `src/components/ScoreDetailClient.ts:166` — The catch block `catch { alert('Failed to fork score'); }` discards the original error entirely. Add `console.error('Fork failed:', error)` so debugging context isn't lost.

- [ ] AuthComponents.show(): remove pointless double toggleMode() call
  - `src/components/AuthComponents.ts:181-184` — `show()` sets `this.isLoginMode` directly, then calls `toggleMode()` twice in a row. `toggleMode()` flips `isLoginMode` and updates DOM text. Calling it twice flips the boolean away and back, resulting in a net no-op but causing two unnecessary DOM updates. Remove both `toggleMode()` calls and instead call the DOM update logic directly to match the already-set `isLoginMode` value.

#### Single Responsibility

- [ ] Extract ScoreEditor inline CSS into a stylesheet
  - `src/components/ScoreEditor.ts:494-770` — The `addStyles()` method injects ~275 lines of CSS via JavaScript into a `<style>` tag. This mixes styling concerns into the component class and makes CSS hard to find and maintain. Move styles to `src/styles/score-editor.css` and import it in the Astro page that uses the editor. This alone removes ~35% of the file's line count.

- [ ] Extract ScoreLibrary inline CSS into a stylesheet
  - `src/components/ScoreLibrary.ts` — Same pattern as ScoreEditor. The `addStyles()` method injects ~250 lines of CSS. Move to `src/styles/score-library.css`.

- [ ] Extract score data validation out of ScoreEditor into a reusable module
  - `src/components/ScoreEditor.ts:120-150` — `validateScoreData()` handles JSON parsing, XML parsing via DOMParser, and error message formatting. This validation logic is useful beyond the editor (e.g., API-side validation, import flows). Extract to `src/utils/score-validation.ts` with a function like `validateScoreInput(data: string, format: ScoreDataFormat): { valid: boolean; error?: string }`.

- [ ] Extract auto-save logic out of ScoreEditor
  - `src/components/ScoreEditor.ts:85-117` — `loadFromLocalStorage()`, `setupAutoSave()`, and `saveToLocalStorage()` form a self-contained persistence concern (setInterval management, localStorage key, serialization format). Extract to a small `AutoSaveManager` class or utility in `src/utils/auto-save.ts` that takes a storage key and serialization functions.

- [ ] Extract createScore slug generation into its own function
  - `src/api/scores.ts:62-83` — `createScore()` mixes two responsibilities: generating a unique slug and inserting the score into the database. The slug generation logic (lines 62-83) queries existing slugs, calls `generateSlug()`, and appends a numeric suffix for uniqueness. Extract to a standalone `generateUniqueSlug(title: string): Promise<string>` function. This makes slug generation testable independently and reusable if other entities need unique slugs.

#### Separation of Concerns

- [ ] Extract auth subscription boilerplate into a shared page initializer
  - `src/pages/index.astro:26-35`, `src/pages/editor.astro:21-30`, `src/pages/score/[slug].astro:90-99` — All three pages have an identical block: create `AuthWidget`, call `authState.subscribe()`, toggle `setUser()`/`clearUser()`. Extract to a function like `initPageAuth(widgetId: string)` in `src/utils/page-init.ts` and call it from each page.

- [ ] Separate auth check from DOM mutation in ScoreDetailClient.handleEditButtonVisibility
  - `src/components/ScoreDetailClient.ts:49-57` — One method queries auth state, finds a DOM element, and sets inline styles. Split into: (a) a pure check `isOwner(): boolean` and (b) a DOM updater that uses CSS classes (`editBtn.classList.add('visible')`) instead of inline styles. This makes the authorization logic testable without a DOM.

- [ ] Move MusicXML parsing out of ScoreDetailClient
  - `src/components/ScoreDetailClient.ts:79-84` — The UI component directly imports `MusicXMLParser` and calls `MusicXMLParser.parse()` to convert stored data before rendering. This parsing concern should live in a shared utility (e.g., `parseScoreByFormat(data, format)`) so that every component that renders a score doesn't need to know about format-specific parsing.

- [ ] Standardize error UX across components
  - Three different error patterns are used: ScoreEditor uses `alert()` (lines 241, 246, 251, 285, 290, 297), ScoreLibrary renders inline error UI with a retry button (lines 82-94), ScoreDetailClient uses `console.error` with no user feedback (lines 25, 33). Pick one pattern (inline error UI is the best UX) and apply it consistently. At minimum, replace `alert()` calls in ScoreEditor with inline messages near the relevant form controls.

#### Explicit Over Implicit

- [ ] Slug utility: handle Unicode characters (Japanese score titles)
  - `src/utils/slug.ts:16` — `replace(/[^\w\s-]/g, '')` strips all non-ASCII characters. A score titled "赤とんぼ" produces an empty slug; "Ranjo 大師" loses "大師" and becomes just "ranjo". For a shakuhachi app where Japanese titles are common, this silently produces ambiguous or empty slugs. Either transliterate (e.g., use a library like `slugify` with Unicode support) or preserve Unicode word characters in the regex.

- [ ] Replace hardcoded fallback viewport 800×600 with explicit error or documented default
  - `src/renderer/ScoreRenderer.ts:207-208` — `width: rect.width || 800, height: rect.height || 600` silently substitutes default dimensions when the container has zero size (common when container is hidden or not yet in the DOM). Either throw an error ("Container has zero dimensions — ensure it is visible before rendering") or define a named constant `DEFAULT_VIEWPORT = { width: 800, height: 600 }` so the fallback is discoverable.

- [ ] Document or name the MusicXMLParser duration mapping thresholds
  - `src/parser/MusicXMLParser.ts:80-89` — Duration mapping uses `>= 4` → whole, `>= 2` → half, else quarter. The thresholds are undocumented and lossy (a MusicXML duration of 3 maps to half note, but 3 divisions typically means dotted quarter). Add a comment block explaining the mapping decisions and known limitations, or extract to a named function `mapMusicXMLDuration(rawDuration: number): number`.

- [ ] Name magic numbers in VerticalSystem separator drawing
  - `src/renderer/VerticalSystem.ts:160-164` — `this.y - 20`, `this.y + this.columnHeight + 20`, `'#ccc'`, `1` are unexplained. Define named constants like `SEPARATOR_EXTENSION = 20`, `SEPARATOR_COLOR = '#ccc'`, `SEPARATOR_WIDTH = 1`, or better yet, derive from `RenderOptions`.

- [ ] Name the auto-save interval constant in ScoreEditor
  - `src/components/ScoreEditor.ts:105-107` — `window.setInterval(() => ..., 30000)` uses a bare number. Define `const AUTO_SAVE_INTERVAL_MS = 30_000;` at the top of the file or in a constants module.

- [ ] Document MIDI tick values in Formatter.ts
  - `src/renderer/Formatter.ts:16-23` — `DURATION_TICKS` maps note durations to values like 4096, 2048, 1024, etc. Add a one-line comment: "Based on standard MIDI resolution: quarter note = 1024 ticks, each subdivision halves the value."

- [ ] Name magic number for rest vertical centering in ShakuNote
  - `src/notes/ShakuNote.ts:144` — `this.y - this.fontSize * 0.4` uses an unexplained `0.4` multiplier to position the rest circle relative to the note baseline. Extract to a named constant like `const JAPANESE_CHAR_VERTICAL_CENTER_RATIO = 0.4` with a comment explaining that Japanese characters are typically centered around 40% above the baseline.

- [ ] Name magic number for duration line baseline ratio
  - `src/modifiers/DurationLineModifier.ts:58` — `-NOTE.fontSize * 0.25` uses a bare `0.25` to calculate the vertical middle of a note character. Define `const NOTE_VERTICAL_MIDDLE_RATIO = 0.25` and reference it, matching the comment already present ("approximately 25% above the baseline").

- [ ] Document authState.subscribe() immediate callback behavior
  - `src/api/authState.ts:46-51` — `subscribe()` immediately invokes the callback with the current `user` and `session` before returning. This is undocumented and surprising — subscribers may not expect their callback to fire synchronously during registration. Add JSDoc: "Note: The callback is invoked immediately with the current state upon subscription, and again whenever auth state changes."

- [ ] Extract hardcoded editor URL into a route constant
  - `src/components/ScoreDetailClient.ts:164` and `src/pages/score/[slug].astro:60` — The URL pattern `/editor.html?id=` is hardcoded in two places. If the editor route ever changes (e.g., dropping `.html`), both need manual updating. Define `const EDITOR_URL = (id: string) => \`/editor.html?id=\${id}\``in a shared`src/constants/routes.ts` module.

#### Type Safety

- [ ] Replace meri/chu_meri/dai_meri boolean flags with a discriminated union
  - `src/types/ScoreData.ts:45-52` — Three optional booleans (`meri`, `chu_meri`, `dai_meri`) allow invalid states: all three can be true simultaneously, which has no musical meaning. Replace with a single field `meriType?: 'meri' | 'chu_meri' | 'dai_meri'` that makes illegal states unrepresentable. This requires updating `ScoreParser`, `MusicXMLParser`, `KINKO_PITCH_MAP`, and all tests that reference these fields. Also fixes the naming inconsistency: `chu_meri` uses snake_case while the rest of the interface uses camelCase.

- [ ] Type the `data` field in Score/CreateScoreData/UpdateScoreData instead of `any`
  - `src/api/scores.ts:15,27,36` — The `data` field is typed `any` on three interfaces. This disables type checking for the most important field in the system (the actual score content). Define `data: ScoreData | string` (JSON ScoreData for `data_format: 'json'`, MusicXML string for `data_format: 'musicxml'`) or at minimum `data: unknown` to force explicit checks at usage sites.

- [ ] Fix handleMetadataChange double `as any` cast in ScoreEditor
  - `src/components/ScoreEditor.ts:172-173` — `(this.metadata as any)[field] = value` casts both the object and the value parameter to `any` to do a simple property assignment. Since all `ScoreMetadata` fields are `string` and `field` is already `keyof ScoreMetadata`, the fix is: change the parameter type from `value: any` to `value: string`, then the assignment `this.metadata[field] = value` works without any cast.

- [ ] Remove `undefined as any` hack from DEFAULT_RENDER_OPTIONS
  - `src/renderer/RenderOptions.ts:256-257` — `width: undefined as any, height: undefined as any` is used to make these fields exist in the defaults object while keeping them "optional". Instead, separate the type: define `ViewportOptions = { width?: number; height?: number }` and merge it separately, avoiding the `any` cast that breaks `Required<RenderOptions>` semantics.

#### Loose Coupling

- [ ] Replace MutationObserver theme detection with a custom event
  - `src/components/ScoreDetailClient.ts:103-115` and `src/components/ScoreEditor.ts:45-56` — Both components use `MutationObserver` watching attribute changes on `document.documentElement` to detect theme switches, then re-render. This is overcomplicated, duplicated, and couples components to the DOM structure of the theme switcher. Instead, have `ThemeSwitcher` dispatch a custom event (e.g., `document.dispatchEvent(new CustomEvent('theme-changed'))`) and have components listen for it. Simpler, more explicit, and decouples theme detection from DOM implementation.

- [ ] Decouple ColumnLayoutCalculator from DurationDotModifier
  - `src/renderer/ColumnLayoutCalculator.ts:11` — The layout calculator imports `DurationDotModifier` to check `instanceof` when determining whether a note needs extra vertical spacing. This couples layout logic to a specific modifier type. Instead, add a method to `ShakuNote` like `needsExtraSpacing(): boolean` that checks its own modifiers, so the layout calculator only depends on the note interface.

- [ ] Move MusicXMLParser out of ScoreRenderer
  - `src/renderer/ScoreRenderer.ts` imports `MusicXMLParser` for the `renderFromURL()` method. The renderer's job is to render `ScoreData`, not to fetch and parse XML files. Move `renderFromURL()` to the convenience functions module (`src/renderer/convenience.ts`) where it already lives as `renderScoreFromURL()`. This makes `ScoreRenderer` depend only on `ScoreData`, not on parsing.

#### Abstraction with Intent

- [ ] Remove TestModifier from public API exports
  - `src/index.ts:47` — `TestModifier` is a testing utility, not a library feature. Exporting it as part of the public API makes it contractual — consumers may depend on it, preventing removal. Remove the export from `index.ts`. Test files can import directly from the source path.

- [ ] Evaluate whether Formatter and VerticalSystem should be public API
  - `src/index.ts:28-31` — `Formatter` and `VerticalSystem` are exported but appear to be alternative/experimental layout components not used by the main `ScoreRenderer` pipeline (which uses `ColumnLayoutCalculator`). If they are internal or experimental, remove from `index.ts` to reduce the public API surface. If they are intentionally public, add JSDoc explaining their purpose and relationship to `ColumnLayoutCalculator`.

- [ ] Move toJSON/convertToJSON off MusicXMLParser
  - `src/parser/MusicXMLParser.ts:153-166` — `toJSON()` and `convertToJSON()` are serialization methods on a parser class. A parser's job is to parse input into a structure; serializing a structure back to a string is a separate concern. Move these to a `ScoreSerializer` utility or simply use `JSON.stringify()` directly at call sites.

#### DRY

- [ ] Deduplicate empty-state grid template in ScoreLibrary
  - `src/components/ScoreLibrary.ts:114-127` and `157-170` — The "No scores found" HTML with the conditional "Clear Filters" button is duplicated verbatim in `render()` and `renderGrid()`. Extract to a private method `renderEmptyState(): string` called from both places.

- [ ] Deduplicate score card click listener attachment in ScoreLibrary
  - `src/components/ScoreLibrary.ts:179-187` and `attachEventListeners()` — Score card click listeners are attached in two separate methods (after full render and after grid-only partial update). Extract to a single `attachCardListeners(container: Element)` method called from both paths.

- [ ] Rename ScoreDetailClient's local ScoreData interface to avoid shadowing
  - `src/components/ScoreDetailClient.ts:7-10` — Defines `interface ScoreData { score: Score; parentScore: Score | null }` which shadows the `ScoreData` type from `src/types/ScoreData.ts`. Rename to `ScorePageData` or `EmbeddedScoreData` to avoid confusion when reading imports.

- [ ] Extract repeated error wrapping pattern in scores.ts
  - `src/api/scores.ts` — Six functions (`createScore`, `getUserScores`, `getScoreBySlug`, `updateScore`, `deleteScore`, `forkScore`) all share the same try/catch + `{ score: null, error: ... }` wrapping pattern. Each catch block has identical `error instanceof Error ? error : new Error('Unknown error ...')` logic. Extract a helper like `wrapScoreResult<T>(fn: () => Promise<T>): Promise<ScoreResult<T>>` to eliminate the repetition and ensure consistent error handling across all CRUD operations.

- [ ] Move curated score slugs to a configuration file
  - `src/api/scores.ts:432-437` — `getCuratedScoreSlugs()` returns a hardcoded array `['akatombo', 'love-story']`. Adding a new curated score requires editing TypeScript source code and redeploying. Move to a JSON config file (e.g., `src/data/curated-scores.json`) or read from the database, so the score catalog can be updated without code changes.

#### Test Coverage

- [ ] Add unit tests for MusicXMLParser
  - `src/parser/MusicXMLParser.ts` has 0 tests. The XML-to-ScoreData pipeline is the primary data entry point for the application. Test: valid MusicXML produces correct ScoreData, missing `<pitch>` elements are handled, unknown pitch mappings are skipped with warning, dotted notes get `dotted: true`, rests produce `rest: true`, `parseFromURL` handles HTTP errors.

- [ ] Add unit tests for ScoreEditor validation and save logic
  - `src/components/ScoreEditor.ts` has 0 tests. The `validateScoreData()` method (lines 120-150) handles JSON and XML parsing with error messages — test valid/invalid inputs for both formats. The `handleSave()` method (lines 238-307) has branching for create vs update, error handling, and localStorage cleanup — test each path.

- [ ] Add unit tests for SVGRenderer group management
  - `src/renderer/SVGRenderer.ts` has 0 tests. The `openGroup()`/`closeGroup()` pair manages a group stack that determines SVG nesting. Test: open then close produces correct hierarchy, nested groups work, closeGroup with no open groups throws (after the fail-fast fix above), multiple groups at same level work.

- [ ] Add unit tests for modifier rendering logic
  - `src/modifiers/` has 6 modifier classes (`OctaveMarksModifier`, `MeriKariModifier`, `DurationDotModifier`, `DurationLineModifier`, `AtariModifier`, `Modifier` base) with 0 unit tests. Each modifier has offset calculations, font configuration setters, and render methods that position SVG elements relative to the parent note. Test that: setters update internal state, `getPosition()` returns correct offsets, and `render()` calls the expected SVGRenderer methods (using a mock/spy).

- [ ] Replace waitForTimeout with waitForSelector in visual regression tests
  - `tests/visual/visual-regression.spec.ts:34,47,60,73` — All four tests use `page.waitForTimeout(2000)` which is fragile (slow on CI, may pass prematurely on fast machines). Replace with `page.waitForSelector('svg')` or `page.waitForSelector('[data-testid="score-rendered"]')` to wait for actual score rendering completion.

- [ ] Verify mock was called in convenience.test.ts
  - `src/renderer/convenience.test.ts:11-23` — Mocks `MusicXMLParser.parseFromURL` but never asserts it was called. Add `expect(MusicXMLParser.parseFromURL).toHaveBeenCalledWith(url)` after `renderScoreFromURL()` to verify the integration actually uses the parser.

- [ ] Add unit tests for auth module
  - `src/api/auth.ts` and `src/api/authState.ts` have 0 tests. Test: `signUp`/`signIn`/`signOut` call correct Supabase methods and return expected results, `AuthStateManager.subscribe()` fires callback immediately, `isAuthenticated()` reflects current state, `onAuthStateChange` relays Supabase auth events.

- [ ] Add unit tests for scores.ts CRUD operations
  - `src/api/scores.ts` has 0 tests. Test: `createScore` generates unique slug and inserts record, `getScoreBySlug` returns score or null, `updateScore` updates only specified fields, `deleteScore` removes record, `forkScore` creates copy and increments parent fork count, error wrapping returns consistent `{ score: null, error }` shape.

- [ ] Add unit tests for ScoreLibrary component logic
  - `src/components/ScoreLibrary.ts` has 0 tests. Test: search filtering logic, score card rendering with correct data, empty state rendering, pagination behavior if applicable.

### Architectural Refactoring

Structural issues identified by module-level analysis (dependency graph, information flow, change impact simulation). These are about module boundaries and abstractions, not individual lines. **Before starting any of these tasks: validate the finding by reading all affected files, confirm the problem still exists, and create a step-by-step implementation plan before writing any code.**

- [ ] Extract a RenderingBackend interface from SVGRenderer
  - `SVGRenderer` is imported as a concrete type in 13 files (all 6 modifiers, ShakuNote, ScoreRenderer, VerticalSystem, ModifierConfigurator, and more). The draw primitives (`drawText`, `drawCircle`, `drawLine`, `drawPath`, `drawRect`, `openGroup`, `closeGroup`, `resize`, `clear`) are already abstract in practice — only the type references are concrete. Define a `RenderingBackend` interface with these methods, have `SVGRenderer` implement it, and change all consumers to depend on the interface. This is a mechanical type-level change with zero runtime cost. It unlocks Canvas/WebGL backends and enables mock renderers for unit testing modifiers and notes without a DOM.
  - **Validate first**: Read every file that imports `SVGRenderer`, confirm none use SVG-specific APIs beyond the draw primitives (exception: `VerticalSystem` uses `setAttribute('transform', ...)` on SVG group elements — plan how to abstract this). Map every method signature that needs to change.

- [ ] Introduce a Parser interface and registry
  - There is no formal `Parser` interface. `MusicXMLParser` is a concrete static class imported by name in `ScoreDetailClient` (line 83), `ScoreRenderer` (line 64), and `convenience.ts`. Format dispatch (`if format === 'musicxml' ... else if format === 'json'`) is scattered across 3 components. Define a `Parser` interface (`parse(content: string): ScoreData`), create a `ParserRegistry` keyed by `ScoreDataFormat`, and replace scattered conditionals with `ParserRegistry.get(format).parse(content)`. Adding a new format (e.g., ABC notation) then becomes one new file + one registry entry instead of touching 6 files.
  - **Validate first**: Read all files that reference `MusicXMLParser` or check `data_format`. Map every call site. Confirm that `ScoreParser` (which converts `ScoreData` → `ShakuNote[]`) is a separate concern and should NOT be part of this interface. Verify `ScoreDataFormat` type location (`api/scores.ts:5`) and whether it belongs in `types/`.

- [ ] Decompose ScoreEditor into model + view
  - `ScoreEditor.ts` is 771 lines mixing 8+ concerns: state management (instance variables), DOM generation (`innerHTML` templates), event handling, API calls, validation, auto-save, theme detection, and CSS injection. This monolith is the primary bottleneck for adding versioning, collaboration, and i18n — all three require invasive surgery on this single file. Separate into: (a) an `EditorState` model class that holds data and emits change events, (b) an `EditorView` that subscribes to state changes and renders DOM, (c) extracted concerns (CSS → stylesheet, validation → utility, auto-save → utility, already tracked as separate tasks above). The same pattern applies to `ScoreLibrary.ts` (543 lines) and `ScoreDetailClient.ts` (175 lines) at smaller scale.
  - **Validate first**: Read the full `ScoreEditor.ts`. Map every instance variable and method. Identify which methods are pure state mutations vs DOM manipulation vs API calls. Sketch the `EditorState` interface before writing any code. Consider whether a lightweight event emitter is sufficient or if a more structured pattern is needed.

- [ ] Fix potential theme detection bug: MutationObserver watches wrong attribute
  - `ScoreDetailClient.setupThemeListener()` (line 103) and `ScoreEditor.setupThemeListener()` (line 45) both use `MutationObserver` with `attributeFilter: ['class']`. But `ThemeSwitcher.applyTheme()` sets the `data-theme` attribute on `<html>`, not `class`. The theme re-render may not be firing reliably. This is related to the existing task "Replace MutationObserver theme detection with a custom event" — fixing it by switching to a custom event would solve both the bug and the coupling.
  - **Validate first**: Read `ThemeSwitcher.ts` to confirm which attribute it sets. Test in browser whether theme changes actually trigger re-renders in the editor and score detail pages. If the observer already works (e.g., a CSS framework also toggles `class`), document why.

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
