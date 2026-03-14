# Design: Header Initialization Refactor + Mobile Menu Extraction

**Date:** 2026-03-14
**Status:** Ready for implementation plan

---

## Problem

`index.astro`, `about.astro`, and `help/notation-formats.astro` each contain ~90 lines of identical `<script>` boilerplate:

- Same imports (lucide icons, MobileMenu, auth, toast, etc.)
- `getIconHTML()` helper
- `toggleTheme()` helper
- `MobileMenu` instantiation
- `updateMobileMenu(user)` function defining three item groups (action, auth, utility)
- `onAuthReady()` subscription calling `authWidget.setUser(user)` and `updateMobileMenu(user)`

The slug page (`score/[slug].astro`) has the same structure but with owner-conditional edit/delete items.

---

## Goals

1. Eliminate ~90 lines of duplication across the three standard pages
2. Make the slug page follow the same `initHeader()` pattern as standard pages
3. Fix modal ownership: `AuthModal` should be a top-level peer, not secretly owned by `AuthWidget`
4. `initHeader` is the single entry point for all pages — it owns all header initialization

---

## Key Design Decision: Who Owns Auth Reactivity?

**Previous draft had pages wiring `onAuthReady` themselves (Option B).**
This is wrong. Keeping auth subscription on the page means pages still have boilerplate, and the subscription is not conceptually "page logic" — it's "header logic." The header needs to react to auth state. That belongs in `initHeader`.

**Correct approach: `initHeader` owns the full reactive lifecycle.**
"Initialize the header" means making it fully functional and reactive, including subscribing to auth state. This is a single, coherent responsibility.

---

## Architecture

### `initHeader` interface

```ts
type MobileMenuBuilder = (
  user: SupabaseUser | null,
  authModal: AuthModal
) => MenuItem[][]

interface HeaderOptions {
  mobileMenu?: MobileMenuBuilder  // omit = use standard 3-group items
}

export function initHeader(options?: HeaderOptions): void
```

Internally, `initHeader`:

1. Creates `ThemeSwitcher('theme-switcher')`
2. Creates `LetterSpacingControl` in dev mode (lazy import, guard lives here)
3. Creates `AuthModal` — **top-level, not inside AuthWidget**
4. Creates `AuthWidget('auth-widget', authModal)` — receives modal as dependency
5. Creates `MobileMenu('mobile-menu')`
6. Subscribes to `onAuthReady`:
   - Calls `authWidget.setUser(user)`
   - Calls `mobileMenu.setItems(buildItems(user, authModal))`
   - `buildItems` = `options.mobileMenu ?? standardMobileMenuItems`

Returns `void`. Pages don't need to touch auth, the widget, or the menu after calling `initHeader`.

### Standard pages (index, about, notation-formats)

```ts
initHeader();  // one line — header fully initialized and reactive
```

Any page-specific init (e.g., `new ScoreLibrary(...)`) follows separately.

### Slug page (custom mobile menu)

The slug page is SSR — score data is embedded in the HTML by the server. The `mobileMenu` callback reads it from the DOM client-side. **Parsing must happen inside the callback**, not before `initHeader`, so that a malformed or missing `score-data` element doesn't prevent the rest of the header (theme switcher, auth widget) from initializing.

```ts
initHeader({
  mobileMenu: (user, authModal) => {
    // Parse score data inside the callback — if this fails, header still initializes
    let isOwner = false;
    try {
      const dataEl = document.getElementById('score-data');
      if (dataEl) {
        const score = JSON.parse(dataEl.textContent || '{}').score;
        isOwner = !!(user && score && user.id === score.user_id);
      }
    } catch {
      // fall through: isOwner stays false
    }

    const extraItems = isOwner ? [editItem, deleteItem] : [];
    return [
      ...(extraItems.length > 0 ? [extraItems] : []),
      buildNavItems(),
      buildAuthItems(user, authModal),  // shared helper
      buildUtilityItems(),              // shared helper
    ];
  }
});
```

### Exported helpers for custom menus

