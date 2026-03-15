# Web Platform Architecture

**Scope:** This document covers the web platform (shakuhachi.ro). For renderer library architecture, see [ARCHITECTURE-RENDERER.MD](./ARCHITECTURE-RENDERER.MD).

## Overview

Shakuhachi.ro is a web platform for sharing shakuhachi scores. Musicians can browse, create, edit, and share scores via links.

**Stack:**
- Astro (SSR mode) with Netlify adapter
- Supabase (authentication, database, storage)
- Embedded renderer library (see ARCHITECTURE-RENDERER.MD)
- Vanilla TypeScript for client-side interactivity

**How it works:** Score pages server-fetch data from Supabase and embed JSON in HTML. The browse page is statically prerendered; the client fetches scores on load. Interactive features use vanilla TypeScript components.

## Key Pages

### Browse Page (`/`)

Statically prerendered (`export const prerender = true`). Empty shell page; client fetches scores on load. `ScoreLibrary` handles fetch, filter, and search entirely client-side. Requires JavaScript to display scores.

### Score Detail Page (`/score/[slug]`)

SSR with embedded renderer. Server fetches score by slug, embeds JSON. Client initializes renderer, handles fork/delete actions.

**Components:** `ScoreDetailClient.ts` (fork, delete), `<shakuhachi-score>` web component (notation rendering)

**Fork flow:** User clicks "Fork" → `forkScore()` API call → new score created → redirect to `/score/[slug]/edit`

### Score Edit Page (`/score/[slug]/edit`)

Edit-only. Returns 404 for missing scores — score creation goes through `startNewScore()` which calls the API and redirects here (see Data Flow). Notation input supports ABC, JSON, MusicXML. Automatic format conversion when switching. Title changes update the slug. Per-slug localStorage autosave. Saves to Supabase on submit.

**Components:** `ScoreEditor.ts` (form, notation input), `<shakuhachi-score>` (live preview)

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
User edits title + notation → live preview → autosave to localStorage → save to Supabase
```

**Fork:**
```
Fork existing score → forkScore() API call → copy data to new score → /score/[slug]/edit
```

**Viewing:**
```
GET /score/akatombo → server fetches by slug → embeds JSON in HTML → client renders
```

## Notation Formats

Three formats with full bidirectional conversion:

| Format | `data_format` | Notes |
|--------|--------------|-------|
| ABC | `'abc'` | Text-based, human-readable, folk/traditional music communities |
| JSON | `'json'` | Native ScoreData format, used internally by renderer |
| MusicXML | `'musicxml'` | Industry standard, compatible with Finale, Sibelius, MuseScore |

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
- `src/web-component/constants/abc-pitch-map.ts` — maps ABC to shakuhachi fingerings (D shakuhachi)

**Editor UX:** Switching formats triggers automatic conversion. On failure, user is prompted to clear content or cancel.

## Authentication

**Provider:** Supabase Auth (email/password, session management)

**Key files:**
- `src/api/auth.ts` — auth API wrapper
- `src/api/supabase.ts` — Supabase client
- `src/components/AuthComponents.ts` — login/signup UI (base auth components)

**AuthWidget / AuthModal decoupling:** AuthWidget accepts any object implementing `AuthModalInterface`. This decouples AuthWidget from `AuthModal`'s concrete implementation, allowing the modal to be substituted or tested independently.

## Database Schema

**Supabase tables:**
- `scores` — id, user_id, title, slug, composer, description, data_format, data, forked_from, fork_count, source_url, rights, source_description, created_at, updated_at
- `users` — user profiles

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
- `ScoreEditor.ts` — edit page notation input and preview (edit-only, per-slug localStorage autosave)
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

## Deployment

**Platform:** Netlify with SSR via Netlify Functions. Automatic deploys from main branch; preview deploys for PRs.

**Adapter:** `@astrojs/netlify`

**Environment variables:**
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — public anon key

## Testing

- **Unit tests:** Vitest for TypeScript logic (`npm test`)
- **Visual tests:** Playwright for UI regression (`npm run test:visual`)
- **Manual:** Chrome DevTools MCP for visual verification during development

## CSS / Styling

Global styles live in two files imported in `src/layouts/Layout.astro`:
- `src/styles/tokens/themes.css` — CSS custom properties (colors, spacing, typography)
- `src/styles/components.css` — shared component classes (`.btn`, `.btn-text`, etc.)

**Import pattern — use frontmatter imports, not `@import` inside `<style>` blocks:**

```astro
---
import '../styles/tokens/themes.css';
import '../styles/components.css';
---
```

Astro's `<style is:global>` flag only prevents scoping for CSS written *directly* in the block — it has no effect on `@import`ed files (those are always global regardless). More importantly, `@import` inside `<style>` blocks is not tracked by Vite as a module dependency, so edits to the imported files do **not** trigger HMR. Frontmatter imports are proper Vite module dependencies and hot-reload correctly.

Any CSS written directly in Layout.astro (`:root`, `body`, `*` resets, etc.) should remain in the `<style is:global>` block as before.
