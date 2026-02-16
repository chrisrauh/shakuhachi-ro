# API Reference

Complete API reference for the Shakuhachi Score Renderer.

## API Stability

**Current Version:** 1.x (Stable)

**Stability Levels:**
- 🟢 **Stable** - Recommended for production use, won't change without major version bump
- 🟡 **Experimental** - Available but may change in minor versions
- 🔴 **Internal** - Exported but not intended for public use, may change anytime

**Stable APIs (Recommended):**
- `ScoreRenderer` class
- `renderScoreFromURL()`, `renderScore()` convenience functions
- `RenderOptions` interface
- All modifier classes (OctaveMarksModifier, MeriKariModifier, etc.)

**Experimental APIs:**
- `Formatter`, `VerticalSystem` (alternative layout system, not used by ScoreRenderer)

**Internal APIs (Not Recommended):**
- `ScoreParser` (used internally by ScoreRenderer)
- kinko-symbols utilities (implementation details)
- `TestModifier` (testing only)

## Quick Start

**Simplest usage:**
```typescript
import { renderScoreFromURL } from 'shakuhachi-ro';

// Render a score with one line
await renderScoreFromURL(
  document.getElementById('container'),
  '/path/to/score.musicxml'
);
```

**With configuration:**
```typescript
import { renderScoreFromURL } from 'shakuhachi-ro';

const renderer = await renderScoreFromURL(
  document.getElementById('container'),
  '/score.musicxml',
  {
    showOctaveMarks: true,
    notesPerColumn: 10,
    autoResize: true
  }
);

// Can still manipulate after rendering
renderer.setOptions({ showDebugLabels: true });
```

**Class-based API:**
```typescript
import { ScoreRenderer } from 'shakuhachi-ro';

const renderer = new ScoreRenderer(container, {
  notesPerColumn: 8,
  showOctaveMarks: false
});

await renderer.renderFromURL('/score.musicxml');
```

## Best Practices

### ✅ Do

**Use convenience functions for simple cases:**
```typescript
await renderScoreFromURL(container, '/score.musicxml');
```

**Always call destroy() when done:**
```typescript
// React
useEffect(() => {
  const renderer = new ScoreRenderer(ref.current);
  return () => renderer.destroy();
}, []);

// Vue
onUnmounted(() => renderer.destroy());

// Vanilla
window.addEventListener('beforeunload', () => renderer.destroy());
```

**Use autoResize for responsive layouts:**
```typescript
new ScoreRenderer(container, { autoResize: true });
// Automatically adjusts when container resizes
```

**Validate user input before passing to renderer:**
```typescript
const notesPerColumn = Math.max(1, Math.min(50, userInput));
const renderer = new ScoreRenderer(container, { notesPerColumn });
```

### ❌ Don't

**Don't create multiple renderers for the same container:**
```typescript
// Bad - creates memory leaks
new ScoreRenderer(container);
new ScoreRenderer(container); // Overwrites first one without cleanup
```

**Don't set extreme values without validation:**
```typescript
// Bad - will produce broken rendering
new ScoreRenderer(container, {
  notesPerColumn: -5,  // Invalid
  columnSpacing: 0,    // Causes overlap
  noteFontSize: 1000   // Unreadable
});
```

**Don't ignore errors:**
```typescript
// Bad - silently fails
await renderer.renderFromURL('/score.musicxml');

// Good - handle errors
try {
  await renderer.renderFromURL('/score.musicxml');
} catch (error) {
  console.error('Failed to load score:', error);
  showErrorToUser(error.message);
}
```

**Don't use experimental APIs in production:**
```typescript
// Bad - experimental, may change
import { Formatter, VerticalSystem } from 'shakuhachi-ro';

// Good - use stable API
import { ScoreRenderer } from 'shakuhachi-ro';
```

## Common Patterns

### Framework Integration

