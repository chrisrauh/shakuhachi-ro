# TODO - Shakuhachi Score Renderer

This file tracks active tasks for completing the shakuhachi score renderer project. Complete tasks in order, following the workflow defined in `CLAUDE.md`.

## Current Sprint

### Feature: Score Data Reader and Renderer

**Goal:** Build a feature that reads score data from `src/data` and renders it on an HTML page matching the traditional shakuhachi score layout (example: akatombo-kinko-score.png).

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

- [ ] Create ScoreParser class (`src/parser/ScoreParser.ts`)
  - [ ] Parse score data format into internal structure
  - [ ] Convert to array of ShakuNote objects with modifiers
  - [ ] Handle column breaks and spacing
  - [ ] Validate score data and provide helpful error messages

- [ ] Create ScoreData type definitions (`src/types/ScoreData.ts`)
  - [ ] Define TypeScript interfaces for score structure
  - [ ] Note, Column, Score, Metadata types
  - [ ] Export types for use across codebase

- [ ] Write parser tests
  - [ ] Test valid score parsing
  - [ ] Test error handling
  - [ ] Test edge cases (empty columns, missing data)

#### Phase 3: Score Page Layout

- [ ] Create score.html page
  - [ ] Page structure matching example layout
  - [ ] Load score data from file
  - [ ] Header with score title and metadata
  - [ ] Main score display area
  - [ ] 🪈 Flute emoji favicon

- [ ] Style score page to match example
  - [ ] Vertical column layout (right-to-left)
  - [ ] Column separator lines
  - [ ] Proper margins and spacing
  - [ ] Traditional shakuhachi aesthetic
  - [ ] Responsive layout considerations

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

**Note:** When implementing tasks, follow the workflow in `CLAUDE.md`:
1. Create feature branch
2. Implement the feature
3. Create pull request
4. Review and merge
