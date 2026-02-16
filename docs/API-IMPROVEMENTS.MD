# API Improvement Suggestions

This document outlines suggestions for improving the Shakuhachi.ro renderer API for consistency, best practices, and developer experience.

## 1. API Surface Clarity

### Issue: Too Many Exports
Currently exports **55+ items** from `index.ts`, mixing:
- High-level user APIs (ScoreRenderer, renderScoreFromURL)
- Internal utilities (ScoreParser, TestModifier)
- Experimental features (Formatter, VerticalSystem)
- Low-level primitives (kinko-symbols utilities)

### Recommendation: Tiered API Strategy

**Tier 1 - Primary API (keep as default exports):**
```typescript
// What 95% of users need
export { ScoreRenderer } from './renderer/ScoreRenderer';
export { renderScoreFromURL, renderScore } from './renderer/convenience';
export type { RenderOptions } from './renderer/RenderOptions';
export { mergeWithDefaults, DEFAULT_RENDER_OPTIONS } from './renderer/RenderOptions';
```

**Tier 2 - Advanced API (explicit import path):**
```typescript
// For power users who need low-level control
// Import via: import { ScoreParser } from 'shakuhachi-ro/advanced'
export { ScoreParser } from './parser/ScoreParser';
export { ColumnLayoutCalculator } from './renderer/ColumnLayoutCalculator';
export { ModifierConfigurator } from './renderer/ModifierConfigurator';
export { SVGRenderer } from './renderer/SVGRenderer';
```

**Tier 3 - Internal/Unstable (remove from public API):**
```typescript
// Should NOT be exported
- TestModifier (testing only)
- Formatter, VerticalSystem (experimental, not used by main API)
- kinko-symbols utilities (internal implementation details)
```

**Benefits:**
- Clearer API surface
- Better tree-shaking
- Signals stability guarantees
- Easier to version/deprecate

---

## 2. Naming Consistency

### Issue: Inconsistent Naming Patterns

**Class names:**
- ✅ Good: `ScoreRenderer`, `ColumnLayoutCalculator` (noun phrases)
- ❌ Mixed: `Formatter` (too generic), `ModifierConfigurator` (verbose)

**Function names:**
- ✅ Good: `renderScoreFromURL`, `renderScore` (verb phrases)
- ❌ Inconsistent: `mergeWithDefaults` (utility function mixed with API)

### Recommendation: Establish Naming Conventions

**Classes:**
```typescript
// Pattern: <Domain><Role>
ScoreRenderer       // ✓
SVGRenderer         // ✓
ColumnLayoutCalculator → LayoutCalculator  // Simpler
ModifierConfigurator → ModifierManager     // More conventional
```

**Functions:**
```typescript
// Pattern: <verb><noun><preposition?>
renderScore()        // ✓
renderScoreFromURL() // ✓
mergeWithDefaults() → mergeOptions()  // More descriptive
```

**Constants:**
```typescript
// Pattern: SCREAMING_SNAKE_CASE for true constants
DEFAULT_RENDER_OPTIONS  // ✓
```

---

## 3. Method Return Types

### Issue: Inconsistent Return Types

**Current:**
```typescript
setOptions(options, autoRefresh?): void  // Returns nothing
resize(width, height): void               // Returns nothing
clear(): void                             // Returns nothing
```

**Problem:** Can't chain method calls

### Recommendation: Fluent API Pattern

```typescript
class ScoreRenderer {
  setOptions(options: RenderOptions, autoRefresh = true): this {
    this.options = mergeWithDefaults({ ...this.options, ...options });
    if (autoRefresh) this.refresh();
    return this;  // Enable chaining
  }

  resize(width: number, height: number): this {
    return this.setOptions({ width, height }, true);
  }

  clear(): this {
    this.container.innerHTML = '';
    this.renderer = null;
    this.currentNotes = [];
    this.currentScoreData = null;
    return this;
  }
}

// Usage:
renderer
  .setOptions({ showOctaveMarks: false }, false)
  .resize(1000, 800)
  .refresh();
```

