# Design Language

This document describes the theme architecture and design token system used in Shakuhachi.ro.

## Token Hierarchy

The design system uses a three-tier token hierarchy:

```
┌─────────────────────────────────────────────────────────────────┐
│                     PURPOSE-BASED TOKENS                        │
│  Describe intent: --color-text-primary, --color-border          │
│  ↓ Reference                                                    │
├─────────────────────────────────────────────────────────────────┤
│                     SEMANTIC PALETTES                           │
│  Role-based colors: --color-primary-*, --color-neutral-*        │
│  ↓ Reference                                                    │
├─────────────────────────────────────────────────────────────────┤
│                     PRIMITIVE TOKENS                            │
│  Raw values: --color-blue-500, --color-gray-700                 │
│  OKLCH color values from Tailwind CSS v4                        │
└─────────────────────────────────────────────────────────────────┘
```

### Why Three Tiers?

1. **Primitives** provide the raw color values. Changing `--color-blue-500` updates all blues.
2. **Semantic Palettes** map roles to primitives. Changing `--color-primary-*` from blue to indigo is one line.
3. **Purpose-Based Tokens** describe what colors are *for*. Components reference these, making theming and dark mode automatic.

## Token Groups

### 1. Primitive Colors

Raw OKLCH color values from the Tailwind CSS v4 palette. These define the actual color values.

**Neutral Families** (for UI chrome, text, backgrounds):
- `--color-slate-*` — Cool gray with blue undertone
- `--color-gray-*` — True neutral gray
- `--color-zinc-*` — Slightly warmer neutral
- `--color-neutral-primitive-*` — Pure neutral (no undertone)
- `--color-stone-*` — Warm gray with slight brown

**Chromatic Families** (for accents, status, branding):
- `--color-red-*` through `--color-rose-*` — Full spectrum

**Scale**: Each family has steps from 25 to 975:
```
25, 50, 75, 100, 150, 200, 250, 300, 350, 400, 450, 500,
550, 600, 650, 700, 750, 800, 850, 900, 925, 950, 975
```

**Absolute Colors**:
- `--color-neutral-0` — Pure white
- `--color-neutral-1000` — Pure black

### 2. Semantic Palettes

Map abstract roles to primitive color families. These allow brand customization without touching component code.

| Palette | Maps To | Purpose |
|---------|---------|---------|
| `--color-primary-*` | `--color-blue-*` | Primary actions, links, focus states |
| `--color-success-*` | `--color-green-*` | Success states, confirmations |
| `--color-warning-*` | `--color-amber-*` | Warnings, caution states |
| `--color-danger-*` | `--color-red-*` | Errors, destructive actions |
| `--color-neutral-*` | `--color-gray-*` | Text, borders, backgrounds |

To change the primary color from blue to indigo:
```css
--color-primary-500: var(--color-indigo-500);
/* ... repeat for all steps */
```

### 3. Purpose-Based Tokens

These describe *what* the color is for, not *what shade* it is. Components should only use these tokens.

#### Text Colors

| Token | Value (Light) | Usage |
|-------|---------------|-------|
| `--color-text-heading` | neutral-900 | Primary headings (h1, h2) |
| `--color-text-primary` | neutral-700 | Body text, main content |
| `--color-text-secondary` | neutral-600 | Metadata, descriptions, labels |
| `--color-text-tertiary` | neutral-500 | Muted text, hints, placeholders |
| `--color-text-disabled` | neutral-400 | Disabled states |
| `--color-text-on-dark` | neutral-0 | Text on colored backgrounds |

#### Border Colors

| Token | Value (Light) | Usage |
|-------|---------------|-------|
| `--color-border` | neutral-300 | Default borders (inputs, cards) |
| `--color-border-subtle` | neutral-200 | Subtle dividers, separators |
| `--color-border-hover` | neutral-400 | Border color on hover |

#### Background Colors

| Token | Value (Light) | Usage |
|-------|---------------|-------|
| `--color-bg-subtle` | neutral-50 | Subtle backgrounds (cards) |
| `--color-bg-hover` | neutral-100 | Hover states |
| `--color-bg-active` | neutral-200 | Active/pressed states |

#### Special Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--color-separator` | neutral-400 | Visual separators between items |
| `--color-logo` | neutral-700 (light), neutral-600 (dark) | Logo color |
| `--color-spinner-track` | neutral-200 | Loading spinner track |

### 4. Component Tokens

Pre-composed tokens for specific UI patterns. These combine multiple purpose-based tokens.

#### Input Tokens

```css
--input-background-color
--input-background-color-hover
--input-background-color-focus
--input-background-color-disabled
--input-border-color
--input-border-color-hover
--input-border-color-focus
--input-color
--input-placeholder-color
--input-focus-ring-color
```

#### Panel Tokens

```css
--page-background-color      /* Page background */
--panel-background-color     /* Card/panel backgrounds */
--panel-border-color         /* Panel borders */
--overlay-background-color   /* Modal overlays */
```

#### Tooltip Tokens

```css
--tooltip-background-color
--tooltip-color
--tooltip-border-radius
```

## Dark Mode

### Strategy: Neutral Inversion

Dark mode works by inverting the neutral color scales:

```
Light Mode          Dark Mode
─────────────       ─────────────
neutral-50    →     neutral-950
neutral-100   →     neutral-900
neutral-200   →     neutral-800
...
neutral-800   →     neutral-200
neutral-900   →     neutral-100
neutral-950   →     neutral-50
```

