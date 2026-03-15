# Header Initialization Refactor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate ~90 lines of duplicated header initialization boilerplate from all pages, move initialization into `SiteHeader.astro`, fix modal ownership, and smooth the auth widget appearance with a CSS transition.

**Architecture:** `SiteHeader.astro` owns a `<script>` that calls `initHeader()`. `initHeader` reads a `data-menu-type` attribute (set server-side via a `mobileMenuType` prop) to select the right mobile menu builder. All menu builders and helpers live in `init-header.ts`. `HeaderModal` is created top-level and injected into `AuthWidget` rather than owned internally.

**Tech Stack:** Astro, TypeScript, Vitest, Lucide icons, Supabase auth, CSS grid transitions

**Spec:** `docs/superpowers/specs/2026-03-14-header-init-refactor-design.md`

---

## Chunk 1: HeaderModal rename + AuthWidget constructor injection

**Files:**
- Modify: `src/components/AuthComponents.ts`
- Modify: `src/components/AuthComponents.test.ts`

### Task 1: Rename `AuthModal` → `HeaderModal` and inject it into `AuthWidget`

- [ ] **Step 1: Verify existing tests pass before touching anything**

```bash
npm test
```
Expected: all tests pass.

- [ ] **Step 2: Update `AuthComponents.test.ts` to use the new constructor signature**

The test currently calls `new AuthWidget('test-auth-widget')`. Update it to pass a mock `HeaderModal`:

```ts
// src/components/AuthComponents.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getInitials } from './AuthComponents';

describe('getInitials', () => {
  it('returns first two characters of local part, uppercased', () => {
    expect(getInitials('chris@example.com')).toBe('CH');
  });

  it('works with dots in local part', () => {
    expect(getInitials('john.doe@example.com')).toBe('JO');
  });

  it('works with plus-sign aliases', () => {
    expect(getInitials('chris+test@rauh.net')).toBe('CH');
  });

  it('returns single character when local part has only one character', () => {
    expect(getInitials('j@example.com')).toBe('J');
  });

  it('returns ? when local part is empty', () => {
    expect(getInitials('@example.com')).toBe('?');
  });

  it('returns ? for empty string', () => {
    expect(getInitials('')).toBe('?');
  });
});

// vi.mock must be at top level — not inside beforeEach — for Vitest hoisting to work
vi.mock('../api/auth', () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
}));

describe('AuthWidget avatar render', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="test-auth-widget"></div>';
  });

  it('renders avatar button with initials when user is set', async () => {
    const { AuthWidget, HeaderModal } = await import('./AuthComponents');
    const headerModal = new HeaderModal();
    const widget = new AuthWidget('test-auth-widget', headerModal);
    widget.setUser({ email: 'chris@example.com' } as never);

    const container = document.getElementById('test-auth-widget')!;
    const avatarBtn = container.querySelector('.auth-avatar-btn');
    expect(avatarBtn).not.toBeNull();
    expect(avatarBtn!.textContent?.trim()).toBe('CH');
  });

  it('does not render avatar button when no user is set', async () => {
    const { AuthWidget, HeaderModal } = await import('./AuthComponents');
    const headerModal = new HeaderModal();
    const widget = new AuthWidget('test-auth-widget', headerModal);
    widget.setUser(null);

    const container = document.getElementById('test-auth-widget')!;
    expect(container.querySelector('.auth-avatar-btn')).toBeNull();
  });
});
```

- [ ] **Step 3: Run tests — expect failure** (`AuthWidget` constructor signature mismatch)

```bash
npm test
```
Expected: test failures mentioning `AuthWidget` constructor.

- [ ] **Step 4: Rename `AuthModal` → `HeaderModal` in `AuthComponents.ts`**

In `src/components/AuthComponents.ts`:
- Rename the class `AuthModal` to `HeaderModal` (line 24)
- Export it: `export class HeaderModal`
- Change `AuthWidget` constructor from `constructor(containerId: string)` to `constructor(containerId: string, headerModal: HeaderModal)`
- Remove `this.authModal = new AuthModal();` from the constructor body
- Add `this.authModal = headerModal;` in its place
- Rename the private field `authModal` to `headerModal` (update all references within the class)
- Remove the `getAuthModal()` public method (lines 246–248)

