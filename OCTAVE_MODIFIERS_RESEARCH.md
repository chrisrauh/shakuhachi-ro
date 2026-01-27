# Octave Modifiers in Kinko Shakuhachi Notation - Research Summary

**Date:** 2026-01-27
**Task:** Research octave modifier representation in Kinko notation

## Executive Summary

Octave modifiers in Kinko shakuhachi notation indicate when notes are played in upper registers (kan and daikan). The current implementation uses small diagonal stroke marks positioned to the upper-left of note symbols.

## Current Implementation

### Code Implementation (OctaveMarksModifier.ts)

The current codebase implements octave marks as follows:

- **Visual Representation:** Short diagonal strokes (/)
- **Position:** Upper-left of the note character
- **Count:**
  - 1 stroke for kan (first overtone, +1 octave)
  - 2 strokes for daikan (second overtone, +2 octaves)
  - No marks for otsu (base octave)

### Configuration
- **Stroke Length:** 6px (configurable)
- **Stroke Width:** 1.5px (configurable)
- **Color:** Black (#000)
- **Offset:** -12px left, -20px to -25px above note

### Data Model (ScoreData.ts)

Octaves are represented numerically in the data format:
- `octave: 0` = otsu (base register)
- `octave: 1` = kan (upper register, +1 octave)
- `octave: 2` = daikan (highest register, +2 octaves)

## Reference Analysis

### Reference Images

**Image 1:** `akatombo-kinko-score.png`
- Traditional handwritten Kinko notation
- Vertical columns reading right to left
- Some notes appear to have small marks to the upper-left (octave indicators)

**Image 2:** `akatombo-kinko-western-score.jpg`
- Comparison between Western staff notation and Kinko notation
- Shows the same piece (Akatombo) in both notations
- Western notation clearly shows notes spanning octave 4 and octave 5
- Kinko notation below uses katakana characters with various modifiers

### Akatombo Score Analysis

The Akatombo MusicXML file contains:
- **17 notes in octave 4** (otsu register)
- **14 notes in octave 5** (kan register)

This confirms that approximately 45% of the notes in Akatombo are in the upper (kan) register and should display octave marks.

## Research Findings

### Terminology

From web research and documentation review:

1. **Octave Registers:**
   - **Otsu (乙)**: Lower/base register (fundamental pitch)
   - **Kan (甲)**: Upper register (first overtone series)
   - **Daikan**: Second upper register (though less commonly documented than kan)

2. **Notation Convention:**
   - Kinko notation uses katakana symbols: ロ (ro), ツ (tsu), レ (re), チ (chi), リ (ri), ヒ (hi), ウ (u)
   - Same symbols are used for all octaves
   - Octave differentiation requires additional marks

3. **Limited Documentation:**
   - Kinko-ryū tradition emphasizes oral/experiential learning over written documentation
   - Master-disciple relationship is prioritized
   - Specific visual conventions vary between schools and teachers
   - Hard-and-fast rules for notation are scarce

### Current Implementation Status

**Working:**
- ✅ Octave data correctly parsed from MusicXML
- ✅ OctaveMarksModifier class implemented
- ✅ Modifiers automatically added based on octave value
- ✅ Rendering pipeline in place (SVGRenderer draws the strokes)
- ✅ Can be toggled via URL parameter (?octaveMarks=false)

**To Verify:**
- ⏳ Visual appearance matches traditional Kinko scores
- ⏳ Positioning relative to note characters is correct
- ⏳ Stroke size and weight are appropriate
- ⏳ Spacing doesn't interfere with adjacent notes

**Not Implemented:**
- ❌ Atari (finger-pop) marks verification in actual scores
- ❌ Meri/kari marks visual verification
- ❌ Comprehensive test suite for all modifier combinations

## Testing Observations

### Current Rendering (2026-01-27)

**Test URL:** http://localhost:3000

Notes with "(kan)" label in debug mode:
- #6, #7, #8, #9, #10 (ro, re, tsu, ro, tsu)
- #17, #18, #19, #20, #21, #22, #23, #24 (re, ro, tsu, re, tsu, ro, tsu, ro)

**Visual Check Results:**
- Octave marks are configured to render (code present in index.html)
- Debug mode confirms octave detection is working
- Stroke marks should be visible but may be subtle
- Further visual comparison against reference image needed

## Recommendations

### Immediate Actions

1. **Visual Comparison:**
   - Take high-resolution screenshots of rendered score
   - Compare side-by-side with reference image
   - Verify octave mark visibility and positioning

2. **Verification Testing:**
   - Create test scores with known octave patterns
   - Verify marks appear correctly for octave 1 (kan) and octave 2 (daikan)
   - Test edge cases (first/last notes in column, adjacent kan notes)

3. **Unit Tests:**
   - Test OctaveMarksModifier rendering output
   - Test ScoreParser correctly adds octave modifiers
   - Test mark positioning calculations

### Future Enhancements

1. **Configurable Styles:**
   - Allow different visual styles for octave marks (strokes vs dots vs other conventions)
   - Support for different school traditions (Kinko vs Tozan)

2. **Documentation:**
   - Add JSDoc comments explaining octave mark conventions
   - Document sources and references for notation decisions
   - Create visual guide showing all modifier types

3. **Research:**
   - Gather more reference images from multiple sources
   - Interview shakuhachi practitioners about notation preferences
   - Study published scores from different schools

## Sources

Web research conducted on 2026-01-27:

- [Shakuhachi musical notation - Wikipedia](https://en.wikipedia.org/wiki/Shakuhachi_musical_notation)
- [Reading shakuhachi notation - Shakuhachi Forum](http://www.shakuhachiforum.com/viewtopic.php?id=2681)
- [Kinko Rules - Araki Kodo VI](https://www.arakikodo.com/blog/kinko-rules)
- [Shakuhachi Note Charts - Josen Shakuhachi](https://josenshakuhachi.com/shakuhachi-guides/shakuhachi-note-charts)
- [Shakuhachi Note Charts - Flute Dojo](https://flutedojo.com/guides/shakuhachi-note-charts)
- [Shakuhachi Fingering Chart - Kinko notation](https://dokanshakuhachi.files.wordpress.com/2012/01/fingerchart.pdf)
- [How to produce 'kan' (upper octave) - Riley Lee](https://rileylee.com/blog/how-to-produce-kan-upper-octave)

## CRITICAL UPDATE (2026-01-27): Contextual Octave Marking

### The Closest Note Principle

**Important discovery from shakuhachi teacher:**

Octave marks in Kinko notation are **CONTEXTUAL and RELATIVE**, not absolute indicators.

**Default Rule:**
When notes follow each other in sequence, the next note is assumed to be the **closest instance** of that pitch to the previous note. No octave mark is needed in this case.

**When Octave Marks Are Used:**
Octave marks are ONLY added when the actual note **violates** the closest note principle.

### Examples

**Example 1: No mark needed**
- Sequence: ri (otsu) → ro
- ri (otsu) is near the top of otsu register
- Closest ro to ri (otsu) is ro (kan) - in the next octave up
- Player naturally interprets this as ri (otsu) → ro (kan)
- **No mark needed** - this follows the closest note principle

**Example 2: Mark IS needed**
- Sequence: ri (otsu) → ro (otsu)
- Without a mark, player would assume ri (otsu) → ro (kan) by closest note principle
- Since we want ro (otsu) instead, we need an **octave mark on ro**
- The mark says "stay in otsu register" (break the default assumption)

### Implementation Implications

**Current Implementation is WRONG:**
- Currently marking ALL kan notes with octave marks
- Should only mark notes that violate the closest note principle

**Required Changes:**
1. Implement algorithm to calculate "expected" octave based on previous note
2. Calculate chromatic distance between pitches to determine "closest"
3. Only add octave marks when actual octave ≠ expected octave
4. This is a sequential/stateful calculation - each note depends on previous

**Algorithm Needed:**
```
For each note in sequence:
  - Get previous note's pitch and octave
  - Calculate which octave of current note is closest to previous
  - If actual octave == expected octave: no mark
  - If actual octave != expected octave: add octave mark
```

### Reference Analysis Revisited

Looking at `akatombo-kinko-score.png`:
- The score does NOT use octave marks throughout
- This confirms the contextual principle - marks only where needed
- Most octave transitions follow the closest note rule naturally

### Additional Context Rules

**First note:**
- Default assumption: otsu register
- If first note is kan or daikan → needs octave mark
- If first note is otsu → no mark

**Rests:**
- Rests do NOT reset octave context
- Rests carry the octave context through
- Example: ro (otsu) → rest → tsu → tsu still references ro (otsu) as previous pitch
- The closest-note principle continues across rests

### Visual Representation

**Correct representation (from teacher):**
- Octave marks use **small kanji characters**: **乙 (otsu)** and **甲 (kan)**
- NOT diagonal strokes or dots
- These appear as small text positioned around the main note character

**Modifier Positioning System:**
- Notes have **8 potential modifier positions** (like compass points around the character):
  1. Top-left
  2. Top-center
  3. Top-right
  4. Right-center
  5. Bottom-right
  6. Bottom-center
  7. Bottom-left
  8. Left-center

**Default positions:**
- **Primary position for octave marks:** Top-right
- **Fallback position:** Left side (when top-right occupied by other modifiers)

**For initial implementation:**
- Use **top-left** position (fixed)
- Multiple modifier conflict resolution: future work

## Conclusion

The current implementation fundamentally misunderstands Kinko octave notation:
- ❌ Currently: Absolute marking system (mark all kan/daikan notes)
- ✅ Should be: Contextual marking system (mark only violations of closest-note principle)

This is a perfect example of domain knowledge that cannot be learned from documentation alone - it requires instruction from a practitioner.

**Next Steps:**
1. Implement closest-note calculation algorithm
2. Modify ScoreParser to apply marks contextually
3. Test with known sequences (ri→ro cases)
4. Verify against reference scores
