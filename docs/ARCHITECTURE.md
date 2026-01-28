# Architecture

This document explains the design and architecture of the Shakuhachi Score Renderer, following VexFlow-inspired patterns for music notation rendering.

## Overview

The renderer is organized into distinct layers, each with a single responsibility:

```
┌─────────────────────────────────────────┐
│     High-Level API (ScoreRenderer)      │  ← User-facing
├─────────────────────────────────────────┤
│   Configuration (RenderOptions)         │
├─────────────────────────────────────────┤
│   Layout (ColumnLayoutCalculator)       │
├─────────────────────────────────────────┤
│   Modifiers (ModifierConfigurator)      │
├─────────────────────────────────────────┤
│   Parsing (MusicXMLParser, ScoreParser) │
├─────────────────────────────────────────┤
│   Primitives (ShakuNote, Modifiers)     │
├─────────────────────────────────────────┤
│   Rendering (SVGRenderer)                │  ← Low-level
└─────────────────────────────────────────┘
```

## Core Principles

### 1. Separation of Concerns

Each component has a single, well-defined responsibility:
- **ScoreRenderer**: Orchestrates the rendering pipeline
- **RenderOptions**: Type-safe configuration
- **ColumnLayoutCalculator**: Calculates multi-column layout
- **ModifierConfigurator**: Configures note modifiers
- **ScoreParser**: Converts data to renderable objects
- **SVGRenderer**: Low-level SVG drawing

### 2. VexFlow-Inspired Design

Following VexFlow's proven patterns:
- Constructor takes container + options
- Fluent API for configuration
- Explicit render() calls
- Separation of data and presentation

### 3. Data vs Presentation

**Data describes WHAT:**
- ScoreData format is minimal and semantic
- Notes are just pitches, durations, and markers
- No layout or styling in data

**Renderer determines HOW:**
- Column breaks calculated dynamically
- Positioning determined by viewport
- Styling controlled by RenderOptions

### 4. Composition Over Inheritance

Components are composed, not inherited:
- Modifiers added to notes
- Layout uses calculator
- Renderer uses configurator

## Component Details

### ScoreRenderer

**Purpose**: Main public API for rendering scores

**Responsibilities**:
- Parse score data from various sources
- Configure modifiers based on options
- Calculate layout
- Manage SVG renderer lifecycle
- Handle viewport changes

**Usage**:
```typescript
const renderer = new ScoreRenderer(container, options);
await renderer.renderFromURL('/score.musicxml');
renderer.setOptions({ showOctaveMarks: false });
```

### RenderOptions

**Purpose**: Type-safe configuration with defaults

**Design**:
- All options are optional (Partial<RenderOptions>)
- Defaults merged via `mergeWithDefaults()`
- Required<RenderOptions> used internally

**Categories**:
- Display: showOctaveMarks, showDebugLabels
- Layout: notesPerColumn, columnWidth, columnSpacing
- Typography: Font sizes, weights, colors
- Modifiers: Octave marks, meri/kari marks
- Viewport: width, height

### ColumnLayoutCalculator

**Purpose**: Calculate multi-column layout

**Algorithm**:
1. Calculate total columns needed
2. Center columns horizontally
3. Position columns right-to-left (Japanese reading order)
4. Calculate vertical positions for each note
5. Add extra spacing for duration dots

**Output**: `ColumnLayout` with complete position information

### ModifierConfigurator

**Purpose**: Configure note modifiers

**Operations**:
1. Remove octave marks if disabled
2. Configure octave mark appearance
3. Configure meri/kari mark appearance

**Type Safety**: Uses `instanceof` instead of string comparison

### Rendering Pipeline

```
1. Load Data
   renderFromURL() → MusicXMLParser → ScoreData

2. Parse
   ScoreParser.parse() → ShakuNote[]

3. Configure
   ModifierConfigurator.configureModifiers()

4. Layout
   ColumnLayoutCalculator.calculateLayout()

5. Render
   For each column:
     For each note:
       note.setPosition()
       note.render(svgRenderer)
```