To avoid duplication in the slug page's custom builder, `init-header.ts` exports the item-group builders used by the standard menu:

```ts
export function buildNavItems(): MenuItem[]
export function buildAuthItems(user: SupabaseUser | null, authModal: AuthModal): MenuItem[]
export function buildUtilityItems(): MenuItem[]
export function getIconHTML(icon: LucideIcon): string
```

The slug page reuses `buildAuthItems` and `buildUtilityItems` and only defines its own nav/extra items.

## Static Rendering Considerations

The project uses `output: 'server'` (SSR by default). Three standard pages opt into static prerendering with `export const prerender = true`. The slug page is SSR.

**`initHeader` always runs client-side.** Astro never executes `<script>` blocks at build/render time — they are bundled by Vite and sent to the browser. No server-side implications for `initHeader` itself.

**Auth state and prerendered pages.** Static pages serve the same HTML to all users. The auth widget and mobile menu always start in an unauthenticated visual state and update reactively when `onAuthReady` fires client-side. This is existing behavior — our refactor doesn't change it.

**Bundle sharing.** All three prerendered pages will import the same `initHeader` module. Astro/Vite creates a shared chunk cached by the browser across page navigations — a net improvement over today, where each page bundles its own copy of the menu-building code.

**Slug page score data must be parsed inside the `mobileMenu` callback** (see Slug page section above), not before `initHeader()`. Parsing outside means a DOM error prevents the entire header from initializing. Parsing inside means the header always initializes; the menu gracefully falls back if score data is unavailable.

---



`AuthWidget` currently creates `AuthModal` internally and exposes it via `getAuthModal()`. This hides a shared dependency.

**Before:**
```ts
// AuthWidget constructor
this.authModal = new AuthModal();  // owns modal internally

// Pages
const { authWidget, authModal } = initHeader();  // modal leaked via getter
```

**After:**
```ts
// AuthWidget constructor accepts modal as dependency
constructor(containerId: string, authModal: AuthModal)

// initHeader creates modal first, passes to widget
const authModal = new AuthModal();
const authWidget = new AuthWidget('auth-widget', authModal);
```

`getAuthModal()` can be removed. The modal is not accessed outside `initHeader`.

---

## Standard Mobile Menu Item Groups

Three groups, consistent across all standard pages:

**Group 1 — Nav actions:**
- Library → `href: '/'`
- Create score → calls `createEmptyScore()`, redirects on success

**Group 2 — Auth (user-conditional):**
- Logged in: email (non-interactive), Log Out
- Logged out: Log In (opens auth modal), Sign Up (opens auth modal)

**Group 3 — Utility:**
- Toggle theme
- Help → `href: '/help/notation-formats'`
- About → `href: '/about'`

---

## File Changes

| File | Change |
|------|--------|
| `src/utils/init-header.ts` | Rewrite: flat internal setup, `onAuthReady` inside, configurable menu, export helpers |
| `src/components/AuthComponents.ts` | `AuthWidget` accepts `AuthModal` as constructor param; remove `getAuthModal()` |
| `src/pages/index.astro` | Replace ~90-line script block with `initHeader()` |
| `src/pages/about.astro` | Same |
| `src/pages/help/notation-formats.astro` | Same |
| `src/pages/score/[slug].astro` | Replace script with `initHeader({ mobileMenu: ... })` using exported helpers |

---

## Engineering Principles Applied

| Principle | How |
|-----------|-----|
| **Single Responsibility** | `initHeader` = initialize the header. One reason to change. |
| **Explicit over Implicit** | Custom menu items declared at the call site. Auth subscription is internal to header init (not a page concern). |
| **Make Change Cheap** | New page with unique menu = pass a different function. No structural changes. |
| **Loose Coupling** | Pages know nothing about `ThemeSwitcher`, `AuthModal`, or `MobileMenu` internals. |
| **DRY** | Standard items defined once. Helpers exported for reuse in custom menus. |
| **YAGNI** | No config options beyond what existing pages need. |
