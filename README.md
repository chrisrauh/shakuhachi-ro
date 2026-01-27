# Shakuhachi.ro

A standalone shakuhachi notation renderer built with vanilla TypeScript and SVG. Clean, focused, and framework-agnostic.

## Features

- **SVG Rendering** - Clean, scalable vector graphics
- **Vertical Layout** - Traditional Japanese vertical columns (縦書き) reading right-to-left
- **Kinko Notation** - Support for ロ (ro), ツ (tsu), レ (re), チ (chi), リ (ri), etc.
- **Modifiers** - Octave dots, meri/kari pitch marks, atari technique marks
- **Duration Spacing** - Automatic spacing based on note duration
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

Visit http://localhost:5173 (or port shown in terminal)

## Testing

This project uses both **unit tests** (Vitest) and **visual browser tests**.

```bash
# Run unit tests
npm test

# Run unit tests once
npm run test:run

# Run with coverage
npm run test:coverage

# Visual tests - start dev server and visit test/ files in browser
npm run dev
# Then navigate to: http://localhost:3000/test/test-parser.html
```

See [test/README.md](test/README.md) for detailed testing guide.

## Demos

Open these files in your browser after starting the dev server:

- **demo.html** - Polished example with Akatombo (Red Dragonfly)
- **test-vertical.html** - Vertical layout demo
- **test-formatter.html** - Duration spacing demo
- **test-shakunote.html** - Notes with modifiers
- **index.html** - All component tests

## Usage

### Basic Example

```javascript
import { SVGRenderer } from './src/renderer/SVGRenderer.js';
import { VerticalSystem } from './src/renderer/VerticalSystem.js';
import { ShakuNote } from './src/notes/ShakuNote.js';
import { OctaveDotsModifier } from './src/modifiers/OctaveDotsModifier.js';

// Create renderer
const container = document.getElementById('score');
const renderer = new SVGRenderer(container, 800, 600);

// Create notes
const notes = [
  new ShakuNote({ symbol: 'ro', duration: 'q' }),
  new ShakuNote({ symbol: 'tsu', duration: 'q' })
    .addModifier(new OctaveDotsModifier(1, 'above')),
  new ShakuNote({ symbol: 're', duration: 'h' })
];

// Render in vertical columns
const system = new VerticalSystem({
  notesPerColumn: 5,
  columnSpacing: 120
});

system.renderColumns(notes, renderer);
```

### Creating Notes

**Basic note:**
```javascript
new ShakuNote({ symbol: 'ro', duration: 'q' })
```

**With octave dots (high):**
```javascript
new ShakuNote({ symbol: 'tsu', duration: 'q' })
  .addModifier(new OctaveDotsModifier(1, 'above'))
```

**With pitch alteration (meri - lower pitch):**
```javascript
new ShakuNote({ symbol: 'chi', duration: 'h' })
  .addModifier(new MeriKariModifier('meri'))
```

**With technique mark (atari - finger pop):**
```javascript
new ShakuNote({ symbol: 're', duration: 'q' })
  .addModifier(new AtariModifier('chevron'))
```

### API Reference

**Note Symbols (Kinko-ryū):**
- `'ro'` (ロ) - Lowest note
- `'tsu'` (ツ)
- `'re'` (レ)
- `'chi'` (チ)
- `'ri'` (リ)
- `'u'` (ウ)
- `'hi'` (ヒ) - Highest basic note

**Durations:**
- `'q'` - Quarter note
- `'h'` - Half note
- `'w'` - Whole note
- `'e'` - Eighth note
- `'s'` - Sixteenth note

**Modifiers:**
- `OctaveDotsModifier(count, position)` - Octave indicators
  - `count`: 1 or 2 dots
  - `position`: 'above' (daikan/high) or 'below' (otsu/low)
- `MeriKariModifier(type)` - Pitch alterations
  - `type`: 'meri' (lower) or 'kari' (raise)
- `AtariModifier(style)` - Technique mark
  - `style`: 'chevron' for finger pop

## Architecture

Inspired by VexFlow's proven patterns but built from scratch for shakuhachi:

- **SVGRenderer** - Low-level drawing primitives (text, lines, circles, paths)
- **Formatter** - Automatic spacing based on note duration
- **VerticalSystem** - Traditional vertical layout manager with right-to-left columns
- **ShakuNote** - Note class with modifier support
- **Modifiers** - Composable decorations (octave dots, meri/kari, atari)

## Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture, design patterns, and implementation details
- **[TODO.md](./TODO.md)** - Active tasks and project roadmap
- **[CLAUDE.md](./CLAUDE.md)** - Development workflow and coding standards (for Claude Code)

## Project Structure

```
src/
  ├── renderer/         # Core rendering system
  ├── notes/            # Note classes
  ├── modifiers/        # Modifier system
  └── data/             # Symbol mappings

references/             # Reference materials (scores, fingering charts)
tests/                  # Test files
```

## Contributing

This is a personal project. For development workflow, see [CLAUDE.md](./CLAUDE.md).

## License

See LICENSES.md

---

**Built with vanilla TypeScript • No framework required • Works everywhere**
