# Design: Header Initialization Refactor + Mobile Menu Extraction

**Date:** 2026-03-14
**Status:** In progress — under discussion

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

Additionally: header initialization lives in page `<script>` blocks rather than in `SiteHeader.astro` itself, and the auth widget suffers a visible layout jump when auth state resolves client-side.

---

## Goals

1. Eliminate ~90 lines of duplication across the three standard pages
2. Make the slug page follow the same pattern as standard pages
3. Fix modal ownership: `HeaderModal` should be a top-level peer, not secretly owned by `AuthWidget`
4. `SiteHeader.astro` owns all header initialization — pages do not call `initHeader()`
5. Smooth the auth widget appearance to eliminate layout jump on auth resolution

---

## Key Design Decisions

### Who owns auth reactivity?

The auth subscription (`onAuthReady`) belongs in `initHeader`, not on the page. "Initialize the header" means making it fully functional and reactive — that includes subscribing to auth state. Keeping it on pages is boilerplate that doesn't belong there.

### Who calls `initHeader()`?

Pages currently call `initHeader()` because mobile menu items vary per page. The right owner is `SiteHeader.astro` — it should have its own `<script>` block that calls `initHeader()`. Pages stop calling it entirely.

For pages with custom menus (the slug page), `SiteHeader.astro` accepts a `mobileMenuType` prop rendered as a `data-menu-type` attribute on the mobile menu container. The header script reads this attribute and selects the appropriate builder. All custom builders are defined in `init-header.ts`.

---

## Architecture

### `SiteHeader.astro` changes

Accepts a new optional prop:

```ts
interface Props {
  // ... existing props
  mobileMenuType?: 'standard' | 'score-detail'  // default: 'standard'
}
```

Renders it as a data attribute:

```html
<div id="mobile-menu" class="mobile-menu-container"
     data-menu-type={mobileMenuType ?? 'standard'}></div>
```

Has its own `<script>` block:

```ts
import { initHeader } from '../utils/init-header';
initHeader();
```

`initHeader` reads `data-menu-type` from the DOM to select the builder. Pages no longer import or call `initHeader`.

### `initHeader` interface

```ts
export function initHeader(): void
```

Internally:

1. Creates `ThemeSwitcher('theme-switcher')`
2. Creates `LetterSpacingControl` in dev mode (lazy import, guard lives here)
3. Creates `HeaderModal` — top-level, not inside `AuthWidget`
4. Creates `AuthWidget('auth-widget', headerModal)` — receives modal as dependency
5. Creates `MobileMenu('mobile-menu')`
6. Reads `data-menu-type` from `#mobile-menu` to select the menu builder
7. Subscribes to `onAuthReady`:
   - Calls `authWidget.setUser(user)`
   - Calls `mobileMenu.setItems(builder(user, headerModal))`

Returns `void`.

### Menu builders in `init-header.ts`

```ts
// Standard builder — used by index, about, notation-formats
function standardMenuBuilder(user, headerModal): MenuItem[][]

// Score-detail builder — used by score/[slug]
function scoreDetailMenuBuilder(user, headerModal): MenuItem[][]
// Reads score-data from DOM, determines isOwner, builds conditional items
```

### Exported helpers

To avoid duplication within `scoreDetailMenuBuilder`, these are exported for internal reuse:

```ts
export function buildNavItems(): MenuItem[]
export function buildAuthItems(user: SupabaseUser | null, headerModal: HeaderModal): MenuItem[]
export function buildUtilityItems(): MenuItem[]
export function getIconHTML(icon: LucideIcon): string
```

### Standard pages (index, about, notation-formats)

```astro
<SiteHeader />
```

No `<script>` block for header initialization. `SiteHeader`'s own script handles everything.

### Slug page

```astro
<SiteHeader mobileMenuType="score-detail" />
```

