# API Reference

Complete API reference for the Shakuhachi Score Renderer.

## Quick Start

```typescript
import { renderScoreFromURL } from 'shakuhachi-ro';

// Render a score with one line
await renderScoreFromURL(
  document.getElementById('container'),
  '/path/to/score.musicxml'
);
```

## Table of Contents

- [ScoreRenderer](#scorerenderer)
- [Convenience Functions](#convenience-functions)
- [RenderOptions](#renderoptions)
- [Layout Components](#layout-components)
- [Low-Level Components](#low-level-components)

## ScoreRenderer

Main class for rendering shakuhachi notation.

### Constructor

```typescript
new ScoreRenderer(container: HTMLElement, options?: RenderOptions)
```

**Parameters:**
- `container`: DOM element to render into
- `options`: Optional render configuration

**Example:**
```typescript
const renderer = new ScoreRenderer(
  document.getElementById('score'),
  { showOctaveMarks: false, notesPerColumn: 8 }
);
```

### Methods

#### renderFromURL()

```typescript
async renderFromURL(url: string): Promise<void>
```

Loads and renders a score from a MusicXML URL.

**Parameters:**
- `url`: Path to MusicXML file

**Example:**
```typescript
await renderer.renderFromURL('/data/Akatombo.musicxml');
```

#### renderFromScoreData()

```typescript
async renderFromScoreData(scoreData: ScoreData): Promise<void>
```

Renders a score from a ScoreData object.

**Parameters:**
- `scoreData`: Parsed score data

**Example:**
```typescript
const scoreData = {
  title: 'My Score',
  style: 'kinko',
  notes: [
    { pitch: { step: 'ro', octave: 0 }, duration: 1 }
  ]
};
await renderer.renderFromScoreData(scoreData);
```

#### renderNotes()

```typescript
renderNotes(notes: ShakuNote[]): void
```

Renders an array of ShakuNote objects. This is the core rendering method.

**Parameters:**
- `notes`: Array of ShakuNote objects to render

**Example:**
```typescript
const notes = [
  new ShakuNote({ symbol: 'ro' }),
  new ShakuNote({ symbol: 'tsu' })
];
renderer.renderNotes(notes);
```

#### setOptions()

```typescript
setOptions(options: RenderOptions, autoRefresh?: boolean): void
```

Updates render options. By default, automatically re-renders.

**Parameters:**
- `options`: New options to merge with current options
- `autoRefresh`: Whether to automatically re-render (default: true)

**Example:**
```typescript
renderer.setOptions({ showDebugLabels: true });
renderer.setOptions({ notesPerColumn: 5 }, false); // Don't re-render
```

#### refresh()

```typescript
refresh(): void
```

Re-renders the current score with current options.

**Example:**
```typescript
renderer.setOptions({ showOctaveMarks: false }, false);
renderer.refresh(); // Now re-render with new options
```

#### resize()

```typescript
resize(width: number, height: number): void
```

Updates viewport dimensions and re-renders.

**Parameters:**
- `width`: New viewport width
- `height`: New viewport height

**Example:**
```typescript
renderer.resize(1000, 800);
```

#### getOptions()

```typescript
getOptions(): Required<RenderOptions>
```

Returns a copy of current render options.

**Returns:** Complete options object with all values defined

**Example:**
```typescript
const options = renderer.getOptions();
console.log(options.notesPerColumn); // 10
```

#### getNotes()

```typescript
getNotes(): ShakuNote[]
```

Returns a copy of currently rendered notes.

**Returns:** Array of ShakuNote objects

**Example:**
```typescript
const notes = renderer.getNotes();
console.log(notes.length);
```

#### getScoreData()

```typescript
getScoreData(): ScoreData | null
```

Returns the current score data (if loaded from URL or ScoreData).

**Returns:** ScoreData object or null if rendering notes directly

**Example:**
```typescript
const scoreData = renderer.getScoreData();
if (scoreData) {
  console.log(scoreData.title);
}
```

#### clear()

```typescript
clear(): void
```

Clears the rendered score and resets internal state.

**Example:**
```typescript
renderer.clear();
```

## Convenience Functions

Simple one-line functions for common use cases.

### renderScoreFromURL()

```typescript
async function renderScoreFromURL(
  container: HTMLElement,
  url: string,
  options?: RenderOptions
): Promise<ScoreRenderer>
```

Creates a ScoreRenderer and renders from a URL.

**Returns:** ScoreRenderer instance for further manipulation

**Example:**
```typescript
const renderer = await renderScoreFromURL(
  document.getElementById('score'),
  '/data/Akatombo.musicxml',
  { showOctaveMarks: false }
);

// Can still manipulate the renderer
renderer.setOptions({ showDebugLabels: true });
```

### renderScore()

```typescript
async function renderScore(
  container: HTMLElement,
  scoreData: ScoreData,
  options?: RenderOptions
): Promise<ScoreRenderer>
```

Creates a ScoreRenderer and renders from ScoreData.

**Returns:** ScoreRenderer instance for further manipulation

**Example:**
```typescript
const renderer = await renderScore(
  container,
  scoreData,
  { notesPerColumn: 8 }
);
```

## RenderOptions

Configuration interface for rendering.

```typescript
interface RenderOptions {
  // Display Options
  showOctaveMarks?: boolean;        // default: true
  showDebugLabels?: boolean;        // default: false

  // Layout Options
  notesPerColumn?: number;          // default: 10
  columnSpacing?: number;           // default: 35
  columnWidth?: number;             // default: 100
  topMargin?: number;               // default: 34

  // Note Typography
  noteFontSize?: number;            // default: 28
  noteFontWeight?: number;          // default: 400
  noteVerticalSpacing?: number;     // default: 44
  noteFontFamily?: string;          // default: 'Noto Sans JP, sans-serif'
  noteColor?: string;               // default: '#000'

  // Octave Mark Configuration
  octaveMarkFontSize?: number;      // default: 12
  octaveMarkFontWeight?: number;    // default: 500
  octaveMarkOffsetX?: number;       // default: 18
  octaveMarkOffsetY?: number;       // default: -22

  // Meri/Kari Mark Configuration
  meriKariFontSize?: number;        // default: 14
  meriKariFontWeight?: number;      // default: 500

  // Duration Dot Configuration
  durationDotExtraSpacing?: number; // default: 12

  // Debug Label Configuration
  debugLabelFontSize?: number;      // default: 7
  debugLabelOffsetX?: number;       // default: 25
  debugLabelOffsetY?: number;       // default: -6
  debugLabelFontFamily?: string;    // default: 'monospace'
  debugLabelColor?: string;         // default: '#999'

  // Viewport Options
  width?: number;                   // default: auto-detect
  height?: number;                  // default: auto-detect
  autoResize?: boolean;             // default: false
}
```

### Helper Functions

#### mergeWithDefaults()

```typescript
function mergeWithDefaults(options?: RenderOptions): Required<RenderOptions>
```

Merges user options with defaults.

**Example:**
```typescript
import { mergeWithDefaults } from 'shakuhachi-ro';

const options = mergeWithDefaults({ notesPerColumn: 8 });
// options.notesPerColumn = 8
// options.showOctaveMarks = true (default)
```

#### DEFAULT_RENDER_OPTIONS

```typescript
const DEFAULT_RENDER_OPTIONS: Required<RenderOptions>
```

Default configuration values.

**Example:**
```typescript
import { DEFAULT_RENDER_OPTIONS } from 'shakuhachi-ro';

console.log(DEFAULT_RENDER_OPTIONS.notesPerColumn); // 10
```

## Layout Components

Advanced components for custom rendering.

### ColumnLayoutCalculator

Calculates multi-column layout.

#### calculateLayout()

```typescript
static calculateLayout(
  notes: ShakuNote[],
  svgWidth: number,
  svgHeight: number,
  options: Required<RenderOptions>
): ColumnLayout
```

**Returns:** Complete layout information

**Example:**
```typescript
import { ColumnLayoutCalculator, mergeWithDefaults } from 'shakuhachi-ro';

const options = mergeWithDefaults({ notesPerColumn: 10 });
const layout = ColumnLayoutCalculator.calculateLayout(
  notes,
  800,
  600,
  options
);

console.log(layout.totalColumns); // 3
console.log(layout.columns[0].xPosition); // 400
```

#### ColumnLayout Type

```typescript
interface ColumnLayout {
  totalColumns: number;
  startX: number;
  startY: number;
  columnWidth: number;
  columnSpacing: number;
  columns: ColumnInfo[];
}

interface ColumnInfo {
  columnIndex: number;
  xPosition: number;
  noteStartIndex: number;
  noteEndIndex: number;
  notePositions: NotePosition[];
}

interface NotePosition {
  noteIndex: number;
  y: number;
}
```

### ModifierConfigurator

Configures note modifiers.

#### configureModifiers()

```typescript
static configureModifiers(
  notes: ShakuNote[],
  options: Required<RenderOptions>
): void
```

Configures modifiers on notes according to options.

**Example:**
```typescript
import { ModifierConfigurator, mergeWithDefaults } from 'shakuhachi-ro';

const options = mergeWithDefaults({ showOctaveMarks: false });
ModifierConfigurator.configureModifiers(notes, options);
// Octave marks removed from all notes
```

## Low-Level Components

### SVGRenderer

Low-level SVG rendering.

```typescript
new SVGRenderer(element: HTMLElement, width: number, height: number)
```

**Methods:**
- `drawText()`: Draw text at position
- `drawLine()`: Draw line
- `drawCircle()`: Draw circle
- `openGroup()`: Start SVG group
- `closeGroup()`: End SVG group

### ShakuNote

Represents a shakuhachi note.

```typescript
new ShakuNote(options: ShakuNoteOptions)
```

**Methods:**
- `setPosition(x, y)`: Set note position
- `setFontSize(size)`: Set font size
- `setFontWeight(weight)`: Set font weight
- `addModifier(modifier)`: Add modifier
- `getModifiers()`: Get modifiers
- `render(renderer)`: Render note

### Modifiers

- `OctaveMarksModifier`: Octave marks (乙, 甲)
- `MeriKariModifier`: Meri/kari marks (メ, 中, 大)
- `DurationDotModifier`: Duration dots
- `AtariModifier`: Atari marks

## Error Handling

All async methods can throw errors. Always use try/catch:

```typescript
try {
  await renderer.renderFromURL('/score.musicxml');
} catch (error) {
  console.error('Failed to render:', error);
  container.innerHTML = `<div class="error">${error.message}</div>`;
}
```

## TypeScript Support

Full TypeScript support with type definitions for all components.

```typescript
import type {
  RenderOptions,
  ColumnLayout,
  ColumnInfo,
  ScoreData
} from 'shakuhachi-ro';
```

## Browser Support

- Modern browsers with ES6+ support
- SVG rendering support required
- Tested on Chrome, Firefox, Safari, Edge
