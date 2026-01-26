# TODO - Shakuhachi Score Renderer

This file tracks active tasks for completing the shakuhachi score renderer project. Complete tasks in order, complete one task at a time, check if the task hasn't already been implemented, finish a task before starting the next, following the workflow defined in `CLAUDE.md`.

## Current Sprint: Perfect First Column Rendering

**Goal:** Perfectly render the first column (rightmost column) of Akatombo matching `examples/scores-pictures/akatombo-kinko-score.png`

**Reference Image:** `examples/scores-pictures/akatombo-kinko-score.png`

### Tasks

**Layout & Viewport**
- [x] In debug mode, add a border to the svg container
- [x] The svg container should fill the size of the browser viewport, accounting for the header
- [ ] Proper margins and spacing to match reference image
- [ ] Traditional shakuhachi aesthetic (clean, minimal styling)

**Octave Dots**
- [ ] Fix octave dots to render visibly to the right of notes
- [ ] Verify octave dot positioning matches reference image
- [ ] Test with multiple octave levels (kan, daikan)

**First Column Rendering**
- [ ] Verify all notes render with correct symbols
- [ ] Match vertical spacing from reference (currently 60px)
- [ ] Verify all modifiers render correctly (meri/kari, atari, etc.)
- [ ] Visual comparison: screenshot vs reference image
- [ ] Adjust spacing/positioning if needed

**Multiple Columns (Future Sprint)**
- [ ] Implement column breaking logic
- [ ] Render 4 columns right-to-left
- [ ] Column separator lines
- [ ] Verify full score layout matches reference

**UI Enhancements**
- [ ] Add score selector dropdown
- [ ] Load different score files dynamically
- [ ] Add score metadata display (title, composer, tempo)
- [ ] Responsive layout considerations

**Error Handling**
- [ ] Graceful degradation if score file missing
- [ ] User-friendly error messages
- [ ] Fallback to demo if data unavailable

## Documentation & Testing

- [ ] Add JSDoc comments to public APIs (SVGRenderer, VerticalSystem, ShakuNote, Modifiers, ScoreParser)
- [ ] Write usage guide in examples/README.md
- [ ] Update README.md with score format info
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Document any browser-specific issues

## Optional Enhancements

**Tozan-ryū Support**
- [ ] Implement numeric symbol rendering
- [ ] Add Tozan-specific modifiers
- [ ] Create Tozan examples

**Additional Modifiers**
- [ ] YuriModifier (vibrato)
- [ ] MuraikiModifier (breathy tone)
- [ ] SuriModifier (sliding)
- [ ] OriModifier (pitch bend)

**Performance**
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
- [ ] MIDI playback mapping (optional)
- [ ] Western staff intermixing (future consideration)
- [ ] Custom font support for traditional shakuhachi glyphs
- [ ] Export to PDF/PNG
- [ ] Print stylesheet optimization
- [ ] Score transposition tool
