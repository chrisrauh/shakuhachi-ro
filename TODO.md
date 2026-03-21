# TODO - Shakuhachi Score Library Platform

## How to Work with This File

**IMPORTANT: Follow these rules strictly:**

- **Work in strict top-to-bottom order** - Start with the first unchecked task, then move to the next
- **One task at a time** - Never work on multiple tasks simultaneously
- **Follow the dev workflow** - See [CLAUDE.md](./CLAUDE.md)

## Task Tags

**Area:** `[UI]` `[Backend]` `[Both]` `[Content]` `[Research]`

**Section:** Tags like `[Alpha]`, `[Visual-Testing]`, `[Quality-FailFast]`, `[Content]`, etc. indicate the original organizational section

**Autonomy:** `[A:High]` = Can work independently | `[A:Medium]` = May need guidance | `[A:Low]` = Requires collaboration

---

## Prioritized Backlog (Sorted by User Impact)

### Info pages (About, Help, etc...)

- [x] createa an /ai slash page (https://slashpages.net/#ai) and move the ai content there. Search for various /ai pages and suggest some content. Link to this page from the about page.

- [x] Add an annotation to the right of the embedded score with an arrow to the middle tree notes of the score saying how this part rquires a subtle meri action. Use a font that looks like it's a hand writtend annotation (but not too caligraphic, more like a handmade draft design, maye also use a blue-ish draft ink, or bic pen, color). Should come across a bit fun and iformal, like someone took a pen to the webpage. Finding the right font will be the hardest - caveat might be an option,

- [ ] [UI] [A:Medium] [Visual-Testing] Add visual regression tests for /about page score annotation
  - Test desktop layout: annotation visible to right of centered score
  - Test mobile layout (375px): score in left half, annotation in right half
  - Test light and dark modes

- [ ] review the copy to make it better and more to Christian's tone of voice, less choppy.

### Score Editor

- [ ] [UI] [A:Low] [Alpha] Revisit auto-save indicator placement and design
  - Current implementation: "Saved X ago" appears below description field
  - Consider alternative placements: floating badge, header area, inline with save button
  - Evaluate visual hierarchy and prominence
  - Test on mobile viewports for readability
  - Consider adding subtle animation when save completes

- [ ] [Backend] [A:Medium] [Alpha] Consider slug update behavior when title changes
  - Currently: Slug is set on creation and never changes, even if title is updated
  - Example: Score created with slug "evening-morning-bell" → user changes title to "Hello" → URL remains `/score/evening-morning-bell`
  - **Current behavior may be intentional** for URL stability (avoid breaking bookmarks/links)
  - **Document decision**: If intentional, add comment explaining why slug doesn't update
  - **Alternative**: Add explicit "slug" field in editor for advanced users who want custom URLs

- [ ] [UI] [A:Medium] [Quality-Separation] Standardize error UX across components
  - `ScoreDetailClient:23-29` still logs `console.error` with no user-facing error UI on failed data parse
  - `ScoreLibrary` uses inline UI with a retry button; `ScoreEditor` uses `toast`; pick one pattern and apply consistently

- [ ] [UI] [A:High] [Quality-SingleResp] Extract ScoreEditor inline CSS into a stylesheet
  - `src/components/ScoreEditor.ts:653+` — `addStyles()` injects ~275 lines of CSS via a `<style>` tag at runtime. Move to `src/styles/score-editor.css` and import it in `edit.astro`. Removes ~30% of the file's line count and makes styles discoverable via normal CSS tooling.

- [ ] [Backend] [A:High] [Quality-SingleResp] Extract score data validation out of ScoreEditor
  - `src/components/ScoreEditor.ts:151` — `validateScoreData()` handles JSON parsing, XML parsing via DOMParser, and error message formatting — all mixed into the editor class. Extract to `src/utils/score-validation.ts` as `validateScoreInput(data: string, format: ScoreDataFormat): { valid: boolean; error?: string }`. This makes validation testable in isolation and reusable for API-side or import validation.

- [ ] [Backend] [A:High] [Quality-SingleResp] Extract localStorage autosave logic out of ScoreEditor
  - `src/components/ScoreEditor.ts:125-141` — `setupLocalStorageAutoSave()`, `saveToLocalStorage()`, and `checkAndOfferDraftRestore()` form a self-contained persistence concern: debounce management, per-slug key naming, serialization format, and draft/DB timestamp comparison. Extract to `src/utils/editor-autosave.ts` (or a small `EditorAutosave` class) that takes a slug and serialization callbacks. Makes the logic testable without a full editor instance.

- [ ] [Both] [A:Low] [Architecture] Decompose ScoreEditor into model + view
  - `ScoreEditor.ts` is ~930 lines mixing 8+ concerns: state (instance variables), DOM generation (`innerHTML` templates), event wiring, API calls, validation, localStorage autosave, preview rendering, and CSS injection. This monolith makes adding versioning, collaboration, or format plugins require invasive surgery on a single file.
  - **Approach**: (a) `EditorState` — holds data, emits change events; (b) `EditorView` — subscribes to state, renders DOM; (c) extracted concerns already tracked above (CSS → stylesheet, validation → utility, autosave → utility). The same pattern applies to `ScoreLibrary.ts` and `ScoreDetailClient.ts` at smaller scale.
  - **Do the extractions above first** — they reduce the scope of this decomposition significantly and validate the boundaries before committing to a full split.

- [ ] [UI] [A:Low] [Alpha] Revisit unsaved changes indicator design
  - Current: "Unsaved changes" text appears inline in the metadata panel next to the Save button
  - Consider: prominence (is it visible enough?), mobile layout (does it wrap awkwardly?), animation on state change (subtle fade-in when changes occur, fade-out after save)

- [ ] [Backend] [A:Medium] [Quality-Explicit] Investigate inconsistent save normalization in ScoreEditor
  - `src/components/ScoreEditor.ts:416-424` — ABC scores are converted to JSON before saving to Supabase, but MusicXML scores are saved as raw XML strings. This means the `data_format` in the DB is always `'json'` for ABC but `'musicxml'` for MusicXML. Decide if this is intentional (MusicXML fidelity) or an oversight, and document or standardize the behavior.

- [ ] [UI] [A:Medium] [Content] Add license selector field to score editor
  - Add a license dropdown to the score metadata section of the editor
  - Options: All Rights Reserved, CC BY, CC BY-SA, CC BY-NC, CC BY-NC-SA, Public Domain (CC0)
  - Show a brief description of each license to help users choose appropriately
  - Store selection as SPDX identifier in score metadata
  - Default to All Rights Reserved for new scores
  - Display selected license on score detail page

- [ ] [UI] [A:High] [Polish] Add loading spinners and error states
- [ ] [UI] [A:High] [Polish] Polish form validation and error messages
- [ ] [Both] [A:Medium] [Advanced] Version history (track edits over time)
- [ ] [UI] [A:Low] [Advanced] Visual score editor (point-and-click note entry)
- [ ] [Backend] [A:Medium] [Advanced] Multiple score input formats (import from ABC, etc.)

### Auth / Account

- [ ] [UI] [A:High] [Quality-DRY] Refactor AuthModal to use ConfirmDialog (DRY violation)
  - `src/components/AuthComponents.ts` and `src/components/ConfirmDialog.ts` have significant duplication
  - Both implement overlay, modal container, escape key handling, click-to-close
  - **Recommended approach**: Extend ConfirmDialog to accept custom body content
  - AuthModal uses ConfirmDialog and passes form as custom body
  - Shares all overlay/container/button logic
  - Alternative: Create shared BaseDialog component that both extend

- [ ] [Backend] [A:High] [Quality-Separation] Extract auth subscription boilerplate into a shared page initializer
  - `src/pages/index.astro:26-35`, `src/pages/editor.astro:21-30`, `src/pages/score/[slug].astro:90-99` — All three pages have an identical block: create `AuthWidget`, call `authState.subscribe()`, toggle `setUser()`/`clearUser()`. Extract to a function like `initPageAuth(widgetId: string)` in `src/utils/page-init.ts` and call it from each page.

- [ ] [Backend] [A:High] [Quality-Testing] Add unit tests for auth module
  - `src/api/auth.ts` and `src/api/authState.ts` have 0 tests. Test: `signUp`/`signIn`/`signOut` call correct Supabase methods and return expected results, `AuthStateManager.subscribe()` fires callback immediately, `isAuthenticated()` reflects current state, `onAuthStateChange` relays Supabase auth events.

- [ ] [Backend] [A:Medium] [Advanced] Private scores (unlisted or private visibility)

### Renderer Library

- [ ] [Backend] [A:Medium] [Architecture] Evaluate moving format parsing into the web component / renderer package
  - `src/utils/score-data.ts` imports parsers from `src/web-component/parser/` — platform utilities reaching into the renderer's internals for format dispatch. If the web component already owns parsers (ABCParser, MusicXMLParser), it could expose a `parseScoreText(text, format)` function as part of its public API, or accept a `data-format` attribute alongside `data-score` and handle parsing internally. This would keep format knowledge inside the renderer boundary and let the platform pass raw data + format without knowing how to parse it.

- [ ] [UI] [A:Medium] [Alpha] Investigate letter spacing for font aesthetics and legibility.
  - candidate sizes:
    - buttons -0.022em
    - large headings: letter-spacing: -.005em;
  - research how apple.com does letter-spacing. Seems to vary based on role, font size, font family and font weight. Is there a pattern?
  - **Phase 2: Determine Optimal Values** (User-driven)
    - [ ] Use control panel to test different letter spacing values
    - [ ] Identify optimal value for body copy
    - [ ] Identify optimal value for buttons
    - [ ] Identify optimal value for form inputs
    - [ ] Identify optimal value for labels/small text
    - [ ] Identify optimal value for headings
    - [ ] Document final values (e.g., copy: -0.02em, buttons: -0.015em, etc.)
  - **Phase 3: Apply to Codebase** (After user determines values)
    - [ ] Update CSS design tokens with finalized values
    - [ ] Update button styles to use determined letter-spacing
    - [ ] Update form input styles to use determined letter-spacing
    - [ ] Update body copy styles to use determined letter-spacing
    - [ ] Update heading styles to use determined letter-spacing
    - [ ] Remove dev control panel or convert to production feature toggle
    - [ ] Run visual regression tests to verify changes
  - **Notes**:
    - Should not apply to SVG-rendered score notation (already isolated)
    - Control panel only renders in dev mode (zero production impact)

- [ ] [Backend] [A:High] [Quality-Explicit] Replace hardcoded fallback viewport 800×600 with explicit error or documented default
  - `src/renderer/ScoreRenderer.ts:207-208` — `width: rect.width || 800, height: rect.height || 600` silently substitutes default dimensions when the container has zero size (common when container is hidden or not yet in the DOM). Either throw an error ("Container has zero dimensions — ensure it is visible before rendering") or define a named constant `DEFAULT_VIEWPORT = { width: 800, height: 600 }` so the fallback is discoverable.

- [ ] [Backend] [A:High] [Quality-Explicit] Document or name the MusicXMLParser duration mapping thresholds
  - `src/parser/MusicXMLParser.ts:80-89` — Duration mapping uses `>= 4` → whole, `>= 2` → half, else quarter. The thresholds are undocumented and lossy (a MusicXML duration of 3 maps to half note, but 3 divisions typically means dotted quarter). Add a comment block explaining the mapping decisions and known limitations, or extract to a named function `mapMusicXMLDuration(rawDuration: number): number`.

- [ ] [Backend] [A:High] [Quality-Explicit] Name magic numbers in VerticalSystem separator drawing
  - `src/renderer/VerticalSystem.ts:160-164` — `this.y - 20`, `this.y + this.columnHeight + 20`, `'#ccc'`, `1` are unexplained. Define named constants like `SEPARATOR_EXTENSION = 20`, `SEPARATOR_COLOR = '#ccc'`, `SEPARATOR_WIDTH = 1`, or better yet, derive from `RenderOptions`.

- [ ] [Backend] [A:High] [Quality-Explicit] Name magic number for rest vertical centering in ShakuNote
  - `src/notes/ShakuNote.ts:144` — `this.y - this.fontSize * 0.4` uses an unexplained `0.4` multiplier to position the rest circle relative to the note baseline. Extract to a named constant like `const JAPANESE_CHAR_VERTICAL_CENTER_RATIO = 0.4` with a comment explaining that Japanese characters are typically centered around 40% above the baseline.

- [ ] [Backend] [A:High] [Quality-Explicit] Name magic number for duration line baseline ratio
  - `src/modifiers/DurationLineModifier.ts:58` — `-NOTE.fontSize * 0.25` uses a bare `0.25` to calculate the vertical middle of a note character. Define `const NOTE_VERTICAL_MIDDLE_RATIO = 0.25` and reference it, matching the comment already present ("approximately 25% above the baseline").

- [ ] [Backend] [A:High] [Quality-TypeSafety] Remove `undefined as any` hack from DEFAULT_RENDER_OPTIONS
  - `src/renderer/RenderOptions.ts:256-257` — `width: undefined as any, height: undefined as any` is used to make these fields exist in the defaults object while keeping them "optional". Instead, separate the type: define `ViewportOptions = { width?: number; height?: number }` and merge it separately, avoiding the `any` cast that breaks `Required<RenderOptions>` semantics.

- [ ] [Backend] [A:High] [Quality-Coupling] Move MusicXMLParser out of ScoreRenderer
  - `src/renderer/ScoreRenderer.ts` imports `MusicXMLParser` for the `renderFromURL()` method. The renderer's job is to render `ScoreData`, not to fetch and parse XML files. Move `renderFromURL()` to the convenience functions module (`src/renderer/convenience.ts`) where it already lives as `renderScoreFromURL()`. This makes `ScoreRenderer` depend only on `ScoreData`, not on parsing.

- [ ] [Backend] [A:High] [Quality-Abstraction] Remove TestModifier from public API exports [Claude validated]
  - `src/index.ts:50` — `TestModifier` is a testing utility, not a library feature. Exporting it as part of the public API makes it contractual — consumers may depend on it, preventing removal. Remove the export from `index.ts`. Test files can import directly from the source path.

- [ ] [Backend] [A:High] [Quality-Abstraction] Move toJSON/convertToJSON off MusicXMLParser
  - `src/parser/MusicXMLParser.ts:153-166` — `toJSON()` and `convertToJSON()` are serialization methods on a parser class. A parser's job is to parse input into a structure; serializing a structure back to a string is a separate concern. Move these to a `ScoreSerializer` utility or simply use `JSON.stringify()` directly at call sites.

- [ ] [Backend] [A:High] [Quality-DRY] Extract repeated error wrapping pattern in scores.ts
  - `src/api/scores.ts` — Six functions (`createScore`, `getUserScores`, `getScoreBySlug`, `updateScore`, `deleteScore`, `forkScore`) all share the same try/catch + `{ score: null, error: ... }` wrapping pattern. Each catch block has identical `error instanceof Error ? error : new Error('Unknown error ...')` logic. Extract a helper like `wrapScoreResult<T>(fn: () => Promise<T>): Promise<ScoreResult<T>>` to eliminate the repetition and ensure consistent error handling across all CRUD operations.

- [ ] [Backend] [A:High] [Quality-FailFast] ScoreRenderer.renderDebugLabel(): replace silent null check with assertion
  - `src/renderer/ScoreRenderer.ts:154` — `if (!this.renderer) return;` silently skips rendering. After construction, `this.renderer` should always exist when `renderDebugLabel` is called (it's only called inside `renderNotes` which creates the renderer). Replace with a dev assertion or remove the guard since the invariant is guaranteed by the calling code.

- [ ] [Backend] [A:High] [Quality-Testing] Add unit tests for SVGRenderer group management
  - `src/renderer/SVGRenderer.ts` has 0 tests. The `openGroup()`/`closeGroup()` pair manages a group stack that determines SVG nesting. Test: open then close produces correct hierarchy, nested groups work, closeGroup with no open groups throws, multiple groups at same level work.

- [ ] [Backend] [A:High] [Quality-Testing] Add unit tests for modifier rendering logic
  - `src/modifiers/` has 6 modifier classes (`OctaveMarksModifier`, `MeriKariModifier`, `DurationDotModifier`, `DurationLineModifier`, `AtariModifier`, `Modifier` base) with 0 unit tests. Each modifier has offset calculations, font configuration setters, and render methods that position SVG elements relative to the parent note. Test that: setters update internal state, `getPosition()` returns correct offsets, and `render()` calls the expected SVGRenderer methods (using a mock/spy).

- [ ] [Backend] [A:High] [Quality-Testing] Verify mock was called in convenience.test.ts
  - `src/renderer/convenience.test.ts:11-23` — Mocks `MusicXMLParser.parseFromURL` but never asserts it was called. Add `expect(MusicXMLParser.parseFromURL).toHaveBeenCalledWith(url)` after `renderScoreFromURL()` to verify the integration actually uses the parser.

- [ ] [Backend] [A:Medium] [Quality-TypeSafety] Replace meri/chu_meri/dai_meri boolean flags with a discriminated union
  - `src/types/ScoreData.ts:45-52` — Three optional booleans (`meri`, `chu_meri`, `dai_meri`) allow invalid states: all three can be true simultaneously, which has no musical meaning. Replace with a single field `meriType?: 'meri' | 'chu_meri' | 'dai_meri'` that makes illegal states unrepresentable. This requires updating `ScoreParser`, `MusicXMLParser`, `KINKO_PITCH_MAP`, and all tests that reference these fields. Also fixes the naming inconsistency: `chu_meri` uses snake_case while the rest of the interface uses camelCase.

- [ ] [Backend] [A:Medium] [Quality-TypeSafety] Type the `data` field in Score/CreateScoreData/UpdateScoreData instead of `any`
  - `src/api/scores.ts:15,27,36` — The `data` field is typed `any` on three interfaces. This disables type checking for the most important field in the system (the actual score content). Define `data: ScoreData | string` (JSON ScoreData for `data_format: 'json'`, MusicXML string for `data_format: 'musicxml'`) or at minimum `data: unknown` to force explicit checks at usage sites.

- [ ] [Backend] [A:Medium] [Quality-Coupling] Decouple ColumnLayoutCalculator from DurationDotModifier [Claude validated]
  - `src/web-component/renderer/ColumnLayoutCalculator.ts:11` — The layout calculator imports `DurationDotModifier` to check `instanceof` at lines 190, 307 when determining whether a note needs extra vertical spacing. This couples layout logic to a specific modifier type. Instead, add a method to `ShakuNote` like `needsExtraSpacing(): boolean` that checks its own modifiers, so the layout calculator only depends on the note interface.

- [ ] [Backend] [A:Medium] [Quality-Abstraction] Evaluate whether Formatter and VerticalSystem should be public API [Claude validated]
  - `src/index.ts:31-34` — `Formatter` and `VerticalSystem` are exported but appear to be alternative/experimental layout components not used by the main `ScoreRenderer` pipeline (which uses `ColumnLayoutCalculator`). If they are internal or experimental, remove from `index.ts` to reduce the public API surface. If they are intentionally public, add JSDoc explaining their purpose and relationship to `ColumnLayoutCalculator`.

- [ ] [Backend] [A:High] [API-Improvements] Add options validation with warnings
  - [ ] Validate `notesPerColumn >= 1`
  - [ ] Validate `columnSpacing >= 0`
  - [ ] Validate font sizes in reasonable range (1-200)
  - [ ] Log warnings for invalid values, use defaults
  - **Rationale**: Prevent silent failures and broken rendering states

- [ ] [Backend] [A:High] [API-Improvements] Add typed error classes
  - [ ] Create `RendererError` base class
  - [ ] Add `ParseError` for MusicXML parsing failures
  - [ ] Add `NetworkError` for fetch failures
  - [ ] Add `ValidationError` for invalid options
  - **Rationale**: Better error handling and debugging in user applications

- [ ] [Backend] [A:Medium] [API-Improvements] Clean up public API surface
  - [ ] Audit all exports in `src/index.ts` (currently 55+ exports)
  - [ ] Keep only high-level API: `ScoreRenderer`, `renderScoreFromURL`, `renderScore`, `RenderOptions`
  - [ ] Move advanced APIs to separate import path: `shakuhachi-ro/advanced`
  - [ ] Remove internal exports: `TestModifier`, `ScoreParser`, kinko-symbols utilities
  - [ ] Remove experimental exports: `Formatter`, `VerticalSystem` (not used by main API)
  - **Rationale**: Clearer API boundaries, better tree-shaking, signals stability

- [ ] [Backend] [A:High] [API-Improvements] Fix async API consistency
  - [ ] Make `renderFromScoreData()` synchronous (no async work happening)
  - [ ] Keep `renderFromURL()` async (actually fetches data)
  - [ ] Add deprecation warning for old async signature
  - [ ] Update all call sites
  - **Rationale**: Better performance, more predictable API

- [ ] [Backend] [A:High] [API-Improvements] Add fluent API pattern
  - [ ] Return `this` from `setOptions()`
  - [ ] Return `this` from `resize()`
  - [ ] Return `this` from `clear()`
  - [ ] Enable method chaining: `renderer.setOptions(...).resize(...).refresh()`
  - **Rationale**: Better ergonomics, matches VexFlow pattern

- [ ] [Backend] [A:High] [API-Improvements] Replace getter methods with property getters
  - [ ] Replace `getOptions()` with `get options()`
  - [ ] Replace `getNotes()` with `get notes()`
  - [ ] Replace `getScoreData()` with `get scoreData()`
  - [ ] Update documentation with new syntax
  - **Rationale**: More idiomatic JavaScript, better DX

- [ ] [Backend] [A:High] [API-Improvements] Improve naming consistency
  - [ ] Rename `ColumnLayoutCalculator` → `LayoutCalculator` (simpler)
  - [ ] Rename `ModifierConfigurator` → `ModifierManager` (more conventional)
  - [ ] Rename `mergeWithDefaults()` → `mergeOptions()` (more descriptive)
  - **Rationale**: Consistent naming patterns across codebase

- [ ] [Backend] [A:High] [API-Improvements] Subpath exports for better tree-shaking
  - [ ] Add `package.json` exports map
  - [ ] Create `shakuhachi-ro/renderer`, `shakuhachi-ro/modifiers`, `shakuhachi-ro/utils`
  - [ ] Update build configuration
  - **Rationale**: Better tree-shaking, clearer API boundaries

- [ ] [Backend] [A:Medium] [API-Improvements] Add event system for lifecycle hooks
  - [ ] Design event types: `render:start`, `render:complete`, `render:error`, `options:change`, `resize`
  - [ ] Implement `on(listener)` method
  - [ ] Emit events during rendering lifecycle
  - [ ] Add documentation and examples
  - **Rationale**: Enables performance monitoring, loading states, error handling in frameworks

- [ ] [Backend] [A:Medium] [API-Improvements] Flexible constructor overloads
  - [ ] Allow `new ScoreRenderer(options)` without container
  - [ ] Add `attachTo(container)` method for deferred attachment
  - [ ] Support rendering before container is available
  - **Rationale**: Better framework integration (React refs, Vue $refs)

- [ ] [Backend] [A:Medium] [API-Improvements] Multi-container support
  - [ ] Allow `attachTo()` multiple containers
  - [ ] Add `detachFrom(container)` method
  - [ ] Render same score to multiple places
  - **Rationale**: Reuse renderer across components

- [ ] [Backend] [A:Medium] [API-Improvements] Prepare v2.0 release
  - [ ] Create migration guide document
  - [ ] Add deprecation warnings to v1.x for breaking changes
  - [ ] Maintain v1.x branch for 6-12 months after v2.0 release
  - [ ] Document all breaking changes with before/after examples
  - [ ] Provide automated migration tooling (codemod) if possible

- [ ] [Backend] [A:Medium] [Architecture] Extract a RenderingBackend interface from SVGRenderer
  - `SVGRenderer` is imported as a concrete type in 13 files (all 6 modifiers, ShakuNote, ScoreRenderer, VerticalSystem, ModifierConfigurator, and more). The draw primitives (`drawText`, `drawCircle`, `drawLine`, `drawPath`, `drawRect`, `openGroup`, `closeGroup`, `resize`, `clear`) are already abstract in practice — only the type references are concrete. Define a `RenderingBackend` interface with these methods, have `SVGRenderer` implement it, and change all consumers to depend on the interface. This is a mechanical type-level change with zero runtime cost. It unlocks Canvas/WebGL backends and enables mock renderers for unit testing modifiers and notes without a DOM.
  - **Validate first**: Read every file that imports `SVGRenderer`, confirm none use SVG-specific APIs beyond the draw primitives (exception: `VerticalSystem` uses `setAttribute('transform', ...)` on SVG group elements — plan how to abstract this). Map every method signature that needs to change.

- [ ] [Backend] [A:Medium] [Architecture] Introduce a Parser interface and registry
  - There is no formal `Parser` interface. `MusicXMLParser` is a concrete static class imported by name in `ScoreDetailClient` (line 83), `ScoreRenderer` (line 64), and `convenience.ts`. Format dispatch (`if format === 'musicxml' ... else if format === 'json'`) is scattered across 3 components. Define a `Parser` interface (`parse(content: string): ScoreData`), create a `ParserRegistry` keyed by `ScoreDataFormat`, and replace scattered conditionals with `ParserRegistry.get(format).parse(content)`. Adding a new format (e.g., ABC notation) then becomes one new file + one registry entry instead of touching 6 files.
  - **Validate first**: Read all files that reference `MusicXMLParser` or check `data_format`. Map every call site. Confirm that `ScoreParser` (which converts `ScoreData` → `ShakuNote[]`) is a separate concern and should NOT be part of this interface. Verify `ScoreDataFormat` type location (`api/scores.ts:5`) and whether it belongs in `types/`.

- [ ] [UI] [A:High] [Polish] Test geometricPrecision on shakuhachi SVG notes
- [ ] [Research] [A:Low] [Alpha] Investigate web component frameworks
- [ ] [Backend] [A:High] [Renderer-Future] Add JSDoc comments to public APIs
- [ ] [Backend] [A:Medium] [Renderer-Future] Write usage guide in reference/README.md
- [ ] [Backend] [A:Medium] [Renderer-Future] Document score data format

- [ ] [Backend] [A:Medium] [Renderer-Modifiers] YuriModifier (vibrato)
- [ ] [Backend] [A:Medium] [Renderer-Modifiers] MuraikiModifier (breathy tone)
- [ ] [Backend] [A:Medium] [Renderer-Modifiers] SuriModifier (sliding)
- [ ] [Backend] [A:Medium] [Renderer-Modifiers] OriModifier (pitch bend)
- [ ] [Backend] [A:Medium] [Renderer-Modifiers] Centered duration line style (line passes horizontally through middle of note, alternative to current right-aligned style)

- [ ] [Backend] [A:Medium] [Performance] Profile rendering performance
- [ ] [Backend] [A:Medium] [Performance] Optimize frequent operations
- [ ] [Backend] [A:Medium] [Performance] Add caching where appropriate
- [ ] [Backend] [A:Low] [Performance] Revisit column breaking with TeX-inspired badness algorithm
  - [ ] Implement badness metric for column height variance
  - [ ] Add demerits for orphans (single notes in columns)
  - [ ] Add penalties for breaking at certain notation points
  - [ ] Implement global optimization across score (Knuth-Plass approach)

### Content / Data

- [ ] [Both] [A:High] [Content] Handle score license requirements
  - Audit license types likely encountered: public domain, CC BY, CC BY-SA, CC BY-NC, CC BY-NC-SA, all-rights-reserved
  - Implement license metadata field on scores (store SPDX identifier or license name + URL)
  - Display license badge/notice on score detail page (required by CC licenses)
  - For CC BY: show author name with link to original source
  - For CC BY-SA: show license notice and link; any derivative works must use same license
  - For CC BY-NC: show non-commercial restriction notice
  - Ensure user-created scores can also declare a license
  - Block or warn on import of all-rights-reserved content without explicit permission

- [ ] [Both] [A:Medium] [Content] Revisit attribution modules design and placement
  - Review how attribution (composer, source, license) is currently stored and displayed
  - Evaluate whether attribution belongs in score metadata, a separate DB field, or a dedicated module
  - Consider display placement: score detail page, score card in library, score header, footer
  - Ensure design scales to support imported scores (IMSLP, shin-itchiro) with varied attribution requirements
  - Align with any licensing obligations (e.g., CC license notices must be visible)

- [ ] [Research] [A:Medium] [Content] Research and identify shakuhachi score sources
  - Survey publicly available shakuhachi score repositories (websites, archives, blogs, academic sources)
  - Identify sources with digital scores in machine-readable formats (MusicXML, ABC, MIDI, PDF)
  - Note each source's language, format, scope (honkyoku, minyo, Western adaptations, etc.)
  - Assess volume and quality of available scores per source
  - Document findings to guide prioritization of scraping/import tasks

- [ ] [Content] [A:Medium] [Content] Scrape scores from https://imslp.org/wiki/
  - Investigate IMSLP's API or data availability for shakuhachi-relevant scores
  - Determine licensing compatibility (IMSLP uses various Creative Commons and public domain licenses — verify per score)
  - Build or adapt a scraper to extract score data and metadata
  - Convert extracted data to the platform's JSON/MusicXML format
  - Import scores with correct attribution and license metadata

- [ ] [Content] [A:Medium] [Content] Scrape scores from https://shin-itchiro.seesaa.net/
  - Investigate available score data format and structure on the site
  - Determine licensing/permission before importing any content
  - Build or adapt a scraper to extract shakuhachi score data
  - Convert extracted data to the platform's JSON/MusicXML format
  - Import scores into the platform with correct metadata (title, attribution)

### Advanced / Future

- [ ] [Both] [A:Medium] [Advanced] Collections (curated score groups)
- [ ] [Both] [A:Medium] [Advanced] Comments/discussions on scores
- [ ] [Both] [A:Medium] [Advanced] Export/download scores as files
- [ ] [Backend] [A:Medium] [Advanced] Western staff intermixing
- [ ] [Backend] [A:Medium] [Advanced] Custom font support for traditional glyphs
- [ ] [Backend] [A:Medium] [Advanced] Score transposition tool
- [ ] [Both] [A:Low] [Advanced] OCR tool (scan physical scores to MusicXML/JSON)
- [ ] [Both] [A:Low] [Advanced] Pull request workflow (suggest changes to others' scores)
- [ ] [Backend] [A:Low] [Advanced] MIDI playback mapping
- [ ] [UI] [A:Medium] [Advanced] Page-turn navigation for long scores (when score exceeds viewport height, allow keyboard/UI controls so players can advance through the score while performing)
- [ ] [UI] [A:Medium] [Advanced] Print optimization (CSS for clean printouts)

### QA

- [ ] [UI] [A:High] [Polish] Test across browsers (Chrome, Firefox, Safari)

### Architecture

- [ ] [UI] [A:Medium] [Research] Investigate standardizing page padding to always use `main` instead of per-container overrides on fullHeight pages
  - **Goal**: Determine if all pages can get spacing from `main { padding: var(--spacing-medium) }` without each page's container needing its own padding.
  - **Current architecture (researched 2026-03-16):**
    - Regular pages (`fullHeight=false`): spacing comes from `main { padding: var(--spacing-medium) }` in Layout.astro — no container padding needed.
    - fullHeight pages (`fullHeight=true`): `body.full-height main { padding: 0 }` overrides via higher specificity (`0-1-2` vs `0-0-1`), so each container sets its own padding:
      - `/score/:slug` → `.score-detail-container { padding: var(--spacing-medium) var(--spacing-medium) 0 }`
      - `/score/:slug/edit` → `.edit-layout { padding: var(--spacing-medium) }`
  - **Why fullHeight pages override**: The `body.full-height main` rule exists because fullHeight pages use `flex: 1`, `height: calc(100vh - 80px)`, and `overflow: hidden`. Padding on `main` is believed to interfere with these height calculations and clip content.
  - **Question to investigate**: Is the `padding: 0` on `body.full-height main` actually necessary, or could we give `main` its padding and let the containers handle only their specific layout concerns (flex, overflow)?
  - **Approach**:
    - Try adding `padding: var(--spacing-medium)` back to `body.full-height main` and removing container-level padding from score detail and edit pages
    - Verify that score detail layout still fills viewport correctly
    - Verify that editor side-by-side layout with `height: calc(100vh - 80px)` still works
    - Test mobile viewports (the media query at 768px reverts fullHeight to natural scrolling — padding may behave differently there)
    - If it works: remove per-container padding and the `body.full-height main { padding: 0 }` override
    - If it breaks height calculations: document why the override is required and add a code comment explaining the constraint

### Tooling / Guidelines

- [ ] [A:Medium] [Tooling] Review and prune toast visual regression tests
  - `tests/visual/toast.spec.ts` has 18 tests across Desktop / Mobile / Tablet but many appear to capture the same visual output (e.g. individual variant tests at desktop repeat what the "all variants" grid already covers)
  - Review each test: does it cover a genuinely distinct visual state, or is it redundant with another test in the suite?
  - Goal: keep tests that catch real regressions; remove duplicates that just inflate baseline count and maintenance burden
  - Also evaluate whether Desktop + Mobile + Tablet all-variants tests are all necessary, or whether one representative viewport per theme is sufficient

### Score Detail / View

- [ ] [UI] [A:Low] [Polish] Move attribution data from footer to top of page
  - Needs ux design
