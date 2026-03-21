# Design: Handwritten Annotation on Embedded Score (About Page)

**Date:** 2026-03-21
**Status:** Approved

## Summary

Add a handwritten-style annotation to the embedded shakuhachi score on the `/about` page. The annotation points to the middle three notes (チ chi, リ ri, ロ ro — notes 5–7 of 9) and reads "open center / of the face", styled to look like someone took a bic pen to the webpage.

---

## Visual Design

### Typography
- **Font:** Caveat (Google Fonts), weight 400
- **Size:** ~15–18px (scaled for context)
- **Text:** Two lines:
  - Line 1: `open center`
  - Line 2: `of the face`

### Color
- **Single unified gradient** across all annotation elements (bracket, arrow, text)
- `gradientUnits="userSpaceOnUse"` so the gradient spans the full annotation bounding box
- **Bottom (bracket):** `#2255aa` — classic Bic blue
- **Top (text):** `#4a6899` — faded ink
- Two stops, no mid stop

### Annotation Elements
1. **Bracket** — right of the score column divider, spanning チ → ロ vertically
   - Stroke: 1.2px
   - Tick length: 2px (very short, minimal)
   - `stroke-linecap: round`, `stroke-linejoin: round`
2. **Swoopy arrow** — curves from the bracket midpoint up and right toward the text
   - Stroke: 1.2px, `stroke-linecap: round`
   - Open arrowhead (two lines, no fill)
3. **Text** — positioned near the arrowhead, two lines

All three elements share the same SVG `<linearGradient>` defined in `userSpaceOnUse` coordinates so the gradient reads as one continuous pen stroke.

---

## Layout

### Desktop
- The `<shakuhachi-score>` web component stays **perfectly centered** on the page (no change)
- The annotation SVG is **absolutely positioned** to the right of the score container
- Implemented via `position: relative` on the `.score-example` wrapper and `position: absolute; left: 50%` (offset from center) on the annotation SVG
- Annotation can overflow the 720px content column — this is intentional

### Mobile (≤ 768px)
- The score is centered in the **left half** of the screen
- The annotation (bracket + arrow + text) occupies the **right half**
- The entire composition (score + annotation) is centered as a unit on the page
- Implemented as a single SVG element spanning the full available width, with the score occupying the left portion and annotation the right
- The bracket aligns to the right edge of the score column divider; the swoopy arrow points right toward the text

---

## Implementation Notes

- Load Caveat from Google Fonts in `about.astro` (or via Layout.astro if not already present)
- The annotation SVG is added inside the existing `.score-example` div in `about.mdx` (or as a companion element in `about.astro`)
- The gradient is defined once in `<defs>` and referenced by all stroke/fill attributes
- Annotation is hidden on viewports where it would clip or overlap the score unexpectedly — use a CSS media query breakpoint to switch between desktop (absolute) and mobile (inline flex) layouts
- No JavaScript required — pure HTML/CSS/SVG

---

## Files to Modify

1. **`src/content/pages/about.mdx`** — update `.score-example` block to include the annotation SVG
2. **`src/pages/about.astro`** — add Caveat font import and any CSS needed for `.score-example` layout (absolute positioning, mobile flex)

---

## Out of Scope

- Dark mode variation (the bic-blue gradient reads well on both light and dark backgrounds)
- Animation or hover effects
- Any other page or component
