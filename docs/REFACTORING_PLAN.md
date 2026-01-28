# ScoreRenderer Architecture Refactoring Plan

## Goal

Create a standalone, reusable `ScoreRenderer` module that renders shakuhachi scores as SVG, independent of any specific webpage or HTML context. Following VexFlow's architectural patterns.

## Current State Analysis

### What Exists (VexFlow-inspired components, not used in index.html)
- ✓ `Formatter` - horizontal spacing calculator
- ✓ `VerticalSystem` - vertical layout with SVG rotation
- ✓ `src/index.ts` - exports all components
- ✓ `SVGRenderer` - low-level rendering context
- ✓ `ShakuNote`, `Modifier` classes - musical elements

### What index.html Currently Does (200+ lines)
- Loads MusicXML from URL
- Parses with `MusicXMLParser` + `ScoreParser`
- Configures modifiers (octave marks, meri marks) with fontWeights
- Calculates multi-column layout manually (column positions, note positions)
- Renders notes top-to-bottom without rotation
- Handles debug mode (romanji labels)
- Manages viewport/SVG sizing

### Architectural Gap
No high-level `ScoreRenderer` class that orchestrates everything and provides a clean API.

## Target Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Web Page                             │
│  (index.html, test pages, future platform)              │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ Simple API
                       ▼
┌─────────────────────────────────────────────────────────┐
│              ScoreRenderer (High-Level API)             │
│  - renderFromURL()                                      │
│  - renderFromScoreData()                                │
│  - setOptions(), resize(), refresh()                    │
└──────┬──────────────┬────────────────┬─────────────────┘
       │              │                │
       │              │                │
       ▼              ▼                ▼
┌─────────────┐ ┌──────────────┐ ┌──────────────────┐
│  Modifier   │ │   Column     │ │   Debug Label    │
│Configurator │ │   Layout     │ │    Renderer      │
└─────────────┘ │  Calculator  │ └──────────────────┘
                └──────────────┘
                       │
                       ▼
                ┌──────────────┐
                │ SVGRenderer  │
                │  (Context)   │
                └──────────────┘
                       │
                       ▼
                ┌──────────────┐
                │  ShakuNote   │
                │  Modifiers   │
                └──────────────┘
```

## Implementation Phases

### Phase 1: Create Render Options Interface
**Files:** `src/renderer/RenderOptions.ts`

Create type-safe configuration interface:
```typescript
export interface RenderOptions {
  // Display options
  showOctaveMarks?: boolean;
  showDebugLabels?: boolean;

  // Layout options
  notesPerColumn?: number;
  columnSpacing?: number;
  columnWidth?: number;

  // Typography
  noteFontSize?: number;
  noteFontWeight?: number;

  // Modifier configuration
  octaveMarkFontSize?: number;
  octaveMarkFontWeight?: number;
  meriKariFontSize?: number;
  meriKariFontWeight?: number;

  // Viewport
  width?: number;
  height?: number;
  autoResize?: boolean;
}
```

**Principles:**
- Explicit Over Implicit - all options in one place
- Type safety for configuration

**Testing:** Unit tests for default values

---

### Phase 2: Extract Modifier Configuration Logic
**Files:** `src/renderer/ModifierConfigurator.ts`

Separate modifier configuration from rendering:
```typescript
export class ModifierConfigurator {
  static configureModifiers(
    notes: ShakuNote[],
    options: RenderOptions
  ): void {
    // Configure octave marks, meri marks
    // Remove modifiers if disabled
  }
}
```

**Principles:**
- Single Responsibility - modifier config is separate concern
- DRY - reusable across different rendering contexts

**Testing:** Unit tests for modifier configuration with various options

---

### Phase 3: Create Vertical Column Layout Calculator
**Files:** `src/renderer/ColumnLayoutCalculator.ts`

Encapsulate current column layout logic (different from VerticalSystem):
```typescript
export interface ColumnLayout {
  columns: ColumnInfo[];
  totalWidth: number;
  startX: number;
}