## Design Patterns

### Factory Pattern

Convenience functions wrap the main API:
```typescript
await renderScoreFromURL(container, url, options);
// Creates ScoreRenderer internally
```

### Builder Pattern

Fluent API for configuration:
```typescript
renderer
  .setOptions({ notesPerColumn: 8 })
  .refresh();
```

### Strategy Pattern

Different parsers for different formats:
- MusicXMLParser for .musicxml files
- ScoreParser for ScoreData objects

### Decorator Pattern

Modifiers decorate notes with additional rendering:
```typescript
note.addModifier(new OctaveMarksModifier('kan'));
note.addModifier(new MeriKariModifier('meri'));
```

## Extension Points

### Adding New Options

1. Add to `RenderOptions` interface
2. Add default value to `DEFAULT_RENDER_OPTIONS`
3. Use in relevant component
4. Update documentation

### Adding New Modifiers

1. Extend `Modifier` base class
2. Implement `render()` method
3. Add configuration to `ModifierConfigurator` if needed
4. Export from `src/index.ts`

### Adding New Layout Algorithms

1. Create new calculator class
2. Implement `calculateLayout()` method
3. Return `ColumnLayout` interface
4. Use in `ScoreRenderer.renderNotes()`

## Testing Strategy

### Unit Tests

- **RenderOptions**: Option merging, defaults
- **ModifierConfigurator**: Modifier configuration, removal
- **ColumnLayoutCalculator**: Layout calculation, positioning

### Integration Tests

- **ScoreRenderer**: Full rendering pipeline
- **Convenience functions**: Factory functions

### Visual Tests

- **Playwright**: Visual regression testing
- Manual testing for visual changes

## Performance Considerations

### Layout Caching

Currently, layout is recalculated on each render. Future optimization:
- Cache layout results
- Invalidate on resize or option changes

### Modifier Configuration

Modifiers are configured in-place. This mutates the notes but avoids copying.

### SVG Rendering

SVG elements created directly, no virtual DOM. Fast and simple.

## Migration from Old Code

### Before (index.html, ~220 lines)

```javascript
// Manual parsing
const scoreData = await MusicXMLParser.parseFromURL(url);
const notes = ScoreParser.parse(scoreData);

// Manual modifier configuration
notes.forEach(note => {
  if (!showOctaveMarks) {
    note.modifiers = note.modifiers.filter(...);
  } else {
    note.modifiers.forEach(mod => {
      if (mod.constructor.name === 'OctaveMarksModifier') {
        mod.setFontSize(...).setFontWeight(...);
      }
    });
  }
});

// Manual layout calculation
const totalColumns = Math.ceil(notes.length / notesPerColumn);
const startX = (width - totalWidth) / 2;
for (let col = 0; col < totalColumns; col++) {
  const columnX = startX + (totalColumns - 1 - col) * spacing;
  // ... more calculation

  // Manual rendering
  columnNotes.forEach(note => {
    note.setPosition(x, y);
    note.render(renderer);
    // ... spacing calculation
  });
}
```

### After (index.html, ~10 lines)

```javascript
const renderer = await renderScoreFromURL(
  container,
  url,
  { showOctaveMarks, showDebugLabels }
);
```

**Benefits**:
- 95% code reduction
- Clear, declarative API
- Type-safe configuration
- Reusable across pages
- Easier to test
- Easier to maintain

## Future Enhancements

### Responsive Layout

Auto-adjust `notesPerColumn` based on viewport height.

### Layout Algorithms

Support different layout strategies:
- Traditional vertical columns
- Horizontal scrolling
- Paginated layout

### Caching

Cache parsed scores, calculated layouts.

### Animation

Smooth transitions when changing options.

### Accessibility

ARIA labels, keyboard navigation.
