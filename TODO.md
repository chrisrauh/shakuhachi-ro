# TODO - Shakuhachi.ro

## How to Work with This File

**IMPORTANT: Follow these rules strictly:**

- **Work in strict top-to-bottom order** - Start with the first unchecked task, then move to the next
- **One task at a time** - Never work on multiple tasks simultaneously
- **Follow the dev workflow** - See [CLAUDE.md](./CLAUDE.md)

## Task Tags

**Autonomy:** `[A:High]` = Agent-ready (see below) | `[A:Medium]` = May need guidance | `[A:Low]` = Requires collaboration

**`[A:High]` means agent-ready:** The task description must be specific enough for an autonomous agent to implement without asking any questions — file paths, exact approach, known constraints. If a task needs clarification before it can be worked on, it is not `[A:High]`. Downgrade to `[A:Medium]` until fleshed out.

---

## Next Session

- [ ] [A:Medium] Migrate task tracking to GitHub Issues + slim TODO.md
  - Create GitHub Issues from all current TODO.md tasks with labels for category and autonomy level
  - Slim TODO.md to a "Current Focus" list of 3-5 items with `#issue` links
  - Update CLAUDE.md workflow section to reflect the hybrid system

## Prioritized Backlog

### Bugs

- [x] [A:Medium] Committed embed bundle is stale — live site renders notes at the wrong size and weight
  - `public/embed/shakuhachi-score.js` is checked into the repo and loaded directly by the detail and edit pages (`<script is:inline src="/embed/shakuhachi-score.js">`). It was last rebuilt at `6f6f3e3`, and source changed afterwards without a rebuild, so the deployed renderer does not match source.
  - Confirmed drift (3 bytes, identical file size — easy to miss in review):

    | Value | Committed bundle | Source |
    |-------|------------------|--------|
    | `noteFontSize` | 28 | 32 — `src/web-component/renderer/RenderOptions.ts:229` |
    | `fontWeight` | 400 | 500 — `src/web-component/constants/layout-constants.ts:20` |

  - **First confirm the source values are the intended ones.** It is possible the bundle-level values were the deliberate choice and the source edit was never meant to ship. If source is correct, rebuild with `npm run build:wc` and commit the regenerated bundle.
  - **Expect visual regression diffs.** Current baselines were captured against the stale bundle, so notes will render larger and heavier after the rebuild. Every score-rendering snapshot will change legitimately — go through the baseline-approval workflow and review each diff rather than blanket-accepting.
  - **Root cause worth addressing separately:** a committed build artifact silently drifts from source with nothing to catch it. Consider a CI check that rebuilds and fails on a diff, or dropping the artifact from git and generating it at deploy time.
  - Discovered 2026-09-20 while establishing a baseline for the dependency upgrades below.

### Dependency Upgrades

Thirteen packages need major-version bumps. **Work these six entries strictly top to bottom.** Entry 4 must precede entry 5: astro 7 bundles `vite ^8.0.13`, so bringing the root vite to 8 first lets the astro install dedupe onto one copy. The rest are ordered cheapest-and-most-isolated first, so confidence accumulates and each failure is unambiguous.

**Execution: `/agent-workflow`, as a stacked PR chain.** Deviations from that skill's standard setup:

- **Branch from the previous entry's branch, not `main`.** Entry 1 branches from `main`, entry 2 from entry 1's branch, and so on. Every entry regenerates `package-lock.json`, which does not merge — a stack is what keeps each diff reviewable. Six branches cut from `main` would put six conflicting lockfiles in flight at once.
- **Set the PR base explicitly:** `gh pr create --base <previous-branch>`. Only entry 1 targets `main`.
- **State the stack position in the PR body** — which PR it sits on, which it blocks — so review order is unambiguous.
- Do not wait for the previous PR to merge before starting the next. Do not rebase mid-stack unsolicited; if an earlier PR changes during review, rebase the rest of the stack then.
- Merge stays human and bottom-up. Never merge.

**Where an entry flags a judgment call** (the Lucide glyph shape, the Vite browser-support floor), take the stated default, implement it, and call it out in the PR body as a decision to confirm. Do not stop to ask — the PR is the gate. A `Bail out if` clause is different: that is a hard stop, per the agent-workflow failure protocol.

Each entry is a brief plus the research, not a finished design — do a planning pass before starting one.

**Baseline** (`bfc61ef`, verified 2026-09-20): `npm test` green — 26 test files, 387 tests, `astro check` 0 errors / 0 warnings / 87 hints. `npm run build` green. Embed bundle `dist/embed/shakuhachi-score.js` = 25.97 kB (7.92 kB gzip). Installed: astro 5.17.1, vite 5.4.21, vitest 2.1.9, eslint 9.39.2, jsdom 25.0.1, lucide 0.562.0, typescript 5.9.3.

An unvalidated batch of these bumps was stashed on 2026-09-20 (`git stash list` → "wip: unvalidated major dep bumps"). Every target version is recorded below, so the stash is redundant and can be dropped.

- [x] [A:High] Upgrade ESLint toolchain to v10
  - Bump atomically: `eslint` 9.39.2 → 10.11.0, `eslint-config-prettier` 9.1.2 → 10.1.8, `@typescript-eslint/eslint-plugin` + `@typescript-eslint/parser` 8.54.0 → 8.70.0. Ensure `eslint-plugin-prettier` resolves to ≥5.5.6.
  - **typescript-eslint has no v9** — 8.70.0 already peers `eslint: ^8.57.0 || ^9.0.0 || ^10.0.0`, so this is a minor bump, not a blocker. eslint-plugin-prettier 5.5.6 peers `eslint >=8.0.0` and `eslint-config-prettier ">= 7.0.0 <10.0.0 || >=10.1.0"` — both satisfied. ESLint 10 engines: `^20.19.0 || ^22.13.0 || >=24` (we run Node 24).
  - **`eslint.config.js` needs no edits.** Keep `...prettierConfig.rules` as-is. Do NOT switch to spreading the whole `prettierConfig` object — the spread sits inside a `rules: {}` block, so that would inject `rules` and `name` as bogus rule names. The whole-object pattern only applies when appending the config as its own array element.
  - **The actual work is three rules newly added to `eslint:recommended`**, which activate automatically because the config spreads `...eslint.configs.recommended.rules` into both blocks: `no-unassigned-vars`, `no-useless-assignment`, `preserve-caught-error`.
  - **`preserve-caught-error` will flag four known sites** — `throw new Error(...)` inside a `catch` with no `cause`: `src/web-component/ShakuhachiScore.ts:113` and `:125`, `src/web-component/parser/ScoreParser.ts:319` and `:347`. Mechanical fix: add `{ cause: error }` as the second `Error` argument. The `return { error: ... }` pattern across `src/api/scores.ts` is NOT flagged — the rule only targets `throw` inside `catch`.
  - Also note `no-shadow-restricted-names` now flags `globalThis`. No impact from the eslintrc removal (already flat-config-only) or the removed `context`/`SourceCode` methods (no custom rules).
  - **Verify:** capture `npm run lint` and `npx eslint --print-config src/index.ts` as a baseline *before* bumping, then diff both after — the `--print-config` diff catches silent rule-set changes a passing lint run would hide. Then full `npm test`. No browser check needed.

