# `<shakuhachi-score>`

Renders shakuhachi notation as SVG. One custom element, no framework, no build step for the consumer.

```html
<script src="/embed/shakuhachi-score.js"></script>

<shakuhachi-score
  data-score='{"notes":[{"pitch":{"step":"ro","octave":0},"duration":1}]}'
></shakuhachi-score>
```

The bundle registers the element on load and renders every instance on the page. It is built from `ShakuhachiScore.ts` by `npm run build:wc` and is **not committed** — `npm run dev` builds it via a `predev` hook.

## Score data

Pass a `ScoreData` object as JSON, either in `data-score` or as the element's text content. `data-score` wins if both are present. Invalid JSON renders a visible error and logs to the console; no data at all renders nothing, on the assumption the attribute is still being set.

```ts
interface ScoreData {
  notes: ScoreNote[]; // flat, in performance order — the only required field
  title?: string;
  style?: 'kinko' | 'tozan';
  composer?: string;
  tempo?: string;
  key?: string;
}

interface ScoreNote {
  duration: number; // 4 = whole, 2 = half, 1 = quarter, 0.5 = eighth
  pitch?: { step: PitchStep; octave: number }; // omit for a rest
  rest?: boolean;
  meri?: boolean; // lowers ~a half step
  chu_meri?: boolean; // between normal and meri
  dai_meri?: boolean; // lowers ~a whole step
  dotted?: boolean; // extends duration by half
}

type PitchStep = 'ro' | 'tsu' | 're' | 'chi' | 'ri' | 'u' | 'hi';
```

`octave` is `0` for otsu (base), `1` for kan, `2` for daikan.

Notes carry no layout information. Column breaks are the renderer's decision — see [Sizing](#sizing).

## Attributes

| Attribute          | Values                                  | Default              | Live |
| ------------------ | --------------------------------------- | -------------------- | ---- |
| `data-score`       | `ScoreData` as JSON                     | —                    | ✅   |
| `columns`          | `auto` or a positive integer            | `auto`               | ✅   |
| `auto-resize`      | `false` disables; anything else enables | enabled              | ✅   |
| `notation-font`    | `sans`, `serif`                         | `sans`               | ✅   |
| `width` / `height` | pixels                                  | measured or computed | ❌   |
| `debug`            | present / absent                        | absent               | ❌   |

**Live** means the element re-renders when the attribute changes. The last two are read at render time but not observed, so set them before the element is connected — changing them later has no effect until something else triggers a render.

`columns` and `notation-font` fall back to their defaults on an unrecognised value; `columns` also warns to the console. `debug` draws romaji labels beside each note.

## Sizing

Two modes, chosen by `columns`:

**`auto` (default) — extrinsic.** The element fills its container and fits as many columns as the height allows. Give it a sized parent:

```html
<div style="height: 80vh">
  <shakuhachi-score data-score="..."></shakuhachi-score>
</div>
```

If the container measures zero, the element falls back to 300×150 so the score is visible rather than blank.

**A number — intrinsic.** The element sizes itself to exactly that many columns and sets its own width. Useful inline in prose, where there is no container to measure:

```html
<shakuhachi-score columns="3" data-score="..."></shakuhachi-score>
```

`columns="3"` measures 410px — `3 × 100` column width, `2 × 35` spacing, `2 × 20` padding.

It sets that width via `:host`, which is the weakest place to declare it: **any page rule for the element wins**. `#score-renderer { flex: 1 }` on the score detail page defeats intrinsic sizing entirely, which is intended there but surprising if you hit it by accident. Style the element from the page only when you mean to take sizing over.

`width` and `height` override either mode.

Initial render is deferred until the browser has laid the element out — at `connectedCallback` its dimensions are still zero. A `ResizeObserver` triggers the first paint, with a 50 ms timeout as a fallback for environments where it never fires.

## Theming

One CSS custom property, set on the element or any ancestor:

```css
shakuhachi-score {
  --shakuhachi-note-color: #1a1a1a;
}
@media (prefers-color-scheme: dark) {
  shakuhachi-score {
    --shakuhachi-note-color: #e8e8e8;
  }
}
```

It resolves through the shadow DOM normally, so it responds to media queries and theme-class changes with no JavaScript. That works because the value reaches the SVG as a literal `var(...)` string for the browser to resolve — nothing re-renders.

Colour is the only thing that can work this way. Font size and note spacing feed layout calculations in JavaScript, and a custom property cannot be observed, so setting one would change the glyphs without moving the positions. Use `notation-font` for the typeface; the rest is not configurable.

Styles are isolated by shadow DOM, so page CSS cannot reach the notation except through the property above.

## Other formats

The element accepts the JSON format only. MusicXML and ABC are converted before they reach it — see `src/utils/format-converter.ts` and the parsers in `parser/`.

## JavaScript

```js
const el = document.querySelector('shakuhachi-score');
el.setAttribute('data-score', JSON.stringify(scoreData)); // re-renders
el.forceRender(); // force one, e.g. after a theme change
```

The element cleans up its renderer on disconnect.

## Scope

This documents the element, which is the whole consumer-facing surface today. The package is `private` and publishes no entry point, so `ScoreRenderer`, `ScoreParser` and the modifiers are internal — reachable by importing their files directly within this repo, but with no stability guarantee.