`scoreDetailMenuBuilder` in `init-header.ts` reads `#score-data` from the DOM inside the builder callback (so a parse failure doesn't prevent the rest of the header from initializing):

```ts
function scoreDetailMenuBuilder(user, headerModal): MenuItem[][] {
  let isOwner = false;
  try {
    const dataEl = document.getElementById('score-data');
    if (dataEl) {
      const score = JSON.parse(dataEl.textContent || '{}').score;
      isOwner = !!(user && score && user.id === score.user_id);
    }
  } catch {
    // fall through: isOwner stays false, standard nav shown
  }

  const extraItems: MenuItem[] = isOwner ? [editItem, deleteItem] : [];
  return [
    ...(extraItems.length > 0 ? [extraItems] : []),
    buildNavItems(),
    buildAuthItems(user, headerModal),
    buildUtilityItems(),
  ];
}
```

---

## AuthWidget Refactor (Modal Ownership)

`AuthWidget` currently creates `HeaderModal` internally and exposes it via `getAuthModal()`. This hides a shared dependency.

**Before:**
```ts
// AuthWidget constructor
this.authModal = new AuthModal();  // owns modal internally

// initHeader
const authModal = authWidget.getAuthModal();  // leaked via getter
```

**After:**
```ts
// AuthWidget constructor accepts modal as dependency
constructor(containerId: string, headerModal: HeaderModal)

// initHeader
const headerModal = new HeaderModal();
const authWidget = new AuthWidget('auth-widget', headerModal);
```

`getAuthModal()` is removed. `AuthModal` is renamed to `HeaderModal` throughout.

---

## Auth Widget Appearance (Flash Mitigation)

`#auth-widget` starts as an empty div — zero width. When JS loads and `AuthWidget` renders, the button appears and the layout jumps. This affects both logged-out (button appears) and the subsequent auth resolution (button may change size).

**Approach: CSS width transition driven by JS measurement**

`#auth-widget` in `SiteHeader.astro`:

```css
#auth-widget {
  overflow: hidden;
  width: 0;
  transition: width 200ms ease;
}
```

`AuthWidget`, after each render (initial and on auth change), measures its content and sets an explicit pixel width on the container:

```ts
private updateContainerWidth(): void {
  const content = this.container.firstElementChild as HTMLElement;
  if (content) {
    this.container.style.width = `${content.scrollWidth}px`;
  }
}
```

Called at the end of `render()`. This means:
- Initial appearance: smooth expansion from 0 → logged-out button width
- Auth state change (logged-out → logged-in or vice versa): smooth width transition between the two sizes
- No layout jump at any point

This is CSS-only (no `min-width` assumption needed), handles both states, and is self-correcting if button sizes change.

---

## Static Rendering Considerations

The project uses `output: 'server'` (SSR by default). Three standard pages opt into static prerendering with `export const prerender = true`. The slug page is SSR.

**`initHeader` always runs client-side.** Astro never executes component `<script>` blocks at build/render time — they are bundled by Vite and sent to the browser.

**Auth state and prerendered pages.** Static pages serve the same HTML to all users. The auth widget starts at width 0 and expands smoothly once `onAuthReady` fires. The `data-menu-type` attribute is baked into the static HTML at build time (it's a fixed value per page, not user-specific).

**Bundle sharing.** All pages share `SiteHeader.astro`, so they share its `<script>` chunk — `initHeader` and all its dependencies are bundled once, cached by the browser across navigations.

**Slug page score data** is parsed inside `scoreDetailMenuBuilder` (not at script top level), so parse failures degrade gracefully without preventing header initialization.

---

## File Changes

| File | Change |
|------|--------|
| `src/components/SiteHeader.astro` | Add `mobileMenuType` prop, `data-menu-type` attribute, `<script>` calling `initHeader()`, width-transition CSS on `#auth-widget` |
| `src/utils/init-header.ts` | Rewrite: reads `data-menu-type`, selects builder, owns `onAuthReady`, exports helpers |
| `src/components/AuthComponents.ts` | Rename `AuthModal` → `HeaderModal`; `AuthWidget` accepts `HeaderModal` as constructor param; remove `getAuthModal()`; call `updateContainerWidth()` after each render |
| `src/pages/index.astro` | Remove ~90-line script block (header script handles it) |
| `src/pages/about.astro` | Same |
| `src/pages/help/notation-formats.astro` | Same |
| `src/pages/score/[slug].astro` | Replace mobile menu script block with `mobileMenuType="score-detail"` prop on `<SiteHeader>` |

---

## Engineering Principles Applied

| Principle | How |
|-----------|-----|
| **Single Responsibility** | `initHeader` = initialize the header. `SiteHeader.astro` = render and initialize the header. One reason to change each. |
| **Explicit over Implicit** | Custom menu type declared at the call site (`mobileMenuType` prop). Auth subscription is header-internal (not page logic). |
| **Make Change Cheap** | New page with unique menu = add a builder to `init-header.ts`, pass a new `mobileMenuType` string. |
| **Loose Coupling** | Pages know nothing about `ThemeSwitcher`, `HeaderModal`, or `MobileMenu` internals. |
| **DRY** | Standard items defined once. Helpers exported for reuse in custom builders. |
| **YAGNI** | Only two `mobileMenuType` values exist. No over-engineered registry. |