export interface ColumnInfo {
  columnIndex: number;
  x: number;
  notes: ShakuNote[];
  notePositions: Array<{note: ShakuNote; x: number; y: number}>;
}

export class ColumnLayoutCalculator {
  constructor(private options: RenderOptions) {}

  calculateLayout(notes: ShakuNote[], svgWidth: number): ColumnLayout {
    // Extract logic from index.html lines 192-248
  }
}
```

**Principles:**
- Separation of Concerns - layout calculation separate from rendering
- Make Change Cheap - can swap layout algorithms easily
- Testable - pure calculation function

**Testing:** Unit tests for column breaking, positioning, centering

---

### Phase 4: Create High-Level ScoreRenderer
**Files:** `src/renderer/ScoreRenderer.ts`

VexFlow-style high-level API:
```typescript
export class ScoreRenderer {
  constructor(container: HTMLElement | string, options?: RenderOptions)

  // Primary rendering methods
  async renderFromURL(url: string): Promise<void>
  renderFromScoreData(scoreData: ScoreData): void
  renderNotes(notes: ShakuNote[]): void

  // Control methods
  refresh(): void
  setOptions(options: Partial<RenderOptions>): void
  resize(width: number, height: number): void
  getSVG(): SVGSVGElement
}
```

**Rendering Pipeline:**
1. Parse (if needed) → `ScoreParser.parse()`
2. Configure modifiers → `ModifierConfigurator.configureModifiers()`
3. Calculate layout → `ColumnLayoutCalculator.calculateLayout()`
4. Render notes at positions
5. Render debug labels (if enabled)

**Principles:**
- High Cohesion - related rendering functionality together
- Single entry point for all use cases
- Options pattern for flexibility

**Testing:** Integration tests with mock data, URL loading

---

### Phase 5: Add Convenience Factory Functions
**Files:** Update `src/renderer/ScoreRenderer.ts`

Make common cases trivial:
```typescript
export async function renderScoreFromURL(
  container: HTMLElement | string,
  url: string,
  options?: RenderOptions
): Promise<ScoreRenderer>

export function renderScore(
  container: HTMLElement | string,
  scoreData: ScoreData,
  options?: RenderOptions
): ScoreRenderer
```

**Principles:**
- Make simple things simple
- Progressive disclosure of complexity

---

### Phase 6: Simplify index.html
**Files:** `index.html`

Reduce from ~200 lines to ~10:
```javascript
import { renderScoreFromURL } from '/src/renderer/ScoreRenderer';

const display = document.getElementById('display');
const urlParams = new URLSearchParams(window.location.search);

