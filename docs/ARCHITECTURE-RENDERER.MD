# Renderer Library Architecture

**Scope:** This document covers the renderer library architecture. For web platform architecture, see [ARCHITECTURE-PLATFORM.MD](./ARCHITECTURE-PLATFORM.MD).

## Directory Structure

All renderer library code lives in `src/web-component/`:

```
src/web-component/
├── ShakuhachiScore.ts      # Web component wrapper (entry point)
├── renderer/               # High-level rendering API
│   ├── ScoreRenderer.ts    # Main orchestrator
│   ├── RenderOptions.ts    # Configuration
│   ├── ColumnLayoutCalculator.ts
│   ├── Formatter.ts        # Text/symbol formatting
│   ├── ModifierConfigurator.ts
│   ├── SVGRenderer.ts      # Low-level SVG drawing
│   ├── VerticalSystem.ts   # Vertical layout system
│   └── convenience.ts      # Factory functions
├── parser/                 # Data parsing
│   ├── ScoreParser.ts      # ScoreData → ShakuNote[]
│   ├── MusicXMLParser.ts   # MusicXML → ScoreData
│   ├── MusicXMLSerializer.ts
│   ├── ABCParser.ts        # ABC notation → ScoreData
│   └── ABCSerializer.ts
├── notes/
│   └── ShakuNote.ts        # Note primitive
├── modifiers/              # Visual decorations
│   ├── Modifier.ts         # Base class
│   ├── AtariModifier.ts
│   ├── DurationDotModifier.ts
│   ├── DurationLineModifier.ts
│   ├── MeriKariModifier.ts
│   ├── OctaveMarksModifier.ts
│   └── TestModifier.ts     # Testing helper
├── types/
│   └── ScoreData.ts        # Core data types
└── constants/              # Kinko symbols, mappings, layout
```

- All renderer code in one place for future npm package extraction
- No dependencies on platform code (one-way: platform → renderer)

## Layer Diagram

```
┌─────────────────────────────────────────┐
│     Web Component (ShakuhachiScore)     │  ← Embedding API
├─────────────────────────────────────────┤
│     High-Level API (ScoreRenderer)      │  ← Developer API
├─────────────────────────────────────────┤
│   Layout (ColumnLayoutCalculator)       │
│   Modifiers (ModifierConfigurator)      │
│   Formatting (Formatter, VerticalSystem)│
├─────────────────────────────────────────┤
│   Parsing (MusicXMLParser, ScoreParser) │
├─────────────────────────────────────────┤
│   Primitives (ShakuNote, Modifiers)     │
├─────────────────────────────────────────┤
│   Rendering (SVGRenderer)              │  ← Low-level SVG
└─────────────────────────────────────────┘
```

## Web Component

The renderer is wrapped as a custom element `<shakuhachi-score>`:

```html
<shakuhachi-score data-score='{"notes":[...]}'></shakuhachi-score>
<shakuhachi-score columns="6" data-score='...'></shakuhachi-score>
<shakuhachi-score auto-resize="false" data-score='...'></shakuhachi-score>
```

**Attributes:**
- `data-score` - JSON score data (required, must contain `notes` array)
- `columns` - `"auto"` (default), `"1"` (single column), or explicit number
- `auto-resize` - Enable ResizeObserver (default: `true`)
- `debug` - Show debug labels (optional)

**Build:** `npm run build:wc` → `public/embed/shakuhachi-score.js` (IIFE, ~25KB)

## Rendering Pipeline

```
1. Load     renderFromURL() → MusicXMLParser → ScoreData
2. Parse    ScoreParser.parse() → ShakuNote[]
3. Configure ModifierConfigurator.configureModifiers()
4. Layout   ColumnLayoutCalculator.calculateLayout()
5. Render   For each note: note.setPosition() → note.render(svgRenderer)
```

## Core Principles

**Data vs Presentation:** ScoreData describes WHAT (pitches, durations, markers). The renderer determines HOW (column layout, positioning, styling). Never put presentation logic in data.

**Composition over inheritance:** Modifiers are added to notes. Layout uses a calculator. Renderer uses a configurator.

**VexFlow-inspired:** Constructor takes container + options. Explicit render() calls. Separation of data and presentation.

## Extension Points

**New modifiers:** Extend `Modifier` base class, implement `render()`, add to `ModifierConfigurator` if needed.

**New options:** Add to `RenderOptions` interface and `DEFAULT_RENDER_OPTIONS`.

**New formats:** Add parser/serializer pair in `parser/`, wire into `src/utils/format-converter.ts`.

## Usage

### NPM Package

```typescript
import { ScoreRenderer } from 'shakuhachi-ro';
const renderer = new ScoreRenderer(container, options);
await renderer.renderFromScoreData(scoreData);
```

### Standalone Script

```html
<script src="/embed/shakuhachi-score.js"></script>
<shakuhachi-score data-score='{"notes":[]}'></shakuhachi-score>
```

## Testing

- **Unit tests:** Vitest, co-located (`*.test.ts`) — options, modifiers, layout, parsing
- **Visual tests:** Playwright visual regression (`npm run test:visual`)
- **Manual:** Chrome DevTools MCP for interactive verification
