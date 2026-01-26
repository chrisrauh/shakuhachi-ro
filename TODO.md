# TODO - Shakuhachi Score Renderer

This file tracks active tasks for completing the shakuhachi score renderer project. Complete tasks in order, complete one task at a time, check if the task hasn't already been implemented, finish a task before starting the next, following the workflow defined in `CLAUDE.md`.

## Current Sprint: Perfect First Column Rendering

**Goal:** Perfectly render the first column (rightmost column) of Akatombo matching `examples/scores-pictures/akatombo-kinko-score.png`

**Reference Image:** `examples/scores-pictures/akatombo-kinko-score.png`

### Tasks

- [x] In debug mode, add a border to the svg container
- [x] The svg container should fill the size of the browser viewport, accounting for the header
- [ ] Responsive layout considerations
- [ ] Proper margins and spacing
- [ ] Traditional shakuhachi aesthetic
- [ ] Add score selector
- [ ] Dropdown or navigation to switch between scores
- [ ] Load different score files dynamically
- [ ] Remove octave dots
- [ ] Clean up the code to remove any code related to octave dots
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
