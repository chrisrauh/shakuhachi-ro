# Shakuhachi Score Renderer - Architecture

> **Technical architecture, design patterns, and implementation guidelines. For active tasks, see [TODO.md](./TODO.md). For development workflow, see [CLAUDE.md](./CLAUDE.md). For user documentation, see [README.md](./README.md).**

---

## Project Goal

Create a clean, focused renderer for traditional shakuhachi notation without the complexity of supporting Western notation.

## Design Principles

- Implement **similar architectural patterns** to VexFlow's component hierarchy: modifiers, annotations, notes, formatters, staves, systems, and renderers. Study VexFlow's design but build shakuhachi-specific versions.
- Assume **vertical page flow** is required for shakuhachi. Implement vertical rendering by grouping the SVG output and applying transforms, or by a layout system that handles vertical spacing internally.
- Prefer **SVG** backend first (clean transforms & CSS control). Keep Canvas parity if feasible.
- Keep the architecture clean, modular, and focused on shakuhachi notation only.
- Follow the software enginering principles defined in CLAUDE.md

## Shakuhachi Notation Structure

### Kinko-ryū

- Vertical columns of **katakana/kana** note names (e.g., ロ, ツ, レ, チ, リ)
- **Dots/lines for rhythm** and technique marks (meri/kari)
- Reading order typically **top→bottom, right→left**
- Honkyoku often lacks strict meter

### Tozan-ryū

- More metrically explicit
- Often **numeric** note symbols with additional marks

### Core Techniques

- **Meri/Kari** are core pitch-bend techniques and must be representable as modifiers
- **Atari** - finger pop technique
- **Yuri** - vibrato
- **Muraiki** - breathy tone

### Key Differences from Western Notation

- Pitch is NOT encoded by vertical placement on a staff
- Time spacing is looser, often lacks strict meter
- Symbols are instrument-specific (text/glyph rendering instead of noteheads/beams)
- Reading order: top→bottom, right→left (opposite of Western left→right)

## Core Components

### 1. ShakuNote

Core note class that renders a kana (Kinko) or numeric (Tozan) symbol

**Properties:**

- `symbol` - The note symbol (e.g., 'ro', 'tsu', 're')
- `duration` - Note duration for spacing (e.g., 'q', 'h', 'w')
- `octave` - Octave information
- `meriKari` - Pitch bend state
- `techniques` - Array of technique modifiers

**Methods:**

- `setSymbol()` - Set the note symbol
- `setOctaveDots()` - Add octave indicators
- `setMeriKari()` - Set pitch bend
- `addTechnique()` - Add technique modifiers
- `render(renderer)` - Draw note and all modifiers
- `getBBox()` - Return bounding box for layout

### 2. Modifier (Base Class)

Base class for marks that attach to notes (dots, slashes, arrows)

**Specific Modifiers:**

- `MeriKariModifier` - Pitch-bend marks (◁ for meri, ▷ for kari)
- `OctaveMarksModifier` - Octave register marks using kanji characters (乙 for otsu, 甲 for kan)
- `AtariModifier` - Finger-pop technique mark (>)

**Octave Marking - Closest Note Principle:**

Octave marks in Kinko notation are **contextual and relative**, not absolute indicators. They follow the "closest note principle":

- **Default behavior:** When notes follow each other in sequence, the next note is assumed to be the **closest instance** of that pitch to the previous note (no mark needed)
- **When marks are used:** Marks are ONLY added when the actual note **violates** the closest note principle
- **First note:** Defaults to otsu register; mark if in kan or daikan
- **Rests:** Do NOT reset octave context; rests carry the octave context through

**Examples:**
- `ri (otsu) → ro`: Closest ro to ri (otsu) is ro (kan), so no mark needed
- `ri (otsu) → ro (otsu)`: Needs octave mark on ro because it violates the closest-note assumption
- `ro (otsu) → rest → tsu`: The tsu still references ro (otsu) as the previous pitch

**Visual Representation:**
- Small kanji characters: **乙 (otsu)** or **甲 (kan)**
- NOT diagonal strokes or dots
- Position: Top-left of note character (initially; will support 8-position system later)

**Implementation:**
The ScoreParser implements a closest-note algorithm that:
1. Calculates chromatic distance between consecutive pitches
2. Determines which octave of the next note is "closest" to the previous
3. Only adds OctaveMarksModifier when actual octave ≠ expected octave

**Positioning:**

