# Testing Guide

This project uses [Vitest](https://vitest.dev/) for unit testing.

## Running Tests

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

## Test Structure

Tests are co-located with source files using the `.test.ts` suffix:

```
src/
  parser/
    ScoreParser.ts
    ScoreParser.test.ts
```

## Writing Tests

Example test file:

```typescript
import { describe, it, expect } from 'vitest';
import { ScoreParser } from './ScoreParser';

describe('ScoreParser', () => {
  it('should parse a valid score', () => {
    const scoreData = {
      title: 'Test',
      style: 'kinko',
      notes: [
        { pitch: { step: 'ro', octave: 0 }, duration: 1 }
      ]
    };

    const notes = ScoreParser.parse(scoreData);

    expect(notes).toHaveLength(1);
    expect(notes[0].getKana()).toBe('ロ');
  });
});
```

## Coverage

Test coverage reports are generated in the `coverage/` directory when running `npm run test:coverage`.

## Test Environment

- **Test Runner**: Vitest
- **Environment**: jsdom (for DOM testing)
- **Assertion Library**: Vitest (built-in, Chai-compatible)