**React:**
```typescript
import { useEffect, useRef } from 'react';
import { ScoreRenderer } from 'shakuhachi-ro';

function ScoreView({ scoreUrl, options }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<ScoreRenderer>();

  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = new ScoreRenderer(containerRef.current, options);
    rendererRef.current = renderer;

    renderer.renderFromURL(scoreUrl).catch(error => {
      console.error('Failed to render:', error);
    });

    return () => {
      renderer.destroy();
    };
  }, [scoreUrl, options]);

  return <div ref={containerRef} style={{ width: '100%', height: '600px' }} />;
}
```

**Vue 3:**
```typescript
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { ScoreRenderer } from 'shakuhachi-ro';

export default {
  setup(props) {
    const container = ref<HTMLElement>();
    let renderer: ScoreRenderer;

    onMounted(async () => {
      if (!container.value) return;

      renderer = new ScoreRenderer(container.value, {
        autoResize: true
      });

      try {
        await renderer.renderFromURL(props.scoreUrl);
      } catch (error) {
        console.error('Render failed:', error);
      }
    });

    watch(() => props.showOctaveMarks, (show) => {
      renderer?.setOptions({ showOctaveMarks: show });
    });

    onUnmounted(() => {
      renderer?.destroy();
    });

    return { container };
  }
};
```

**Vanilla JavaScript:**
```typescript
class ScoreWidget {
  private renderer: ScoreRenderer;

  constructor(container: HTMLElement) {
    this.renderer = new ScoreRenderer(container, {
      autoResize: true
    });
  }

  async loadScore(url: string): Promise<void> {
    try {
      await this.renderer.renderFromURL(url);
    } catch (error) {
      this.handleError(error);
    }
  }

  setDebugMode(enabled: boolean): void {
    this.renderer.setOptions({ showDebugLabels: enabled });
  }

  destroy(): void {
    this.renderer.destroy();
  }

  private handleError(error: Error): void {
    console.error('Score loading failed:', error);
    // Show user-friendly error message
  }
}
```

### Dynamic Option Updates

**Toggle features:**
```typescript
const renderer = new ScoreRenderer(container);

// Toggle octave marks
document.getElementById('toggle-octave').addEventListener('change', (e) => {
  renderer.setOptions({
    showOctaveMarks: e.target.checked
  });
});

// Change notes per column
document.getElementById('notes-slider').addEventListener('input', (e) => {
  renderer.setOptions({
    notesPerColumn: parseInt(e.target.value)
  });
});
```

**Responsive column count:**
```typescript
const renderer = new ScoreRenderer(container, { autoResize: false });

function updateLayout() {
  const width = container.clientWidth;
  const notesPerColumn = width < 600 ? 5 : 10;

  renderer.setOptions({ notesPerColumn });
}

window.addEventListener('resize', updateLayout);
updateLayout();
```

### Error Handling

**Graceful degradation:**
```typescript
async function loadScore(url: string) {
  try {
    await renderer.renderFromURL(url);
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      showMessage('Score not found');
    } else if (error instanceof Error && error.message.includes('parse')) {
      showMessage('Invalid score format');
    } else {
      showMessage('Failed to load score');
      console.error(error);
    }
  }
}
```

