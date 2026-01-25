# TODO - Shakuhachi Score Renderer

This file tracks active tasks for completing the shakuhachi score renderer project. Complete tasks in order, complete one task at a time, finish a task before starting the next, following the workflow defined in `CLAUDE.md`.

## Current Sprint: Perfect First Column Rendering

**Goal:** Perfectly render the first column (rightmost column) of Akatombo matching `examples/scores-pictures/akatombo-kinko-score.png`

**Reference Image:** `examples/scores-pictures/akatombo-kinko-score.png`

### Tasks

- [ ] Verify octave dots render correctly above notes
  - [ ] Test OctaveDotsModifier positioning
  - [ ] Ensure dots are visible and correctly placed

- [ ] Identify all notes in first column of example image
  - [ ] Transcribe exact sequence from top to bottom
  - [ ] Document all modifiers (octave dots, meri marks, etc.)

- [ ] Create test data for first column only
  - [ ] Match exact notes from example image
  - [ ] Include all modifiers

- [ ] Render first column vertically
  - [ ] Use VerticalSystem.renderSingleColumn()
  - [ ] Match vertical spacing from example
  - [ ] Ensure proper rotation and positioning

- [ ] Visual validation
  - [ ] Screenshot comparison with example image
  - [ ] Verify all symbols match
  - [ ] Verify all modifiers match
  - [ ] Check spacing and alignment

---

## Completed Work

#### Phase 1: Score Data Format Design

- [x] Analyze example score image to identify all notation elements

  - [x] Note symbols (ロ, ツ, レ, チ, リ, etc.)
  - [x] Octave indicators (dots above/below)
  - [x] Meri/kari pitch marks
  - [x] Technique marks (atari, yuri, etc.)
  - [x] Duration indicators (dots, dashes)
  - [x] Column breaks and spacing
  - **Analysis documented in**: `docs/score-notation-analysis.md`

- [x] Design shakuhachi score data format
  - [x] Choose format: JSON (minimal, with MusicXML import/export planned for future)
  - [x] Define schema for notes, modifiers, columns, metadata
  - [x] Document format in ARCHITECTURE.md and docs/score-data-format.md
  - [x] Create example: Akatombo in new format (src/data/scores/Akatombo.json)
  - [x] Create TypeScript type definitions (src/types/ScoreData.ts)

#### Phase 2: Score Parser Implementation

- [x] Create ScoreParser class (`src/parser/ScoreParser.ts`)

  - [x] Parse score data format into internal structure
  - [x] Convert to array of ShakuNote objects with modifiers
  - [x] Handle column breaks and spacing (handled by VerticalSystem)
  - [x] Validate score data and provide helpful error messages

- [x] Create ScoreData type definitions (`src/types/ScoreData.ts`)

  - [x] Define TypeScript interfaces for score structure
  - [x] Note, Pitch, Score, Metadata types
  - [x] Export types for use across codebase
  - **Completed in Phase 1**

- [x] Write parser tests
  - [x] Test valid score parsing (test-parser.html)
  - [x] Test error handling (validation in ScoreParser)
  - [x] Test with Akatombo.json

#### Phase 3: Score Page Layout

- [x] Create score.html page

  - [x] Page structure matching example layout
  - [x] Load score data from file
  - [x] Header with score title and metadata
  - [x] Main score display area
  - [x] 🪈 Flute emoji favicon

- [ ] Style score page to match example

  - [ ] Make sure all notes are rendering according to the example
  - [ ] Responsive layout considerations
  - [x] Column separator lines
  - [ ] Proper margins and spacing
  - [ ] Traditional shakuhachi aesthetic

- [ ] Add score selector
  - [ ] Dropdown or navigation to switch between scores
  - [ ] Load different score files dynamically

#### Phase 4: Integration

- [ ] Wire parser to renderer

  - [ ] Load score data file
  - [ ] Parse into ShakuNote objects
  - [ ] Pass to VerticalSystem renderer
  - [ ] Display on page

- [ ] Create Akatombo score data file

  - [ ] Transcribe example image to new format
  - [ ] Verify all notation elements captured
  - [ ] Test rendering matches example

- [ ] Visual validation
  - [ ] Compare rendered output to example image
  - [ ] Verify column layout (4 columns, right-to-left)
  - [ ] Check note spacing and alignment
  - [ ] Verify all modifiers render correctly

#### Phase 5: Polish

- [ ] Add score metadata display

  - [ ] Title, composer, tempo, key
  - [ ] Display above score

- [ ] Error handling

  - [ ] Graceful degradation if score file missing
  - [ ] User-friendly error messages
  - [ ] Fallback to demo if data unavailable

- [ ] Documentation
  - [ ] Update README.md with score format info
  - [ ] Add examples/scores/ directory with sample files
  - [ ] Document how to create new scores

### Documentation & Polish

- [ ] Add comprehensive JSDoc comments to all public APIs

  - [ ] SVGRenderer class and methods
  - [ ] Formatter class and methods
  - [ ] VerticalSystem class and methods
  - [ ] ShakuNote class and methods
  - [ ] All Modifier classes
  - [ ] ScoreParser class and methods

- [ ] Write usage guide in examples/README.md

  - [ ] Basic usage examples
  - [ ] Code samples for each modifier type
  - [ ] Common patterns and best practices
  - [ ] Score data format documentation

- [ ] Cross-browser testing
  - [ ] Test in Chrome
  - [ ] Test in Firefox
  - [ ] Test in Safari
  - [ ] Document any browser-specific issues

### Optional Enhancements

- [ ] Add Tozan-ryū support

  - [ ] Implement numeric symbol rendering
  - [ ] Add Tozan-specific modifiers
  - [ ] Create Tozan examples

- [ ] Additional technique modifiers

  - [ ] YuriModifier (vibrato)
  - [ ] MuraikiModifier (breathy tone)
  - [ ] SuriModifier (sliding)
  - [ ] OriModifier (pitch bend)

- [ ] Performance optimizations
  - [ ] Profile rendering performance
  - [ ] Optimize frequent operations
  - [ ] Add caching where appropriate

## Future Platform Features

These are for the future score-sharing platform (post-renderer completion):

- [ ] Score editor web component
- [ ] Database integration for storing scores
- [ ] Fork/share functionality
- [ ] Comments on scores
- [ ] Audio recording uploads
- [ ] User authentication system
- [ ] Score search and discovery

## Backlog / Ideas

- [ ] Multiple score input formats (import from MusicXML, ABC, etc.)
- [ ] Pagination heuristics (symbols per column, page breaks)
- [ ] MIDI playback mapping (optional)
- [ ] Western staff intermixing (future consideration)
- [ ] Custom font support for traditional shakuhachi glyphs
- [ ] Export to PDF/PNG
- [ ] Print stylesheet optimization
- [ ] Score transposition tool
- [ ] Automatic column breaking algorithm

---
