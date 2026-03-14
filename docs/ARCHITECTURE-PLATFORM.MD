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

Client-side with live preview. Notation input supports ABC, JSON, MusicXML. Automatic format conversion when switching. Title changes update the slug. Saves to Supabase on submit.

**Components:** `ScoreEditor.ts` (form, notation input), `<shakuhachi-score>` (live preview)

## Data Flow

**Score creation:**
```
Create new score → temporary slug → empty score in Supabase → /score/[slug]/edit
User enters title + notation → live preview → title updates slug → save
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
- `src/components/AuthComponents.ts` — login/signup UI

## Database Schema

**Supabase tables:**
- `scores` — id, user_id, title, slug, composer, description, data_format, data, forked_from, fork_count, source_url, rights, source_description, created_at, updated_at
- `users` — user profiles

## Client Components

Vanilla TypeScript classes with a simple `constructor(containerId) → render() → attachEventListeners()` pattern.

**Components:**
- `ThemeSwitcher.ts` — light/dark mode toggle
- `AuthComponents.ts` — login/signup UI
- `MobileMenu.ts` — mobile navigation
- `ScoreLibrary.ts` — browse page grid (fetches and renders all scores client-side)
- `ScoreDetailClient.ts` — score page interactions (fork, delete)
- `ScoreEditor.ts` — edit page notation input and preview
- `Toast.ts` — toast notifications
- `ConfirmDialog.ts` — confirmation dialogs
- `LoadingSpinner.ts` — loading state
- `LetterSpacingControl.ts` — typography control

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

