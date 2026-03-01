# Shakuhachi.ro

A web platform for sharing shakuhachi scores, built on a standalone notation renderer.

## Using the Platform

Share and discover shakuhachi scores:

- Browse the score library
- Create new scores or fork existing ones
- Share scores via links (works on mobile)
- Edit scores with live preview

Visit: **https://shakuhachi.ro**

---

## Using the Renderer (For Developers)

The platform is powered by a standalone TypeScript/SVG renderer that you can use in your own projects, similar to how VexFlow works for Western notation.

### Features

- **Simple API** - Render scores with one line of code
- **SVG Rendering** - Clean, scalable vector graphics
- **Vertical Layout** - Traditional Japanese vertical columns (縦書き) reading right-to-left
- **Kinko Notation** - Support for ロ (ro), ツ (tsu), レ (re), チ (chi), リ (ri), etc.
- **Modifiers** - Octave marks (乙甲), meri/kari pitch marks, atari technique marks
- **MusicXML Import** - Load scores from MusicXML files
- **Type-Safe** - Full TypeScript support with comprehensive type definitions
- **Zero Framework Dependencies** - Pure vanilla TypeScript/JavaScript

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Visit http://localhost:3000 (or port shown in terminal)

## Usage

### Simple One-Line Rendering

```javascript
import { renderScoreFromURL } from 'shakuhachi-ro';

// Render a score from MusicXML
await renderScoreFromURL(
  document.getElementById('container'),
  '/data/Akatombo.musicxml',
);
```

### With Options

```javascript
import { renderScoreFromURL } from 'shakuhachi-ro';

await renderScoreFromURL(container, '/score.musicxml', {
  showOctaveMarks: false, // Hide octave marks
  notesPerColumn: 8, // 8 notes per column
  showDebugLabels: true, // Show note names
});
```

### Class-Based API

```javascript
import { ScoreRenderer } from 'shakuhachi-ro';

const renderer = new ScoreRenderer(container, {
  notesPerColumn: 10,
  showOctaveMarks: true,
});

await renderer.renderFromURL('/score.musicxml');

// Dynamic updates
renderer.setOptions({ showDebugLabels: true });
renderer.resize(1200, 800);
```

### From ScoreData

```javascript
import { renderScore } from 'shakuhachi-ro';

// Minimal - just notes
const minimalScore = {
  notes: [
    { pitch: { step: 'ro', octave: 0 }, duration: 1 },
    { pitch: { step: 'tsu', octave: 0 }, duration: 1, meri: true },
    { pitch: { step: 'chi', octave: 1 }, duration: 2 },
  ],
};

await renderScore(container, minimalScore);

// With optional metadata
const fullScore = {
  title: 'My Score',
  style: 'kinko',
  composer: 'Traditional',
  notes: [
    { pitch: { step: 'ro', octave: 0 }, duration: 1 },
    { pitch: { step: 'tsu', octave: 0 }, duration: 1, meri: true },
    { pitch: { step: 'chi', octave: 1 }, duration: 2 },
  ],
};

await renderScore(container, fullScore);
```

### Web Component (Embed on Any Website)

The easiest way to embed shakuhachi notation on any website:

```html
<!-- Include the script once -->
<script src="https://shakuhachi.ro/embed/shakuhachi-score.js"></script>

<!-- Minimal usage - just notes -->
<shakuhachi-score data-score='{
  "notes": [
    { "pitch": { "step": "ro", "octave": 0 }, "duration": 1 },
    { "pitch": { "step": "tsu", "octave": 0 }, "duration": 1 },
    { "pitch": { "step": "chi", "octave": 1 }, "duration": 2 }
  ]
}'></shakuhachi-score>

<!-- With optional metadata -->
<shakuhachi-score data-score='{
  "title": "My Score",
  "style": "kinko",
  "composer": "Traditional",
  "notes": [...]
}'></shakuhachi-score>
```

**Data Format:**
- `notes` (required) - Array of note objects
- `title` (optional) - Score title for display
- `style` (optional) - Notation style: "kinko" or "tozan"
- `composer`, `tempo`, `key` (optional) - Additional metadata

**Attributes:**
- `columns="auto"` (default) - Auto-detect layout based on container height
- `columns="1"` - Single column with intrinsic height
- `columns="6"` - Exactly 6 columns
- `auto-resize="false"` - Disable ResizeObserver (enabled by default)
- `width`/`height` - Explicit dimensions (overrides CSS)

**Styling with CSS:**
```css
shakuhachi-score {
  width: 100%;
  height: 500px;
}
```

## Configuration Options

Full list of available options:

```typescript
{
  // Display
  showOctaveMarks: true,      // Show octave marks (乙, 甲)
  showDebugLabels: false,     // Show romanji labels

  // Layout
  notesPerColumn: 10,         // Notes per column before breaking
  columnSpacing: 35,          // Space between columns
  columnWidth: 100,           // Width allocated per column

  // Typography
  noteFontSize: 28,           // Note character size
  noteFontWeight: 400,        // Note font weight
  noteVerticalSpacing: 44,    // Vertical space between notes

  // Modifiers
  octaveMarkFontSize: 12,     // Octave mark size
  meriKariFontSize: 14,       // Meri/kari mark size

  // Viewport
  width: 800,                 // SVG width (auto-detect if not specified)
  height: 600                 // SVG height (auto-detect if not specified)
}
```

