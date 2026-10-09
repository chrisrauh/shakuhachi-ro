# Web Platform Architecture

**Scope:** This document covers the web platform (shakuhachi.ro). For renderer library architecture, see [ARCHITECTURE-RENDERER.MD](./ARCHITECTURE-RENDERER.MD).

## Overview

Shakuhachi.ro is a web platform for sharing shakuhachi scores. Musicians can browse, create, edit, and share scores via links.

**Stack:**

- Astro (SSR mode) with Netlify adapter
- Supabase (authentication, database, storage)
- Embedded renderer library (see ARCHITECTURE-RENDERER.MD)
- Vanilla TypeScript for client-side interactivity

**How it works:** Score pages server-fetch data from Supabase and embed JSON in HTML, then sit in Netlify's edge cache until the score changes. The browse page is statically prerendered; the client fetches scores on load. Interactive features use vanilla TypeScript components.

## Key Pages

### Browse Page (`/`)

Statically prerendered (`export const prerender = true`). Empty shell page; client fetches scores on load. `ScoreLibrary` handles fetch, filter, and search entirely client-side. Requires JavaScript to display scores.

### Score Detail Page (`/score/[slug]`)

SSR with embedded renderer. Server fetches score by slug, embeds JSON. Client initializes renderer, handles fork/delete actions.

**Rendering strategy:** All score pages render on-demand (SSR). Static prerendering was ruled out because score owners can edit at any time and edits must be immediately visible.