This means purpose-based tokens automatically adapt. `--color-text-primary: var(--color-neutral-700)` becomes light text in dark mode because `neutral-700` is now a light shade.

### Chromatic Colors Stay the Same

Chromatic colors (blue, green, red, etc.) are not inverted. Blue-500 is the same hue in both modes. This maintains brand consistency and ensures good contrast against dark backgrounds.

### Exceptions

Some tokens need explicit dark mode overrides:

```css
/* Logo needs a specific shade in dark mode */
--color-logo: var(--color-neutral-600); /* lighter than neutral-700 in dark */
```

### Theme Application

1. **System Preference**: `@media (prefers-color-scheme: dark)` applies dark theme automatically
2. **Manual Override**: `data-theme="light"` or `data-theme="dark"` on `:root` overrides system preference

```css
/* System preference (default) */
@media (prefers-color-scheme: dark) {
  :root { /* dark tokens */ }
}

/* Manual override (higher specificity) */
:root[data-theme="dark"] { /* dark tokens */ }
:root[data-theme="light"] { /* light tokens */ }
```

## Non-Color Tokens

### Spacing

Based on Shoelace design system. Uses rem units for accessibility (respects user font size preferences).

```css
--spacing-3x-small: 0.125rem;  /* 2px */
--spacing-2x-small: 0.25rem;   /* 4px */
--spacing-x-small: 0.5rem;     /* 8px */
--spacing-small: 0.75rem;      /* 12px */
--spacing-medium: 1rem;        /* 16px */
--spacing-large: 1.25rem;      /* 20px */
--spacing-x-large: 1.75rem;    /* 28px */
--spacing-2x-large: 2.25rem;   /* 36px */
--spacing-3x-large: 3rem;      /* 48px */
--spacing-4x-large: 4.5rem;    /* 72px */
```

### Border Radius

```css
--border-radius-small: 0.1875rem;   /* 3px */
--border-radius-medium: 0.25rem;    /* 4px */
--border-radius-large: 0.5rem;      /* 8px */
--border-radius-x-large: 1rem;      /* 16px */
--border-radius-circle: 50%;
--border-radius-pill: 9999px;
```

### Typography

```css
/* Sizes */
--font-size-2x-small: 0.625rem;   /* 10px */
--font-size-x-small: 0.75rem;     /* 12px */
--font-size-small: 0.875rem;      /* 14px */
--font-size-medium: 1rem;         /* 16px */
--font-size-large: 1.25rem;       /* 20px */
--font-size-x-large: 1.5rem;      /* 24px */
--font-size-2x-large: 2.25rem;    /* 36px */

/* Weights */
--font-weight-light: 300;
--font-weight-normal: 400;
--font-weight-semibold: 500;
--font-weight-bold: 700;

/* Line Heights */
--line-height-denser: 1;
--line-height-dense: 1.4;
--line-height-normal: 1.8;
--line-height-loose: 2.2;
```

### Shadows

Shadows use gray-500 as the shadow color with varying opacity. In dark mode, shadows use pure black with higher opacity for visibility.

```css
--shadow-x-small: 0 1px 2px oklch(... / 6%);
--shadow-small: 0 1px 2px oklch(... / 12%);
--shadow-medium: 0 2px 4px oklch(... / 12%);
--shadow-large: 0 2px 8px oklch(... / 12%);
--shadow-x-large: 0 4px 16px oklch(... / 12%);
```

### Transitions

```css
--transition-x-slow: 1000ms;
--transition-slow: 500ms;
--transition-medium: 250ms;
--transition-fast: 150ms;
--transition-x-fast: 50ms;
```

### Z-Index

```css
--z-index-drawer: 700;
--z-index-dialog: 800;
--z-index-dropdown: 900;
--z-index-toast: 950;
--z-index-tooltip: 1000;
```

## Usage Guidelines

### Do

```css
/* Use purpose-based tokens */
.heading { color: var(--color-text-heading); }
.card { border: 1px solid var(--color-border); }
.button:hover { background: var(--color-bg-hover); }
```

### Don't

```css
/* Don't use primitives directly in components */
.heading { color: var(--color-gray-900); }        /* Bad */
.card { border: 1px solid var(--color-gray-300); } /* Bad */

/* Don't use raw color values */
.heading { color: #1a1a1a; }  /* Bad */
```

### Adding New Purpose Tokens

When you need a color for a new purpose:

1. Check if an existing purpose token fits
2. If not, add a new token to `themes.css` in the "PURPOSE-BASED SEMANTIC TOKENS" section
3. Define it in both light and dark theme blocks (usually only needs explicit dark override if behavior differs)
4. Document it in this file

Example:
```css
/* In :root (light theme) */
--color-badge-background: var(--color-neutral-100);

/* In dark theme - only if different behavior needed */
/* Usually not needed since neutrals auto-invert */
```

## File Structure

```
src/styles/
├── tokens/
│   └── themes.css       # All design tokens
├── components.css       # Shared component styles
└── global.css          # Global styles and resets
```

## References

- Colors: [Tailwind CSS v4 Colors](https://tailwindcss.com/docs/colors)
- Structure: [Shoelace Design System](https://shoelace.style)
- Color Space: [OKLCH](https://oklch.com) — perceptually uniform color space
