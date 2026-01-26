# TODO - Shakuhachi Score Renderer

This file tracks active tasks for completing the shakuhachi score renderer project. Complete tasks in order, complete one task at a time, check if the task hasn't already been implemented, finish a task before starting the next, following the workflow defined in `CLAUDE.md`.

**Goal:** Render the Akatombo score matching the reference image.
**Reference Image:** `examples/scores-pictures/akatombo-kinko-score.png`

## Current Sprint

**Layout & Styling**
- [ ] Proper margins and spacing to match reference
- [ ] Traditional shakuhachi aesthetic (clean, minimal)
- [ ] Responsive layout considerations

**Octave Dots & Modifiers**
- [ ] Fix octave dots to render visibly (currently not showing)
- [ ] Verify meri/kari marks render correctly
- [ ] Verify atari marks render correctly
- [ ] Test all modifier combinations

**Rendering Accuracy**
- [ ] Verify all note symbols match reference
- [ ] Match vertical spacing from reference image
- [ ] Visual comparison: rendered vs reference screenshot
- [ ] Adjust positioning/spacing as needed

## Multi-Column Layout (Next Sprint)

- [ ] Implement column breaking logic
- [ ] Render multiple columns right-to-left
- [ ] Add column separator lines
- [ ] Verify 4-column layout matches reference

## UI Enhancements

- [ ] Add score selector dropdown
- [ ] Load different score files dynamically
- [ ] Display score metadata (title, composer, tempo)
- [ ] Error handling for missing files
- [ ] User-friendly error messages

## Documentation

- [ ] Add JSDoc comments to public APIs
- [ ] Write usage guide in examples/README.md
- [ ] Update README.md with project overview
- [ ] Document score data format
- [ ] Cross-browser testing notes

## Future Enhancements

**Tozan-ryū Support**
- [ ] Implement numeric symbol rendering
- [ ] Add Tozan-specific modifiers

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

- [ ] Multiple score input formats (import from ABC, etc.)
- [ ] MIDI playback mapping
- [ ] Western staff intermixing
- [ ] Custom font support for traditional glyphs
- [ ] Export to PDF/PNG
- [ ] Print stylesheet optimization
- [ ] Score transposition tool
- [ ] Automatic column breaking algorithm
