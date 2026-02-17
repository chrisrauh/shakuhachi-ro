# TODO - Shakuhachi Score Library Platform

This file tracks active tasks for the shakuhachi score library platform. Complete tasks in order, complete one task at a time, check if the task hasn't already been implemented, finish a task before starting the next, following the dev workflow defined in `CLAUDE.md`.

## Remaining Tasks

### Bug Fixes

- [ ] Fix score editor preview error
  - [ ] Preview shows "Score title is required" error even when title is filled
  - [ ] Investigate why preview validation isn't working correctly
  - [ ] Verify updatePreview() is being called after title changes

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

### Score Renderer Layout Improvements

- [ ] Add mobile breakpoint (< 768px) for single-column vertical scroll layout
- [ ] Test responsive behavior on different screen sizes

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
  - `src/components/ScoreDetailClient.ts:164` and `src/pages/score/[slug].astro:60` — The URL pattern `/editor.html?id=` is hardcoded in two places. If the editor route ever changes (e.g., dropping `.html`), both need manual updating. Define `const EDITOR_URL = (id: string) => \`/editor.html?id=\${id}\`` in a shared `src/constants/routes.ts` module.

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

- [ ] Add unit tests for slug utility
  - `src/utils/slug.ts` has 0 tests. Test: basic ASCII slugification, special characters removed, multiple hyphens collapsed, leading/trailing hyphens stripped, `ensureUniqueSlug` appends counter when slug exists, counter increments correctly.

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

- [ ] Add unit tests for kinko-symbols lookup functions
  - `src/constants/kinko-symbols.ts` has 0 tests. Test: `getSymbolByKana('ロ')` returns correct symbol, `getSymbolByRomaji('ro')` returns correct symbol, `getSymbolByPitch('D', 4)` returns correct symbol, `parseNote` handles valid and invalid inputs, all 7 base notes are present in the map.

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