- [x] [A:High] Upgrade jsdom to v29
  - Bump `jsdom` 25.0.1 → 29.1.1. Test environment only — `vitest.config.ts` sets `environment: 'jsdom'`, nothing imports jsdom directly, no `setupFiles`.
  - **Probe before trusting the suite:** `node -e "const {JSDOM}=require('jsdom'); const w=new JSDOM('').window; console.log(typeof w.ResizeObserver, typeof w.fetch)"`. `ScoreRenderer.ts:296` and `ShakuhachiScore.ts:44` branch on `typeof ResizeObserver === 'undefined'` to install fallback timers. If jsdom 29 ships a **non-functional stub**, the guard passes but the callback never fires — tests stay green while behavior is silently wrong. Same for `fetch`, which `vi.stubGlobal` mocks rely on intercepting.
  - **Watch:** `MusicXMLParser.test.ts` / `MusicXMLSerializer.test.ts` (`DOMParser` round-trips — jsdom's XML namespace and whitespace handling has shifted across majors) and `ShakuhachiScore.test.ts` (`customElements.define`; the ResizeObserver-unavailable test at line 305; the "Initial Render" block at 232).
  - **Bail out if:** XML tests fail from genuine parsing-semantics differences — downgrade rather than loosening assertions. A ResizeObserver stub that breaks resize behavior is fix-or-downgrade, never ship-anyway.

- [x] [A:High] Upgrade Lucide to v1 (both packages)
  - Bump `@lucide/astro` 0.563.0 → 1.47.0 and `lucide` 0.562.0 → 1.47.0 **together**, so the shared glyph change lands once across `.astro` and `.ts` call sites. Independent of the Astro upgrade — `@lucide/astro` peers `^4 || ^5 || ^6 || ^7`.
  - **This is a deliberate visual change, not just a version bump.** `Trash2` is now a deprecated alias onto the consolidated `Trash` glyph (`node_modules/@lucide/astro/src/aliases/aliases.ts`: *"The icon was combined with another icon that shares the same use case"*). It compiles either way, but the rendered icon changes shape.
  - Edits: `src/pages/score/[slug].astro:6,61` and `src/utils/init-header.ts:12,151` → `Trash2` to `Trash`. Also `src/utils/init-header.ts:5,98` → `HelpCircle` to `CircleHelp` (the codebase straddles both conventions; `src/utils/icons.ts` already uses `CircleHelp`).
  - **Out of scope, leave alone:** the `AlertCircle` → `CircleAlert` rename (tracked as its own entry below — it is a two-sided change, since `createIcons` derives `data-lucide="alert-circle"` from the PascalCase key, so `renderIcon('alert-circle')` at `src/components/ScoreEditor.ts:515` must move in lockstep), and the apparently-dead `Eye` and `Calendar` registrations in `initIcons()`. Neither is required by the version bump. If you confirm `Eye`/`Calendar` have no `renderIcon()` call site, add that finding to TODO rather than acting on it.
  - **Verify:** chrome-devtools-mcp, light and dark — header icons logged-out and logged-in, plus library and detail pages. A `Cannot read properties of undefined` from `createIcons`/`createElement` means a missing export. Then `npm run test:visual`, expecting **legitimate** diffs wherever `Trash` replaced `Trash2` — review each rather than blanket-accepting.
  - Note `@lucide/astro` now ships raw `.ts` source with no `main`/`module` (exports-map only); a bare-import resolution error would trace to that.
  - **Default, then flag:** ship the consolidated `Trash` glyph. Screenshot it at 16px beside the other header icons and put that in the PR body as a design decision to confirm — do not stop to ask.

- [ ] [A:High] Upgrade Vite to 8 and Vitest to 5
  - Bump together (vitest 5 peers `vite ^6.4 || ^7 || ^8`): `vite` 5.4.21 → 8.3.0, `vitest` 2.1.9 → 5.0.1, `@vitest/ui` → 5.0.1 (peered at exactly 5.0.1).
  - **Also fix a pre-existing gap:** add `@vitest/coverage-v8` at 5.0.1. It is currently NOT installed, yet `vitest.config.ts` sets `provider: 'v8'` and `npm run test:coverage` exists — vitest prompts to install on demand, which fails in any non-interactive context.
  - **Vite 8 replaces Rollup+esbuild with Rolldown+Oxc** (verified: `vite@8.3.0` depends on `rolldown` and `lightningcss`, with no `esbuild` or `rollup`). A compat layer auto-converts `rollupOptions`, so most of `vite.embed.config.ts` carries over. Two things do not:
    - **Required edit:** `build.minify: 'esbuild'` is deprecated and esbuild is no longer bundled — keeping it means adding esbuild as an explicit devDependency. Delete the line and take the Oxc default. This changes the embed bundle's bytes (different minifier), not its behavior. Baseline for comparison: 25.97 kB / 7.92 kB gzip.
    - **Default, then flag:** the default browser target rose twice (v7: Chrome 87→107, Safari 14→16.0; v8: Chrome 107→111, Safari 16.0→16.4). For a **publicly embeddable** bundle that is a product support-floor change, not a tooling detail. Default to preserving today's floor with an explicit `build.target: ['chrome87', 'safari14', 'firefox78', 'edge88']`, so the bump stays a pure tooling change and the floor becomes a visible, deliberate line in the config. Note in the PR body that dropping the pin to take Vite 8's newer default is the alternative, and let the human choose.
  - `import.meta.url` is no longer polyfilled in IIFE/UMD output. Zero occurrences in `src/`, but `external: []` inlines every dependency, so a bundled dep could still hit it.
  - **Unverified — check at build time:** whether `rolldownOptions.output.inlineDynamicImports` and `build.lib.fileName`-as-function behave identically under Rolldown. The embed build relies on both.
  - `vitest.config.ts` needs **no edits** — `globals`, `environment`, `include`, and the `coverage` block are all still valid, and the config avoids everything removed (`poolOptions`, `workspace`, `environmentMatchGlobs`, `deps.*`).
  - **The Vitest risk is silent behavior change in the nine mock-using test files**, not config: `clearMocks` now defaults to `true` (v5); `vi.mock`/`vi.unmock`/`vi.hoisted` outside top level now throws rather than warns (v5); unawaited async assertions now fail (v5); `spy.mockReset()` restores the original implementation rather than a noop (v3); `vi.useFakeTimers()` mocks `performance.now()` too (v3 — watch `debounce.test.ts`, `editor-autosave.test.ts`); `toThrow("")` now matches any message (v5). Affected files: `src/api/scores.test.ts`, `src/components/{AuthComponents,ScoreEditor,ScoreLibrary}.test.ts`, `src/utils/{create-score-handler,debounce,editor-autosave,init-header}.test.ts`, `src/web-component/renderer/convenience.test.ts`.
  - Expect a transient duplicate vite after install (root 8, astro 5's nested 6). Resolves in the next entry.
  - **Verify:** `npm run build:wc`, confirm the IIFE still works by loading a score page via chrome-devtools-mcp — this bundle is the product's most externally-visible artifact. Then `npm run test:coverage` (must run without prompting) and `npm run test:visual`.

- [ ] [A:High] Upgrade Astro to 7 and migrate content collections
  - Bump atomically (peer ranges force it): `astro` 5.17.1 → 7.3.3, `@astrojs/mdx` 4.3.13 → 8.0.1 (peers astro ^7.2.6), `@astrojs/netlify` 6.6.4 → 8.2.6 (^7.0.0), `@astrojs/node` 9.5.2 → 11.1.6 (^7.2.1). Astro 7 requires Node ≥22.12.
  - **Do the Vite/Vitest entry first** — astro 7 bundles `vite ^8.0.13`, so a root vite already at 8 dedupes cleanly.
  - **`@astrojs/node` appears unused** — `astro.config.mjs` registers only `netlify()` and no second build target references it. Confirm, then remove it from `devDependencies` rather than carrying a bumped dependency nothing imports.
  - **The substance is the Content Layer migration.** `getContentPaths()` (`node_modules/astro/dist/content/utils.js:520-537`) looks for `src/content.config.*`, falls back to `src/content/config.*`, and throws `AstroError(LegacyContentConfigError)` when it finds the latter with `legacy.collectionsBackwardsCompat` off (the default). Note `type: 'content'` still *type-checks*, so `tsc` won't warn — only running Astro will.
    - Move `src/content/config.ts` → `src/content.config.ts`.
    - Rewrite to the loader API (`glob()` from `astro/loaders` takes `{ pattern, base?, generateId?, retainBody?, deferRender? }`):
      `defineCollection({ loader: glob({ pattern: '**/*.mdx', base: './src/content/pages' }), schema: z.object({ title: z.string() }) })`
    - Update the three consumers — `src/pages/about.astro:4,10-11`, `src/pages/ai.astro`, `src/pages/help/notation-formats.astro`. Each does `const entry = await getEntry('pages','about'); const { Content } = await entry.render();` → change to `import { getEntry, render } from 'astro:content'` and `const { Content } = await render(entry);`.
    - **Entry IDs are preserved** — `generateIdDefault()` in `dist/content/loaders/glob.js` strips the extension and slugifies path segments, so `about.mdx` → id `about` and existing `getEntry('pages','about')` calls keep working, provided no custom `generateId` is passed. Still spot-check at runtime: `getEntry` returns `undefined` on a miss and these pages destructure immediately, so a mismatch surfaces as an unhelpful `TypeError`.
    - **Do not reach for `legacy: { collectionsBackwardsCompat: true }`.** It would unblock the rest of the bump, but it defers the migration behind a flag Astro documents as temporary, and an agent silently opting into it hides the fact that the migration failed. If the Content Layer migration does not work, bail out and report.
  - Content files (`src/content/pages/{about,ai,notation-formats}.mdx`) need no changes — plain frontmatter plus Markdown with raw HTML/SVG, no component imports.
  - `astro.config.mjs` otherwise uses only stable keys (`output: 'server'`, `adapter: netlify()`, `integrations: [mdx()]`, `markdown.shikiConfig.themes`, `build.format: 'file'`, `vite.envPrefix`, `devToolbar`, `server.port`) — confirm each still validates. Astro 7 also pulls **zod 4**; the schema here is unaffected, but the major changed underneath.
  - Not applicable (confirmed absent): middleware, `src/pages/api/` endpoints, `getStaticPaths`, `Astro.glob`, `Astro.cookies`/`locals`, `astro:env`.
  - **Verify:** `tsc --noEmit` and `astro check` separately, then `npm test` and `npm run build`. chrome-devtools-mcp over `/`, `/about`, `/ai`, `/help/notation-formats`, `/score/test`, `/score/test/edit` in light and dark — the three MDX pages are the content-collection canaries.
  - **Bail out if:** the Netlify adapter build fails beyond a config rename — downgrade the group; SSR deploy is the platform's critical path.

- [ ] [A:High] Upgrade TypeScript to 6
  - Bump `typescript` 5.9.3 → 6.0.3 and `@astrojs/check` 0.9.6 → 0.9.10 (mandatory companion — 0.9.6 peers `typescript: ^5.0.0` and would block the install; 0.9.10 peers `^5.0.0 || ^6.0.0`).
  - **TS 7.0.2 is deliberately not attempted** — `@astrojs/check` caps at `^6.0.0` and typescript-eslint at `<6.1.0`. Forcing it with overrides risks `astro check` silently misreporting rather than failing loudly, and `type-check` is a required gate. Tracked separately below.
  - Do this last: TypeScript underpins `tsc`, `astro check`, and typescript-eslint's parser simultaneously, so a regression is only unambiguous once everything else is green.
  - `tsconfig.json` likely untouched (`target: ES2020`, `moduleResolution: "bundler"`, `strict`, `noUnused*` are stable), but watch for checks newly folded into `strict`. Source fixes are compiler-driven and can't be enumerated ahead of time.
  - **Verify the three consumers separately — they fail differently:** `npx tsc --noEmit` alone; `npx astro check` alone (most likely to fail obscurely since it wraps its own language service — confirm a real file count, not a suspicious clean zero); `npm run lint` (typescript-eslint's parser is an independent TS consumer).
  - **Bail out if:** `astro check` can't run correctly — stop, do not reach for `--legacy-peer-deps` or overrides. If `skipLibCheck: true` stops suppressing third-party `.d.ts` errors (`@supabase/supabase-js`, `tweakpane`), that's a compiler regression, not something to patch around.

- [ ] [A:Medium] Upgrade TypeScript to 7.x
  - **Blocked** on `@astrojs/check` (peers `^5.0.0 || ^6.0.0`) and typescript-eslint (peers `>=4.8.4 <6.1.0`). Recheck both peer ranges before attempting.
  - TS 7 is the native-compiler rewrite, so also verify `moduleResolution: "bundler"` parity in its release notes before committing to it.

- [ ] [A:High] Remove dead icon registrations from `initIcons()`
  - `src/utils/icons.ts:17-28` registers six icons with `createIcons()`, but `createIcons` only ever replaces elements carrying a matching `data-lucide` attribute. An exhaustive scan of `src/` for `renderIcon('…')` and literal `data-lucide="…"` finds only **three** names in use: `git-fork`, `circle-help`, `alert-circle`.
  - **Dead registrations: `Eye`, `Calendar`, and `SquarePen`.** (`SquarePen` is a third case the original Lucide note did not mention — it is imported and used directly via `getIconHTML()` / the Astro component elsewhere, but has no `data-lucide="square-pen"` consumer, so its entry in the `createIcons` registry specifically is dead.)
  - Removing them only shrinks the registry object; it does not touch the direct `import { SquarePen }` usages, which are live. Verify with a visual pass that fork, help, and alert icons still render.
  - Confirmed 2026-09-20 during the Lucide v1 upgrade, which explicitly left this out of scope.

- [ ] [A:Low] Migrate remaining deprecated Lucide aliases
  - `AlertCircle` → `CircleAlert` in `src/utils/icons.ts:6,22`, plus the paired `renderIcon('alert-circle')` → `renderIcon('circle-alert')` in `src/components/ScoreEditor.ts:515`. Both sides must move together — `createIcons` derives the kebab `data-lucide` attribute from the PascalCase key.
  - Deliberately excluded from the Lucide v1 upgrade above to keep that diff to the version bump. Unlike `Trash2`, this alias is a pure rename with no glyph change, so there is no visual risk and no deadline.

### Info pages (About, Help, etc...)

- [ ] [A:Low] Review the copy to make it better and more to Christian's tone of voice, less choppy.

### Score Editor

- [ ] [A:Low] Revisit auto-save indicator placement and design
  - Current implementation: "Saved X ago" appears below description field
  - Consider alternative placements: floating badge, header area, inline with save button
  - Evaluate visual hierarchy and prominence
  - Test on mobile viewports for readability
  - Consider adding subtle animation when save completes

- [ ] [A:Medium] Test autosave feature end-to-end in the editor
  - Edit a score and wait for autosave (2s debounce) — verify "Saved X ago" indicator updates
  - Reload the page — verify draft restore prompt appears
  - Accept restore — verify content is restored correctly
  - Decline restore — verify draft is discarded and current saved version loads
  - Save the score — reload and verify no restore prompt appears (draft cleared on save)
  - Test on mobile viewport for readability of the save indicator

- [ ] [A:Low] Decompose ScoreEditor into model + view
  - `ScoreEditor.ts` is ~930 lines mixing 8+ concerns: state (instance variables), DOM generation (`innerHTML` templates), event wiring, API calls, validation, localStorage autosave, preview rendering, and CSS injection. This monolith makes adding versioning, collaboration, or format plugins require invasive surgery on a single file.
  - **Approach**: (a) `EditorState` — holds data, emits change events; (b) `EditorView` — subscribes to state, renders DOM; (c) extracted concerns already tracked above (CSS → stylesheet, validation → utility, autosave → utility). The same pattern applies to `ScoreLibrary.ts` and `ScoreDetailClient.ts` at smaller scale.
  - **Do the extractions above first** — they reduce the scope of this decomposition significantly and validate the boundaries before committing to a full split.

- [ ] [A:Low] Revisit unsaved changes indicator design
  - Current: "Unsaved changes" text appears inline in the metadata panel next to the Save button
  - Consider: prominence (is it visible enough?), mobile layout (does it wrap awkwardly?), animation on state change (subtle fade-in when changes occur, fade-out after save)

- [ ] [A:Medium] Investigate inconsistent save normalization in ScoreEditor
  - `src/components/ScoreEditor.ts:416-424` — ABC scores are converted to JSON before saving to Supabase, but MusicXML scores are saved as raw XML strings. This means the `data_format` in the DB is always `'json'` for ABC but `'musicxml'` for MusicXML. Decide if this is intentional (MusicXML fidelity) or an oversight, and document or standardize the behavior.

- [ ] [A:High] Add license selector field to score editor
  - **Depends on**: "Handle score license requirements" in Content/Data — data field must exist first
  - Add a license dropdown to the score metadata section of the editor
  - Options: All Rights Reserved, CC BY, CC BY-SA, CC BY-NC, CC BY-NC-SA, Public Domain (CC0)
  - Show a brief description of each license to help users choose appropriately
  - Store selection as SPDX identifier in score metadata
  - Default to All Rights Reserved for new scores
  - Display selected license on score detail page

- [ ] [A:Medium] Add loading spinners and error states
- [ ] [A:Medium] Polish form validation and error messages
- [ ] [A:Medium] Multiple score input formats (import from ABC, etc.)

### Auth / Account

- [ ] [A:High] Refactor AuthModal to use ConfirmDialog (DRY violation)
  - `src/components/AuthComponents.ts` and `src/components/ConfirmDialog.ts` have significant duplication
  - Both implement overlay, modal container, escape key handling, click-to-close
  - **Recommended approach**: Extend ConfirmDialog to accept custom body content
  - AuthModal uses ConfirmDialog and passes form as custom body
  - Shares all overlay/container/button logic
  - Alternative: Create shared BaseDialog component that both extend

- [ ] [A:High] Extract auth subscription boilerplate into a shared page initializer
  - `src/pages/index.astro:26-35`, `src/pages/editor.astro:21-30`, `src/pages/score/[slug].astro:90-99` — All three pages have an identical block: create `AuthWidget`, call `authState.subscribe()`, toggle `setUser()`/`clearUser()`. Extract to a function like `initPageAuth(widgetId: string)` in `src/utils/page-init.ts` and call it from each page.

- [ ] [A:High] Add unit tests for auth module
  - `src/api/auth.ts` and `src/api/authState.ts` have 0 tests. Test: `signUp`/`signIn`/`signOut` call correct Supabase methods and return expected results, `AuthStateManager.subscribe()` fires callback immediately, `isAuthenticated()` reflects current state, `onAuthStateChange` relays Supabase auth events.

### Design

- [ ] [A:Low] Review loading spinner design
  - Evaluate the `ButtonLoadingState` spinner (single pulsing dot) for size, visibility, and feel across button variants
  - Review the `buildSpinnerSVG()` full-flute spinner used on the landing page loading state
  - Check both spinners in light and dark mode, across viewports
  - Consider whether the landing page needs a text label, or if the spinner alone is sufficient

- [ ] [A:Medium] Website Typography
  - **Content pages**
    - Fix bullet points left padding
    - Adjust vertical rhythm
  - **Audit**
    - [ ] Identify all text content types across the site that need typography treatment (body copy, headings, buttons, form inputs, labels, nav items, captions, etc.)
  - **Letter spacing**
    - Research how apple.com does letter-spacing (varies based on role, font size, font family, and font weight — is there a pattern?)
    - Candidate values: buttons `-0.022em`, large headings `-0.005em`, body copy `-0.005em` (works on content pages, needs checking across rest of site)
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
  - **Cleanup**
    - [ ] Remove the dev control panel once values are finalised
  - **Notes**
    - Letter spacing should not apply to SVG-rendered score notation (already isolated)
    - Control panel only renders in dev mode (zero production impact)

- [ ] [A:Low] Update to a more colorful palette
  - **Blocked by**: awaiting designer color palettes and references
  - implement theme selection, control the theme using a tweakpane
  - explore how to implement a color theme on the site. Designer will provide references and color palettes.
  - implement 3 additional themes based on color palettes and inspiration provided by the Designer

### Shakuhachi Score Web Component

- [ ] [A:High] Remove or honour the dead `fontWeight` default on OctaveMarksModifier
  - `src/web-component/modifiers/OctaveMarksModifier.ts:30` declares `private fontWeight: number = 500`, but the value never reaches the render path: `ModifierConfigurator.configureOctaveMark()` (`src/web-component/renderer/ModifierConfigurator.ts`) unconditionally calls `.setFontWeight(options.octaveMarkFontWeight)` before every render, and `DEFAULT_RENDER_OPTIONS.octaveMarkFontWeight` is already 500.
  - **Evidence it is dead:** the committed embed bundle carried `fontWeight,400` and source carried `500`, yet the rendered SVG measured `font-weight="500"` under *both* bundles on `/score/akatombo`. PR #238 changed a value with zero rendered effect.
  - The same pattern applies to `fontSize` on the modifier (12) and `MeriKariModifier` — check whether those are dead too, since `configureMeriKariMark()` overrides both.
  - **Decide one way:** either delete the field-level defaults and require configuration, or stop overriding in the configurator when the caller did not set the option. Today's arrangement silently ignores edits to the modifier and will mislead the next person who changes one.
  - Discovered 2026-09-20 while rebuilding the stale embed bundle.

- [ ] [A:Medium] Evaluate moving format parsing into the web component / renderer package
  - `src/utils/score-data.ts` imports parsers from `src/web-component/parser/` — platform utilities reaching into the renderer's internals for format dispatch. If the web component already owns parsers (ABCParser, MusicXMLParser), it could expose a `parseScoreText(text, format)` function as part of its public API, or accept a `data-format` attribute alongside `data-score` and handle parsing internally. This would keep format knowledge inside the renderer boundary and let the platform pass raw data + format without knowing how to parse it.

- [ ] [A:High] Replace hardcoded fallback viewport 800×600 with explicit error or documented default
  - `src/renderer/ScoreRenderer.ts:207-208` — `width: rect.width || 800, height: rect.height || 600` silently substitutes default dimensions when the container has zero size (common when container is hidden or not yet in the DOM). Either throw an error ("Container has zero dimensions — ensure it is visible before rendering") or define a named constant `DEFAULT_VIEWPORT = { width: 800, height: 600 }` so the fallback is discoverable.

- [ ] [A:High] Document or name the MusicXMLParser duration mapping thresholds
  - `src/parser/MusicXMLParser.ts:80-89` — Duration mapping uses `>= 4` → whole, `>= 2` → half, else quarter. The thresholds are undocumented and lossy (a MusicXML duration of 3 maps to half note, but 3 divisions typically means dotted quarter). Add a comment block explaining the mapping decisions and known limitations, or extract to a named function `mapMusicXMLDuration(rawDuration: number): number`.

- [ ] [A:High] Name magic numbers in VerticalSystem separator drawing
  - `src/renderer/VerticalSystem.ts:160-164` — `this.y - 20`, `this.y + this.columnHeight + 20`, `'#ccc'`, `1` are unexplained. Define named constants like `SEPARATOR_EXTENSION = 20`, `SEPARATOR_COLOR = '#ccc'`, `SEPARATOR_WIDTH = 1`, or better yet, derive from `RenderOptions`.

- [ ] [A:High] Name magic number for rest vertical centering in ShakuNote
  - `src/notes/ShakuNote.ts:144` — `this.y - this.fontSize * 0.4` uses an unexplained `0.4` multiplier to position the rest circle relative to the note baseline. Extract to a named constant like `const JAPANESE_CHAR_VERTICAL_CENTER_RATIO = 0.4` with a comment explaining that Japanese characters are typically centered around 40% above the baseline.

- [ ] [A:High] Name magic number for duration line baseline ratio
  - `src/modifiers/DurationLineModifier.ts:58` — `-NOTE.fontSize * 0.25` uses a bare `0.25` to calculate the vertical middle of a note character. Define `const NOTE_VERTICAL_MIDDLE_RATIO = 0.25` and reference it, matching the comment already present ("approximately 25% above the baseline").

- [ ] [A:High] Remove `undefined as any` hack from DEFAULT_RENDER_OPTIONS
  - `src/renderer/RenderOptions.ts:256-257` — `width: undefined as any, height: undefined as any` is used to make these fields exist in the defaults object while keeping them "optional". Instead, separate the type: define `ViewportOptions = { width?: number; height?: number }` and merge it separately, avoiding the `any` cast that breaks `Required<RenderOptions>` semantics.

- [ ] [A:High] Move MusicXMLParser out of ScoreRenderer
  - `src/renderer/ScoreRenderer.ts` imports `MusicXMLParser` for the `renderFromURL()` method. The renderer's job is to render `ScoreData`, not to fetch and parse XML files. Move `renderFromURL()` to the convenience functions module (`src/renderer/convenience.ts`) where it already lives as `renderScoreFromURL()`. This makes `ScoreRenderer` depend only on `ScoreData`, not on parsing.

- [ ] [A:High] Remove TestModifier from public API exports [Claude validated]
  - `src/index.ts:50` — `TestModifier` is a testing utility, not a library feature. Exporting it as part of the public API makes it contractual — consumers may depend on it, preventing removal. Remove the export from `index.ts`. Test files can import directly from the source path.

- [ ] [A:High] Move toJSON/convertToJSON off MusicXMLParser
  - `src/parser/MusicXMLParser.ts:153-166` — `toJSON()` and `convertToJSON()` are serialization methods on a parser class. A parser's job is to parse input into a structure; serializing a structure back to a string is a separate concern. Move these to a `ScoreSerializer` utility or simply use `JSON.stringify()` directly at call sites.

- [ ] [A:High] Extract repeated error wrapping pattern in scores.ts
  - `src/api/scores.ts` — Six functions (`createScore`, `getUserScores`, `getScoreBySlug`, `updateScore`, `deleteScore`, `forkScore`) all share the same try/catch + `{ score: null, error: ... }` wrapping pattern. Each catch block has identical `error instanceof Error ? error : new Error('Unknown error ...')` logic. Extract a helper like `wrapScoreResult<T>(fn: () => Promise<T>): Promise<ScoreResult<T>>` to eliminate the repetition and ensure consistent error handling across all CRUD operations.

- [ ] [A:High] ScoreRenderer.renderDebugLabel(): replace silent null check with assertion
  - `src/renderer/ScoreRenderer.ts:154` — `if (!this.renderer) return;` silently skips rendering. After construction, `this.renderer` should always exist when `renderDebugLabel` is called (it's only called inside `renderNotes` which creates the renderer). Replace with a dev assertion or remove the guard since the invariant is guaranteed by the calling code.

- [ ] [A:High] Add unit tests for SVGRenderer group management
  - `src/renderer/SVGRenderer.ts` has 0 tests. The `openGroup()`/`closeGroup()` pair manages a group stack that determines SVG nesting. Test: open then close produces correct hierarchy, nested groups work, closeGroup with no open groups throws, multiple groups at same level work.

- [ ] [A:High] Add unit tests for modifier rendering logic
  - `src/modifiers/` has 6 modifier classes (`OctaveMarksModifier`, `MeriKariModifier`, `DurationDotModifier`, `DurationLineModifier`, `AtariModifier`, `Modifier` base) with 0 unit tests. Each modifier has offset calculations, font configuration setters, and render methods that position SVG elements relative to the parent note. Test that: setters update internal state, `getPosition()` returns correct offsets, and `render()` calls the expected SVGRenderer methods (using a mock/spy).

- [x] [A:High] Verify mock was called in convenience.test.ts
  - `src/renderer/convenience.test.ts:11-23` — Mocks `MusicXMLParser.parseFromURL` but never asserts it was called. Add `expect(MusicXMLParser.parseFromURL).toHaveBeenCalledWith(url)` after `renderScoreFromURL()` to verify the integration actually uses the parser.

- [ ] [A:High] Replace meri/chu_meri/dai_meri boolean flags with a discriminated union
  - `src/types/ScoreData.ts:45-52` — Three optional booleans (`meri`, `chu_meri`, `dai_meri`) allow invalid states: all three can be true simultaneously, which has no musical meaning. Replace with a single field `meriType?: 'meri' | 'chu_meri' | 'dai_meri'` that makes illegal states unrepresentable. This requires updating `ScoreParser`, `MusicXMLParser`, `KINKO_PITCH_MAP`, and all tests that reference these fields. Also fixes the naming inconsistency: `chu_meri` uses snake_case while the rest of the interface uses camelCase.

- [ ] [A:High] Type the `data` field in Score/CreateScoreData/UpdateScoreData instead of `any`
  - `src/api/scores.ts:15,27,36` — The `data` field is typed `any` on three interfaces. This disables type checking for the most important field in the system (the actual score content). Define `data: ScoreData | string` (JSON ScoreData for `data_format: 'json'`, MusicXML string for `data_format: 'musicxml'`) or at minimum `data: unknown` to force explicit checks at usage sites.

- [ ] [A:High] Decouple ColumnLayoutCalculator from DurationDotModifier [Claude validated]
  - `src/web-component/renderer/ColumnLayoutCalculator.ts:11` — The layout calculator imports `DurationDotModifier` to check `instanceof` at lines 190, 307 when determining whether a note needs extra vertical spacing. This couples layout logic to a specific modifier type. Instead, add a method to `ShakuNote` like `needsExtraSpacing(): boolean` that checks its own modifiers, so the layout calculator only depends on the note interface.

- [ ] [A:Medium] Evaluate whether Formatter and VerticalSystem should be public API [Claude validated]
  - `src/index.ts:31-34` — `Formatter` and `VerticalSystem` are exported but appear to be alternative/experimental layout components not used by the main `ScoreRenderer` pipeline (which uses `ColumnLayoutCalculator`). If they are internal or experimental, remove from `index.ts` to reduce the public API surface. If they are intentionally public, add JSDoc explaining their purpose and relationship to `ColumnLayoutCalculator`.

- [ ] [A:High] Add options validation with warnings
  - [ ] Validate `notesPerColumn >= 1`
  - [ ] Validate `columnSpacing >= 0`
  - [ ] Validate font sizes in reasonable range (1-200)
  - [ ] Log warnings for invalid values, use defaults
  - **Rationale**: Prevent silent failures and broken rendering states

- [ ] [A:High] Add typed error classes
  - [ ] Create `RendererError` base class
  - [ ] Add `ParseError` for MusicXML parsing failures
  - [ ] Add `NetworkError` for fetch failures
  - [ ] Add `ValidationError` for invalid options
  - **Rationale**: Better error handling and debugging in user applications

- [ ] [A:Medium] Clean up public API surface
  - [ ] Audit all exports in `src/index.ts` (currently 55+ exports)
  - [ ] Keep only high-level API: `ScoreRenderer`, `renderScoreFromURL`, `renderScore`, `RenderOptions`
  - [ ] Move advanced APIs to separate import path: `shakuhachi-ro/advanced`
  - **Note**: Removal of `TestModifier` and evaluation of `Formatter`/`VerticalSystem` are tracked as separate tasks — do those first
  - **Rationale**: Clearer API boundaries, signals stability

- [ ] [A:High] Fix async API consistency
  - [ ] Make `renderFromScoreData()` synchronous (no async work happening)
  - [ ] Keep `renderFromURL()` async (actually fetches data)
  - [ ] Add deprecation warning for old async signature
  - [ ] Update all call sites
  - **Rationale**: Better performance, more predictable API

- [ ] [A:Medium] Extract a RenderingBackend interface from SVGRenderer
  - `SVGRenderer` is imported as a concrete type in 13 files (all 6 modifiers, ShakuNote, ScoreRenderer, VerticalSystem, ModifierConfigurator, and more). The draw primitives (`drawText`, `drawCircle`, `drawLine`, `drawPath`, `drawRect`, `openGroup`, `closeGroup`, `resize`, `clear`) are already abstract in practice — only the type references are concrete. Define a `RenderingBackend` interface with these methods, have `SVGRenderer` implement it, and change all consumers to depend on the interface. This is a mechanical type-level change with zero runtime cost. It unlocks Canvas/WebGL backends and enables mock renderers for unit testing modifiers and notes without a DOM.
  - **Validate first**: Read every file that imports `SVGRenderer`, confirm none use SVG-specific APIs beyond the draw primitives (exception: `VerticalSystem` uses `setAttribute('transform', ...)` on SVG group elements — plan how to abstract this). Map every method signature that needs to change.

- [ ] [A:Medium] Introduce a Parser interface and registry
  - There is no formal `Parser` interface. `MusicXMLParser` is a concrete static class imported by name in `ScoreDetailClient` (line 83), `ScoreRenderer` (line 64), and `convenience.ts`. Format dispatch (`if format === 'musicxml' ... else if format === 'json'`) is scattered across 3 components. Define a `Parser` interface (`parse(content: string): ScoreData`), create a `ParserRegistry` keyed by `ScoreDataFormat`, and replace scattered conditionals with `ParserRegistry.get(format).parse(content)`. Adding a new format (e.g., ABC notation) then becomes one new file + one registry entry instead of touching 6 files.
  - **Validate first**: Read all files that reference `MusicXMLParser` or check `data_format`. Map every call site. Confirm that `ScoreParser` (which converts `ScoreData` → `ShakuNote[]`) is a separate concern and should NOT be part of this interface. Verify `ScoreDataFormat` type location (`api/scores.ts:5`) and whether it belongs in `types/`.

- [ ] [A:Medium] Test geometricPrecision on shakuhachi SVG notes
- [ ] [A:Low] Evaluate whether to migrate the web component to Lit or a similar framework
  - Current implementation is vanilla custom elements. Would Lit reduce boilerplate and maintenance overhead?
  - Assess bundle size impact, migration cost, and long-term maintainability tradeoffs
- [ ] [A:High] Add JSDoc comments to public APIs
- [ ] [A:Medium] Write usage guide in reference/README.md

- [ ] [A:Medium] YuriModifier (vibrato)
- [ ] [A:Medium] MuraikiModifier (breathy tone)
- [ ] [A:Medium] SuriModifier (sliding)
- [ ] [A:Medium] OriModifier (pitch bend)

### Content / Data

- [ ] [A:Medium] Handle score license requirements
  - Audit license types likely encountered: public domain, CC BY, CC BY-SA, CC BY-NC, CC BY-NC-SA, all-rights-reserved
  - Implement license metadata field on scores (store SPDX identifier or license name + URL)
  - Display license badge/notice on score detail page (required by CC licenses)
  - For CC BY: show author name with link to original source
  - For CC BY-SA: show license notice and link; any derivative works must use same license
  - For CC BY-NC: show non-commercial restriction notice
  - Ensure user-created scores can also declare a license
  - Block or warn on import of all-rights-reserved content without explicit permission

- [ ] [A:Low] Revisit attribution modules design and placement
  - Review how attribution (composer, source, license) is currently stored and displayed
  - Evaluate whether attribution belongs in score metadata, a separate DB field, or a dedicated module
  - Consider display placement: score detail page, score card in library, score header, footer
  - Ensure design scales to support imported scores (IMSLP, shin-itchiro) with varied attribution requirements
  - Align with any licensing obligations (e.g., CC license notices must be visible)

- [ ] [A:High] Research and identify shakuhachi score sources
  - Survey publicly available shakuhachi score repositories (websites, archives, blogs, academic sources)
  - Identify sources with digital scores in machine-readable formats (MusicXML, ABC, MIDI, PDF)
  - Note each source's language, format, scope (honkyoku, minyo, Western adaptations, etc.)
  - Assess volume and quality of available scores per source
  - Document findings to guide prioritization of scraping/import tasks

- [ ] [A:Medium] Scrape scores from https://imslp.org/wiki/
  - Investigate IMSLP's API or data availability for shakuhachi-relevant scores
  - Determine licensing compatibility (IMSLP uses various Creative Commons and public domain licenses — verify per score)
  - Build or adapt a scraper to extract score data and metadata
  - Convert extracted data to the platform's JSON/MusicXML format
  - Import scores with correct attribution and license metadata

- [ ] [A:Medium] Scrape scores from https://shin-itchiro.seesaa.net/
  - Investigate available score data format and structure on the site
  - Determine licensing/permission before importing any content
  - Build or adapt a scraper to extract shakuhachi score data
  - Convert extracted data to the platform's JSON/MusicXML format
  - Import scores into the platform with correct metadata (title, attribution)

### QA

- [ ] [A:High] Test across browsers (Chrome, Firefox, Safari)

### Architecture

- [ ] [A:Medium] Investigate standardizing page padding to always use `main` instead of per-container overrides on fullHeight pages

- [ ] [A:Medium] Investigate `strings.js` bundle size — 49 KB gzipped, loaded on every page
  - `src/constants/strings.ts` compiles to a 181 KB (49 KB gzip) chunk that is shared across all pages. This is the single largest client-side chunk and dwarfs everything else (the next largest page-specific chunk is 5 KB gzip).
  - **Research questions:** What's in it? Is it mostly string literals, or are there large objects/structures? Are all strings needed on every page, or could strings be split per-page or per-feature (editor strings, detail page strings, etc.)? Would tree-shaking help if strings were exported individually instead of as one nested object?
  - **Context:** Discovered during bundle analysis on 2026-05-09. The chunk is `strings.A97qwdJE.js` in the Vite build output.

- [ ] [A:Medium] Fix pointless dynamic import of supabase.ts in slug.ts
  - Vite warns: `supabase.ts is dynamically imported by slug.ts but also statically imported by auth.ts, scores.ts — dynamic import will not move module into another chunk.`
  - `src/utils/slug.ts` dynamically imports `src/api/supabase.ts`, but `auth.ts` and `scores.ts` already import it statically. Since static imports win, the dynamic import adds async complexity for zero benefit. Convert to a static import.
  - **Context:** Discovered during bundle analysis on 2026-05-09.
  - **Goal**: Determine if all pages can get spacing from `main { padding: var(--spacing-medium) }` without each page's container needing its own padding.
  - **⚠️ Note**: Research below was done on 2026-03-22 — re-validate against current code before implementing, as the codebase may have changed.
  - **Current architecture (researched 2026-03-16, confirmed 2026-03-22):**
    - Regular pages (`fullHeight=false`): spacing comes from `main { padding: var(--spacing-medium) }` in Layout.astro — no container padding needed.
    - fullHeight pages (`fullHeight=true`): `body.full-height main { padding: 0; overflow: hidden; flex: 1 }` overrides via higher specificity, so each container sets its own padding:
      - `/score/:slug` → `.score-detail-container { padding: var(--spacing-medium) var(--spacing-medium) 0 }`
      - `/score/:slug/edit` → `.edit-layout { padding: var(--spacing-medium) }`
    - Layout.astro also has a `noPadding` prop (adds `main.no-padding { padding: 0 }`) — a separate escape hatch, not a solution to this issue.
  - **Analysis (2026-03-22):**
    - **Score detail page**: Consolidation looks feasible. `.score-detail-container` uses `flex: 1` and the renderer inside uses `flex: 1; min-height: 0`. If padding moved to `main`, the container could drop its own padding and still fill correctly via flex.
    - **Edit page**: Real blocker. `.edit-layout` uses a hardcoded `height: calc(100vh - 80px)`. If `main` has padding, the layout overflows the padded space — the calc doesn't account for it. Fix would require either changing the calc to `calc(100vh - 80px - 2 * var(--spacing-medium))` (tight coupling) or replacing the hardcoded height with `flex: 1; min-height: 0` on the container (cleaner, but more involved change).
  - **Approach**:
    - Re-validate the code before starting — confirm the above still reflects reality
    - Try adding `padding: var(--spacing-medium)` back to `body.full-height main` and removing container-level padding from score detail and edit pages
    - For the edit page: replace `height: calc(100vh - 80px)` with `flex: 1; min-height: 0` to decouple from header height and make padding on `main` safe
    - Verify that score detail layout still fills viewport correctly
    - Test mobile viewports (the media query at 768px reverts fullHeight to natural scrolling — padding may behave differently there)
    - If it works: remove per-container padding and the `body.full-height main { padding: 0 }` override
    - If it breaks height calculations: document why the override is required and add a code comment explaining the constraint

### Tooling / Guidelines

- [x] [A:High] Fix visual regression flakiness at the configured `workers: 3`
  - **Root cause was not load.** `auth-setup.ts` saved the storage state after a blind `waitForTimeout(500)` and asserted nothing about whether login had succeeded. Under `workers: 3` the Supabase token had frequently not reached `localStorage` yet, so an **empty** session was written to `tests/visual/.auth/user.json`. All 17 `score-editor` tests then ran unauthenticated, hit the editor's client-side redirect, and timed out at 30s each — which looked like a load problem. Confirmed by reading the saved state: 0 cookies, 0 origins at `workers: 3`; a 2263-byte `sb-*-auth-token` when setup ran alone.
  - Fixed by waiting for the enabled account avatar (the modal hides on submit regardless of outcome) and asserting a Supabase token is present before proceeding, plus the `waitForEditor` redirect diagnosis. Verified with 3 consecutive 60/60 runs at `workers: 3`.

- [ ] [A:Medium] CLAUDE.md documents the `/score/test` fixture incorrectly
  - CLAUDE.md states the fixture is *"A test score titled 'Test' … Contains simple JSON data with 3 notes (ro, tsu, re)"*. The slug is right but the title is actually **"A Very Long Score Title That Will Definitely Wrap Across Multiple Lines on Mobile"** (verified 2026-09-21 against the running dev server).
  - Low stakes on its own, but it cost real time during the flakiness investigation: a page snapshot showing that title looked like the test had landed on the *wrong score* rather than on the right score's view page after a redirect.
  - Confirm what the fixture should be — the long title looks deliberate, for mobile wrapping — then correct the description rather than renaming the score.

- [ ] [A:Medium] Supabase session lives in `localStorage`, contradicting the documented auth policy
  - CLAUDE.md's auth verification checklist requires *"No auth tokens in localStorage (tokens belong in httpOnly cookies only)"*. In practice a logged-in browser holds `sb-<project-ref>-auth-token` (~2.3 kB) in `localStorage` and **zero** auth cookies — observed 2026-09-21 in the Playwright storage state captured by `tests/visual/auth-setup.ts`.
  - This is the default `supabase-js` browser behaviour, so it is very likely that the checklist states an intent that was never implemented rather than a regression. Worth confirming against git history before treating it as a bug.
  - **Decide which is true, then make them agree.** Either move the session to httpOnly cookies (`@supabase/ssr` with a cookie storage adapter) and keep the checklist, or amend the checklist to describe what the app actually does and record why. Leaving the two in conflict means the checklist cannot be used as a review gate.
  - Note that `tests/visual/auth-setup.ts` now asserts on the `localStorage` token, so moving to cookies must update that assertion too.
  - Found 2026-09-21 while fixing the visual suite flakiness.

- [ ] [A:Medium] Speed up the visual regression suite
  - **Every lever below is an untested hypothesis.** They are reasoned from `playwright.config.ts`, not measured. Measure each one in isolation before adopting it, and keep the measurement in the PR body — a change that does not demonstrably pay for itself should be dropped rather than kept on plausibility.
  - **Measured baseline (2026-09-20):** full suite = 60 tests in **1.3 min** at `--workers=2`; most individual tests 2–3s; editor tests ~3s. Re-measure before starting, on an otherwise idle machine, and take the median of 3 runs — the numbers above were taken with other processes running.
  - **Hypothesis 1 — video recording costs time on passing tests.** `video: 'retain-on-failure'` (config line 49) records all 60 runs and discards the passing ones; `trace: 'retain-on-failure'` (line 52) likewise. On a ~95%-passing suite this may be significant overhead. *Test:* run the suite with `video: 'off'`, then with `trace: 'off'`, then both, comparing against baseline. *If confirmed:* disable locally, keep enabled in CI (`process.env.CI`) where the artifacts are the only debugging channel.
  - **Hypothesis 2 — the Astro dev server dominates per-navigation time.** `webServer.command` is `npm run dev` (line 101), so every page load is on-demand SSR with Vite transforms in the request path. *Test:* point `webServer` at `astro build` + preview and compare. *Tradeoffs to weigh, not assume:* adds a build step (bad for single-test iteration, fine for full runs), and changes what is under test — arguably for the better, since it exercises the production output. **Check whether baselines shift**; if they do, that is itself a finding worth reporting, not something to silently re-baseline.
  - **Hypothesis 3 — redundant coverage.** Toast (18 tests) is already tracked separately above; `web-component-columns` (9 tests) looks similarly heavy. *Test:* for each test, identify whether it captures a visual state no other test covers. Pruning is the only lever here that reduces maintenance burden as well as runtime.
  - **Hypothesis 4 — more workers.** The config sets `workers: 3`. **Do the `waitForEditor` fix above first** — raising parallelism today buys minutes at the cost of false auth failures. *Test:* after that fix, sweep 2/3/4/6 workers and find where wall time stops improving or flakiness returns.
  - **Temper expectations:** at 2–3s per test the ceiling looks modest — plausibly 1.3 min → ~40s, not an order of magnitude. That estimate is itself unverified. If measurement shows the ceiling is lower still, closing this task with "not worth it, here are the numbers" is a good outcome.

- [ ] [A:Medium] Exclude generated Playwright artifacts from `astro check`
  - `npm run type-check` walks `tests/visual/reports/` and type-checks the HTML reporter's bundled trace viewer (minified React and other vendor JS), producing ~5.3 MB of diagnostic output for a single run.
  - **Measured 2026-09-20 — every hint comes from these generated files.** With the directories present: `Result (115 files): 0 errors, 0 warnings, 87 hints`. After deleting `tests/visual/reports/` and `tests/visual/test-results/`: `Result (110 files): 0 errors, 0 warnings, 0 hints`. So the long-standing "87 hints" baseline recorded elsewhere in this file is an artifact of whether a visual run happened recently — it is not a property of the source, and it fluctuates run to run.
  - **Why it matters:** the signal-to-noise ratio makes the required `npm test` gate effectively unreadable, and a real error can scroll past unnoticed. There is prior history of a lint failure going unnoticed in long test output.
  - Add the reports directory (and `tests/visual/test-results/`) to `tsconfig.json` `exclude`, or point the HTML reporter somewhere already excluded. Both directories are gitignored, so nothing is lost.

- [ ] [A:High] Review and prune toast visual regression tests
  - `tests/visual/toast.spec.ts` has 18 tests across Desktop / Mobile / Tablet but many appear to capture the same visual output (e.g. individual variant tests at desktop repeat what the "all variants" grid already covers)
  - Review each test: does it cover a genuinely distinct visual state, or is it redundant with another test in the suite?
  - Goal: keep tests that catch real regressions; remove duplicates that just inflate baseline count and maintenance burden
  - Also evaluate whether Desktop + Mobile + Tablet all-variants tests are all necessary, or whether one representative viewport per theme is sufficient

### Score Detail / View

- [ ] [A:Low] Move attribution data from footer to top of page
  - Needs ux design

### Future

- [ ] [A:Low] Collections (curated score groups)
- [ ] [A:Low] Add slug editing to the score editor
  - Slugs are currently immutable after creation (intentional — preserves stable URLs for bookmarks and shared links)
  - Allow score owners to manually edit the slug from the editor, with a clear warning that changing it will break existing links
  - Enforce uniqueness validation on save
- [ ] [A:Low] Comments/discussions on scores
- [ ] [A:Medium] Export/download scores as files
- [ ] [A:Low] Western staff intermixing
- [ ] [A:Medium] Custom font support for traditional glyphs
- [ ] [A:Medium] Score transposition tool
- [ ] [A:Low] OCR tool (scan physical scores to MusicXML/JSON)
- [ ] [A:Low] Pull request workflow (suggest changes to others' scores)
- [ ] [A:Low] MIDI playback mapping
- [ ] [A:Medium] Page-turn navigation for long scores (when score exceeds viewport height, allow keyboard/UI controls so players can advance through the score while performing)
- [ ] [A:Low] Private scores (unlisted or private visibility)
- [ ] [A:Low] Version history (track edits over time)
- [ ] [A:Low] Visual score editor (point-and-click note entry)
- [ ] [A:High] Centered duration line style (line passes horizontally through middle of note, alternative to current right-aligned style)
- [ ] [A:Low] Revisit column breaking with TeX-inspired badness algorithm
  - [ ] Implement badness metric for column height variance
  - [ ] Add demerits for orphans (single notes in columns)
  - [ ] Add penalties for breaking at certain notation points
  - [ ] Implement global optimization across score (Knuth-Plass approach)
- [ ] [A:Medium] Print optimization (CSS for clean printouts)