See [docs/API.MD](./docs/API.MD) for complete API reference.

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run tests once
npm run test:run

# With coverage
npm run test:coverage
```

### Visual Tests

```bash
# Start dev server
npm run dev

# Visit test pages:
# http://localhost:3000/test-octave-marks.html
# http://localhost:3000/test-meri-kari.html
```

### Visual Regression Tests

```bash
# Run Playwright visual tests
npm run test:visual
```

## Documentation

- **[API.MD](./docs/API.MD)** - Complete API reference with examples
- **[ARCHITECTURE-RENDERER.MD](./docs/ARCHITECTURE-RENDERER.MD)** - Renderer library architecture
- **[ARCHITECTURE-PLATFORM.MD](./docs/ARCHITECTURE-PLATFORM.MD)** - Web platform architecture
- **[TODO.md](./TODO.md)** - Project roadmap and active tasks
- **[CLAUDE.md](./CLAUDE.md)** - Development workflow and coding standards

## API Reference (Quick Overview)

### High-Level API

```typescript
// Convenience functions (recommended)
renderScoreFromURL(container, url, options?): Promise<ScoreRenderer>
renderScore(container, scoreData, options?): Promise<ScoreRenderer>

// Class-based (for more control)
new ScoreRenderer(container, options?)
  .renderFromURL(url): Promise<void>
  .renderFromScoreData(scoreData): Promise<void>
  .renderNotes(notes): void
  .setOptions(options, autoRefresh?): void
  .refresh(): void
  .resize(width, height): void
  .clear(): void
```

### Note Symbols (Kinko-ryū)

- `'ro'` (ロ) - Lowest note
- `'tsu'` (ツ)
- `'re'` (レ)
- `'chi'` (チ)
- `'ri'` (リ)
- `'u'` (ウ)
- `'hi'` (ヒ) - Highest basic note

### Modifiers

- **Octave marks** (乙, 甲) - Indicate register changes
- **Meri/Kari** (メ, 中, 大) - Pitch alterations
- **Duration dots** - Extended note duration
- **Atari** - Technique marks

## Architecture

VexFlow-inspired design with clear separation of concerns:

```
ScoreRenderer (High-level API)
    ↓
RenderOptions (Configuration)
    ↓
ModifierConfigurator (Modifier setup)
    ↓
ColumnLayoutCalculator (Layout calculation)
    ↓
SVGRenderer (Drawing primitives)
```

Key principles:

- **Separation of Concerns** - Each component has one responsibility
- **Data vs Presentation** - Score data is separate from rendering
- **Type Safety** - Full TypeScript support
- **VexFlow Patterns** - Constructor + options, fluent API, explicit render()

See [docs/ARCHITECTURE-RENDERER.MD](./docs/ARCHITECTURE-RENDERER.MD) for details.

## Project Structure

```
src/
  ├── renderer/         # Rendering system
  │   ├── ScoreRenderer.ts           # High-level API
  │   ├── convenience.ts             # Factory functions
  │   ├── RenderOptions.ts           # Configuration
  │   ├── ModifierConfigurator.ts    # Modifier configuration
  │   ├── ColumnLayoutCalculator.ts  # Layout calculation
  │   └── SVGRenderer.ts             # SVG drawing primitives
  ├── parser/           # Score parsing
  │   ├── MusicXMLParser.ts          # MusicXML import
  │   └── ScoreParser.ts             # Score data conversion
  ├── notes/            # Note classes
  │   └── ShakuNote.ts               # Shakuhachi note
  ├── modifiers/        # Modifier system
  │   ├── OctaveMarksModifier.ts     # Octave marks (乙甲)
  │   ├── MeriKariModifier.ts        # Meri/kari marks
  │   ├── DurationDotModifier.ts     # Duration dots
  │   └── AtariModifier.ts           # Technique marks
  ├── data/             # Symbol mappings and constants
  └── types/            # TypeScript type definitions

docs/                   # Documentation
tests/                  # Test files
reference/              # Reference materials (scores, fingering charts, score data)
```

## Examples

See `index.html` for a complete working example:

```html
<div id="score-container"></div>

<script type="module">
  import { renderScoreFromURL } from '/src/renderer/convenience';

  await renderScoreFromURL(
    document.getElementById('score-container'),
    '/data/Akatombo.musicxml',
    { showOctaveMarks: true },
  );
</script>
```

## Migration from Old API

### Before (Low-level API)

```javascript
// ~200 lines of manual rendering code
const scoreData = await MusicXMLParser.parseFromURL(url);
const notes = ScoreParser.parse(scoreData);
const renderer = new SVGRenderer(container, width, height);
// ... manual modifier configuration
// ... manual layout calculation
// ... manual rendering loops
```

### After (ScoreRenderer API)

```javascript
// One line
await renderScoreFromURL(container, url);
```

**Result**: 95% code reduction while maintaining full functionality.

## Contributing

This is a personal project. For development workflow, see [CLAUDE.md](./CLAUDE.md).

## License

See LICENSES.md

---

**Built with vanilla TypeScript • No framework required • Works everywhere**