- Position themselves relative to parent note's bounding box
- Properties: `offsetX`, `offsetY` for positioning relative to note
- Method: `render(renderer, x, y)` - Draw the modifier
- **8-Position System:** Notes have 8 potential modifier positions around them (top-left, top-center, top-right, right-center, bottom-right, bottom-center, bottom-left, left-center)
- Multiple modifiers need smart positioning to avoid overlap (future enhancement)

### 3. SVGRenderer

SVG rendering context providing low-level drawing operations

**Drawing Primitives:**

- `drawText()` - Render text (kana symbols)
- `drawLine()` - Draw lines
- `drawCircle()` - Draw circles (for octave dots)
- `drawPath()` - Draw paths (for technique marks)

**Group Management:**

- `openGroup()` - Create SVG group element
- `closeGroup()` - Close current group
- Transform support for vertical layout

**Font:**

- Use standard JP font (e.g., Noto Sans JP) via CSS for kana
- Kana are not defined in SMuFL, so render as normal text

### 4. Formatter

Implements spacing logic for notes

**Approach:**

- Works horizontally with rotation applied to result (simpler than native vertical spacing)
- Start with horizontal spacing and SVG group rotation as simpler approach
- Positions notes along X axis using tick widths
- Reuse horizontally and rotate/transpose for vertical flow

**Method:**

- `formatNotes(notes)` - Calculate x positions for array of notes based on duration
- Simple spacing: quarter note = 40px, half = 80px, etc.
- Can be extended for more sophisticated spacing later

### 5. VerticalSystem

Coordinates rendering of vertical columns

**Layout Management:**

- Groups shakuhachi elements in SVG groups
- Applies `transform="rotate(-90 …) translate(…)"` to groups
- Alternative: use CSS `writing-mode: vertical-rl; text-orientation: upright;` to text nodes if rotation causes illegibility

**Column Support:**

- Method: `renderColumns(notes, { notesPerColumn, columnSpacing })`
- Splits notes into multiple columns
- Renders columns **right-to-left** (traditional reading order)

### 6. Symbol Mapping Tables

Location: `src/data/mappings.ts`

**Structure:**

- `kinkoMap` and `tozanMap` → `{ symbol, defaultOctave, defaultTechniques }`
- Include basic set: **ロ, ツ, レ, チ, リ, イ, ヒ**
- Octave dots above/below and meri/kari variants
- Common techniques (yuri, atari, muraiki)

**Kinko Symbols:**
| Symbol | Kana | Romaji | Description |
|--------|------|--------|-------------|
| ro | ロ | ro | Lowest note |
| tsu | ツ | tsu | |
| re | レ | re | |
| chi | チ | chi | |
| ri | リ | ri | |
| u | ウ | u | |
| hi | ヒ | hi | Highest basic note |

**Duration Notation:**

- `'q'` - Quarter note
- `'h'` - Half note
- `'w'` - Whole note
- `'e'` - Eighth note
- `'s'` - Sixteenth note

## Score Data Format

### Minimal JSON Format

Shakuhachi scores are stored as simple JSON files containing a flat sequence of notes and metadata. The format follows MusicXML-like structure for familiarity and future interoperability.

**File Location:** `src/data/scores/`

**Format Structure:**

```typescript
{
  "title": string,           // Score title
  "style": "kinko",          // Notation style (kinko or tozan)
  "notes": Note[]            // Flat array of notes in performance order
}

Note = {
  "pitch": {
    "step": string,          // Fingering: "ro" | "tsu" | "re" | "chi" | "ri" | "u" | "hi"
    "octave": number         // 0=otsu (base), 1=kan, 2=daikan
  },
  "duration": number,        // Duration in relative timing units
  "meri"?: boolean           // Optional: true if meri mark present
}
```

**Design Principles:**

- **Minimal** - Only includes what's needed (no over-engineering)
- **MusicXML-like** - Follows MusicXML structure (pitch.step, pitch.octave, duration)
- **Flat structure** - Just a sequence of notes in performance order
- **Separation of concerns** - Data describes notes, renderer handles column layout

**Column Layout:**
Column breaks are determined dynamically by the renderer based on available space, not stored in the data. This allows responsive layouts for different screen sizes and print formats.

**Example:**

```json
{
  "title": "Akatombo",
  "style": "kinko",
  "notes": [
    { "pitch": { "step": "tsu", "octave": 1 }, "duration": 1 },
    { "pitch": { "step": "re", "octave": 1 }, "duration": 1 },
    { "pitch": { "step": "chi", "octave": 1 }, "duration": 2 }
  ]
}
```