**Retry logic:**
```typescript
async function loadScoreWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await renderer.renderFromURL(url);
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

## Table of Contents

- [API Stability](#api-stability)
- [Quick Start](#quick-start)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
  - [Framework Integration](#framework-integration)
  - [Dynamic Option Updates](#dynamic-option-updates)
  - [Error Handling Patterns](#error-handling)
- [ScoreRenderer](#scorerenderer)
  - [Constructor](#constructor)
  - [Methods](#methods)
- [Convenience Functions](#convenience-functions)
  - [renderScoreFromURL()](#renderscorefromurl)
  - [renderScore()](#renderscore)
- [RenderOptions](#renderoptions)
  - [Valid Option Ranges](#valid-option-ranges)
  - [Helper Functions](#helper-functions)
- [Responsive Rendering](#responsive-rendering)
- [Layout Components](#layout-components)
  - [ColumnLayoutCalculator](#columnlayoutcalculator)
  - [ModifierConfigurator](#modifierconfigurator)
- [Low-Level Components](#low-level-components)
  - [SVGRenderer](#svgrenderer)
  - [ShakuNote](#shakunote)
  - [Modifiers](#modifiers)
- [Advanced APIs](#advanced-apis)
  - [ScoreParser](#scoreparser)
  - [Kinko Symbol Utilities](#kinko-symbol-utilities)
  - [Alternative Layout System](#alternative-layout-system-vexflow-inspired)
- [Error Handling](#error-handling)
  - [Common Errors and Solutions](#common-errors-and-solutions)
  - [Debug Mode](#debug-mode)
- [TypeScript Support](#typescript-support)
- [Browser Support](#browser-support)
- [Performance Tips](#performance-tips)
  - [Optimize Initial Render](#optimize-initial-render)
  - [Optimize Updates](#optimize-updates)
  - [Optimize Memory Usage](#optimize-memory-usage)
  - [Monitor Performance](#monitor-performance)
- [Future API Changes](#future-api-changes)
- [Feedback](#feedback)

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

#### destroy()

```typescript
destroy(): void
```

Cleans up resources (ResizeObserver) when disposing of the ScoreRenderer.

**Important:** Call this when removing the renderer to prevent memory leaks, especially when `autoResize` is enabled.

**Example:**
```typescript
// In React cleanup
useEffect(() => {
  const renderer = new ScoreRenderer(containerRef.current);

  return () => {
    renderer.destroy(); // Clean up on unmount
  };
}, []);

// In vanilla JS
const renderer = new ScoreRenderer(container);
// ... use renderer ...
renderer.destroy(); // Clean up when done
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
  autoResize?: boolean;             // default: true
}
```

### Valid Option Ranges

**Important:** While the API accepts any numbers, certain ranges produce better results:

| Option | Valid Range | Recommended | Notes |
|--------|-------------|-------------|-------|
| `notesPerColumn` | 1-50 | 8-12 | Too few = wasted space, too many = cramped |
| `columnSpacing` | 0-100 | 30-50 | 0 causes overlap, >100 wastes space |
| `columnWidth` | 50-200 | 100-120 | Affects horizontal centering |
| `noteFontSize` | 10-60 | 24-32 | Affects readability |
| `noteVerticalSpacing` | 20-80 | 40-50 | Must be > noteFontSize to avoid overlap |
| `octaveMarkFontSize` | 8-20 | 10-14 | Too small = unreadable |
| `meriKariFontSize` | 10-24 | 12-16 | Should be visible but not dominant |

**Current limitation:** Invalid values are accepted but produce broken rendering. Future versions will validate and warn/error. See [API-IMPROVEMENTS.MD](./API-IMPROVEMENTS.MD#5-options-validation).

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

### Responsive Rendering

By default, the renderer automatically re-renders when the container size changes using `autoResize: true`. This is powered by the `ResizeObserver` API.

**Default behavior (autoResize: true):**
```typescript
const renderer = new ScoreRenderer(container);
// Automatically re-renders when container is resized
// No manual handling needed
```

**Manual control (autoResize: false):**
```typescript
const renderer = new ScoreRenderer(container, { autoResize: false });

// Manual resize handling
window.addEventListener('resize', () => {
  const rect = container.getBoundingClientRect();
  renderer.resize(rect.width, rect.height);
});
```

**Important:** When using `autoResize: true`, always call `destroy()` when disposing of the renderer to clean up the ResizeObserver and prevent memory leaks.

```typescript
// React example
useEffect(() => {
  const renderer = new ScoreRenderer(ref.current);
  return () => renderer.destroy(); // Cleanup
}, []);

// Vue example
onUnmounted(() => {
  renderer.destroy(); // Cleanup
});
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

## Advanced APIs

### ScoreParser

Converts ScoreData to ShakuNote arrays. Used internally by ScoreRenderer.

