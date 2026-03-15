# Unify Dropdown Styling Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the avatar dropdown look and behave exactly like the mobile menu dropdown — icons on all items, email displayed as a non-interactive secondary-color item in the same group as Log Out, Log Out always last.

**Architecture:** Add a `nonInteractive` variant to `MenuItem` so the email address can be rendered as a styled-but-unclickable label (no hover, secondary color, default cursor) in both dropdowns. Update `AuthComponents.ts` to use this pattern instead of the separate `header` option. Update all four pages that build the mobile menu to use the same `nonInteractive: true` flag instead of the current dummy `action: () => {}`.

**Tech Stack:** TypeScript, Lucide icons (`lucide` package), injected CSS in `MenuDropdown.ts`.

---

## File Map

| File | Change |
|---|---|
| `src/components/MenuDropdown.ts` | Add `nonInteractive?: boolean` to `MenuItem`; render non-interactive items as `<div>` with secondary-color styling |
| `src/components/AuthComponents.ts` | Import Lucide icons; swap `header: email` for a `nonInteractive` item; add icon to Log Out |
| `src/pages/index.astro` | Change `account` item: replace `action: () => {}` with `nonInteractive: true` |
| `src/pages/about.astro` | Same as index.astro |
| `src/pages/help/notation-formats.astro` | Same as index.astro |
| `src/pages/score/[slug].astro` | Same as index.astro |

No new files. No structural changes to `MobileMenu.ts`.

---

## Task 1 — Extend `MenuDropdown` to support non-interactive items

**Files:**
- Modify: `src/components/MenuDropdown.ts`

### What and why

Currently `MenuItem` only supports interactive items (`href` → anchor, `action` → button). The email address in the mobile menu is hacked in as `action: () => {}` (a noop that still shows hover state and looks clickable). The avatar dropdown uses a separate `header` option that puts the email in a visually distinct banner above the items.

We need a first-class `nonInteractive: true` flag that renders a `<div>` with secondary styling — no hover background, `cursor: default`, secondary text color. This is the correct abstraction for both use cases.

### Steps

- [ ] **Step 1: Add `nonInteractive` to the `MenuItem` interface**

  In `src/components/MenuDropdown.ts`, line 1–7, update the interface:

  ```ts
  export interface MenuItem {
    id: string;
    label: string;
    href?: string;
    action?: () => void;
    icon?: string;
    nonInteractive?: boolean;
  }
  ```

- [ ] **Step 2: Add CSS for non-interactive items**

  Inside `injectStyles()`, add after the `.menu-dropdown-item:hover` rule (around line 91):

  ```css
  .menu-dropdown-item--static {
    cursor: default;
    color: var(--color-text-secondary);
  }

  .menu-dropdown-item--static:hover {
    background: none;
  }

  .menu-dropdown-item--static .menu-dropdown-item-icon {
    color: var(--color-text-secondary);
  }
  ```

- [ ] **Step 3: Render non-interactive items as `<div>` in `show()`**

  In the `show()` method, replace the existing item-rendering block (lines ~160–189) with:

  ```ts
  groups.forEach((group, groupIndex) => {
    group.forEach((item) => {
      let el: HTMLElement;

      if (item.nonInteractive) {
        el = document.createElement('div');
        el.className = 'menu-dropdown-item menu-dropdown-item--static';
      } else if (item.href) {
        const a = document.createElement('a');
        a.href = item.href;
        el = a;
        el.className = 'menu-dropdown-item';
      } else {
        const btn = document.createElement('button');
        btn.addEventListener('click', () => {
          item.action?.();
          this.hide();
        });
        el = btn;
        el.className = 'menu-dropdown-item';
      }

      if (item.icon) {
        const iconSpan = document.createElement('span');
        iconSpan.className = 'menu-dropdown-item-icon';
        iconSpan.innerHTML = item.icon;
        el.appendChild(iconSpan);
      }

      const labelSpan = document.createElement('span');
      labelSpan.textContent = item.label;
      el.appendChild(labelSpan);

      this.el!.appendChild(el);
    });

    if (groupIndex < groups.length - 1) {
      const divider = document.createElement('div');
      divider.className = 'menu-dropdown-divider';
      this.el!.appendChild(divider);
    }
  });
  ```