The updated constructor:

```ts
export class AuthWidget {
  private container: HTMLElement;
  private headerModal: HeaderModal;
  private currentUser: User | null = null;
  private menuDropdown: MenuDropdown;

  constructor(containerId: string, headerModal: HeaderModal) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(STRING_FACTORIES.containerNotFound(containerId));
    }
    this.container = container;
    this.headerModal = headerModal;
    this.menuDropdown = new MenuDropdown();
    this.render();

    window.addEventListener('auth-change', ((e: CustomEvent) => {
      this.currentUser = e.detail;
      this.render();
    }) as EventListener);
  }
```

Update all internal references: anywhere `this.authModal` is used (e.g., in `render()` to pass to `MenuDropdown`), change to `this.headerModal`.

- [ ] **Step 5: Run tests**

```bash
npm test
```
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/AuthComponents.ts src/components/AuthComponents.test.ts
git commit -m "Rename AuthModal to HeaderModal, inject into AuthWidget constructor"
```

---

## Chunk 2: Rewrite `init-header.ts` with builders and tests

**Files:**
- Modify: `src/utils/init-header.ts`
- Create: `src/utils/init-header.test.ts`

### Task 2: Write tests for the new builder functions

- [ ] **Step 1: Create `src/utils/init-header.test.ts` with failing tests**

```ts
// src/utils/init-header.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildNavItems, buildAuthItems, buildUtilityItems } from './init-header';
import type { User } from '@supabase/supabase-js';

// Mock dependencies that have side effects
vi.mock('../components/Toast', () => ({
  toast: { error: vi.fn() },
}));
vi.mock('./create-score-handler', () => ({
  createEmptyScore: vi.fn(),
}));
vi.mock('../api/auth', () => ({
  signOut: vi.fn(),
  onAuthReady: vi.fn(),
}));

const mockHeaderModal = { show: vi.fn() };

describe('buildNavItems', () => {
  it('returns browse and create items', () => {
    const items = buildNavItems();
    expect(items).toHaveLength(2);
    expect(items[0].id).toBe('browse');
    expect(items[1].id).toBe('create');
  });

  it('browse item links to /', () => {
    const items = buildNavItems();
    expect(items[0].href).toBe('/');
  });

  it('create item has an action function', () => {
    const items = buildNavItems();
    expect(typeof items[1].action).toBe('function');
  });
});

describe('buildAuthItems', () => {
  it('returns login and signup items when logged out', () => {
    const items = buildAuthItems(null, mockHeaderModal as never);
    expect(items).toHaveLength(2);
    expect(items[0].id).toBe('login');
    expect(items[1].id).toBe('signup');
  });

  it('login item calls headerModal.show("login")', () => {
    const items = buildAuthItems(null, mockHeaderModal as never);
    items[0].action!();
    expect(mockHeaderModal.show).toHaveBeenCalledWith('login');
  });

  it('signup item calls headerModal.show("signup")', () => {
    const items = buildAuthItems(null, mockHeaderModal as never);
    items[1].action!();
    expect(mockHeaderModal.show).toHaveBeenCalledWith('signup');
  });

  it('returns email and logout items when logged in', () => {
    const user = { email: 'chris@example.com', id: 'u1' } as User;
    const items = buildAuthItems(user, mockHeaderModal as never);
    expect(items).toHaveLength(2);
    expect(items[0].id).toBe('account');
    expect(items[1].id).toBe('logout');
  });

  it('account item is non-interactive and shows email', () => {
    const user = { email: 'chris@example.com', id: 'u1' } as User;
    const items = buildAuthItems(user, mockHeaderModal as never);
    expect(items[0].nonInteractive).toBe(true);
    expect(items[0].label).toBe('chris@example.com');
  });
});