```typescript
import { ScoreParser } from 'shakuhachi-ro';

const notes = ScoreParser.parse(scoreData, noteColor);
```

### Kinko Symbol Utilities

Low-level utilities for working with Kinko notation symbols.

```typescript
import {
  getKinkoSymbols,
  getSymbolByKana,
  getSymbolByRomaji,
  getSymbolByPitch,
  parseNote
} from 'shakuhachi-ro';

// Get all symbols
const symbols = getKinkoSymbols();

// Lookup by romanji
const ro = getSymbolByRomaji('ro'); // { symbol: 'ロ', romaji: 'ro', ... }

// Lookup by kana
const tsu = getSymbolByKana('ツ');

// Parse note string
const parsed = parseNote('ro');
```

**Note:** These are low-level utilities. Most users should use the high-level `ScoreRenderer` API instead.

### Alternative Layout System (VexFlow-inspired)

The library includes an alternative VexFlow-inspired layout system with `Formatter` and `VerticalSystem`. These are not used by `ScoreRenderer` but are available for advanced use cases.

**Status:** Experimental - not recommended for production use. Use `ScoreRenderer` instead.

```typescript
import { Formatter, VerticalSystem } from 'shakuhachi-ro';

// Horizontal spacing
const formatter = new Formatter({ startX: 0, minNoteSpacing: 40 });
formatter.format(notes, 500); // Format within 500px width

// Vertical layout
const system = new VerticalSystem(svgRenderer, {
  x: 100,
  y: 50,
  columnHeight: 500
});
system.addNotes(notes);
system.render();
```

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

### Common Errors and Solutions

**"Failed to fetch"**
- **Cause**: Network error, file not found, CORS issue
- **Solution**: Check URL, verify file exists, ensure CORS headers if cross-origin

**"Invalid MusicXML format"**
- **Cause**: Malformed XML, unsupported MusicXML version
- **Solution**: Validate XML, check MusicXML version (only 3.0+ supported)

**"Container not found" / "Cannot read property of null"**
- **Cause**: Container element doesn't exist in DOM
- **Solution**: Ensure element exists before creating renderer
  ```typescript
  // Bad
  const renderer = new ScoreRenderer(document.getElementById('container'));

  // Good
  const container = document.getElementById('container');
  if (!container) throw new Error('Container not found');
  const renderer = new ScoreRenderer(container);
  ```

**Nothing renders / blank screen**
- **Cause**: Container has zero dimensions
- **Solution**: Set container size with CSS
  ```css
  #score-container {
    width: 100%;
    height: 600px;
  }
  ```