- [ ] **Step 4: Run tests**

  ```bash
  npm test
  ```

  Expected: all 316 tests pass, 0 lint errors.

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/MenuDropdown.ts
  git commit -m "Add nonInteractive MenuItem variant to MenuDropdown"
  ```

---

## Task 2 — Update `AuthComponents.ts` to use icons and `nonInteractive` email

**Files:**
- Modify: `src/components/AuthComponents.ts`

### What and why

The avatar dropdown currently:
- Has no icons on any items
- Uses the `header: email` option to show the email in a visually separate banner above the items
- Has Log Out as the only item in one group (no email in the group)

After this change:
- Email is a `nonInteractive: true` item with a User icon — same group as Log Out
- Log Out has a LogOut icon
- No `header` option used (email in group handles this)

### Steps

- [ ] **Step 1: Add Lucide imports to `AuthComponents.ts`**

  Add at the top of the file (after the existing imports):

  ```ts
  import { createElement, User as UserIcon, LogOut as LogOutIcon } from 'lucide';
  ```

- [ ] **Step 2: Add a local `getIconHTML` helper**

  Add immediately after the imports (before the `getInitials` function):

  ```ts
  function getIconHTML(iconComponent: Parameters<typeof createElement>[0]): string {
    const icon = createElement(iconComponent);
    icon.setAttribute('width', '16');
    icon.setAttribute('height', '16');
    icon.setAttribute('stroke-width', '2');
    return icon.outerHTML;
  }
  ```

- [ ] **Step 3: Update the `menuDropdown.show()` call in `AuthWidget`**

  In `render()`, find the `avatarBtn.addEventListener('click', ...)` handler (around line 273). Replace the `menuDropdown.show()` call:

  **Before:**
  ```ts
  this.menuDropdown.show(
    [
      [
        {
          id: 'logout',
          label: 'Log Out',
          action: () => this.handleLogout(),
        },
      ],
    ],
    {
      anchor: avatarBtn,
      header: email,
      onClose: () => avatarBtn.setAttribute('aria-expanded', 'false'),
    },
  );
  ```

  **After:**
  ```ts
  this.menuDropdown.show(
    [
      [
        {
          id: 'email',
          label: email,
          nonInteractive: true,
          icon: getIconHTML(UserIcon),
        },
        {
          id: 'logout',
          label: 'Log Out',
          action: () => this.handleLogout(),
          icon: getIconHTML(LogOutIcon),
        },
      ],
    ],
    {
      anchor: avatarBtn,
      onClose: () => avatarBtn.setAttribute('aria-expanded', 'false'),
    },
  );
  ```

- [ ] **Step 4: Run tests**

  ```bash
  npm test
  ```

  Expected: all tests pass, 0 lint errors.

- [ ] **Step 5: Visual verification — avatar dropdown**

  With dev server running at `http://localhost:3001`:
  1. Log in with the test account
  2. Open `http://localhost:3001` in the browser (via chrome-devtools-mcp)
  3. Click the avatar button (top-right)
  4. Verify:
     - Email shows with User icon, secondary text color, no hover effect
     - "Log Out" shows with LogOut icon, normal interactive styling
     - No separate header/banner above items
     - Both items in same group (no divider between them)
  5. Check dark mode too: `emulate({ colorScheme: "dark" })`

- [ ] **Step 6: Commit**

  ```bash
  git add src/components/AuthComponents.ts
  git commit -m "Update avatar dropdown: icons + email as non-interactive item in same group as Log Out"
  ```

---

## Task 3 — Update pages to use `nonInteractive: true` for email in mobile menu

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/pages/about.astro`
- Modify: `src/pages/help/notation-formats.astro`
- Modify: `src/pages/score/[slug].astro`

### What and why

All four pages define `authItems` the same way when a user is logged in. The email item currently uses `action: () => {}` (a noop) — it is clickable (closes the menu) and shows a hover background, which misleads the user into thinking it does something. Replacing this with `nonInteractive: true` removes the hover state, changes the cursor, and applies secondary color — making it visually consistent with how it will appear in the avatar dropdown.

The change is identical in all four files:

**Before (in each page's `authItems`):**
```ts
{
  id: 'account',
  label: user.email || 'Account',
  action: () => {},
  icon: getIconHTML(User),
},
```

**After:**
```ts
{
  id: 'account',
  label: user.email || 'Account',
  nonInteractive: true,
  icon: getIconHTML(User),
},
```

### Steps

- [ ] **Step 1: Update `src/pages/index.astro`**

  Find the `authItems` block (around line 94–110). Replace `action: () => {}` with `nonInteractive: true` on the `account` item. Remove the `action` property entirely (don't leave `action: undefined`).

- [ ] **Step 2: Update `src/pages/about.astro`**

  Same change — find the `account` item in `authItems`, replace `action: () => {}` with `nonInteractive: true`.

- [ ] **Step 3: Update `src/pages/help/notation-formats.astro`**

  Same change.

- [ ] **Step 4: Update `src/pages/score/[slug].astro`**

  Same change.

- [ ] **Step 5: Run tests**

  ```bash
  npm test
  ```

  Expected: all tests pass, 0 lint errors.

- [ ] **Step 6: Visual verification — mobile menu**

  With dev server running at `http://localhost:3001`, log in and open the mobile menu (375px viewport):
  1. `emulate({ viewport: "375x667" })`
  2. Click the mobile menu button
  3. Verify email item:
     - Has User icon
     - Secondary text color
     - No hover background when mousing over
     - Cursor is default (not pointer)
  4. Verify Log Out is immediately below email with no divider between them
  5. Log out from the menu — confirm it works

- [ ] **Step 7: Commit**

  ```bash
  git add src/pages/index.astro src/pages/about.astro src/pages/help/notation-formats.astro src/pages/score/[slug].astro
  git commit -m "Use nonInteractive for email item in mobile menu auth group"
  ```

---

## Verification Checklist

Before creating PR, verify all four states:

| State | Email styling | Log Out position | Icons |
|---|---|---|---|
| Mobile menu, logged in | Secondary color, no hover | Last in auth group | ✓ User + LogOut |
| Mobile menu, logged out | n/a | n/a | ✓ LogIn + UserPlus |
| Avatar dropdown, logged in | Secondary color, no hover | Last (below email) | ✓ User + LogOut |
| Avatar dropdown, logged out | n/a (buttons shown instead) | n/a | n/a |