renderScoreFromURL(display, '/data/Akatombo.musicxml', {
  showDebugLabels: urlParams.get('debug') === 'true',
  showOctaveMarks: urlParams.get('octaveMarks') !== 'false'
}).catch(error => {
  display.innerHTML = `<div class="error">Error: ${error.message}</div>`;
});
```

**Validation:** Visual comparison before/after

---

### Phase 7: Update Module Exports
**Files:** `src/index.ts`

Export new components:
```typescript
export { ScoreRenderer, renderScoreFromURL, renderScore } from './renderer/ScoreRenderer';
export type { RenderOptions } from './renderer/RenderOptions';
export { ModifierConfigurator } from './renderer/ModifierConfigurator';
export { ColumnLayoutCalculator } from './renderer/ColumnLayoutCalculator';
export type { ColumnLayout, ColumnInfo } from './renderer/ColumnLayoutCalculator';
```

---

### Phase 8: Update Test Pages
**Files:** Test HTML files

Update all test pages to use ScoreRenderer instead of manual rendering logic.

---

### Phase 9: Documentation
**Files:**
- `docs/ARCHITECTURE.md` - overall architecture
- `docs/API.md` - ScoreRenderer API reference
- `README.md` - updated usage examples

Document:
- VexFlow-inspired design
- Component responsibilities
- Usage examples
- Migration guide

---

### Phase 10: Cleanup and Polish
**Goal:** Remove implementation artifacts and finalize codebase

**Tasks:**
- Review and remove unused code from old implementation
- Clean up temporary test files and artifacts
- Remove or update deprecated patterns
- Remove inline comments referencing old implementation
- Verify all old rendering logic properly extracted
- Clean up screenshots/ directory if needed
- Remove TODO comments added during refactoring
- Final code review for consistency and style
- Verify all tests pass
- Take final screenshots for documentation

**Principles:**
- Leave codebase cleaner than we found it
- Remove dead code
- Ensure no technical debt carried forward

---

## Software Engineering Principles Applied

### Single Responsibility
- `ModifierConfigurator` - only configures modifiers
- `ColumnLayoutCalculator` - only calculates layout
- `ScoreRenderer` - only orchestrates rendering

### Separation of Concerns
- Options definition (RenderOptions)
- Configuration logic (ModifierConfigurator)
- Layout calculation (ColumnLayoutCalculator)
- Rendering (ScoreRenderer, SVGRenderer)

### DRY (Don't Repeat Yourself)
- Reusable components across pages
- Centralized configuration
- Shared layout logic

### Explicit Over Implicit
- RenderOptions makes all configuration visible
- Clear method names
- Type-safe interfaces

### Make Change Cheap
- Can swap layout algorithms by changing ColumnLayoutCalculator
- Can add new options without breaking existing code
- Can create alternative renderers (Canvas, WebGL) using same architecture

### Loose Coupling
- Components communicate through interfaces
- No direct dependencies on DOM structure
- Swappable implementations

### High Cohesion
- Related functionality grouped together
- Clear module boundaries
- Minimal cross-module dependencies

## Implementation Order

1. **Phase 1** (RenderOptions) - Foundation for everything else
2. **Phase 2** (ModifierConfigurator) - Extract first piece of logic, prove pattern works
3. **Phase 3** (ColumnLayoutCalculator) - Extract second piece, establish separation
4. **Phase 4** (ScoreRenderer) - Bring it all together, create orchestrator
5. **Phase 5** (Factory functions) - Add convenience layer
6. **Phase 6** (index.html) - Prove it works in production
7. **Phase 7** (Exports) - Make it available to consumers
8. **Phase 8** (Test pages) - Ensure reusability
9. **Phase 9** (Documentation) - Explain for future maintainers
10. **Phase 10** (Cleanup) - Remove artifacts, polish codebase

## Testing Strategy

### Unit Tests
- RenderOptions default value merging
- ModifierConfigurator with various option combinations
- ColumnLayoutCalculator for different note counts
- Each ScoreRenderer method in isolation

### Integration Tests
- Full rendering pipeline with mock data
- URL loading and error handling
- Option changes and re-rendering

### Visual Regression Tests
- Before/after screenshots for each phase
- Ensure no visual changes during refactoring
- Validate against reference image

## Success Criteria

✓ index.html reduced from 200+ lines to ~10 lines
✓ ScoreRenderer can be instantiated with one line
✓ Test pages use same ScoreRenderer
✓ All existing functionality preserved
✓ No visual regressions
✓ Comprehensive test coverage
✓ Clear documentation
✓ Easy to extend with new features

## Migration Path

### For Existing Code
1. Keep current index.html working during development
2. Build new ScoreRenderer alongside
3. Switch index.html to ScoreRenderer when ready
4. Deprecate old approach

### For Future Features
- All new rendering features go in ScoreRenderer
- Options-based configuration
- Testable in isolation
- Reusable across pages

## Notes

- **Not using VerticalSystem initially** - Current index.html uses different layout (no SVG rotation). VerticalSystem can be integrated later as alternative layout engine.
- **Backwards compatibility** - Old test pages can gradually migrate.
- **Progressive enhancement** - Start simple, add features incrementally.
