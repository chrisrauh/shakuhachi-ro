# Design: Header Initialization Refactor + Mobile Menu Extraction

**Date:** 2026-03-14
**Status:** In progress — open question unresolved (see bottom)

---

## Problem

`index.astro`, `about.astro`, and `help/notation-formats.astro` each contain ~90 lines of identical `<script>` boilerplate:

- Same imports (lucide icons, MobileMenu, auth, toast, etc.)
- `getIconHTML()` helper
- `toggleTheme()` helper
- `MobileMenu` instantiation
- `updateMobileMenu(user)` function defining three item groups (action, auth, utility)
- `onAuthReady()` subscription calling `authWidget.setUser(user)` and `updateMobileMenu(user)`

The slug page (`score/[slug].astro`) has owner-specific items and is intentionally different — it stays as-is.

---

## Goals

1. Eliminate the ~90-line duplication across the three standard pages
2. Improve the header initialization architecture to be flat and explicit
3. Fix modal ownership: `AuthModal` should be a top-level peer, not secretly owned by `AuthWidget`
4. Keep the auth subscription visible on the page (explicit over implicit)

---

## Architecture

### Current structure

```
initHeader()
  ├── new ThemeSwitcher()
  ├── new LetterSpacingControl() [dev only]
  ├── new AuthWidget()           ← owns AuthModal internally
  │     └── .getAuthModal()      ← modal leaked via getter
  └── returns { authWidget, authModal }
```

Pages then pass `authModal` into mobile menu setup manually — but only after the refactor for the mobile menu extraction task that preceded this one. Currently mobile menu boilerplate is fully inline on each page.

### Proposed structure

Flat, composable initializers — each with one responsibility:

```ts
// src/utils/init-header.ts

function initThemeSwitcher(): void
  // Instantiates ThemeSwitcher('theme-switcher')

function initLetterSpacingControl(): void
  // Dev-only guard lives here. Lazy-imports LetterSpacingControl.

function initAuthUI(): { authWidget: AuthWidget, authModal: AuthModal }
  // AuthModal created HERE — top-level, not inside AuthWidget
  // AuthWidget receives authModal as a constructor dependency (B.1)
  // Returns both so callers can use them

function initMobileMenu(authModal: AuthModal): HeaderMobile
  // Builds standard three-group item structure
  // Returns headerMobile with .update(user: SupabaseUser | null): void
  // Location TBD (see open question below)

export function initHeader(): { authWidget: AuthWidget, headerMobile: HeaderMobile }
  // Wrapper that calls all four above
  // Called by all standard pages
```

### AuthWidget refactor

`AuthWidget` currently creates `AuthModal` internally. It needs to accept it as a constructor parameter instead:

```ts
// Before
const authWidget = new AuthWidget('auth-widget');
const authModal = authWidget.getAuthModal();

// After
const authModal = new AuthModal();
const authWidget = new AuthWidget('auth-widget', authModal);
```

This makes the modal a proper shared resource rather than a widget-internal detail.

### Standard page calling code (after refactor)

```ts
const { authWidget, headerMobile } = initHeader();

onAuthReady((user) => {
  authWidget.setUser(user);
  headerMobile.update(user);
});
```

Four lines. Auth subscription stays on the page (explicit — a reader can see when and how components update).

### Slug page (unchanged pattern, uses individual pieces)

The slug page doesn't call `initHeader()`. It calls the individual initializers and sets up its own mobile menu with owner-conditional items.

---

## Mobile Menu Standard Items

The three standard item groups (identical across all pages today):

**Group 1 — Actions:**
- Library → `href: '/'`
- Create score → calls `createEmptyScore()`, redirects to `/score/[slug]/edit`

**Group 2 — Auth (user-conditional):**
- If logged in: email (non-interactive), Log Out
- If logged out: Log In (shows auth modal), Sign Up (shows auth modal)

**Group 3 — Utility:**
- Toggle theme
- Help → `href: '/help/notation-formats'`
- About → `href: '/about'`

The `headerMobile.update(user)` method rebuilds and re-sets these groups whenever auth state changes.

---

## `HeaderMobile` interface

```ts
interface HeaderMobile {
  update(user: SupabaseUser | null): void;
}
```

The underlying `MobileMenu` instance is an implementation detail — not exposed.

---

## Files changed

| File | Change |
|------|--------|
| `src/utils/init-header.ts` | Decompose into flat initializers + wrapper |
| `src/components/AuthComponents.ts` | `AuthWidget` accepts `AuthModal` as constructor param |
| `src/pages/index.astro` | Replace ~90-line script block with `initHeader()` + `onAuthReady` |
| `src/pages/about.astro` | Same |
| `src/pages/help/notation-formats.astro` | Same |
| `src/pages/score/[slug].astro` | Call individual initializers instead of `initHeader()` |
| `src/utils/init-mobile-menu.ts` *(maybe)* | If `initMobileMenu` lives in its own file |

---

## Open Question

**Where does `initMobileMenu` live?**

- **Option A — inside `init-header.ts`**: Everything header-related in one file. Simpler. `initMobileMenu` is only ever used as part of header initialization.
- **Option B — separate `src/utils/init-mobile-menu.ts`**: The original TODO suggestion. Isolates the only piece with real logic (building item groups). Easier to find and test independently.

Leaning toward **Option B** — the menu item logic is substantial enough to warrant its own file, and co-location with init-header would make that file longer and more mixed in responsibility.