**Future Enhancements:**

- MusicXML import/export for interoperability with Western music software
- Extended modifiers (kari, atari, yuri)
- Score metadata (composer, tempo, mood)

**See:** `docs/score-data-format.md` for detailed format specification

## Column & Pagination

- Build a simple **columnizer**: cut a long sequence of `ShakuNote`s into vertical columns of N tokens (configurable)
- Render each column as a **system** that becomes a vertical strip after rotation
- Reading order **right→left**: place columns right-to-left before rotation

## Project Structure

```
src/
  ├── renderer/
  │   ├── SVGRenderer.ts          # SVG drawing primitives & context
  │   ├── Formatter.ts            # Note spacing logic
  │   └── VerticalSystem.ts       # Vertical layout & columns
  ├── notes/
  │   └── ShakuNote.ts            # Core shakuhachi note class
  ├── modifiers/
  │   ├── Modifier.ts             # Base modifier class
  │   ├── MeriKariModifier.ts     # Meri/kari pitch bend marks
  │   ├── OctaveDotsModifier.ts   # Octave indicator dots
  │   └── AtariModifier.ts        # Atari technique mark
  ├── data/
  │   └── mappings.ts             # Kinko/Tozan symbol maps
  └── index.ts                    # Main exports

examples/
  ├── basic-kinko.html            # Simple Kinko example
  └── README.md                   # Usage documentation

tests/
  ├── renderer/
  ├── notes/
  └── modifiers/

index.html                        # Main demo page
```

## Research Guidelines

Before implementing new features, produce a short markdown research brief (2-3 paragraphs with links) covering:

- Kinko notation (kana, dots/lines for rhythm, meri/kari techniques)
- Tozan notation (numeric symbols, more metrical)
- Vertical layout and reading order (top→bottom, right→left)
- Key differences from Western staff notation

## Success Criteria

- ✓ Render Kinko phrase with kana symbols, octave dots, meri/kari marks in vertical columns (right→left)
- ✓ Clean, modular architecture inspired by VexFlow patterns
- ✓ TypeScript compiles with no errors
- ✓ Working examples demonstrate core features
- ✓ Visual output matches traditional shakuhachi score layout
- ✓ Code is simple, maintainable, and well-documented (KISS principle)

## Technical Implementation Notes

**VexFlow Reference:**

- For inspiration only - study their patterns, build shakuhachi-specific versions from scratch
- Do not use VexFlow as a dependency
- Study their `Formatter`, `Modifier`, `SVGContext` patterns

**Font Strategy:**

- Use Noto Sans JP via CSS for kana
- Kana are NOT in SMuFL (Standard Music Font Layout)
- Rendering as normal text keeps font setup simple

**Layout Strategy:**

- Start with horizontal spacing + SVG rotation (simpler approach)
- Can optimize with native vertical formatter later if needed
- True Y-axis formatter is more complex than rotation

**Scope:**

- Focus on Kinko-ryū notation first
- Tozan support is secondary/optional

**Testing:**

- Browser-based visual validation after each implementation step
- Test in Chrome, Firefox, Safari
- Ensure cross-browser compatibility

## Why This Approach

**Symbol-driven, vertical, technique-rich:**

- Shakuhachi notation is fundamentally different from Western staff notation
- Building a dedicated renderer lets us focus entirely on shakuhachi needs
- No complexity of supporting Western notation systems
- We draw text glyphs + modifiers specific to shakuhachi

**VexFlow-inspired architecture:**

- VexFlow provides excellent proven patterns for structuring music notation renderers
- Modular components (formatters, modifiers, rendering contexts)
- By reimplementing these patterns from scratch, we get a clean, maintainable codebase
- Tailored specifically to shakuhachi requirements

**Horizontal + rotation approach:**

- Starting with horizontal layout + SVG rotation is simpler
- Native vertical formatting can be optimized later if needed
- Reduces initial complexity

**Text-based kana rendering:**

- Kana are NOT in SMuFL
- Rendering as normal text keeps font setup simple
- Standard web fonts work out of the box

**Standalone project:**

- Easier to maintain, test, and evolve than a fork
- No need to track upstream VexFlow changes
- Full control over architecture and features

## Risks / Blockers

**Vertical layout complexity:**