**Notes are cut off / overlapping**
- **Cause**: Invalid option values
- **Solution**: Check option ranges (see [Valid Option Ranges](#valid-option-ranges))

**Memory leak in SPA**
- **Cause**: Not calling `destroy()` when component unmounts
- **Solution**: Always clean up in unmount lifecycle
  ```typescript
  useEffect(() => {
    const renderer = new ScoreRenderer(container);
    return () => renderer.destroy(); // Critical!
  }, []);
  ```

**"ResizeObserver loop limit exceeded" warning**
- **Cause**: Rapid resize events (harmless warning)
- **Solution**: Disable autoResize and debounce manually if needed
  ```typescript
  const renderer = new ScoreRenderer(container, { autoResize: false });

  const debouncedResize = debounce(() => {
    const rect = container.getBoundingClientRect();
    renderer.resize(rect.width, rect.height);
  }, 250);

  window.addEventListener('resize', debouncedResize);
  ```

### Debug Mode

Enable debug labels to troubleshoot rendering issues:

```typescript
renderer.setOptions({ showDebugLabels: true });
```

This shows:
- Note index (1, 2, 3...)
- Romanji (ro, tsu, re...)
- Octave register (otsu, kan)
- Meri/kari status (meri, dai-meri, kari)

Useful for:
- Verifying note parsing is correct
- Checking modifier application
- Understanding layout decisions

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

## Performance Tips

### Optimize Initial Render

**Use appropriate notesPerColumn:**
```typescript
// Bad - too many columns = slower layout calculation
new ScoreRenderer(container, { notesPerColumn: 3 });

// Good - balanced columns
new ScoreRenderer(container, { notesPerColumn: 10 });
```

**Disable features you don't need:**
```typescript
new ScoreRenderer(container, {
  showOctaveMarks: false,  // Skip octave rendering if not needed
  showDebugLabels: false,  // Never enable in production
  autoResize: false        // Disable if container size is fixed
});
```

### Optimize Updates

**Batch option changes:**
```typescript
// Bad - triggers 3 re-renders
renderer.setOptions({ showOctaveMarks: false });
renderer.setOptions({ notesPerColumn: 8 });
renderer.setOptions({ showDebugLabels: true });

// Good - single re-render
renderer.setOptions({
  showOctaveMarks: false,
  notesPerColumn: 8,
  showDebugLabels: true
});
```

**Disable auto-refresh for multiple changes:**
```typescript
// Set multiple options without re-rendering
renderer.setOptions({ showOctaveMarks: false }, false);
renderer.setOptions({ notesPerColumn: 8 }, false);
renderer.setOptions({ showDebugLabels: true }, false);

// Manual refresh once
renderer.refresh();
```

### Optimize Memory Usage

**Destroy unused renderers:**
```typescript
// When switching scores
const oldRenderer = renderer;
const newRenderer = new ScoreRenderer(container);
oldRenderer.destroy(); // Free memory
```

**Reuse renderer instances:**
```typescript
// Bad - creates new renderer each time
function displayScore(url) {
  const renderer = new ScoreRenderer(container);
  await renderer.renderFromURL(url);
}

// Good - reuse renderer
const renderer = new ScoreRenderer(container);
function displayScore(url) {
  await renderer.renderFromURL(url); // Clears and re-renders
}
```

### Monitor Performance

**Measure render time:**
```typescript
const start = performance.now();
await renderer.renderFromURL('/score.musicxml');
const duration = performance.now() - start;
console.log(`Rendered in ${duration.toFixed(2)}ms`);
```

**Profile in DevTools:**
```typescript
performance.mark('render-start');
await renderer.renderFromURL('/score.musicxml');
performance.mark('render-end');
performance.measure('score-render', 'render-start', 'render-end');
```

**Typical performance:**
- Simple score (50 notes): ~10-20ms
- Medium score (200 notes): ~30-50ms
- Complex score (500+ notes): ~100-200ms

If rendering is slower, check:
- Container dimensions (very large = slower)
- Number of modifiers (many octave changes = slower)
- Number of columns (many short columns = slower)

## Future API Changes

**Planning for v2.0:** We're planning several improvements to the API. See [API-IMPROVEMENTS.MD](./API-IMPROVEMENTS.MD) for details.

**Planned Breaking Changes:**
- Cleaner public API (fewer exports, clearer boundaries)
- Synchronous `renderFromScoreData()` (currently async but does no async work)
- Fluent API with method chaining (`renderer.setOptions().resize().refresh()`)
- Property getters instead of getter methods (`renderer.options` vs `renderer.getOptions()`)

**Planned Non-Breaking Additions:**
- Options validation with helpful warnings
- Typed error classes (ParseError, NetworkError, ValidationError)
- Event system for lifecycle hooks (render:start, render:complete, etc.)
- Better TypeScript types

**Migration Path:**
- v1.x will add deprecation warnings for breaking changes
- v1.x will be maintained for 6-12 months after v2.0 release
- Migration guide will be provided with v2.0

**How to prepare:**
- Avoid using experimental APIs (Formatter, VerticalSystem)
- Avoid using internal APIs (ScoreParser, kinko-symbols utilities)
- Always call `destroy()` for cleanup
- Handle errors with try/catch

## Feedback

Found an issue or have a suggestion? Please [open an issue](https://github.com/crauh/shakuhachi-ro/issues).
