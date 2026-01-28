# TODO - Shakuhachi Score Renderer

This file tracks active tasks for completing the shakuhachi score renderer project. Complete tasks in order, complete one task at a time, check if the task hasn't already been implemented, finish a task before starting the next, following the dev workflow defined in `CLAUDE.md`.

**Goal:** Render the Akatombo score matching the reference image.
**Reference Image:** `references/scores-pictures/akatombo-kinko-score.png`
**Secondary Reference Image comparing western and kinko notation:** `references/scores-pictures/akatombo-kinko-western-score.jpg`

## Current Tasks

**Rendering Accuracy**

- [ ] Verify all note symbols match reference
- [ ] Match vertical spacing from reference image
- [ ] Visual comparison: rendered vs reference screenshot
- [ ] Adjust positioning/spacing as needed
- [ ] Adjust score font weight so that the large and smaller characters are balanced visually. Smaller characters might need additional weight to match the larger ones. Check with user until it is visually correct.

**Layout & Styling**

- [ ] Responsive layout considerations

** Modifiers**

- [ ] Verify atari marks render correctly

**Multi-Column Layout Discrepancies**

- [ ] Notes per column distribution differs from reference

## UI Enhancements

- [ ] Add score selector dropdown
- [ ] Load different score files dynamically
- [ ] Error handling for missing files
- [ ] User-friendly error messages

## Documentation

- [ ] Add JSDoc comments to public APIs
- [ ] Write usage guide in references/README.md
- [ ] Update README.md with project overview
- [ ] Document score data format
- [ ] Cross-browser testing notes

## Future Enhancements

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
