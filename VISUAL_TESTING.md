# Visual Testing Checklist

This checklist should be verified before considering any visual changes complete.

## Symbol Rendering

- [ ] All base symbols render correctly (ロ, ツ, レ, チ, リ, ウ, ヒ)
- [ ] Symbols are not cut off or clipped at any edge
- [ ] Font weight is consistent and readable

## Modifiers

- [ ] Meri marks (メ, 中, 大) position correctly to the left of notes
- [ ] Meri marks are not cut off or overlapping with notes
- [ ] Octave marks (乙, 甲) render completely without clipping at top/bottom
- [ ] Octave marks position correctly relative to notes
- [ ] Duration dots position correctly below notes
- [ ] Duration dots are visible and not clipped

## Spacing & Layout

- [ ] Vertical spacing between notes is consistent
- [ ] Column spacing is appropriate
- [ ] No unexpected overflow or wrapping
- [ ] Top margin provides adequate space for octave marks
- [ ] Bottom margin provides adequate space for duration dots

## SVG Rendering

- [ ] SVG overflow is set to 'visible' to prevent clipping
- [ ] All elements within SVG boundaries render correctly
- [ ] Elements extending beyond boundaries (modifiers) are not clipped

## Cross-Mode Consistency

- [ ] Debug mode and non-debug mode render identically
- [ ] No visual regressions between modes
- [ ] All features visible in both modes

## Edge Cases

- [ ] First note in column (top) - octave marks not clipped
- [ ] Last note in column (bottom) - duration dots not clipped
- [ ] Notes with multiple modifiers (e.g., meri + octave + duration)
- [ ] Rest symbols render correctly

## Usage

Run through this checklist:
1. After making visual changes
2. Before creating PRs with visual modifications
3. When fixing visual bugs
4. When adjusting spacing/positioning parameters

Take before/after screenshots to verify fixes.