**Benefits:**
- More ergonomic API
- Follows VexFlow pattern (which you're inspired by)
- Common in builder/configurator patterns

---

## 4. Constructor Overloads

### Issue: Container Must Be Passed

```typescript
new ScoreRenderer(container: HTMLElement, options?: RenderOptions)
```

**Problem:** Can't create renderer before having a container element

### Recommendation: Flexible Constructor

```typescript
class ScoreRenderer {
  constructor(containerOrOptions?: HTMLElement | RenderOptions, options?: RenderOptions) {
    if (containerOrOptions instanceof HTMLElement) {
      this.container = containerOrOptions;
      this.options = mergeWithDefaults(options);
    } else {
      this.container = null;
      this.options = mergeWithDefaults(containerOrOptions);
    }
  }

  attachTo(container: HTMLElement): this {
    this.container = container;
    if (this.currentNotes.length > 0) {
      this.refresh();
    }
    return this;
  }
}

// Usage patterns:
const renderer = new ScoreRenderer(container, options);  // Current
const renderer = new ScoreRenderer(options).attachTo(container);  // Deferred
const renderer = new ScoreRenderer().attachTo(container);  // Minimal
```

**Benefits:**
- More flexible initialization
- Better for framework integrations (React refs, Vue $refs)
- Can configure before attaching

---

## 5. Options Validation

### Issue: No Runtime Validation

```typescript
// These all silently "work" but produce broken rendering
new ScoreRenderer(container, { notesPerColumn: -5 });
new ScoreRenderer(container, { columnSpacing: 0 });
new ScoreRenderer(container, { octaveMarkFontSize: 1000 });
```

### Recommendation: Add Validation

```typescript
export function mergeWithDefaults(options: RenderOptions = {}): Required<RenderOptions> {
  const merged = { ...DEFAULT_RENDER_OPTIONS, ...options };

  // Validate ranges
  if (merged.notesPerColumn < 1) {
    throw new RangeError('notesPerColumn must be >= 1');
  }

  if (merged.columnSpacing < 0) {
    throw new RangeError('columnSpacing must be >= 0');
  }

  if (merged.noteFontSize < 1 || merged.noteFontSize > 200) {
    throw new RangeError('noteFontSize must be between 1 and 200');
  }

  return merged;
}
```

**Alternative: Soft Validation with Warnings**

```typescript
export function mergeWithDefaults(options: RenderOptions = {}): Required<RenderOptions> {
  const merged = { ...DEFAULT_RENDER_OPTIONS, ...options };

  // Warn instead of throw
  if (merged.notesPerColumn < 1) {
    console.warn('[ScoreRenderer] notesPerColumn must be >= 1, using default');
    merged.notesPerColumn = DEFAULT_RENDER_OPTIONS.notesPerColumn;
  }

  return merged;
}
```

**Benefits:**
- Fail fast with clear errors
- Better developer experience
- Prevent subtle rendering bugs

---

## 6. Event System

### Issue: No Way to Hook Into Lifecycle

Users can't be notified when:
- Rendering starts/completes
- Errors occur
- Options change
- Resize happens

### Recommendation: Event Emitter Pattern

```typescript
type RendererEvent =
  | { type: 'render:start', noteCount: number }
  | { type: 'render:complete', duration: number }
  | { type: 'render:error', error: Error }
  | { type: 'options:change', options: Required<RenderOptions> }
  | { type: 'resize', width: number, height: number };

type EventListener = (event: RendererEvent) => void;

class ScoreRenderer {
  private listeners: EventListener[] = [];

  on(listener: EventListener): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) this.listeners.splice(index, 1);
    };
  }

  private emit(event: RendererEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  renderNotes(notes: ShakuNote[]): void {
    const startTime = performance.now();
    this.emit({ type: 'render:start', noteCount: notes.length });

    try {
      // ... rendering logic ...
      const duration = performance.now() - startTime;
      this.emit({ type: 'render:complete', duration });
    } catch (error) {
      this.emit({ type: 'render:error', error });
      throw error;
    }
  }
}

// Usage:
const unsubscribe = renderer.on(event => {
  if (event.type === 'render:complete') {
    console.log(`Rendered in ${event.duration}ms`);
  }
});

// Cleanup
unsubscribe();
```

**Benefits:**
- Enables performance monitoring
- Better error handling in frameworks
- Can show loading states
- Debug rendering issues

---

## 7. Async API Consistency

### Issue: Mixed Async/Sync Methods

```typescript
async renderFromURL(url: string): Promise<void>      // Async
async renderFromScoreData(data: ScoreData): Promise<void>  // Async (why?)
renderNotes(notes: ShakuNote[]): void                // Sync
```

**Problem:** `renderFromScoreData()` is async but doesn't do any async work

### Recommendation: Make Async Where Needed

```typescript
class ScoreRenderer {
  // Async: actually needs to fetch
  async renderFromURL(url: string): Promise<void> {
    const scoreData = await MusicXMLParser.parseFromURL(url);
    this.currentScoreData = scoreData;
    this.renderFromScoreData(scoreData);  // Sync call
  }

  // Sync: no async operations
  renderFromScoreData(scoreData: ScoreData): void {
    this.currentScoreData = scoreData;
    const notes = ScoreParser.parse(scoreData, this.options.noteColor);
    this.renderNotes(notes);
  }

  // Sync: no async operations
  renderNotes(notes: ShakuNote[]): void {
    // ... rendering logic ...
  }
}
```

**Benefits:**
- More predictable API
- Better performance (avoid microtasks)
- Clearer about what's async

**Migration:**
Keep async version for backward compatibility with deprecation warning:
```typescript
/** @deprecated Use synchronous renderFromScoreData instead */
async renderFromScoreDataAsync(data: ScoreData): Promise<void> {
  console.warn('renderFromScoreDataAsync is deprecated, use renderFromScoreData');
  this.renderFromScoreData(data);
}
```

---

## 8. Error Handling

### Issue: Errors Are Not Typed

```typescript
try {
  await renderer.renderFromURL('/invalid.xml');
} catch (error) {
  // What kind of error is this?
  // Network? Parse error? Invalid XML?
}
```

### Recommendation: Typed Error Classes

```typescript
export class RendererError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'RendererError';
  }
}

export class ParseError extends RendererError {
  constructor(message: string, public readonly xml?: string) {
    super(message, 'PARSE_ERROR');
    this.name = 'ParseError';
  }
}

export class NetworkError extends RendererError {
  constructor(message: string, public readonly url: string) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class ValidationError extends RendererError {
  constructor(message: string, public readonly field: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

// Usage:
try {
  await renderer.renderFromURL('/score.xml');
} catch (error) {
  if (error instanceof NetworkError) {
    console.error(`Failed to fetch ${error.url}`);
  } else if (error instanceof ParseError) {
    console.error('Invalid MusicXML format');
  }
}
```

**Benefits:**
- Type-safe error handling
- Better error messages
- Easier debugging

---

## 9. Getters vs Methods

### Issue: Inconsistent Access Patterns

```typescript
getOptions(): Required<RenderOptions>   // Method
getNotes(): ShakuNote[]                  // Method
getScoreData(): ScoreData | null        // Method
```

**These are simple property access - why methods?**

### Recommendation: Use Getters for Simple Access

```typescript
class ScoreRenderer {
  get options(): Required<RenderOptions> {
    return { ...this.options };  // Return copy
  }

  get notes(): ShakuNote[] {
    return [...this.currentNotes];  // Return copy
  }

  get scoreData(): ScoreData | null {
    return this.currentScoreData;
  }
}

// Usage:
console.log(renderer.options.notesPerColumn);  // More natural
const notes = renderer.notes;                   // More natural
```

**Benefits:**
- More idiomatic JavaScript
- Aligns with framework patterns (Vue computed, React state)
- Still returns defensive copies

**Keep methods for actions:**
```typescript
refresh(): void      // Method - performs action
clear(): this        // Method - performs action
destroy(): void      // Method - performs action
```

---

## 10. Type Safety Improvements

### Issue: Partial Types Not Enforced

```typescript
interface RenderOptions {
  showOctaveMarks?: boolean;
  notesPerColumn?: number;
  // ... 20+ optional fields
}
```

**Problem:** All fields optional makes it hard to know what's actually set

### Recommendation: Separate User Input from Internal State

```typescript
// What users provide (all optional)
export interface RenderOptions {
  showOctaveMarks?: boolean;
  notesPerColumn?: number;
  // ...
}

// What renderer uses internally (all required)
export type ResolvedRenderOptions = Required<RenderOptions>;

class ScoreRenderer {
  private options: ResolvedRenderOptions;  // Always complete

  constructor(container: HTMLElement, options: RenderOptions = {}) {
    this.options = mergeWithDefaults(options);  // Returns ResolvedRenderOptions
  }

  setOptions(options: RenderOptions): this {
    // Type system knows this is safe
    this.options = { ...this.options, ...options } as ResolvedRenderOptions;
    return this;
  }

  get options(): ResolvedRenderOptions {
    return { ...this.options };
  }
}
```

**Benefits:**
- No undefined checks in implementation
- Type system enforces completeness
- Better autocomplete

---

## 11. Container Handling

### Issue: Container Management Is Unclear

```typescript
new ScoreRenderer(container, options)
```

**Questions:**
- What if container is removed from DOM?
- What if I want to move renderer to different container?
- Can I render to multiple containers?

### Recommendation: Explicit Container Management

```typescript
class ScoreRenderer {
  private containers = new Set<HTMLElement>();

  attachTo(container: HTMLElement): this {
    if (this.containers.has(container)) return this;

    this.containers.add(container);
    if (this.currentNotes.length > 0) {
      this.renderToContainer(container);
    }
    return this;
  }

  detachFrom(container: HTMLElement): this {
    this.containers.delete(container);
    container.innerHTML = '';  // Clear container
    return this;
  }

  detachAll(): this {
    this.containers.forEach(c => c.innerHTML = '');
    this.containers.clear();
    return this;
  }

  renderNotes(notes: ShakuNote[]): void {
    this.currentNotes = notes;
    this.containers.forEach(container => {
      this.renderToContainer(container);
    });
  }

  private renderToContainer(container: HTMLElement): void {
    // Existing rendering logic per container
  }
}

// Usage:
const renderer = new ScoreRenderer(options);
renderer.attachTo(container1);
renderer.attachTo(container2);  // Same score, two places

renderer.setOptions({ showOctaveMarks: false });  // Updates both
```

**Benefits:**
- Reuse renderer across components
- Better framework integration
- Clearer lifecycle

---

## 12. Module Structure

### Issue: Everything in One Index

Current `index.ts` exports everything, making imports verbose:

```typescript
import {
  ScoreRenderer,
  renderScoreFromURL,
  mergeWithDefaults,
  DEFAULT_RENDER_OPTIONS
} from 'shakuhachi-ro';
```

### Recommendation: Subpath Exports

**package.json:**
```json
{
  "exports": {
    ".": "./dist/index.js",
    "./renderer": "./dist/renderer/index.js",
    "./modifiers": "./dist/modifiers/index.js",
    "./utils": "./dist/utils/index.js"
  }
}
```

**Usage:**
```typescript
// Main API
import { ScoreRenderer } from 'shakuhachi-ro';

// Advanced - modifiers
import { OctaveMarksModifier, MeriKariModifier } from 'shakuhachi-ro/modifiers';

// Advanced - utilities
import { getSymbolByRomaji } from 'shakuhachi-ro/utils';
```

**Benefits:**
- Better tree-shaking
- Clearer API boundaries
- Can version subpaths independently

---

## Priority Ranking

### High Priority (Do First)
1. **API Surface Clarity** - Remove internal exports, reduce public API
2. **Async API Consistency** - Make `renderFromScoreData` synchronous
3. **Options Validation** - Add basic validation to prevent broken states
4. **destroy() Documentation** - Already critical, properly document lifecycle

### Medium Priority (Do Soon)
5. **Fluent API Pattern** - Return `this` from setters for chaining
6. **Getters vs Methods** - Use getters for simple property access
7. **Error Handling** - Add typed error classes
8. **Responsive Rendering** - Document autoResize feature better

### Low Priority (Nice to Have)
9. **Event System** - Add lifecycle hooks for advanced use cases
10. **Container Handling** - Multi-container support (probably not needed)
11. **Constructor Overloads** - Deferred attachment (probably not needed)
12. **Module Structure** - Subpath exports (needs build tooling changes)

---

## Breaking vs Non-Breaking Changes

### ✅ Non-Breaking (Can Do Now)
- Add `destroy()` documentation ✓ (done)
- Add validation with warnings (not errors)
- Add event system (additive)
- Add getters alongside methods
- Export additional subpaths
- Add typed error classes

### ⚠️ Breaking (Need Major Version)
- Remove exports from public API
- Change async methods to sync
- Rename classes/methods
- Change return types from `void` to `this`
- Remove deprecated methods

### Migration Strategy
1. Release v1.x with deprecation warnings
2. Document migration path
3. Release v2.0 with breaking changes
4. Maintain v1.x for 6-12 months

---

## Recommended Next Steps

1. **Document current API** ✓ (done)
2. **Add validation warnings** (non-breaking, high value)
3. **Make renderFromScoreData sync** (breaking, but low impact)
4. **Add fluent API** (breaking return types, high value)
5. **Clean up exports** (breaking, critical for v2.0)
6. **Plan v2.0 release** with migration guide