- True Y-axis formatter is more complex than rotation
- Start with rotation/group approach and optimize later if needed
- Risk: May need to refactor if rotation approach has limitations

**Font compatibility:**

- Font issues for kana in Canvas/SVG
- Need to test device fonts vs. bundling a JP webfont
- Noto Sans JP recommended as fallback

**Modifier positioning:**

- Modifier overlap tuning may require empirical offsets per font size
- Risk: Different fonts may require different offset calculations

**Architectural complexity:**

- Building from scratch requires more upfront design work
- Benefit: Results in a cleaner, more maintainable codebase
- Risk: May take longer than forking VexFlow

## Open Questions to Investigate

**School scope:**

- Kinko only vs Kinko + Tozan initial release?
- Symbol sets differ between schools
- Need to decide on scope before implementation

**Text rotation:**

- Upright text after rotation: rotate kana back or use `writing-mode` on `<text>`?
- Need to verify per browser/renderer
- May affect cross-browser compatibility

**Technique coverage:**

- Which techniques to support as first-class modifiers?
- yuri (vibrato), muraiki (breathy), atari (finger pop), suri/ori gestures
- Some are rarely notated explicitly
- Need to prioritize based on common usage

**Input format:**

- DSL (e.g., `ro' meri, tsu ..`) vs JSON tokens vs fluent API?
- How will users programmatically build scores?
- Need to design ergonomic API

**Pagination:**

- How many symbols per column?
- Column spacing for typical A4/Letter paper
- Page breaks and multi-page handling

**Playback mapping (optional):**

- MIDI pitches for otsu/kan/daikan + meri/kari microtones
- Non-blocking, low priority
- May be useful for future platform features

**Western staff intermixing:**

- Future consideration only
- Would require integrating with a Western notation renderer
- Or building minimal Western staff support
- Not in current scope

## References

### Shakuhachi Notation

- [Shakuhachi Musical Notation - Wikipedia](https://en.wikipedia.org/wiki/Shakuhachi_musical_notation) - Notation overview & traditions
- [Shakuhachi, Then and Now - National Flute Association](https://www.nfaonline.org/docs/default-source/committees-documents/global-flutes-committee/shakuhachi--then-and-now.pdf) - Kinko dots/lines, right-to-left reading
- [Neptune, Shakuhachi: A Tozan Playing Guide](https://www.shakuhachi.com/PG-Neptune.html) - Tozan notation
- [Shakuhachi Notes - Josen Shakuhachi](https://josenshakuhachi.com/shakuhachi-guides/shakuhachi-note-charts) - Basic note charts
- [Kinko Rules - Araki Kodo VI](https://www.arakikodo.com/blog/kinko-rules) - Traditional Kinko-ryū rules

### Techniques

- [Meri and Kari on Shakuhachi](https://www.japanshakuhachi.com/meri-and-kari.html) - Pitch-bend technique background
- [Fingering Charts (Kinko, Tozan, Zensabo, KSK)](https://files.shakuhachisociety.eu/resources/getting-started/Fingering%20Chart%20%28Kinko%2C%20Tozan%2C%20Zensabo%2C%20KSK%29.pdf) - Comprehensive fingering reference

### VexFlow Architecture (Inspiration)

- [VexFlow Documentation](https://vexflow.github.io/vexflow-docs/) - Study patterns for Formatter, modifiers, rendering contexts
- [TextNote - VexFlow](https://vexflow.github.io/vexflow-docs/api/dev/classes/TextNote.html) - Tickable text elements
- [Formatter - VexFlow](https://vexflow.github.io/vexflow-docs/api/5.0.0/classes/Formatter.html) - Note spacing logic
- [ModifierContext - VexFlow](https://vexflow.github.io/vexflow-docs/api/5.0.0/classes/ModifierContext.html) - Modifier positioning
- [SVGContext - VexFlow](https://0xfe.github.io/vexflow/api/classes/SVGContext.html) - SVG rendering context
- [renderer.js - VexFlow](https://www.vexflow.com/build/docs/renderer.html) - Renderer documentation

### Technical Standards

- [SMuFL Glyph Tables](https://w3c.github.io/smufl/latest/tables/index.html) - Why kana aren't music glyphs
- [Creating Vertical Form Controls - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_writing_modes/Vertical_controls) - CSS writing-mode for vertical text

### Academic

- [The Shakuhachi and the Kinko Ryū Notation - JSTOR](https://www.jstor.org/stable/833910) - Academic research on notation