**Edge caching:** SSR alone was slow — the functions run in N. Virginia and the database is in Paris, so each render crossed the Atlantic three times (~630 ms warm, 2.5 s cold; see #385). Score pages now carry `Netlify-CDN-Cache-Control` and a `Netlify-Cache-Tag` of `score-<slug>`, so repeat views are served from the nearest edge node and cross nothing. Edits stay immediately visible because every write purges that tag through `/api/purge-score`; `max-age` is only the backstop if a purge is missed. Slugs are immutable (`src/api/scores.ts`), so a tag identifies the same page for the life of the score.

**Cache safety — do not break this:** a cached page is shared by every viewer, so the server-rendered HTML must not depend on who is asking. Today it does not: the SSR Supabase client has no session (auth lives in `localStorage`), the RLS read policy on `scores` is `using (true)`, and every user-specific element — owner buttons, avatar initials — is emitted in a generic state and filled in client-side. **Adding private or unlisted scores, or making the page read cookies or an `Authorization` header, would leak one viewer's page to another** unless the cache key changes with it. `src/pages/score/_score-page-is-viewer-independent.test.ts` fails if the page or any `.astro` component it renders reads the request (cookies, headers, locals, query string), or if middleware is added. It checks the source, so owner-only data fetched some other way still needs review.

**Components:** `ScoreDetailClient.ts` (fork, delete), `<shakuhachi-score>` web component (notation rendering)

**Fork flow:** User clicks "Fork" → `forkScore()` API call → new score created → redirect to `/score/[slug]/edit`

### Score Edit Page (`/score/[slug]/edit`)

Edit-only. Returns 404 for missing scores — score creation goes through `startNewScore()` which calls the API and redirects here (see Data Flow). The page fills the viewport on every screen size (`fullHeightOnMobile`): a toolbar (Details, Source, save status, Save) and a status line over the score, rendered in one column, which scrolls inside the page. A cursor between notes or a highlighted note is drawn over the score, moved by taps and the arrow keys; the page places them from where the renderer reports drawing each note (`getNoteBoxes()`). The source view replaces the score and holds the notation as stored — ABC, JSON or MusicXML — with automatic conversion when switching formats; an unreadable source keeps the last readable render. Title, composer, description and licence live in the details dialog. The slug is fixed at creation and a title change does not move it, so shared links keep working. Per-slug localStorage autosave. Save writes to Supabase and stays on the page. The visual editor (#437) is being built on this page in parts.

**Components** (`src/components/score-editor/`): `ScoreEditor.ts` (controller: state, render, save), `SourceView.ts` (source text and format), `DetailsDialog.astro` / `DetailsDialog.ts` (metadata and licence), `PalettePanel.astro` / `PalettePanel.ts` (the palette keys, and ⇄ moving them to either side; the keys' contents are in `palette.ts`), `SelectionView.ts` (the cursor, highlight and status line, and the taps and keys that move them; the rules are plain functions in `selection.ts`), `<shakuhachi-score columns="1">` (the score)

## Header Architecture

Header concerns are split across three layers:

- **`Layout.astro`** owns the document shell only (doctype, `<head>`, body wrapper). It contains no header logic and delegates to `SiteHeader.astro`.
- **`SiteHeader.astro`** contains the header HTML and CSS. Its `<script>` tag calls `initHeader()` once on page load. Accepts a `mobileMenuType` prop (`'standard'` | `'score-edit'`) which is written to a `data-menu-type` attribute on the mobile menu element.
- **`src/utils/init-header.ts`** — `initHeader()` wires up all header interactivity: ThemeSwitcher, AuthModal, AuthWidget, MobileMenu, and the desktop create button.

**Mobile menu dispatch:** `MobileMenu` reads `data-menu-type` and dispatches to a `MENU_BUILDERS` map to determine which items to render. `mobileMenuType='score-edit'` adds owner-conditional Edit and Delete items to the mobile menu.

**PageHeader.astro** is a separate page-level component for rendering a page title and metadata slot. It is not part of the site header.

## Data Flow

**Score creation:**

```
"Create" UI action → startNewScore(authModal) → auth check (prompts login if needed)
  → createEmptyScore() → Supabase creates score with random slug
  → redirect to /score/[slug]/edit
User edits details + notation → score re-renders → autosave to localStorage → save to Supabase
  → POST /api/purge-score → the score's cached page is dropped
```

**Fork:**

```
Fork existing score → forkScore() API call → copy data to new score
  → POST /api/purge-score for the PARENT (its page shows a fork count that just changed)
  → /score/[slug]/edit
```

**Delete:**

```
If a fork: POST /api/purge-score for the PARENT first (only a fork's owner may purge it)
  → deleteScore() → POST /api/purge-score → the cached page cannot outlive the row → /
```

**Viewing:**

```
GET /score/akatombo → edge cache hit → HTML served without touching the server
                    → on a miss: server fetches by slug → embeds JSON → client renders
```

Every write purges, because a cached page is otherwise correct only until its TTL
expires. A purge that fails is logged and ignored — the save has already happened, and
`max-age` bounds the staleness.

## Notation Formats

Three formats with full bidirectional conversion:

| Format   | `data_format` | Notes                                                          |
| -------- | ------------- | -------------------------------------------------------------- |
| ABC      | `'abc'`       | Text-based, human-readable, folk/traditional music communities |
| JSON     | `'json'`      | Native ScoreData format, used internally by renderer           |
| MusicXML | `'musicxml'`  | Industry standard, compatible with Finale, Sibelius, MuseScore |

**Conversion matrix** (all conversions use ScoreData as intermediate):

```
        ABC    JSON   MusicXML
ABC      -      ✓        ✓
JSON     ✓      -        ✓
MusicXML ✓      ✓        -
```

**Key files:**

- `src/web-component/parser/ABCParser.ts` / `ABCSerializer.ts`
- `src/web-component/parser/MusicXMLParser.ts` / `MusicXMLSerializer.ts`
- `src/utils/format-converter.ts` — orchestrates all conversions
- `src/web-component/constants/kinko-fingerings.ts` — the fingering table both MusicXML and ABC import and export read (D shakuhachi, Kinko). It lists every fingering in Koga's chart, transcribed in `reference/fingering-charts/koga-inventory.md`, with its Western note, holes and chin position, and one default fingering per pitch for import. Notes are matched by sounding pitch, so any spelling of a note imports the same way. Export names a fingering that isn't its pitch's default (`<technical><fingering>` in MusicXML, a `!ri-meri!` decoration in ABC), and import prefers that name, so every listed fingering reads back exactly. A fingering the table doesn't list exports at an estimated pitch, with its name; the offsets used for marks are part of the file format, so never change them. Importing a note outside the table fails rather than changing the note. The table is under review in #423; change it here only.
- `src/web-component/constants/abc-pitch-map.ts` — ABC pitch spelling ↔ Western note

**Editor UX:** Switching formats triggers automatic conversion. On failure, user is prompted to clear content or cancel.

## Authentication

**Provider:** Supabase Auth (email/password, session management)

**Session storage:** the session is a JS-readable `sb-*-auth-token` in `localStorage`
(supabase-js default). Auth is client-side: the browser talks to Supabase directly and
RLS is the authorization boundary. See
[AUTH-SESSION-STORAGE.md](./AUTH-SESSION-STORAGE.md) for why, and for the
per-request-client constraint that server-side auth must respect.

**The one server-side exception** is `/api/purge-score`, which verifies a bearer token
to decide who may invalidate a cached page. It is not an authorization boundary for
data — it guards a cache operation, and no data flows through it. It never attaches a
session to the shared Supabase client; see AUTH-SESSION-STORAGE.md.

**Key files:**

- `src/api/auth.ts` — auth API wrapper
- `src/api/supabase.ts` — Supabase client, loaded on first use through `getSupabase()`. supabase-js is ~41 KB gzipped, the largest script on the site, so no page downloads it up front. `onAuthReady()` reads the stored session key in `localStorage` first: a visitor with no session is reported signed out without loading the client, so a signed-out reader of a score or content page never downloads it. The library page loads it to fetch scores. Never import `@supabase/supabase-js` for anything but types outside `supabase.ts`: a static import puts it back on every page
- `src/pages/api/purge-score.ts` — the only endpoint that reads an `Authorization` header
- `src/components/AuthComponents.ts` — login/signup UI (base auth components)

**AuthWidget / AuthModal decoupling:** AuthWidget accepts any object implementing `AuthModalInterface`. This decouples AuthWidget from `AuthModal`'s concrete implementation, allowing the modal to be substituted or tested independently.

## Database Schema

**Supabase tables:**

- `scores` — id, user_id, title, slug, composer, description, data_format, data, forked_from, source_url, source_description, composition_copyright_status, composition_copyright_basis, composition_copyright_source, composition_year_author_died, composition_year_published, license, created_at, updated_at
- `users` — user profiles

**Row Level Security is the authorization boundary.** The anon key is public, and the
ownership checks in `src/api/scores.ts` run client-side, so the policies in
`database/migrations/rls_policies_scores.sql` are what actually enforce access: public
read, owner-only write.

**Fork count is derived, not stored.** `Score.fork_count` comes from counting the
`forked_from` self-relation in the same query that fetches the score
(`select=*,forks:scores!forked_from(count)` in `src/api/scores.ts`). A stored column
would have to be written on the _parent_ score, which the forking user does not own —
and the owner-only update policy silently dropped exactly that write, so the old column
had drifted. Deriving it also makes deletes correct without any extra work.

**Rights are two layers, not one.** `composition_copyright_status` is a fact about the
piece; `license` (an SPDX identifier) is the terms on which this score's notation may be
reused. A public-domain composition can carry a restrictive notation licence, and the
reverse. New scores default to CC BY-NC-SA 4.0; an author who wants to allow
commercial reuse picks another licence in the editor. Forks copy both. The fork licence rules — ND and All Rights Reserved sources
cannot be forked by others, ShareAlike stays locked — are enforced by a trigger in
`database/migrations/add_licensing_to_scores.sql`, for the same reason as RLS: a check
in the browser is not a rule. The decisions behind the model are on issue #306.
The editor's licence field (#263) mirrors those rules in `licenseChoices()` in
`src/utils/license.ts`, only so it never offers a choice the trigger would reject.

**NonCommercial notation is accepted** (decided 28 Sep 2026, #308): scores may carry
an NC licence, including notation from sources that allow only non-commercial use. This
rests on shakuhachi.ro itself being non-commercial. Revisit it before adding anything
commercial, such as ads or paid features, because hosting NC material would then need
each rights holder's permission.

## Client Components

Vanilla TypeScript classes with a simple `constructor(containerId) → render() → attachEventListeners()` pattern.

**Astro components:**

- `SiteHeader.astro` — site-wide header HTML/CSS; its `<script>` calls `initHeader()`
- `PageHeader.astro` — page-level title/metadata slot component

**TypeScript components:**

- `ThemeSwitcher.ts` — light/dark mode toggle
- `AuthComponents.ts` — base auth components, including `AuthWidget` (user avatar / auth state display)
- `AuthModal.ts` — login/signup modal (extracted from AuthComponents.ts; decoupled via `AuthModalInterface`)
- `MenuDropdown.ts` — shared dropdown UI used by MobileMenu and AuthWidget avatar
- `MobileMenu.ts` — mobile navigation (type-aware via `data-menu-type`)
- `ScoreLibrary.ts` — browse page grid (fetches and renders all scores client-side)
- `ScoreDetailClient.ts` — score page interactions (fork, delete)
- `score-editor/` — the edit page: `ScoreEditor.ts`, `SourceView.ts`, `DetailsDialog.ts`, `PalettePanel.ts`, `SelectionView.ts` (edit-only, per-slug localStorage autosave)
- `Toast.ts` — toast notifications
- `ConfirmDialog.ts` — confirmation dialogs
- `LoadingSpinner.ts` — loading state
- `LetterSpacingControl.ts` — typography control

**Utilities (`src/utils/`):**

- `init-header.ts` — centralizes header initialization (ThemeSwitcher, AuthModal, AuthWidget, MobileMenu, desktop create button)
- `create-score-handler.ts` — score creation coordinator: `createEmptyScore()` (pure data, creates score in Supabase) + `startNewScore()` (auth check → create → navigate)
- `icons.ts` — `getIconHTML()` helper for lucide icons

## Renderer Integration

The platform uses the `<shakuhachi-score>` web component directly. Score JSON is embedded in HTML by the server; the component reads it via `data-score` attribute. No framework coupling — the renderer is framework-agnostic.

**Web component library (Lit):** Currently all web components are vanilla `HTMLElement`. [Lit](https://lit.dev/) (~5KB) would reduce boilerplate via reactive properties and declarative templates. Evaluate adopting Lit when scoping the **next** web component — at that point migrate both components together for consistency.

## Deployment

**Platform:** Netlify with SSR via Netlify Functions. Automatic deploys from main branch; preview deploys for PRs.

**Adapter:** `@astrojs/netlify`

**Browser support:** the two builds have different floors, and only one is chosen on
purpose (#320).

- The embed bundle (`vite.embed.config.ts`) targets Vite's default,
  `baseline-widely-available`: Chrome/Edge 111, Firefox 114, Safari/iOS 16.4.
- The site's client JavaScript is built at `esnext`. Astro sets that inside its client
  build config and does not read a user override, so Vite does no syntax lowering. The
  floor is whatever the source and dependencies happen to emit.

Measured on 27 Sep 2026: all 16 files in `dist/_astro/` pass
`npx es-check es2022 './dist/_astro/*.js' --module`, and everything ES2022 adds is
within the embed floor above. So the gap is theoretical today. Re-run that check after
dependency or Astro upgrades. It checks syntax only, not browser APIs.

Browser APIs are held to the same floor through `lib` in `tsconfig.json`, which is
`ES2023`: type-checking rejects anything newer. The score editor relies on its array
methods (`toSpliced`, `with`, `findLast`), all within the embed floor. Raise `lib`
only to what that floor covers.

**Region:** functions run in IAD (N. Virginia); the database is in Paris. Region
selection needs a paid plan, which is why score pages are edge-cached instead (#385).

**Caching:** `@netlify/functions` provides `purgeCache()`, which authenticates through
the function context — no token or env var is needed.

`/api/purge-score` calls it with a tag and no deploy scope, which clears that tag in
**every** deploy context at once, production included. Measured, not assumed: a purge
issued against a deploy preview marked production's entry stale while 163 s of its TTL
remained.

That is deliberate. Every context — production and each preview — reads one Supabase
project, so a save made on a preview is a real change to real data and production's
cached page really is stale. Scoping the purge to the calling deploy would be the bug:
production would keep serving the old page until `max-age` expired.

**The invariant: purge scope must match database scope.** If previews are ever pointed
at a separate database, this must change in the same commit. Two things break otherwise,
and only one of them is merely wasteful:

- Purges fire across contexts for writes the other context never saw — harmless but
  pointless re-renders.
- Worse, authorization decouples from the cache it guards. The endpoint would check
  ownership in the preview's database and then purge the production tag, so anyone able
  to create a score named `x` in the dev database could purge production's `score-x`.
  Slugs are also only unique within a database, so the same tag could name two different
  scores.

Scope the purge by deploy (derive the alias from the request hostname; `CONTEXT` is
build-time only) at the moment the databases diverge, not before.

**Environment variables:**

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — public anon key

No environment variable configures caching. `CONTEXT` and `REVIEW_ID` exist at build
time only and are empty inside a running function, so nothing at runtime can branch on
them.

## Testing

- **Unit tests:** Vitest for TypeScript logic (`npm test`)
- **Visual tests:** Playwright for UI regression (`npm run test:visual`)
- **Manual:** Chrome DevTools MCP for visual verification during development

## CSS / Styling

Global styles live in two files imported in `src/layouts/Layout.astro`:

- `src/styles/theme.css` — CSS custom properties (colors, spacing, typography)
- `src/styles/components.css` — shared component classes (`.btn`, `.btn-text`, etc.)

**Import pattern — use frontmatter imports, not `@import` inside `<style>` blocks:**

```astro
---
import '../styles/theme.css';
import '../styles/components.css';
---
```

Astro's `<style is:global>` flag only prevents scoping for CSS written _directly_ in the block — it has no effect on `@import`ed files (those are always global regardless). More importantly, `@import` inside `<style>` blocks is not tracked by Vite as a module dependency, so edits to the imported files do **not** trigger HMR. Frontmatter imports are proper Vite module dependencies and hot-reload correctly.

Any CSS written directly in Layout.astro (`:root`, `body`, `*` resets, etc.) should remain in the `<style is:global>` block as before.