describe('buildUtilityItems', () => {
  it('returns theme, help, and about items', () => {
    const items = buildUtilityItems();
    expect(items.map((i) => i.id)).toEqual(['theme', 'help', 'about']);
  });

  it('help item links to /help/notation-formats', () => {
    const items = buildUtilityItems();
    expect(items[1].href).toBe('/help/notation-formats');
  });

  it('about item links to /about', () => {
    const items = buildUtilityItems();
    expect(items[2].href).toBe('/about');
  });

  it('theme toggle action flips data-theme attribute', () => {
    document.documentElement.setAttribute('data-theme', 'light');
    const items = buildUtilityItems();
    items[0].action!();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    items[0].action!();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
```

- [ ] **Step 2: Run the tests — expect failure** (functions not yet exported)

```bash
npm test
```
Expected: import errors for `buildNavItems`, `buildAuthItems`, `buildUtilityItems`.

### Task 3: Rewrite `init-header.ts`

- [ ] **Step 3: Replace the contents of `src/utils/init-header.ts`**

```ts
import {
  createElement,
  Book,
  Plus,
  Info,
  HelpCircle,
  SunMoon,
  LogIn,
  LogOut,
  User,
  UserPlus,
  SquarePen,
  Trash2,
} from 'lucide';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { AuthWidget, HeaderModal } from '../components/AuthComponents';
import { MobileMenu, type MenuItem } from '../components/MobileMenu';
import { onAuthReady, signOut } from '../api/auth';
import { createEmptyScore } from './create-score-handler';
import { toast } from '../components/Toast';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export function getIconHTML(
  iconComponent: Parameters<typeof createElement>[0],
): string {
  const icon = createElement(iconComponent);
  icon.setAttribute('width', '16');
  icon.setAttribute('height', '16');
  icon.setAttribute('stroke-width', '2');
  return icon.outerHTML;
}

export function buildNavItems(): MenuItem[] {
  return [
    {
      id: 'browse',
      label: 'Library',
      href: '/',
      icon: getIconHTML(Book),
    },
    {
      id: 'create',
      label: 'Create score',
      action: async () => {
        const result = await createEmptyScore();
        if (result.error) {
          toast.error(result.error.message, { duration: Infinity });
        } else {
          window.location.href = `/score/${result.slug}/edit`;
        }
      },
      icon: getIconHTML(Plus),
    },
  ];
}

export function buildAuthItems(
  user: SupabaseUser | null,
  headerModal: HeaderModal,
): MenuItem[] {
  return user
    ? [
        {
          id: 'account',
          label: user.email || 'Account',
          nonInteractive: true,
          icon: getIconHTML(User),
        },
        {
          id: 'logout',
          label: 'Log Out',
          action: async () => {
            await signOut();
          },
          icon: getIconHTML(LogOut),
        },
      ]
    : [
        {
          id: 'login',
          label: 'Log In',
          action: () => headerModal.show('login'),
          icon: getIconHTML(LogIn),
        },
        {
          id: 'signup',
          label: 'Sign Up',
          action: () => headerModal.show('signup'),
          icon: getIconHTML(UserPlus),
        },
      ];
}

export function buildUtilityItems(): MenuItem[] {
  const toggleTheme = () => {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
  };
  return [
    {
      id: 'theme',
      label: 'Toggle theme',
      action: toggleTheme,
      icon: getIconHTML(SunMoon),
    },
    {
      id: 'help',
      label: 'Help',
      href: '/help/notation-formats',
      icon: getIconHTML(HelpCircle),
    },
    {
      id: 'about',
      label: 'About',
      href: '/about',
      icon: getIconHTML(Info),
    },
  ];
}

function standardMenuBuilder(
  user: SupabaseUser | null,
  headerModal: HeaderModal,
): MenuItem[][] {
  return [buildNavItems(), buildAuthItems(user, headerModal), buildUtilityItems()];
}

function scoreEditMenuBuilder(
  user: SupabaseUser | null,
  headerModal: HeaderModal,
): MenuItem[][] {
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

  const extraItems: MenuItem[] = isOwner
    ? [
        {
          id: 'edit',
          label: 'Edit score',
          href: (document.getElementById('edit-btn') as HTMLAnchorElement)?.href,
          icon: getIconHTML(SquarePen),
        },
        {
          id: 'delete',
          label: 'Delete score',
          action: () =>
            (document.getElementById('delete-btn') as HTMLButtonElement)?.click(),
          icon: getIconHTML(Trash2),
        },
      ]
    : [];

  return [
    ...(extraItems.length > 0 ? [extraItems] : []),
    buildNavItems(),
    buildAuthItems(user, headerModal),
    buildUtilityItems(),
  ];
}

const MENU_BUILDERS: Record<
  string,
  (user: SupabaseUser | null, headerModal: HeaderModal) => MenuItem[][]
> = {
  standard: standardMenuBuilder,
  'score-edit': scoreEditMenuBuilder,
};

export function initHeader(): void {
  new ThemeSwitcher('theme-switcher');

  if (import.meta.env.DEV) {
    import('../components/LetterSpacingControl').then(({ LetterSpacingControl }) => {
      new LetterSpacingControl('letter-spacing-control');
    });
  }

  const headerModal = new HeaderModal();
  const authWidget = new AuthWidget('auth-widget', headerModal);
  const mobileMenu = new MobileMenu('mobile-menu');

  const menuContainer = document.getElementById('mobile-menu');
  const menuType = menuContainer?.dataset.menuType ?? 'standard';
  const builder = MENU_BUILDERS[menuType] ?? standardMenuBuilder;

  onAuthReady((user) => {
    authWidget.setUser(user);
    mobileMenu.setItems(builder(user, headerModal));
  });
}
```

- [ ] **Step 4: Run tests**

```bash
npm test
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/init-header.ts src/utils/init-header.test.ts
git commit -m "Rewrite init-header: builders, scoreEditMenuBuilder, HeaderModal injection"
```

---

## Chunk 3: Update `SiteHeader.astro` and `Layout.astro`

**Files:**
- Modify: `src/components/SiteHeader.astro`
- Modify: `src/layouts/Layout.astro`

### Task 4: Add `mobileMenuType` prop, script, and auth widget CSS to `SiteHeader.astro`

- [ ] **Step 1: Add the prop interface and `data-menu-type` attribute**

In `src/components/SiteHeader.astro`, add a frontmatter section and update the mobile menu container:

```astro
---
import { Book, Plus, Info } from '@lucide/astro';

interface Props {
  mobileMenuType?: 'standard' | 'score-edit';
}
const { mobileMenuType = 'standard' } = Astro.props;
---
```

Update the mobile menu container div (currently line 44):

```astro
<div id="mobile-menu" class="mobile-menu-container" data-menu-type={mobileMenuType}></div>
```

- [ ] **Step 2: Add the `<script>` block to `SiteHeader.astro`**

Add after the closing `</header>` tag and before `<style>`:

```astro
<script>
  import { initHeader } from '../utils/init-header';
  initHeader();
</script>
```

- [ ] **Step 3: Add the auth widget CSS to the `<style>` block**

Add inside the existing `<style>` in `SiteHeader.astro`, after the existing `#auth-widget` rule:

```css
/* Auth widget expands smoothly from zero width when content is inserted */
#auth-widget {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 0fr;
  transition: grid-template-columns 200ms ease;
  overflow: hidden;
}

#auth-widget:has(*) {
  grid-template-columns: 1fr;
}

#auth-widget > * {
  overflow: hidden;
  min-width: 0;
}
```

Replace the previous `#auth-widget { flex-shrink: 0; }` rule entirely with the block above — `flex-shrink: 0` is preserved inside it.

- [ ] **Step 4: Run tests**

```bash
npm test
```
Expected: all tests pass. (The visual change will be verified later with chrome-devtools-mcp.)

- [ ] **Step 5: Commit**

```bash
git add src/components/SiteHeader.astro
git commit -m "SiteHeader: add mobileMenuType prop, initHeader script, auth widget grid transition"
```

### Task 5: Thread `mobileMenuType` through `Layout.astro`

- [ ] **Step 1: Update `Layout.astro` to accept and pass through the prop**

In `src/layouts/Layout.astro`, update the `Props` interface and destructuring:

```ts
interface Props {
  title: string;
  currentPage: 'browse' | 'create' | 'score';
  fullHeight?: boolean;
  noPadding?: boolean;
  mobileMenuType?: 'standard' | 'score-edit';
}

const { title, currentPage: _currentPage, fullHeight = false, noPadding = false, mobileMenuType } = Astro.props;
```

Update the `<SiteHeader>` usage:

```astro
<SiteHeader mobileMenuType={mobileMenuType}>
  <slot name="header-metadata" slot="header-metadata" />
  <slot name="header-actions" slot="header-actions" />
</SiteHeader>
```

- [ ] **Step 2: Run tests**

```bash
npm test
```
Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/Layout.astro
git commit -m "Layout: thread mobileMenuType prop to SiteHeader"
```

---

## Chunk 4: Clean up pages

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/pages/about.astro`
- Modify: `src/pages/help/notation-formats.astro`
- Modify: `src/pages/score/[slug].astro`

### Task 6: Remove boilerplate from standard pages

- [ ] **Step 1: Clean up `index.astro`**

Remove the entire mobile menu `<script>` block (the one importing lucide, initHeader, MobileMenu, etc. — approximately lines 36–142). Keep:
- The `<script is:inline>` deletion banner block (at the top)
- Add a new `<script>` block with only the page-specific ScoreLibrary init:

```astro
<script>
  import { ScoreLibrary } from '../components/ScoreLibrary';
  new ScoreLibrary('score-library');
</script>
```

- [ ] **Step 2: Clean up `about.astro`**

Remove the entire bundled `<script>` block (the one importing lucide, initHeader, MobileMenu, etc. — approximately lines 26–128). No page-specific client logic remains — no replacement needed.

**Preserve:** `<script is:inline src="/embed/shakuhachi-score.js"></script>` at line 24 must be kept — it loads the shakuhachi score web component used on this page.

- [ ] **Step 3: Clean up `help/notation-formats.astro`**

Same as `about.astro` — remove the entire mobile menu `<script>` block. No replacement needed.

- [ ] **Step 4: Run tests**

```bash
npm test
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro src/pages/about.astro src/pages/help/notation-formats.astro
git commit -m "Remove mobile menu boilerplate from standard pages"
```

### Task 7: Update the slug page

- [ ] **Step 1: Add `mobileMenuType="score-edit"` to the Layout call in `score/[slug].astro`**

Find the `<Layout ...>` opening tag in `score/[slug].astro` and add the prop:

```astro
<Layout title={...} currentPage="score" mobileMenuType="score-edit">
```

- [ ] **Step 2: Remove the mobile menu script block from `score/[slug].astro`**

Remove the large `<script>` block that imports lucide, initHeader, MobileMenu, etc. (approximately lines 112–240). Keep:
- The `<script>import '@github/relative-time-element';</script>` block
- The `<script>import { ScoreDetailClient }...; client.init();</script>` block

- [ ] **Step 3: Run tests**

```bash
npm test
```
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/pages/score/[slug].astro
git commit -m "Slug page: use mobileMenuType prop, remove mobile menu script block"
```

---

## Chunk 5: Visual verification

### Task 8: Verify visually with chrome-devtools-mcp

- [ ] **Step 1: Start dev server if not already running**

```bash
npm run dev
```

- [ ] **Step 2: Verify standard pages (index, about, notation-formats)**

Using chrome-devtools-mcp:
1. Navigate to `http://localhost:3001/`
2. Take screenshot in light mode — verify header renders, auth widget expands smoothly
3. Switch to dark mode — verify header correct
4. Check console for errors: `list_console_messages({ types: ['error', 'warn'] })`
5. Navigate to `http://localhost:3001/about` and `http://localhost:3001/help/notation-formats` — repeat checks

- [ ] **Step 3: Verify auth widget transition**

On any page:
1. Take a screenshot before JS has loaded (or throttle CPU/network to observe the transition)
2. Confirm the auth widget expands from zero rather than popping in
3. Confirm no horizontal layout shift occurs

- [ ] **Step 4: Verify the slug page with score-edit menu**

Navigate to a score detail page (e.g. `http://localhost:3001/score/akatombo`):
1. Verify mobile menu appears and contains Library, Create score, Help, About items
2. Log in with test credentials — verify mobile menu updates to show email + Log Out
3. Navigate to a score owned by the test account — verify Edit score / Delete score appear in the mobile menu
4. Verify the auth widget transition looks correct

- [ ] **Step 5: Run full test suite before finalising**

```bash
npm test
```
Expected: all tests pass (type-check + lint + unit tests).
