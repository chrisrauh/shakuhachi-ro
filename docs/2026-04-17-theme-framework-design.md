# Theme Iteration Framework — Design Spec

**Date:** 2026-04-17
**Status:** Approved

## Problem

The site needs a way to iterate on color palettes: define a theme from an input source (image, swatch, direct values), apply it to the live site, compare candidates side-by-side, narrow down, and repeat — until a final palette is chosen. Once chosen, all iteration tooling is removed and the winning values are baked into the existing `theme.css`.

## Scope

This is a **dev-only, temporary framework**. It has two distinct layers:

**Permanent (stays forever):**
- The CSS token architecture in `theme.css` (unchanged)
- The JSON theme file format (used during iteration, then deleted)

**Temporary tooling (deleted after final palette chosen):**
- `ThemeLoader` utility
- Tweakpane dev panel
- Comparison page
- `public/themes/` directory and all JSON files

## Approach: Runtime JSON Loader

Themes are defined as JSON files. A `ThemeLoader` applies them at runtime by overriding CSS custom properties on `:root`. No build step required to add a new theme — drop a JSON file and it appears in the Tweakpane panel immediately.

The existing `theme.css` (`:root` block) remains the production source of truth throughout. JSON themes are a dev overlay only.

## Theme JSON Format

Location: `public/themes/<name>.json`

```json
{
  "name": "vermilion",
  "label": "Vermilion & Ink",
  "tokens": {
    "--color-button-primary": "oklch(0.55 0.22 26)",
    "--color-button-primary-hover": "oklch(0.48 0.22 26)",
    "--color-text-primary-brand": "oklch(0.52 0.2 26)",
    "--color-link": "oklch(0.52 0.2 26)",
    "--color-input-border-color-focus": "oklch(0.55 0.22 26)"
  }
}
```

**Rules:**
- Only override semantic tokens (purpose-based, e.g. `--color-button-primary`), never primitives
- Only include tokens that differ from the base — omit tokens that stay the same
- Light and dark overrides are separate keys within `tokens` (or separate files — TBD at implementation)
- The current gray/blue palette is captured as `public/themes/default.json` as a baseline

**Color input is intentionally open-ended.** The JSON is the stable adapter. How you derive the values (image extraction, swatch, manual OKLCH input, design tool export) is left for a future step. The framework just consumes JSON.

## Theme Discovery

Uses Vite's `import.meta.glob('../../public/themes/*.json')` — no hand-maintained manifest. Adding a new theme means dropping a JSON file; it appears in the Tweakpane panel automatically.

## ThemeLoader (`src/utils/theme-loader.ts`)

```
// THEME TOOLING — delete this file when final palette is chosen.
// Also remove: the <script> tag in Layout.astro that imports theme-dev-panel.ts.
// End-of-iteration cleanup steps are listed at the bottom of this file.
```

Responsibilities:
- On load: read `?theme=name` URL param, fetch the matching JSON, apply token overrides to `document.documentElement`
- Expose `applyTheme(name: string)` for Tweakpane to call without page reload
- On failure: log a warning and silently fall back to base `theme.css` tokens — no broken page
- No localStorage persistence — each page load starts from the URL param

End-of-iteration cleanup (listed in the file):
1. Identify the winning theme JSON
2. Copy its `tokens` values into the semantic token section of `theme.css`
3. Delete `public/themes/` directory
4. Delete `src/utils/theme-loader.ts`
5. Delete `src/utils/theme-dev-panel.ts`
6. Delete `src/pages/dev/themes.astro`
7. Remove the `<script>` tag from `Layout.astro` (marked with removal comment)

## Tweakpane Dev Panel (`src/utils/theme-dev-panel.ts`)

```
// THEME TOOLING — delete this file when final palette is chosen.
// See theme-loader.ts for full cleanup steps.
```

- Only mounts when `import.meta.env.DEV` is true
- Injected via a single conditional `<script>` tag in `Layout.astro`:
  ```html
  <!-- THEME TOOLING: remove this tag and delete theme-dev-panel.ts when done -->
  {import.meta.env.DEV && <script src="...theme-dev-panel.ts"></script>}
  ```
- Panel contents:
  - Theme dropdown — populated from discovered JSON files, calls `ThemeLoader.applyTheme(name)`
  - Light/dark toggle — works independently of theme selection
  - "Copy tokens" button — copies the current active token overrides as JSON to clipboard, for easy extraction of the winning values

No coupling to any existing page component. Self-contained.

## Comparison Page (`src/pages/dev/themes.astro`)

```
// THEME TOOLING — delete this file when final palette is chosen.
// See theme-loader.ts for full cleanup steps.
```

Route: `/dev/themes`

Protected by a redirect in production:
```ts
if (!import.meta.env.DEV) return Astro.redirect('/');
```

Layout: two columns side-by-side. Each column has:
- A theme selector dropdown (lists all discovered themes)
- A component gallery: site header, score card, primary button, secondary button, form input, toast

**CSS scoping mechanism:** Token overrides are applied to a wrapper `<div>` via inline `style` — CSS custom properties cascade down, so every component inside inherits the column's theme without touching `:root`. This makes two themes visible simultaneously on the same page without iframes.

```html
<div style="--color-button-primary: X; --color-text-primary-brand: Y; ...">
  <!-- component gallery — picks up theme from parent -->
</div>
```

Selecting a theme in one column does not affect the other column. Both columns always show light mode or both always show dark mode (controlled by a single toggle at the top of the page).

## Dark Mode Interaction

Dark mode continues to work independently. The existing `data-theme="dark"` mechanism on `:root` is untouched. Tweakpane has a separate light/dark toggle. Theme JSON files only define semantic token overrides — dark mode inversion of primitives (already in `theme.css`) handles the rest automatically.

If a theme needs dark-mode-specific overrides (e.g. a button color that needs different dark treatment), those are separate keys in the JSON — convention TBD at implementation.

## Removal Checklist

When the final palette is chosen, follow these steps in order:

- [ ] Pick the winning theme JSON from `public/themes/`
- [ ] Copy its `tokens` values into the semantic token section of `src/styles/theme.css`
- [ ] Verify the site looks correct in both light and dark mode
- [ ] Delete `public/themes/` (entire directory)
- [ ] Delete `src/utils/theme-loader.ts`
- [ ] Delete `src/utils/theme-dev-panel.ts`
- [ ] Delete `src/pages/dev/themes.astro`
- [ ] Remove the `{import.meta.env.DEV && ...}` script tag from `Layout.astro`
- [ ] Run `npm test` to confirm nothing is broken
- [ ] Commit: "style: apply final theme palette, remove theme iteration tooling"

## What This Does Not Include

- Color extraction from images (left open — the JSON is the adapter, input source is TBD)
- Palette expansion logic (5 input colors → full token set) — also left open
- Any user-facing theme switching in production
- Persistence of Tweakpane state across sessions (intentionally omitted)
