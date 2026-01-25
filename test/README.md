# Testing Guide

This project uses two complementary testing approaches:

## 1. Unit Tests (Vitest)

**Location:** Co-located with source files as `*.test.ts`

```
src/
  parser/
    ScoreParser.ts
    ScoreParser.test.ts       # Unit tests for ScoreParser
```

**Running Tests:**

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

**Use for:**
- Testing logic and algorithms
- Validation and error handling
- Data transformations
- Parser functionality

**Example:**

```typescript
import { describe, it, expect } from 'vitest';
import { ScoreParser } from './ScoreParser';

describe('ScoreParser', () => {
  it('should parse a valid score', () => {
    const scoreData = {
      title: 'Test',
      style: 'kinko',
      notes: [{ pitch: { step: 'ro', octave: 0 }, duration: 1 }]
    };

    const notes = ScoreParser.parse(scoreData);

    expect(notes).toHaveLength(1);
  });
});
```

## 2. Visual Browser Tests

**Location:** `test/` directory (HTML files) + `src/test-*.js` (scripts)

```
test/
  test-parser.html          # ScoreParser visual test
  test-vertical.html        # VerticalSystem visual test
  test-shakunote.html       # ShakuNote visual test
  test-octave-dots.html     # OctaveDotsModifier visual test
  test-merikari.html        # MeriKariModifier visual test
  test-atari.html           # AtariModifier visual test
  test-formatter.html       # Formatter visual test
  test-modifiers.html       # Modifier system visual test
  test-mappings.html        # Symbol mappings visual test
  test-note-parser.html     # Note parser visual test

src/
  test-vertical.js          # Script for test-vertical.html
  test-shakunote.js         # Script for test-shakunote.html
  # etc...
```

**Running Visual Tests:**

1. Start dev server: `npm run dev`
2. Navigate to any test file in browser (e.g., `http://localhost:3000/test/test-parser.html`)
3. Open browser console (F12) to see detailed output
4. Visually inspect the rendered SVG output

**Use for:**
- Testing SVG rendering
- Visual validation of notation
- Layout and spacing
- Modifier positioning
- Vertical column layout
- Browser compatibility

## Testing Strategy

| Test Type | What to Test | Tool |
|-----------|--------------|------|
| **Logic** | Data parsing, validation, transformations | Unit Tests (Vitest) |
| **Rendering** | SVG output, visual layout, spacing | Visual Tests (Browser) |
| **Integration** | Full score rendering from JSON | Both |

## Best Practices

1. **Write unit tests first** for new logic/algorithms
2. **Use visual tests** to validate rendering output
3. **Keep tests simple** - follow KISS principle
4. **Co-locate unit tests** with source files for easy maintenance
5. **Run tests before commits** to catch regressions

## Configuration

- **Vitest config:** `vitest.config.ts`
- **Test environment:** jsdom (for DOM APIs in unit tests)
- **Test pattern:** `src/**/*.test.ts`
